import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface DriverProfileTabProps {
  fullName: string;
  email: string;
  institutionName?: string;
  refreshControl?: React.ReactElement<any>;
  onLogout: () => void;
}

export const DriverProfileTab: React.FC<DriverProfileTabProps> = ({
  fullName,
  email,
  institutionName,
  refreshControl,
  onLogout,
}) => {
  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="bus" size={36} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.profileName}>{fullName}</Text>
        <Text style={styles.profileEmail}>{email}</Text>
        {institutionName ? (
          <View style={styles.instBadge}>
            <MaterialCommunityIcons name="office-building" size={14} color="#0EA5E9" />
            <Text style={styles.instText}>{institutionName}</Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
        <MaterialCommunityIcons name="logout" size={18} color="#DC3545" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  profileCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 8,
  },
  avatarWrap: { marginBottom: 4 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  profileEmail: { fontSize: 13, color: '#8A8A8A' },
  instBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 4,
  },
  instText: { fontSize: 12, fontWeight: '600', color: '#0EA5E9' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#DC3545' },
});
