/**
 * @file home.tsx
 * @description Accountant & Finance Portal Main Dashboard.
 *
 * Full-featured financial cockpit for school finance officers:
 *  - Header matching Student & Admin design system
 *  - Quick Action Navigation Grid
 *  - High-level Financial Health & Net Tally KPI Cards
 *  - Dedicated Sub-Pages:
 *      1. Home Cockpit — Summary, quick actions, recent transaction ledger
 *      2. Accounts & Tally — Deficit/Surplus charts, cash flow ratios, audit balance sheet
 *      3. Student Fees — Paid vs Unpaid student dues, class filter, 1-tap collection & reminders
 *      4. Bus & Fleet — Diesel fuel fill-ups vs Bus maintenance & repairs
 *      5. Payroll & Ops — Staff salaries, 1-tap salary disbursal, vendor vouchers
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { useFinanceStore } from '../../features/accountant/store/useFinanceStore';
import { AccountantHeader } from '../../features/accountant/components/AccountantHeader';
import { FinanceSummaryCards } from '../../features/accountant/components/FinanceSummaryCards';
import { AccountsTallyView } from '../../features/accountant/components/AccountsTallyView';
import { StudentFeesView } from '../../features/accountant/components/StudentFeesView';
import { FleetTransportView } from '../../features/accountant/components/FleetTransportView';
import { PayrollExpensesView } from '../../features/accountant/components/PayrollExpensesView';
import { IncomeManagementView } from '../../features/accountant/components/IncomeManagementView';
import { formatINR } from '../../features/accountant/utils/financeUtils';

export default function AccountantHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Finance Officer';
  const profilePic = useUserStore((state) => state.profilePic);

  const [activeTab, setActiveTab] = useState<
    'home' | 'tally' | 'student-fees' | 'fleet' | 'payroll'
  >('home');

  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);

  const totalDuesCount =
    incomeRecords.filter((r) => r.status !== 'paid').length +
    expenseRecords.filter((r) => r.category === 'salary' && r.status !== 'paid').length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Top Header matching Student & Admin theme */}
        <AccountantHeader
          fullName={fullName}
          profilePic={profilePic}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(accountant)/profile')}
        />

        {/* ── Tab 1: Home Cockpit Overview ── */}
        {activeTab === 'home' && (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Quick Action Navigation Grid */}
            <View style={styles.quickActionsRow}>
              <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('tally')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#EDE7F6' }]}>
                  <MaterialCommunityIcons name="scale-balance" size={20} color="#7E57C2" />
                </View>
                <Text style={styles.quickActionTitle}>Accounts Tally</Text>
                <Text style={styles.quickActionSub}>Graphs & Deficit</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('student-fees')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <MaterialCommunityIcons name="school-outline" size={20} color="#16A34A" />
                </View>
                <Text style={styles.quickActionTitle}>Student Fees</Text>
                <Text style={styles.quickActionSub}>Paid vs Unpaid</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('fleet')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#FFEDD5' }]}>
                  <MaterialCommunityIcons name="bus-clock" size={20} color="#EA580C" />
                </View>
                <Text style={styles.quickActionTitle}>Bus & Fuel</Text>
                <Text style={styles.quickActionSub}>Fleet Repairs</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickActionCard} onPress={() => setActiveTab('payroll')}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialCommunityIcons name="account-cash-outline" size={20} color="#DC2626" />
                </View>
                <Text style={styles.quickActionTitle}>Staff Payroll</Text>
                <Text style={styles.quickActionSub}>Salaries</Text>
              </TouchableOpacity>
            </View>

            {/* Interactive Live KPI Cards */}
            <FinanceSummaryCards
              onSelectTab={(tab) => {
                if (tab === 'tally') setActiveTab('tally');
                else if (tab === 'dues' || tab === 'income') setActiveTab('student-fees');
                else if (tab === 'fleet') setActiveTab('fleet');
                else if (tab === 'expenses') setActiveTab('payroll');
              }}
            />

            {/* Recent Fee Incomes & Collections */}
            <View style={styles.sectionHeaderWrap}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="receipt-text-outline" size={18} color="#7E57C2" />
                <Text style={styles.sectionTitle}>Fee & Income Register</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveTab('student-fees')}>
                <Text style={styles.viewAllText}>View All Students →</Text>
              </TouchableOpacity>
            </View>

            <IncomeManagementView />
          </ScrollView>
        )}

        {/* ── Tab 2: Accounts & Tally Graphs Page ── */}
        {activeTab === 'tally' && <AccountsTallyView />}

        {/* ── Tab 3: Student Fees Paid vs Unpaid Page ── */}
        {activeTab === 'student-fees' && <StudentFeesView />}

        {/* ── Tab 4: Bus Transport & Fleet Page ── */}
        {activeTab === 'fleet' && <FleetTransportView />}

        {/* ── Tab 5: Payroll & Operational Expenses Page ── */}
        {activeTab === 'payroll' && <PayrollExpensesView />}

        {/* ── Unified Modern Bottom Navigation Bar ── */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
            <MaterialCommunityIcons
              name="home-outline"
              size={22}
              color={activeTab === 'home' ? '#7E57C2' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Overview</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('tally')}>
            <MaterialCommunityIcons
              name="chart-timeline-variant-shimmer"
              size={22}
              color={activeTab === 'tally' ? '#7E57C2' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'tally' && styles.tabLabelActive]}>Accounts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('student-fees')}>
            <MaterialCommunityIcons
              name="school-outline"
              size={22}
              color={activeTab === 'student-fees' ? '#7E57C2' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'student-fees' && styles.tabLabelActive]}>Fees</Text>
            {totalDuesCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{totalDuesCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('fleet')}>
            <MaterialCommunityIcons
              name="bus-clock"
              size={22}
              color={activeTab === 'fleet' ? '#7E57C2' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'fleet' && styles.tabLabelActive]}>Fleet</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('payroll')}>
            <MaterialCommunityIcons
              name="account-cash-outline"
              size={22}
              color={activeTab === 'payroll' ? '#7E57C2' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'payroll' && styles.tabLabelActive]}>Payroll</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 12 },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  quickActionTitle: { fontSize: 11, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  quickActionSub: { fontSize: 9, color: '#64748B', marginTop: 1, textAlign: 'center' },

  sectionHeaderWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  viewAllText: { fontSize: 12, fontWeight: '700', color: '#7E57C2' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 10, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  tabLabelActive: { color: '#7E57C2', fontWeight: '800' },
  tabBadge: {
    position: 'absolute',
    top: -2,
    right: 14,
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  tabBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
});
