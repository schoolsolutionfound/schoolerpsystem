/**
 * @file AccountsTallyView.tsx
 * @description Dedicated Accounts & Financial Health page with visual charts, deficit/surplus tally, and cash flow ratios.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR } from '../utils/financeUtils';
import { showAlert } from '../../shared/utils/showAlert';

export const AccountsTallyView: React.FC = () => {
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);

  const [timeRange, setTimeRange] = useState<'month' | 'term' | 'year'>('month');

  // Calculations
  const totalIncome = incomeRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalExpenses = expenseRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingReceivables = incomeRecords
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingPayables = expenseRecords
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const netBalance = totalIncome - totalExpenses;
  const isSurplus = netBalance >= 0;

  // Breakdown metrics
  const tuitionIncome = incomeRecords.filter((r) => r.category === 'student_fee' && r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const transportIncome = incomeRecords.filter((r) => r.category === 'bus_fee' && r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const otherIncome = totalIncome - tuitionIncome - transportIncome;

  const salaryExpense = expenseRecords.filter((r) => r.category === 'salary' && r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const fleetExpense = expenseRecords.filter((r) => (r.category === 'bus_fuel' || r.category === 'bus_maintenance' || r.category === 'bus_expense') && r.status === 'paid').reduce((s, r) => s + r.amount, 0);
  const utilityExpense = totalExpenses - salaryExpense - fleetExpense;

  const collectionRatio = totalIncome + pendingReceivables > 0 ? Math.round((totalIncome / (totalIncome + pendingReceivables)) * 100) : 100;

  const handleExportStatement = () => {
    showAlert(
      'Account Statement Export',
      `Audit Statement for Term 1 (2026-27) generated.\n\nTotal Inflow: ${formatINR(totalIncome)}\nTotal Outflow: ${formatINR(totalExpenses)}\nNet Balance: ${formatINR(netBalance)}`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Time Filter & Export Bar */}
      <View style={styles.topBar}>
        <View style={styles.filterGroup}>
          {(['month', 'term', 'year'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.filterChip, timeRange === t && styles.filterChipActive]}
              onPress={() => setTimeRange(t)}
            >
              <Text style={[styles.filterChipText, timeRange === t && styles.filterChipTextActive]}>
                {t === 'month' ? 'This Month' : t === 'term' ? 'Term 1' : 'Annual (2026)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExportStatement}>
          <MaterialCommunityIcons name="file-pdf-box" size={16} color="#FFFFFF" />
          <Text style={styles.exportBtnText}>Audit PDF</Text>
        </TouchableOpacity>
      </View>

      {/* Main Net Financial Health Card */}
      <View style={[styles.netHealthCard, isSurplus ? styles.surplusCard : styles.deficitCard]}>
        <View style={styles.netTopRow}>
          <View style={[styles.statusPill, isSurplus ? styles.surplusPill : styles.deficitPill]}>
            <MaterialCommunityIcons
              name={isSurplus ? 'trending-up' : 'trending-down'}
              size={14}
              color={isSurplus ? '#16A34A' : '#DC2626'}
            />
            <Text style={[styles.statusPillText, isSurplus ? styles.surplusPillText : styles.deficitPillText]}>
              {isSurplus ? 'NET SURPLUS' : 'NET DEFICIT'}
            </Text>
          </View>
          <Text style={styles.tallyPeriodText}>Fiscal Period: Aug - Sep 2026</Text>
        </View>

        <Text style={[styles.netAmountVal, isSurplus ? styles.surplusText : styles.deficitText]}>
          {isSurplus ? '+' : '-'}{formatINR(Math.abs(netBalance))}
        </Text>
        <Text style={styles.netDescription}>
          {isSurplus
            ? 'Operating with a positive financial reserve after settling salaries & operational vouchers.'
            : 'Expenditures exceed realized cash inflows. Collect pending fee receivables to restore balance.'}
        </Text>

        {/* Visual Progress Bar Inflow vs Outflow */}
        <View style={styles.visualBarContainer}>
          <View style={styles.barLabelRow}>
            <Text style={styles.barLabelLeft}>Inflow: {formatINR(totalIncome)}</Text>
            <Text style={styles.barLabelRight}>Outflow: {formatINR(totalExpenses)}</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(
                    100,
                    totalIncome + totalExpenses > 0
                      ? Math.round((totalIncome / (totalIncome + totalExpenses)) * 100)
                      : 50
                  )}%`,
                  backgroundColor: '#16A34A',
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* 4 Financial Performance Metric Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiBox}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="arrow-bottom-left" size={18} color="#16A34A" />
          </View>
          <Text style={styles.kpiTitle}>Total Inflow</Text>
          <Text style={[styles.kpiNumber, { color: '#16A34A' }]}>{formatINR(totalIncome)}</Text>
          <Text style={styles.kpiSub}>Fee Collections</Text>
        </View>

        <View style={styles.kpiBox}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="arrow-top-right" size={18} color="#DC2626" />
          </View>
          <Text style={styles.kpiTitle}>Total Outflow</Text>
          <Text style={[styles.kpiNumber, { color: '#DC2626' }]}>{formatINR(totalExpenses)}</Text>
          <Text style={styles.kpiSub}>Payroll & Fleet</Text>
        </View>

        <View style={styles.kpiBox}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="clock-outline" size={18} color="#D97706" />
          </View>
          <Text style={styles.kpiTitle}>Pending Receivables</Text>
          <Text style={[styles.kpiNumber, { color: '#D97706' }]}>{formatINR(pendingReceivables)}</Text>
          <Text style={styles.kpiSub}>Unpaid Student Dues</Text>
        </View>

        <View style={styles.kpiBox}>
          <View style={[styles.kpiIconWrap, { backgroundColor: '#EDE7F6' }]}>
            <MaterialCommunityIcons name="percent" size={18} color="#7E57C2" />
          </View>
          <Text style={styles.kpiTitle}>Collection Rate</Text>
          <Text style={[styles.kpiNumber, { color: '#7E57C2' }]}>{collectionRatio}%</Text>
          <Text style={styles.kpiSub}>Efficiency Index</Text>
        </View>
      </View>

      {/* Revenue Breakdown by Category */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-pie" size={18} color="#7E57C2" />
          <Text style={styles.sectionTitle}>Income Sources Breakdown</Text>
        </View>

        <View style={styles.breakdownList}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <View style={[styles.catIndicator, { backgroundColor: '#7E57C2' }]} />
              <Text style={styles.breakdownName}>Student Tuition & Lab Fees</Text>
            </View>
            <Text style={styles.breakdownAmount}>{formatINR(tuitionIncome)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <View style={[styles.catIndicator, { backgroundColor: '#EA580C' }]} />
              <Text style={styles.breakdownName}>Bus Transport Fees</Text>
            </View>
            <Text style={styles.breakdownAmount}>{formatINR(transportIncome)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <View style={[styles.catIndicator, { backgroundColor: '#0284C7' }]} />
              <Text style={styles.breakdownName}>Hostel Boarding & Misc</Text>
            </View>
            <Text style={styles.breakdownAmount}>{formatINR(otherIncome)}</Text>
          </View>
        </View>
      </View>

      {/* Expenditure Breakdown by Category */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-bar" size={18} color="#DC2626" />
          <Text style={styles.sectionTitle}>Expenditure Distribution</Text>
        </View>

        <View style={styles.breakdownList}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <View style={[styles.catIndicator, { backgroundColor: '#DC2626' }]} />
              <Text style={styles.breakdownName}>Faculty & Staff Payroll</Text>
            </View>
            <Text style={styles.breakdownAmount}>{formatINR(salaryExpense)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <View style={[styles.catIndicator, { backgroundColor: '#D97706' }]} />
              <Text style={styles.breakdownName}>Fleet Fuel & Bus Maintenance</Text>
            </View>
            <Text style={styles.breakdownAmount}>{formatINR(fleetExpense)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownInfo}>
              <View style={[styles.catIndicator, { backgroundColor: '#059669' }]} />
              <Text style={styles.breakdownName}>Campus Electricity & Utilities</Text>
            </View>
            <Text style={styles.breakdownAmount}>{formatINR(utilityExpense)}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  content: { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterGroup: { flexDirection: 'row', gap: 6 },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  filterChipText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  filterChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7E57C2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  netHealthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  surplusCard: { borderLeftWidth: 4, borderLeftColor: '#16A34A' },
  deficitCard: { borderLeftWidth: 4, borderLeftColor: '#DC2626' },
  netTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  surplusPill: { backgroundColor: '#DCFCE7' },
  deficitPill: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 10, fontWeight: '800' },
  surplusPillText: { color: '#16A34A' },
  deficitPillText: { color: '#DC2626' },
  tallyPeriodText: { fontSize: 10, color: '#94A3B8' },
  netAmountVal: { fontSize: 26, fontWeight: '900', marginVertical: 4 },
  surplusText: { color: '#16A34A' },
  deficitText: { color: '#DC2626' },
  netDescription: { fontSize: 12, color: '#64748B', lineHeight: 17, marginBottom: 12 },

  visualBarContainer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  barLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabelLeft: { fontSize: 11, fontWeight: '700', color: '#16A34A' },
  barLabelRight: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  progressBarTrack: { height: 8, backgroundColor: '#DC2626', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 4 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpiBox: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiIconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  kpiTitle: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  kpiNumber: { fontSize: 16, fontWeight: '800', marginVertical: 2 },
  kpiSub: { fontSize: 10, color: '#94A3B8' },

  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  breakdownList: { gap: 10 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakdownInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catIndicator: { width: 8, height: 8, borderRadius: 4 },
  breakdownName: { fontSize: 12, color: '#475569', fontWeight: '600' },
  breakdownAmount: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
});
