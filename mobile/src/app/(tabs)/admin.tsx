import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState, ErrorBanner, ErrorState, Loading } from '@/components/Feedback';
import { PostCard } from '@/components/PostCard';
import { SearchBar } from '@/components/SearchBar';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { usePosts } from '@/hooks/usePosts';
import { postsApi } from '@/services/api';
import type { Post } from '@/types';
import { confirmAction } from '@/utils/confirm';

// Página administrativa: todas as postagens com editar e excluir.
export default function AdminScreen() {
  const [query, setQuery] = useState('');
  const { posts, setPosts, error, setError, term, refreshing, refresh, reload } = usePosts(query);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = async (post: Post) => {
    const ok = await confirmAction('Excluir postagem', `Excluir "${post.title}"? Os comentários também serão apagados.`);
    if (!ok) return;
    setDeletingId(post._id);
    try {
      await postsApi.remove(post._id);
      setPosts((current) => current?.filter((p) => p._id !== post._id) ?? null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  if (error && !posts) return <ErrorState message={error} onRetry={reload} />;
  if (!posts) return <Loading label="Carregando posts…" />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(post) => post._id}
      ListHeaderComponent={
        <View style={styles.header}>
          <ErrorBanner message={error} />
          <SearchBar value={query} onChangeText={setQuery} placeholder="Filtrar postagens" />
          <View style={styles.headerRow}>
            <Text style={styles.count}>
              {posts.length} {posts.length === 1 ? 'postagem' : 'postagens'}
            </Text>
            <Button label="Nova postagem" icon="add" compact onPress={() => router.push('/posts/new')} />
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onPress={() => router.push(`/posts/${item._id}`)}
          footer={
            <>
              <Button
                label="Editar"
                icon="create-outline"
                variant="secondary"
                compact
                onPress={() => router.push(`/posts/edit/${item._id}`)}
              />
              <Button
                label="Excluir"
                icon="trash-outline"
                variant="danger"
                compact
                loading={deletingId === item._id}
                onPress={() => remove(item)}
              />
            </>
          }
        />
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.deep} />}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title={term ? 'Nenhum post encontrado' : 'Nenhuma postagem ainda'}
          message={term ? `Nada corresponde a "${term}".` : 'Crie a primeira postagem para os alunos.'}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: Colors.paper,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.lg,
    flexGrow: 1,
  },
  header: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    color: Colors.muted,
    fontSize: 14,
  },
  separator: {
    height: Spacing.md,
  },
});
