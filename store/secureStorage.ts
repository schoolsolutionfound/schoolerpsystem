import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SENSITIVE_KEYS = new Set([
  'email',
  'phone',
  'parentPhone',
  'tenthPercentage',
  'twelfthPercentage',
]);

function isSensitive(key: string): boolean {
  for (const sk of SENSITIVE_KEYS) {
    if (key.endsWith(sk)) return true;
  }
  return false;
}

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }
    try {
      const raw = await SecureStore.getItemAsync(key);
      if (raw !== null) return raw;
    } catch {}
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    // Always use AsyncStorage for Zustand state blobs.
    // SecureStore has a 2048-char limit per value which silently fails
    // when the serialised Zustand JSON exceeds it on mobile.
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
    await AsyncStorage.removeItem(key);
  },
};
