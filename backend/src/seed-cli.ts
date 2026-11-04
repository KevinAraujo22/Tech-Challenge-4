import dotenv from 'dotenv';

dotenv.config();

import mongoose from 'mongoose';
import { connectDb } from './db';
import { seedDemoData } from './seed';

// `npm run seed`: popula o banco com professor, aluno e posts de demonstração.
connectDb()
  .then(seedDemoData)
  .then(() => mongoose.connection.close())
  .catch((err) => {
    console.error('Erro ao popular o banco:', err);
    process.exit(1);
  });
