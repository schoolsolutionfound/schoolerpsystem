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
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';

interface StudentDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  profilePic?: string;
  institutionName?: string;
  rollNoOrUSN?: string;
}

const PRIMARY = [
  { key: 'home', label: 'Home', icon: 'home-outline', iconFilled: 'home', route: '/(student)/home' },
  { key: 'attendance', label: 'Attendance', icon: 'book-outline', iconFilled: 'book', tab: 'attendance' as const },
  { key: 'homework', label: 'Homework', icon: 'book-plus-outline', iconFilled: 'book-plus', tab: 'homework' as const },
  { key: 'bus', label: 'Bus Tracking', icon: 'bus', iconFilled: 'bus', tab: 'bus' as const },
  { key: 'marks', label: 'Marks & Grades', icon: 'certificate-outline', iconFilled: 'certificate', tab: 'marks' as const },
  { key: 'schedule', label: 'Schedule', icon: 'calendar-outline', iconFilled: 'calendar', tab: 'schedule' as const },
];

const SECONDARY = [
  { key: 'profile', label: 'Profile', icon: 'account-outline', route: '/(student)/profile' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline', route: '/notifications' },
  { key: 'change-password', label: 'Change Password', icon: 'lock-reset', route: '/change-password' },
];

export const StudentDrawer: React.FC<StudentDrawerProps> = ({
  visible,
  onClose,
  fullName,
  email,
  profilePic,
  institutionName,
  rollNoOrUSN,
}) => {
  const router = useRouter();
  const resetUser = useUserStore((s) => s.resetUser);
  const insets = useSafeAreaInsets();

  const slideX = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
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
          toValue: -Dimensions.get('window').width,
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
  }, [visible, slideX, fade, mounted]);

  const navigateAndClose = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 120);
  };

  const switchTabAndClose = (tab: 'attendance' | 'bus' | 'marks' | 'schedule' | 'homework') => {
    onClose();
    setTimeout(() => router.push({ pathname: '/(student)/home', params: { tab } } as any), 120);
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

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>MAIN</Text>
            {PRIMARY.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  if (item.route) navigateAndClose(item.route);
                  else if (item.tab) switchTabAndClose(item.tab);
                }}
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
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
  brandSub: { fontSize: 10, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700' },
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
  menuText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#E5E5E5' },

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
