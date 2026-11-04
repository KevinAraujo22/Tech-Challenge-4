import mongoose from 'mongoose';

// Conexão reutilizável entre invocações (necessário em ambiente serverless
// como a Vercel, onde a mesma instância atende vários requests).
let cached: Promise<typeof mongoose> | null = null;

export function connectDb() {
  if (mongoose.connection.readyState === 1) return Promise.resolve(mongoose);
  if (!cached) {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog';
    cached = mongoose.connect(uri).catch((err) => {
      cached = null; // permite nova tentativa no próximo request
      throw err;
    });
  }
  return cached;
}
