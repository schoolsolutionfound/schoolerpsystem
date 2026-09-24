import React from 'react';
import { Text } from 'react-native';

let NativeMCI: any = null;
try {
  NativeMCI = require('@expo/vector-icons')?.MaterialCommunityIcons;
} catch (_e) {
  NativeMCI = null;
}

export const ICON_FALLBACK_MAP: { [key: string]: string } = {
  'book-multiple': '📚',
  'swap-horizontal': '🔄',
  'alert-circle-outline': '⚠️',
  'book-open-page-variant': '📖',
  'file-document-multiple': '📄',
  'cash-register': '💵',
  'package-variant-closed': '📦',
  'lightning-bolt': '⚡',
  'file-chart-outline': '📊',
  'calendar-outline': '📅',
  'clipboard-check-outline': '📋',
  'clock-outline': '⏰',
  'tray-arrow-down': '📥',
  'eye-outline': '👁️',
  'download-outline': '📥',
  'trash-can-outline': '🗑️',
  'book-plus-outline': '➕',
  'account-plus-outline': '👤',
  'book-arrow-up': '📤',
  'book-arrow-down': '📥',
  'book-arrow-up-outline': '📤',
  'book-arrow-down-outline': '📥',
  'cash-multiple': '💵',
  'magnify': '🔍',
  'close': '✖',
  'close-circle-outline': '✖',
  'plus': '➕',
  'minus': '➖',
  'pencil-outline': '✏️',
  'upload': '📤',
  'download': '📥',
  'eye': '👁️',
  'menu': '☰',
  'chevron-left': '‹',
  'chevron-right': '›',
  'chevron-down': '⌄',
  'currency-usd': '💲',
  'check-circle-outline': '✅',
  'file-document-outline': '📄',
  'book-open-variant': '📖',
  'account-group-outline': '👥',
  'information-outline': 'ℹ️',
  'cog-outline': '⚙️',
  'shield-check-outline': '🛡️',
  'trending-up': '📈',
  'circle-outline': '⭕',
};

class SafeMaterialCommunityIcons extends React.Component<
  { name: string; size?: number; color?: string; style?: any },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: any) {
    // Suppress missing native module crash
  }

  render() {
    const { name, size = 18, color = '#374151', style } = this.props;

    if (!this.state.hasError && NativeMCI) {
      try {
        return <NativeMCI name={name as any} size={size} color={color} style={style} />;
      } catch (_e) {
        // Fallback to text symbol
      }
    }

    const symbol = ICON_FALLBACK_MAP[name] || '•';
    return (
      <Text style={[{ fontSize: Math.round(size * 0.85), color, textAlign: 'center' }, style]}>
        {symbol}
      </Text>
    );
  }
}

export const MaterialCommunityIcons = SafeMaterialCommunityIcons;

export const FEATHER_TO_MCI_MAP: { [key: string]: string } = {
  'search': 'magnify',
  'x': 'close',
  'x-circle': 'close-circle-outline',
  'plus': 'plus',
  'minus': 'minus',
  'edit-2': 'pencil-outline',
  'trash-2': 'trash-can-outline',
  'user-plus': 'account-plus-outline',
  'upload': 'upload',
  'download': 'download',
  'eye': 'eye-outline',
  'menu': 'menu',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-down': 'chevron-down',
  'dollar-sign': 'currency-usd',
  'check-circle': 'check-circle-outline',
  'alert-circle': 'alert-circle-outline',
  'file-text': 'file-document-outline',
  'book-open': 'book-open-variant',
  'log-out': 'book-arrow-up-outline',
  'log-in': 'book-arrow-down-outline',
  'book': 'book-open-variant',
  'users': 'account-group-outline',
  'file': 'file-document-outline',
};

export const Feather: React.FC<{ name: string; size?: number; color?: string; style?: any }> = ({
  name,
  size = 20,
  color = '#000',
  style,
}) => {
  const mciName = FEATHER_TO_MCI_MAP[name] || 'circle-outline';
  return <MaterialCommunityIcons name={mciName as any} size={size} color={color} style={style} />;
};

export const Ionicons: React.FC<{ name: string; size?: number; color?: string; style?: any }> = ({
  name,
  size = 20,
  color = '#000',
  style,
}) => {
  return <MaterialCommunityIcons name="information-outline" size={size} color={color} style={style} />;
};
