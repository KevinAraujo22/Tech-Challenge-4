import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import request from 'supertest';
import app from '../src/app';
import Professor from '../src/models/Professor';
import Student from '../src/models/Student';
import Post from '../src/models/Post';
import Comment from '../src/models/Comment';

dotenv.config({ path: '.env.test' });

export const PASSWORD = 'segredo123';

export async function connect() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog_test');
}

export async function clearDb() {
  await Promise.all([
    Professor.deleteMany({}),
    Student.deleteMany({}),
    Post.deleteMany({}),
    Comment.deleteMany({}),
  ]);
}

export async function disconnect() {
  await clearDb();
  await mongoose.connection.close();
}

export async function createTeacher(email = 'prof@escola.edu.br', name = 'Prof. Silva') {
  return Professor.create({ name, email, passwordHash: await bcrypt.hash(PASSWORD, 10) });
}

export async function createStudent(email = 'aluno@escola.edu.br', name = 'Ana Aluna') {
  return Student.create({ name, email, passwordHash: await bcrypt.hash(PASSWORD, 10) });
}

export async function loginAs(email: string) {
  const res = await request(app).post('/auth/login').send({ email, password: PASSWORD });
  return { Authorization: `Bearer ${res.body.token}` };
}
