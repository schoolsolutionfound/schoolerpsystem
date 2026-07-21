import { Platform } from 'react-native';

const tintColorLight = '#1E3A5F';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F8F9FB',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    primary: '#1E3A5F',
    secondary: '#4A90D9',
    accent: '#F4A261',
    success: '#28A745',
    danger: '#DC3545',
    warning: '#FFC107',
    card: '#FFFFFF',
    border: '#E5E7EB',
    muted: '#6B7280',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#4A90D9',
    secondary: '#7C3AED',
    accent: '#F4A261',
    success: '#28A745',
    danger: '#DC3545',
    warning: '#FFC107',
    card: '#1E2022',
    border: '#2D3135',
    muted: '#9CA3AF',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
