import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, BorderRadius } from '../../../constants/theme';

export type BadgeType = 'active' | 'inactive' | 'suspended' | 'trial' | 'college' | 'school';

export interface AppBadgeProps {
  label: string;
  type?: BadgeType;
  style?: StyleProp<ViewStyle>;
}

export const AppBadge: React.FC<AppBadgeProps> = ({ label, type = 'active', style }) => {
  const getBadgeColors = (): { bg: string; text: string; border: string } => {
    switch (type.toLowerCase()) {
      case 'active':
        return { bg: '#F0FDF4', text: Colors.light.success, border: '#DCFCE7' };
      case 'inactive':
      case 'suspended':
        return { bg: '#FEF2F2', text: Colors.light.danger, border: '#FECACA' };
      case 'trial':
        return { bg: '#FEF3C7', text: Colors.light.warning, border: '#FDE68A' };
      case 'college':
        return { bg: '#EDE7F6', text: Colors.light.primary, border: '#DDD6FE' };
      case 'school':
        return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
      default:
        return { bg: '#F1F5F9', text: Colors.light.muted, border: '#E2E8F0' };
    }
  };

  const { bg, text, border } = getBadgeColors();

  return (
    <View
      style={[styles.badge, { backgroundColor: bg, borderColor: border }, style]}
      accessibilityRole="text"
      accessibilityLabel={`Status ${label}`}
    >
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
