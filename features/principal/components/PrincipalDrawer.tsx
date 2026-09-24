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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useUserStore } from '../../../store/useUserStore';
import { getHomeRouteForRole } from '../../shared/utils/routeGuards';
import { PrincipalTab } from '../types/principal.types';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

interface PrincipalDrawerProps {
  visible: boolean;
  activeTab: PrincipalTab;
  onClose: () => void;
  onNavigate: (tab: PrincipalTab) => void;
  onLogout: () => void;
}

const PRIMARY_NAV: {
  key: PrincipalTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: string;
}[] = [
  { key: 'dashboard', label: 'Executive Cockpit', icon: 'view-dashboard-outline' },
  { key: 'homerooms', label: 'Homeroom & Classes', icon: 'google-classroom' },
  { key: 'staff', label: 'Faculty & Staff Roster', icon: 'human-male-board' },
  { key: 'counseling', label: 'Guidance & Counseling', icon: 'heart-pulse' },
  { key: 'notices', label: 'Campus Circulars', icon: 'bullhorn-outline' },
  { key: 'attendance', label: 'Institution Attendance', icon: 'calendar-check-outline' },
  { key: 'profile', label: 'Executive Settings', icon: 'cog-outline' },
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
  const email = useUserStore((state) => state.email);
  const institutionName = useUserStore((state) => state.institutionName) || 'My Institution';
  const userRole = useUserStore((state) => state.userRole);
  const roles = useUserStore((state) => state.roles || []);
  const switchRole = useUserStore((state) => state.switchRole);

  const slideX = useRef(new Animated.Value(-width)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  const handleSwitchRole = (targetRole: any) => {
    switchRole(targetRole);
    onClose();
    setTimeout(() => router.replace(getHomeRouteForRole(targetRole) as any), 150);
  };

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -width,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

  if (!mounted) return null;

  const drawerWidth = Math.min(width * 0.82, 340);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Drawer Panel */}
        <Animated.View
          style={[
            styles.panel,
            {
              width: drawerWidth,
              paddingTop: Math.max(insets.top, 16),
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          {/* Header Profile Section */}
          <View style={styles.drawerHeader}>
            <View style={styles.headerTop}>
              <View style={styles.avatarWrap}>
                <MaterialCommunityIcons name="shield-crown" size={26} color="#D97706" />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeIconBtn} activeOpacity={0.7}>
                <Feather name="x" size={20} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.drawerName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.drawerEmail} numberOfLines={1}>{email}</Text>
            <View style={styles.campusBadge}>
              <MaterialCommunityIcons name="office-building" size={13} color="#92400E" />
              <Text style={styles.campusBadgeText} numberOfLines={1}>{institutionName}</Text>
            </View>
          </View>

          {/* Navigation Links */}
          <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionHeader}>LEADERSHIP MODULES</Text>
            {PRIMARY_NAV.map((item) => {
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
                      size={20}
                      color={active ? '#FFFFFF' : '#4B5563'}
                    />
                  </View>
                  <Text style={[styles.navItemText, active && styles.navItemTextActive]}>
                    {item.label}
                  </Text>
                  {item.badge && (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Role Switching */}
            {roles.length > 1 && (
              <View style={styles.switchRoleBlock}>
                <Text style={styles.sectionHeader}>SWITCH PORTAL</Text>
                {roles.map((r) => {
                  const isCurrent = r === userRole;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleSwitchRow, isCurrent && styles.roleSwitchRowActive]}
                      disabled={isCurrent}
                      onPress={() => handleSwitchRole(r)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name="account-switch-outline"
                        size={16}
                        color={isCurrent ? '#D97706' : '#6B6B6B'}
                      />
                      <Text
                        style={[
                          styles.roleSwitchText,
                          isCurrent && styles.roleSwitchTextActive,
                        ]}
                      >
                        {r.toUpperCase()}
                      </Text>
                      {isCurrent && (
                        <View style={styles.currentDot} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Bottom Logout Button */}
          <View style={styles.drawerFooter}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
              <Feather name="log-out" size={18} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 16,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  drawerEmail: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  campusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  campusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  navScroll: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    fontFamily: FontFamily.bold,
    marginBottom: 8,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.button,
    marginBottom: 4,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: '#FEF3C7',
  },
  navIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIconBoxActive: {
    backgroundColor: '#D97706',
  },
  navItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  navItemTextActive: {
    color: '#92400E',
    fontWeight: '800',
    fontFamily: FontFamily.bold,
  },
  badgePill: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  switchRoleBlock: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  roleSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  roleSwitchRowActive: {
    backgroundColor: '#FFFBEB',
  },
  roleSwitchText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  roleSwitchTextActive: {
    color: '#92400E',
    fontWeight: '700',
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  drawerFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
    fontFamily: FontFamily.bold,
  },
});
