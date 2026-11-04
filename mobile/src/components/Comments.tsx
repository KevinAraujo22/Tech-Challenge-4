import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/Feedback';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useResource } from '@/hooks/useResource';
import { postsApi } from '@/services/api';
import type { Comment } from '@/types';
import { confirmAction } from '@/utils/confirm';
import { formatDate, initials } from '@/utils/format';

// Comentários do post. Qualquer usuário logado comenta; cada um pode apagar
// os próprios comentários e professores podem moderar todos.
export function Comments({ postId }: { postId: string }) {
  const { user, isTeacher } = useAuth();
  const resource = useResource(useCallback(() => postsApi.comments(postId), [postId]));
  const comments = resource.data ?? [];
  const setComments = (update: (current: Comment[]) => Comment[]) =>
    resource.setData((current) => update(current ?? []));
  const [text, setText] = useState('');
  const [actionError, setError] = useState<string | null>(null);
  const error = actionError ?? resource.error;
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const created = await postsApi.addComment(postId, text.trim());
      setComments((current) => [...current, created]);
      setText('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment: Comment) => {
    if (!(await confirmAction('Excluir comentário', 'Deseja apagar este comentário?'))) return;
    try {
      await postsApi.removeComment(postId, comment._id);
      setComments((current) => current.filter((c) => c._id !== comment._id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Comentários <Text style={styles.count}>({comments.length})</Text>
      </Text>

      {comments.length === 0 ? <Text style={styles.empty}>Seja o primeiro a comentar.</Text> : null}

      {comments.map((comment) => (
        <View key={comment._id} style={styles.comment}>
          <View style={[styles.avatar, comment.authorRole === 'teacher' && styles.teacherAvatar]}>
            <Text style={styles.avatarText}>{initials(comment.authorName)}</Text>
          </View>
          <View style={styles.commentBody}>
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.authorName}</Text>
              {comment.authorRole === 'teacher' ? <Text style={styles.tag}>Professor</Text> : null}
              <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
            </View>
            <Text style={styles.commentText}>{comment.content}</Text>
          </View>
          {isTeacher || comment.authorId === user?.id ? (
            <Pressable accessibilityLabel="Excluir comentário" hitSlop={10} onPress={() => remove(comment)}>
              <Ionicons name="trash-outline" size={18} color={Colors.muted} />
            </Pressable>
          ) : null}
        </View>
      ))}

      <ErrorBanner message={error} />
      <View style={styles.form}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escreva um comentário…"
          placeholderTextColor={Colors.muted}
          accessibilityLabel="Escreva um comentário"
          multiline
          maxLength={1000}
          style={styles.input}
        />
        <Button label="Enviar" icon="send" compact loading={sending} disabled={!text.trim()} onPress={send} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
  },
  count: {
    fontWeight: '400',
    color: Colors.muted,
  },
  empty: {
    color: Colors.muted,
  },
  comment: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sageSoft,
  },
  teacherAvatar: {
    backgroundColor: Colors.sage,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.deep,
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  commentHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  commentAuthor: {
    fontWeight: '600',
    color: Colors.ink,
  },
  tag: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.deep,
    backgroundColor: Colors.sageSoft,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  commentDate: {
    fontSize: 12,
    color: Colors.muted,
  },
  commentText: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.ink,
  },
  form: {
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  input: {
    alignSelf: 'stretch',
    minHeight: 80,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    fontSize: 15,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
});
