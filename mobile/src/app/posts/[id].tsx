import { router, Stack, useLocalSearchParams } from 'expo-router';
import { HeaderHeightContext } from 'expo-router/react-navigation';
import { use, useCallback } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Comments } from '@/components/Comments';
import { ErrorState, Loading } from '@/components/Feedback';
import { Colors, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useResource } from '@/hooks/useResource';
import { postsApi } from '@/services/api';
import { formatDate } from '@/utils/format';

// Página de leitura: conteúdo completo do post + comentários.
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isTeacher } = useAuth();
  const { data: post, error, reload } = useResource(useCallback(() => postsApi.get(id), [id]));
  const headerHeight = use(HeaderHeightContext) ?? 0;

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!post) return <Loading label="Abrindo post…" />;

  const edited = post.updatedAt && post.createdAt && post.updatedAt !== post.createdAt;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="padding"
      keyboardVerticalOffset={headerHeight}>
      <Stack.Screen options={{ title: post.title }} />
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.meta}>
          Por <Text style={styles.author}>{post.author}</Text> · {formatDate(post.createdAt)}
          {edited ? ` · editado em ${formatDate(post.updatedAt)}` : ''}
        </Text>

        {isTeacher ? (
          <Button
            label="Editar postagem"
            icon="create-outline"
            variant="secondary"
            compact
            style={styles.edit}
            onPress={() => router.push(`/posts/edit/${post._id}`)}
          />
        ) : null}

        <View style={styles.divider} />
        <Text style={styles.body} selectable>
          {post.content}
        </Text>
        <View style={styles.divider} />

        <Comments postId={post._id} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    backgroundColor: Colors.paper,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 30,
    lineHeight: 38,
    color: Colors.ink,
  },
  meta: {
    fontSize: 14,
    color: Colors.muted,
  },
  author: {
    fontWeight: '600',
    color: Colors.deep,
  },
  edit: {
    alignSelf: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginVertical: Spacing.sm,
  },
  body: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    lineHeight: 29,
    color: Colors.ink,
  },
});
