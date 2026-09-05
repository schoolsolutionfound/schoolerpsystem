/**
 * @file StudentHomeBusTracker.tsx
 * @description Live School Bus Transport Tracking widget for students and parents.
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { showAlert } from '../../shared/utils/showAlert';

export const StudentHomeBusTracker: React.FC = () => {
  const handleCallDriver = () => {
    showAlert('Contact Bus Driver', 'Call Driver Ramesh Kumar at +91 98765 43210?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call Now', onPress: () => Linking.openURL('tel:+919876543210') },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="bus-clock" size={20} color="#EA580C" />
          <Text style={styles.headerTitle}>My School Bus Transport</Text>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>On Time</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.busTopRow}>
          <View style={styles.busIconCircle}>
            <MaterialCommunityIcons name="bus-side" size={24} color="#EA580C" />
          </View>

          <View style={styles.busInfo}>
            <Text style={styles.busRouteTitle}>Route #4 • Green Park Express</Text>
            <Text style={styles.busPlate}>Vehicle: HR-55-A-1024 • Stop #8</Text>
          </View>

          <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
            <MaterialCommunityIcons name="phone" size={16} color="#FFFFFF" />
            <Text style={styles.callBtnText}>Driver</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timingRow}>
          <View style={styles.timingCol}>
            <Text style={styles.timingLabel}>Morning Pickup</Text>
            <Text style={styles.timingVal}>07:45 AM</Text>
            <Text style={styles.timingSub}>Sector 14 Stop</Text>
          </View>

          <View style={styles.timingDivider} />

          <View style={styles.timingCol}>
            <Text style={styles.timingLabel}>Evening Drop</Text>
            <Text style={styles.timingVal}>03:45 PM</Text>
            <Text style={styles.timingSub}>Sector 14 Stop</Text>
          </View>

          <View style={styles.timingDivider} />

          <View style={styles.timingCol}>
            <Text style={styles.timingLabel}>Driver & Attendant</Text>
            <Text style={styles.timingVal}>Ramesh K.</Text>
            <Text style={styles.timingSub}>Verified Staff</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
  liveText: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  busTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  busIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  busInfo: { flex: 1 },
  busRouteTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  busPlate: { fontSize: 11, color: '#64748B', marginTop: 1 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  callBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timingCol: { flex: 1, alignItems: 'center' },
  timingDivider: { width: 1, height: '100%', backgroundColor: '#E2E8F0' },
  timingLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  timingVal: { fontSize: 13, fontWeight: '800', color: '#1E293B', marginTop: 2 },
  timingSub: { fontSize: 10, color: '#64748B', marginTop: 1 },
});
