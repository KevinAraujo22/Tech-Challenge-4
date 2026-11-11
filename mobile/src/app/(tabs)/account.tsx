import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Colors, Fonts, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { confirmAction } from '@/utils/confirm';
import { initials } from '@/utils/format';

export default function AccountScreen() {
  const { user, isTeacher, isAdmin, signOut } = useAuth();
  if (!user) return null;

  const logout = async () => {
    if (await confirmAction('Sair', 'Deseja encerrar a sessão neste aparelho?', 'Sair')) await signOut();
  };

  const permissions = isAdmin
    ? [
        'Ler e comentar posts',
        'Criar, editar e excluir postagens',
        'Cadastrar, editar e excluir alunos',
        'Cadastrar, editar e excluir professores',
      ]
    : isTeacher
      ? [
          'Ler e comentar posts',
          'Criar, editar e excluir postagens',
          'Cadastrar, editar e excluir alunos',
          'Ver professores e editar a própria conta',
        ]
      : ['Ler posts', 'Comentar nos posts'];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user.name)}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={[styles.badge, isTeacher ? styles.teacherBadge : styles.studentBadge]}>
          <Ionicons name={isTeacher ? 'school' : 'person'} size={14} color={Colors.deep} />
          <Text style={styles.badgeText}>{isAdmin ? 'Professor(a) administrador(a)' : isTeacher ? 'Professor(a)' : 'Aluno(a)'}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>O que você pode fazer</Text>
        {permissions.map((item) => (
          <View key={item} style={styles.permission}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.deep} />
            <Text style={styles.permissionText}>{item}</Text>
          </View>
        ))}
      </View>

      <Button label="Sair" icon="log-out-outline" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sage,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.deep,
  },
  name: {
    fontFamily: Fonts.serif,
    fontSize: 24,
    color: Colors.ink,
  },
  email: {
    color: Colors.muted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.pill,
  },
  teacherBadge: {
    backgroundColor: Colors.sage,
  },
  studentBadge: {
    backgroundColor: Colors.sageSoft,
  },
  badgeText: {
    fontWeight: '600',
    color: Colors.deep,
  },
  section: {
    alignSelf: 'flex-start',
    fontSize: 16,
    fontWeight: '700',
    color: Colors.ink,
  },
  permission: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  permissionText: {
    flex: 1,
    color: Colors.ink,
  },
});
