import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { FontFamily } from '../../../constants/fonts';
import { MaterialCommunityIcons } from './common/Icons';
import { TeacherShimmerSkeleton } from './common/TeacherShimmer';
import { useAnnouncementFeedQuery } from '../../announcements/hooks/useAnnouncements';

interface TeacherHomeAnnouncementsProps {
  onPressFeed?: () => void;
  onPressManage?: () => void;
  title?: string;
}

export const TeacherHomeAnnouncements: React.FC<TeacherHomeAnnouncementsProps> = ({
  onPressFeed,
  onPressManage,
  title,
}) => {
  const { data, isLoading } = useAnnouncementFeedQuery({ limit: 5 });

  const announcementTitle =
    title ||
    data?.[0]?.title ||
    'Staff Meeting & Curriculum Updates';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPressFeed || onPressManage}
    >
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.heading}>Notifications</Text>
          {isLoading && !data ? (
            <TeacherShimmerSkeleton width={180} height={14} borderRadius={5} style={{ marginTop: 4 }} />
          ) : (
            <Text style={styles.receivedTitle} numberOfLines={1}>
              {announcementTitle}
            </Text>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
    marginRight: 10,
    justifyContent: 'center',
  },
  heading: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  receivedTitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 2,
  },
});
