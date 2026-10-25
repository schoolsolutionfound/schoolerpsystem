import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ShimmerProvider } from './ShimmerSkeleton';
import { ParentHomeAttendanceCard } from './ParentHomeAttendanceCard';
import { ParentHomeAnnouncements } from './ParentHomeAnnouncements';
import { ParentHomePeriodsList } from './ParentHomePeriodsList';

export interface ParentHomeDashboardProps {
  loading?: boolean;
  overallAttendance?: { present: number; total: number; percentage: number } | null;
  currentSlot?: any;
  todaySlots?: any[];
  childName?: string;
  onSchedulePress?: () => void;
  onAnnouncementsPress?: () => void;
  onTabSwitch?: (tab: string) => void;
  onViewProfile?: () => void;
}

export const ParentHomeDashboard: React.FC<ParentHomeDashboardProps> = ({
  loading,
  overallAttendance,
  currentSlot,
  todaySlots = [],
  childName,
  onSchedulePress,
  onAnnouncementsPress,
  onTabSwitch,
}) => {
  return (
    <ShimmerProvider>
      <View style={styles.container}>
        <ParentHomeAttendanceCard
          loading={loading}
          overall={overallAttendance}
          currentSlot={currentSlot}
          childName={childName}
        />
        <ParentHomeAnnouncements
          onPress={onAnnouncementsPress || (() => onTabSwitch?.('announcements'))}
        />
        <ParentHomePeriodsList
          loading={loading}
          slots={todaySlots}
          onSchedulePress={onSchedulePress || (() => onTabSwitch?.('schedule'))}
        />
      </View>
    </ShimmerProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
});

export default ParentHomeDashboard;
