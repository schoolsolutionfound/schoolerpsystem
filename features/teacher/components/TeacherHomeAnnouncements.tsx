import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

export const TeacherHomeAnnouncements: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#1A1B1C" />
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Announcements</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>0</Text>
          </View>
        </View>
        <Text style={styles.body}>No announcements yet.</Text>
        <Text style={styles.sub}>School updates will appear here.</Text>
      </View>
    </View>
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
  body: { fontSize: 12, color: '#6B6B6B', fontWeight: '600' },
  sub: { fontSize: 11, color: '#6B6B6B' },
});
