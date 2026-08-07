import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { StudentHomeHeader } from '../../features/student/components/StudentHomeHeader';
import { StudentHomeAttendanceCard } from '../../features/student/components/StudentHomeAttendanceCard';
import { StudentHomeAnnouncements } from '../../features/student/components/StudentHomeAnnouncements';
import { StudentHomePeriodsList } from '../../features/student/components/StudentHomePeriodsList';
import { StudentTimetableView } from '../../features/student/components/StudentTimetableView';
import { StudentAttendanceView } from '../../features/student/components/StudentAttendanceView';

export default function HomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Aarav Sharma';
  const profilePic = useUserStore((state) => state.profilePic);

  const [activeTab, setActiveTab] = useState<'home' | 'attendance' | 'schedule' | 'reports'>('home');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <StudentHomeHeader
          fullName={fullName}
          profilePic={profilePic}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(student)/profile')}
        />

        {activeTab === 'home' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <StudentHomeAttendanceCard />
            <StudentHomeAnnouncements />
            <StudentHomePeriodsList />
          </ScrollView>
        )}

        {activeTab === 'schedule' && <StudentTimetableView />}
        {activeTab === 'attendance' && <StudentAttendanceView />}
        {activeTab === 'reports' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <StudentHomeAnnouncements />
          </ScrollView>
        )}

        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <MaterialCommunityIcons name="home" size={22} color={activeTab === 'home' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('attendance')}>
            <MaterialCommunityIcons name="account-outline" size={22} color={activeTab === 'attendance' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'attendance' && styles.tabLabelActive]}>Attendance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('schedule')}>
            <MaterialCommunityIcons name="calendar-outline" size={22} color={activeTab === 'schedule' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'schedule' && styles.tabLabelActive]}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('reports')}>
            <MaterialCommunityIcons name="chart-bar" size={22} color={activeTab === 'reports' ? '#7E57C2' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'reports' && styles.tabLabelActive]}>Reports</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 16 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  tabLabelActive: { color: '#7E57C2', fontWeight: '700' },
});
