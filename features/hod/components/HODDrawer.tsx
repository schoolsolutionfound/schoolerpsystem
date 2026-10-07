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
import { HODTab } from '../types/hod.types';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

interface HODDrawerProps {
  visible: boolean;
  activeTab: HODTab;
  onClose: () => void;
  onNavigate: (tab: HODTab) => void;
  onLogout: () => void;
}

const PRIMARY_NAV: {
  key: HODTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  badge?: string;
}[] = [
  { key: 'dashboard', label: 'Department Overview', icon: 'view-dashboard-outline' },
  { key: 'courses', label: 'Courses & Syllabus', icon: 'book-open-page-variant' },
  { key: 'faculty', label: 'Faculty & Workload', icon: 'human-male-board' },
  { key: 'eligibility', label: 'Exam Eligibility & Hall Tickets', icon: 'card-account-details-outline' },
  { key: 'notices', label: 'Department Memos', icon: 'bullhorn-outline' },
  { key: 'attendance', label: 'Daily Student Attendance', icon: 'calendar-check-outline' },
];

export const HODDrawer: React.FC<HODDrawerProps> = ({
  visible,
  activeTab,
  onClose,
  onNavigate,
  onLogout,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const fullName = useUserStore((state) => state.fullName) || 'Head of Department';
  const email = useUserStore((state) => state.email);
  const department = useUserStore((state) => state.department) || 'Department Head';
  const institutionName = useUserStore((state) => state.institutionName) || 'College of Engineering';
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
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -width,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
  }, [visible, width]);

  if (!mounted && !visible) return null;

  const drawerWidth = Math.min(width * 0.82, 340);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Drawer Panel */}
        <Animated.View
          style={[
            styles.drawer,
            {
              width: drawerWidth,
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX: slideX }],
            },
          ]}
        >
          {/* Header Brand */}
          <View style={styles.brandRow}>
            <Image
              source={require('../../../assets/text-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          {/* Department Head Profile Summary */}
          <TouchableOpacity
            style={styles.profileSummary}
            onPress={() => {
              onClose();
              router.push('/(hod)/profile');
            }}
            activeOpacity={0.8}
          >
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="domain" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {fullName}
              </Text>
              <Text style={styles.profileDept} numberOfLines={1}>
                {department}
              </Text>
              <Text style={styles.profileInstitute} numberOfLines={1}>
                {institutionName}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
            {/* Primary Academic & Dept Navigation */}
            <Text style={styles.sectionHeader}>DEPARTMENT MODULES</Text>
            {PRIMARY_NAV.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => {
                    onNavigate(item.key);
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={22}
                    color={isActive ? '#EA580C' : '#4B5563'}
                  />
                  <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                    {item.label}
                  </Text>
                  {item.badge ? (
                    <View style={styles.navBadge}>
                      <Text style={styles.navBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {/* Role Switcher Section (if user holds multiple roles) */}
            {roles && roles.length > 1 && (
              <View style={styles.roleSwitchSection}>
                <Text style={styles.sectionHeader}>SWITCH ACTIVE ROLE</Text>
                <View style={styles.roleGrid}>
                  {roles.map((r) => {
                    const isCurrent = r === userRole;
                    return (
                      <TouchableOpacity
                        key={r}
                        style={[styles.roleChip, isCurrent && styles.roleChipActive]}
                        onPress={() => !isCurrent && handleSwitchRole(r)}
                        disabled={isCurrent}
                      >
                        <MaterialCommunityIcons
                          name={
                            r === 'principal'
                              ? 'shield-crown'
                              : r === 'hod'
                              ? 'domain'
                              : r === 'teacher'
                              ? 'human-male-board'
                              : r === 'admin'
                              ? 'shield-account'
                              : 'account'
                          }
                          size={14}
                          color={isCurrent ? '#FFFFFF' : '#4B5563'}
                        />
                        <Text style={[styles.roleChipText, isCurrent && styles.roleChipTextActive]}>
                          {r.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quick Actions */}
            <Text style={styles.sectionHeader}>PREFERENCES & ACCOUNT</Text>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                onClose();
                router.push('/(hod)/profile');
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="account-cog-outline" size={22} color="#4B5563" />
              <Text style={styles.navItemText}>Department Profile & Credentials</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => {
                onClose();
                router.push('/change-password');
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="lock-reset" size={22} color="#4B5563" />
              <Text style={styles.navItemText}>Security & Password</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Drawer Footer with Logout */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.7}>
              <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>College ERP v2.4 • HOD Academic Portal</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 4, height: 0 },
    shadowRadius: 16,
    elevation: 16,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoImage: {
    width: 120,
    height: 32,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 10,
    gap: 10,
    marginBottom: 14,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  profileDept: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
    fontFamily: FontFamily.poppins,
  },
  profileInstitute: {
    fontSize: 10,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  navScroll: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginTop: 14,
    marginBottom: 6,
    fontFamily: FontFamily.poppins,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
    marginBottom: 3,
  },
  navItemActive: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 3,
    borderLeftColor: '#EA580C',
  },
  navItemText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    fontFamily: FontFamily.poppins,
  },
  navItemTextActive: {
    color: '#EA580C',
    fontWeight: '800',
  },
  navBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  navBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
    fontFamily: FontFamily.poppins,
  },
  roleSwitchSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  roleChipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
    fontFamily: FontFamily.poppins,
  },
  versionText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
});
