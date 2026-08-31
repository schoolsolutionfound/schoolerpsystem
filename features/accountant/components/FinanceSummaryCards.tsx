import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';
import { useFinanceStore } from '../store/useFinanceStore';

export const FinanceSummaryCards: React.FC = () => {
  const getTotalIncome = useFinanceStore((s) => s.getTotalIncome);
  const getTotalExpenses = useFinanceStore((s) => s.getTotalExpenses);
  const getNetTally = useFinanceStore((s) => s.getNetTally);
  const getPendingIncomeTotal = useFinanceStore((s) => s.getPendingIncomeTotal);

  const totalIncome = getTotalIncome();
  const totalExpense = getTotalExpenses();
  const netTally = getNetTally();
  const pendingTotal = getPendingIncomeTotal();

  const formatCurrency = (val: number) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  return (
    <View style={styles.gridContainer}>
      {/* Total Income Card */}
      <View style={[styles.card, { borderLeftColor: '#16A34A' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="trending-up" size={22} color="#16A34A" />
          </View>
          <Text style={styles.cardTag}>Income</Text>
        </View>
        <Text style={styles.cardValue}>{formatCurrency(totalIncome)}</Text>
        <Text style={styles.cardSubtitle}>Fees, Transport & Rent</Text>
      </View>

      {/* Total Expense Card */}
      <View style={[styles.card, { borderLeftColor: '#DC3545' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="trending-down" size={22} color="#DC3545" />
          </View>
          <Text style={styles.cardTag}>Expenses</Text>
        </View>
        <Text style={styles.cardValue}>{formatCurrency(totalExpense)}</Text>
        <Text style={styles.cardSubtitle}>Salaries, Fleet & Ops</Text>
      </View>

      {/* Net Financial Tally Card */}
      <View style={[styles.card, { borderLeftColor: '#7E57C2' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}>
            <MaterialCommunityIcons name="scale-balance" size={22} color="#7E57C2" />
          </View>
          <Text style={styles.cardTag}>Net Tally</Text>
        </View>
        <Text style={[styles.cardValue, { color: netTally >= 0 ? '#16A34A' : '#DC3545' }]}>
          {formatCurrency(netTally)}
        </Text>
        <Text style={styles.cardSubtitle}>
          {netTally >= 0 ? 'Surplus Balance' : 'Net Deficit'}
        </Text>
      </View>

      {/* Pending Fee Collections Card */}
      <View style={[styles.card, { borderLeftColor: '#D97706' }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#D97706" />
          </View>
          <Text style={styles.cardTag}>Pending Fees</Text>
        </View>
        <Text style={styles.cardValue}>{formatCurrency(pendingTotal)}</Text>
        <Text style={styles.cardSubtitle}>Receivables Outstanding</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  card: {
    width: Platform.OS === 'web' ? '23.5%' : '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    minWidth: 150,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A202C',
    marginVertical: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
});
