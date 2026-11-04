import mongoose, { Schema, Document, Types } from 'mongoose';
import { Role } from '../middleware/auth';

export interface IComment extends Document {
  post: Types.ObjectId;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    content: { type: String, required: true, trim: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, enum: ['teacher', 'student'], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IComment>('Comment', CommentSchema);
