/**
 * @file AccountantHomeOverview.tsx
 * @description Overview content for the Finance portal home:
 *  1. Dark hero "Net Balance" card with Inflow / Outflow / Pending stats row
 *  2. 2×2 Quick Actions grid
 *  3. Recent Activity feed (merged income + expense, newest first)
 *
 * Renders as a plain View — the parent screen owns the ScrollView.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR } from '../utils/financeUtils';

type NavTab = 'overview' | 'fees' | 'dues' | 'income' | 'payments' | 'expenses' | 'accounts' | 'announcements';

interface AccountantHomeOverviewProps {
  onNavigateTab: (tab: NavTab) => void;
}

const QUICK_ACTIONS: { tab: NavTab; title: string; sub: string; icon: string }[] = [
  { tab: 'fees', title: 'Student Fees', sub: 'Collect & manage', icon: 'school-outline' },
  { tab: 'dues', title: 'Pending Dues', sub: 'Outstanding receivables', icon: 'clock-alert-outline' },
  { tab: 'payments', title: 'Online Payments', sub: 'Razorpay gateway', icon: 'credit-card-outline' },
  { tab: 'accounts', title: 'Accounts', sub: 'Tally & audit PDF', icon: 'calculator-variant-outline' },
];

export const AccountantHomeOverview: React.FC<AccountantHomeOverviewProps> = ({ onNavigateTab }) => {
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);

  const totalIncome = incomeRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const pendingDues = incomeRecords
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const net = totalIncome - totalExpense;
  const isSurplus = net >= 0;

  const recent = [
    ...incomeRecords.map((r) => ({
      id: r.id,
      dir: 'in' as const,
      title: r.title,
      who: r.payerName,
      amount: r.amount,
      date: r.paymentDate,
    })),
    ...expenseRecords.map((r) => ({
      id: r.id,
      dir: 'out' as const,
      title: r.title,
      who: r.payeeName,
      amount: r.amount,
      date: r.paymentDate,
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5);

  return (
    <View style={styles.root}>
      {/* ── Hero: Net Balance ── */}
      <View style={styles.hero}>
        <View>
          <Text style={styles.heroLabel}>NET BALANCE</Text>
          <Text style={styles.heroAmount}>
            {isSurplus ? '+' : '-'}{formatINR(Math.abs(net))}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: '#4ADE80' }]}>{formatINR(totalIncome)}</Text>
            <Text style={styles.statLabel}>INFLOW</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: '#F87171' }]}>{formatINR(totalExpense)}</Text>
            <Text style={styles.statLabel}>OUTFLOW</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={[styles.statNum, { color: '#FBBF24' }]}>{formatINR(pendingDues)}</Text>
            <Text style={styles.statLabel}>PENDING</Text>
          </View>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.tab}
              style={styles.quickCard}
              activeOpacity={0.75}
              onPress={() => onNavigateTab(a.tab)}
            >
              <Text style={styles.quickCardTitle}>{a.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Recent Activity ── */}
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => onNavigateTab('income')} activeOpacity={0.7}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>

        {recent.length === 0 ? (
          <Text style={styles.emptyText}>No transactions recorded yet.</Text>
        ) : (
          recent.map((item, idx) => (
            <View
              key={item.id}
              style={[styles.activityRow, idx < recent.length - 1 && styles.activityRowDivider]}
            >
              <View style={[styles.activityIcon, { backgroundColor: item.dir === 'in' ? '#DCFCE7' : '#FEE2E2' }]}>
                <MaterialCommunityIcons
                  name={item.dir === 'in' ? 'arrow-bottom-left' : 'arrow-top-right'}
                  size={16}
                  color={item.dir === 'in' ? '#16A34A' : '#DC3545'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.activityMeta} numberOfLines={1}>
                  {item.who} · {item.date}
                </Text>
              </View>
              <Text style={[styles.activityAmount, { color: item.dir === 'in' ? '#16A34A' : '#DC3545' }]}>
                {item.dir === 'in' ? '+' : '-'}{formatINR(item.amount)}
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { paddingHorizontal: 16, paddingTop: 4, gap: 16, paddingBottom: 8 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#171717',
    borderRadius: 5,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  heroLabel: {
    fontSize: 10,
    color: '#8A8A8A',
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  heroAmount: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
    marginTop: 16,
    backgroundColor: '#232425',
    borderRadius: 5,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  statNum: { fontSize: 13, fontWeight: '800' },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8A8A8A',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 5 },

  // ── Quick Actions ─────────────────────────────────────────────────────────
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#171717', marginBottom: 10 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTitle: { fontSize: 13, fontWeight: '700', color: '#171717', textAlign: 'center' },

  // ── Recent Activity ───────────────────────────────────────────────────────
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: { fontSize: 12, fontWeight: '700', color: '#B8860B', marginBottom: 10 },
  emptyText: {
    fontSize: 12,
    color: '#9A9A9A',
    textAlign: 'center',
    paddingVertical: 18,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  activityRowDivider: { borderBottomWidth: 1, borderBottomColor: '#F7F5EE' },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: { fontSize: 13, fontWeight: '700', color: '#171717' },
  activityMeta: { fontSize: 11, color: '#6B6B6B', marginTop: 1 },
  activityAmount: { fontSize: 13, fontWeight: '800' },
});
