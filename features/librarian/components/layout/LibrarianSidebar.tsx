import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { FontFamily } from '../../../../constants/fonts';

export const PRIMARY_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', iconFilled: 'view-dashboard' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline', iconFilled: 'bullhorn' },
  { key: 'books', label: 'Book Entry', icon: 'book-open-outline', iconFilled: 'book-open-page-variant' },
  { key: 'issue', label: 'Issue / Return', icon: 'swap-horizontal', iconFilled: 'swap-horizontal-bold' },
  { key: 'pyqs', label: 'Question Papers', icon: 'file-document-multiple-outline', iconFilled: 'file-document-multiple' },
  { key: 'fines', label: 'Fine Management', icon: 'cash-multiple', iconFilled: 'cash-multiple' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar', iconFilled: 'chart-bar' },
];

export const SECONDARY_NAV = [
  { key: 'profile', label: 'Profile & Account', icon: 'account-outline', iconFilled: 'account' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline', iconFilled: 'cog' },
];

export interface LibrarianSidebarProps {
  activeTab: string;
  onNavigate: (key: string) => void;
  onLogout: () => void;
  userName?: string;
}

export const LibrarianSidebar: React.FC<LibrarianSidebarProps> = ({
  activeTab,
  onNavigate,
  onLogout,
  userName = 'Amina Rahman',
}) => {
  const insets = useSafeAreaInsets();
  const safeTopPadding = Platform.OS === 'ios' ? Math.max(insets.top + 6, 44) : Math.max(insets.top + 6, 20);
  const firstName = userName.split(' ')[0] || userName;

  return (
    <View style={[sidebarStyles.container, { paddingTop: safeTopPadding }]}>
      {/* Brand Header matching attendance flow */}
      <View style={sidebarStyles.brandBox}>
        <Image
          source={require('../../../../assets/logo-transparent.png')}
          style={sidebarStyles.brandLogo}
          resizeMode="contain"
        />
        <View style={sidebarStyles.brandTextWrap}>
          <Text style={sidebarStyles.brandTitle}>KIVQUO</Text>
          <Text style={sidebarStyles.brandSubtitle}>Library Management</Text>
        </View>
      </View>

      {/* User Section */}
      <View style={sidebarStyles.userSection}>
        <View style={sidebarStyles.avatarWrap}>
          <View style={sidebarStyles.avatarPlaceholder}>
            <MaterialCommunityIcons name="account-tie" size={24} color="#1A1B1C" />
          </View>
        </View>
        <View style={sidebarStyles.userTextWrap}>
          <Text style={sidebarStyles.userName}>{firstName}</Text>
          <Text style={sidebarStyles.userRole}>Librarian Portal</Text>
        </View>
      </View>

      {/* Nav List */}
      <ScrollView style={sidebarStyles.menuList} showsVerticalScrollIndicator={false}>
        <Text style={sidebarStyles.sectionLabel}>MAIN</Text>
        {PRIMARY_NAV.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[sidebarStyles.navItem, isActive && sidebarStyles.navItemActive]}
              onPress={() => onNavigate(item.key)}
              activeOpacity={0.7}
            >
              <View style={[sidebarStyles.menuIcon, isActive && sidebarStyles.menuIconActive]}>
                <MaterialCommunityIcons
                  name={isActive ? (item.iconFilled as any) : (item.icon as any)}
                  size={18}
                  color={isActive ? '#F4C430' : '#9A9A9A'}
                />
              </View>
              <Text style={[sidebarStyles.navLabel, isActive && sidebarStyles.navLabelActive]}>
                {item.label}
              </Text>
              <Feather name="chevron-right" size={16} color="#5A5A5A" />
            </TouchableOpacity>
          );
        })}

        <Text style={[sidebarStyles.sectionLabel, { marginTop: 16 }]}>ACCOUNT</Text>
        {SECONDARY_NAV.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[sidebarStyles.navItem, isActive && sidebarStyles.navItemActive]}
              onPress={() => onNavigate(item.key)}
              activeOpacity={0.7}
            >
              <View style={[sidebarStyles.menuIcon, isActive && sidebarStyles.menuIconActive]}>
                <MaterialCommunityIcons
                  name={isActive ? (item.iconFilled as any) : (item.icon as any)}
                  size={18}
                  color={isActive ? '#F4C430' : '#9A9A9A'}
                />
              </View>
              <Text style={[sidebarStyles.navLabel, isActive && sidebarStyles.navLabelActive]}>
                {item.label}
              </Text>
              <Feather name="chevron-right" size={16} color="#5A5A5A" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Footer with Attendance Flow Gold Logout */}
      <View style={sidebarStyles.footer}>
        <TouchableOpacity style={sidebarStyles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={18} color="#F4C430" />
          <Text style={sidebarStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
        <Text style={sidebarStyles.version}>v1.0 · School ERP</Text>
      </View>
    </View>
  );
};

export const SidebarContent = LibrarianSidebar;

const sidebarStyles = StyleSheet.create({
  container: {
    width: 270,
    backgroundColor: '#1A1B1C',
    borderRightWidth: 1,
    borderRightColor: '#2A2B2C',
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 14,
  },
  brandBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
    backgroundColor: '#141516',
  },
  brandLogo: {
    width: 34,
    height: 34,
  },
  brandTextWrap: {
    flex: 1,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    color: '#F4C430',
    fontSize: 10,
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userTextWrap: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  userRole: {
    color: '#8A8A8A',
    fontSize: 11,
    fontFamily: FontFamily.medium,
    marginTop: 1,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 14,
  },
  sectionLabel: {
    fontSize: 10,
    color: '#6A6A6A',
    fontFamily: FontFamily.extrabold,
    letterSpacing: 1,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.1)',
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#232425',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  navLabel: {
    flex: 1,
    color: '#E5E5E5',
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  navLabelActive: {
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
  badgePill: {
    backgroundColor: 'rgba(244, 196, 48, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    color: '#F4C430',
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2B2C',
    backgroundColor: '#141516',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 5,
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  logoutText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#F4C430',
    letterSpacing: 0.3,
  },
  version: {
    fontSize: 10,
    color: '#5A5A5A',
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.5,
  },
});
