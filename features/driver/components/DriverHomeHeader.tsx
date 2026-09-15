import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';

interface DriverHomeHeaderProps {
  fullName: string;
  profilePic?: string;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const DriverHomeHeader: React.FC<DriverHomeHeaderProps> = ({
  fullName,
  profilePic,
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
          <Feather name="bell" size={22} color="#171717" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.userGreetingRow} onPress={onProfilePress} activeOpacity={0.7}>
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="bus" size={32} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.greetingTextWrap}>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.userNameText}>{firstName}</Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" />
      </TouchableOpacity>
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
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
  },
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1A1B1C',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTextWrap: { flex: 1 },
  greetingText: { fontSize: 14, color: '#6B6B6B', marginBottom: 2 },
  userNameText: { fontSize: 22, fontWeight: '800', color: '#171717' },
});
