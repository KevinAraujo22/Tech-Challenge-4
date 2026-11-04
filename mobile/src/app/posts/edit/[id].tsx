import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { ErrorState, Loading } from '@/components/Feedback';
import { PostForm } from '@/components/PostForm';
import { useResource } from '@/hooks/useResource';
import { postsApi } from '@/services/api';

// Edição de postagem: carrega os dados atuais e salva as alterações.
export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, error, reload } = useResource(useCallback(() => postsApi.get(id), [id]));

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!post) return <Loading label="Carregando postagem…" />;

  return (
    <PostForm
      initial={{ title: post.title, content: post.content, author: post.author }}
      submitLabel="Salvar alterações"
      onSubmit={async (changes) => {
        await postsApi.update(post._id, changes);
        router.back();
      }}
    />
  );
}
