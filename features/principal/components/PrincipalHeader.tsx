import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { PrincipalTab } from '../types/principal.types';

interface PrincipalHeaderProps {
  fullName: string;
  institutionName?: string;
  institutionType?: string;
  profilePic?: string;
  activeTab?: PrincipalTab;
  noticeBadgeCount?: number;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
  onBackToDashboard?: () => void;
  onSwitchToTeacher?: () => void;
}

export const PrincipalHeader: React.FC<PrincipalHeaderProps> = ({
  fullName,
  profilePic,
  activeTab = 'dashboard',
  noticeBadgeCount = 0,
  onMenuPress,
  onNotificationsPress,
  onProfilePress,
  onBackToDashboard,
  onSwitchToTeacher,
}) => {
  const isSubTab = activeTab === 'attendance';
  const initial = (fullName ? fullName.trim().charAt(0) : 'P').toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        {/* Left Group: Menu + Kivquo */}
        <View style={styles.leftGroup}>
          {isSubTab && onBackToDashboard ? (
            <TouchableOpacity style={styles.subBackBtn} onPress={onBackToDashboard} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="#111827" />
              <Text style={styles.subBackText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
              <Feather name="menu" size={22} color="#111827" />
            </TouchableOpacity>
          )}
          <Text style={styles.brandTitle}>Kivquo</Text>
        </View>

        {/* Right Group: Switch to Teacher + Bell + Avatar */}
        <View style={styles.rightGroup}>
          {onSwitchToTeacher && (
            <TouchableOpacity
              style={styles.teacherSwitchBtn}
              onPress={onSwitchToTeacher}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-convert" size={12} color="#111827" />
              <Text style={styles.teacherSwitchText}>Teacher</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.bellBtn} onPress={onNotificationsPress} activeOpacity={0.7}>
            <Feather name="bell" size={20} color="#111827" />
            {noticeBadgeCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.avatarBtn} onPress={onProfilePress} activeOpacity={0.8}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subBackText: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    color: '#111827',
  },
  brandTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#111827',
    letterSpacing: -0.4,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teacherSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  teacherSwitchText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#1A1B1C',
  },
  bellBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  avatarInitial: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#F4C430',
  },
});
