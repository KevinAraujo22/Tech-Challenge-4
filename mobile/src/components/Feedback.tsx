import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Colors, Radius, Spacing } from '@/constants/theme';

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <View style={styles.center} accessibilityLiveRegion="polite">
      <ActivityIndicator color={Colors.deep} size="large" />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

type EmptyStateProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
};

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <View style={styles.iconBubble}>
        <Ionicons name={icon} size={28} color={Colors.deep} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={[styles.muted, styles.centerText]}>{message}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <View style={[styles.iconBubble, styles.errorBubble]}>
        <Ionicons name="cloud-offline-outline" size={28} color={Colors.danger} />
      </View>
      <Text style={styles.title}>Algo deu errado</Text>
      <Text style={[styles.muted, styles.centerText]}>{message}</Text>
      {onRetry ? <Button label="Tentar novamente" icon="refresh" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

// Mensagem de erro inline, usada em formulários.
export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="alert-circle" size={18} color={Colors.danger} />
      <Text style={styles.bannerText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.xxl,
  },
  iconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.sageSoft,
  },
  errorBubble: {
    backgroundColor: Colors.coralSoft,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.ink,
  },
  muted: {
    fontSize: 15,
    color: Colors.muted,
  },
  centerText: {
    textAlign: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.coralSoft,
  },
  bannerText: {
    flex: 1,
    color: Colors.danger,
    fontSize: 14,
  },
});
