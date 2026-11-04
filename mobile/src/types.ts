export type Role = 'teacher' | 'student';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Post = {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PostInput = Pick<Post, 'title' | 'content' | 'author'>;

export type Comment = {
  _id: string;
  post: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  createdAt: string;
};

export type Person = {
  _id: string;
  name: string;
  email: string;
  subject?: string; // professores
  className?: string; // alunos
  createdAt?: string;
};

export type PersonInput = {
  name: string;
  email: string;
  password?: string;
  subject?: string;
  className?: string;
};

export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PeopleKind = 'teachers' | 'students';
