import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useInstitutionSearchQuery } from '../hooks/useDeveloperQueries';
import { Institution } from '../types/developer.types';
import { Colors, BorderRadius } from '../../../constants/theme';

const SEARCH_LIMIT = 50;
const DEBOUNCE_MS = 300;

export interface InstitutionSearchSelectProps {
  /** Selected institutionCode ('' = nothing selected). */
  value: string;
  /** Known display label for a pre-selected value (e.g. from an admin record). */
  valueLabel?: string;
  /** Called with the picked institution, or null when the selection is cleared. */
  onChange: (inst: Institution | null) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Debounced, server-searched institution picker.
 *
 * Replaces the full-list <Picker>/chip rows: instead of loading every
 * institution, it searches GET /developer/institutions?search=...&limit=50
 * 300ms after the user stops typing.
 */
export const InstitutionSearchSelect: React.FC<InstitutionSearchSelectProps> = ({
  value,
  valueLabel,
  onChange,
  label,
  placeholder = 'Search by name or code…',
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  const query = useInstitutionSearchQuery(debounced, open, SEARCH_LIMIT);
  const results = open ? (query.data?.data ?? []) : [];
  const total = query.data?.total ?? 0;

  const handleSelect = (inst: Institution) => {
    onChange(inst);
    setOpen(false);
    setSearch('');
    Keyboard.dismiss();
  };

  const openPicker = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const displayLabel = value ? valueLabel || value : '';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity activeOpacity={1} onPress={openPicker} style={styles.inputRow}>
        <MaterialCommunityIcons
          name="magnify"
          size={18}
          color={Colors.light.primary}
          style={styles.icon}
        />
        {open ? (
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={search}
            onChangeText={setSearch}
            placeholder={placeholder}
            placeholderTextColor="#6B6B6B"
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search institutions"
          />
        ) : (
          <Text
            style={[styles.input, !displayLabel && styles.placeholderText]}
            numberOfLines={1}
          >
            {displayLabel || placeholder}
          </Text>
        )}
        {open ? (
          query.isFetching ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : (
            <MaterialCommunityIcons name="close" size={18} color={Colors.light.icon} />
          )
        ) : value ? (
          <MaterialCommunityIcons name="check-circle" size={18} color={Colors.light.primary} />
        ) : (
          <MaterialCommunityIcons name="chevron-down" size={18} color={Colors.light.icon} />
        )}
      </TouchableOpacity>

      {open && (
        <View style={styles.dropdown}>
          {query.isFetching ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>Searching…</Text>
            </View>
          ) : debounced.trim().length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>Type to search institutions by name or code.</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.stateRow}>
              <Text style={styles.stateText}>No institutions found for “{debounced}”.</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={results}
                keyExtractor={(item) => item.id}
                style={styles.list}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected =
                    item.institutionCode.toLowerCase() === value.toLowerCase();
                  return (
                    <TouchableOpacity
                      style={[styles.row, isSelected && styles.rowSelected]}
                      onPress={() => handleSelect(item)}
                    >
                      <MaterialCommunityIcons
                        name={item.institutionType === 'school' ? 'school' : 'office-building-outline'}
                        size={18}
                        color={isSelected ? Colors.light.primary : Colors.light.icon}
                        style={styles.rowIcon}
                      />
                      <View style={styles.rowTextWrap}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {item.institutionName}
                        </Text>
                        <Text style={styles.rowCode} numberOfLines={1}>
                          {item.institutionCode}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={16}
                          color={Colors.light.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
              {total > results.length && (
                <View style={styles.footnoteRow}>
                  <Text style={styles.footnote}>
                    Showing {results.length} of {total} — refine your search.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    height: 48,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  placeholderText: {
    color: '#6B6B6B',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: 280,
    marginTop: 4,
    overflow: 'hidden',
  },
  stateRow: {
    padding: 14,
  },
  stateText: {
    fontSize: 13,
    color: Colors.light.muted,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.border,
  },
  rowSelected: {
    backgroundColor: '#FFF4C7',
  },
  rowIcon: {
    marginRight: 10,
  },
  rowTextWrap: {
    flex: 1,
    gap: 1,
  },
  rowName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  rowCode: {
    fontSize: 11,
    color: Colors.light.muted,
  },
  footnoteRow: {
    padding: 8,
  },
  footnote: {
    fontSize: 11,
    color: Colors.light.muted,
    textAlign: 'center',
  },
});
