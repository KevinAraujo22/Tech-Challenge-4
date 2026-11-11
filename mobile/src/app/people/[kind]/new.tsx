import { router, Stack, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/Feedback';
import { PersonForm } from '@/components/PersonForm';
import { isPeopleKind, PeopleConfig } from '@/constants/people';
import { useAuth } from '@/context/AuthContext';
import { peopleApi } from '@/services/api';

// Cadastro de professor (/people/teachers/new) ou aluno (/people/students/new).
export default function NewPersonScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const { isAdmin } = useAuth();
  if (!isPeopleKind(kind)) return <EmptyState icon="help-circle-outline" title="Página não encontrada" />;
  // A API também bloqueia (403); aqui só evitamos mostrar um formulário inútil.
  if (kind === 'teachers' && !isAdmin)
    return <EmptyState icon="lock-closed-outline" title="Apenas o administrador cadastra professores" />;

  const config = PeopleConfig[kind];
  return (
    <>
      <Stack.Screen options={{ title: config.newTitle }} />
      <PersonForm
        kind={kind}
        initial={{ name: '', email: '' }}
        showAdminToggle={kind === 'teachers'}
        submitLabel="Cadastrar"
        onSubmit={async (person) => {
          await peopleApi(kind).create(person);
          router.back();
        }}
      />
    </>
  );
}
