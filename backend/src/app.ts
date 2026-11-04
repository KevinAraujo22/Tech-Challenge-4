import express, { NextFunction, Request, Response } from 'express';
import postRoutes from './routes/postRoutes';
import authRoutes from './routes/authRoutes';
import { teacherRoutes, studentRoutes } from './routes/peopleRoutes';
import { connectDb } from './db';

const app = express();

app.use(express.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Garante a conexão com o MongoDB antes das rotas de dados.
app.use(async (_req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB:', err);
    res.status(503).json({ message: 'Banco de dados indisponível' });
  }
});

app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/teachers', teacherRoutes);
app.use('/students', studentRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada' }));

// Erros não tratados viram JSON (o app mobile sempre espera { message }).
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido' });
  if (err?.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err?.code === 11000) return res.status(409).json({ message: 'Registro duplicado' });
  console.error(err);
  res.status(500).json({ message: 'Erro interno do servidor' });
});

export default app;
