import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export const AdminHomeModulesGrid: React.FC = () => {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Management Modules</Text>
      <View style={styles.modulesGrid}>
        <TouchableOpacity style={styles.moduleItem} activeOpacity={0.8}>
          <View style={[styles.moduleIconBox, { backgroundColor: '#EDE9F6' }]}>
            <MaterialCommunityIcons name="account-group" size={26} color="#7E57C2" />
          </View>
          <Text style={styles.moduleName}>Students</Text>
          <Text style={styles.moduleCount}>1,240 Total</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moduleItem} activeOpacity={0.8}>
          <View style={[styles.moduleIconBox, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="account-tie" size={26} color="#16A34A" />
          </View>
          <Text style={styles.moduleName}>Teachers</Text>
          <Text style={styles.moduleCount}>86 Staff</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moduleItem} activeOpacity={0.8}>
          <View style={[styles.moduleIconBox, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="cash-multiple" size={26} color="#D97706" />
          </View>
          <Text style={styles.moduleName}>Fee Manager</Text>
          <Text style={styles.moduleCount}>Structure & Receipts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moduleItem} activeOpacity={0.8}>
          <View style={[styles.moduleIconBox, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="calendar-check" size={26} color="#0284C7" />
          </View>
          <Text style={styles.moduleName}>Attendance</Text>
          <Text style={styles.moduleCount}>Daily Summary</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moduleItem} activeOpacity={0.8}>
          <View style={[styles.moduleIconBox, { backgroundColor: '#FCE7F3' }]}>
            <MaterialCommunityIcons name="file-document-outline" size={26} color="#DB2777" />
          </View>
          <Text style={styles.moduleName}>Results & Grades</Text>
          <Text style={styles.moduleCount}>Term Exams</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moduleItem}
          onPress={() => router.push('/placement' as any)}
          activeOpacity={0.8}
        >
          <View style={[styles.moduleIconBox, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="briefcase-check" size={26} color="#059669" />
          </View>
          <Text style={styles.moduleName}>Placements</Text>
          <Text style={styles.moduleCount}>Drives & Offers</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moduleItem} activeOpacity={0.8}>
          <View style={[styles.moduleIconBox, { backgroundColor: '#F3E8FF' }]}>
            <MaterialCommunityIcons name="bullhorn-outline" size={26} color="#7E57C2" />
          </View>
          <Text style={styles.moduleName}>Announcements</Text>
          <Text style={styles.moduleCount}>Post Updates</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginTop: 6 },
  modulesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'flex-start',
    gap: 8,
  },
  moduleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moduleName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  moduleCount: { fontSize: 12, color: '#64748B' },
});
