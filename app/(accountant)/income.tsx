import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { IncomeManagementView } from '../../features/accountant/components/IncomeManagementView';

export default function AccountantIncomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <IncomeManagementView />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FB' },
});
