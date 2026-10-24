import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BellIcon } from '../../notifications/components/BellIcon';

interface DriverHomeHeaderProps {
  onMenuPress: () => void;
  onNotificationsPress: () => void;
}

export const DriverHomeHeader: React.FC<DriverHomeHeaderProps> = ({
  onMenuPress,
  onNotificationsPress,
}) => {
  return (
    <View style={styles.bar}>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onMenuPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <Feather name="menu" size={22} color="#171717" />
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/text-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <TouchableOpacity
        style={styles.iconBtn}
        onPress={onNotificationsPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.7}
      >
        <BellIcon size={22} color="#171717" />
        <View style={styles.notifBadge} />
      </TouchableOpacity>
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
    height: 56,
    width: 180,
  },
  iconBtn: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
});
