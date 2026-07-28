import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export const AdminHomeFeesOverview: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Fee Collections & Financial Overview</Text>
      <View style={styles.feesRow}>
        <View style={[styles.feeCard, { backgroundColor: '#F0FDF4', borderColor: '#DCFCE7' }]}>
          <View style={styles.feeHeader}>
            <MaterialCommunityIcons name="cash-check" size={22} color="#16A34A" />
            <Text style={[styles.feeBadgeText, { color: '#16A34A' }]}>+12.4%</Text>
          </View>
          <Text style={styles.feeAmount}>₹ 42,50,000</Text>
          <Text style={styles.feeLabel}>Total Collected (Term 1)</Text>
        </View>

        <View style={[styles.feeCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <View style={styles.feeHeader}>
            <MaterialCommunityIcons name="cash-clock" size={22} color="#DC2626" />
            <Text style={[styles.feeBadgeText, { color: '#DC2626' }]}>24 Pending</Text>
          </View>
          <Text style={[styles.feeAmount, { color: '#DC2626' }]}>₹ 3,80,000</Text>
          <Text style={styles.feeLabel}>Pending Fee Dues</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B', marginTop: 6 },
  feesRow: { flexDirection: 'row', gap: 12 },
  feeCard: {
    flex: 1,
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
  },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeBadgeText: { fontSize: 11, fontWeight: '700' },
  feeAmount: { fontSize: 20, fontWeight: '800', color: '#16A34A', marginVertical: 6 },
  feeLabel: { fontSize: 12, color: '#64748B' },
});
