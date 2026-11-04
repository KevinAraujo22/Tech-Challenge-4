import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Professor from '../models/Professor';
import Student from '../models/Student';
import { AuthRequest, AuthUser, signToken } from '../middleware/auth';

// Login único para professores e alunos: o papel (role) vai dentro do JWT e é
// ele que o app e o middleware usam para liberar ou bloquear ações.
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password)
    return res.status(400).json({ message: 'email e password são obrigatórios' });

  const normalized = String(email).toLowerCase().trim();
  const professor = await Professor.findOne({ email: normalized });
  const student = professor ? null : await Student.findOne({ email: normalized });
  const account = professor ?? student;
  if (!account) return res.status(401).json({ message: 'E-mail ou senha inválidos' });

  const ok = await bcrypt.compare(String(password), account.passwordHash);
  if (!ok) return res.status(401).json({ message: 'E-mail ou senha inválidos' });

  const user: AuthUser = {
    id: account.id,
    email: account.email,
    name: account.name,
    role: professor ? 'teacher' : 'student',
  };
  res.json({ token: signToken(user), user });
};

export const me = async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
};
