import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAdminsQuery,
  useInstitutionsQuery,
  useDeleteAdminMutation,
} from '../hooks/useDeveloperQueries';
import { InstitutionAdminCard } from './InstitutionAdminCard';
import { AppInput } from '../../shared/components/AppInput';
import { LoadingView } from '../../shared/components/LoadingView';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { Colors, BorderRadius } from '../../../constants/theme';

export function DeveloperAdminsContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstFilter, setSelectedInstFilter] = useState<string>('all');

  const { data: admins = [], isLoading, isError, error, refetch } = useAdminsQuery();
  const { data: institutions = [] } = useInstitutionsQuery();
  const deleteMutation = useDeleteAdminMutation();

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch =
        admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesInst =
        selectedInstFilter === 'all' ||
        admin.institutionCode.toLowerCase() === selectedInstFilter.toLowerCase();
      return matchesSearch && matchesInst;
    });
  }, [admins, searchTerm, selectedInstFilter]);

  const handleDeleteAdmin = (id: string, name: string) => {
    Alert.alert('Delete Institution Admin', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try { await deleteMutation.mutateAsync(id); } catch { Alert.alert('Error', 'Failed to delete institution admin.'); }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchSection}>
        <AppInput
          placeholder="Search by name, email, or institution..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          iconName="magnify"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterChipContainer}>
        <TouchableOpacity
          style={[styles.chip, selectedInstFilter === 'all' && styles.activeChip]}
          onPress={() => setSelectedInstFilter('all')}
        >
          <Text style={[styles.chipText, selectedInstFilter === 'all' && styles.activeChipText]}>All Institutions</Text>
        </TouchableOpacity>
        {institutions.slice(0, 4).map((inst) => (
          <TouchableOpacity
            key={inst.id}
            style={[styles.chip, selectedInstFilter === inst.institutionCode && styles.activeChip]}
            onPress={() => setSelectedInstFilter(inst.institutionCode)}
          >
            <Text style={[styles.chipText, selectedInstFilter === inst.institutionCode && styles.activeChipText]}>
              {inst.institutionCode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentWrap}>
        {isLoading ? (
          <LoadingView message="Loading institution admins..." />
        ) : isError ? (
          <ErrorState title="Failed to Load Admins" message={(error as any)?.message || 'Could not fetch admin list.'} onRetry={refetch} />
        ) : filteredAdmins.length === 0 ? (
          <EmptyState
            title={searchTerm ? 'No Matching Admins' : 'No Institution Admins Found'}
            description={searchTerm ? `No admins match "${searchTerm}".` : 'No admins configured yet.'}
          />
        ) : (
          <FlatList
            data={filteredAdmins}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InstitutionAdminCard
                admin={item}
                onEdit={() => {}}
                onDelete={() => handleDeleteAdmin(item.id, item.fullName)}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchSection: { paddingHorizontal: 16, marginTop: 8 },
  searchInput: { marginBottom: 8 },
  filterChipContainer: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.chip, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.light.border },
  activeChip: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontSize: 12, color: Colors.light.icon, fontWeight: '600' },
  activeChipText: { color: '#FFFFFF' },
  contentWrap: { flex: 1, paddingHorizontal: 16 },
  listContainer: { paddingBottom: 24 },
});
