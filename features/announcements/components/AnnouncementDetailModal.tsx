import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppModal } from '../../shared/components/AppModal';
import { Announcement } from '../types';
import { Colors } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface AnnouncementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  onMarkRead?: (id: string) => void;
  onDelete?: (announcement: Announcement) => void;
  isUserFeed?: boolean;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  visible,
  onClose,
  announcement,
  onMarkRead,
  onDelete,
  isUserFeed = false,
}) => {
  const annId = announcement?.id;
  const isRead = announcement?.isRead;

  useEffect(() => {
    if (visible && annId && isUserFeed && !isRead && onMarkRead) {
      onMarkRead(annId);
    }
  }, [visible, annId, isUserFeed, isRead, onMarkRead]);

  if (!announcement) return null;

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

  const targetRoleInfo = React.useMemo(() => {
    if (!announcement?.targets || announcement.targets.length === 0) {
      return { label: 'All', icon: 'account-group-outline' as const, desc: 'Visible to everyone (Students & Teachers)' };
    }
    const first = announcement.targets[0];
    if (first.targetType === 'all') {
      return { label: 'All', icon: 'account-group-outline' as const, desc: 'Visible to everyone (Students & Teachers)' };
    }
    const role = (first.targetRole || '').toLowerCase().trim();
    if (role === 'student') {
      return { label: 'Student', icon: 'school-outline' as const, desc: 'Visible to Student accounts only' };
    }
    if (role === 'teacher') {
      return { label: 'Teacher', icon: 'account-tie-outline' as const, desc: 'Visible to Teacher accounts only' };
    }
    return {
      label: first.targetRole ? first.targetRole.charAt(0).toUpperCase() + first.targetRole.slice(1) : 'All',
      icon: 'account-group-outline' as const,
      desc: 'Targeted role',
    };
  }, [announcement?.targets]);

  const handleDeletePress = () => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${announcement.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onClose();
            onDelete?.(announcement);
          },
        },
      ]
    );
  };

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Announcement Details"
      cardStyle={{ borderRadius: 14 }}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <Text style={styles.title}>{announcement.title}</Text>

        {/* Meta Cards: Time Period & Target Role */}
        <View style={styles.metaContainer}>
          <View style={styles.metaCard}>
            <MaterialCommunityIcons name="calendar-clock-outline" size={18} color="#171717" />
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Time Period</Text>
              <Text style={styles.metaValue}>{timePeriodText}</Text>
            </View>
          </View>

          <View style={styles.metaCardRole}>
            <MaterialCommunityIcons name={targetRoleInfo.icon} size={18} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabelRole}>Target Role</Text>
              <Text style={styles.metaValueRole}>{targetRoleInfo.label}</Text>
              <Text style={styles.metaSubtext}>{targetRoleInfo.desc}</Text>
            </View>
          </View>
        </View>

        {/* Content Box */}
        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{announcement.content}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeletePress}
              activeOpacity={0.8}
            >
              <Text style={styles.deleteBtnText} numberOfLines={1}>Delete Announcement</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#171717',
    lineHeight: 24,
  },
  metaContainer: {
    gap: 10,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 12,
    padding: 12,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#171717',
    marginTop: 1,
  },
  metaCardRole: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
  },
  metaLabelRole: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#92400E',
    textTransform: 'uppercase',
  },
  metaValueRole: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#92400E',
    marginTop: 1,
  },
  metaSubtext: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#B45309',
    marginTop: 2,
  },
  contentBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  contentText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#334155',
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  deleteBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  deleteBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
    textAlign: 'center',
  },
  closeBtn: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C430',
    borderRadius: 10,
    paddingHorizontal: 8,
  },
  closeBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
    textAlign: 'center',
  },
});
