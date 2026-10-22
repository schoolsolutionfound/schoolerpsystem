import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherLeaveSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Leave Balances Skeleton */}
      <View style={styles.balRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.balCard}>
            <TeacherShimmerSkeleton width={48} height={12} borderRadius={5} />
            <TeacherShimmerSkeleton width={32} height={24} borderRadius={5} style={{ marginVertical: 4 }} />
            <TeacherShimmerSkeleton width={60} height={10} borderRadius={5} />
          </View>
        ))}
      </View>

      {/* 2. Metrics Grid */}
      <View style={styles.metricsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.metricItem}>
            <TeacherShimmerSkeleton width={28} height={18} borderRadius={5} />
            <TeacherShimmerSkeleton width={44} height={10} borderRadius={5} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* 3. Filter Tabs */}
      <View style={styles.tabsRow}>
        {[0, 1, 2, 3].map((i) => (
          <TeacherShimmerSkeleton key={i} width="22%" height={30} borderRadius={5} />
        ))}
      </View>

      {/* 4. Requests List */}
      <View style={styles.requestsList}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.requestCard}>
            <View style={styles.reqHeader}>
              <TeacherShimmerSkeleton width={110} height={15} borderRadius={5} />
              <TeacherShimmerSkeleton width={55} height={14} borderRadius={5} />
            </View>
            <TeacherShimmerSkeleton width="50%" height={14} borderRadius={5} style={{ marginTop: 6 }} />
            <TeacherShimmerSkeleton width="85%" height={12} borderRadius={5} style={{ marginTop: 4 }} />
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
  balRow: {
    flexDirection: 'row',
    gap: 8,
  },
  balCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingVertical: 10,
    justifyContent: 'space-around',
  },
  metricItem: {
    alignItems: 'center',
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  requestsList: {
    gap: 10,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 14,
  },
  reqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
