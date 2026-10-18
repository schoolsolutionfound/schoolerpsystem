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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';

interface PlacementDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  email?: string;
  profilePic?: string;
  institutionName?: string;
  activeTab?: string;
  onTabSwitch?: (tab: 'drives' | 'students' | 'team' | 'profile') => void;
}

const PRIMARY = [
  { key: 'drives', label: 'Placement Drives', icon: 'briefcase-outline', iconFilled: 'briefcase', tab: 'drives' as const },
  { key: 'students', label: 'Students Directory', icon: 'account-group-outline', iconFilled: 'account-group', tab: 'students' as const },
  { key: 'team', label: 'Placement Team', icon: 'account-multiple-outline', iconFilled: 'account-multiple', tab: 'team' as const },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle', tab: 'profile' as const },
];

export const PlacementDrawer: React.FC<PlacementDrawerProps> = ({
  visible,
  onClose,
  fullName = 'Placement Officer',
  email = '',
  profilePic,
  institutionName = '',
  activeTab = 'drives',
  onTabSwitch,
}) => {
  const router = useRouter();
  const resetUser = useUserStore((s) => s.resetUser);
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
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -width,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, slideX, fade, mounted, width]);

  const navigateAndClose = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 120);
  };

  const switchTabAndClose = (tab: 'drives' | 'students' | 'team' | 'profile') => {
    if (onTabSwitch) {
      onTabSwitch(tab);
    }
    onClose();
  };

  const handleLogout = () => {
    onClose();
    setTimeout(async () => {
      try {
        await signOut(auth);
      } catch {}
      resetUser();
      router.replace('/auth');
    }, 120);
  };

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawerWrap,
            { transform: [{ translateX: slideX }] },
          ]}
        >
          <SafeAreaView style={styles.drawer} edges={['bottom']}>
            {/* Header with Brand Logo */}
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
              <View style={styles.headerTopRow}>
                <View style={styles.brandRow}>
                  <Image
                    source={require('../../../assets/logo-transparent.png')}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={styles.brandTitle}>KIVQUO</Text>
                    <Text style={styles.brandSubtitle}>PLACEMENT CELL</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                  <Feather name="x" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* User profile preview */}
            <View style={styles.userSection}>
              <View style={styles.avatarWrap}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="briefcase-account" size={26} color="#1A1B1C" />
                  </View>
                )}
              </View>
              <View style={styles.userTextWrap}>
                <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
                {institutionName ? (
                  <Text style={styles.userInstitution} numberOfLines={1}>{institutionName}</Text>
                ) : null}
              </View>
            </View>

            {/* Menu Body */}
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionLabel}>WORKSPACE</Text>
              {PRIMARY.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    activeOpacity={0.7}
                    onPress={() => switchTabAndClose(item.tab)}
                  >
                    <View style={[styles.menuIcon, isActive && styles.menuIconActive]}>
                      <MaterialCommunityIcons
                        name={isActive ? (item.iconFilled as any) : (item.icon as any)}
                        size={18}
                        color={isActive ? '#1A1B1C' : '#9A9A9A'}
                      />
                    </View>
                    <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{item.label}</Text>
                    <Feather name="chevron-right" size={16} color={isActive ? '#1A1B1C' : '#5A5A5A'} />
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.sectionLabel, { marginTop: 18 }]}>ACCOUNT</Text>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => navigateAndClose('/notifications')}
              >
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons name="bell-outline" size={18} color="#9A9A9A" />
                </View>
                <Text style={styles.menuText}>Notifications</Text>
                <Feather name="chevron-right" size={16} color="#5A5A5A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => navigateAndClose('/change-password')}
              >
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons name="lock-reset" size={18} color="#9A9A9A" />
                </View>
                <Text style={styles.menuText}>Change Password</Text>
                <Feather name="chevron-right" size={16} color="#5A5A5A" />
              </TouchableOpacity>
            </ScrollView>

            {/* Footer with Logout */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
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
  brandTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  brandSubtitle: { fontSize: 9, fontWeight: '700', color: '#F4C430', letterSpacing: 0.5 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
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
  userName: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  roleBadge: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  roleBadgeText: { fontSize: 9, color: '#F4C430', fontWeight: '800', textTransform: 'uppercase' },
  userInstitution: { fontSize: 10, color: '#8A8A8A', fontWeight: '600', marginTop: 3 },
  body: { flex: 1 },
  bodyContent: { paddingTop: 14, paddingHorizontal: 10, paddingBottom: 20 },
  sectionLabel: {
    fontSize: 10,
    color: '#6A6A6A',
    fontWeight: '800',
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
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: '#F4C430',
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#232425',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#E5E5E5' },
  menuTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
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
    borderRadius: 8,
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  logoutText: { fontSize: 14, fontWeight: '800', color: '#F4C430', letterSpacing: 0.3 },
  version: { fontSize: 10, color: '#5A5A5A', textAlign: 'center', marginTop: 10, letterSpacing: 0.5 },
});
