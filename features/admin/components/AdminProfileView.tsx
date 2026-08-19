import React from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface AdminProfileViewProps {
  fullName: string;
  email: string;
  institutionName: string;
  institutionCode: string;
  roleName: string;
  designation: string;
  onChangePassword: () => void;
  onLogout: () => void;
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({
  fullName,
  email,
  institutionName,
  institutionCode,
  roleName,
  designation,
  onChangePassword,
  onLogout,
}) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{fullName.substring(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nameText}>{fullName}</Text>
            <Text style={styles.emailText}>{email}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{roleName || 'Institution Admin'}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Institutional Scoping */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Role & Institution</Text>
        {designation ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Designation</Text>
            <Text style={styles.infoValue}>{designation}</Text>
          </View>
        ) : null}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Assigned Institution</Text>
          <Text style={styles.infoValue}>{institutionName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Institution Code</Text>
          <Text style={[styles.infoValue, styles.codeText]}>{institutionCode || 'N/A'}</Text>
        </View>
      </View>

      {/* Account Settings & Controls */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account & Security</Text>
        <TouchableOpacity style={styles.menuItem} onPress={onChangePassword}>
          <MaterialCommunityIcons name="lock-reset" size={20} color="#7E57C2" />
          <Text style={styles.menuText}>Change Password</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#DC3545" />
          <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14, paddingBottom: 40 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#7E57C2' },
  nameText: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
  emailText: { fontSize: 13, color: '#718096', marginTop: 2 },
  badgeRow: { marginTop: 6 },
  roleBadge: { backgroundColor: '#EDE7F6', paddingHorizontal: 10, paddingVertical: 3, borderRadius: BorderRadius.chip, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 11, fontWeight: '800', color: '#7E57C2' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1A202C' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 28 },
  infoLabel: { fontSize: 13, color: '#718096', fontWeight: '500', flexShrink: 1 },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#1A202C', flexShrink: 1, textAlign: 'right' },
  codeText: { color: '#7E57C2' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  menuText: { fontSize: 14, fontWeight: '600', color: '#1A202C' },
});
