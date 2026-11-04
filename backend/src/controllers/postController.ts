import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Post from '../models/Post';
import Comment from '../models/Comment';
import { AuthRequest } from '../middleware/auth';

const isValidId = (id: string | string[]) => mongoose.Types.ObjectId.isValid(id as string);
const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const notFound = { message: 'Post não encontrado' };

export const listPosts = async (_req: Request, res: Response) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.json(posts);
};

export const getPostById = async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) return res.status(404).json(notFound);

  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json(notFound);
  res.json(post);
};

export const createPost = async (req: Request, res: Response) => {
  const { title, content, author } = req.body ?? {};
  if (!title || !content || !author)
    return res.status(400).json({ message: 'title, content e author são obrigatórios' });

  const post = await Post.create({ title, content, author });
  res.status(201).json(post);
};

export const updatePost = async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) return res.status(404).json(notFound);

  // Só os campos editáveis do post são aceitos do corpo da requisição.
  const { title, content, author } = req.body ?? {};
  const changes = Object.fromEntries(
    Object.entries({ title, content, author }).filter(([, value]) => value !== undefined)
  );

  const post = await Post.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
  if (!post) return res.status(404).json(notFound);
  res.json(post);
};

export const deletePost = async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) return res.status(404).json(notFound);

  const post = await Post.findByIdAndDelete(req.params.id);
  if (!post) return res.status(404).json(notFound);
  await Comment.deleteMany({ post: post._id });
  res.status(204).send();
};

export const searchPosts = async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim();
  if (!q) return res.status(400).json({ message: 'Parâmetro de busca "q" é obrigatório' });

  const pattern = { $regex: escapeRegex(q), $options: 'i' };
  const posts = await Post.find({
    $or: [{ title: pattern }, { content: pattern }, { author: pattern }],
  }).sort({ createdAt: -1 });

  res.json(posts);
};

export const listComments = async (req: Request, res: Response) => {
  if (!isValidId(req.params.id)) return res.status(404).json(notFound);
  const comments = await Comment.find({ post: req.params.id }).sort({ createdAt: 1 });
  res.json(comments);
};

// Professores e alunos autenticados podem comentar.
export const createComment = async (req: AuthRequest, res: Response) => {
  if (!isValidId(req.params.id) || !(await Post.exists({ _id: req.params.id })))
    return res.status(404).json(notFound);

  const content = String(req.body?.content ?? '').trim();
  if (!content) return res.status(400).json({ message: 'O comentário não pode ficar vazio' });

  const comment = await Comment.create({
    post: req.params.id,
    content,
    authorId: req.user!.id,
    authorName: req.user!.name,
    authorRole: req.user!.role,
  });
  res.status(201).json(comment);
};

// O autor do comentário pode apagá-lo; professores podem moderar qualquer um.
export const deleteComment = async (req: AuthRequest, res: Response) => {
  if (!isValidId(req.params.commentId))
    return res.status(404).json({ message: 'Comentário não encontrado' });

  const comment = await Comment.findOne({ _id: req.params.commentId, post: req.params.id });
  if (!comment) return res.status(404).json({ message: 'Comentário não encontrado' });
  if (req.user!.role !== 'teacher' && comment.authorId !== req.user!.id)
    return res.status(403).json({ message: 'Você só pode excluir os seus comentários' });

  await comment.deleteOne();
  res.status(204).send();
};
