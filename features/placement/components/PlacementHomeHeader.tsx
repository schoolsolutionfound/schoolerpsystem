import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

interface PlacementHomeHeaderProps {
  fullName: string;
  profilePic?: string;
  institutionName?: string;
  accessLevel?: 'head' | 'member' | null;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
  showGreeting?: boolean;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const PlacementHomeHeader: React.FC<PlacementHomeHeaderProps> = ({
  fullName,
  profilePic,
  institutionName = '',
  accessLevel,
  onMenuPress,
  onNotificationsPress,
  onProfilePress,
  showGreeting = true,
}) => {
  const greeting = getGreeting();

  return (
    <View style={[styles.container, !showGreeting && styles.containerCompact]}>
      {/* Top action row */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={onMenuPress} activeOpacity={0.7}>
          <Feather name="menu" size={22} color="#171717" />
        </TouchableOpacity>

        <Image
          source={require('../../../assets/text-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <TouchableOpacity style={styles.iconBtn} onPress={onNotificationsPress} activeOpacity={0.7}>
          <Feather name="bell" size={22} color="#171717" />
          <View style={styles.dotBadge} />
        </TouchableOpacity>
      </View>

      {/* Greeting card */}
      {showGreeting && (
        <TouchableOpacity
          style={styles.userGreetingRow}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <View style={styles.avatarWrap}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="briefcase-account" size={28} color="#1A1B1C" />
              </View>
            )}
          </View>

          <View style={styles.greetingTextWrap}>
            <Text style={styles.greetingText}>{greeting},</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {fullName || 'Placement Officer'}
            </Text>
            {institutionName ? (
              <Text style={styles.institutionText} numberOfLines={1}>
                {institutionName}
              </Text>
            ) : null}
          </View>

          <MaterialCommunityIcons name="chevron-right" size={20} color="#6B6B6B" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFEFE',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    paddingBottom: 14,
    gap: 4,
  },
  containerCompact: {
    paddingBottom: 4,
    gap: 0,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logoImage: {
    height: 52,
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
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  userGreetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F4C430',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingTextWrap: { flex: 1 },
  greetingText: { fontSize: 13, color: '#6B6B6B', fontFamily: FontFamily.regular },
  userNameText: { fontSize: 20, fontWeight: '800', color: '#171717', fontFamily: FontFamily.bold },
  roleChip: {
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  roleChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1A1B1C',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  institutionText: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '600',
    marginTop: 2,
    fontFamily: FontFamily.medium,
  },
});
