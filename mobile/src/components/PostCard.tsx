import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import type { Post } from '@/types';
import { excerpt, formatDate } from '@/utils/format';

type PostCardProps = {
  post: Post;
  onPress: () => void;
  footer?: ReactNode; // ações extras (ex.: editar/excluir no painel)
};

export function PostCard({ post, onPress, footer }: PostCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ler o post ${post.title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
        <View style={styles.meta}>
          <Ionicons name="person-circle-outline" size={16} color={Colors.deep} />
          <Text style={styles.author} numberOfLines={1}>
            {post.author}
          </Text>
          {post.createdAt ? <Text style={styles.date}>· {formatDate(post.createdAt)}</Text> : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        <Text style={styles.excerpt} numberOfLines={3}>
          {excerpt(post.content)}
        </Text>
      </Pressable>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.line,
    overflow: 'hidden',
  },
  body: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  pressed: {
    backgroundColor: Colors.sageSoft,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  author: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.deep,
  },
  date: {
    fontSize: 13,
    color: Colors.muted,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 21,
    lineHeight: 27,
    color: Colors.ink,
  },
  excerpt: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.muted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
});
