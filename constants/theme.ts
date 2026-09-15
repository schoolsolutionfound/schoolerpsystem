import { Platform } from 'react-native';

const tintColorLight = '#F4C430';
const tintColorDark = '#F4C430';

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
    text: '#171717',
    background: '#FFFEFE',
    tint: tintColorLight,
    icon: '#6B6B6B',
    tabIconDefault: '#6B6B6B',
    tabIconSelected: tintColorLight,
    primary: '#F4C430',
    secondary: '#171717',
    accent: '#FFF4C7',
    success: '#16A34A',
    danger: '#DC3545',
    warning: '#D97706',
    card: '#FFFEFE',
    border: '#E8E5DC',
    muted: '#6B6B6B',
  },
  dark: {
    text: '#FFFDF7',
    background: '#0E0E0E',
    tint: tintColorDark,
    icon: '#6B6B6B',
    tabIconDefault: '#6B6B6B',
    tabIconSelected: tintColorDark,
    primary: '#F4C430',
    secondary: '#171717',
    accent: '#FFF4C7',
    success: '#16A34A',
    danger: '#DC3545',
    warning: '#D97706',
    card: '#171717',
    border: '#E8E5DC',
    muted: '#6B6B6B',
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
