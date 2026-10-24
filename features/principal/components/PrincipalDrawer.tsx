import React, { useEffect, useState } from 'react';
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
  useWindowDimensions,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useUserStore } from '../../../store/useUserStore';
import { PrincipalTab } from '../types/principal.types';
import { FontFamily } from '../../../constants/fonts';
import { YellowTheme } from '../../../constants/globalYellowStyles';

interface PrincipalDrawerProps {
  visible: boolean;
  activeTab: PrincipalTab;
  onClose: () => void;
  onNavigate: (tab: PrincipalTab) => void;
  onLogout: () => void;
}

const MAIN_NAV: {
  key: PrincipalTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: string;
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard' },
  { key: 'fees', label: 'Fee Ledger', icon: 'cash-multiple' },
  { key: 'notices', label: 'Announcements', icon: 'bullhorn-outline' },
  { key: 'homerooms', label: 'Students', icon: 'account-group-outline' },
  { key: 'timetable', label: 'Timetable', icon: 'calendar-edit' },
  { key: 'staff', label: 'Faculty', icon: 'account-group-outline' },
  { key: 'events', label: 'Events & Calendar', icon: 'calendar-multiselect' },
  { key: 'leaves', label: 'Leave Approvals', icon: 'account-clock-outline' },
  { key: 'document_requests', label: 'Document Desk', icon: 'file-certificate-outline' },
  { key: 'reviews', label: 'Student Reviews', icon: 'clipboard-text-outline' },
];

const TEACHING_NAV: {
  key: PrincipalTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: string;
}[] = [
  { key: 'schedule', label: 'My Schedule', icon: 'calendar-clock' },
  { key: 'mark_attendance', label: 'Mark Attendance', icon: 'clipboard-check-outline' },
  { key: 'marks', label: 'Marks', icon: 'certificate-outline' },
  { key: 'homework', label: 'Homework', icon: 'book-plus-outline' },
];

export const PrincipalDrawer: React.FC<PrincipalDrawerProps> = ({
  visible,
  activeTab,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const fullName = useUserStore((state) => state.fullName) || 'Principal';
  const email = useUserStore((state) => state.email) || 'librarian@school.com';
  const institutionName = useUserStore((state) => state.institutionName) || 'SchoolHub Academy';
  const hasModuleAccess = useUserStore((state) => state.hasModuleAccess);

  const [slideX] = useState(() => new Animated.Value(-width));
  const [fade] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -width,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, width, slideX, fade]);

  if (!visible) return null;

  const drawerWidth = Math.min(width * 0.82, 330);

  const renderNavItem = (
    item: {
      key: PrincipalTab;
      label: string;
      icon: keyof typeof MaterialCommunityIcons.glyphMap;
      badge?: string;
    }
  ) => {
    const active = activeTab === item.key;
    return (
      <TouchableOpacity
        key={item.key}
        style={[styles.navItem, active && styles.navItemActive]}
        onPress={() => {
          onNavigate(item.key);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.navIconBox, active && styles.navIconBoxActive]}>
          <MaterialCommunityIcons
            name={item.icon}
            size={18}
            color={active ? YellowTheme.primaryYellow : '#D1D5DB'}
          />
        </View>
        <Text style={[styles.navItemText, active && styles.navItemTextActive]} numberOfLines={1}>
          {item.label}
        </Text>
        {item.badge && (
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{item.badge}</Text>
          </View>
        )}
        <Feather
          name="chevron-right"
          size={16}
          color={active ? YellowTheme.primaryYellow : YellowTheme.drawerChevron}
          style={styles.navChevron}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Dark Obsidian Drawer Panel with White Header */}
        <Animated.View
          style={[
            styles.panel,
            {
              width: drawerWidth,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          {/* Header Brand Section: White Header with logo-transparent.png + Close X */}
          <View style={[styles.drawerHeader, { paddingTop: Math.max(insets.top + 6, 16) }]}>
            <View style={styles.brandRow}>
              <View style={styles.logoRow}>
                <Image
                  source={require('../../../assets/logo-transparent.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <Text style={styles.brandText}>KIVQUO</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7} hitSlop={10}>
                <Feather name="x" size={18} color="#111827" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Drawer Body Container (Dark obsidian - only header is white) */}
          <View
            style={[
              styles.drawerBody,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            {/* Profile Section (Yellow Avatar + Name + Email + Institution) */}
            <View style={styles.profileSection}>
              <View style={styles.yellowAvatar}>
                <MaterialCommunityIcons name="account" size={28} color="#000000" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{fullName}</Text>
                <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
                <Text style={styles.profileInstitution} numberOfLines={1}>{institutionName}</Text>
              </View>
            </View>

            <View style={styles.headerDivider} />

            {/* Navigation Links Scrollable Area */}
            <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
              {/* MAIN SECTION */}
              <Text style={styles.sectionTitle}>MAIN</Text>
              {MAIN_NAV.filter((item) => hasModuleAccess(item.key)).map(renderNavItem)}

              {/* TEACHING OPERATIONS SECTION */}
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>OPERATIONS</Text>
              {TEACHING_NAV.filter((item) => hasModuleAccess(item.key)).map(renderNavItem)}

              {/* ACCOUNT SECTION */}
              <Text style={[styles.sectionTitle, { marginTop: 18 }]}>ACCOUNT</Text>
              <TouchableOpacity
                style={[styles.navItem, activeTab === 'profile' && styles.navItemActive]}
                onPress={() => {
                  onClose();
                  onNavigate('profile');
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.navIconBox, activeTab === 'profile' && styles.navIconBoxActive]}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={18}
                    color={activeTab === 'profile' ? YellowTheme.primaryYellow : '#D1D5DB'}
                  />
                </View>
                <Text style={[styles.navItemText, activeTab === 'profile' && styles.navItemTextActive]}>
                  Profile & Account
                </Text>
                <Feather
                  name="chevron-right"
                  size={16}
                  color={activeTab === 'profile' ? YellowTheme.primaryYellow : YellowTheme.drawerChevron}
                  style={styles.navChevron}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => {
                  onClose();
                  router.push('/notifications');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.navIconBox}>
                  <MaterialCommunityIcons name="bell-outline" size={18} color="#D1D5DB" />
                </View>
                <Text style={styles.navItemText}>Notifications</Text>
                <Feather name="chevron-right" size={16} color={YellowTheme.drawerChevron} style={styles.navChevron} />
              </TouchableOpacity>
            </ScrollView>

            {/* Bottom Logout Button + Version */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
                <MaterialCommunityIcons name="logout" size={18} color={YellowTheme.primaryYellow} />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>v1.0 · School ERP</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  // Solid Dark Obsidian Drawer Panel with White Header
  panel: {
    backgroundColor: YellowTheme.drawerBg,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
    overflow: 'hidden',
  },
  drawerHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogo: {
    width: 34,
    height: 34,
  },
  brandText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 18,
    color: '#111827',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Profile Card
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  yellowAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: YellowTheme.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  profileEmail: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#8A8A8A',
    marginTop: 1,
  },
  profileInstitution: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: YellowTheme.primaryYellow,
    marginTop: 2,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#262729',
    marginBottom: 14,
  },

  // Navigation Links
  navScroll: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: YellowTheme.drawerSectionText,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 3,
  },
  navItemActive: {
    backgroundColor: YellowTheme.drawerActiveBg,
  },
  navIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: YellowTheme.drawerIconBadge,
    borderWidth: 1,
    borderColor: YellowTheme.drawerIconBadgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  navIconBoxActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    borderColor: YellowTheme.primaryYellow,
  },
  navItemText: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: YellowTheme.drawerItemText,
  },
  navItemTextActive: {
    fontFamily: FontFamily.bold,
    color: YellowTheme.primaryYellow,
  },
  navChevron: {
    marginLeft: 6,
  },
  badgePill: {
    backgroundColor: YellowTheme.primaryYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 4,
  },
  badgePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#000000',
  },

  // Bottom Footer Section
  drawerFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222325',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: YellowTheme.primaryYellow,
    backgroundColor: '#1E1F21',
    gap: 8,
  },
  logoutText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: YellowTheme.primaryYellow,
  },
  versionText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#5A5A5A',
    textAlign: 'center',
    marginTop: 10,
  },
});
