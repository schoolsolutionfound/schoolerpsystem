import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { FontFamily } from '../../../../constants/fonts';

export interface LibrarianDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  email?: string;
  profilePic?: string;
  institutionName?: string;
  activeTab?: string;
  onTabSwitch: (tab: string) => void;
  onLogout: () => void;
}

const PRIMARY = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline', iconFilled: 'view-dashboard' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline', iconFilled: 'bullhorn' },
  { key: 'books', label: 'Book Entry', icon: 'book-open-outline', iconFilled: 'book-open-page-variant' },
  { key: 'issue', label: 'Issue / Return', icon: 'swap-horizontal', iconFilled: 'swap-horizontal-bold' },
  { key: 'pyqs', label: 'Question Papers', icon: 'file-document-multiple-outline', iconFilled: 'file-document-multiple' },
  { key: 'fines', label: 'Fine Management', icon: 'cash-multiple', iconFilled: 'cash-multiple' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar', iconFilled: 'chart-bar' },
];

const SECONDARY = [
  { key: 'profile', label: 'Profile & Account', icon: 'account-outline', iconFilled: 'account' },
  { key: 'settings', label: 'Settings', icon: 'cog-outline', iconFilled: 'cog' },
];

export const LibrarianDrawer: React.FC<LibrarianDrawerProps> = ({
  visible,
  onClose,
  fullName = 'Amina Rahman',
  email = '',
  profilePic,
  institutionName = 'Library Management',
  activeTab,
  onTabSwitch,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const slideX = useRef(new Animated.Value(-width)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 320,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -width,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 260,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, slideX, fade, mounted, width]);

  const handleSelectTab = (key: string) => {
    onClose();
    setTimeout(() => {
      onTabSwitch(key);
    }, key === 'notifications' ? 280 : 120);
  };

  const firstName = fullName.split(' ')[0] || fullName;

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        {/* Backdrop overlay */}
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerWrap,
            { transform: [{ translateX: slideX }] },
          ]}
        >
          <SafeAreaView style={styles.drawer} edges={['bottom']}>
            {/* Drawer Header matching attendance theme */}
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
              <View style={styles.headerTopRow}>
                <View style={styles.brandRow}>
                  <Image
                    source={require('../../../../assets/logo-transparent.png')}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={styles.brandTitle}>KIVQUO</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                  <Feather name="x" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* User Profile Summary */}
            <View style={styles.userSection}>
              <View style={styles.avatarWrap}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="account-tie" size={28} color="#1A1B1C" />
                  </View>
                )}
              </View>
              <View style={styles.userTextWrap}>
                <Text style={styles.userName}>{firstName}</Text>
                {email ? <Text style={styles.userEmail}>{email}</Text> : null}
                <Text style={styles.userInstitution}>{institutionName}</Text>
              </View>
            </View>

            {/* Menu List */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>MAIN</Text>
              {PRIMARY.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectTab(item.key)}
                  >
                    <View style={[styles.menuIcon, isActive && styles.menuIconActive]}>
                      <MaterialCommunityIcons
                        name={isActive ? (item.iconFilled as any) : (item.icon as any)}
                        size={18}
                        color={isActive ? '#F4C430' : '#9A9A9A'}
                      />
                    </View>
                    <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                      {item.label}
                    </Text>
                    <Feather name="chevron-right" size={16} color="#5A5A5A" />
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.sectionLabel, { marginTop: 18 }]}>ACCOUNT</Text>
              {SECONDARY.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    activeOpacity={0.7}
                    onPress={() => handleSelectTab(item.key)}
                  >
                    <View style={[styles.menuIcon, isActive && styles.menuIconActive]}>
                      <MaterialCommunityIcons
                        name={isActive ? (item.iconFilled as any) : (item.icon as any)}
                        size={18}
                        color={isActive ? '#F4C430' : '#9A9A9A'}
                      />
                    </View>
                    <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                      {item.label}
                    </Text>
                    <Feather name="chevron-right" size={16} color="#5A5A5A" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Footer with Attendance Flow Gold Logout */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    onLogout();
                  }, 120);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="logout" size={18} color="#F4C430" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <Text style={styles.version}>v1.0 · School ERP</Text>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.55)' },
  drawerWrap: {
    width: '82%',
    maxWidth: 360,
  },
  drawer: {
    flex: 1,
    backgroundColor: '#1A1B1C',
    borderRightWidth: 1,
    borderRightColor: '#2A2B2C',
  },

  header: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
    backgroundColor: '#141516',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandLogo: { width: 34, height: 34 },
  brandTitle: { fontSize: 14, fontFamily: FontFamily.extrabold, color: '#FFFFFF', letterSpacing: 0.3 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 5,
    backgroundColor: '#232425',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextWrap: { flex: 1 },
  userName: { fontSize: 15, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  userEmail: { fontSize: 11, fontFamily: FontFamily.regular, color: '#8A8A8A', marginTop: 1 },
  userInstitution: { fontSize: 10, color: '#F4C430', fontFamily: FontFamily.bold, marginTop: 2 },

  body: { flex: 1 },
  bodyContent: { paddingTop: 14, paddingHorizontal: 10, paddingBottom: 20 },
  sectionLabel: {
    fontSize: 10,
    color: '#6A6A6A',
    fontFamily: FontFamily.extrabold,
    letterSpacing: 1,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 11,
    borderRadius: 5,
  },
  menuItemActive: {
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
  menuText: { flex: 1, fontSize: 14, fontFamily: FontFamily.medium, color: '#E5E5E5' },
  menuTextActive: { color: '#F4C430', fontFamily: FontFamily.bold },

  footer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
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
  logoutText: { fontSize: 14, fontFamily: FontFamily.bold, color: '#F4C430', letterSpacing: 0.3 },
  version: { fontSize: 10, fontFamily: FontFamily.regular, color: '#5A5A5A', textAlign: 'center', marginTop: 10, letterSpacing: 0.5 },
});
