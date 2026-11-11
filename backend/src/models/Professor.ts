import mongoose, { Schema, Document } from 'mongoose';
import { hidePasswordHash } from './hidePasswordHash';

export interface IProfessor extends Document {
  name: string;
  email: string;
  passwordHash: string;
  subject?: string;
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProfessorSchema = new Schema<IProfessor>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Disciplina que o professor leciona (opcional).
    subject: { type: String, trim: true },
    // Administrador: único perfil que cria, edita e exclui outros professores.
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { transform: hidePasswordHash } }
);

export default mongoose.model<IProfessor>('Professor', ProfessorSchema);
