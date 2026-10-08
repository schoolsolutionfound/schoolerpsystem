import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  useAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useDeleteAnnouncementMutation,
  usePublishAnnouncementMutation,
  useCancelAnnouncementMutation,
  useMarkAnnouncementReadMutation,
} from '../hooks/useAnnouncements';
import { AnnouncementList } from './AnnouncementList';
import { AnnouncementFilterState } from '../types';
import { Colors } from '../../../constants/theme';

export const AdminAnnouncementsView: React.FC = () => {
  const [filters, setFilters] = useState<AnnouncementFilterState>({
    search: '',
    type: 'ALL',
    status: 'ALL',
    priority: 'ALL',
  });

  const queryPayload = {
    search: filters.search || undefined,
    type: filters.type !== 'ALL' ? filters.type : undefined,
    status: filters.status !== 'ALL' ? filters.status : undefined,
    priority: filters.priority !== 'ALL' ? filters.priority : undefined,
    limit: 100,
    offset: 0,
  };

  const { data, isLoading, isRefetching, error, refetch } = useAnnouncementsQuery(queryPayload);
  const createMutation = useCreateAnnouncementMutation();
  const updateMutation = useUpdateAnnouncementMutation();
  const deleteMutation = useDeleteAnnouncementMutation();
  const publishMutation = usePublishAnnouncementMutation();
  const cancelMutation = useCancelAnnouncementMutation();
  const markReadMutation = useMarkAnnouncementReadMutation();

  const isActionLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    publishMutation.isPending ||
    cancelMutation.isPending ||
    markReadMutation.isPending;

  const handleFilterChange = useCallback((newFilters: Partial<AnnouncementFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleCreate = useCallback(async (payload: any) => {
    try {
      await createMutation.mutateAsync(payload);
    } catch (err: any) {
      Alert.alert('Announcement Error', err?.message || 'Failed to create announcement');
    }
  }, [createMutation]);

  const handleUpdate = useCallback(async (id: string, payload: any) => {
    try {
      await updateMutation.mutateAsync({ id, payload });
    } catch (err: any) {
      Alert.alert('Announcement Error', err?.message || 'Failed to update announcement');
    }
  }, [updateMutation]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: any) {
      Alert.alert('Announcement Error', err?.message || 'Failed to delete announcement');
    }
  }, [deleteMutation]);

  const handlePublish = useCallback(async (id: string) => {
    try {
      await publishMutation.mutateAsync(id);
    } catch (err: any) {
      Alert.alert('Announcement Error', err?.message || 'Failed to publish announcement');
    }
  }, [publishMutation]);

  const handleCancel = useCallback(async (id: string) => {
    try {
      await cancelMutation.mutateAsync(id);
    } catch (err: any) {
      Alert.alert('Announcement Error', err?.message || 'Failed to cancel announcement');
    }
  }, [cancelMutation]);

  const handleMarkRead = useCallback(async (id: string) => {
    try {
      await markReadMutation.mutateAsync(id);
    } catch (err: any) {
      Alert.alert('Announcement Error', err?.message || 'Failed to mark as read');
    }
  }, [markReadMutation]);

  const items = data?.items || [];
  const total = data?.total ?? items.length;

  return (
    <View style={styles.container}>
      <AnnouncementList
        items={items}
        total={total}
        loading={isLoading}
        refreshing={isRefetching}
        error={error}
        onRefresh={refetch}
        filters={filters}
        onFilterChange={handleFilterChange}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onPublish={handlePublish}
        onCancel={handleCancel}
        onMarkRead={handleMarkRead}
        isManagement={true}
        actionLoading={isActionLoading}
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
