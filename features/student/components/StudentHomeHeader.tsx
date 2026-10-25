import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

interface StudentHomeHeaderProps {
  fullName: string;
  profilePic?: string;
  onMenuPress: () => void;
  onSettingsPress?: () => void;
  onNotificationsPress?: () => void;
  onProfilePress: () => void;
  showProfile?: boolean;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const StudentHomeHeader: React.FC<StudentHomeHeaderProps> = ({
  fullName,
  profilePic,
  onMenuPress,
  onSettingsPress,
  onNotificationsPress,
  onProfilePress,
  showProfile = true,
}) => {
  const firstName = fullName ? fullName.split(' ')[0] : 'Student';
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onMenuPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="menu" size={24} color="#111827" />
        </TouchableOpacity>

        <Image
          source={require('../../../assets/text-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <TouchableOpacity
          style={styles.headerBtn}
          onPress={onNotificationsPress || onSettingsPress}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="bell" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {showProfile && (
        <TouchableOpacity style={styles.userGreetingRow} onPress={onProfilePress} activeOpacity={0.7}>
          <View style={styles.avatarWrap}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={38} color="#111827" />
              </View>
            )}
          </View>

          <View style={styles.greetingTextWrap}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.userNameText}>{firstName}</Text>
          </View>

          <MaterialCommunityIcons name="chevron-right" size={26} color="#374151" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  logoImage: {
    height: 34,
    width: 140,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    gap: 14,
  },
  avatarWrap: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#FBBF24',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FBBF24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTextWrap: { flex: 1 },
  greetingText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
});
