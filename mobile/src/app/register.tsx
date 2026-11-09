import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/Feedback';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { Role } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

type Field = 'name' | 'email' | 'password' | 'confirm' | 'accessCode';

const roles: { value: Role; label: string; icon: 'person-outline' | 'school-outline' }[] = [
  { value: 'student', label: 'Aluno', icon: 'person-outline' },
  { value: 'teacher', label: 'Professor', icon: 'school-outline' },
];

// Cadastro pela tela de login. Alunos se cadastram livremente; professores
// informam o código de acesso da escola, validado pela API.
export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [role, setRole] = useState<Role>('student');
  const [values, setValues] = useState<Record<Field, string>>({
    name: '',
    email: '',
    password: '',
    confirm: '',
    accessCode: '',
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: Field) => (text: string) => setValues((v) => ({ ...v, [field]: text }));

  const submit = async () => {
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = 'Informe seu nome';
    if (!EMAIL_RE.test(values.email.trim())) next.email = 'Informe um e-mail válido';
    if (values.password.length < MIN_PASSWORD)
      next.password = `A senha deve ter ao menos ${MIN_PASSWORD} caracteres`;
    if (values.confirm !== values.password) next.confirm = 'As senhas não conferem';
    if (role === 'teacher' && !values.accessCode.trim()) next.accessCode = 'Informe o código da escola';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setServerError(null);
    try {
      // Ao criar a conta o usuário já fica logado e o layout troca a tela.
      await signUp({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role,
        ...(role === 'teacher' ? { accessCode: values.accessCode.trim() } : {}),
      });
    } catch (err) {
      setServerError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <Text style={styles.label}>Eu sou</Text>
      <View style={styles.roles} accessibilityRole="radiogroup">
        {roles.map((option) => {
          const selected = option.value === role;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              onPress={() => setRole(option.value)}
              style={[styles.role, selected && styles.roleSelected]}>
              <Ionicons name={option.icon} size={18} color={selected ? Colors.white : Colors.deep} />
              <Text style={[styles.roleText, selected && styles.roleTextSelected]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>
        {role === 'teacher'
          ? 'Professores podem publicar posts e administrar usuários. É preciso o código de acesso da escola.'
          : 'Alunos podem ler e comentar os posts.'}
      </Text>

      <ErrorBanner message={serverError} />
      <TextField
        label="Nome completo"
        value={values.name}
        onChangeText={set('name')}
        placeholder="Seu nome"
        autoCapitalize="words"
        autoComplete="name"
        error={errors.name}
      />
      <TextField
        label="E-mail"
        value={values.email}
        onChangeText={set('email')}
        placeholder="nome@escola.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        error={errors.email}
      />
      <TextField
        label="Senha"
        value={values.password}
        onChangeText={set('password')}
        placeholder={`Mínimo de ${MIN_PASSWORD} caracteres`}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        error={errors.password}
      />
      <TextField
        label="Confirmar senha"
        value={values.confirm}
        onChangeText={set('confirm')}
        placeholder="Repita a senha"
        secureTextEntry
        autoCapitalize="none"
        error={errors.confirm}
      />
      {role === 'teacher' ? (
        <TextField
          label="Código de acesso da escola"
          value={values.accessCode}
          onChangeText={set('accessCode')}
          placeholder="Fornecido pela coordenação"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.accessCode}
        />
      ) : null}
      <Button label="Criar conta" icon="person-add-outline" onPress={submit} loading={loading} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  roles: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: -Spacing.sm,
  },
  role: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  roleSelected: {
    backgroundColor: Colors.deep,
    borderColor: Colors.deep,
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.deep,
  },
  roleTextSelected: {
    color: Colors.white,
  },
  hint: {
    marginTop: -Spacing.sm,
    fontSize: 13,
    color: Colors.muted,
  },
});
