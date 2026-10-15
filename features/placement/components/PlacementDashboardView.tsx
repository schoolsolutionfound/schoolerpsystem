import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../../constants/fonts';
import { EmptyState } from '../../shared/components/EmptyState';

export function PlacementDashboardView() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>
      <View style={styles.content}>
        <EmptyState 
          iconName="chart-bar" 
          title="Coming Soon" 
          description="Placement statistics and charts will appear here." 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 24, fontFamily: FontFamily.bold, color: '#111827' },
  content: { flex: 1, padding: 16 }
});
