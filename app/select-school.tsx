import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectSchoolScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Select School</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' },
  text: { fontSize: 18, color: '#1E3A5F' },
});
