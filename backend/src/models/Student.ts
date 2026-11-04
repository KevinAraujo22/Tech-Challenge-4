import mongoose, { Schema, Document } from 'mongoose';
import { hidePasswordHash } from './hidePasswordHash';

export interface IStudent extends Document {
  name: string;
  email: string;
  passwordHash: string;
  className?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    // Turma do aluno (opcional), ex.: "9º ano B".
    className: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { transform: hidePasswordHash } }
);

export default mongoose.model<IStudent>('Student', StudentSchema);
