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
  Dimensions,
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

interface TeacherDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName?: string;
  email?: string;
  profilePic?: string;
  institutionName?: string;
  activeTab?: string;
  onTabSwitch?: (tab: 'home' | 'schedule' | 'attendance' | 'marks' | 'reports' | 'homework' | 'chat' | 'locate' | 'profile') => void;
}

const PRIMARY = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconFilled: 'home' },
  { key: 'schedule', label: 'My Schedule', icon: 'calendar-outline', iconFilled: 'calendar', tab: 'schedule' as const },
  { key: 'attendance', label: 'Mark Attendance', icon: 'clipboard-check-outline', iconFilled: 'clipboard-check', tab: 'attendance' as const },
  { key: 'marks', label: 'Marks & Grades', icon: 'certificate-outline', iconFilled: 'certificate', tab: 'marks' as const },
  { key: 'homework', label: 'Homework', icon: 'book-plus-outline', iconFilled: 'book-plus', tab: 'homework' as const },
  { key: 'reports', label: 'Attendance Reports', icon: 'chart-bar', iconFilled: 'chart-bar', tab: 'reports' as const },
  { key: 'chat', label: 'Parent Chat', icon: 'message-text-outline', iconFilled: 'message-text', tab: 'chat' as const },
  { key: 'locate', label: 'Locate Students', icon: 'map-marker-outline', iconFilled: 'map-marker', tab: 'locate' as const },
];

const SECONDARY = [
  { key: 'profile', label: 'Profile', icon: 'account-outline', route: '/(teacher)/profile' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline', route: '/notifications' },
  { key: 'change-password', label: 'Change Password', icon: 'lock-reset', route: '/change-password' },
  { key: 'timetable', label: 'Build Timetable', icon: 'calendar-edit', route: '/teacher-timetable' },
];

export const TeacherDrawer: React.FC<TeacherDrawerProps> = ({
  visible,
  onClose,
  fullName = 'Teacher',
  email = '',
  profilePic,
  institutionName = '',
  activeTab,
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

  const switchTabAndClose = (tab: 'home' | 'schedule' | 'attendance' | 'marks' | 'reports' | 'homework' | 'chat' | 'locate' | 'profile') => {
    if (onTabSwitch) {
      onTabSwitch(tab);
    } else {
      onClose();
      setTimeout(() => router.push({ pathname: '/(teacher)/home', params: { tab } } as any), 120);
    }
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

  const firstName = fullName.split(' ')[0];

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
          <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
            <View style={styles.headerTopRow}>
              <View style={styles.brandRow}>
                <Image source={require('../../../assets/logo-transparent.png')} style={styles.brandLogo} resizeMode="contain" />
                <View>
                  <Text style={styles.brandTitle}>KIVQUO</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={10}>
                <Feather name="x" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

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
              {institutionName ? <Text style={styles.userInstitution}>{institutionName}</Text> : null}
            </View>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>MAIN</Text>
            {PRIMARY.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.menuItem, activeTab === item.key && styles.menuItemActive]}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.tab) switchTabAndClose(item.tab);
                  else switchTabAndClose('home');
                }}
              >
                <View style={[styles.menuIcon, activeTab === item.key && styles.menuIconActive]}>
                  <MaterialCommunityIcons
                    name={activeTab === item.key ? (item.iconFilled as any) : (item.icon as any)}
                    size={18}
                    color={activeTab === item.key ? '#F4C430' : '#9A9A9A'}
                  />
                </View>
                <Text style={[styles.menuText, activeTab === item.key && styles.menuTextActive]}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color="#5A5A5A" />
              </TouchableOpacity>
            ))}

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>ACCOUNT</Text>
            {SECONDARY.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => navigateAndClose(item.route)}
              >
                <View style={styles.menuIcon}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={18}
                    color="#9A9A9A"
                  />
                </View>
                <Text style={styles.menuText}>{item.label}</Text>
                <Feather name="chevron-right" size={16} color="#5A5A5A" />
              </TouchableOpacity>
            ))}
          </ScrollView>

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
  userEmail: { fontSize: 11, color: '#8A8A8A', marginTop: 1 },
  userInstitution: { fontSize: 10, color: '#F4C430', fontWeight: '700', marginTop: 2 },

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
    backgroundColor: 'rgba(244, 196, 48, 0.1)',
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
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#E5E5E5' },
  menuTextActive: { color: '#F4C430', fontWeight: '700' },

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
