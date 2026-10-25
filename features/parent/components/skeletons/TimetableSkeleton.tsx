import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const TimetableSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Title Section Skeleton */}
      <View style={styles.titleSection}>
        <View style={{ gap: 6 }}>
          <ShimmerSkeleton width={160} height={24} borderRadius={5} />
          <ShimmerSkeleton width={70} height={14} borderRadius={5} />
        </View>
        <ShimmerSkeleton width={95} height={32} borderRadius={5} />
      </View>

      {/* Week Days Strip Skeleton */}
      <View style={styles.weekStripCard}>
        <ShimmerSkeleton width={38} height={38} borderRadius={19} />
        <View style={styles.daysRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.dayItem}>
              <ShimmerSkeleton width={26} height={12} borderRadius={5} />
              <ShimmerSkeleton width={20} height={16} borderRadius={5} />
            </View>
          ))}
        </View>
        <ShimmerSkeleton width={38} height={38} borderRadius={19} />
      </View>

      {/* View Switcher Toggle Skeleton */}
      <View style={styles.viewToggleRow}>
        <ShimmerSkeleton width="48%" height={40} borderRadius={5} />
        <ShimmerSkeleton width="48%" height={40} borderRadius={5} />
      </View>

      {/* Date Header Skeleton */}
      <View style={{ gap: 6, marginTop: 4 }}>
        <ShimmerSkeleton width={180} height={18} borderRadius={5} />
        <ShimmerSkeleton width={60} height={13} borderRadius={5} />
      </View>

      {/* Timetable Table Card Skeleton */}
      <View style={styles.tableCard}>
        <View style={styles.tableHeaderRow}>
          <View style={{ flex: 1.1, alignItems: 'center' }}>
            <ShimmerSkeleton width={50} height={14} borderRadius={5} />
          </View>
          <View style={styles.tableColDivider} />
          <View style={{ flex: 1.7, alignItems: 'center' }}>
            <ShimmerSkeleton width={80} height={14} borderRadius={5} />
          </View>
          <View style={styles.tableColDivider} />
          <View style={{ flex: 1.4, alignItems: 'center' }}>
            <ShimmerSkeleton width={60} height={14} borderRadius={5} />
          </View>
        </View>

        <View style={styles.tableBody}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={[styles.tableDataRow, i === 5 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1.1, alignItems: 'center', paddingVertical: 12 }}>
                <ShimmerSkeleton width={50} height={14} borderRadius={5} />
              </View>
              <View style={styles.tableColDivider} />
              <View style={{ flex: 1.7, alignItems: 'center', paddingVertical: 12 }}>
                <ShimmerSkeleton width={110} height={14} borderRadius={5} />
              </View>
              <View style={styles.tableColDivider} />
              <View style={{ flex: 1.4, alignItems: 'center', paddingVertical: 12 }}>
                <ShimmerSkeleton width={70} height={14} borderRadius={5} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 14,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  weekStripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDF6',
    borderWidth: 1,
    borderColor: '#EFE7D8',
    borderRadius: 5,
    padding: 10,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    flex: 1,
    paddingHorizontal: 4,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 4,
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#EFE7D8',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF8E7',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7D8',
  },
  tableBody: {
    backgroundColor: '#FFFFFF',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFE8',
  },
  tableColDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: '#EFE7D8',
  },
});
