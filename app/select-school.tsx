import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SelectSchoolScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Select School</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFDF7' },
  text: { fontSize: 18, color: '#171717' },
});
