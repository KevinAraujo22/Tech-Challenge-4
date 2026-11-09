import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import Professor from '../models/Professor';
import Student from '../models/Student';
import { AuthRequest, AuthUser, Role, signToken } from '../middleware/auth';
import { EMAIL_RE, MIN_PASSWORD, emailInUse } from './peopleController';

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

// Cadastro público pela tela do app. Aluno se cadastra livremente; professor
// precisa do código de acesso da escola (TEACHER_SIGNUP_CODE). Sem esse código
// configurado, o cadastro de professores fica restrito aos próprios professores
// (POST /teachers), para que um aluno não consiga se promover a professor.
export const register = async (req: Request, res: Response) => {
  const { name, email, password, role = 'student', accessCode } = req.body ?? {};
  if (role !== 'student' && role !== 'teacher')
    return res.status(400).json({ message: 'Perfil inválido' });
  if (!name || !String(name).trim() || !email || !password)
    return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios' });
  if (!EMAIL_RE.test(String(email)))
    return res.status(400).json({ message: 'E-mail inválido' });
  if (String(password).length < MIN_PASSWORD)
    return res.status(400).json({ message: `A senha deve ter ao menos ${MIN_PASSWORD} caracteres` });

  if (role === 'teacher') {
    const signupCode = process.env.TEACHER_SIGNUP_CODE;
    if (!signupCode)
      return res.status(403).json({ message: 'O cadastro de professores pelo app está desativado. Peça a um professor para cadastrar você.' });
    if (String(accessCode ?? '').trim() !== signupCode)
      return res.status(403).json({ message: 'Código de acesso da escola inválido' });
  }

  const normalized = String(email).toLowerCase().trim();
  if (await emailInUse(normalized))
    return res.status(409).json({ message: 'Este e-mail já está cadastrado' });

  const Model = role === 'teacher' ? Professor : Student;
  const account = await (Model as typeof Professor).create({
    name: String(name).trim(),
    email: normalized,
    passwordHash: await bcrypt.hash(String(password), 10),
  });

  const user: AuthUser = { id: account.id, email: account.email, name: account.name, role: role as Role };
  res.status(201).json({ token: signToken(user), user });
};

export const me = async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
};
