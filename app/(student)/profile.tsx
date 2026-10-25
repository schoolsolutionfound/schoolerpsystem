import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { uploadProfilePictureApi } from '../../api/upload';
import { FontFamily } from '../../constants/fonts';

export default function StudentProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fullName = useUserStore((s) => s.fullName) || 'Safwan Haneef';
  const email = useUserStore((s) => s.email) || 'safwanhaneef786@gmail.com';
  const rollNoOrUSN = useUserStore((s) => s.rollNoOrUSN) || 'C6A-001';
  const institutionName = useUserStore((s) => s.institutionName) || 'Test School';
  const institutionCode = useUserStore((s) => s.institutionCode) || 'TST001';
  const phone = useUserStore((s) => s.phone) || '7892104273';
  const parentPhone = useUserStore((s) => s.parentPhone) || '7892104273';
  const tenthPercentage = useUserStore((s) => s.tenthPercentage) || '';
  const profilePic = useUserStore((s) => s.profilePic) || '';

  const resetUser = useUserStore((s) => s.resetUser);
  const setUserProfile = useUserStore((s) => s.setUserProfile);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, []);

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

  return (
    <View style={styles.container}>
      {/* Decorative Warm Accent in Top-Right Corner */}
      <View style={styles.decorCircle} pointerEvents="none" />

      {/* Top Bar with ONLY Back Icon */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="chevron-left" size={28} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {/* User Info Header: Avatar, Name, Email, Edit Pencil */}
        <View style={styles.userHeaderRow}>
          {/* Avatar with Camera Badge */}
          <TouchableOpacity
            style={styles.avatarContainer}
            activeOpacity={0.85}
            onPress={handlePickPhoto}
          >
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={48} color="#292524" />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <MaterialCommunityIcons name="camera" size={13} color="#FDC836" />
            </View>
          </TouchableOpacity>

          {/* User Name & Email */}
          <View style={styles.userMetaCol}>
            <Text style={styles.userNameText} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.userEmailText} numberOfLines={1}>
              {email}
            </Text>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.8}
            onPress={handlePickPhoto}
          >
            <MaterialCommunityIcons name="pencil" size={16} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* USN & Code Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsCol}>
            <Text style={styles.statsVal}>{rollNoOrUSN || 'C6A-001'}</Text>
            <Text style={styles.statsLabel}>USN / ROLL NO</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsCol}>
            <Text style={styles.statsVal}>{institutionCode || 'TST001'}</Text>
            <Text style={styles.statsLabel}>CODE</Text>
          </View>
        </View>

        {/* Section 1: Academic Info */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Academic Info</Text>
        </View>
        <View style={styles.card}>
          {/* Row 1: USN & Phone */}
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>USN / ROLL NO</Text>
              <Text style={styles.infoValue}>{rollNoOrUSN || 'C6A-001'}</Text>
            </View>
            <View style={styles.cellDivider} />
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>PHONE</Text>
              <Text style={styles.infoValue}>{phone || '7892104273'}</Text>
            </View>
          </View>

          <View style={styles.horizontalDivider} />

          {/* Row 2: Parent Phone & 10th % */}
          <View style={styles.gridRow}>
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>PARENT PHONE</Text>
              <Text style={styles.infoValue}>{parentPhone || '7892104273'}</Text>
            </View>
            <View style={styles.cellDivider} />
            <View style={styles.gridCell}>
              <Text style={styles.infoLabel}>10TH %</Text>
              <View style={styles.pctPill}>
                <Text style={styles.pctPillText}>{tenthPercentage ? `${tenthPercentage}%` : '–'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Section 2: Institution */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Institution</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.infoLabel}>NAME</Text>
          <Text style={styles.infoValue}>{institutionName || 'Test School'}</Text>
        </View>

        {/* Section 3: Account */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>Account</Text>
        </View>
        <View style={[styles.card, { padding: 0 }]}>
          {/* Change Password */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => router.push('/change-password')}
          >
            <View style={styles.actionIconBox}>
              <MaterialCommunityIcons name="lock-outline" size={19} color="#D97706" />
            </View>
            <Text style={styles.actionText}>Change Password</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <View style={styles.horizontalDivider} />

          {/* Logout */}
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <View style={styles.actionIconBox}>
              <MaterialCommunityIcons name="logout" size={19} color="#D97706" />
            </View>
            <Text style={styles.actionText}>Logout</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  decorCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: '#FEF3C7',
    opacity: 0.6,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
  },

  /* ─── User Info Header ────────────────────────────────────────────── */
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FDC836',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userMetaCol: {
    flex: 1,
  },
  userNameText: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  userEmailText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 3,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDC836',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  /* ─── USN & Code Card ────────────────────────────────────────────── */
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  statsCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsVal: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  statsLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  statsDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#EFE7D8',
  },

  /* ─── Section Header ─────────────────────────────────────────────── */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 22,
    marginBottom: 8,
  },
  sectionAccent: {
    width: 3.5,
    height: 16,
    backgroundColor: '#FDC836',
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* ─── Generic White Card ─────────────────────────────────────────── */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3EFE8',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridCell: {
    flex: 1,
  },
  cellDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#F3EFE8',
    marginHorizontal: 12,
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#F3EFE8',
    marginVertical: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginTop: 4,
  },
  pctPill: {
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pctPillText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#D97706',
  },

  /* ─── Account Actions ────────────────────────────────────────────── */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: '#111827',
  },
});
