import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export default function TabHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tab Home</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' },
  text: { fontSize: 18, color: '#1E3A5F' },
});
