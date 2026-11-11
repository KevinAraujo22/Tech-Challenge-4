import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { connectDb } from './db';
import { ensureAdmin, ensureDefaultTeacher, seedDemoData } from './seed';

const PORT = process.env.PORT || 3000;

connectDb()
  .then(async () => {
    console.log('Conectado ao MongoDB');
    if (process.env.SEED_DEMO_DATA === 'true') await seedDemoData();
    else await ensureDefaultTeacher();
    await ensureAdmin();
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => {
    console.error('Erro ao conectar ao MongoDB:', err);
    process.exit(1);
  });
