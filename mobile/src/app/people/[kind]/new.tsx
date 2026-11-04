import { router, Stack, useLocalSearchParams } from 'expo-router';

import { EmptyState } from '@/components/Feedback';
import { PersonForm } from '@/components/PersonForm';
import { isPeopleKind, PeopleConfig } from '@/constants/people';
import { peopleApi } from '@/services/api';

// Cadastro de professor (/people/teachers/new) ou aluno (/people/students/new).
export default function NewPersonScreen() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  if (!isPeopleKind(kind)) return <EmptyState icon="help-circle-outline" title="Página não encontrada" />;

  const config = PeopleConfig[kind];
  return (
    <>
      <Stack.Screen options={{ title: config.newTitle }} />
      <PersonForm
        kind={kind}
        initial={{ name: '', email: '' }}
        submitLabel="Cadastrar"
        onSubmit={async (person) => {
          await peopleApi(kind).create(person);
          router.back();
        }}
      />
    </>
  );
}
