import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/Feedback';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/services/api';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Ao autenticar, o Stack.Protected do layout troca a tela automaticamente.
      await signIn(email, password);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <FormScreen>
      <View style={styles.hero}>
        <View style={styles.logo}>
          <Ionicons name="book" size={32} color={Colors.white} />
        </View>
        <Text style={styles.brand}>Blog da Escola</Text>
        <Text style={styles.subtitle}>
          Conteúdos, avisos e materiais dos professores, na palma da mão.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Entrar</Text>
        <Text style={styles.cardText}>Professores e alunos usam o e-mail cadastrado pela escola.</Text>
        <ErrorBanner message={error} />
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="nome@escola.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Sua senha"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={submit}
          returnKeyType="go"
        />
        <Button label="Entrar" icon="log-in-outline" onPress={submit} loading={loading} />
      </View>

      <View style={styles.signup}>
        <Text style={styles.signupText}>Ainda não tem conta?</Text>
        <Button
          label="Criar conta"
          icon="person-add-outline"
          variant="secondary"
          onPress={() => router.push('/register')}
        />
      </View>

      <Text style={styles.server}>Servidor: {API_URL}</Text>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xxl * 1.5,
    paddingBottom: Spacing.lg,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.deep,
  },
  brand: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    color: Colors.muted,
    textAlign: 'center',
    maxWidth: 320,
  },
  card: {
    gap: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.ink,
  },
  cardText: {
    marginTop: -Spacing.sm,
    fontSize: 14,
    color: Colors.muted,
  },
  signup: {
    gap: Spacing.sm,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
    color: Colors.muted,
  },
  server: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.muted,
  },
});
