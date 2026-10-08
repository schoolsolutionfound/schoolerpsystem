import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Announcement } from '../types';
import { Colors, BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { AppBadge } from '../../shared/components/AppBadge';

interface AnnouncementCardProps {
  announcement: Announcement;
  onPress: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
  onPublish?: (announcement: Announcement) => void;
  onCancel?: (announcement: Announcement) => void;
  isManagement?: boolean;
  disabled?: boolean;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onPress,
  onEdit,
  onDelete,
  onPublish,
  onCancel,
  isManagement = false,
  disabled = false,
}) => {
  const isUrgent = announcement.priority === 'URGENT' || announcement.type === 'URGENT';
  const isHigh = announcement.priority === 'HIGH';

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'URGENT':
        return { bg: '#FEF2F2', text: Colors.light.danger, border: '#FECACA' };
      case 'EVENT':
        return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
      case 'ACADEMIC':
        return { bg: '#F0FDF4', text: Colors.light.success, border: '#DCFCE7' };
      case 'NOTICE':
        return { bg: '#FEF3C7', text: Colors.light.warning, border: '#FDE68A' };
      default:
        return { bg: '#FFF4C7', text: Colors.light.primary, border: '#E8E5DC' };
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { bg: '#FEE2E2', text: Colors.light.danger };
      case 'HIGH':
        return { bg: '#FFEDD5', text: '#C2410C' };
      case 'LOW':
        return { bg: '#E0F2FE', text: '#0284C7' };
      case 'NORMAL':
      default:
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const getStatusBadgeType = (status: string): any => {
    switch (status) {
      case 'PUBLISHED':
        return 'active';
      case 'DRAFT':
        return 'school';
      case 'SCHEDULED':
        return 'trial';
      case 'EXPIRED':
      case 'CANCELLED':
        return 'inactive';
      default:
        return 'active';
    }
  };

  const typeStyle = getTypeBadgeColor(announcement.type);
  const priorityStyle = getPriorityStyle(announcement.priority);

  const formattedDate = announcement.publishAt
    ? new Date(announcement.publishAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : new Date(announcement.createdAt).toLocaleDateString();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isUrgent && styles.urgentCard,
        isHigh && styles.highCard,
      ]}
      onPress={() => !disabled && onPress(announcement)}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <View style={styles.headerRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }]}>
            <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>{announcement.type}</Text>
          </View>

          {announcement.priority !== 'NORMAL' && (
            <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
              <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
                {announcement.priority}
              </Text>
            </View>
          )}

          {isManagement && (
            <AppBadge label={announcement.status} type={getStatusBadgeType(announcement.status)} />
          )}
        </View>

        {!announcement.isRead && !isManagement && (
          <View style={styles.unreadDot} />
        )}
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {announcement.title}
      </Text>

      <Text style={styles.preview} numberOfLines={3}>
        {announcement.content}
      </Text>

      <View style={styles.footerRow}>
        <View style={styles.dateContainer}>
          <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.light.muted} />
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>

        {isManagement && (
          <View style={styles.actionRow}>
            {announcement.status === 'DRAFT' && onPublish && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => !disabled && onPublish(announcement)}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="send-outline" size={18} color={Colors.light.success} />
              </TouchableOpacity>
            )}

            {(announcement.status === 'DRAFT' || announcement.status === 'SCHEDULED' || announcement.status === 'PUBLISHED') && onEdit && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => !disabled && onEdit(announcement)}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.light.secondary} />
              </TouchableOpacity>
            )}

            {announcement.status === 'DRAFT' && onDelete && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => !disabled && onDelete(announcement)}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.light.danger} />
              </TouchableOpacity>
            )}

            {(announcement.status === 'SCHEDULED' || announcement.status === 'PUBLISHED') && onCancel && (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => !disabled && onCancel(announcement)}
                disabled={disabled}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="close-circle-outline" size={18} color={Colors.light.warning} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: 16,
    gap: 10,
    marginBottom: 12,
  },
  urgentCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  highCard: {
    borderColor: '#FDBA74',
    backgroundColor: '#FFF7ED',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.primary,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  preview: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
});
