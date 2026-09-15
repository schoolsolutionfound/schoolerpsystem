import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

interface DriverDrawerProps {
  visible: boolean;
  onClose: () => void;
  fullName: string;
  email: string;
  profilePic?: string;
  institutionName: string;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { key: 'profile', label: 'My Profile', icon: 'account-outline' },
  { key: 'trips', label: 'My Trips', icon: 'bus-clock-outline' },
] as const;

const SECONDARY_ITEMS = [
  { key: 'logout', label: 'Logout', icon: 'logout', color: '#DC3545' },
] as const;

export const DriverDrawer: React.FC<DriverDrawerProps> = ({
  visible,
  onClose,
  fullName,
  email,
  institutionName,
  onLogout,
}) => {
  const screenWidth = Dimensions.get('window').width;
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

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeDrawer} />
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <View style={styles.header}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="bus" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.drawerName}>{fullName}</Text>
            <Text style={styles.drawerEmail}>{email}</Text>
            {institutionName ? <Text style={styles.drawerInst}>{institutionName}</Text> : null}
          </View>

          <View style={styles.menuSection}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity key={item.key} style={styles.menuItem} onPress={closeDrawer}>
                <MaterialCommunityIcons name={item.icon as any} size={20} color="#171717" />
                <Text style={styles.menuText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divider} />

          <View style={styles.menuSection}>
            {SECONDARY_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={styles.menuItem}
                onPress={() => { closeDrawer(); onLogout(); }}
              >
                <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                <Text style={[styles.menuText, { color: item.color }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: {
    width: 280,
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    gap: 6,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  drawerName: { fontSize: 17, fontWeight: '800', color: '#171717' },
  drawerEmail: { fontSize: 12, color: '#6B6B6B' },
  drawerInst: { fontSize: 11, color: '#0EA5E9', fontWeight: '600' },
  menuSection: { paddingHorizontal: 12, paddingVertical: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuText: { fontSize: 14, fontWeight: '600', color: '#171717' },
  divider: { height: 1, backgroundColor: '#E8E5DC', marginHorizontal: 20, marginVertical: 4 },
});
