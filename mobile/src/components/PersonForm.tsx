import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ErrorBanner } from '@/components/Feedback';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { PeopleConfig } from '@/constants/people';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { PeopleKind, PersonInput } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;

type PersonFormProps = {
  kind: PeopleKind;
  initial: PersonInput;
  isEdit?: boolean; // na edição a senha é opcional
  showAdminToggle?: boolean; // só o administrador vê a opção de tornar alguém administrador
  submitLabel: string;
  onSubmit: (person: PersonInput) => Promise<void>;
};

// Formulário de cadastro/edição de professores e alunos.
export function PersonForm({ kind, initial, isEdit, showAdminToggle, submitLabel, onSubmit }: PersonFormProps) {
  const config = PeopleConfig[kind];
  const [values, setValues] = useState<PersonInput>({ password: '', ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof PersonInput, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof PersonInput) => (text: string) => setValues((v) => ({ ...v, [field]: text }));

  const submit = async () => {
    const password = values.password ?? '';
    const next: typeof errors = {};
    if (!values.name.trim()) next.name = 'Informe o nome';
    if (!EMAIL_RE.test(values.email.trim())) next.email = 'Informe um e-mail válido';
    if (!isEdit && !password) next.password = 'Defina uma senha de acesso';
    else if (password && password.length < MIN_PASSWORD)
      next.password = `A senha deve ter ao menos ${MIN_PASSWORD} caracteres`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setServerError(null);
    try {
      await onSubmit({
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        [config.extraField]: (values[config.extraField] ?? '').trim(),
        ...(password ? { password } : {}),
        ...(showAdminToggle ? { isAdmin: values.isAdmin === true } : {}),
      });
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormScreen>
      <ErrorBanner message={serverError} />
      <TextField
        label="Nome completo"
        value={values.name}
        onChangeText={set('name')}
        placeholder={`Nome do ${config.singular}`}
        autoCapitalize="words"
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
        hint="Usado para entrar no app"
        error={errors.email}
      />
      <TextField
        label={config.extraLabel}
        value={values[config.extraField] ?? ''}
        onChangeText={set(config.extraField)}
        placeholder={config.extraPlaceholder}
      />
      <TextField
        label={isEdit ? 'Nova senha' : 'Senha'}
        value={values.password}
        onChangeText={set('password')}
        placeholder={isEdit ? 'Deixe em branco para manter a atual' : `Mínimo de ${MIN_PASSWORD} caracteres`}
        secureTextEntry
        autoCapitalize="none"
        error={errors.password}
      />
      {showAdminToggle ? (
        <View style={styles.adminRow}>
          <View style={styles.adminText}>
            <Text style={styles.adminLabel}>Administrador</Text>
            <Text style={styles.adminHint}>Pode cadastrar, editar e excluir outros professores.</Text>
          </View>
          <Switch
            accessibilityLabel="Administrador"
            value={values.isAdmin === true}
            onValueChange={(isAdmin) => setValues((v) => ({ ...v, isAdmin }))}
            trackColor={{ true: Colors.deep, false: Colors.line }}
            thumbColor={Colors.white}
          />
        </View>
      ) : null}
      <Button label={submitLabel} icon="checkmark" onPress={submit} loading={saving} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  adminRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  adminText: {
    flex: 1,
    gap: 2,
  },
  adminLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
  },
  adminHint: {
    fontSize: 13,
    color: Colors.muted,
  },
});
