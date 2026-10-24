import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

export type DriverTab = 'trips' | 'announcements' | 'profile';

const TABS: { key: DriverTab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'trips', label: 'My Trips', icon: 'bus', iconFilled: 'bus-clock' },
  { key: 'announcements', label: 'Announcements', icon: 'bullhorn-outline', iconFilled: 'bullhorn' },
  { key: 'profile', label: 'Profile', icon: 'account-outline', iconFilled: 'account' },
];

const ROUTES: Record<DriverTab, string> = {
  trips: '/(driver)/home',
  announcements: '/(driver)/announcements',
  profile: '/(driver)/profile',
};

export const DriverBottomNav: React.FC<{ activeTab: DriverTab }> = ({ activeTab }) => {
  const router = useRouter();

  return (
    <View style={styles.tabBarBg}>
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => router.replace(ROUTES[tab.key] as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconBg, isActive && styles.tabIconBgActive]}>
                <MaterialCommunityIcons
                  name={isActive ? (tab.iconFilled as any) : (tab.icon as any)}
                  size={22}
                  color={isActive ? '#1A1B1C' : '#9CA3AF'}
                />
              </View>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
    paddingTop: 4,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '94%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 54,
  },
  tabIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
});
