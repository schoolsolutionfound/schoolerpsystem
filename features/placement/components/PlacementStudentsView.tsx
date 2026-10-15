import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontFamily } from '../../../constants/fonts';
import { EmptyState } from '../../shared/components/EmptyState';

export function PlacementStudentsView() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Students Directory</Text>
      </View>
      <View style={styles.content}>
        <EmptyState 
          iconName="account-group" 
          title="Student List" 
          description="View eligible students, their resumes, and CGPA." 
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
