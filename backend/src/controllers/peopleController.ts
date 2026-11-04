import { Response } from 'express';
import bcrypt from 'bcryptjs';
import mongoose, { Model } from 'mongoose';
import Professor from '../models/Professor';
import Student from '../models/Student';
import { AuthRequest } from '../middleware/auth';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 6;
const MAX_LIMIT = 50;

const isValidId = (id: string | string[]) => mongoose.Types.ObjectId.isValid(id as string);
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// O e-mail é o login, então precisa ser único entre professores E alunos.
async function emailInUse(email: string, exceptId?: string) {
  const filter = exceptId ? { email, _id: { $ne: exceptId } } : { email };
  const [professor, student] = await Promise.all([
    Professor.exists(filter),
    Student.exists(filter),
  ]);
  return Boolean(professor || student);
}

type PeopleOptions = {
  label: string; // usado nas mensagens: "Professor", "Aluno"
  extraField: 'subject' | 'className';
  // Impede que um professor exclua a própria conta (evita ficar sem acesso).
  blockSelfDelete?: boolean;
};

// Professores e alunos têm o mesmo CRUD (com listagem paginada); só muda o
// modelo e um campo extra. Esta fábrica gera os handlers para cada um.
export function makePeopleController(PersonModel: Model<any>, options: PeopleOptions) {
  const { label, extraField } = options;
  const notFound = { message: `${label} não encontrado` };

  const list = async (req: AuthRequest, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10));
    const q = String(req.query.q ?? '').trim();

    const filter = q
      ? { $or: [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { email: { $regex: escapeRegex(q), $options: 'i' } }] }
      : {};

    const [items, total] = await Promise.all([
      PersonModel.find(filter).sort({ name: 1 }).skip((page - 1) * limit).limit(limit),
      PersonModel.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });
  };

  const get = async (req: AuthRequest, res: Response) => {
    if (!isValidId(req.params.id)) return res.status(404).json(notFound);
    const person = await PersonModel.findById(req.params.id);
    if (!person) return res.status(404).json(notFound);
    res.json(person);
  };

  const create = async (req: AuthRequest, res: Response) => {
    const { name, email, password } = req.body ?? {};
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email e password são obrigatórios' });
    if (!EMAIL_RE.test(String(email)))
      return res.status(400).json({ message: 'E-mail inválido' });
    if (String(password).length < MIN_PASSWORD)
      return res.status(400).json({ message: `A senha deve ter ao menos ${MIN_PASSWORD} caracteres` });

    const normalized = String(email).toLowerCase().trim();
    if (await emailInUse(normalized))
      return res.status(409).json({ message: 'Este e-mail já está cadastrado' });

    const person = await PersonModel.create({
      name: String(name).trim(),
      email: normalized,
      passwordHash: await bcrypt.hash(String(password), 10),
      [extraField]: req.body[extraField] ? String(req.body[extraField]).trim() : undefined,
    });
    res.status(201).json(person);
  };

  const update = async (req: AuthRequest, res: Response) => {
    if (!isValidId(req.params.id)) return res.status(404).json(notFound);
    const person = await PersonModel.findById(req.params.id);
    if (!person) return res.status(404).json(notFound);

    const { name, email, password } = req.body ?? {};
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ message: 'O nome não pode ficar vazio' });
      person.name = String(name).trim();
    }
    if (email !== undefined) {
      const normalized = String(email).toLowerCase().trim();
      if (!EMAIL_RE.test(normalized)) return res.status(400).json({ message: 'E-mail inválido' });
      if (await emailInUse(normalized, person.id))
        return res.status(409).json({ message: 'Este e-mail já está cadastrado' });
      person.email = normalized;
    }
    // Senha é opcional na edição: vazia mantém a atual.
    if (password) {
      if (String(password).length < MIN_PASSWORD)
        return res.status(400).json({ message: `A senha deve ter ao menos ${MIN_PASSWORD} caracteres` });
      person.passwordHash = await bcrypt.hash(String(password), 10);
    }
    if (req.body?.[extraField] !== undefined) person[extraField] = String(req.body[extraField]).trim();

    await person.save();
    res.json(person);
  };

  const remove = async (req: AuthRequest, res: Response) => {
    if (!isValidId(req.params.id)) return res.status(404).json(notFound);
    if (options.blockSelfDelete && req.user?.id === req.params.id)
      return res.status(400).json({ message: 'Você não pode excluir a sua própria conta' });

    const person = await PersonModel.findByIdAndDelete(req.params.id);
    if (!person) return res.status(404).json(notFound);
    res.status(204).send();
  };

  return { list, get, create, update, remove };
}

export const teachersController = makePeopleController(Professor, {
  label: 'Professor',
  extraField: 'subject',
  blockSelfDelete: true,
});

export const studentsController = makePeopleController(Student, {
  label: 'Aluno',
  extraField: 'className',
});
