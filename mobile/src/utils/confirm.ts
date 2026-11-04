import { Alert, Platform } from 'react-native';

// Alert.alert com botões não funciona no react-native-web; lá usamos o
// window.confirm do navegador. O retorno é uma Promise nos dois casos.
export function confirmAction(title: string, message: string, confirmLabel = 'Excluir') {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${message}`));

  return new Promise<boolean>((resolve) =>
    Alert.alert(
      title,
      message,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) }
    )
  );
}
