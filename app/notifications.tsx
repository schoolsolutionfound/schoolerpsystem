import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../constants/fonts';
import { useUserStore } from '../store/useUserStore';
import { AdminNotificationSender } from '../features/notifications/components/AdminNotificationSender';
import { NotificationPreferencesPanel } from '../features/notifications/components/NotificationPreferencesPanel';
import {
  getMyNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
  NotificationItem,
} from '../api/notifications';
import { showAlert } from '../features/shared/utils/showAlert';

const TYPE_ICONS: Record<string, string> = {
  attendance: 'account-check',
  fee: 'cash',
  exam: 'file-document-edit',
  homework: 'notebook-edit',
  timetable: 'calendar-clock',
  announcement: 'bullhorn',
  bus: 'bus',
  library: 'book-open',
  chat: 'message-text',
  admission: 'school',
  system: 'cog',
  reminder: 'bell-ring',
  general: 'bell',
};

const TYPE_COLORS: Record<string, string> = {
  attendance: '#16A34A',
  fee: '#F4C430',
  exam: '#3B82F6',
  homework: '#8B5CF6',
  timetable: '#F97316',
  announcement: '#EF4444',
  bus: '#06B6D4',
  library: '#84CC16',
  chat: '#EC4899',
  admission: '#6366F1',
  system: '#6B7280',
  reminder: '#F59E0B',
  general: '#6B7280',
};

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'fee', label: 'Fees' },
  { key: 'exam', label: 'Exams' },
  { key: 'homework', label: 'Homework' },
  { key: 'announcement', label: 'Alerts' },
] as const;

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCompose, setShowCompose] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const userRole = useUserStore((state) => state.userRole);
  const canCompose = userRole === 'admin' || userRole === 'principal';
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);

  const fetchNotifications = useCallback(
    async (reset: boolean = false) => {
      try {
        if (reset) {
          pageRef.current = 0;
          hasMoreRef.current = true;
        }

        const offset = reset ? 0 : pageRef.current * 20;
        const params: any = { limit: 20, offset };
        if (activeFilter === 'unread') params.unreadOnly = true;
        else if (activeFilter !== 'all') params.type = activeFilter;

        const data = await getMyNotificationsApi(params);
        if (reset) {
          setNotifications(data.items);
        } else {
          setNotifications((prev) => [...prev, ...data.items]);
        }
        hasMoreRef.current = offset + data.items.length < data.total;
        pageRef.current += 1;
      } catch {
        // silent — pull-to-refresh will retry
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeFilter]
  );

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await getMyNotificationsApi({ limit: 1, unreadOnly: true });
      setUnreadCount(data.total);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void fetchNotifications(true);
    getMyNotificationsApi({ limit: 1, unreadOnly: true })
      .then((d) => setUnreadCount(d.total))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications(true);
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const onLoadMore = useCallback(() => {
    if (!loadingMore && hasMoreRef.current) {
      setLoadingMore(true);
      fetchNotifications(false);
    }
  }, [loadingMore, fetchNotifications]);

  const handleMarkAsRead = useCallback(
    async (item: NotificationItem) => {
      if (item.readAt) return;
      try {
        await markNotificationReadApi(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString(), status: 'read' } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // silent
      }
    },
    []
  );

  const handleMarkAllRead = useCallback(async () => {
    if (unreadCount === 0) return;
    Alert.alert('Mark All Read', 'Mark all notifications as read?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          try {
            await markAllNotificationsReadApi();
            setNotifications((prev) =>
              prev.map((n) => ({ ...n, readAt: new Date().toISOString(), status: 'read' }))
            );
            setUnreadCount(0);
          } catch (error: any) {
            showAlert('Error', error.message || 'Failed to mark all as read');
          }
        },
      },
    ]);
  }, [unreadCount]);

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const isUnread = !item.readAt;
    const icon = TYPE_ICONS[item.type] || 'bell';
    const color = TYPE_COLORS[item.type] || '#6B7280';

    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.unreadCard]}
        onPress={() => handleMarkAsRead(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, isUnread && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.body} numberOfLines={2}>
            {item.body}
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
            <View style={[styles.typeBadge, { backgroundColor: `${color}15` }]}>
              <Text style={[styles.typeBadgeText, { color }]}>{item.type}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyBody}>
        {activeFilter === 'unread'
          ? "You're all caught up!"
          : 'Notifications will appear here'}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>
          {showCompose ? 'Broadcast' : 'Notifications'}
        </Text>
        <TouchableOpacity
          onPress={() => setShowPrefs(true)}
          style={styles.markAllButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="cog-outline" size={20} color="#171717" />
        </TouchableOpacity>
        {canCompose && (
          <TouchableOpacity
            onPress={() => setShowCompose((v) => !v)}
            style={[styles.markAllButton, showCompose && styles.composeActive]}
          >
            <MaterialCommunityIcons
              name={showCompose ? 'format-list-bulleted' : 'bullhorn'}
              size={18}
              color={showCompose ? '#F4C430' : '#171717'}
            />
          </TouchableOpacity>
        )}
        {!showCompose && unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <MaterialCommunityIcons name="email-open" size={16} color="#F4C430" />
          <Text style={styles.unreadBannerText}>{unreadCount} unread notifications</Text>
        </View>
      )}

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
            onPress={() => setActiveFilter(item.key)}
          >
            <Text
              style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (loading && !showCompose && !showPrefs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Notifications</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4C430" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (showPrefs) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => setShowPrefs(false)}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Notification Settings</Text>
        </View>
        <NotificationPreferencesPanel />
      </SafeAreaView>
    );
  }

  if (showCompose) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Broadcast</Text>
          <TouchableOpacity
            onPress={() => setShowCompose(false)}
            style={styles.markAllButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#171717" />
          </TouchableOpacity>
        </View>
        <AdminNotificationSender />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F4C430" />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator size="small" color="#F4C430" style={styles.footerLoader} />
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#171717',
    flex: 1,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  composeActive: {
    backgroundColor: '#171717',
    borderRadius: 8,
  },
  markAllText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#F4C430',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  unreadBannerText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F7F5EE',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  filterChipActive: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },
  filterText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B6B6B',
  },
  filterTextActive: {
    color: '#F4C430',
  },
  listContent: {
    paddingBottom: 24,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  unreadCard: {
    backgroundColor: '#FFFDF7',
    borderLeftWidth: 3,
    borderLeftColor: '#F4C430',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: '#171717',
    flex: 1,
  },
  unreadTitle: {
    fontFamily: FontFamily.bold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4C430',
    marginLeft: 8,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#8A8A8A',
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#171717',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#8A8A8A',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: '#8A8A8A',
    marginTop: 12,
  },
  footerLoader: {
    paddingVertical: 16,
  },
});
