import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../constants/fonts';

import { PlacementTeamView } from '../../features/placement/components/PlacementTeamView';
import { PlacementDrivesView } from '../../features/placement/components/PlacementDrivesView';
import { PlacementStudentsView } from '../../features/placement/components/PlacementStudentsView';
import { PlacementProfileView } from '../../features/placement/components/PlacementProfileView';

const TABS: { key: 'team' | 'drives' | 'students' | 'profile'; label: string; icon: string; iconFilled: string }[] = [
  { key: 'team', label: 'Team', icon: 'account-multiple-outline', iconFilled: 'account-multiple' },
  { key: 'drives', label: 'Drives', icon: 'briefcase-outline', iconFilled: 'briefcase' },
  { key: 'students', label: 'Students', icon: 'account-group-outline', iconFilled: 'account-group' },
  { key: 'profile', label: 'Profile', icon: 'account-circle-outline', iconFilled: 'account-circle' },
];

export default function PlacementHomeScreen() {
  const [activeTab, setActiveTab] = useState<'team' | 'drives' | 'students' | 'profile'>('drives');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          {activeTab === 'team' && <PlacementTeamView />}
          {activeTab === 'drives' && <PlacementDrivesView />}
          {activeTab === 'students' && <PlacementStudentsView />}
          {activeTab === 'profile' && <PlacementProfileView />}
        </View>

        {/* Floating Bottom Tab Bar */}
        <View style={styles.tabBarBg}>
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.key)}
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
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  content: { flex: 1 },
  // Floating tab bar
  tabBarBg: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBg: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#F4C430',
  },
  tabLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontWeight: '700',
  },
});
