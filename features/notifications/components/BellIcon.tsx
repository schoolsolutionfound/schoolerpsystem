import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { useUnreadCount } from '../hooks/useNotifications';

interface BellIconProps {
  size?: number;
  color?: string;
  pollIntervalMs?: number;
}

/**
 * Bell icon with a live unread badge. Drop-in replacement for the static
 * bell + fake red dot used across the home headers.
 */
export const BellIcon: React.FC<BellIconProps> = ({
  size = 22,
  color = '#171717',
  pollIntervalMs = 60000,
}) => {
  const { unread } = useUnreadCount(pollIntervalMs);

  if (unread <= 0) {
    return <Feather name="bell" size={size} color={color} />;
  }

  return (
    <View>
      <Feather name="bell" size={size} color={color} />
      <View style={[styles.badge, unread > 9 && styles.badgeWide]}>
        {unread > 9 ? <Text style={styles.badgeText}>9+</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -3,
    right: -4,
    minWidth: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeWide: {
    height: 14,
    borderRadius: 7,
    top: -5,
    right: -6,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 8,
    color: '#FFFFFF',
  },
});
