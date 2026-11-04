import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { postsApi } from '@/services/api';
import type { Post } from '@/types';

// Lista de posts (com busca por palavra-chave) usada pela página principal e
// pelo painel administrativo. Recarrega sempre que a tela volta ao foco.
export function usePosts(query: string) {
  const term = useDebouncedValue(query.trim());
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setPosts(term ? await postsApi.search(term) : await postsApi.list());
    } catch (err) {
      setError((err as Error).message);
    }
  }, [term]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return { posts, setPosts, error, setError, term, refreshing, refresh, reload: load };
}
