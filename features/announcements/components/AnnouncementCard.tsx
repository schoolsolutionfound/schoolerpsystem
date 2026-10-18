import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Announcement } from '../types';
import { Colors } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onPublish?: (announcement: Announcement) => void;
  onCancel?: (announcement: Announcement) => void;
  isManagement?: boolean;
  disabled?: boolean;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onPress,
  onDelete,
  disabled = false,
}) => {
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const startDate = formatDate(announcement.publishAt || announcement.createdAt);
  const endDate = formatDate(announcement.expiresAt);

  const timePeriodText = endDate
    ? `${startDate} – ${endDate}`
    : `From ${startDate}`;

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${announcement.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(announcement),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => !disabled && onPress(announcement)}
      activeOpacity={0.8}
      disabled={disabled}
    >
      {/* Top Row: Title & Delete Option */}
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={2}>
          {announcement.title}
        </Text>

        {onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeletePress}
            disabled={disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Announcement Content */}
      <Text style={styles.content} numberOfLines={4}>
        {announcement.content}
      </Text>

      {/* Time Period Display */}
      <View style={styles.periodRow}>
        <View style={styles.periodBadge}>
          <MaterialCommunityIcons name="calendar-clock-outline" size={15} color="#171717" />
          <Text style={styles.periodLabel}>Time Period:</Text>
          <Text style={styles.periodValue}>{timePeriodText}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
    lineHeight: 22,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  deleteText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#DC2626',
  },
  content: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#334155',
    lineHeight: 20,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  periodLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  periodValue: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
});
