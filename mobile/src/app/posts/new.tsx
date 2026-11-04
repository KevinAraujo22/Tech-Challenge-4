import { router } from 'expo-router';

import { PostForm } from '@/components/PostForm';
import { useAuth } from '@/context/AuthContext';
import { postsApi } from '@/services/api';

// Criação de postagem (somente professores). O autor já vem preenchido.
export default function NewPostScreen() {
  const { user } = useAuth();

  return (
    <PostForm
      initial={{ title: '', content: '', author: user?.name ?? '' }}
      submitLabel="Publicar"
      onSubmit={async (post) => {
        const created = await postsApi.create(post);
        router.replace(`/posts/${created._id}`);
      }}
    />
  );
}
