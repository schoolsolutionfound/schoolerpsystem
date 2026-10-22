/**
 * @file AccountsTallyView.tsx
 * @description Dedicated Accounts & Financial Health page: charcoal hero balance card,
 * working time-range filter, health KPIs, category breakdowns with share bars, real PDF export.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR } from '../utils/financeUtils';
import { generateIncomeExpenseStatementPdf } from '../utils/financePdfGenerator';
import { showAlert } from '../../shared/utils/showAlert';

type TimeRange = 'month' | 'year' | 'all';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const RANGE_OPTIONS: { key: TimeRange; label: string }[] = [
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'This Year' },
  { key: 'all', label: 'All Time' },
];

export const AccountsTallyView: React.FC = () => {
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);

  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const now = new Date();
  const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const yearPrefix = `${now.getFullYear()}`;

  const inWindow = (paymentDate?: string, dueDate?: string): boolean => {
    if (timeRange === 'all') return true;
    const key = paymentDate || dueDate || '';
    if (!key) return false;
    if (timeRange === 'month') return key.startsWith(monthPrefix);
    return key.startsWith(yearPrefix);
  };

  const scopedIncome = incomeRecords.filter((r) => inWindow(r.paymentDate, r.dueDate));
  const scopedExpense = expenseRecords.filter((r) => inWindow(r.paymentDate, r.dueDate));

  const totalIncome = scopedIncome
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpenses = scopedExpense
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingReceivables = scopedIncome
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const isSurplus = netBalance >= 0;

  const periodLabel =
    timeRange === 'month'
      ? `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`
      : timeRange === 'year'
        ? `Year ${now.getFullYear()}`
        : 'All recorded data';

  // Category breakdowns
  const tuitionIncome = scopedIncome.filter((r) => r.category === 'student_fee' && r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const transportIncome = scopedIncome.filter((r) => r.category === 'bus_fee' && r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const otherIncome = totalIncome - tuitionIncome - transportIncome;

  const salaryExpense = scopedExpense.filter((r) => r.category === 'salary' && r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const fleetExpense = scopedExpense.filter((r) => (r.category === 'bus_fuel' || r.category === 'bus_maintenance' || r.category === 'bus_expense') && r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const utilityExpense = totalExpenses - salaryExpense - fleetExpense;

  // Health metrics
  const collectionRatio = totalIncome + pendingReceivables > 0 ? Math.round((totalIncome / (totalIncome + pendingReceivables)) * 100) : 100;
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpenses / totalIncome) * 100) : 0;
  const netMargin = totalIncome > 0 ? Math.round((netBalance / totalIncome) * 100) : 0;

  const inflowPct =
    totalIncome + totalExpenses > 0 ? (totalIncome / (totalIncome + totalExpenses)) * 100 : 50;

  const sharePct = (part: number, total: number): number => {
    if (part <= 0 || total <= 0) return 0;
    return Math.max(4, Math.round((part / total) * 100));
  };

  const handleExportStatement = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await generateIncomeExpenseStatementPdf({
        totalIncome,
        totalExpense: totalExpenses,
        netTally: netBalance,
        incomeRecords: scopedIncome,
        expenseRecords: scopedExpense,
      });
    } catch (err: any) {
      showAlert('Export Failed', err?.message || 'Could not generate financial statement PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const renderBreakdownRow = (
    name: string,
    amount: number,
    total: number,
    color: string
  ) => (
    <View key={name} style={styles.breakdownRowWrap}>
      <View style={styles.breakdownRowTop}>
        <View style={styles.breakdownInfo}>
          <Text style={styles.breakdownName}>{name}</Text>
        </View>
        <View style={styles.breakdownVal}>
          <Text style={styles.breakdownAmount}>{formatINR(amount)}</Text>
          <View style={styles.pctChip}>
            <Text style={styles.pctChipText}>{total > 0 ? sharePct(amount, total) : 0}%</Text>
          </View>
        </View>
      </View>
      <View style={styles.shareTrack}>
        <View style={[styles.shareFill, { width: `${sharePct(amount, total)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Time filter + Export */}
      <View style={styles.topBar}>
        <View style={styles.segmented}>
          {RANGE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.segBtn, timeRange === t.key && styles.segBtnActive]}
              onPress={() => setTimeRange(t.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.segBtnText, timeRange === t.key && styles.segBtnTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.exportBtn, { opacity: isGeneratingPdf ? 0.7 : 1 }]}
          onPress={handleExportStatement}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? <ActivityIndicator size="small" color="#171717" /> : null}
          <Text style={styles.exportBtnText}>{isGeneratingPdf ? 'Generating…' : 'Audit PDF'}</Text>
        </TouchableOpacity>
      </View>

      {/* Hero net balance card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroPeriod}>{periodLabel}</Text>

        <Text style={styles.heroLabel}>NET BALANCE</Text>
        <Text style={styles.heroAmount}>
          {isSurplus ? '+' : '−'} {formatINR(Math.abs(netBalance))}
        </Text>

        <View style={styles.heroTrack}>
          <View style={[styles.heroFillGreen, { width: `${inflowPct}%` }]} />
          <View style={[styles.heroFillRed, { width: `${100 - inflowPct}%` }]} />
        </View>
        <View style={styles.heroLegendRow}>
          <View style={styles.heroLegendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F4C430' }]} />
            <Text style={styles.heroLegendText}>Inflow {formatINR(totalIncome)}</Text>
          </View>
          <View style={styles.heroLegendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'rgba(255,255,255,0.45)' }]} />
            <Text style={styles.heroLegendText}>Outflow {formatINR(totalExpenses)}</Text>
          </View>
        </View>
      </View>

      {/* Health KPIs */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>Pending Receivables</Text>
          <Text numberOfLines={1} style={[styles.kpiNumber, { color: '#171717' }]}>{formatINR(pendingReceivables)}</Text>
          <Text style={styles.kpiSub}>Unpaid student dues</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>Collection Rate</Text>
          <Text numberOfLines={1} style={[styles.kpiNumber, { color: '#171717' }]}>{collectionRatio}%</Text>
          <Text style={styles.kpiSub}>Collected vs billed</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>Expense Ratio</Text>
          <Text numberOfLines={1} style={[styles.kpiNumber, { color: '#171717' }]}>{expenseRatio}%</Text>
          <Text style={styles.kpiSub}>Spend vs income</Text>
        </View>

        <View style={styles.kpiBox}>
          <Text style={styles.kpiTitle}>Net Margin</Text>
          <Text numberOfLines={1} style={[styles.kpiNumber, { color: '#171717' }]}>{netMargin}%</Text>
          <Text style={styles.kpiSub}>Income retained</Text>
        </View>
      </View>

      {/* Income Sources Breakdown */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Income Sources</Text>
          <View style={styles.sectionTotal}>
            <Text style={styles.sectionTotalText}>{formatINR(totalIncome)}</Text>
          </View>
        </View>

        {renderBreakdownRow('Student Tuition & Lab Fees', tuitionIncome, totalIncome, '#F4C430')}
        {renderBreakdownRow('Bus Transport Fees', transportIncome, totalIncome, '#B8860B')}
        {renderBreakdownRow('Hostel Boarding & Misc', otherIncome, totalIncome, '#171717')}
      </View>

      {/* Expenditure Breakdown */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Expenditure Distribution</Text>
          <View style={styles.sectionTotal}>
            <Text style={styles.sectionTotalText}>{formatINR(totalExpenses)}</Text>
          </View>
        </View>

        {renderBreakdownRow('Faculty & Staff Payroll', salaryExpense, totalExpenses, '#171717')}
        {renderBreakdownRow('Fleet Fuel & Bus Maintenance', fleetExpense, totalExpenses, '#6B6B6B')}
        {renderBreakdownRow('Campus Electricity & Utilities', utilityExpense, totalExpenses, '#B8860B')}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  content: { paddingHorizontal: 16, paddingVertical: 12, gap: 12, paddingBottom: 28 },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  segmented: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 3,
    gap: 3,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 5,
  },
  segBtnActive: { backgroundColor: '#171717' },
  segBtnText: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },
  segBtnTextActive: { color: '#FFFFFF' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 5,
  },
  exportBtnText: { color: '#171717', fontSize: 11, fontWeight: '800' },

  heroCard: {
    backgroundColor: '#171717',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#171717',
  },
  heroPeriod: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  heroLabel: {
    fontSize: 10,
    color: '#F4C430',
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 14,
  },
  heroAmount: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', marginTop: 2, marginBottom: 14 },
  heroTrack: {
    height: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  heroFillGreen: { height: '100%', backgroundColor: '#F4C430' },
  heroFillRed: { height: '100%', backgroundColor: 'rgba(255,255,255,0.18)' },
  heroLegendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  heroLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  heroLegendText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiBox: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  kpiTitle: { fontSize: 11, color: '#6B6B6B', fontWeight: '600' },
  kpiNumber: { fontSize: 17, fontWeight: '900', marginVertical: 2 },
  kpiSub: { fontSize: 10, color: '#9A9A9A' },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#171717', flex: 1 },
  sectionTotal: {
    backgroundColor: '#F7F5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  sectionTotalText: { fontSize: 11, fontWeight: '800', color: '#171717' },

  breakdownRowWrap: { marginBottom: 12 },
  breakdownRowWrapLast: { marginBottom: 0 },
  breakdownRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  breakdownInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1, paddingRight: 8 },
  breakdownName: { fontSize: 12, color: '#6B6B6B', fontWeight: '600', flexShrink: 1 },
  breakdownVal: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakdownAmount: { fontSize: 13, fontWeight: '800', color: '#171717' },
  pctChip: {
    backgroundColor: '#F7F5EE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  pctChipText: { fontSize: 10, fontWeight: '800', color: '#6B6B6B' },
  shareTrack: {
    height: 6,
    backgroundColor: '#F7F5EE',
    borderRadius: 5,
    overflow: 'hidden',
  },
  shareFill: { height: '100%', borderRadius: 5 },
});
