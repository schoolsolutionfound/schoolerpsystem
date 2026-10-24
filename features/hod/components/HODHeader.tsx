import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { HODTab } from '../types/hod.types';

interface HODHeaderProps {
  fullName?: string;
  department?: string;
  institutionName?: string;
  profilePic?: string;
  activeTab?: HODTab;
  noticeBadgeCount?: number;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress?: () => void;
  onBackToDashboard?: () => void;
}

export const HODHeader: React.FC<HODHeaderProps> = ({
  noticeBadgeCount = 0,
  onMenuPress,
  onNotificationsPress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        {/* Left: Menu Hamburger */}
        <View style={styles.leftCol}>
          <TouchableOpacity style={styles.menuBtn} onPress={onMenuPress} activeOpacity={0.7}>
            <Feather name="menu" size={24} color="#000000" />
          </TouchableOpacity>
        </View>

        {/* Center: Text Logo in center of header */}
        <View style={styles.centerCol}>
          <Image
            source={require('../../../assets/text-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Right: Notifications */}
        <View style={styles.rightCol}>
          <TouchableOpacity style={styles.actionBtn} onPress={onNotificationsPress} activeOpacity={0.7}>
            <Feather name="bell" size={20} color="#000000" />
            {noticeBadgeCount > 0 && <View style={styles.notificationDot} />}
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
    borderBottomColor: '#E5E7EB',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  leftCol: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBtn: {
    padding: 4,
  },
  centerCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    height: 38,
    width: 130,
  },
  rightCol: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
});
