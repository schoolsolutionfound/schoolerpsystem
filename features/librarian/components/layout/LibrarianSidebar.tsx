import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '../common/Icons';

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline' },
  { key: 'books', label: 'Book Entry', icon: 'book-open-outline' },
  { key: 'issue', label: 'Issue / Return', icon: 'swap-horizontal' },
  { key: 'categories', label: 'Book Categories', icon: 'tag-outline' },
  { key: 'pyqs', label: 'Question Papers', icon: 'file-document-multiple-outline' },
  { key: 'students', label: 'Members', icon: 'account-group-outline' },
  { key: 'fines', label: 'Fine Management', icon: 'cash-multiple' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline', badge: 3 },
  { key: 'settings', label: 'Settings', icon: 'cog-outline' },
];

export interface LibrarianSidebarProps {
  activeTab: string;
  onNavigate: (key: string) => void;
  onLogout: () => void;
}

export const LibrarianSidebar: React.FC<LibrarianSidebarProps> = ({ activeTab, onNavigate, onLogout }) => {
  return (
    <View style={sidebarStyles.container}>
      {/* Brand Header */}
      <View style={sidebarStyles.brandBox}>
        <View style={sidebarStyles.logoBadge}>
          <Text style={sidebarStyles.logoText}>K</Text>
        </View>
        <View>
          <Text style={sidebarStyles.brandTitle}>KIVQUO</Text>
          <Text style={sidebarStyles.brandSubtitle}>Smart School Management</Text>
        </View>
      </View>

      {/* Nav List */}
      <ScrollView style={sidebarStyles.menuList} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[sidebarStyles.navItem, isActive && sidebarStyles.navItemActive]}
              onPress={() => onNavigate(item.key)}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={20}
                color={isActive ? '#EAB308' : '#9CA3AF'}
              />
              <Text style={[sidebarStyles.navLabel, isActive && sidebarStyles.navLabelActive]}>
                {item.label}
              </Text>
              {item.badge ? (
                <View style={sidebarStyles.badgePill}>
                  <Text style={sidebarStyles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Quote Illustration Box */}
      <View style={sidebarStyles.quoteBox}>
        <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#EAB308" />
        <Text style={sidebarStyles.quoteText}>“Good books build great minds.”</Text>
      </View>
    </View>
  );
};

export const SidebarContent = LibrarianSidebar;

const sidebarStyles = StyleSheet.create({
  container: {
    width: 250,
    backgroundColor: '#121316',
    borderRightWidth: 1,
    borderRightColor: '#1F2228',
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 14,
    justify: 'space-between',
  } as any,
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2228',
    paddingHorizontal: 6,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EAB308',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#121316', fontSize: 22, fontWeight: '900' },
  brandTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  brandSubtitle: { color: '#9CA3AF', fontSize: 10, fontWeight: '500' },
  menuList: { flex: 1, marginTop: 16 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemActive: { backgroundColor: '#1A1C20', borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.3)' },
  navLabel: { flex: 1, color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  navLabelActive: { color: '#EAB308', fontWeight: '800' },
  badgePill: { backgroundColor: '#EAB308', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#121316', fontSize: 10, fontWeight: '900' },
  quoteBox: {
    marginTop: 16,
    backgroundColor: '#181A1F',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#EAB308',
    gap: 6,
  },
  quoteText: { color: '#D1D5DB', fontSize: 11, fontStyle: 'italic', lineHeight: 16, fontWeight: '500' },
});
