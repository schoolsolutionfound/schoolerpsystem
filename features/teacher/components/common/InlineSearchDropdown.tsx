import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from './Icons';
import { FontFamily } from '../../../../constants/fonts';

export interface DropdownItem {
  label: string;
  value: string;
  subtext?: string;
  badge?: string;
  badgeColor?: string;
}

interface InlineSearchDropdownProps {
  label?: string;
  placeholder?: string;
  selectedValue: string;
  options: (string | DropdownItem)[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
  iconName?: string;
  iconType?: 'feather' | 'material';
  containerStyle?: any;
  maxHeight?: number;
  menuOnly?: boolean;
}

export const InlineSearchDropdown: React.FC<InlineSearchDropdownProps> = ({
  label,
  placeholder = 'Search or select...',
  selectedValue,
  options,
  isOpen,
  onToggle,
  onSelect,
  iconName = 'book-open-page-variant',
  iconType = 'material',
  containerStyle,
  maxHeight = 220,
  menuOnly = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  // Normalize options to DropdownItem
  const normalizedOptions: DropdownItem[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      Keyboard.dismiss();
    }
  }, [isOpen]);

  // Live filtered list based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subtext && opt.subtext.toLowerCase().includes(q)) ||
        (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  if (menuOnly) {
    if (!isOpen) return null;
    return (
      <View style={[styles.wrapper, containerStyle]}>
        <View style={[styles.dropdownCard, styles.menuOnlyCard]}>
          {/* Single Search Bar inside Dropdown Menu */}
          <View style={styles.menuSearchBar}>
            <Feather
              name="search"
              size={15}
              color="#94A3B8"
              style={styles.searchIcon}
            />
            <TextInput
              ref={inputRef}
              style={styles.menuSearchInput}
              placeholder={placeholder}
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearBtn}
              >
                <Feather name="x-circle" size={14} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {filteredOptions.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <Text style={styles.dropdownEmptyText}>
                No results match "{searchQuery}"
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight }}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {filteredOptions.map((item) => {
                const isSelected = selectedValue === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.dropdownRow,
                      isSelected && styles.dropdownRowSelected,
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      Keyboard.dismiss();
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Left Icon Thumbnail */}
                    <View style={styles.thumbBox}>
                      {iconType === 'feather' ? (
                        <Feather
                          name={(iconName as any) || 'bookmark'}
                          size={15}
                          color="#64748B"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={(iconName as any) || 'book-open-page-variant'}
                          size={16}
                          color="#64748B"
                        />
                      )}
                    </View>

                    {/* Middle Info */}
                    <View style={styles.rowInfo}>
                      <Text
                        style={[
                          styles.rowTitle,
                          isSelected && styles.rowTitleSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {item.subtext ? (
                        <Text style={styles.rowSubtext} numberOfLines={1}>
                          {item.subtext}
                        </Text>
                      ) : null}
                    </View>

                    {/* Right Badge or Checkmark */}
                    {item.badge ? (
                      <View style={styles.badgePill}>
                        <Text
                          style={[
                            styles.badgeText,
                            item.badgeColor ? { color: item.badgeColor } : null,
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    ) : isSelected ? (
                      <Feather name="check" size={16} color="#0284C7" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      {/* Search Input Container */}
      <TouchableOpacity
        style={[
          styles.searchInputContainer,
          isOpen && styles.searchInputContainerFocused,
        ]}
        activeOpacity={1}
        onPress={() => {
          onToggle();
          if (!isOpen) {
            inputRef.current?.focus();
          }
        }}
      >
        <Feather
          name="search"
          size={16}
          color={isOpen ? '#0284C7' : '#94A3B8'}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          placeholder={isOpen ? placeholder : selectedValue || placeholder}
          placeholderTextColor={isOpen ? '#94A3B8' : '#0F172A'}
          value={isOpen ? searchQuery : selectedValue}
          editable={isOpen}
          onChangeText={setSearchQuery}
          onFocus={() => {
            if (!isOpen) onToggle();
          }}
          returnKeyType="search"
        />

        {isOpen && searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.clearBtn}
          >
            <Feather name="x-circle" size={15} color="#94A3B8" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => {
            Keyboard.dismiss();
            onToggle();
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#64748B"
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Inline Dropdown Menu attached directly below */}
      {isOpen && (
        <View style={styles.dropdownCard}>
          {filteredOptions.length === 0 ? (
            <View style={styles.dropdownEmpty}>
              <Text style={styles.dropdownEmptyText}>
                No results match "{searchQuery}"
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ maxHeight }}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {filteredOptions.map((item) => {
                const isSelected = selectedValue === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.dropdownRow,
                      isSelected && styles.dropdownRowSelected,
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      Keyboard.dismiss();
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Left Icon Thumbnail */}
                    <View style={styles.thumbBox}>
                      {iconType === 'feather' ? (
                        <Feather
                          name={(iconName as any) || 'bookmark'}
                          size={15}
                          color="#64748B"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name={(iconName as any) || 'book-open-page-variant'}
                          size={16}
                          color="#64748B"
                        />
                      )}
                    </View>

                    {/* Middle Info */}
                    <View style={styles.rowInfo}>
                      <Text
                        style={[
                          styles.rowTitle,
                          isSelected && styles.rowTitleSelected,
                        ]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                      {item.subtext ? (
                        <Text style={styles.rowSubtext} numberOfLines={1}>
                          {item.subtext}
                        </Text>
                      ) : null}
                    </View>

                    {/* Right Badge or Checkmark */}
                    {item.badge ? (
                      <View style={styles.badgePill}>
                        <Text
                          style={[
                            styles.badgeText,
                            item.badgeColor ? { color: item.badgeColor } : null,
                          ]}
                        >
                          {item.badge}
                        </Text>
                      </View>
                    ) : isSelected ? (
                      <Feather name="check" size={16} color="#0284C7" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
    marginBottom: 6,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInputContainerFocused: {
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    paddingHorizontal: 6,
  },

  /* Dropdown Card attached directly underneath */
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownEmpty: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownEmptyText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownRowSelected: {
    backgroundColor: '#F0F9FF',
  },
  thumbBox: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  rowTitleSelected: {
    color: '#0284C7',
  },
  rowSubtext: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#64748B',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#047857',
  },
  menuOnlyCard: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  menuSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
  },
  menuSearchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#0F172A',
    paddingVertical: 0,
  },
});
