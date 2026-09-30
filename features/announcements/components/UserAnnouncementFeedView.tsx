import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
    limit: 50,
    offset: 0,
  };

  const { data, isLoading, error, refetch } = useAnnouncementFeedQuery(queryPayload);
  const { data: unreadData } = useUnreadAnnouncementCountQuery();
  const markReadMutation = useMarkAnnouncementReadMutation();

  const handleFilterChange = (newFilters: Partial<AnnouncementFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleMarkRead = async (id: string) => {
    await markReadMutation.mutateAsync(id);
  };

  const rawItems = data?.items || [];
  const total = data?.total || 0;
  const unreadCount = unreadData?.unreadCount || 0;

  // Filter client side by search, type, priority if specified
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

  return (
    <View style={styles.container}>
      <AnnouncementList
        items={filteredItems}
        total={total}
        loading={isLoading}
        error={error}
        onRefresh={refetch}
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
