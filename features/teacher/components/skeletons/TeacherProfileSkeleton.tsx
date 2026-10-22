import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Profile Top Card */}
      <View style={styles.headerCard}>
        <TeacherShimmerSkeleton width={76} height={76} borderRadius={38} />
        <TeacherShimmerSkeleton width={150} height={18} borderRadius={5} style={{ marginTop: 10 }} />
        <TeacherShimmerSkeleton width={100} height={12} borderRadius={5} style={{ marginTop: 4 }} />
        <TeacherShimmerSkeleton width={80} height={22} borderRadius={5} style={{ marginTop: 8 }} />
      </View>

      {/* 2. Personal Information Card */}
      <View style={styles.infoCard}>
        <TeacherShimmerSkeleton width={120} height={16} borderRadius={5} />
        <View style={styles.divider} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.fieldRow}>
            <TeacherShimmerSkeleton width={90} height={12} borderRadius={5} />
            <TeacherShimmerSkeleton width={130} height={14} borderRadius={5} />
          </View>
        ))}
      </View>

      {/* 3. Class Assignments Card */}
      <View style={styles.infoCard}>
        <TeacherShimmerSkeleton width={130} height={16} borderRadius={5} />
        <View style={styles.divider} />
        <View style={styles.chipsRow}>
          <TeacherShimmerSkeleton width={80} height={30} borderRadius={5} />
          <TeacherShimmerSkeleton width={80} height={30} borderRadius={5} />
          <TeacherShimmerSkeleton width={80} height={30} borderRadius={5} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 20,
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 16,
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
