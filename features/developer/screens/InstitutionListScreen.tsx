import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';
import { InstitutionCard } from '../components/InstitutionCard';
import { CreateInstitutionModal } from '../components/CreateInstitutionModal';
import { EditInstitutionModal } from '../components/EditInstitutionModal';
import { DeleteInstitutionModal } from '../components/DeleteInstitutionModal';
import { AppInput } from '../../shared/components/AppInput';
import { LoadingView } from '../../shared/components/LoadingView';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import {
  useInstitutionsQuery,
  useCreateInstitutionMutation,
  useUpdateInstitutionMutation,
  useDeleteInstitutionMutation,
  searchInstitutions,
} from '../hooks/useDeveloperQueries';
import { Institution, FilterType } from '../types/developer.types';
import {
  CreateInstitutionFormValues,
  UpdateInstitutionFormValues,
} from '../validation/developer.validation';

export function InstitutionListScreen() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Institution | null>(null);
  const [deletingItem, setDeletingItem] = useState<Institution | null>(null);

  const {
    data: institutions = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useInstitutionsQuery();

  const createMutation = useCreateInstitutionMutation();
  const updateMutation = useUpdateInstitutionMutation();
  const deleteMutation = useDeleteInstitutionMutation();

  const filteredInstitutions = useMemo(() => {
    let list = searchInstitutions(institutions, searchTerm);
    if (activeFilter === 'college') {
      list = list.filter((i) => i.institutionType === 'college');
    } else if (activeFilter === 'school') {
      list = list.filter((i) => i.institutionType === 'school');
    } else if (activeFilter === 'active') {
      list = list.filter((i) => i.subscriptionStatus === 'active');
    } else if (activeFilter === 'inactive') {
      list = list.filter((i) => i.subscriptionStatus === 'inactive' || i.subscriptionStatus === 'suspended');
    }
    return list;
  }, [institutions, searchTerm, activeFilter]);

  const handleCreateSubmit = async (values: CreateInstitutionFormValues) => {
    try {
      await createMutation.mutateAsync(values);
      setIsCreateOpen(false);
    } catch {}
  };

  const handleEditSubmit = async (id: string, values: UpdateInstitutionFormValues) => {
    try {
      await updateMutation.mutateAsync({ id, payload: values });
      setEditingItem(null);
    } catch {}
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeletingItem(null);
    } catch {}
  };

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'college', label: 'College' },
    { key: 'school', label: 'School' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="domain" size={24} color={Colors.light.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Institutions</Text>
            <Text style={styles.headerSubtitle}>
              {isFetching ? 'Refreshing...' : `${institutions.length} Total Registered`}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => refetch()}>
          <MaterialCommunityIcons name="refresh" size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <AppInput
          placeholder="Search by name or code..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          iconName="magnify"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, activeFilter === f.key && styles.activeChip]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.chipText, activeFilter === f.key && styles.activeChipText]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentWrap}>
        {isLoading ? (
          <LoadingView message="Fetching registered institutions..." />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Institutions"
            message={(error as any)?.message || 'Could not connect to backend server.'}
            onRetry={refetch}
          />
        ) : filteredInstitutions.length === 0 ? (
          <EmptyState
            title={searchTerm ? 'No Matching Institutions' : 'No Institutions Registered'}
            description={
              searchTerm
                ? `No results found for "${searchTerm}".`
                : 'Tap the "+" button to register your first school or college.'
            }
            actionTitle={searchTerm ? undefined : 'Create Institution'}
            onAction={searchTerm ? undefined : () => setIsCreateOpen(true)}
          />
        ) : (
          <FlatList
            data={filteredInstitutions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InstitutionCard
                institution={item}
                onViewDetails={(id) => router.push(`/(developer)/institutions/${id}` as any)}
                onEdit={(inst) => setEditingItem(inst)}
                onDelete={(inst) => setDeletingItem(inst)}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setIsCreateOpen(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  iconButton: {
    padding: 6,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  searchInput: {
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  activeChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 12,
    color: Colors.light.icon,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  contentWrap: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
