import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Alert, RefreshControl, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { BorderRadius } from '../../constants/theme';
import { FontFamily } from '../../constants/fonts';
import { uploadProfilePictureApi } from '../../api/upload';

export default function ParentProfileScreen() {
  const router = useRouter();
  const fullName = useUserStore((s) => s.fullName) || 'Parent';
  const email = useUserStore((s) => s.email) || '';
  const institutionName = useUserStore((s) => s.institutionName) || '';
  const institutionCode = useUserStore((s) => s.institutionCode) || '';
  const institutionType = useUserStore((s) => s.institutionType) || 'school';
  const phone = useUserStore((s) => s.phone) || '';
  const profilePic = useUserStore((s) => s.profilePic) || '';
  const linkedStudentUSN = useUserStore((s) => s.linkedStudentUSN) || '';
  const relation = useUserStore((s) => s.relation) || '';
  const childId = useUserStore((s) => s.childId) || '';
  const childName = useUserStore((s) => s.childName) || '';
  const resetUser = useUserStore((s) => s.resetUser);
  const setUserProfile = useUserStore((s) => s.setUserProfile);
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);

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

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const uri = result.assets[0].uri;
    try {
      const url = await uploadProfilePictureApi(uri);
      setUserProfile({ profilePic: url });
      Alert.alert('Success', 'Profile photo updated!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload photo');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
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
              tintColor="#1A1B1C"
              colors={['#1A1B1C']}
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {/* Hero Section */}
          <View style={[styles.heroSection, { paddingTop: insets.top + 12 }]}>
            <View style={styles.heroRow}>
              <View style={styles.avatarContainer}>
                <TouchableOpacity style={styles.avatarWrap} onPress={handlePickPhoto} activeOpacity={0.8}>
                  {profilePic ? (
                    <Image source={{ uri: profilePic }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <MaterialCommunityIcons name="account-heart" size={36} color="#1A1B1C" />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cameraOverlay} onPress={handlePickPhoto} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.heroMain}>
                <View style={styles.heroHandleRow}>
                  <Text style={styles.heroHandle}>{fullName}</Text>
                  <View style={styles.avatarBadge}>
                    <MaterialCommunityIcons name="check" size={11} color="#0E0E0E" />
                  </View>
                </View>
                <Text style={styles.heroEmail} numberOfLines={1}>{email || '—'}</Text>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.heroRoleBadge}>
                    <MaterialCommunityIcons name="account-heart" size={13} color="#F4C430" />
                    <Text style={styles.heroRoleText}>Parent</Text>
                  </View>
                  {institutionName ? (
                    <View style={styles.heroInstBadge}>
                      <Text style={styles.heroInstText} numberOfLines={1}>{institutionName}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Quick stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{relation || '—'}</Text>
                <Text style={styles.statLabel}>Relation</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{institutionType === 'college' ? 'College' : 'School'}</Text>
                <Text style={styles.statLabel}>Type</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum} numberOfLines={1}>{institutionCode || '—'}</Text>
                <Text style={styles.statLabel}>Code</Text>
              </View>
            </View>
          </View>

          {/* Linked Child */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="account-school" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Linked Child</Text>
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, styles.gridFull]}>
                <Text style={styles.infoLabel}>Student Name</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{childName || '—'}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={[styles.gridCell, styles.gridFull]}>
                <Text style={styles.infoLabel}>Student USN / Roll No</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{linkedStudentUSN || '—'}</Text>
              </View>
            </View>
            <View style={styles.gridRow}>
              <View style={styles.gridCell}>
                <Text style={styles.infoLabel}>Relation</Text>
                <Text style={styles.infoValue}>{relation || '—'}</Text>
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

          {/* Contact */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="phone-outline" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Contact</Text>
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

          {/* Account */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="cog-outline" size={16} color="#F4C430" />
              <Text style={styles.sectionTitle}>Account</Text>
            </View>
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/change-password')}>
              <MaterialCommunityIcons name="lock-reset" size={18} color="#F4C430" />
              <Text style={styles.menuText}>Change Password</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#C0C0C0" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={18} color="#DC3545" />
              <Text style={[styles.menuText, { color: '#DC3545' }]}>Logout</Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#C0C0C0" />
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>KIVQUO v1.0 · Parent Portal</Text>
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
  heroRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  avatarContainer: { position: 'relative' },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1A1B1C',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  heroMain: { flex: 1, justifyContent: 'center' },
  heroHandleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroHandle: { fontSize: 19, fontFamily: FontFamily.extrabold, color: '#FFFFFF', flexShrink: 1 },
  avatarBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1B1C',
  },
  heroEmail: { fontSize: 12, fontFamily: FontFamily.regular, color: '#9A9A9A', marginTop: 2 },
  heroBadgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  heroRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 196, 48, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  heroRoleText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#F4C430' },
  heroInstBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroInstText: { fontSize: 11, fontFamily: FontFamily.medium, color: '#9A9A9A' },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#232425',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNum: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#FFFFFF' },
  statLabel: { fontSize: 9, fontFamily: FontFamily.bold, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#171717' },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCell: { flex: 1, gap: 4 },
  gridFull: { flex: 2 },
  infoLabel: { fontSize: 11, fontFamily: FontFamily.medium, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuText: { flex: 1, fontSize: 14, fontFamily: FontFamily.semibold, color: '#171717' },

  // Version
  versionText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#C0C0C0',
    textAlign: 'center',
    marginTop: 24,
  },
});
