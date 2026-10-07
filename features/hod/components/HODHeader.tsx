import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { HODTab } from '../types/hod.types';

interface HODHeaderProps {
  fullName: string;
  department: string;
  institutionName: string;
  profilePic?: string;
  activeTab?: HODTab;
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

export const HODHeader: React.FC<HODHeaderProps> = ({
  fullName,
  department,
  institutionName,
  profilePic,
  activeTab = 'dashboard',
  noticeBadgeCount = 0,
  onMenuPress,
  onNotificationsPress,
  onProfilePress,
  onBackToDashboard,
}) => {
  const greeting = getGreeting();
  const isSubTab = activeTab === 'attendance';

  return (
    <View style={styles.container}>
      {/* Top Navigation Row */}
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

      {/* Department & HOD Executive Identity Card */}
      <TouchableOpacity style={styles.identityCard} onPress={onProfilePress} activeOpacity={0.85}>
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="domain" size={26} color="#EA580C" />
            </View>
          )}
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>HOD</Text>
          </View>
        </View>

        <View style={styles.textWrap}>
          <View style={styles.deptBadge}>
            <Text style={styles.deptBadgeText} numberOfLines={1}>
              {department || 'Department Academic Head'}
            </Text>
          </View>
          <Text style={styles.userName} numberOfLines={1}>
            {fullName || 'Head of Department'}
          </Text>
          <Text style={styles.institutionSub} numberOfLines={1}>
            {institutionName || 'College of Engineering & Technology'}
          </Text>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={22} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 12,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  logoImage: {
    width: 130,
    height: 36,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  subBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  subBackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  dotBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EA580C',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dotBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
  identityCard: {
    marginHorizontal: 16,
    marginTop: 6,
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FDBA74',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#EA580C',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgePillText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
  textWrap: {
    flex: 1,
  },
  deptBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  deptBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C2410C',
    fontFamily: FontFamily.poppins,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  institutionSub: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
    fontFamily: FontFamily.poppins,
  },
});
