import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

interface ParentHomeAnnouncementsProps {
  onPress?: () => void;
}

export const ParentHomeAnnouncements: React.FC<ParentHomeAnnouncementsProps> = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.announcementCard} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.announcementContent}>
        <Text style={styles.announcementTitle}>Announcements</Text>
        <Text style={styles.announcementSub}>School &amp; class updates appear here</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    gap: 14,
    alignItems: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  announcementContent: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  announcementSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
  },
});
