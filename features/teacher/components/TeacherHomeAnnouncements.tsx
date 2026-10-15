import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { apiClient } from '../../../api/client';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  department?: string;
  priority?: 'normal' | 'important' | 'urgent';
  authorName?: string;
  authorRole?: string;
  createdAt?: string;
}

export const TeacherHomeAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ success?: boolean; data?: AnnouncementItem[] }>('/announcements');
      const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setAnnouncements(items);
    } catch {
      // Keep empty list gracefully if offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const latest = announcements[0];
  const count = announcements.length;

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => setModalVisible(true)}
      >
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#1A1B1C" />
        </View>

        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.title}>Announcements</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{loading ? '...' : count}</Text>
            </View>
          </View>

          {loading ? (
            <Text style={styles.sub}>Checking for updates...</Text>
          ) : latest ? (
            <>
              <Text style={styles.body} numberOfLines={1}>
                {latest.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.authorText}>
                  By {latest.authorName || (latest.authorRole === 'principal' ? 'Principal' : latest.authorRole === 'hod' ? 'HOD' : 'Administration')}
                </Text>
                {latest.department ? (
                  <Text style={styles.deptText}>• {latest.department}</Text>
                ) : null}
              </View>
            </>
          ) : (
            <>
              <Text style={styles.body}>No active announcements.</Text>
              <Text style={styles.sub}>Circulars from Principal & HOD appear here.</Text>
            </>
          )}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Announcements Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconWrap}>
                  <MaterialCommunityIcons name="bullhorn" size={20} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Circulars & Notices</Text>
                  <Text style={styles.modalSub}>Official updates from Principal & Department</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
              >
                <MaterialCommunityIcons name="close" size={20} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <View style={styles.emptyBox}>
                  <ActivityIndicator size="small" color="#F4C430" />
                  <Text style={styles.sub}>Loading circulars...</Text>
                </View>
              ) : announcements.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialCommunityIcons name="bell-sleep-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyTitle}>No announcements found</Text>
                  <Text style={styles.sub}>New broadcasts will appear here in real time.</Text>
                </View>
              ) : (
                announcements.map((a) => {
                  const isUrgent = a.priority === 'urgent';
                  const isImportant = a.priority === 'important';
                  const dateStr = a.createdAt
                    ? new Date(a.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <View key={a.id} style={styles.noticeCard}>
                      <View style={styles.noticeTop}>
                        <View style={styles.noticeBadges}>
                          {isUrgent && (
                            <View style={styles.urgentBadge}>
                              <Text style={styles.urgentText}>URGENT</Text>
                            </View>
                          )}
                          {isImportant && (
                            <View style={styles.importantBadge}>
                              <Text style={styles.importantText}>IMPORTANT</Text>
                            </View>
                          )}
                          {a.department ? (
                            <View style={styles.deptBadge}>
                              <Text style={styles.deptBadgeText}>{a.department.toUpperCase()}</Text>
                            </View>
                          ) : (
                            <View style={styles.campusBadge}>
                              <Text style={styles.campusBadgeText}>CAMPUS-WIDE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.dateText}>{dateStr}</Text>
                      </View>

                      <Text style={styles.noticeTitle}>{a.title}</Text>
                      <Text style={styles.noticeContent}>{a.content}</Text>

                      <View style={styles.noticeFooter}>
                        <MaterialCommunityIcons
                          name={
                            a.authorRole === 'principal'
                              ? 'shield-check'
                              : a.authorRole === 'hod'
                              ? 'account-tie'
                              : 'account'
                          }
                          size={14}
                          color="#D97706"
                        />
                        <Text style={styles.authorBadgeText}>
                          {a.authorName || 'School Administration'}{' '}
                          {a.authorRole ? `(${a.authorRole.toUpperCase()})` : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
  body: { fontSize: 13, color: '#171717', fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  authorText: { fontSize: 11, color: '#D97706', fontWeight: '600' },
  deptText: { fontSize: 11, color: '#6B6B6B' },
  sub: { fontSize: 11, color: '#6B6B6B' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  modalSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  modalScroll: {
    paddingHorizontal: 18,
  },
  modalScrollContent: {
    paddingVertical: 14,
    gap: 12,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  noticeCard: {
    backgroundColor: '#FAFAF9',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E7E5E4',
    padding: 14,
    gap: 8,
  },
  noticeTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noticeBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: FontFamily.extrabold,
  },
  importantBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importantText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    fontFamily: FontFamily.extrabold,
  },
  deptBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  deptBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#1D4ED8',
    fontFamily: FontFamily.bold,
  },
  campusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  campusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: FontFamily.bold,
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  noticeTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  noticeContent: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    lineHeight: 18,
  },
  noticeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E7E5E4',
  },
  authorBadgeText: {
    fontSize: 11,
    color: '#78716C',
    fontWeight: '600',
    fontFamily: FontFamily.medium,
  },
});
