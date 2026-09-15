import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export function DeveloperPlansContent() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="rocket-launch-outline" size={36} color="#F4C430" />
        </View>
        <Text style={styles.title}>Subscription Engine Coming Soon</Text>
        <Text style={styles.description}>
          The subscription tiers, billing integration, and institution limits engine will be introduced in an upcoming dedicated sprint.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center', justifyContent: 'center', flex: 1 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.card, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#E8E5DC', maxWidth: 400, gap: 12 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF4C7', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#171717', textAlign: 'center' },
  description: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', lineHeight: 20 },
});
