import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// No celular a sessão fica no armazenamento seguro do sistema (Keychain /
// Keystore). O SecureStore não existe na web, onde usamos o localStorage.
export const storage = {
  async get(key: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.setItem(key, value);
    return SecureStore.setItemAsync(key, value);
  },
  async remove(key: string) {
    if (Platform.OS === 'web') return globalThis.localStorage?.removeItem(key);
    return SecureStore.deleteItemAsync(key);
  },
};
