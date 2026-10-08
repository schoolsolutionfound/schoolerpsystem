import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { AccountantHeader } from '../../features/accountant/components/AccountantHeader';
import { FinanceSummaryCards } from '../../features/accountant/components/FinanceSummaryCards';
import { StudentFeesView } from '../../features/accountant/components/StudentFeesView';
import { PendingDuesView } from '../../features/accountant/components/PendingDuesView';
import { IncomeManagementView } from '../../features/accountant/components/IncomeManagementView';
import { AccountsTallyView } from '../../features/accountant/components/AccountsTallyView';
import { ExpenseManagementView } from '../../features/accountant/components/ExpenseManagementView';
import { useFinanceStore } from '../../features/accountant/store/useFinanceStore';
import { FontFamily } from '../../constants/fonts';

type FinanceTab = 'overview' | 'fees' | 'dues' | 'income' | 'expenses' | 'accounts';

const TABS: { key: FinanceTab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'view-dashboard-outline' },
  { key: 'fees', label: 'Student Fees', icon: 'school-outline' },
  { key: 'dues', label: 'Pending Dues', icon: 'clock-alert-outline' },
  { key: 'income', label: 'Income', icon: 'cash-plus' },
  { key: 'expenses', label: 'Expenses', icon: 'cash-minus' },
  { key: 'accounts', label: 'Accounts', icon: 'calculator-variant-outline' },
];

export default function AccountantHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Accountant';
  const profilePic = useUserStore((state) => state.profilePic);
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const loadFees = useFinanceStore((s) => s.loadFees);
  const loading = useFinanceStore((s) => s.loading);
  const error = useFinanceStore((s) => s.error);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <AccountantHeader
          fullName={fullName}
          profilePic={profilePic}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(accountant)/profile')}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#FFFFFF' : '#6B6B6B'}
              />
              <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC3545" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {loading && !useFinanceStore.getState().loaded ? (
            <Text style={styles.loadingText}>Loading fee data…</Text>
          ) : null}

          {activeTab === 'overview' && (
            <>
              <FinanceSummaryCards onSelectTab={(t) => {
                if (t === 'dues') setActiveTab('dues');
                if (t === 'income') setActiveTab('income');
                if (t === 'expenses') setActiveTab('expenses');
                if (t === 'tally') setActiveTab('accounts');
              }} />
              <View style={styles.quickSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickRow}>
                  <TouchableOpacity style={styles.quickCard} onPress={() => setActiveTab('fees')}>
                    <MaterialCommunityIcons name="cash-multiple" size={22} color="#16A34A" />
                    <Text style={styles.quickCardTitle}>Student Fees</Text>
                    <Text style={styles.quickCardSub}>Collect & manage</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickCard} onPress={() => setActiveTab('dues')}>
                    <MaterialCommunityIcons name="clock-alert-outline" size={22} color="#D97706" />
                    <Text style={styles.quickCardTitle}>Pending Dues</Text>
                    <Text style={styles.quickCardSub}>Outstanding receivables</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
          {activeTab === 'fees' && <StudentFeesView />}
          {activeTab === 'dues' && <PendingDuesView />}
          {activeTab === 'income' && <IncomeManagementView />}
          {activeTab === 'expenses' && <ExpenseManagementView />}
          {activeTab === 'accounts' && <AccountsTallyView />}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  tabRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  tabBtnActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  tabLabel: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },
  tabLabelActive: { color: '#FFFFFF' },
  content: { paddingBottom: 32 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  errorText: { fontSize: 12, color: '#991B1B', flex: 1 },
  loadingText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 8,
    fontFamily: FontFamily.regular,
  },
  quickSection: { paddingHorizontal: 16, paddingTop: 8 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1B1C',
    marginBottom: 10,
    fontFamily: FontFamily.extrabold,
  },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 4,
  },
  quickCardTitle: { fontSize: 13, fontWeight: '700', color: '#1A1B1C', marginTop: 4 },
  quickCardSub: { fontSize: 11, color: '#6B6B6B' },
});
