import bcrypt from 'bcryptjs';
import Professor from './models/Professor';
import Student from './models/Student';
import Post from './models/Post';

// Sem o cadastro público da Fase 3, o primeiro professor precisa existir para
// que alguém consiga entrar no app. Ele é criado na subida do servidor caso a
// coleção esteja vazia, com credenciais configuráveis por variável de ambiente.
export async function ensureDefaultTeacher() {
  if (await Professor.exists({})) return;

  const email = (process.env.DEFAULT_TEACHER_EMAIL || 'professor@escola.com').toLowerCase();
  const password = process.env.DEFAULT_TEACHER_PASSWORD || 'professor123';
  await Professor.create({
    name: process.env.DEFAULT_TEACHER_NAME || 'Professor Administrador',
    email,
    passwordHash: await bcrypt.hash(password, 10),
    subject: 'Coordenação',
    isAdmin: true,
  });
  console.log(`Professor padrão criado: ${email}`);
}

// Garante que exista um administrador. Em bancos criados antes desse perfil,
// o professor mais antigo (o professor padrão) é promovido.
export async function ensureAdmin() {
  if (await Professor.exists({ isAdmin: true })) return;
  const oldest = await Professor.findOne().sort({ createdAt: 1 });
  if (!oldest) return;
  oldest.isAdmin = true;
  await oldest.save();
  console.log(`Professor administrador: ${oldest.email}`);
}

// Dados de demonstração (aluno + posts), usados pelo `npm run seed`.
export async function seedDemoData() {
  await ensureDefaultTeacher();

  if (!(await Student.exists({ email: 'aluno@escola.com' }))) {
    await Student.create({
      name: 'Aluno Demonstração',
      email: 'aluno@escola.com',
      passwordHash: await bcrypt.hash('aluno123', 10),
      className: '9º ano A',
    });
    console.log('Aluno de demonstração criado: aluno@escola.com');
  }

  if (!(await Post.exists({}))) {
    await Post.insertMany([
      {
        title: 'Boas-vindas ao Blog da Escola',
        author: 'Professor Administrador',
        content:
          'Este é o espaço para professores compartilharem materiais, avisos e conteúdos com os alunos. ' +
          'Use a busca para encontrar posts por palavra-chave e deixe seus comentários!',
      },
      {
        title: 'Frações no dia a dia',
        author: 'Professor Administrador',
        content:
          'Dividir uma pizza, medir ingredientes de uma receita ou calcular descontos: as frações estão ' +
          'em toda parte. Nesta semana vamos praticar com exemplos do cotidiano.',
      },
      {
        title: 'Feira de Ciências 2026',
        author: 'Professor Administrador',
        content:
          'As inscrições para a Feira de Ciências estão abertas. Formem grupos de até quatro alunos e ' +
          'enviem a proposta do projeto até o fim do mês.',
      },
    ]);
    console.log('Posts de demonstração criados');
  }
}
