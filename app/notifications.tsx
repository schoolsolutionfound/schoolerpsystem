import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Notifications</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' },
  text: { fontSize: 18, color: '#1E3A5F' },
});
