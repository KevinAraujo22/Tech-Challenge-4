import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

const palette: Record<Variant, { bg: string; fg: string; border: string }> = {
  primary: { bg: Colors.deep, fg: Colors.white, border: Colors.deep },
  secondary: { bg: Colors.white, fg: Colors.deep, border: Colors.line },
  danger: { bg: Colors.coralSoft, fg: Colors.danger, border: Colors.coralSoft },
  ghost: { bg: 'transparent', fg: Colors.deep, border: 'transparent' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  compact,
  style,
}: ButtonProps) {
  const colors = palette[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: colors.bg, borderColor: colors.border },
        pressed && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={colors.fg} size="small" />
      ) : (
        icon && <Ionicons name={icon} size={compact ? 16 : 18} color={colors.fg} />
      )}
      <Text style={[styles.label, compact && styles.compactLabel, { color: colors.fg }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  compact: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactLabel: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.55,
  },
});
