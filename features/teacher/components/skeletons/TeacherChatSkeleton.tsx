import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TeacherShimmerSkeleton } from '../common/TeacherShimmer';

export const TeacherChatSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <TeacherShimmerSkeleton width="100%" height={38} borderRadius={5} />

      <View style={styles.chatList}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.chatItem}>
            <TeacherShimmerSkeleton width={44} height={44} borderRadius={22} />
            <View style={styles.chatInfo}>
              <View style={styles.nameRow}>
                <TeacherShimmerSkeleton width={110} height={15} borderRadius={5} />
                <TeacherShimmerSkeleton width={50} height={11} borderRadius={5} />
              </View>
              <TeacherShimmerSkeleton width={80} height={12} borderRadius={5} style={{ marginTop: 4 }} />
              <TeacherShimmerSkeleton width="90%" height={12} borderRadius={5} style={{ marginTop: 4 }} />
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
  chatList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    padding: 10,
    gap: 14,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
