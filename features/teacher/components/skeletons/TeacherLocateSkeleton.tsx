import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherLocateSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <TeacherShimmerSkeleton width="100%" height={38} borderRadius={5} />

      <View style={styles.chipsRow}>
        <TeacherShimmerSkeleton width={70} height={28} borderRadius={5} />
        <TeacherShimmerSkeleton width={80} height={28} borderRadius={5} />
        <TeacherShimmerSkeleton width={80} height={28} borderRadius={5} />
        <TeacherShimmerSkeleton width={70} height={28} borderRadius={5} />
      </View>

      <View style={styles.studentList}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.studentCard}>
            <View style={styles.cardRow}>
              <TeacherShimmerSkeleton width={40} height={40} borderRadius={20} />
              <View style={styles.meta}>
                <TeacherShimmerSkeleton width={120} height={15} borderRadius={5} />
                <TeacherShimmerSkeleton width={80} height={12} borderRadius={5} style={{ marginTop: 4 }} />
              </View>
              <TeacherShimmerSkeleton width={70} height={24} borderRadius={5} />
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
    gap: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  studentList: {
    gap: 10,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  meta: {
    flex: 1,
  },
});
