import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppModal } from '../../shared/components/AppModal';
import { AppBadge } from '../../shared/components/AppBadge';
import { Announcement } from '../types';
import { Colors, BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface AnnouncementDetailModalProps {
  visible: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  onMarkRead?: (id: string) => void;
  isUserFeed?: boolean;
}

export const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  visible,
  onClose,
  announcement,
  onMarkRead,
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

  const formattedPublish = announcement.publishAt
    ? new Date(announcement.publishAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date(announcement.createdAt).toLocaleDateString();

  const formattedExpires = announcement.expiresAt
    ? new Date(announcement.expiresAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  const openLink = (url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return { bg: '#FEE2E2', text: '#DC2626' };
      case 'HIGH':
        return { bg: '#FFEDD5', text: '#C2410C' };
      case 'LOW':
        return { bg: '#E0F2FE', text: '#0284C7' };
      case 'NORMAL':
      default:
        return { bg: '#FEF3C7', text: '#D97706' };
    }
  };

  const priorityStyle = getPriorityStyle(announcement.priority);

  return (
    <AppModal visible={visible} onClose={onClose} title="Announcement Details">
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <AppBadge label={announcement.type} type="active" />
          <View style={[styles.priorityBadge, { backgroundColor: priorityStyle.bg }]}>
            <Text style={[styles.priorityText, { color: priorityStyle.text }]}>
              {announcement.priority}
            </Text>
          </View>
          <AppBadge label={announcement.status} type="college" />
        </View>

        <Text style={styles.title}>{announcement.title}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.light.muted} />
            <Text style={styles.metaText}>Published: {formattedPublish}</Text>
          </View>
          {formattedExpires && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="timer-off-outline" size={14} color={Colors.light.danger} />
              <Text style={styles.metaText}>Expires: {formattedExpires}</Text>
            </View>
          )}
        </View>

        {announcement.imageUrl ? (
          <Image source={{ uri: announcement.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : null}

        <View style={styles.contentBox}>
          <Text style={styles.contentText}>{announcement.content}</Text>
        </View>

        {announcement.attachmentUrl ? (
          <TouchableOpacity
            style={styles.attachmentCard}
            onPress={() => openLink(announcement.attachmentUrl!)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="file-document-outline" size={24} color={Colors.light.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.attachmentTitle}>Document Attachment</Text>
              <Text style={styles.attachmentSub}>Tap to view or download file</Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={18} color={Colors.light.muted} />
          </TouchableOpacity>
        ) : null}

        {announcement.targets && announcement.targets.length > 0 && (
          <View style={styles.targetSection}>
            <Text style={styles.targetHeading}>Target Audience</Text>
            {announcement.targets.map((t, idx) => (
              <View key={idx} style={styles.targetTag}>
                <MaterialCommunityIcons name="account-group-outline" size={14} color={Colors.light.secondary} />
                <Text style={styles.targetText}>
                  Type: {t.targetType.toUpperCase()}
                  {t.targetRole ? ` • Role: ${t.targetRole}` : ''}
                  {t.classId ? ` • Class: ${t.classId}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AppModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
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
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    lineHeight: 24,
  },
  metaRow: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.card,
  },
  contentBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  contentText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: Colors.light.text,
    lineHeight: 22,
  },
  attachmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF4C7',
    padding: 14,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  attachmentTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  attachmentSub: {
    fontSize: 12,
    color: Colors.light.muted,
  },
  targetSection: {
    gap: 6,
    marginTop: 4,
  },
  targetHeading: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: Colors.light.text,
  },
  targetTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  targetText: {
    fontSize: 12,
    color: Colors.light.text,
    fontFamily: FontFamily.medium,
  },
});
