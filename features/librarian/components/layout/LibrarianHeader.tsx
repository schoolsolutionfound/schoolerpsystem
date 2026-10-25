import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { Feather } from '../common/Icons';

export interface LibrarianHeaderProps {
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress?: () => void;
  userName?: string;
}

export const LibrarianHeader: React.FC<LibrarianHeaderProps> = ({
  onMenuPress,
  onNotificationsPress,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;

  return (
    <View style={topHeaderStyles.bar}>
      {/* Left: Mobile Drawer Trigger / Menu Button */}
      {isMobile ? (
        <TouchableOpacity
          style={topHeaderStyles.iconBtn}
          onPress={onMenuPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Feather name="menu" size={22} color="#171717" />
        </TouchableOpacity>
      ) : (
        <View style={topHeaderStyles.spacer} />
      )}

      {/* Center: Exact Attendance Flow Text Logo */}
      <View style={topHeaderStyles.logoContainer}>
        <Image
          source={require('../../../../assets/text-logo.png')}
          style={topHeaderStyles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Right: Notifications Bell */}
      <View style={topHeaderStyles.rightContainer}>
        <TouchableOpacity
          style={topHeaderStyles.iconBtn}
          onPress={onNotificationsPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <Feather name="bell" size={22} color="#171717" />
          <View style={topHeaderStyles.notifBadge} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const topHeaderStyles = StyleSheet.create({
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
  spacer: {
    width: 40,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    height: 26,
    width: 96,
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

