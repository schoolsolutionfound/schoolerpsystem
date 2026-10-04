import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

import { PrincipalTab } from '../types/principal.types';

interface PrincipalHeaderProps {
  fullName: string;
  institutionName: string;
  institutionType?: string;
  profilePic?: string;
  activeTab?: PrincipalTab;
  noticeBadgeCount?: number;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
  onBackToDashboard?: () => void;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const PrincipalHeader: React.FC<PrincipalHeaderProps> = ({
  fullName,
  institutionName,
  institutionType = 'school',
  profilePic,
  activeTab = 'dashboard',
  noticeBadgeCount = 0,
  onMenuPress,
  onNotificationsPress,
  onProfilePress,
  onBackToDashboard,
}) => {
  const firstName = fullName.split(' ')[0] || 'Principal';
  const greeting = getGreeting();
  const roleLabel = institutionType === 'college' ? 'Dean / Principal Office' : 'Headmaster / Principal Office';
  const isSubTab = activeTab === 'attendance';

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topHeader}>
        {isSubTab && onBackToDashboard ? (
          <TouchableOpacity style={styles.subBackBtn} onPress={onBackToDashboard} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#171717" />
            <Text style={styles.subBackText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <Feather name="menu" size={22} color="#171717" />
          </TouchableOpacity>
        )}

        <Image
          source={require('../../../assets/text-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress} activeOpacity={0.7}>
          <Feather name="bell" size={22} color="#171717" />
          {noticeBadgeCount > 0 && (
            <View style={styles.dotBadge}>
              <Text style={styles.dotBadgeText}>{noticeBadgeCount > 9 ? '9+' : noticeBadgeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Campus Identity & Greeting Banner */}
      <TouchableOpacity style={styles.userGreetingRow} onPress={onProfilePress} activeOpacity={0.8}>
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="school" size={28} color="#92400E" />
            </View>
          )}
          <View style={styles.leadBadge}>
            <MaterialCommunityIcons name="star-check" size={12} color="#FFFFFF" />
          </View>
        </View>

        <View style={styles.greetingTextWrap}>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>{roleLabel}</Text>
          </View>
          <Text style={styles.userNameText}>{greeting}, {firstName}</Text>
          <Text style={styles.institutionText} numberOfLines={1}>{institutionName}</Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  logoImage: {
    height: 48,
    width: 170,
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
  dotBadge: {
    position: 'absolute',
    top: 4,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  subBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subBackText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#F59E0B',
    position: 'relative',
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leadBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D97706',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingTextWrap: {
    flex: 1,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 2,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  institutionText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
});
