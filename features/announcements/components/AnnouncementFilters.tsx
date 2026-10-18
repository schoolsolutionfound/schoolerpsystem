import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppInput } from '../../shared/components/AppInput';
import { AnnouncementFilterState } from '../types';

interface AnnouncementFiltersProps {
  filters: AnnouncementFilterState;
  onFilterChange: (filters: Partial<AnnouncementFilterState>) => void;
  isManagement?: boolean;
}

export const AnnouncementFilters: React.FC<AnnouncementFiltersProps> = ({
  filters,
  onFilterChange,
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
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleClear = () => {
    setSearchTerm('');
    onFilterChange({ search: '' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrap}>
        <AppInput
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search announcements..."
          iconName="magnify"
          style={styles.searchInput}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    paddingRight: 36,
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    top: 14,
    zIndex: 2,
  },
});
