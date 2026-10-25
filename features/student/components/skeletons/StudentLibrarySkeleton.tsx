import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerSkeleton } from '../ShimmerSkeleton';

export const StudentLibrarySkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* 1. Header Switcher */}
      <View style={styles.tabRow}>
        <ShimmerSkeleton width="48%" height={36} borderRadius={5} />
        <ShimmerSkeleton width="48%" height={36} borderRadius={5} />
      </View>

      <ShimmerSkeleton width="100%" height={38} borderRadius={5} />

      {/* 2. Book Cards */}
      <View style={styles.booksList}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.bookCard}>
            <View style={styles.bookRow}>
              <ShimmerSkeleton width={50} height={70} borderRadius={5} />
              <View style={styles.bookInfo}>
                <ShimmerSkeleton width="80%" height={15} borderRadius={5} />
                <ShimmerSkeleton width="55%" height={12} borderRadius={5} style={{ marginTop: 4 }} />
                <ShimmerSkeleton width="40%" height={11} borderRadius={5} style={{ marginTop: 4 }} />
                <View style={styles.bookMetaRow}>
                  <ShimmerSkeleton width={80} height={18} borderRadius={5} />
                  <ShimmerSkeleton width={70} height={26} borderRadius={5} />
                </View>
              </View>
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
  booksList: {
    gap: 10,
  },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 12,
  },
  bookRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bookInfo: {
    flex: 1,
  },
  bookMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
});
