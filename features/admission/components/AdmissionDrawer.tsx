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

interface AdmissionDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  email?: string;
  profilePic?: string;
  institutionName?: string;
  activeTab?: string;
  onTabSwitch?: (tab: 'students' | 'tracking' | 'profile') => void;
}

export const AdmissionDrawer: React.FC<AdmissionDrawerProps> = ({
  visible,
  onClose,
  fullName = 'Admission Officer',
  email = '',
  profilePic,
  institutionName = '',
  activeTab = 'students',
  onTabSwitch,
}) => {
  const router = useRouter();
  const resetUser = useUserStore((s) => s.resetUser);
  const userRole = useUserStore((s) => s.userRole);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const menuItems = [
    { key: 'students', label: 'Admissions Registry', icon: 'account-group-outline', iconFilled: 'account-group', tab: 'students' as const },
    { key: 'tracking', label: 'Seat Tracking & Matrix', icon: 'layers-outline', iconFilled: 'layers', tab: 'tracking' as const },
    { key: 'profile', label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle', tab: 'profile' as const },
  ];

  const slideX = useRef(new Animated.Value(-width)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(slideX, {
          toValue: -width,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fade, {
          toValue: 0,
          duration: 220,
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

  const switchTabAndClose = (tab: 'students' | 'tracking' | 'profile') => {
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
                    <Text style={styles.brandSubtitle}>ADMISSION CELL</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                  <Feather name="x" size={18} color="#FFFFFF" />
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
                    <MaterialCommunityIcons name="account-school" size={24} color="#1A1B1C" />
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
              {menuItems.map((item) => {
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
                        size={16}
                        color={isActive ? '#1A1B1C' : '#9A9A9A'}
                      />
                    </View>
                    <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{item.label}</Text>
                    <Feather name="chevron-right" size={14} color={isActive ? '#1A1B1C' : '#5A5A5A'} />
                  </TouchableOpacity>
                );
              })}

              {(userRole === 'teacher' || userRole === 'admin') && (
                <>
                  <Text style={[styles.sectionLabel, { marginTop: 14 }]}>SWITCH PORTAL</Text>
                  {userRole === 'teacher' && (
                    <TouchableOpacity
                      style={[styles.menuItem, { backgroundColor: 'rgba(244, 196, 48, 0.08)', marginBottom: 4 }]}
                      activeOpacity={0.7}
                      onPress={() => navigateAndClose('/(teacher)/home')}
                    >
                      <View style={[styles.menuIcon, { borderColor: 'rgba(244, 196, 48, 0.3)', backgroundColor: 'rgba(244, 196, 48, 0.15)' }]}>
                        <MaterialCommunityIcons name="school-outline" size={16} color="#F4C430" />
                      </View>
                      <Text style={[styles.menuText, { color: '#F4C430', fontWeight: '700' }]}>Teacher Portal</Text>
                      <Feather name="chevron-right" size={14} color="#F4C430" />
                    </TouchableOpacity>
                  )}
                  {userRole === 'admin' && (
                    <TouchableOpacity
                      style={[styles.menuItem, { backgroundColor: 'rgba(244, 196, 48, 0.08)', marginBottom: 4 }]}
                      activeOpacity={0.7}
                      onPress={() => navigateAndClose('/(admin)/home')}
                    >
                      <View style={[styles.menuIcon, { borderColor: 'rgba(244, 196, 48, 0.3)', backgroundColor: 'rgba(244, 196, 48, 0.15)' }]}>
                        <MaterialCommunityIcons name="shield-account-outline" size={16} color="#F4C430" />
                      </View>
                      <Text style={[styles.menuText, { color: '#F4C430', fontWeight: '700' }]}>Admin Portal</Text>
                      <Feather name="chevron-right" size={14} color="#F4C430" />
                    </TouchableOpacity>
                  )}
                </>
              )}

              <Text style={[styles.sectionLabel, { marginTop: 14 }]}>ACCOUNT</Text>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => navigateAndClose('/notifications')}
              >
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons name="bell-outline" size={16} color="#9A9A9A" />
                </View>
                <Text style={styles.menuText}>Notifications</Text>
                <Feather name="chevron-right" size={14} color="#5A5A5A" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => navigateAndClose('/change-password')}
              >
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons name="lock-reset" size={16} color="#9A9A9A" />
                </View>
                <Text style={styles.menuText}>Change Password</Text>
                <Feather name="chevron-right" size={14} color="#5A5A5A" />
              </TouchableOpacity>
            </ScrollView>

            {/* Footer with Logout */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                <MaterialCommunityIcons name="logout" size={16} color="#F4C430" />
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
    width: '80%',
    maxWidth: 320,
  },
  drawer: {
    flex: 1,
    backgroundColor: '#1A1B1C',
    borderRightWidth: 1,
    borderRightColor: '#2A2B2C',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
    backgroundColor: '#141516',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandLogo: { width: 30, height: 30 },
  brandTitle: { fontSize: 13.5, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },
  brandSubtitle: { fontSize: 8.5, fontWeight: '700', color: '#F4C430', letterSpacing: 0.5 },
  closeBtn: {
    width: 28,
    height: 28,
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
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden',
    borderWidth: 1.5,
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
  userName: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  userInstitution: { fontSize: 9.5, color: '#8A8A8A', fontWeight: '600', marginTop: 2 },
  body: { flex: 1 },
  bodyContent: { paddingTop: 12, paddingHorizontal: 8, paddingBottom: 16 },
  sectionLabel: {
    fontSize: 9.5,
    color: '#6A6A6A',
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 1,
  },
  menuItemActive: {
    backgroundColor: '#F4C430',
  },
  menuIcon: {
    width: 28,
    height: 28,
    borderRadius: 5,
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
  menuText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#E5E5E5' },
  menuTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: '#2A2B2C',
    backgroundColor: '#141516',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: '#F4C430', letterSpacing: 0.3 },
  version: { fontSize: 9.5, color: '#5A5A5A', textAlign: 'center', marginTop: 8, letterSpacing: 0.5 },
});
