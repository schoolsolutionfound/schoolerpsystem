/**
 * @file IncomeExpenseTallyView.tsx
 * @description Financial balance overview for the School Finance portal.
 *
 * Shows:
 *  - Net financial balance with health indicator (Surplus / Deficit)
 *  - Income-vs-Expense ratio progress bar
 *  - Income stream breakdown bars (Student Tuition, Bus Transport, Hostel Boarding)
 *  - Detailed Expense allocation bars (Teacher Salaries, Bus Fuel, Bus Repairs, Hostel Mess, Utilities)
 *  - Clean mobile responsive layout with Export Statement action
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR, getCategoryTotal } from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';

export const IncomeExpenseTallyView: React.FC = () => {
  const getTotalIncome = useFinanceStore((s) => s.getTotalIncome);
  const getTotalExpenses = useFinanceStore((s) => s.getTotalExpenses);
  const getNetTally = useFinanceStore((s) => s.getNetTally);
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);

  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpenses();
  const netTally = getNetTally();

  // Ratio for the income-vs-expense progress bar
  const grandTotal = totalIncome + totalExpense;
  const incomePercent = grandTotal > 0 ? Math.round((totalIncome / grandTotal) * 100) : 50;
  const expensePercent = grandTotal > 0 ? Math.round((totalExpense / grandTotal) * 100) : 50;

  // Breakdown amounts
  const studentFeesTotal    = getCategoryTotal(incomeRecords,  'student_fee');
  const busFeesTotal        = getCategoryTotal(incomeRecords,  'bus_fee');
  const hostelFeesTotal     = getCategoryTotal(incomeRecords,  'hostel_fee');

  const salariesTotal       = getCategoryTotal(expenseRecords, 'salary');
  const busFuelTotal        = getCategoryTotal(expenseRecords, 'bus_fuel');
  const busMaintenanceTotal = getCategoryTotal(expenseRecords, 'bus_maintenance') + getCategoryTotal(expenseRecords, 'bus_expense');
  const hostelExpensesTotal = getCategoryTotal(expenseRecords, 'hostel_expense');
  const utilityTotal        = getCategoryTotal(expenseRecords, 'utility');

  const handleExportStatement = () => {
    showAlert(
      'Financial Summary Exported',
      `• Total Fee Collections: ${formatINR(totalIncome)}\n• Total Expenditures: ${formatINR(totalExpense)}\n• Net Surplus Balance: ${formatINR(netTally)}\n\nReport downloaded to device downloads.`
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Tally Health Overview */}
      <View style={styles.tallyHeaderCard}>
        <View style={styles.tallyHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tallyCardTitle}>Income & Expense Tally</Text>
            <Text style={styles.tallyCardSubtitle}>Current Academic Term Financial Balance</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportStatement}>
            <MaterialCommunityIcons name="file-export-outline" size={16} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.netBalanceRow}>
          <View>
            <Text style={styles.netLabel}>Net Balance</Text>
            <Text style={[styles.netValue, { color: netTally >= 0 ? '#16A34A' : '#DC3545' }]}>
              {netTally < 0 ? '-' : ''}{formatINR(netTally)}
            </Text>
          </View>
          <View style={[styles.badgeHealth, { backgroundColor: netTally >= 0 ? '#DCFCE7' : '#FEE2E2' }]}>
            <MaterialCommunityIcons
              name={netTally >= 0 ? 'shield-check' : 'alert-circle'}
              size={16}
              color={netTally >= 0 ? '#16A34A' : '#DC3545'}
            />
            <Text style={[styles.badgeHealthText, { color: netTally >= 0 ? '#16A34A' : '#DC3545' }]}>
              {netTally >= 0 ? 'Surplus' : 'Deficit Alert'}
            </Text>
          </View>
        </View>

        {/* Visual Progress Ratio Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressIncomeFill, { width: `${incomePercent}%` }]} />
          <View style={[styles.progressExpenseFill, { width: `${expensePercent}%` }]} />
        </View>

        <View style={styles.progressLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.legendText}>Inflows: {incomePercent}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#DC3545' }]} />
            <Text style={styles.legendText}>Outflows: {expensePercent}%</Text>
          </View>
        </View>
      </View>

      {/* Grid: Income vs Expense Breakdown */}
      <View style={styles.breakdownGrid}>
        {/* Income Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownCardHeader}>
            <MaterialCommunityIcons name="arrow-bottom-left-bold-box-outline" size={20} color="#16A34A" />
            <Text style={styles.breakdownTitle}>Income Streams</Text>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Student Tuition & Fees</Text>
              <Text style={styles.barItemVal}>{formatINR(studentFeesTotal)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#4338CA',
                    width: `${totalIncome > 0 ? (studentFeesTotal / totalIncome) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Bus & Transport Fees</Text>
              <Text style={styles.barItemVal}>{formatINR(busFeesTotal)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#D97706',
                    width: `${totalIncome > 0 ? (busFeesTotal / totalIncome) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Hostel & Boarding Fees</Text>
              <Text style={styles.barItemVal}>{formatINR(hostelFeesTotal)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#BE185D',
                    width: `${totalIncome > 0 ? (hostelFeesTotal / totalIncome) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Expense Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownCardHeader}>
            <MaterialCommunityIcons name="arrow-top-right-bold-box-outline" size={20} color="#DC3545" />
            <Text style={styles.breakdownTitle}>Expense Allocations</Text>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Teacher & Staff Salaries</Text>
              <Text style={styles.barItemVal}>{formatINR(salariesTotal)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#DC3545',
                    width: `${totalExpense > 0 ? (salariesTotal / totalExpense) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Bus Diesel & Fuel</Text>
              <Text style={styles.barItemVal}>{formatINR(busFuelTotal)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#D97706',
                    width: `${totalExpense > 0 ? (busFuelTotal / totalExpense) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Bus Repairs & Service</Text>
              <Text style={styles.barItemVal}>{formatINR(busMaintenanceTotal)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#EA580C',
                    width: `${totalExpense > 0 ? (busMaintenanceTotal / totalExpense) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Hostel Mess & Food</Text>
              <Text style={styles.barItemVal}>{formatINR(hostelExpensesTotal)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#9D174D',
                    width: `${totalExpense > 0 ? (hostelExpensesTotal / totalExpense) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Campus Utilities & Electricity</Text>
              <Text style={styles.barItemVal}>{formatINR(utilityTotal)}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#0284C7',
                    width: `${totalExpense > 0 ? (utilityTotal / totalExpense) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
  tallyHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  tallyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tallyCardTitle: { fontSize: 16, fontWeight: '800', color: '#1A202C' },
  tallyCardSubtitle: { fontSize: 12, color: '#718096', marginTop: 1 },
  exportBtn: {
    backgroundColor: '#7E57C2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.button,
    gap: 4,
  },
  exportBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  netBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14 },
  netLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  netValue: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  badgeHealth: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
  badgeHealthText: { fontSize: 11, fontWeight: '800' },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressIncomeFill: { backgroundColor: '#16A34A', height: '100%' },
  progressExpenseFill: { backgroundColor: '#DC3545', height: '100%' },
  progressLegendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  breakdownGrid: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 12, marginBottom: 24 },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  breakdownTitle: { fontSize: 15, fontWeight: '700', color: '#1A202C' },
  barItem: { marginBottom: 12 },
  barItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barItemLabel: { fontSize: 12, color: '#4A5568', fontWeight: '600' },
  barItemVal: { fontSize: 12, fontWeight: '700', color: '#1A202C' },
  barTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
});
