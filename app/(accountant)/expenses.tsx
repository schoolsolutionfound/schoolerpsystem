import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { ExpenseManagementView } from '../../features/accountant/components/ExpenseManagementView';

export default function AccountantExpensesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ExpenseManagementView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
});
