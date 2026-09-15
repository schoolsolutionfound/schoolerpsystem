import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { BorderRadius } from '../../constants/theme';
import { FontFamily } from '../../constants/fonts';

export default function TeacherProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fullName = useUserStore((s) => s.fullName) || 'Teacher';
  const email = useUserStore((s) => s.email) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const institutionType = useUserStore((s) => s.institutionType) || 'school';
  const phone = useUserStore((s) => s.phone) || '';
  const employeeId = useUserStore((s) => s.employeeId) || '';
  const department = useUserStore((s) => s.department) || '';
  const designation = useUserStore((s) => s.designation) || '';
  const qualification = useUserStore((s) => s.qualification) || '';
  const experience = useUserStore((s) => s.experience) || '';
  const profilePic = useUserStore((s) => s.profilePic) || '';
  const resetUser = useUserStore((s) => s.resetUser);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={[]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F4C430"
              colors={['#F4C430']}
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {/* Hero Section */}
          <View style={[styles.heroSection, { paddingTop: insets.top + 12 }]}>
            <View style={styles.heroRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrap}>
                  {profilePic ? (
                    <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{fullName.substring(0, 2).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.avatarBadge}>
                  <MaterialCommunityIcons name="check" size={11} color="#0E0E0E" />
                </View>
              </View>
              <View style={styles.heroMain}>
                <View style={styles.heroHandleRow}>
                  <Text style={styles.heroHandle}>{fullName}</Text>
                </View>
                <Text style={styles.heroEmail} numberOfLines={1}>{email || '—'}</Text>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroRoleBadge}>
                    <MaterialCommunityIcons name="school" size={13} color="#F4C430" />
                    <Text style={styles.heroRoleText}>Teacher</Text>
                  </View>
                  {department ? (
                    <View style={styles.heroInstBadge}>
                      <Text style={styles.heroInstText} numberOfLines={1}>{department}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Quick stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statNum} numberOfLines={1}>{employeeId || '—'}</Text>
                <Text style={styles.statLabel}>Employee ID</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum} numberOfLines={1}>{department || '—'}</Text>
                <Text style={styles.statLabel}>Department</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum} numberOfLines={1}>{designation || '—'}</Text>
                <Text style={styles.statLabel}>Designation</Text>
              </View>
            </View>
          </View>

          {/* Employment Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="briefcase-outline" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Employment Details</Text>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Employee ID</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{employeeId || '—'}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Department</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{department || '—'}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Designation</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{designation || '—'}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Qualification</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{qualification || '—'}</Text>
              </View>
            </View>
            <View style={[styles.gridRow, { borderBottomWidth: 0 }]}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Experience</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{experience ? `${experience} years` : '—'}</Text>
              </View>
              <View style={styles.gridCell} />
            </View>
          </View>

          {/* Contact Info */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Contact Info</Text>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{email || '—'}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{phone || '—'}</Text>
              </View>
            </View>
          </View>

          {/* Institution */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="office-building" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Institution</Text>
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, styles.gridFull]}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {institutionName || institutionCode || '—'}
                </Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Code</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{institutionCode || '—'}</Text>
              </View>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Type</Text>
                <Text style={styles.infoValue}>{institutionType === 'college' ? 'College' : 'School'}</Text>
              </View>
            </View>
          </View>

          {/* Account */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cog-outline" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')}>
              <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name="lock-reset" size={17} color="#F4C430" />
              </View>
              <Text style={styles.menuText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#B5B5B5" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(220, 53, 69, 0.1)' }]}>
                <MaterialCommunityIcons name="logout" size={17} color="#DC3545" />
              </View>
              <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#B5B5B5" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  safe: { flex: 1 },
  scroll: { paddingBottom: 40 },

  // Hero Section
  heroSection: {
    backgroundColor: '#1A1B1C',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2B2C',
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarContainer: { position: 'relative', width: 72, height: 72 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', borderWidth: 2, borderColor: '#1A1B1C' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F4C430', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 24, fontWeight: '800', color: '#1A1B1C' },
  avatarBadge: {
    position: 'absolute', bottom: 0, right: -2,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#F4C430', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#1A1B1C',
  },
  heroMain: { flex: 1, minWidth: 0 },
  heroHandleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroHandle: { fontSize: 19, fontWeight: '800', color: '#FFFFFF', flexShrink: 1 },
  heroEmail: { fontSize: 12, color: '#9A9A9A', marginTop: 2 },
  heroBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  heroRoleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    borderWidth: 1, borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  heroRoleText: { fontSize: 11, fontWeight: '700', color: '#F4C430' },
  heroInstBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', maxWidth: 180,
  },
  heroInstText: { fontSize: 11, fontWeight: '600', color: '#BDBDBD' },

  // Stats strip
  statsRow: {
    flexDirection: 'row', alignItems: 'stretch', marginTop: 16,
    backgroundColor: '#232425', borderRadius: 8, paddingVertical: 12,
    borderWidth: 1, borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  statNum: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 10, fontWeight: '600', color: '#8A8A8A', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 10,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    marginHorizontal: 12, marginTop: 12,
    borderWidth: 1, borderColor: '#E8E5DC',
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EFE9D6',
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1A1B1C', letterSpacing: 0.3 },

  // Info grid
  gridRow: {
    flexDirection: 'row', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F3F1EA',
  },
  gridCell: { flex: 1, paddingRight: 8 },
  gridFull: { flex: 1, paddingRight: 0 },
  infoLabel: {
    fontSize: 10, color: '#8A8A8A', fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4,
  },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1A1B1C' },

  // Menu Items
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F1EA',
  },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: 6,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  menuText: { fontSize: 14, fontWeight: '600', color: '#1A1B1C', flex: 1 },
  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 4 },
});
