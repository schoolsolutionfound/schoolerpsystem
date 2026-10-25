import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from './common/Icons';

interface TeacherHomeHeaderProps {
  onMenuPress: () => void;
  onNotificationsPress?: () => void;
}

export const TeacherHomeHeader: React.FC<TeacherHomeHeaderProps> = ({
  onMenuPress,
  onNotificationsPress,
}) => {
  return (
    <View style={styles.bar}>
      {/* Left: Mobile Drawer Trigger / Hamburger Button with NO bg box */}
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onMenuPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <Feather name="menu" size={22} color="#171717" />
      </TouchableOpacity>

      {/* Center: Kivquo Text Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/text-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Right: Notifications Bell Icon */}
      <View style={styles.rightContainer}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onNotificationsPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Feather name="bell" size={22} color="#171717" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFEFE',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    height: 52,
    width: 170,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
  },
});
