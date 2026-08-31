import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';

export const IncomeExpenseTallyView: React.FC = () => {
  const getTotalIncome = useFinanceStore((s) => s.getTotalIncome);
  const getTotalExpenses = useFinanceStore((s) => s.getTotalExpenses);
  const getNetTally = useFinanceStore((s) => s.getNetTally);
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);

  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpenses();
  const netTally = getNetTally();

  const grandTotal = totalIncome + totalExpense;
  const incomePercent = grandTotal > 0 ? Math.round((totalIncome / grandTotal) * 100) : 50;
  const expensePercent = grandTotal > 0 ? Math.round((totalExpense / grandTotal) * 100) : 50;

  // Breakdown by Income category
  const studentFeesTotal = incomeRecords
    .filter((r) => r.category === 'student_fee' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const busFeesTotal = incomeRecords
    .filter((r) => r.category === 'bus_fee' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const hostelFeesTotal = incomeRecords
    .filter((r) => r.category === 'hostel_fee' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  // Breakdown by Expense category
  const salariesTotal = expenseRecords
    .filter((r) => r.category === 'salary' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const busExpensesTotal = expenseRecords
    .filter((r) => r.category === 'bus_expense' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const hostelExpensesTotal = expenseRecords
    .filter((r) => r.category === 'hostel_expense' && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleExportStatement = () => {
    const msg = `Financial Statement Exported:\nTotal Income: ₹${totalIncome.toLocaleString('en-IN')}\nTotal Expenses: ₹${totalExpense.toLocaleString('en-IN')}\nNet Surplus Tally: ₹${netTally.toLocaleString('en-IN')}`;
    if (Platform.OS === 'web') {
      alert(msg);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Tally Health Overview */}
      <View style={styles.tallyHeaderCard}>
        <View style={styles.tallyHeaderRow}>
          <View>
            <Text style={styles.tallyCardTitle}>Income & Expense Tally</Text>
            <Text style={styles.tallyCardSubtitle}>Current Academic Term Financial Balance</Text>
          </View>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExportStatement}>
            <MaterialCommunityIcons name="file-export-outline" size={18} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>Export Statement</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.netBalanceRow}>
          <View>
            <Text style={styles.netLabel}>Net Financial Balance</Text>
            <Text style={[styles.netValue, { color: netTally >= 0 ? '#16A34A' : '#DC3545' }]}>
              ₹{netTally.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.badgeHealth, { backgroundColor: netTally >= 0 ? '#DCFCE7' : '#FEE2E2' }]}>
            <MaterialCommunityIcons
              name={netTally >= 0 ? 'shield-check' : 'alert-circle'}
              size={18}
              color={netTally >= 0 ? '#16A34A' : '#DC3545'}
            />
            <Text style={[styles.badgeHealthText, { color: netTally >= 0 ? '#16A34A' : '#DC3545' }]}>
              {netTally >= 0 ? 'Healthy Surplus' : 'Deficit Alert'}
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
            <Text style={styles.legendText}>Inflows (Fees & Rent): {incomePercent}%</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: '#DC3545' }]} />
            <Text style={styles.legendText}>Outflows (Salaries & Fleet): {expensePercent}%</Text>
          </View>
        </View>
      </View>

      {/* Grid: Income vs Expense Breakdown */}
      <View style={styles.breakdownGrid}>
        {/* Income Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownCardHeader}>
            <MaterialCommunityIcons name="arrow-bottom-left-bold-box-outline" size={22} color="#16A34A" />
            <Text style={styles.breakdownTitle}>Income Streams</Text>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Student Tuition & Fees</Text>
              <Text style={styles.barItemVal}>₹{studentFeesTotal.toLocaleString('en-IN')}</Text>
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
              <Text style={styles.barItemVal}>₹{busFeesTotal.toLocaleString('en-IN')}</Text>
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
              <Text style={styles.barItemVal}>₹{hostelFeesTotal.toLocaleString('en-IN')}</Text>
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
            <MaterialCommunityIcons name="arrow-top-right-bold-box-outline" size={22} color="#DC3545" />
            <Text style={styles.breakdownTitle}>Expense Allocations</Text>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Teacher & Staff Salaries</Text>
              <Text style={styles.barItemVal}>₹{salariesTotal.toLocaleString('en-IN')}</Text>
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
              <Text style={styles.barItemLabel}>Bus Fleet Fuel & Repairs</Text>
              <Text style={styles.barItemVal}>₹{busExpensesTotal.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: '#B45309',
                    width: `${totalExpense > 0 ? (busExpensesTotal / totalExpense) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.barItem}>
            <View style={styles.barItemRow}>
              <Text style={styles.barItemLabel}>Hostel Mess & Supplies</Text>
              <Text style={styles.barItemVal}>₹{hostelExpensesTotal.toLocaleString('en-IN')}</Text>
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
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  tallyHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  tallyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tallyCardTitle: { fontSize: 18, fontWeight: '800', color: '#1A202C' },
  tallyCardSubtitle: { fontSize: 13, color: '#718096', marginTop: 2 },
  exportBtn: {
    backgroundColor: '#7E57C2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.button,
    gap: 6,
  },
  exportBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  netBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 18 },
  netLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  netValue: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  badgeHealth: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 4 },
  badgeHealthText: { fontSize: 12, fontWeight: '800' },
  progressBarBg: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressIncomeFill: { backgroundColor: '#16A34A', height: '100%' },
  progressExpenseFill: { backgroundColor: '#DC3545', height: '100%' },
  progressLegendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  breakdownGrid: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 16, marginBottom: 24 },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  breakdownTitle: { fontSize: 16, fontWeight: '700', color: '#1A202C' },
  barItem: { marginBottom: 14 },
  barItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barItemLabel: { fontSize: 13, color: '#4A5568', fontWeight: '600' },
  barItemVal: { fontSize: 13, fontWeight: '700', color: '#1A202C' },
  barTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});
