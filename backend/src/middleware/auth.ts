import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Professor from '../models/Professor';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-troque-em-producao';

export type Role = 'teacher' | 'student';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  isAdmin?: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  // Preenchido por loadAdmin a partir do banco (não confiamos no token para isso).
  isAdmin?: boolean;
}

export const signToken = (user: AuthUser) => jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Autenticação necessária' });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = { id: payload.id, email: payload.email, name: payload.name, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Sessão inválida ou expirada' });
  }
};

// Apenas professores podem criar/editar/excluir posts e administrar usuários.
// Alunos autenticados recebem 403: estão logados, mas sem permissão.
export const requireTeacher = [
  requireAuth,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'teacher')
      return res.status(403).json({ message: 'Apenas professores podem realizar esta ação' });
    next();
  },
];

// Consulta no banco se o professor logado é administrador. Assim, promover ou
// rebaixar alguém vale na hora, sem depender de um token antigo.
export const loadAdmin = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const professor = await Professor.findById(req.user?.id).select('isAdmin');
  req.isAdmin = Boolean(professor?.isAdmin);
  next();
};

// Só o administrador gerencia outros professores.
export const requireAdmin = [
  loadAdmin,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.isAdmin)
      return res.status(403).json({ message: 'Apenas o administrador pode gerenciar professores' });
    next();
  },
];

// Professor comum pode editar apenas a própria conta; o administrador, qualquer uma.
export const requireAdminOrSelf = [
  loadAdmin,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.isAdmin && req.user?.id !== req.params.id)
      return res.status(403).json({ message: 'Você só pode editar a sua própria conta' });
    next();
  },
];
