/**
 * @file showAlert.ts
 * @description Cross-platform alert utility for SchoolHub.
 */

import { Platform, Alert, AlertButton } from 'react-native';

export function showAlert(
  title: string,
  message: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const ok = window.confirm(`${title}\n\n${message}`);
      if (ok) {
        const confirmBtn = buttons.find((b) => b.style !== 'cancel');
        confirmBtn?.onPress?.();
      } else {
        const cancelBtn = buttons.find((b) => b.style === 'cancel');
        cancelBtn?.onPress?.();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
}
