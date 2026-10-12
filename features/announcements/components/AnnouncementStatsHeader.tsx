import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface AnnouncementStatsHeaderProps {
  total: number;
  publishedCount?: number;
  scheduledCount?: number;
  draftCount?: number;
  unreadCount?: number;
  isManagement?: boolean;
}

export const AnnouncementStatsHeader: React.FC<AnnouncementStatsHeaderProps> = ({
  total,
  publishedCount = 0,
  scheduledCount = 0,
  draftCount = 0,
  unreadCount = 0,
  isManagement = false,
}) => {
  if (isManagement) {
    return (
      <View style={styles.container}>
        <View style={styles.statCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#FFF4C7' }]}>
            <MaterialCommunityIcons name="bullhorn-outline" size={20} color={Colors.light.primary} />
          </View>
          <Text style={styles.statValue}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color={Colors.light.success} />
          </View>
          <Text style={styles.statValue}>{publishedCount}</Text>
          <Text style={styles.statLabel}>Published</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.light.warning} />
          </View>
          <Text style={styles.statValue}>{scheduledCount}</Text>
          <Text style={styles.statLabel}>Scheduled</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#F3F4F6' }]}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={20} color={Colors.light.secondary} />
          </View>
          <Text style={styles.statValue}>{draftCount}</Text>
          <Text style={styles.statLabel}>Drafts</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.statCard, { flex: 1 }]}>
        <View style={[styles.iconWrap, { backgroundColor: '#FFF4C7' }]}>
          <MaterialCommunityIcons name="bullhorn-outline" size={20} color={Colors.light.primary} />
        </View>
        <Text style={styles.statValue}>{total}</Text>
        <Text style={styles.statLabel}>Announcements</Text>
      </View>

      <View style={[styles.statCard, { flex: 1 }]}>
        <View style={[styles.iconWrap, { backgroundColor: unreadCount > 0 ? '#FEF2F2' : '#DCFCE7' }]}>
          <MaterialCommunityIcons
            name={unreadCount > 0 ? 'bell-badge-outline' : 'bell-check-outline'}
            size={20}
            color={unreadCount > 0 ? Colors.light.danger : Colors.light.success}
          />
        </View>
        <Text style={styles.statValue}>{unreadCount}</Text>
        <Text style={styles.statLabel}>Unread Updates</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: Colors.light.muted,
  },
});
