import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ParentAttendanceView } from '../../features/parent/components/ParentAttendanceView';

export default function ParentHomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'attendance' | 'home'>('home');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Parent Portal</Text>
          <TouchableOpacity onPress={() => router.push('/(parent)/profile')} style={styles.profileBtn}>
            <MaterialCommunityIcons name="account-circle-outline" size={28} color="#4A90D9" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'home' ? (
            <View style={styles.centerContent}>
              <MaterialCommunityIcons name="account-heart-outline" size={40} color="#4A90D9" />
              <Text style={styles.subtitle}>Track your child's attendance</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setActiveTab('attendance')}>
                <Text style={styles.primaryBtnText}>View Attendance</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ParentAttendanceView />
          )}
        </View>

        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <MaterialCommunityIcons name="home" size={22} color={activeTab === 'home' ? '#4A90D9' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('attendance')}>
            <MaterialCommunityIcons name="chart-donut" size={22} color={activeTab === 'attendance' ? '#4A90D9' : '#94A3B8'} />
            <Text style={[styles.tabLabel, activeTab === 'attendance' && styles.tabLabelActive]}>Attendance</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A202C' },
  profileBtn: { padding: 4 },
  content: { flex: 1 },
  centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 10 },
  subtitle: { fontSize: 14, color: '#718096', marginTop: 4 },
  primaryBtn: { backgroundColor: '#4A90D9', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingVertical: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '500', color: '#94A3B8', marginTop: 2 },
  tabLabelActive: { color: '#4A90D9', fontWeight: '700' },
});
