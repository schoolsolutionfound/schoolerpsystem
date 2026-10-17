import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { HODTab } from '../types/hod.types';

interface HODHeaderProps {
  fullName: string;
  department?: string;
  institutionName?: string;
  profilePic?: string;
  activeTab?: HODTab;
  noticeBadgeCount?: number;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
  onBackToDashboard?: () => void;
  onSwitchToTeacher?: () => void;
}

export const HODHeader: React.FC<HODHeaderProps> = ({
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
  const initial = (fullName ? fullName.trim().charAt(0) : 'H').toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        {/* Left Action: Back or Menu */}
        {isSubTab && onBackToDashboard ? (
          <TouchableOpacity style={styles.subBackBtn} onPress={onBackToDashboard} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#111827" />
            <Text style={styles.subBackText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <Feather name="menu" size={24} color="#111827" />
          </TouchableOpacity>
        )}

        {/* Center Title: Kivouo */}
        <Text style={styles.brandTitle}>Kivouo</Text>

        {/* Right Actions: Switch to Teacher + Bell + Avatar */}
        <View style={styles.rightGroup}>
          {onSwitchToTeacher && (
            <TouchableOpacity
              style={styles.teacherSwitchBtn}
              onPress={onSwitchToTeacher}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-convert" size={13} color="#111827" />
              <Text style={styles.teacherSwitchText}>Teacher</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress} activeOpacity={0.7}>
            <Feather name="bell" size={22} color="#111827" />
            {noticeBadgeCount > 0 && (
              <View style={styles.notificationDot} />
            )}
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
    borderBottomColor: '#F3F4F6',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
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
    fontSize: 15,
    color: '#111827',
  },
  brandTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#111827',
    letterSpacing: -0.5,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teacherSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  teacherSwitchText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#111827',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 17,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#374151',
  },
});
