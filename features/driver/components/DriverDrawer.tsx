import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Image,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import type { DriverTab } from './DriverBottomNav';

interface DriverDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  profilePic?: string;
  institutionName: string;
  activeTab?: DriverTab;
  onNavigate?: (tab: DriverTab) => void;
  onChangePassword: () => void;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { key: 'trips', label: 'My Trips', icon: 'bus-clock' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline' },
  { key: 'profile', label: 'My Profile', icon: 'account-outline' },
] as const;

const ACCOUNT_ITEMS = [
  { key: 'change-password', label: 'Change Password', icon: 'lock-reset' },
] as const;

export const DriverDrawer: React.FC<DriverDrawerProps> = ({
  visible,
  onClose,
  fullName,
  email,
  profilePic,
  institutionName,
  activeTab,
  onNavigate,
  onChangePassword,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const screenWidth = width;
  const slideAnim = React.useRef(new Animated.Value(-screenWidth)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      slideAnim.setValue(-screenWidth);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim, screenWidth]);

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -screenWidth, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onClose());
  };

  const firstName = fullName.split(' ')[0] || fullName;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDrawer} />
        <Animated.View style={[styles.drawerWrap, { transform: [{ translateX: slideAnim }] }]}>
          <SafeAreaView style={styles.drawer} edges={['bottom']}>
            <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
              <View style={styles.headerTopRow}>
                <View style={styles.brandRow}>
                  <Image
                    source={require('../../../assets/logo-transparent.png')}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.brandTitle}>KIVQUO</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={closeDrawer} hitSlop={10}>
                  <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.userSection}>
              <View style={styles.avatarWrap}>
                {profilePic ? (
                  <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialCommunityIcons name="bus" size={24} color="#1A1B1C" />
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
              {MENU_ITEMS.map((item) => {
                const isActive = activeTab === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.menuItem, isActive && styles.menuItemActive]}
                    activeOpacity={0.7}
                    onPress={() => {
                      closeDrawer();
                      onNavigate?.(item.key);
                    }}
                  >
                    <View style={[styles.menuIcon, isActive && styles.menuIconActive]}>
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={18}
                        color={isActive ? '#F4C430' : '#9A9A9A'}
                      />
                    </View>
                    <Text style={[styles.menuText, isActive && styles.menuTextActive]}>{item.label}</Text>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#5A5A5A" />
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.sectionLabel, { marginTop: 18 }]}>ACCOUNT</Text>
              {ACCOUNT_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    closeDrawer();
                    if (item.key === 'change-password') onChangePassword();
                  }}
                >
                  <View style={styles.menuIcon}>
                    <MaterialCommunityIcons name={item.icon as any} size={18} color="#9A9A9A" />
                  </View>
                  <Text style={styles.menuText}>{item.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#5A5A5A" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  closeDrawer();
                  setTimeout(() => onLogout(), 120);
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
  overlay: { flex: 1, flexDirection: 'row' },
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
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
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
  brandTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
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
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    borderColor: 'rgba(244, 196, 48, 0.25)',
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
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
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
  version: {
    fontSize: 10,
    fontFamily: FontFamily.regular,
    color: '#5A5A5A',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.5,
  },
});
