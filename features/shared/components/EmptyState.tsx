import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Available',
  description = 'There are no records matching your request.',
  actionTitle,
  onAction,
  iconName = 'text-box-search-outline',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={iconName} size={40} color={Colors.light.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction && (
        <AppButton title={actionTitle} onPress={onAction} style={styles.actionBtn} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.profileImage,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: Colors.light.muted,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  actionBtn: {
    marginTop: 12,
  },
});
