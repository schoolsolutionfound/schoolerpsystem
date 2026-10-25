/**
 * @file AccountantHeader.tsx
 * @description Header for the Accountant & Finance portal — mirrors StudentHomeHeader:
 *  hamburger · text-logo · bell, then avatar + greeting + name + chevron.
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BellIcon } from '../../notifications/components/BellIcon';

interface AccountantHeaderProps {
  fullName: string;
  profilePic?: string;
  showGreeting?: boolean;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

const getGreeting = (): string => {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good Morning';
  if (hr < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const AccountantHeader: React.FC<AccountantHeaderProps> = ({
  fullName,
  profilePic,
  showGreeting = true,
  onMenuPress,
  onNotificationsPress,
  onProfilePress,
}) => {
  const firstName = fullName.split(' ')[0];
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress}>
          <Feather name="menu" size={22} color="#171717" />
        </TouchableOpacity>

        <Image source={require('../../../assets/text-logo.png')} style={styles.logoImage} resizeMode="contain" />

        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress}>
          <BellIcon size={22} color="#171717" />
        </TouchableOpacity>
      </View>

      {showGreeting && (
        <TouchableOpacity style={styles.userGreetingRow} onPress={onProfilePress} activeOpacity={0.7}>
          <View style={styles.avatarWrap}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account-tie" size={34} color="#171717" />
              </View>
            )}
          </View>

          <View style={styles.greetingTextWrap}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.userNameText}>{firstName}</Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 4 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logoImage: {
    height: 56,
    width: 180,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    marginBottom: 6,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#171717',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTextWrap: { flex: 1 },
  greetingText: { fontSize: 13, color: '#6B6B6B', marginBottom: 2 },
  userNameText: { fontSize: 21, fontWeight: '800', color: '#171717' },
});
