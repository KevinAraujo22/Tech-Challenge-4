import type { PeopleKind } from '@/types';

// Tudo que muda entre as telas de professores e de alunos fica aqui. As telas
// de listagem, criação e edição são as mesmas para os dois perfis.
export const PeopleConfig: Record<
  PeopleKind,
  {
    plural: string;
    singular: string;
    newTitle: string;
    editTitle: string;
    extraField: 'subject' | 'className';
    extraLabel: string;
    extraPlaceholder: string;
    icon: 'school-outline' | 'people-outline';
  }
> = {
  teachers: {
    plural: 'Professores',
    singular: 'professor',
    newTitle: 'Novo professor',
    editTitle: 'Editar professor',
    extraField: 'subject',
    extraLabel: 'Disciplina',
    extraPlaceholder: 'Ex.: Matemática',
    icon: 'school-outline',
  },
  students: {
    plural: 'Alunos',
    singular: 'aluno',
    newTitle: 'Novo aluno',
    editTitle: 'Editar aluno',
    extraField: 'className',
    extraLabel: 'Turma',
    extraPlaceholder: 'Ex.: 9º ano B',
    icon: 'people-outline',
  },
};

export const isPeopleKind = (value: unknown): value is PeopleKind =>
  value === 'teachers' || value === 'students';
