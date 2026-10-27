import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

interface DeveloperMenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (tab: string) => void;
  fullName: string;
  email: string;
  onLogout: () => void;
}

const MENU_ITEMS = [
  { key: 'home', label: 'Home', icon: 'home-variant-outline' },
  { key: 'institutions', label: 'Institutions', icon: 'domain' },
  { key: 'admins', label: 'Admins', icon: 'account-group-outline' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline' },
] as const;

export const DeveloperMenuDrawer: React.FC<DeveloperMenuDrawerProps> = ({
  visible,
  onClose,
  activeTab,
  onNavigate,
  fullName,
  email,
  onLogout,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.panel}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <MaterialCommunityIcons name="shield-crown" size={22} color="#171717" />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandTitle}>Developer Console</Text>
              <Text style={styles.brandSub}>Platform Administration</Text>
            </View>
          </View>

          <View style={styles.userCard}>
            <Text style={styles.userName} numberOfLines={1}>{fullName}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{email}</Text>
          </View>

          <View style={styles.menu}>
            {MENU_ITEMS.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, isActive && styles.menuItemActive]}
                  onPress={() => {
                    onNavigate(item.key);
                    onClose();
                  }}
                  activeOpacity={0.75}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={20}
                    color={isActive ? '#171717' : '#6B6B6B'}
                  />
                  <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.75}>
            <MaterialCommunityIcons name="logout" size={20} color="#DC2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
  },
  backdrop: {
    flex: 1,
  },
  panel: {
    width: 290,
    backgroundColor: '#FFFDF7',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 28,
    borderLeftWidth: 1,
    borderLeftColor: '#E8E5DC',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flex: 1 },
  brandTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#171717' },
  brandSub: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  userName: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  userEmail: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  menu: { gap: 6 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: '#F4C430',
  },
  menuLabel: { fontSize: 14, fontFamily: FontFamily.medium, color: '#6B6B6B' },
  menuLabelActive: { fontFamily: FontFamily.bold, color: '#171717' },
  logoutBtn: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
  },
  logoutText: { fontSize: 14, fontFamily: FontFamily.bold, color: '#DC2626' },
});
