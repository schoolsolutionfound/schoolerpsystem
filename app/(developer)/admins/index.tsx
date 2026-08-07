import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAdminsQuery,
  useInstitutionsQuery,
  useDeleteAdminMutation,
} from '../../../features/developer/hooks/useDeveloperQueries';
import { InstitutionAdminCard } from '../../../features/developer/components/InstitutionAdminCard';
import { AppInput } from '../../../features/shared/components/AppInput';
import { LoadingView } from '../../../features/shared/components/LoadingView';
import { EmptyState } from '../../../features/shared/components/EmptyState';
import { ErrorState } from '../../../features/shared/components/ErrorState';
import { Colors, BorderRadius } from '../../../constants/theme';

export default function DeveloperAdminsScreen() {
  const router = useRouter();
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
    Alert.alert(
      'Delete Institution Admin',
      `Are you sure you want to remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(id);
            } catch {
              Alert.alert('Error', 'Failed to delete institution admin.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="account-group" size={24} color={Colors.light.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Institution Admins</Text>
            <Text style={styles.headerSubtitle}>{admins.length} Total Admins Configured</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialCommunityIcons name="bell-outline" size={22} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <AppInput
          placeholder="Search by name, email, or institution..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          iconName="magnify"
          style={styles.searchInput}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipContainer}>
        <TouchableOpacity
          style={[
            styles.chip,
            selectedInstFilter === 'all' && styles.activeChip,
          ]}
          onPress={() => setSelectedInstFilter('all')}
        >
          <Text
            style={[
              styles.chipText,
              selectedInstFilter === 'all' && styles.activeChipText,
            ]}
          >
            All Institutions
          </Text>
        </TouchableOpacity>

        {institutions.slice(0, 4).map((inst) => (
          <TouchableOpacity
            key={inst.id}
            style={[
              styles.chip,
              selectedInstFilter === inst.institutionCode && styles.activeChip,
            ]}
            onPress={() => setSelectedInstFilter(inst.institutionCode)}
          >
            <Text
              style={[
                styles.chipText,
                selectedInstFilter === inst.institutionCode && styles.activeChipText,
              ]}
            >
              {inst.institutionCode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.contentWrap}>
        {isLoading ? (
          <LoadingView message="Loading institution admins..." />
        ) : isError ? (
          <ErrorState
            title="Failed to Load Admins"
            message={(error as any)?.message || 'Could not fetch admin list.'}
            onRetry={refetch}
          />
        ) : filteredAdmins.length === 0 ? (
          <EmptyState
            title={searchTerm ? 'No Matching Admins' : 'No Institution Admins Found'}
            description={
              searchTerm
                ? `No admins match "${searchTerm}".`
                : 'Click the "+" button below to configure your first Institution Admin.'
            }
            actionTitle={searchTerm ? undefined : 'Create Admin'}
            onAction={searchTerm ? undefined : () => router.push('/(developer)/admins/create')}
          />
        ) : (
          <FlatList
            data={filteredAdmins}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <InstitutionAdminCard
                admin={item}
                onEdit={() => router.push(`/(developer)/admins/edit/${item.id}` as any)}
                onDelete={() => handleDeleteAdmin(item.id, item.fullName)}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(developer)/admins/create')}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
  filterChipContainer: {
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
