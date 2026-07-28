import { Platform } from 'react-native';

const tintColorLight = '#7E57C2';
const tintColorDark = '#9333EA';

export const BorderRadius = {
  input: 6,
  button: 7,
  card: 8,
  modal: 10,
  bottomSheet: 12,
  profileImage: 999,
  chip: 999,
};

export const Colors = {
  light: {
    text: '#1A202C',
    background: '#F8F9FB',
    tint: tintColorLight,
    icon: '#718096',
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    primary: '#7E57C2',
    secondary: '#4A90D9',
    accent: '#F4A261',
    success: '#16A34A',
    danger: '#DC3545',
    warning: '#D97706',
    card: '#FFFFFF',
    border: '#E2E8F0',
    muted: '#718096',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#9333EA',
    secondary: '#7C3AED',
    accent: '#F4A261',
    success: '#16A34A',
    danger: '#DC3545',
    warning: '#D97706',
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
