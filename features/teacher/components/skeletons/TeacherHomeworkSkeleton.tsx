import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherHomeworkSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Header Filter Bar */}
      <View style={styles.filterRow}>
        <TeacherShimmerSkeleton width={110} height={34} borderRadius={5} />
        <TeacherShimmerSkeleton width={110} height={34} borderRadius={5} />
        <TeacherShimmerSkeleton width={80} height={34} borderRadius={5} />
      </View>

      {/* 2. Homework Cards List */}
      <View style={styles.cardList}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.hwCard}>
            <View style={styles.cardTop}>
              <TeacherShimmerSkeleton width={70} height={20} borderRadius={5} />
              <TeacherShimmerSkeleton width={80} height={16} borderRadius={5} />
            </View>

            <TeacherShimmerSkeleton width="85%" height={16} borderRadius={5} style={{ marginTop: 8 }} />
            <TeacherShimmerSkeleton width="100%" height={12} borderRadius={5} style={{ marginTop: 6 }} />
            <TeacherShimmerSkeleton width="60%" height={12} borderRadius={5} style={{ marginTop: 4 }} />

            <View style={styles.cardFooter}>
              <TeacherShimmerSkeleton width={100} height={14} borderRadius={5} />
              <TeacherShimmerSkeleton width={72} height={26} borderRadius={5} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 14,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cardList: {
    gap: 12,
  },
  hwCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 14,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
