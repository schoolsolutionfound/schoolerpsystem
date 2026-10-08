import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  useAnnouncementFeedQuery,
  useUnreadAnnouncementCountQuery,
  useMarkAnnouncementReadMutation,
} from '../hooks/useAnnouncements';
import { AnnouncementList } from './AnnouncementList';
import { AnnouncementFilterState, Announcement } from '../types';
import { Colors } from '../../../constants/theme';

export const UserAnnouncementFeedView: React.FC = () => {
  const [filters, setFilters] = useState<AnnouncementFilterState>({
    search: '',
    type: 'ALL',
    priority: 'ALL',
  });

  const queryPayload = {
    search: filters.search || undefined,
    limit: 50,
    offset: 0,
  };

  const { data, isLoading, isRefetching, error, refetch } = useAnnouncementFeedQuery(queryPayload);
  const { data: unreadData, refetch: refetchUnread } = useUnreadAnnouncementCountQuery();
  const markReadMutation = useMarkAnnouncementReadMutation();

  const handleFilterChange = useCallback((newFilters: Partial<AnnouncementFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchUnread()]);
  }, [refetch, refetchUnread]);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err: any) {
      Alert.alert('Announcement Error', err?.message || 'Failed to mark announcement as read');
    }
  }, [markReadMutation]);

  const rawItems = data?.items || [];
  const unreadCount = unreadData?.unreadCount || 0;

  // Filter client side by type, priority if specified
  const filteredItems = rawItems.filter((item: Announcement) => {
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchContent = item.content.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    if (filters.type && filters.type !== 'ALL' && item.type !== filters.type) {
      return false;
    }
    if (filters.priority && filters.priority !== 'ALL' && item.priority !== filters.priority) {
      return false;
    }
    return true;
  });

  const total = data?.total ?? filteredItems.length;

  return (
    <View style={styles.container}>
      <AnnouncementList
        items={filteredItems}
        total={total}
        loading={isLoading}
        refreshing={isRefetching}
        error={error}
        onRefresh={handleRefresh}
        filters={filters}
        onFilterChange={handleFilterChange}
        onMarkRead={handleMarkRead}
        isManagement={false}
        unreadCount={unreadCount}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
});
