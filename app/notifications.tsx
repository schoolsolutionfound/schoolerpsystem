import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { FontFamily } from '../constants/fonts';
import { BorderRadius } from '../constants/theme';
import { useAnnouncementFeedQuery } from '../features/announcements/hooks/useAnnouncements';
import { useClassTransferStore, ClassTransferRequest } from '../features/teacher/services/classTransferStore';

type NotificationCategory = 'all' | 'unread' | 'academics' | 'attendance' | 'announcements' | 'system';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'academics' | 'attendance' | 'announcements' | 'system';
  timestamp: string;
  isRead: boolean;
  priority?: 'high' | 'normal' | 'low';
  transferRequest?: ClassTransferRequest;
}

function formatNotifTime(isoString?: string): string {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

const DEFAULT_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    title: 'Daily Attendance Pending',
    message: 'Morning attendance for Class 10th-A has not been marked. Please submit records before 11:30 AM.',
    category: 'attendance',
    timestamp: '15 min ago',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif_2',
    title: 'Mid-Term Marks Entry Open',
    message: 'Mathematics and Science marks entry for Term 1 examination is now active on your faculty portal.',
    category: 'academics',
    timestamp: '1 hour ago',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif_3',
    title: 'Homework Submissions Received',
    message: '24 students from Class 9th-B have submitted their Algebra assignment for review.',
    category: 'academics',
    timestamp: '3 hours ago',
    isRead: false,
    priority: 'normal',
  },
  {
    id: 'notif_4',
    title: 'Academic Staff Meeting',
    message: 'Monthly faculty meeting scheduled for tomorrow at 3:30 PM in the Principal Conference Hall.',
    category: 'announcements',
    timestamp: 'Yesterday',
    isRead: true,
    priority: 'normal',
  },
  {
    id: 'notif_5',
    title: 'Timetable Adjustment Notice',
    message: 'Thursday Period 3 has been rescheduled to Science Laboratory 2 due to practical demonstrations.',
    category: 'academics',
    timestamp: '2 days ago',
    isRead: true,
    priority: 'normal',
  },
  {
    id: 'notif_6',
    title: 'Account Security Verification',
    message: 'Your account login credentials and security parameters were verified successfully.',
    category: 'system',
    timestamp: '3 days ago',
    isRead: true,
    priority: 'low',
  },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set(['notif_4', 'notif_5', 'notif_6']));
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());

  const { requests: transferRequests, respondToRequest } = useClassTransferStore();

  // Optionally fetch real announcements from server feed
  const { data: serverAnnouncements, refetch } = useAnnouncementFeedQuery();

  // Combine default system alerts with server announcements and class transfer requests
  const allNotifications: NotificationItem[] = useMemo(() => {
    const list: NotificationItem[] = [];

    // Map Class Transfer Requests (Incoming for current teacher)
    transferRequests.forEach((tr) => {
      const isRecipient = tr.toTeacherId === 'current-user' || tr.toTeacherName.includes('You');
      const isSender = tr.fromTeacherId === 'current-user' || tr.fromTeacherName.includes('You');

      if (isRecipient) {
        list.push({
          id:
            tr.status === 'rejected'
              ? `transfer_recipient_rejected_${tr.id}`
              : tr.status === 'accepted'
              ? `transfer_recipient_accepted_${tr.id}`
              : `transfer_${tr.id}`,
          title:
            tr.status === 'pending'
              ? `Class Transfer: ${tr.fromTeacherName}`
              : tr.status === 'accepted'
              ? `Transfer Accepted (${tr.className})`
              : `Transfer Declined (${tr.className})`,
          message:
            tr.status === 'pending'
              ? `${tr.fromTeacherName} requested you to cover ${tr.className} (${tr.subject}) on ${tr.date} during ${tr.periodLabel} (${tr.startTime} - ${tr.endTime}).${tr.reason ? ` Note: "${tr.reason}"` : ''}`
              : tr.status === 'accepted'
              ? `You accepted the class transfer for ${tr.className} (${tr.subject}) on ${tr.date}.`
              : `You declined the class transfer request from ${tr.fromTeacherName}.`,
          category: 'academics',
          timestamp: formatNotifTime(tr.updatedAt || tr.createdAt),
          isRead:
            tr.status === 'pending'
              ? false
              : tr.status === 'rejected'
              ? readIds.has(`transfer_recipient_rejected_${tr.id}`)
              : readIds.has(`transfer_recipient_accepted_${tr.id}`),
          priority: 'high',
          transferRequest: tr,
        });
      } else if (isSender) {
        list.push({
          id:
            tr.status === 'rejected'
              ? `transfer_rejected_${tr.id}`
              : tr.status === 'accepted'
              ? `transfer_accepted_${tr.id}`
              : `transfer_status_${tr.id}`,
          title:
            tr.status === 'accepted'
              ? `Transfer Accepted by ${tr.toTeacherName}`
              : tr.status === 'rejected'
              ? `Transfer Declined by ${tr.toTeacherName}`
              : `Transfer Sent to ${tr.toTeacherName}`,
          message:
            tr.status === 'accepted'
              ? `${tr.toTeacherName} accepted your request to cover ${tr.className} (${tr.subject}) on ${tr.date}! Today's timetable has been updated.`
              : tr.status === 'rejected'
              ? `${tr.toTeacherName} declined your request to cover ${tr.className} (${tr.subject}) on ${tr.date}. Tap Transfer in Schedule to assign another teacher.`
              : `You requested ${tr.toTeacherName} to cover ${tr.className} (${tr.subject}) on ${tr.date} during ${tr.periodLabel}.`,
          category: 'academics',
          timestamp: formatNotifTime(tr.updatedAt || tr.createdAt),
          isRead:
            tr.status === 'rejected'
              ? readIds.has(`transfer_rejected_${tr.id}`)
              : tr.status === 'accepted'
              ? readIds.has(`transfer_accepted_${tr.id}`)
              : tr.status !== 'pending' && readIds.has(`transfer_status_${tr.id}`),
          priority: 'high',
          transferRequest: tr,
        });
      }
    });

    // Map any server announcements
    if (serverAnnouncements && Array.isArray(serverAnnouncements)) {
      serverAnnouncements.forEach((a: any) => {
        list.push({
          id: `feed_${a.id}`,
          title: a.title || 'School Announcement',
          message: a.content || a.message || '',
          category: 'announcements',
          timestamp: a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Recent',
          isRead: false,
          priority: a.priority || 'normal',
        });
      });
    }

    // Append defaults
    list.push(...DEFAULT_NOTIFICATIONS);

    // Apply read and deleted overrides
    return list
      .filter((n) => !deletedIds.has(n.id))
      .map((n) => ({
        ...n,
        isRead: readIds.has(n.id) || n.isRead,
      }));
  }, [serverAnnouncements, readIds, deletedIds, transferRequests]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return allNotifications.filter((n) => {
      // Category filter
      if (selectedCategory === 'unread' && n.isRead) return false;
      if (
        selectedCategory !== 'all' &&
        selectedCategory !== 'unread' &&
        n.category !== selectedCategory
      ) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = n.title.toLowerCase().includes(q);
        const matchesMessage = n.message.toLowerCase().includes(q);
        return matchesTitle || matchesMessage;
      }

      return true;
    });
  }, [allNotifications, selectedCategory, searchQuery]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter((n) => !n.isRead).length;
  }, [allNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (refetch) await refetch();
    } catch {}
    setRefreshing(false);
  };

  const handleMarkAllAsRead = () => {
    const newRead = new Set(readIds);
    allNotifications.forEach((n) => newRead.add(n.id));
    setReadIds(newRead);
  };

  const handleToggleRead = (id: string) => {
    const newRead = new Set(readIds);
    if (newRead.has(id)) {
      newRead.delete(id);
    } else {
      newRead.add(id);
    }
    setReadIds(newRead);
  };

  const handleDeleteNotification = (id: string) => {
    const newDeleted = new Set(deletedIds);
    newDeleted.add(id);
    setDeletedIds(newDeleted);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to dismiss all current notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            const newDeleted = new Set(deletedIds);
            allNotifications.forEach((n) => newDeleted.add(n.id));
            setDeletedIds(newDeleted);
          },
        },
      ]
    );
  };

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'academics':
        return {
          icon: 'book-open-variant' as const,
          bgColor: '#FEF3C7',
          iconColor: '#D97706',
          label: 'Academics',
        };
      case 'attendance':
        return {
          icon: 'calendar-check' as const,
          bgColor: '#D1FAE5',
          iconColor: '#059669',
          label: 'Attendance',
        };
      case 'announcements':
        return {
          icon: 'bullhorn-outline' as const,
          bgColor: '#DBEAFE',
          iconColor: '#2563EB',
          label: 'Notice',
        };
      case 'system':
      default:
        return {
          icon: 'shield-check-outline' as const,
          bgColor: '#F3F4F6',
          iconColor: '#4B5563',
          label: 'System',
        };
    }
  };

  const categories: { key: NotificationCategory; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: allNotifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'academics', label: 'Academics' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'announcements', label: 'Notices' },
    { key: 'system', label: 'System' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* 1. Header Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Feather name="arrow-left" size={22} color="#171717" />
          </TouchableOpacity>

          <View style={styles.topBarTitleWrap}>
            <Text style={styles.topBarTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.unreadPill}>
                <Text style={styles.unreadPillText}>{unreadCount} new</Text>
              </View>
            )}
          </View>

          <View style={styles.topBarActions}>
            {allNotifications.length > 0 && (
              <TouchableOpacity
                onPress={handleClearAll}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 2. Search Input */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search notifications..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* 3. Category Filter Chips Horizontal Bar */}
        <View style={styles.categoryScrollWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                  {cat.count !== undefined && cat.count > 0 && (
                    <View style={[styles.chipCountBadge, isActive && styles.chipCountBadgeActive]}>
                      <Text style={[styles.chipCountText, isActive && styles.chipCountTextActive]}>
                        {cat.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 4. Notification List */}
        <ScrollView
          style={styles.listContainer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#000000']}
              tintColor="#000000"
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Notifications' : 'All Caught Up!'}
              </Text>
              <Text style={styles.emptySub}>
                {searchQuery
                  ? `No notifications found matching "${searchQuery}".`
                  : 'You have no new alerts right now. Academic updates and announcements will appear here.'}
              </Text>
              {(searchQuery.length > 0 || selectedCategory !== 'all') && (
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.resetFilterBtnText}>View All Notifications</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredNotifications.map((notif) => {
              const cfg = getCategoryConfig(notif.category);
              return (
                <TouchableOpacity
                  key={notif.id}
                  style={styles.notifCard}
                  onPress={() => handleToggleRead(notif.id)}
                  activeOpacity={0.85}
                >
                  {/* Notification Content Body */}
                  <View style={styles.notifBody}>
                    <View style={styles.notifTopRow}>
                      <Text style={styles.categoryTagText}>
                        {cfg.label}
                      </Text>
                      <Text style={styles.timestampText}>{notif.timestamp}</Text>
                    </View>

                    <Text style={[styles.notifTitle, !notif.isRead && styles.notifTitleUnread]}>
                      {notif.title}
                    </Text>

                    <Text style={styles.notifMessage} numberOfLines={3}>
                      {notif.message}
                    </Text>

                    {notif.transferRequest && notif.transferRequest.status === 'pending' && (
                      <View style={styles.notifActionRow}>
                        {notif.transferRequest.toTeacherId === 'current-user' || notif.transferRequest.toTeacherName.includes('You') ? (
                          <>
                            <TouchableOpacity
                              style={styles.notifAcceptBtn}
                              onPress={() => {
                                respondToRequest(notif.transferRequest!.id, 'accepted');
                                Alert.alert(
                                  'Request Accepted',
                                  `You have accepted the transfer for ${notif.transferRequest!.className} (${notif.transferRequest!.subject}). It is now displayed in your Today's Timetable and Schedule.`
                                );
                              }}
                              activeOpacity={0.8}
                            >
                              <Feather name="check" size={13} color="#FFFFFF" />
                              <Text style={styles.notifAcceptBtnText}>Accept</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.notifRejectBtn}
                              onPress={() => {
                                respondToRequest(notif.transferRequest!.id, 'rejected');
                                Alert.alert(
                                  'Request Declined',
                                  `You declined the transfer request from ${notif.transferRequest!.fromTeacherName}.`
                                );
                              }}
                              activeOpacity={0.8}
                            >
                              <Feather name="x" size={13} color="#DC2626" />
                              <Text style={styles.notifRejectBtnText}>Reject</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <>
                            <TouchableOpacity
                              style={styles.notifAcceptBtn}
                              onPress={() => {
                                respondToRequest(notif.transferRequest!.id, 'accepted');
                                Alert.alert(
                                  'Transfer Accepted!',
                                  `${notif.transferRequest!.toTeacherName} accepted your request to cover ${notif.transferRequest!.className} (${notif.transferRequest!.subject}). Today's timetable has been updated.`
                                );
                              }}
                              activeOpacity={0.8}
                            >
                              <Feather name="check" size={13} color="#FFFFFF" />
                              <Text style={styles.notifAcceptBtnText}>
                                Accept ({notif.transferRequest.toTeacherName.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, '').split(' ')[0]})
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.notifRejectBtn}
                              onPress={() => {
                                respondToRequest(notif.transferRequest!.id, 'rejected');
                                Alert.alert(
                                  'Transfer Declined',
                                  `${notif.transferRequest!.toTeacherName} declined the transfer request for ${notif.transferRequest!.className} (${notif.transferRequest!.subject}). Tap Transfer in Schedule to assign another teacher.`
                                );
                              }}
                              activeOpacity={0.8}
                            >
                              <Feather name="x" size={13} color="#DC2626" />
                              <Text style={styles.notifRejectBtnText}>
                                Reject ({notif.transferRequest.toTeacherName.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, '').split(' ')[0]})
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    )}

                    {notif.transferRequest && notif.transferRequest.status === 'accepted' && (
                      <View style={styles.notifStatusPillAccepted}>
                        <Feather name="check-circle" size={12} color="#059669" />
                        <Text style={styles.notifStatusPillTextAccepted}>Accepted — Scheduled</Text>
                      </View>
                    )}

                    {notif.transferRequest && notif.transferRequest.status === 'rejected' && (
                      <View style={styles.notifStatusPillRejected}>
                        <Feather name="x-circle" size={12} color="#DC2626" />
                        <Text style={styles.notifStatusPillTextRejected}>Declined</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFDF7',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  topBarTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  unreadPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#D97706',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#171717',
  },
  categoryScrollWrap: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: FontFamily.semibold,
    color: '#6B7280',
  },
  categoryChipTextActive: {
    color: '#171717',
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  chipCountBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chipCountBadgeActive: {
    backgroundColor: 'rgba(23, 23, 23, 0.12)',
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#6B7280',
  },
  chipCountTextActive: {
    color: '#171717',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  notifCardUnread: {
    backgroundColor: '#FFFDF0',
    borderColor: '#FDE68A',
  },
  notifBody: {
    gap: 6,
  },
  notifTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTagText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#171717',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timestampText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FontFamily.semibold,
    color: '#171717',
  },
  notifTitleUnread: {
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  notifMessage: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    color: '#171717',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  resetFilterBtn: {
    marginTop: 12,
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  resetFilterBtnText: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  notifActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
  },
  notifAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 5,
  },
  notifAcceptBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  notifRejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 5,
  },
  notifRejectBtnText: {
    color: '#DC2626',
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },
  notifStatusPillAccepted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 0.8,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  notifStatusPillTextAccepted: {
    color: '#065F46',
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
  notifStatusPillRejected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEE2E2',
    borderWidth: 0.8,
    borderColor: '#FECDD3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  notifStatusPillTextRejected: {
    color: '#991B1B',
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
});
