import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  useAnnouncementFeedInfiniteQuery,
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
    type: filters.type !== 'ALL' ? filters.type : undefined,
    priority: filters.priority !== 'ALL' ? filters.priority : undefined,
  };

  const {
    data,
    isLoading,
    isRefetching,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useAnnouncementFeedInfiniteQuery(queryPayload);
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

  const rawItems = data?.pages?.flatMap((p) => p?.items || []) ?? [];
  const unreadCount = unreadData?.unreadCount || 0;

  // Client-side filter as a safety net on top of server-side type/priority/search.
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

  const lastPage = data?.pages?.[data.pages.length - 1];
  const total = lastPage?.total ?? rawItems.length;

  return (
    <View style={styles.container}>
      <AnnouncementList
        items={filteredItems}
        total={total}
        loading={isLoading || (!data && !error)}
        refreshing={isRefetching}
        error={error}
        onRefresh={handleRefresh}
        filters={filters}
        onFilterChange={handleFilterChange}
        onMarkRead={handleMarkRead}
        isManagement={false}
        unreadCount={unreadCount}
        onEndReached={hasNextPage ? () => fetchNextPage() : undefined}
        loadingMore={isFetchingNextPage}
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
