import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
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
