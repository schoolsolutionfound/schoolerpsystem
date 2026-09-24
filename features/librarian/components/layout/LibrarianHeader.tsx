import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import { Feather } from '../common/Icons';

export interface LibrarianHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
  userName: string;
}

export const LibrarianHeader: React.FC<LibrarianHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onMenuPress,
  onNotificationsPress,
  onProfilePress,
  userName,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const isSmall = width < 480;

  return (
    <View style={[topHeaderStyles.bar, isSmall && { paddingHorizontal: 10, gap: 6 }]}>
      {isMobile && (
        <TouchableOpacity style={topHeaderStyles.iconBtn} onPress={onMenuPress}>
          <Feather name="menu" size={20} color="#1F2937" />
        </TouchableOpacity>
      )}

      {/* Global Search Bar */}
      <View style={[topHeaderStyles.searchWrap, isSmall && { paddingHorizontal: 10, paddingVertical: 6, marginRight: 0 }]}>
        <Feather name="search" size={15} color="#6B7280" />
        <TextInput
          style={topHeaderStyles.searchInput}
          placeholder={isSmall ? 'Search...' : 'Search books, members, or anything...'}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>

      <View style={[topHeaderStyles.rightContainer, isSmall && { gap: 6 }]}>
        {/* Notification Bell */}
        <TouchableOpacity style={topHeaderStyles.iconBtn} onPress={onNotificationsPress}>
          <Feather name="bell" size={18} color="#374151" />
          <View style={topHeaderStyles.notifBadge} />
        </TouchableOpacity>

        {/* Brand / Profile Logo Trigger */}
        <TouchableOpacity
          style={[topHeaderStyles.userBox, isSmall && { paddingHorizontal: 6, paddingVertical: 4 }]}
          onPress={onProfilePress}
        >
          <View style={topHeaderStyles.brandLogoBadge}>
            <Text style={topHeaderStyles.brandLogoText}>K</Text>
          </View>
          {!isMobile && (
            <View>
              <Text style={topHeaderStyles.userName}>{userName}</Text>
              <Text style={topHeaderStyles.userRole}>Librarian Portal</Text>
            </View>
          )}
          <Feather name="chevron-down" size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const topHeaderStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 8,
    marginRight: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#1F2937', paddingVertical: 0 },
  rightContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F3F4F6', position: 'relative' },
  notifBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  userBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFDF7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  brandLogoBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EAB308', alignItems: 'center', justifyContent: 'center' },
  brandLogoText: { color: '#121316', fontSize: 17, fontWeight: '900' },
  userName: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
  userRole: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
});
