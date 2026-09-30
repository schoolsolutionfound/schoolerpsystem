import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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

  const { data, isLoading, error, refetch } = useAnnouncementsQuery(queryPayload);
  const createMutation = useCreateAnnouncementMutation();
  const updateMutation = useUpdateAnnouncementMutation();
  const deleteMutation = useDeleteAnnouncementMutation();
  const publishMutation = usePublishAnnouncementMutation();
  const cancelMutation = useCancelAnnouncementMutation();
  const markReadMutation = useMarkAnnouncementReadMutation();

  const handleFilterChange = (newFilters: Partial<AnnouncementFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleCreate = async (payload: any) => {
    await createMutation.mutateAsync(payload);
  };

  const handleUpdate = async (id: string, payload: any) => {
    await updateMutation.mutateAsync({ id, payload });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handlePublish = async (id: string) => {
    await publishMutation.mutateAsync(id);
  };

  const handleCancel = async (id: string) => {
    await cancelMutation.mutateAsync(id);
  };

  const handleMarkRead = async (id: string) => {
    await markReadMutation.mutateAsync(id);
  };

  const items = data?.items || [];
  const total = data?.total || 0;

  return (
    <View style={styles.container}>
      <AnnouncementList
        items={items}
        total={total}
        loading={isLoading}
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
