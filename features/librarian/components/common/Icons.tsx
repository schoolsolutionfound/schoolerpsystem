import React from 'react';
import { Text } from 'react-native';
import MaterialCommunityIconsNative from '@expo/vector-icons/MaterialCommunityIcons';
import FeatherNative from '@expo/vector-icons/Feather';
import IoniconsNative from '@expo/vector-icons/Ionicons';

// Clean error-boundary wrapped vector icon components for enterprise reliability
class SafeMaterialCommunityIcons extends React.Component<
  { name: string; size?: number; color?: string; style?: any },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    const { name, size = 18, color = '#171717', style } = this.props;
    if (this.state.hasError) {
      return <Text style={[{ fontSize: size * 0.8, color }, style]}>•</Text>;
    }
    return <MaterialCommunityIconsNative name={name as any} size={size} color={color} style={style} />;
  }
}

class SafeFeather extends React.Component<
  { name: string; size?: number; color?: string; style?: any },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    const { name, size = 18, color = '#171717', style } = this.props;
    if (this.state.hasError) {
      return <Text style={[{ fontSize: size * 0.8, color }, style]}>•</Text>;
    }
    return <FeatherNative name={name as any} size={size} color={color} style={style} />;
  }
}

class SafeIonicons extends React.Component<
  { name: string; size?: number; color?: string; style?: any },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() {}
  render() {
    const { name, size = 18, color = '#171717', style } = this.props;
    if (this.state.hasError) {
      return <Text style={[{ fontSize: size * 0.8, color }, style]}>•</Text>;
    }
    return <IoniconsNative name={name as any} size={size} color={color} style={style} />;
  }
}

export const MaterialCommunityIcons = SafeMaterialCommunityIcons;
export const Feather = SafeFeather;
export const Ionicons = SafeIonicons;
