import { type ReactNode, use } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderHeightContext } from 'expo-router/react-navigation';

import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';

// Container das telas de formulário: rola, respeita a área segura e sobe o
// conteúdo quando o teclado abre. Com o Android em modo edge-to-edge a janela
// não encolhe sozinha, por isso o "padding" vale para as duas plataformas.
export function FormScreen({ children }: { children: ReactNode }) {
  const headerHeight = use(HeaderHeightContext) ?? 0;

  return (
    // Sem cabeçalho (login), o topo também precisa respeitar a barra de status.
    <SafeAreaView edges={headerHeight ? ['bottom'] : ['top', 'bottom']} style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={headerHeight}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
});
