import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextField({ label, hint, error, multiline, secureTextEntry, style, ...props }: TextFieldProps) {
  // Campos de senha ganham o "olho" para mostrar/ocultar o que foi digitado.
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={Colors.muted}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          secureTextEntry={secureTextEntry && hidden}
          style={[
            styles.input,
            multiline && styles.multiline,
            secureTextEntry && styles.withToggle,
            error && styles.inputError,
            style,
          ]}
          {...props}
        />
        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            hitSlop={8}
            onPress={() => setHidden((h) => !h)}
            style={styles.toggle}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={22} color={Colors.muted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.ink,
  },
  multiline: {
    minHeight: 200,
  },
  withToggle: {
    paddingRight: 52,
  },
  toggle: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputError: {
    borderColor: Colors.coral,
  },
  hint: {
    fontSize: 13,
    color: Colors.muted,
  },
  error: {
    fontSize: 13,
    color: Colors.danger,
  },
});
