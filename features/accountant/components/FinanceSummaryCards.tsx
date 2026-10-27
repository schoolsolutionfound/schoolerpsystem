/**
 * @file FinanceSummaryCards.tsx
 * @description KPI summary card grid for the School Finance portal header.
 *
 * Displays 4 interactive metric cards pulled live from the finance store:
 *  - Total Fee Income collected (paid records only)
 *  - Total Expenses disbursed (paid records only)
 *  - Net Financial Tally (Income − Expenses)
 *  - Pending Fee Receivables (unpaid income records)
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFinanceStore } from '../store/useFinanceStore';
import { formatINR } from '../utils/financeUtils';

interface FinanceSummaryCardsProps {
  onSelectTab?: (tab: 'tally' | 'dues' | 'fleet' | 'income' | 'expenses') => void;
}

export const FinanceSummaryCards: React.FC<FinanceSummaryCardsProps> = ({ onSelectTab }) => {
  const incomeRecords = useFinanceStore((s) => s.incomeRecords);
  const expenseRecords = useFinanceStore((s) => s.expenseRecords);

  const totalIncome = incomeRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = expenseRecords
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
  const netTally = totalIncome - totalExpense;
  const pendingTotal = incomeRecords
    .filter((r) => r.status !== 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <View style={styles.gridContainer}>
      {/* Total Income Card */}
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: '#16A34A' }]}
        activeOpacity={0.8}
        onPress={() => onSelectTab?.('income')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#16A34A" />
          </View>
          <Text style={styles.cardTag}>Income</Text>
        </View>
        <Text style={styles.cardValue}>{formatINR(totalIncome)}</Text>
        <Text style={styles.cardSubtitle}>Fees & Inflows</Text>
      </TouchableOpacity>

      {/* Total Expense Card */}
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: '#DC3545' }]}
        activeOpacity={0.8}
        onPress={() => onSelectTab?.('expenses')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="trending-down" size={20} color="#DC3545" />
          </View>
          <Text style={styles.cardTag}>Expenses</Text>
        </View>
        <Text style={styles.cardValue}>{formatINR(totalExpense)}</Text>
        <Text style={styles.cardSubtitle}>Salaries & Fleet</Text>
      </TouchableOpacity>

      {/* Net Financial Tally Card */}
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: '#F4C430' }]}
        activeOpacity={0.8}
        onPress={() => onSelectTab?.('tally')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#FFF4C7' }]}>
            <MaterialCommunityIcons name="scale-balance" size={20} color="#171717" />
          </View>
          <Text style={styles.cardTag}>Net Tally</Text>
        </View>
        <Text style={[styles.cardValue, { color: netTally >= 0 ? '#16A34A' : '#DC3545' }]}>
          {netTally < 0 ? '-' : ''}{formatINR(netTally)}
        </Text>
        <Text style={styles.cardSubtitle}>
          {netTally >= 0 ? 'Income above expenses' : 'Expenses above income'}
        </Text>
      </TouchableOpacity>

      {/* Pending Fee Collections Card */}
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: '#D97706' }]}
        activeOpacity={0.8}
        onPress={() => onSelectTab?.('dues')}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#D97706" />
          </View>
          <Text style={styles.cardTag}>Pending Dues</Text>
        </View>
        <Text style={styles.cardValue}>{formatINR(pendingTotal)}</Text>
        <Text style={styles.cardSubtitle}>Tap to Collect</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  card: {
    width: Platform.OS === 'web' ? '23.5%' : '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    elevation: 1,
    minWidth: 140,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B6B6B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#171717',
    marginVertical: 2,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
  },
});
