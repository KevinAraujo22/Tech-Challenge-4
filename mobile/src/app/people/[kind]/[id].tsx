import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { EmptyState, ErrorState, Loading } from '@/components/Feedback';
import { PersonForm } from '@/components/PersonForm';
import { isPeopleKind, PeopleConfig } from '@/constants/people';
import { useResource } from '@/hooks/useResource';
import { peopleApi } from '@/services/api';
import type { Person } from '@/types';

// Edição de professor (/people/teachers/:id) ou aluno (/people/students/:id).
export default function EditPersonScreen() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();
  const { data: person, error, reload } = useResource(
    useCallback(
      (): Promise<Person | null> => (isPeopleKind(kind) ? peopleApi(kind).get(id) : Promise.resolve(null)),
      [kind, id]
    )
  );

  if (!isPeopleKind(kind)) return <EmptyState icon="help-circle-outline" title="Página não encontrada" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!person) return <Loading />;

  return (
    <>
      <Stack.Screen options={{ title: PeopleConfig[kind].editTitle }} />
      <PersonForm
        kind={kind}
        isEdit
        initial={{ name: person.name, email: person.email, subject: person.subject, className: person.className }}
        submitLabel="Salvar alterações"
        onSubmit={async (changes) => {
          await peopleApi(kind).update(person._id, changes);
          router.back();
        }}
      />
    </>
  );
}
