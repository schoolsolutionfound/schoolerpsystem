import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherReportsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Tab Bar & Search */}
      <View style={styles.tabRow}>
        <TeacherShimmerSkeleton width="48%" height={36} borderRadius={5} />
        <TeacherShimmerSkeleton width="48%" height={36} borderRadius={5} />
      </View>

      <TeacherShimmerSkeleton width="100%" height={40} borderRadius={5} style={{ marginVertical: 4 }} />

      {/* 2. Class Cards Grid */}
      <View style={styles.classesList}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.classCard}>
            <View style={styles.cardHeader}>
              <View>
                <TeacherShimmerSkeleton width={80} height={16} borderRadius={5} />
                <TeacherShimmerSkeleton width={60} height={12} borderRadius={5} style={{ marginTop: 4 }} />
              </View>
              <TeacherShimmerSkeleton width={32} height={32} borderRadius={16} />
            </View>

            <View style={styles.cardFooter}>
              <TeacherShimmerSkeleton width={90} height={12} borderRadius={5} />
              <TeacherShimmerSkeleton width={70} height={12} borderRadius={5} />
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
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  classesList: {
    gap: 12,
  },
  classCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 14,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
});
