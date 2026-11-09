import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { PASSWORD, clearDb, connect, createStudent, createTeacher, disconnect, loginAs } from './helpers';

beforeAll(connect);
afterAll(disconnect);

beforeEach(async () => {
  await clearDb();
  await createTeacher('login@escola.edu.br', 'Prof. Login');
  await createStudent('aluno.login@escola.edu.br', 'Aluno Login');
});

describe('POST /auth/login', () => {
  it('autentica um professor e devolve role "teacher"', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'LOGIN@escola.edu.br', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ email: 'login@escola.edu.br', name: 'Prof. Login', role: 'teacher' });
  });

  it('autentica um aluno e devolve role "student"', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'aluno.login@escola.edu.br', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('student');
  });

  it('retorna 400 sem senha', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'login@escola.edu.br' });
    expect(res.status).toBe(400);
  });

  it('retorna 401 para e-mail não cadastrado', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'naoexiste@escola.edu.br', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('retorna 401 para senha incorreta', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@escola.edu.br', password: 'errada' });
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('retorna o usuário do token', async () => {
    const res = await request(app).get('/auth/me').set(await loginAs('aluno.login@escola.edu.br'));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ name: 'Aluno Login', role: 'student' });
  });

  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /auth/register', () => {
  const body = { name: 'Nova Aluna', email: 'nova@escola.edu.br', password: PASSWORD };

  afterEach(() => {
    delete process.env.TEACHER_SIGNUP_CODE;
  });

  it('cadastra um aluno e já devolve o token', async () => {
    const res = await request(app).post('/auth/register').send(body);
    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.user).toMatchObject({ name: 'Nova Aluna', email: 'nova@escola.edu.br', role: 'student' });

    const login = await request(app).post('/auth/login').send({ email: body.email, password: PASSWORD });
    expect(login.body.user.role).toBe('student');
  });

  it('valida campos, e-mail e senha', async () => {
    expect((await request(app).post('/auth/register').send({ email: 'x@escola.edu.br' })).status).toBe(400);
    expect((await request(app).post('/auth/register').send({ ...body, email: 'invalido' })).status).toBe(400);
    expect((await request(app).post('/auth/register').send({ ...body, password: '123' })).status).toBe(400);
    expect((await request(app).post('/auth/register').send({ ...body, role: 'admin' })).status).toBe(400);
  });

  it('retorna 409 para e-mail já usado por professor ou aluno', async () => {
    expect((await request(app).post('/auth/register').send({ ...body, email: 'login@escola.edu.br' })).status).toBe(409);
    expect((await request(app).post('/auth/register').send({ ...body, email: 'aluno.login@escola.edu.br' })).status).toBe(409);
  });

  it('bloqueia cadastro de professor quando não há código configurado', async () => {
    const res = await request(app).post('/auth/register').send({ ...body, role: 'teacher', accessCode: 'qualquer' });
    expect(res.status).toBe(403);
  });

  it('exige o código de acesso correto para professor', async () => {
    process.env.TEACHER_SIGNUP_CODE = 'escola2026';
    const wrong = await request(app).post('/auth/register').send({ ...body, role: 'teacher', accessCode: 'errado' });
    expect(wrong.status).toBe(403);

    const ok = await request(app).post('/auth/register').send({ ...body, role: 'teacher', accessCode: 'escola2026' });
    expect(ok.status).toBe(201);
    expect(ok.body.user.role).toBe('teacher');

    const create = await request(app)
      .post('/posts')
      .set({ Authorization: `Bearer ${ok.body.token}` })
      .send({ title: 'T', content: 'C', author: 'A' });
    expect(create.status).toBe(201);
  });
});
