import React, { useState, useMemo } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../../../store/useUserStore';
import { AppLayout } from '../../shared/components/AppLayout';
import { LoadingView } from '../../shared/components/LoadingView';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { useDebouncedValue } from '../../shared/hooks/useDebouncedValue';
import { Colors } from '../../../constants/theme';
import { DeveloperHeader } from '../components/DeveloperHeader';
import { InstitutionCard } from '../components/InstitutionCard';
import { CreateInstitutionModal } from '../components/CreateInstitutionModal';
import { EditInstitutionModal } from '../components/EditInstitutionModal';
import { DeleteInstitutionModal } from '../components/DeleteInstitutionModal';
import {
  useInstitutionPagesQuery,
  useCreateInstitutionMutation,
  useUpdateInstitutionMutation,
  useDeleteInstitutionMutation,
} from '../hooks/useDeveloperQueries';
import { Institution, FilterType } from '../types/developer.types';
import {
  CreateInstitutionFormValues,
  UpdateInstitutionFormValues,
} from '../validation/developer.validation';

export function DeveloperDashboardScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Super Admin';

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Institution | null>(null);
  const [deletingItem, setDeletingItem] = useState<Institution | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = useInstitutionPagesQuery({
    search: debouncedSearch,
    type: activeFilter === 'college' ? 'college' : activeFilter === 'school' ? 'school' : undefined,
    status:
      activeFilter === 'active' ? 'active' : activeFilter === 'inactive' ? 'non_active' : undefined,
  });

  const institutions = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data]
  );
  const total = data?.pages[data.pages.length - 1]?.total ?? 0;

  const createMutation = useCreateInstitutionMutation();
  const updateMutation = useUpdateInstitutionMutation();
  const deleteMutation = useDeleteInstitutionMutation();

  const handleCreateSubmit = async (values: CreateInstitutionFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      setIsCreateOpen(false);
    } catch {
      // Error handled via React Query mutation error state
    }
  };

  const handleEditSubmit = async (id: string, values: UpdateInstitutionFormValues) => {
    try {
      await updateMutation.mutateAsync({ id, payload: values });
      setEditingItem(null);
    } catch {
      // Error handled via React Query mutation error state
    }
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeletingItem(null);
    } catch {
      // Error handled via React Query mutation error state
    }
  };

  return (
    <AppLayout scrollable={false}>
      <DeveloperHeader
        fullName={fullName}
        institutionCount={total}
        isFetching={isFetching && !isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onCreatePress={() => setIsCreateOpen(true)}
      />

      <View style={styles.contentWrap}>
        {isLoading ? (
          <LoadingView message="Fetching registered institutions..." />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Institutions"
            message={(error as any)?.message || 'Could not connect to backend server.'}
            onRetry={refetch}
          />
        ) : institutions.length === 0 ? (
          <EmptyState
            title={searchTerm ? 'No Matching Institutions' : 'No Institutions Registered'}
            description={
              searchTerm
                ? `No results found for "${searchTerm}". Try a different search term or filter.`
                : 'Click "Create Institution" above to register your first school or college.'
            }
            actionTitle={searchTerm ? undefined : 'Create Institution'}
            onAction={searchTerm ? undefined : () => setIsCreateOpen(true)}
          />
        ) : (
          <FlatList
            data={institutions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InstitutionCard
                institution={item}
                onViewDetails={(id) => router.push(`/(developer)/institutions/${id}` as any)}
                onEdit={(inst) => setEditingItem(inst)}
                onDelete={(inst) => setDeletingItem(inst)}
              />
            )}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage();
            }}
            onEndReachedThreshold={0.4}
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerRow}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                </View>
              ) : !hasNextPage ? (
                <Text style={styles.footerText}>All {total} institutions loaded</Text>
              ) : undefined
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Modals */}
      <CreateInstitutionModal
        visible={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
        loading={createMutation.isPending}
      />

      <EditInstitutionModal
        visible={Boolean(editingItem)}
        institution={editingItem}
        onClose={() => setEditingItem(null)}
        onSubmit={handleEditSubmit}
        loading={updateMutation.isPending}
      />

      <DeleteInstitutionModal
        visible={Boolean(deletingItem)}
        institution={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  contentWrap: {
    flex: 1,
    marginTop: 8,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 24,
  },
  footerRow: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    padding: 16,
    textAlign: 'center',
    fontSize: 12,
    color: Colors.light.muted,
  },
});
