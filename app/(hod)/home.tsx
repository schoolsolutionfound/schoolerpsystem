import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { AttendanceReportsView } from '../../features/shared/components/AttendanceReportsView';
import { AdminAnnouncementsView } from '../../features/announcements';

export default function HODHomeScreen() {
  const router = useRouter();
  const department = useUserStore((state) => state.department) || '';
  const [activeTab, setActiveTab] = useState<'reports' | 'announcements'>('reports');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>HOD Portal</Text>
            <View style={styles.tabToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, activeTab === 'reports' && styles.toggleBtnActive]}
                onPress={() => setActiveTab('reports')}
              >
                <Text style={[styles.toggleText, activeTab === 'reports' && styles.toggleTextActive]}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, activeTab === 'announcements' && styles.toggleBtnActive]}
                onPress={() => setActiveTab('announcements')}
              >
                <Text style={[styles.toggleText, activeTab === 'announcements' && styles.toggleTextActive]}>Announcements</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(hod)/profile')} style={styles.profileBtn}>
            <MaterialCommunityIcons name="account-circle-outline" size={28} color="#F4A261" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>
          {activeTab === 'reports' ? (
            <AttendanceReportsView mode="department" department={department || undefined} />
          ) : (
            <AdminAnnouncementsView />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E8E5DC', backgroundColor: '#FFFFFF' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#171717' },
  tabToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  toggleBtnActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  toggleText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#171717', fontWeight: '700' },
  profileBtn: { padding: 4 },
  content: { flex: 1 },
});
