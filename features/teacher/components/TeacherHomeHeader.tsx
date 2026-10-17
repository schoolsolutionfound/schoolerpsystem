import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

interface TeacherHomeHeaderProps {
  fullName: string;
  profilePic?: string;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
  onSwitchToPrincipal?: () => void;
  onSwitchToHOD?: () => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const TeacherHomeHeader: React.FC<TeacherHomeHeaderProps> = ({
  fullName,
  profilePic,
  onMenuPress,
  onNotificationsPress,
  onProfilePress,
  onSwitchToPrincipal,
  onSwitchToHOD,
}) => {
  const greeting = getGreeting();

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        {/* Left: Menu + Kivquo */}
        <View style={styles.leftGroup}>
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <Feather name="menu" size={22} color="#171717" />
          </TouchableOpacity>
          <Text style={styles.brandTitle}>Kivquo</Text>
        </View>

        {/* Right: Switch back to Principal/HOD + Notification Bell */}
        <View style={styles.rightGroup}>
          {onSwitchToPrincipal && (
            <TouchableOpacity
              style={styles.switchBtn}
              onPress={onSwitchToPrincipal}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-convert" size={13} color="#111827" />
              <Text style={styles.switchBtnText}>Principal</Text>
            </TouchableOpacity>
          )}

          {onSwitchToHOD && (
            <TouchableOpacity
              style={[styles.switchBtn, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}
              onPress={onSwitchToHOD}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="domain" size={13} color="#C2410C" />
              <Text style={[styles.switchBtnText, { color: '#C2410C' }]}>HOD</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.bellBtn} onPress={onNotificationsPress} activeOpacity={0.7}>
            <Feather name="bell" size={20} color="#171717" />
            <View style={styles.dotBadge} />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Greeting Row */}
      <TouchableOpacity style={styles.userGreetingRow} onPress={onProfilePress} activeOpacity={0.7}>
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account-tie" size={32} color="#1A1B1C" />
            </View>
          )}
        </View>

        <View style={styles.greetingTextWrap}>
          <Text style={styles.greetingText}>{greeting},</Text>
          <Text style={styles.userNameText} numberOfLines={1}>{fullName || 'Teacher'}</Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#111827',
    letterSpacing: -0.3,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  switchBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#111827',
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1A1B1C',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTextWrap: {
    flex: 1,
  },
  greetingText: {
    fontSize: 13,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
});
