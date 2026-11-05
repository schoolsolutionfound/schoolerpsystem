/**
 * @file IncomeExpenseTallyView.tsx
 * @description Financial balance overview for the School Finance portal.
 *
 * Shows:
 *  - Net financial balance
 *  - Income-vs-Expense ratio progress bar
 *  - Income stream breakdown bars (Student Tuition, Bus Transport, Hostel Boarding)
 *  - Detailed Expense allocation bars (Teacher Salaries, Bus Fuel, Bus Repairs, Hostel Mess, Utilities)
 *  - Clean mobile responsive layout with Export Statement action
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/useFinanceStore';
import {
  formatINR,
  getIncomeCategoryLabel,
  getExpenseCategoryLabel,
} from '../utils/financeUtils';
import { generateIncomeExpenseStatementPdf } from '../utils/financePdfGenerator';

const INCOME_COLORS = ['#171717', '#D97706', '#BE185D', '#0369A1', '#6B7280'];
const EXPENSE_COLORS = ['#DC3545', '#D97706', '#EA580C', '#9D174D', '#171717', '#475569'];

export const IncomeExpenseTallyView: React.FC = () => {
  const getTotalIncome = useFinanceStore((s) => s.getTotalIncome);
  const getTotalExpenses = useFinanceStore((s) => s.getTotalExpenses);
  const getNetTally = useFinanceStore((s) => s.getNetTally);
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpenses();
  const netTally = getNetTally();

  // Ratio for the income-vs-expense progress bar
  const grandTotal = totalIncome + totalExpense;
  const incomePercent = grandTotal > 0 ? Math.round((totalIncome / grandTotal) * 100) : 50;
  const expensePercent = grandTotal > 0 ? Math.round((totalExpense / grandTotal) * 100) : 50;

  // Breakdown streams derived from the categories actually present in the ledger
  const incomeStreams = useMemo(() => {
    const totals = new Map<string, number>();
    incomeRecords.forEach((r) => {
      if (r.status !== 'paid') return;
      totals.set(r.category, (totals.get(r.category) || 0) + r.amount);
    });
    return Array.from(totals.entries())
      .map(([key, amount]) => ({ key, label: getIncomeCategoryLabel(key), amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [incomeRecords]);

  const expenseStreams = useMemo(() => {
    const totals = new Map<string, number>();
    expenseRecords.forEach((r) => {
      if (r.status !== 'paid') return;
      totals.set(r.category, (totals.get(r.category) || 0) + r.amount);
    });
    return Array.from(totals.entries())
      .map(([key, amount]) => ({ key, label: getExpenseCategoryLabel(key), amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenseRecords]);

  const handleExportStatement = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateIncomeExpenseStatementPdf({
        totalIncome,
        totalExpense,
        netTally,
        incomeRecords,
        expenseRecords,
      });
    } catch (err: any) {
      Alert.alert('Export Failed', err?.message || 'Could not generate financial statement PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
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
          <TouchableOpacity style={[styles.exportBtn, { opacity: isGeneratingPdf ? 0.7 : 1 }]} onPress={handleExportStatement} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? (
              <ActivityIndicator size="small" color="#171717" />
            ) : (
              <MaterialCommunityIcons name="file-export-outline" size={16} color="#171717" />
            )}
            <Text style={styles.exportBtnText}>{isGeneratingPdf ? 'Generating...' : 'Export PDF'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.netBalanceRow}>
          <View>
            <Text style={styles.netLabel}>Net Balance</Text>
            <Text style={[styles.netValue, { color: netTally >= 0 ? '#16A34A' : '#DC3545' }]}>
              {netTally < 0 ? '-' : ''}{formatINR(netTally)}
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

          {incomeStreams.map((stream, index) => (
            <View key={stream.key} style={styles.barItem}>
              <View style={styles.barItemRow}>
                <Text style={styles.barItemLabel}>{stream.label}</Text>
                <Text style={styles.barItemVal}>{formatINR(stream.amount)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: INCOME_COLORS[index % INCOME_COLORS.length],
                      width: `${totalIncome > 0 ? (stream.amount / totalIncome) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Expense Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownCardHeader}>
            <MaterialCommunityIcons name="arrow-top-right-bold-box-outline" size={20} color="#DC3545" />
            <Text style={styles.breakdownTitle}>Expense Allocations</Text>
          </View>

          {expenseStreams.map((stream, index) => (
            <View key={stream.key} style={styles.barItem}>
              <View style={styles.barItemRow}>
                <Text style={styles.barItemLabel}>{stream.label}</Text>
                <Text style={styles.barItemVal}>{formatINR(stream.amount)}</Text>
              </View>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    {
                      backgroundColor: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
                      width: `${totalExpense > 0 ? (stream.amount / totalExpense) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 6 },
  tallyHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginBottom: 12,
  },
  tallyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tallyCardTitle: { fontSize: 16, fontWeight: '800', color: '#171717' },
  tallyCardSubtitle: { fontSize: 12, color: '#6B6B6B', marginTop: 1 },
  exportBtn: {
    backgroundColor: '#F4C430',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    gap: 4,
  },
  exportBtnText: { color: '#171717', fontWeight: '700', fontSize: 12 },
  netBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 14 },
  netLabel: { fontSize: 12, color: '#6B6B6B', fontWeight: '600' },
  netValue: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F0EDE3',
    borderRadius: 5,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressIncomeFill: { backgroundColor: '#16A34A', height: '100%' },
  progressExpenseFill: { backgroundColor: '#DC3545', height: '100%' },
  progressLegendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#6B6B6B', fontWeight: '600' },
  breakdownGrid: { flexDirection: Platform.OS === 'web' ? 'row' : 'column', gap: 12, marginBottom: 24 },
  breakdownCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  breakdownCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  breakdownTitle: { fontSize: 15, fontWeight: '700', color: '#171717' },
  barItem: { marginBottom: 12 },
  barItemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  barItemLabel: { fontSize: 12, color: '#6B6B6B', fontWeight: '600' },
  barItemVal: { fontSize: 12, fontWeight: '700', color: '#171717' },
  barTrack: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
});
