import React, { useState } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { AnnouncementCard } from './AnnouncementCard';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { AnnouncementFilters } from './AnnouncementFilters';
import { AnnouncementStatsHeader } from './AnnouncementStatsHeader';
import { Announcement, AnnouncementFilterState } from '../types';
import { LoadingView } from '../../shared/components/LoadingView';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { AppButton } from '../../shared/components/AppButton';
import { Colors } from '../../../constants/theme';

interface AnnouncementListProps {
  items: Announcement[];
  total: number;
  loading: boolean;
  refreshing?: boolean;
  error?: any;
  onRefresh: () => void;
  filters: AnnouncementFilterState;
  onFilterChange: (filters: Partial<AnnouncementFilterState>) => void;
  onCreate?: (payload: any) => Promise<void>;
  onUpdate?: (id: string, payload: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onPublish?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  onMarkRead?: (id: string) => Promise<void>;
  isManagement?: boolean;
  unreadCount?: number;
  actionLoading?: boolean;
}

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  items,
  total,
  loading,
  refreshing = false,
  error,
  onRefresh,
  filters,
  onFilterChange,
  onCreate,
  onUpdate,
  onDelete,
  onPublish,
  onCancel,
  onMarkRead,
  isManagement = false,
  unreadCount = 0,
  actionLoading = false,
}) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const publishedCount = items.filter((i) => i.status === 'PUBLISHED').length;
  const scheduledCount = items.filter((i) => i.status === 'SCHEDULED').length;
  const draftCount = items.filter((i) => i.status === 'DRAFT').length;

  const handleCreateSubmit = async (payload: any) => {
    if (editingAnnouncement && onUpdate) {
      await onUpdate(editingAnnouncement.id, payload);
    } else if (onCreate) {
      await onCreate(payload);
    }
    setEditingAnnouncement(null);
    setCreateModalVisible(false);
  };

  const handleCardEdit = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    setCreateModalVisible(true);
  };

  const handleCardDelete = async (ann: Announcement) => {
    if (onDelete) await onDelete(ann.id);
  };

  const handleCardPublish = async (ann: Announcement) => {
    if (onPublish) await onPublish(ann.id);
  };

  const handleCardCancel = async (ann: Announcement) => {
    if (onCancel) await onCancel(ann.id);
  };

  if (loading && items.length === 0 && !error) {
    return <LoadingView message="Loading announcements..." />;
  }

  if (error && items.length === 0) {
    return (
      <ErrorState
        message={error.message || 'Failed to load announcements'}
        onRetry={onRefresh}
      />
    );
  }

  return (
    <View style={styles.container}>
      {isManagement && onCreate && (
        <View style={styles.topActionRow}>
          <AppButton
            title="New Announcement"
            iconName="plus"
            disabled={actionLoading}
            onPress={() => {
              setEditingAnnouncement(null);
              setCreateModalVisible(true);
            }}
          />
        </View>
      )}

      <AnnouncementStatsHeader
        total={total}
        publishedCount={publishedCount}
        scheduledCount={scheduledCount}
        draftCount={draftCount}
        unreadCount={unreadCount}
        isManagement={isManagement}
      />

      <AnnouncementFilters
        filters={filters}
        onFilterChange={onFilterChange}
        isManagement={isManagement}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AnnouncementCard
            announcement={item}
            onPress={(ann) => setSelectedAnnouncement(ann)}
            onEdit={isManagement ? handleCardEdit : undefined}
            onDelete={isManagement ? handleCardDelete : undefined}
            onPublish={isManagement ? handleCardPublish : undefined}
            onCancel={isManagement ? handleCardCancel : undefined}
            isManagement={isManagement}
            disabled={actionLoading}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            iconName="bullhorn-outline"
            title="No Announcements Found"
            description="No announcements match your search or selected filters."
          />
        }
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && { flexGrow: 1, justifyContent: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={Colors.light.primary}
          />
        }
      />

      <AnnouncementDetailModal
        visible={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        announcement={selectedAnnouncement}
        onMarkRead={onMarkRead}
        isUserFeed={!isManagement}
      />

      {isManagement && (
        <CreateAnnouncementModal
          visible={createModalVisible}
          onClose={() => {
            setCreateModalVisible(false);
            setEditingAnnouncement(null);
          }}
          onSubmit={handleCreateSubmit}
          initialData={editingAnnouncement}
          loading={actionLoading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topActionRow: {
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
});
