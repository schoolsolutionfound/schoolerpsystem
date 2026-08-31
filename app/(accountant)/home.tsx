import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';
import { FinanceSummaryCards } from '../../features/accountant/components/FinanceSummaryCards';
import { IncomeManagementView } from '../../features/accountant/components/IncomeManagementView';
import { ExpenseManagementView } from '../../features/accountant/components/ExpenseManagementView';
import { IncomeExpenseTallyView } from '../../features/accountant/components/IncomeExpenseTallyView';

export default function AccountantHomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'tally' | 'income' | 'expenses'>('tally');

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerBrand}>
            <View style={styles.logoIcon}>
              <MaterialCommunityIcons name="finance" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Finance & Accounting</Text>
              <Text style={styles.headerSubtitle}>SchoolHub ERP Portal</Text>
            </View>
          </View>

          <TouchableOpacity onPress={() => router.push('/(accountant)/profile')} style={styles.profileBtn}>
            <MaterialCommunityIcons name="account-circle-outline" size={28} color="#7E57C2" />
          </TouchableOpacity>
        </View>

        {/* Top KPI Cards */}
        <FinanceSummaryCards />

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'tally' && styles.tabItemActive]}
            onPress={() => setActiveTab('tally')}
          >
            <MaterialCommunityIcons
              name="scale-balance"
              size={18}
              color={activeTab === 'tally' ? '#7E57C2' : '#718096'}
            />
            <Text style={[styles.tabText, activeTab === 'tally' && styles.tabTextActive]}>
              Tally & Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'income' && styles.tabItemActive]}
            onPress={() => setActiveTab('income')}
          >
            <MaterialCommunityIcons
              name="cash-plus"
              size={18}
              color={activeTab === 'income' ? '#16A34A' : '#718096'}
            />
            <Text style={[styles.tabText, activeTab === 'income' && styles.tabTextActiveIncome]}>
              Fee Incomes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'expenses' && styles.tabItemActive]}
            onPress={() => setActiveTab('expenses')}
          >
            <MaterialCommunityIcons
              name="cash-minus"
              size={18}
              color={activeTab === 'expenses' ? '#DC3545' : '#718096'}
            />
            <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActiveExpense]}>
              Expenses & Salaries
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content View */}
        <View style={styles.tabContent}>
          {activeTab === 'tally' && <IncomeExpenseTallyView />}
          {activeTab === 'income' && <IncomeManagementView />}
          {activeTab === 'expenses' && <ExpenseManagementView />}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#7E57C2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#1A202C' },
  headerSubtitle: { fontSize: 11, color: '#718096' },
  profileBtn: { padding: 4 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  tabItemActive: { backgroundColor: '#F1F5F9' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#718096' },
  tabTextActive: { color: '#7E57C2', fontWeight: '700' },
  tabTextActiveIncome: { color: '#16A34A', fontWeight: '700' },
  tabTextActiveExpense: { color: '#DC3545', fontWeight: '700' },
  tabContent: { flex: 1 },
});
