import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface TeacherHomeAnnouncementsProps {
  onPressFeed?: () => void;
  onPressManage?: () => void;
}

export const TeacherHomeAnnouncements: React.FC<TeacherHomeAnnouncementsProps> = ({
  onPressFeed,
  onPressManage,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPressFeed || onPressManage}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#1A1B1C" />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Announcements</Text>
          {onPressManage ? (
            <TouchableOpacity
              style={styles.manageBadge}
              onPress={onPressManage}
              hitSlop={6}
            >
              <Text style={styles.manageBadgeText}>Manage</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>View</Text>
            </View>
          )}
        </View>
        <Text style={styles.body}>View announcements or post updates</Text>
        <Text style={styles.sub}>School & class updates appear here</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, gap: 4 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 14, fontFamily: FontFamily.semibold, color: '#171717' },
  badge: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#D4A418' },
  manageBadge: {
    backgroundColor: '#171717',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  manageBadgeText: { fontSize: 10, fontWeight: '700', color: '#F4C430' },
  body: { fontSize: 12, color: '#6B6B6B', fontWeight: '600' },
  sub: { fontSize: 11, color: '#6B6B6B' },
});
