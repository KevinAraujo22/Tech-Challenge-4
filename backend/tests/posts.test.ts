import { afterAll, afterEach, beforeAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import Post from '../src/models/Post';
import Comment from '../src/models/Comment';
import { clearDb, connect, createStudent, createTeacher, disconnect, loginAs } from './helpers';

let teacher: Record<string, string> = {};
let student: Record<string, string> = {};

beforeAll(async () => {
  await connect();
  await clearDb();
  await createTeacher('prof.posts@escola.edu.br');
  await createStudent('aluno.posts@escola.edu.br');
  teacher = await loginAs('prof.posts@escola.edu.br');
  student = await loginAs('aluno.posts@escola.edu.br');
});

afterEach(async () => {
  await Post.deleteMany({});
  await Comment.deleteMany({});
});

afterAll(disconnect);

const newPost = { title: 'Título teste', content: 'Conteúdo teste', author: 'Professor Silva' };

describe('POST /posts', () => {
  it('cria um post quando autenticado como professor', async () => {
    const res = await request(app).post('/posts').set(teacher).send(newPost);
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Título teste');
  });

  it('retorna 400 se faltar campo obrigatório', async () => {
    const res = await request(app).post('/posts').set(teacher).send({ title: 'Só título' });
    expect(res.status).toBe(400);
  });

  it('retorna 401 sem token de autenticação', async () => {
    const res = await request(app).post('/posts').send(newPost);
    expect(res.status).toBe(401);
  });

  it('retorna 403 para aluno (alunos apenas visualizam)', async () => {
    const res = await request(app).post('/posts').set(student).send(newPost);
    expect(res.status).toBe(403);
  });
});

describe('GET /posts', () => {
  it('retorna lista de posts sem exigir autenticação', async () => {
    await Post.create({ title: 'Post A', content: 'Conteúdo A', author: 'Autor A' });
    const res = await request(app).get('/posts');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

describe('GET /posts/:id', () => {
  it('retorna um post pelo id', async () => {
    const post = await Post.create({ title: 'Post B', content: 'Conteúdo B', author: 'Autor B' });
    const res = await request(app).get(`/posts/${post._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Post B');
  });

  it('retorna 404 para id inexistente', async () => {
    const res = await request(app).get('/posts/000000000000000000000000');
    expect(res.status).toBe(404);
  });
});

describe('PUT /posts/:id', () => {
  it('atualiza um post quando autenticado como professor', async () => {
    const post = await Post.create({ title: 'Antigo', content: 'Conteúdo', author: 'Autor' });
    const res = await request(app).put(`/posts/${post._id}`).set(teacher).send({ title: 'Novo título' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Novo título');
    expect(res.body.content).toBe('Conteúdo');
  });

  it('retorna 401 sem token', async () => {
    const post = await Post.create({ title: 'Antigo', content: 'Conteúdo', author: 'Autor' });
    const res = await request(app).put(`/posts/${post._id}`).send({ title: 'X' });
    expect(res.status).toBe(401);
  });

  it('retorna 403 para aluno', async () => {
    const post = await Post.create({ title: 'Antigo', content: 'Conteúdo', author: 'Autor' });
    const res = await request(app).put(`/posts/${post._id}`).set(student).send({ title: 'X' });
    expect(res.status).toBe(403);
  });
});

describe('DELETE /posts/:id', () => {
  it('deleta um post e seus comentários quando autenticado como professor', async () => {
    const post = await Post.create({ title: 'Deletar', content: 'Conteúdo', author: 'Autor' });
    await request(app).post(`/posts/${post._id}/comments`).set(student).send({ content: 'Oi' });
    const res = await request(app).delete(`/posts/${post._id}`).set(teacher);
    expect(res.status).toBe(204);
    expect(await Comment.countDocuments({ post: post._id })).toBe(0);
  });

  it('retorna 401 sem token', async () => {
    const post = await Post.create({ title: 'Deletar', content: 'Conteúdo', author: 'Autor' });
    const res = await request(app).delete(`/posts/${post._id}`);
    expect(res.status).toBe(401);
  });

  it('retorna 403 para aluno', async () => {
    const post = await Post.create({ title: 'Deletar', content: 'Conteúdo', author: 'Autor' });
    const res = await request(app).delete(`/posts/${post._id}`).set(student);
    expect(res.status).toBe(403);
  });
});

describe('GET /posts/search', () => {
  it('busca posts por palavra-chave no título', async () => {
    await Post.create({ title: 'Matemática avançada', content: 'Conteúdo', author: 'Autor' });
    await Post.create({ title: 'História do Brasil', content: 'Conteúdo', author: 'Autor' });
    const res = await request(app).get('/posts/search?q=matemática');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('busca também pelo autor', async () => {
    await Post.create({ title: 'Aula 1', content: 'Conteúdo', author: 'Maria Souza' });
    await Post.create({ title: 'Aula 2', content: 'Conteúdo', author: 'João Lima' });
    const res = await request(app).get('/posts/search?q=souza');
    expect(res.body.length).toBe(1);
  });

  it('trata caracteres especiais como texto literal', async () => {
    await Post.create({ title: 'C++ para iniciantes', content: 'Conteúdo', author: 'Autor' });
    const res = await request(app).get(`/posts/search?q=${encodeURIComponent('c++')}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('retorna 400 sem parâmetro q', async () => {
    const res = await request(app).get('/posts/search');
    expect(res.status).toBe(400);
  });
});

describe('Comentários', () => {
  it('aluno comenta e qualquer um lê os comentários', async () => {
    const post = await Post.create({ title: 'Com comentários', content: 'Conteúdo', author: 'Autor' });
    const created = await request(app)
      .post(`/posts/${post._id}/comments`)
      .set(student)
      .send({ content: 'Ótimo conteúdo!' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ authorName: 'Ana Aluna', authorRole: 'student' });

    const list = await request(app).get(`/posts/${post._id}/comments`);
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
  });

  it('retorna 401 ao comentar sem login e 400 para comentário vazio', async () => {
    const post = await Post.create({ title: 'P', content: 'C', author: 'A' });
    expect((await request(app).post(`/posts/${post._id}/comments`).send({ content: 'x' })).status).toBe(401);
    expect((await request(app).post(`/posts/${post._id}/comments`).set(student).send({ content: ' ' })).status).toBe(400);
  });

  it('aluno não exclui comentário de outra pessoa, professor pode moderar', async () => {
    const post = await Post.create({ title: 'P', content: 'C', author: 'A' });
    const comment = await request(app)
      .post(`/posts/${post._id}/comments`)
      .set(teacher)
      .send({ content: 'Comentário do professor' });

    const byStudent = await request(app).delete(`/posts/${post._id}/comments/${comment.body._id}`).set(student);
    expect(byStudent.status).toBe(403);

    const own = await request(app).post(`/posts/${post._id}/comments`).set(student).send({ content: 'Meu' });
    expect((await request(app).delete(`/posts/${post._id}/comments/${own.body._id}`).set(student)).status).toBe(204);
    expect((await request(app).delete(`/posts/${post._id}/comments/${comment.body._id}`).set(teacher)).status).toBe(204);
  });
});
