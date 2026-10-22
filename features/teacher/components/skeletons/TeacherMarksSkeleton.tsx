import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherMarksSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Selector Chips Row */}
      <View style={styles.selectorRow}>
        <TeacherShimmerSkeleton width={90} height={32} borderRadius={5} />
        <TeacherShimmerSkeleton width={90} height={32} borderRadius={5} />
        <TeacherShimmerSkeleton width={110} height={32} borderRadius={5} />
      </View>

      {/* 2. Stats Summary Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <TeacherShimmerSkeleton width={40} height={20} borderRadius={5} />
          <TeacherShimmerSkeleton width={50} height={10} borderRadius={5} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statItem}>
          <TeacherShimmerSkeleton width={40} height={20} borderRadius={5} />
          <TeacherShimmerSkeleton width={50} height={10} borderRadius={5} style={{ marginTop: 4 }} />
        </View>
        <View style={styles.statItem}>
          <TeacherShimmerSkeleton width={40} height={20} borderRadius={5} />
          <TeacherShimmerSkeleton width={50} height={10} borderRadius={5} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* 3. Student Marks List */}
      <View style={styles.listCard}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.studentRow}>
            <TeacherShimmerSkeleton width={32} height={32} borderRadius={16} />
            <View style={styles.studentInfo}>
              <TeacherShimmerSkeleton width="60%" height={14} borderRadius={5} />
              <TeacherShimmerSkeleton width="40%" height={10} borderRadius={5} style={{ marginTop: 4 }} />
            </View>
            <TeacherShimmerSkeleton width={56} height={32} borderRadius={5} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    gap: 12,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  studentInfo: {
    flex: 1,
  },
});
