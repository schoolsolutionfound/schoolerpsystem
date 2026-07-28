import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';
import { AppInput } from '../../shared/components/AppInput';
import { AppButton } from '../../shared/components/AppButton';
import { FilterType } from '../types/developer.types';

interface DeveloperHeaderProps {
  fullName?: string;
  institutionCount: number;
  isFetching?: boolean;
  searchTerm: string;
  onSearchChange: (text: string) => void;
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  onCreatePress: () => void;
}

export const DeveloperHeader: React.FC<DeveloperHeaderProps> = ({
  fullName = 'Super Admin',
  institutionCount,
  isFetching = false,
  searchTerm,
  onSearchChange,
  activeFilter,
  onFilterChange,
  onCreatePress,
}) => {
  const filterTabs: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'college', label: 'Colleges' },
    { key: 'school', label: 'Schools' },
    { key: 'active', label: 'Active' },
    { key: 'inactive', label: 'Inactive' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.greetingWrap}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="shield-crown" size={24} color={Colors.light.primary} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Developer Dashboard</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{institutionCount} Total</Text>
              </View>
              {isFetching && <ActivityIndicator size="small" color={Colors.light.primary} style={styles.refetchSpinner} />}
            </View>
            <Text style={styles.subtitle}>Welcome back, {fullName} 👋</Text>
          </View>
        </View>

        <AppButton
          title="Create Institution"
          onPress={onCreatePress}
          iconName="plus"
          style={styles.createBtn}
        />
      </View>

      <View style={styles.searchRow}>
        <AppInput
          placeholder="Search by name, code, or type..."
          value={searchTerm}
          onChangeText={onSearchChange}
          iconName="magnify"
          containerStyle={styles.searchInput}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filterTabs.map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => onFilterChange(tab.key)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  greetingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.profileImage,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  countBadge: {
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.chip,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  refetchSpinner: {
    marginLeft: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.muted,
    marginTop: 2,
  },
  createBtn: {
    height: 42,
  },
  searchRow: {
    width: '100%',
  },
  searchInput: {
    width: '100%',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.muted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
});
