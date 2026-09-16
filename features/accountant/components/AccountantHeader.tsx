/**
 * @file AccountantHeader.tsx
 * @description Header component for Accountant & Finance portal, styled to match Student & Admin headers.
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface AccountantHeaderProps {
  fullName: string;
  profilePic?: string;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

export const AccountantHeader: React.FC<AccountantHeaderProps> = ({
  fullName,
  profilePic,
  onNotificationsPress,
  onProfilePress,
}) => {
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good Morning!';
    if (hr < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.schoolBrand}>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="finance" size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.schoolName}>SchoolHub Academy</Text>
            <Text style={styles.schoolSub}>Finance & Accounts Dept</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress}>
          <Feather name="bell" size={20} color="#1A202C" />
          <View style={styles.dotBadge} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.userGreetingRow} onPress={onProfilePress} activeOpacity={0.7}>
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account-tie" size={32} color="#7E57C2" />
            </View>
          )}
        </View>

        <View style={styles.greetingTextWrap}>
          <Text style={styles.welcomeLabel}>Welcome,</Text>
          <View style={styles.nameRow}>
            <Text style={styles.userNameText}>{fullName}</Text>
            <Text style={styles.waveHand}>👋</Text>
          </View>
          <Text style={styles.timeGreeting}>{getGreeting()}</Text>
        </View>

        <View style={styles.roleChip}>
          <MaterialCommunityIcons name="shield-check" size={12} color="#7E57C2" />
          <Text style={styles.roleChipText}>Accountant</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10, paddingBottom: 6 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  schoolBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#7E57C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolName: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  schoolSub: { fontSize: 10, color: '#718096', fontWeight: '500' },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dotBadge: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#7E57C2',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTextWrap: { flex: 1 },
  welcomeLabel: { fontSize: 12, color: '#718096' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userNameText: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
  waveHand: { fontSize: 16 },
  timeGreeting: { fontSize: 11, color: '#A0AEC0', marginTop: 1 },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleChipText: { fontSize: 10, fontWeight: '700', color: '#7E57C2' },
});
