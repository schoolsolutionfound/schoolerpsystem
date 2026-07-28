import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export const StudentHomeAnnouncements: React.FC = () => {
  return (
    <View style={styles.announcementCard}>
      <View style={styles.announcementIconWrap}>
        <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#7E57C2" />
      </View>

      <View style={styles.announcementContent}>
        <View style={styles.announcementTop}>
          <Text style={styles.announcementTitle}>Announcement</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All &gt;</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.announcementBody}>
          Parents-Teacher Meeting is scheduled on 24th May 2025 (Saturday) at 10:00 AM.
        </Text>
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
    borderColor: '#E2E8F0',
    gap: 12,
    alignItems: 'flex-start',
  },
  announcementIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementContent: { flex: 1, gap: 4 },
  announcementTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  announcementTitle: { fontSize: 14, fontWeight: '700', color: '#1A202C' },
  viewAllText: { fontSize: 12, color: '#7E57C2', fontWeight: '700' },
  announcementBody: { fontSize: 12, color: '#64748B', lineHeight: 17 },
});
