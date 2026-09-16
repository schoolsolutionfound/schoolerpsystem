import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ParentHeader } from '../../features/parent/components/ParentHeader';
import { ParentOverviewView } from '../../features/parent/components/ParentOverviewView';
import { ParentAttendanceView } from '../../features/parent/components/ParentAttendanceView';
import { ParentFeesView } from '../../features/parent/components/ParentFeesView';
import { ParentBusTrackerView } from '../../features/parent/components/ParentBusTrackerView';
import { ParentNoticesView } from '../../features/parent/components/ParentNoticesView';

type Tab = 'overview' | 'attendance' | 'fees' | 'bus' | 'notices';

export default function ParentHomeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* Unified Top Header with School Branding & Child Badge */}
        <ParentHeader />

        {/* Dynamic Tab Body */}
        <View style={styles.content}>
          {activeTab === 'overview' && (
            <ParentOverviewView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'attendance' && <ParentAttendanceView />}
          {activeTab === 'fees' && <ParentFeesView />}
          {activeTab === 'bus' && <ParentBusTrackerView />}
          {activeTab === 'notices' && <ParentNoticesView />}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'overview' ? 'view-dashboard' : 'view-dashboard-outline'}
              size={22}
              color={activeTab === 'overview' ? '#4F46E5' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'overview' && styles.tabLabelActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('attendance')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'attendance' ? 'calendar-check' : 'calendar-check-outline'}
              size={22}
              color={activeTab === 'attendance' ? '#4F46E5' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'attendance' && styles.tabLabelActive]}>
              Attendance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('fees')}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconWrap}>
              <MaterialCommunityIcons
                name={activeTab === 'fees' ? 'credit-card' : 'credit-card-outline'}
                size={22}
                color={activeTab === 'fees' ? '#4F46E5' : '#94A3B8'}
              />
              <View style={styles.tabBadgeDot} />
            </View>
            <Text style={[styles.tabLabel, activeTab === 'fees' && styles.tabLabelActive]}>
              Fees
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('bus')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'bus' ? 'bus-marker' : 'bus'}
              size={22}
              color={activeTab === 'bus' ? '#4F46E5' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'bus' && styles.tabLabelActive]}>
              Bus #4
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('notices')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'notices' ? 'bullhorn' : 'bullhorn-outline'}
              size={22}
              color={activeTab === 'notices' ? '#4F46E5' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'notices' && styles.tabLabelActive]}>
              Notices
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safe: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#4F46E5',
    fontWeight: '800',
  },
});
