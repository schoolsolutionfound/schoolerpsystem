import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { IncomeExpenseTallyView } from '../../features/accountant/components/IncomeExpenseTallyView';

export default function AccountantTallyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <IncomeExpenseTallyView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
});
