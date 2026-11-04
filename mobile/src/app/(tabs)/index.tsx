import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState, ErrorState, Loading } from '@/components/Feedback';
import { PostCard } from '@/components/PostCard';
import { SearchBar } from '@/components/SearchBar';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { usePosts } from '@/hooks/usePosts';

// Página principal: todos os posts, com busca por palavra-chave.
export default function HomeScreen() {
  const { user, isTeacher } = useAuth();
  const [query, setQuery] = useState('');
  const { posts, error, term, refreshing, refresh, reload } = usePosts(query);

  const header = (
    <View style={styles.header}>
      <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0]} 👋</Text>
      <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar posts por palavra-chave" />
      {isTeacher ? (
        <Button label="Nova postagem" icon="add" onPress={() => router.push('/posts/new')} />
      ) : null}
    </View>
  );

  if (error && !posts) return <ErrorState message={error} onRetry={reload} />;
  if (!posts) return <Loading label="Carregando posts…" />;

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={(post) => post._id}
      ListHeaderComponent={header}
      renderItem={({ item }) => <PostCard post={item} onPress={() => router.push(`/posts/${item._id}`)} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.deep} />}
      ListEmptyComponent={
        term ? (
          <EmptyState icon="search" title="Nenhum post encontrado" message={`Nada corresponde a "${term}".`} />
        ) : (
          <EmptyState icon="newspaper-outline" title="Ainda não há posts" message="Os conteúdos publicados pelos professores aparecem aqui." />
        )
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
  greeting: {
    fontSize: 16,
    color: Colors.muted,
  },
  separator: {
    height: Spacing.md,
  },
});
