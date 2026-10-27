/**
 * @file AccountantHomeOverview.tsx
 * @description Overview content for the Finance portal home:
 *  1. Greeting + light Net Balance card with Inflow / Outflow / Pending stats
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
import { FontFamily } from '../../../constants/fonts';

type NavTab = 'overview' | 'fees' | 'dues' | 'income' | 'payments' | 'expenses' | 'accounts' | 'announcements';

interface AccountantHomeOverviewProps {
  onNavigateTab: (tab: NavTab) => void;
  userName?: string;
}

const QUICK_ACTIONS: { tab: NavTab; title: string; sub: string; icon: string }[] = [
  { tab: 'fees', title: 'Student Fees', sub: 'Collect & manage', icon: 'school-outline' },
  { tab: 'dues', title: 'Pending Dues', sub: 'Outstanding receivables', icon: 'clock-alert-outline' },
  { tab: 'payments', title: 'Online Payments', sub: 'Razorpay gateway', icon: 'credit-card-outline' },
  { tab: 'accounts', title: 'Accounts', sub: 'Tally & audit PDF', icon: 'calculator-variant-outline' },
];

export const AccountantHomeOverview: React.FC<AccountantHomeOverviewProps> = ({
  onNavigateTab,
  userName,
}) => {
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
  const firstName = (userName || 'Accountant').split(' ')[0];

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
      {/* ── Greeting ── */}
      <View style={styles.headerRow}>
        <Text style={styles.greeting}>Hello, {firstName}</Text>
        <Text style={styles.greetingSub}>Here is your finance overview.</Text>
      </View>

      {/* ── Net Balance ── */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceTopRow}>
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>NET BALANCE</Text>
            <Text
              style={styles.balanceAmount}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {isSurplus ? '+' : '-'}{formatINR(Math.abs(net))}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>INFLOW</Text>
            <Text
              style={[styles.statNum, { color: '#16A34A' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatINR(totalIncome)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>OUTFLOW</Text>
            <Text
              style={[styles.statNum, { color: '#DC3545' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatINR(totalExpense)}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>PENDING</Text>
            <Text
              style={[styles.statNum, { color: '#D97706' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {formatINR(pendingDues)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.sectionUnderline} />
          </View>
        </View>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.tab}
              style={styles.quickCard}
              activeOpacity={0.75}
              onPress={() => onNavigateTab(a.tab)}
            >
              <View style={styles.quickTopRow}>
                <View style={styles.quickIcon}>
                  <MaterialCommunityIcons name={a.icon as any} size={18} color="#171717" />
                </View>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#9CA3AF" />
              </View>
              <Text style={styles.quickCardTitle}>{a.title}</Text>
              <Text style={styles.quickCardSub} numberOfLines={1}>{a.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Recent Activity ── */}
      <View style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <View style={styles.sectionUnderline} />
          </View>
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
  root: { paddingHorizontal: 16, paddingTop: 4, gap: 18, paddingBottom: 8 },

  headerRow: { gap: 2 },
  greeting: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    letterSpacing: -0.2,
  },
  greetingSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },

  // ── Net Balance ───────────────────────────────────────────────────────────
  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  balanceTopRow: {
    marginBottom: 14,
  },
  balanceInfo: { flex: 1 },
  balanceLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#B8860B',
    letterSpacing: 1.2,
  },
  balanceAmount: {
    fontSize: 28,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 10,
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  statNum: { fontSize: 13, fontFamily: FontFamily.extrabold, marginTop: 3, maxWidth: '100%' },
  statLabel: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  statDivider: { width: 1, backgroundColor: '#E8E5DC', marginVertical: 4 },

  // ── Section headings ───────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827' },
  sectionUnderline: {
    width: 28,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#F4C430',
    marginTop: 4,
  },

  // ── Quick Actions ─────────────────────────────────────────────────────────
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickCard: {
    width: '48.3%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    gap: 3,
  },
  quickTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  quickCardSub: { fontSize: 10, fontFamily: FontFamily.regular, color: '#6B7280' },

  // ── Recent Activity ───────────────────────────────────────────────────────
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  viewAll: { fontSize: 12, fontFamily: FontFamily.bold, color: '#B8860B', marginTop: 4 },
  emptyText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 18,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  activityRowDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  activityIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  activityMeta: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 1 },
  activityAmount: { fontSize: 13, fontFamily: FontFamily.bold },
});
