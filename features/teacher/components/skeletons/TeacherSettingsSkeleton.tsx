import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherSettingsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Exam Types Card Skeleton */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TeacherShimmerSkeleton width={110} height={16} borderRadius={5} />
          <TeacherShimmerSkeleton width={70} height={26} borderRadius={5} />
        </View>
        <TeacherShimmerSkeleton width="80%" height={12} borderRadius={5} />
        <View style={styles.chipsRow}>
          <TeacherShimmerSkeleton width={90} height={28} borderRadius={5} />
          <TeacherShimmerSkeleton width={80} height={28} borderRadius={5} />
          <TeacherShimmerSkeleton width={100} height={28} borderRadius={5} />
        </View>
      </View>

      {/* 2. List Type Card Skeleton */}
      <View style={styles.card}>
        <TeacherShimmerSkeleton width={100} height={16} borderRadius={5} />
        <TeacherShimmerSkeleton width="75%" height={12} borderRadius={5} />
        {[0, 1].map((i) => (
          <View key={i} style={styles.toggleRow}>
            <View>
              <TeacherShimmerSkeleton width={90} height={14} borderRadius={5} />
              <TeacherShimmerSkeleton width={120} height={11} borderRadius={5} style={{ marginTop: 4 }} />
            </View>
            <TeacherShimmerSkeleton width={44} height={24} borderRadius={12} />
          </View>
        ))}
      </View>

      {/* 3. Passing Threshold Card Skeleton */}
      <View style={styles.card}>
        <TeacherShimmerSkeleton width={130} height={16} borderRadius={5} />
        <TeacherShimmerSkeleton width="85%" height={12} borderRadius={5} />
        <View style={styles.toggleBtnRow}>
          <TeacherShimmerSkeleton width="48%" height={32} borderRadius={5} />
          <TeacherShimmerSkeleton width="48%" height={32} borderRadius={5} />
        </View>
        <TeacherShimmerSkeleton width="100%" height={40} borderRadius={5} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  toggleBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});
