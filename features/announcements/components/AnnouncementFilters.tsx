import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { AppInput } from '../../shared/components/AppInput';
import { AnnouncementFilterState, AnnouncementType, AnnouncementStatus, AnnouncementPriority } from '../types';
import { Colors } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface AnnouncementFiltersProps {
  filters: AnnouncementFilterState;
  onFilterChange: (filters: Partial<AnnouncementFilterState>) => void;
  isManagement?: boolean;
}

const TYPES: { label: string; value: AnnouncementType | 'ALL' }[] = [
  { label: 'All Types', value: 'ALL' },
  { label: 'General', value: 'GENERAL' },
  { label: 'Academic', value: 'ACADEMIC' },
  { label: 'Event', value: 'EVENT' },
  { label: 'Urgent', value: 'URGENT' },
  { label: 'Notice', value: 'NOTICE' },
];

const STATUSES: { label: string; value: AnnouncementStatus | 'ALL' }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Scheduled', value: 'SCHEDULED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

const PRIORITIES: { label: string; value: AnnouncementPriority | 'ALL' }[] = [
  { label: 'All Priority', value: 'ALL' },
  { label: 'Urgent', value: 'URGENT' },
  { label: 'High', value: 'HIGH' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Low', value: 'LOW' },
];

export const AnnouncementFilters: React.FC<AnnouncementFiltersProps> = ({
  filters,
  onFilterChange,
  isManagement = false,
}) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    if (filters.search !== undefined && filters.search !== searchTerm) {
      setSearchTerm(filters.search);
    }
  }, [filters.search]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onFilterChange({ search: searchTerm });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <View style={styles.container}>
      <AppInput
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholder="Search announcements by title or content..."
        iconName="magnify"
        style={styles.searchInput}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {TYPES.map((t) => {
          const selected = (filters.type || 'ALL') === t.value;
          return (
            <TouchableOpacity
              key={`type-${t.value}`}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onFilterChange({ type: t.value })}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isManagement && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {STATUSES.map((s) => {
            const selected = (filters.status || 'ALL') === s.value;
            return (
              <TouchableOpacity
                key={`status-${s.value}`}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => onFilterChange({ status: s.value })}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {PRIORITIES.map((p) => {
          const selected = (filters.priority || 'ALL') === p.value;
          return (
            <TouchableOpacity
              key={`priority-${p.value}`}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onFilterChange({ priority: p.value })}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{p.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 16,
  },
  searchInput: {
    marginBottom: 4,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  chipText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.light.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontFamily: FontFamily.semibold,
  },
});
