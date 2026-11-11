import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import Professor from '../src/models/Professor';
import Student from '../src/models/Student';
import { PASSWORD, clearDb, connect, createStudent, createTeacher, disconnect, loginAs } from './helpers';

let teacher: Record<string, string> = {};
let student: Record<string, string> = {};
let teacherId = '';

beforeAll(connect);
afterAll(disconnect);

beforeEach(async () => {
  await clearDb();
  teacherId = (await createTeacher('admin@escola.edu.br', 'Admin', true)).id;
  await createStudent('aluno@escola.edu.br');
  teacher = await loginAs('admin@escola.edu.br');
  student = await loginAs('aluno@escola.edu.br');
});

// Professores e alunos compartilham o mesmo CRUD; a suíte roda para os dois.
describe.each([
  { path: '/teachers', Model: Professor, extra: { subject: 'Matemática' } },
  { path: '/students', Model: Student, extra: { className: '8º ano B' } },
])('$path', ({ path, Model, extra }) => {
  const body = { name: 'Nova Pessoa', email: 'nova@escola.edu.br', password: PASSWORD, ...extra };

  it('cria, sem expor o hash da senha', async () => {
    const res = await request(app).post(path).set(teacher).send(body);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'Nova Pessoa', email: 'nova@escola.edu.br', ...extra });
    expect(res.body.passwordHash).toBeUndefined();

    const login = await request(app).post('/auth/login').send({ email: body.email, password: PASSWORD });
    expect(login.status).toBe(200);
  });

  it('valida campos obrigatórios, e-mail e senha', async () => {
    expect((await request(app).post(path).set(teacher).send({ name: 'X' })).status).toBe(400);
    expect((await request(app).post(path).set(teacher).send({ ...body, email: 'invalido' })).status).toBe(400);
    expect((await request(app).post(path).set(teacher).send({ ...body, password: '123' })).status).toBe(400);
  });

  it('retorna 409 para e-mail já usado por professor ou aluno', async () => {
    expect((await request(app).post(path).set(teacher).send({ ...body, email: 'admin@escola.edu.br' })).status).toBe(409);
    expect((await request(app).post(path).set(teacher).send({ ...body, email: 'aluno@escola.edu.br' })).status).toBe(409);
  });

  it('lista com paginação', async () => {
    for (let i = 1; i <= 12; i++)
      await request(app).post(path).set(teacher).send({ ...body, name: `Pessoa ${String(i).padStart(2, '0')}`, email: `p${i}@escola.edu.br` });

    const total = await Model.countDocuments();
    const page2 = await request(app).get(`${path}?page=2&limit=5`).set(teacher);
    expect(page2.status).toBe(200);
    expect(page2.body).toMatchObject({ page: 2, limit: 5, total, totalPages: Math.ceil(total / 5) });
    expect(page2.body.items).toHaveLength(5);
  });

  it('busca por nome', async () => {
    await request(app).post(path).set(teacher).send(body);
    const res = await request(app).get(`${path}?q=nova`).set(teacher);
    expect(res.body.items).toHaveLength(1);
  });

  it('carrega e edita mantendo a senha quando ela não é enviada', async () => {
    const created = await request(app).post(path).set(teacher).send(body);
    const id = created.body._id;

    const loaded = await request(app).get(`${path}/${id}`).set(teacher);
    expect(loaded.body.name).toBe('Nova Pessoa');

    const updated = await request(app).put(`${path}/${id}`).set(teacher).send({ name: 'Nome Editado', password: '' });
    expect(updated.status).toBe(200);
    expect(updated.body.name).toBe('Nome Editado');
    expect((await request(app).post('/auth/login').send({ email: body.email, password: PASSWORD })).status).toBe(200);
  });

  it('exclui', async () => {
    const created = await request(app).post(path).set(teacher).send(body);
    expect((await request(app).delete(`${path}/${created.body._id}`).set(teacher)).status).toBe(204);
    expect((await request(app).get(`${path}/${created.body._id}`).set(teacher)).status).toBe(404);
  });

  it('bloqueia alunos (403) e visitantes (401)', async () => {
    expect((await request(app).get(path).set(student)).status).toBe(403);
    expect((await request(app).post(path).set(student).send(body)).status).toBe(403);
    expect((await request(app).get(path)).status).toBe(401);
  });
});

it('professor não pode excluir a própria conta', async () => {
  const res = await request(app).delete(`/teachers/${teacherId}`).set(teacher);
  expect(res.status).toBe(400);
});

describe('Professor comum x administrador', () => {
  let common: Record<string, string> = {};
  let commonId = '';

  beforeEach(async () => {
    commonId = (await createTeacher('comum@escola.edu.br', 'Prof. Comum')).id;
    common = await loadToken('comum@escola.edu.br');
  });

  const loadToken = (email: string) => loginAs(email);
  const newTeacher = { name: 'Outro', email: 'outro@escola.edu.br', password: PASSWORD };

  it('professor comum vê a lista de professores', async () => {
    const res = await request(app).get('/teachers').set(common);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
  });

  it('professor comum não cria, não edita outro e não exclui professores', async () => {
    expect((await request(app).post('/teachers').set(common).send(newTeacher)).status).toBe(403);
    expect((await request(app).put(`/teachers/${teacherId}`).set(common).send({ name: 'Hack' })).status).toBe(403);
    expect((await request(app).delete(`/teachers/${teacherId}`).set(common)).status).toBe(403);
    const admin = await Professor.findById(teacherId);
    expect(admin!.name).toBe('Admin');
  });

  it('professor comum edita a própria conta, mas não se torna administrador', async () => {
    const own = await request(app).put(`/teachers/${commonId}`).set(common).send({ subject: 'Física' });
    expect(own.status).toBe(200);
    expect(own.body.subject).toBe('Física');

    const promote = await request(app).put(`/teachers/${commonId}`).set(common).send({ isAdmin: true });
    expect(promote.status).toBe(403);
  });

  it('professor comum continua gerenciando alunos', async () => {
    const res = await request(app)
      .post('/students')
      .set(common)
      .send({ name: 'Aluno Novo', email: 'aluno.novo@escola.edu.br', password: PASSWORD });
    expect(res.status).toBe(201);
  });

  it('administrador promove um professor e a permissão vale na hora', async () => {
    const promote = await request(app).put(`/teachers/${commonId}`).set(teacher).send({ isAdmin: true });
    expect(promote.status).toBe(200);
    expect(promote.body.isAdmin).toBe(true);

    // Mesmo token de antes: a API consulta o banco, não o token.
    expect((await request(app).post('/teachers').set(common).send(newTeacher)).status).toBe(201);
    const me = await request(app).get('/auth/me').set(common);
    expect(me.body.user.isAdmin).toBe(true);
  });

  it('administrador não altera o próprio perfil de administrador', async () => {
    const res = await request(app).put(`/teachers/${teacherId}`).set(teacher).send({ isAdmin: false });
    expect(res.status).toBe(400);
  });
});
