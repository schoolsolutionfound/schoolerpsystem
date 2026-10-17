import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { signOut } from 'firebase/auth';
import { auth } from '../../../firebaseConfig';
import { useUserStore } from '../../../store/useUserStore';
import { useRouter } from 'expo-router';

export function PlacementProfileView() {
  const fullName = useUserStore((state) => state.fullName);
  const email = useUserStore((state) => state.email);
  const phone = useUserStore((state) => state.phone);
  const profilePic = useUserStore((state) => state.profilePic);
  const institutionName = useUserStore((state) => state.institutionName);
  const institutionCode = useUserStore((state) => state.institutionCode);
  const placementAccess = useUserStore((state) => state.placementAccess);
  const resetUser = useUserStore((state) => state.resetUser);
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
          } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const isHead = placementAccess === 'head';
  const roleTitle = isHead ? 'Placement Cell Head' : 'Placement Cell Officer';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Officer Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="briefcase-account" size={38} color="#1A1B1C" />
            </View>
          )}
        </View>

        <Text style={styles.userName}>{fullName}</Text>
        <Text style={styles.userEmail}>{email}</Text>

        <View style={styles.roleChip}>
          {isHead && <MaterialCommunityIcons name="star" size={14} color="#1A1B1C" style={{ marginRight: 4 }} />}
          <Text style={styles.roleChipText}>{roleTitle}</Text>
        </View>
      </View>

      {/* Institution Details Card */}
      <Text style={styles.sectionHeader}>INSTITUTION & ACCESS</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="school" size={18} color="#F4C430" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Institution</Text>
            <Text style={styles.infoValue}>{institutionName || 'College'}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.infoRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="identifier" size={18} color="#F4C430" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Institution Code</Text>
            <Text style={styles.infoValue}>{institutionCode || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.infoRow}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#F4C430" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.infoLabel}>Access Privilege</Text>
            <Text style={styles.infoValue}>{isHead ? 'Placement Head (Admin Permissions)' : 'Placement Member'}</Text>
          </View>
        </View>

        {phone ? (
          <>
            <View style={styles.cardDivider} />
            <View style={styles.infoRow}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="phone" size={18} color="#F4C430" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Phone Number</Text>
                <Text style={styles.infoValue}>{phone}</Text>
              </View>
            </View>
          </>
        ) : null}
      </View>

      {/* Account Settings */}
      <Text style={styles.sectionHeader}>SETTINGS</Text>
      <View style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/change-password')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIcon}>
            <MaterialCommunityIcons name="lock-reset" size={18} color="#6B6B6B" />
          </View>
          <Text style={styles.menuText}>Change Account Password</Text>
          <Feather name="chevron-right" size={16} color="#9A9A9A" />
        </TouchableOpacity>

        <View style={styles.cardDivider} />

        <TouchableOpacity
          style={styles.menuRow}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <View style={styles.menuIcon}>
            <MaterialCommunityIcons name="bell-outline" size={18} color="#6B6B6B" />
          </View>
          <Text style={styles.menuText}>Notification Preferences</Text>
          <Feather name="chevron-right" size={16} color="#9A9A9A" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <MaterialCommunityIcons name="logout" size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Log Out from Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 14, paddingBottom: 60, gap: 12 },

  // Header Card
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 24,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: '#F4C430',
    overflow: 'hidden',
    marginBottom: 12,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: { fontSize: 18, fontWeight: '800', color: '#171717', fontFamily: FontFamily.bold },
  userEmail: { fontSize: 12, color: '#6B6B6B', marginTop: 3, fontFamily: FontFamily.regular },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 10,
  },
  roleChipText: { fontSize: 11, fontWeight: '800', color: '#1A1B1C', textTransform: 'uppercase' },

  // Section Headers
  sectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
    paddingHorizontal: 2,
  },

  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 11, color: '#8A8A8A', fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '700', color: '#171717', marginTop: 1 },
  cardDivider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 6 },

  // Menu Card
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 6,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#171717' },

  // Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    marginTop: 8,
  },
  logoutText: { fontSize: 13, fontWeight: '800', color: '#DC2626' },
});
