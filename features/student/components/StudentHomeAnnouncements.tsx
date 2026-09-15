import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export const StudentHomeAnnouncements: React.FC = () => {
  return (
    <View style={styles.announcementCard}>
      <View style={styles.announcementIconWrap}>
        <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#1A1B1C" />
      </View>

      <View style={styles.announcementContent}>
        <View style={styles.announcementTop}>
          <Text style={styles.announcementTitle}>Announcements</Text>
        </View>
        <Text style={styles.announcementBody}>No announcements yet.</Text>
        <Text style={styles.announcementSub}>School announcements will appear here.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    alignItems: 'flex-start',
  },
  announcementIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementContent: { flex: 1, gap: 4 },
  announcementTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  announcementTitle: { fontSize: 14, fontWeight: '700', color: '#171717' },
  announcementBody: { fontSize: 12, color: '#6B6B6B', lineHeight: 17, fontWeight: '600' },
  announcementSub: { fontSize: 11, color: '#6B6B6B', lineHeight: 15 },
});
