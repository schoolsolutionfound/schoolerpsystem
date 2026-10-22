import React from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { ShimmerProvider, ShimmerSkeleton } from '../../../student/components/ShimmerSkeleton';

// Re-export ShimmerProvider and ShimmerSkeleton for easy consumption
export { ShimmerProvider, ShimmerSkeleton };

// -------------------------------------------------------------
// 1. Dashboard Skeleton
// -------------------------------------------------------------
export const DashboardSkeleton: React.FC = () => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView
      style={[styles.container, isMobile && { padding: 12 }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={{ gap: 6, flex: 1 }}>
          <ShimmerSkeleton width={200} height={26} borderRadius={5} />
          <ShimmerSkeleton width={140} height={14} borderRadius={4} />
        </View>
        <ShimmerSkeleton width={120} height={32} borderRadius={5} />
      </View>

      {/* 4 Metric Cards */}
      <View style={styles.metricsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.metricCard, isMobile ? styles.metricCardHalf : styles.metricCardQuarter]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <ShimmerSkeleton width={80} height={13} borderRadius={4} />
              <ShimmerSkeleton width={28} height={28} borderRadius={5} />
            </View>
            <ShimmerSkeleton width={60} height={24} borderRadius={5} style={{ marginBottom: 6 }} />
            <ShimmerSkeleton width={100} height={11} borderRadius={4} />
          </View>
        ))}
      </View>

      {/* Circulation Tabs & Delayed / Issued List */}
      <View style={styles.cardBox}>
        <View style={styles.circHeaderRow}>
          <ShimmerSkeleton width={160} height={20} borderRadius={5} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <ShimmerSkeleton width={110} height={32} borderRadius={5} />
            <ShimmerSkeleton width={110} height={32} borderRadius={5} />
          </View>
        </View>

        <View style={{ gap: 10, marginTop: 12 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.circRowCard}>
              <ShimmerSkeleton width={44} height={44} borderRadius={5} />
              <View style={{ flex: 1, gap: 5 }}>
                <ShimmerSkeleton width="65%" height={14} borderRadius={4} />
                <ShimmerSkeleton width="45%" height={12} borderRadius={4} />
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <ShimmerSkeleton width={60} height={18} borderRadius={4} />
                <ShimmerSkeleton width={75} height={24} borderRadius={5} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Book Circulation & Quick Actions */}
      <View style={[styles.twoColRow, isMobile && styles.colStack]}>
        {/* Book Circulation Chart */}
        <View style={[styles.cardBox, { flex: 1 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <ShimmerSkeleton width={140} height={18} borderRadius={4} />
            <ShimmerSkeleton width={80} height={24} borderRadius={5} />
          </View>
          <View style={styles.chartBarRow}>
            {[45, 65, 30, 80, 50, 70, 40].map((h, i) => (
              <View key={i} style={{ alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 85 }}>
                  <ShimmerSkeleton width={12} height={h} borderRadius={3} />
                  <ShimmerSkeleton width={12} height={Math.max(15, h - 20)} borderRadius={3} />
                </View>
                <ShimmerSkeleton width={24} height={10} borderRadius={3} />
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 14 }}>
            <ShimmerSkeleton width={60} height={12} borderRadius={4} />
            <ShimmerSkeleton width={60} height={12} borderRadius={4} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.cardBox, { flex: 1 }]}>
          <ShimmerSkeleton width={120} height={18} borderRadius={4} style={{ marginBottom: 16 }} />
          <View style={{ gap: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <ShimmerSkeleton key={i} width="100%" height={38} borderRadius={5} />
            ))}
          </View>
        </View>
      </View>

      {/* Books by Category */}
      <View style={[styles.cardBox, { marginTop: 14 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
          <ShimmerSkeleton width={150} height={18} borderRadius={4} />
          <ShimmerSkeleton width={60} height={14} borderRadius={4} />
        </View>
        <View style={{ alignItems: 'center', marginVertical: 12 }}>
          <ShimmerSkeleton width={90} height={90} borderRadius={45} />
        </View>
        <View style={styles.catGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.catGridItem}>
              <ShimmerSkeleton width={10} height={10} borderRadius={5} />
              <ShimmerSkeleton width={80} height={12} borderRadius={4} />
              <ShimmerSkeleton width={30} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>

      {/* Today's Reminders */}
      <View style={{ marginTop: 20, gap: 10 }}>
        <ShimmerSkeleton width={160} height={18} borderRadius={4} />
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.reminderCard}>
            <ShimmerSkeleton width="75%" height={13} borderRadius={4} />
            <ShimmerSkeleton width={70} height={14} borderRadius={4} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 2. Books View Skeleton
// -------------------------------------------------------------
export const BooksSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <ShimmerSkeleton width={140} height={24} borderRadius={5} />
        <ShimmerSkeleton width={110} height={36} borderRadius={5} />
      </View>

      {/* Search Bar */}
      <ShimmerSkeleton width="100%" height={44} borderRadius={5} style={{ marginBottom: 12 }} />

      {/* Category Pills */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[70, 95, 80, 110, 85].map((w, i) => (
          <ShimmerSkeleton key={i} width={w} height={32} borderRadius={5} />
        ))}
      </View>

      {/* Books List */}
      <View style={{ gap: 10 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.bookRowCard}>
            <ShimmerSkeleton width={48} height={64} borderRadius={5} />
            <View style={{ flex: 1, gap: 6 }}>
              <ShimmerSkeleton width="70%" height={15} borderRadius={4} />
              <ShimmerSkeleton width="40%" height={12} borderRadius={4} />
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <ShimmerSkeleton width={60} height={18} borderRadius={4} />
                <ShimmerSkeleton width={70} height={18} borderRadius={4} />
              </View>
            </View>
            <ShimmerSkeleton width={20} height={20} borderRadius={5} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 3. Book Detail Skeleton
// -------------------------------------------------------------
export const BookDetailSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <ShimmerSkeleton width={36} height={36} borderRadius={5} />
        <ShimmerSkeleton width={180} height={20} borderRadius={4} />
      </View>

      <View style={styles.cardBox}>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <ShimmerSkeleton width={90} height={120} borderRadius={5} />
          <View style={{ flex: 1, gap: 8 }}>
            <ShimmerSkeleton width="85%" height={18} borderRadius={4} />
            <ShimmerSkeleton width="50%" height={14} borderRadius={4} />
            <ShimmerSkeleton width="40%" height={12} borderRadius={4} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <ShimmerSkeleton width={80} height={24} borderRadius={5} />
              <ShimmerSkeleton width={80} height={24} borderRadius={5} />
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.cardBox, { marginTop: 14 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <ShimmerSkeleton width={130} height={18} borderRadius={4} />
          <ShimmerSkeleton width={90} height={30} borderRadius={5} />
        </View>
        <View style={{ gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <ShimmerSkeleton key={i} width="100%" height={40} borderRadius={5} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 4. Circulation / Issue Book Skeleton
// -------------------------------------------------------------
export const CirculationSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Sub-mode Tab Bar */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[100, 120, 100, 110].map((w, i) => (
          <ShimmerSkeleton key={i} width={w} height={36} borderRadius={5} />
        ))}
      </View>

      {/* Main Circulation Form / Search Card */}
      <View style={styles.cardBox}>
        <ShimmerSkeleton width={160} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={{ gap: 12 }}>
          <ShimmerSkeleton width="100%" height={44} borderRadius={5} />
          <ShimmerSkeleton width="100%" height={44} borderRadius={5} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <ShimmerSkeleton width="48%" height={44} borderRadius={5} />
            <ShimmerSkeleton width="48%" height={44} borderRadius={5} />
          </View>
          <ShimmerSkeleton width="100%" height={42} borderRadius={5} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* Recent / Active Loans Table */}
      <View style={[styles.cardBox, { marginTop: 14 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
          <ShimmerSkeleton width={140} height={18} borderRadius={4} />
          <ShimmerSkeleton width={70} height={14} borderRadius={4} />
        </View>
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.circRowCard}>
              <ShimmerSkeleton width={40} height={40} borderRadius={20} />
              <View style={{ flex: 1, gap: 5 }}>
                <ShimmerSkeleton width="60%" height={14} borderRadius={4} />
                <ShimmerSkeleton width="40%" height={12} borderRadius={4} />
              </View>
              <ShimmerSkeleton width={80} height={28} borderRadius={5} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 5. Fines Skeleton
// -------------------------------------------------------------
export const FinesSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <ShimmerSkeleton width={160} height={24} borderRadius={5} />
        <ShimmerSkeleton width={110} height={36} borderRadius={5} />
      </View>

      {/* 3 Metrics Cards */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.cardBox, { flex: 1, padding: 12 }]}>
            <ShimmerSkeleton width="70%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <ShimmerSkeleton width="50%" height={20} borderRadius={5} />
          </View>
        ))}
      </View>

      {/* Segmented Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        <ShimmerSkeleton width={130} height={36} borderRadius={5} />
        <ShimmerSkeleton width={130} height={36} borderRadius={5} />
      </View>

      {/* Fines Records List */}
      <View style={{ gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.circRowCard}>
            <View style={{ flex: 1, gap: 5 }}>
              <ShimmerSkeleton width="55%" height={14} borderRadius={4} />
              <ShimmerSkeleton width="75%" height={12} borderRadius={4} />
              <ShimmerSkeleton width="30%" height={11} borderRadius={4} />
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <ShimmerSkeleton width={60} height={18} borderRadius={4} />
              <ShimmerSkeleton width={75} height={28} borderRadius={5} />
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 6. Members Directory Skeleton
// -------------------------------------------------------------
export const MembersSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <ShimmerSkeleton width={180} height={24} borderRadius={5} />
        <ShimmerSkeleton width={90} height={36} borderRadius={5} />
      </View>

      {/* Search Bar */}
      <ShimmerSkeleton width="100%" height={44} borderRadius={5} style={{ marginBottom: 14 }} />

      {/* Member Cards */}
      <View style={{ gap: 10 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.circRowCard}>
            <ShimmerSkeleton width={44} height={44} borderRadius={22} />
            <View style={{ flex: 1, gap: 5 }}>
              <ShimmerSkeleton width="60%" height={14} borderRadius={4} />
              <ShimmerSkeleton width="40%" height={12} borderRadius={4} />
              <ShimmerSkeleton width="30%" height={11} borderRadius={4} />
            </View>
            <ShimmerSkeleton width={75} height={28} borderRadius={5} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 7. Reports & Analytics Skeleton
// -------------------------------------------------------------
export const ReportsSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <ShimmerSkeleton width={190} height={24} borderRadius={5} />
        <ShimmerSkeleton width={140} height={36} borderRadius={5} />
      </View>

      {/* Time Range Filter Pills */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
        {[100, 110, 115, 80].map((w, i) => (
          <ShimmerSkeleton key={i} width={w} height={34} borderRadius={5} />
        ))}
      </View>

      {/* Metric Cards Row */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.cardBox, { flex: 1, padding: 12 }]}>
            <ShimmerSkeleton width="70%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
            <ShimmerSkeleton width="45%" height={22} borderRadius={5} />
          </View>
        ))}
      </View>

      {/* Frequently Borrowed Books Skeleton Table */}
      <View style={styles.cardBox}>
        <ShimmerSkeleton width={180} height={18} borderRadius={4} style={{ marginBottom: 14 }} />
        <View style={{ gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F3F4F6' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <ShimmerSkeleton width="65%" height={14} borderRadius={4} />
                <ShimmerSkeleton width="40%" height={12} borderRadius={4} />
              </View>
              <ShimmerSkeleton width={50} height={20} borderRadius={5} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 8. Settings Skeleton
// -------------------------------------------------------------
export const SettingsSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <ShimmerSkeleton width={160} height={24} borderRadius={5} />
        <ShimmerSkeleton width={120} height={36} borderRadius={5} />
      </View>

      {/* 3 Setting Section Cards */}
      {[0, 1, 2].map((sec) => (
        <View key={sec} style={[styles.cardBox, { marginBottom: 14 }]}>
          <ShimmerSkeleton width={180} height={18} borderRadius={4} style={{ marginBottom: 14 }} />
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 4, flex: 1 }}>
                <ShimmerSkeleton width={140} height={14} borderRadius={4} />
                <ShimmerSkeleton width={200} height={11} borderRadius={4} />
              </View>
              <ShimmerSkeleton width={80} height={36} borderRadius={5} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ gap: 4, flex: 1 }}>
                <ShimmerSkeleton width={130} height={14} borderRadius={4} />
                <ShimmerSkeleton width={180} height={11} borderRadius={4} />
              </View>
              <ShimmerSkeleton width={80} height={36} borderRadius={5} />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 9. PYQs Skeleton
// -------------------------------------------------------------
export const PYQsSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerRow}>
        <ShimmerSkeleton width={190} height={24} borderRadius={5} />
        <ShimmerSkeleton width={120} height={36} borderRadius={5} />
      </View>

      {/* Search Bar */}
      <ShimmerSkeleton width="100%" height={44} borderRadius={5} style={{ marginBottom: 12 }} />

      {/* Filter Chips */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[80, 90, 85, 95].map((w, i) => (
          <ShimmerSkeleton key={i} width={w} height={32} borderRadius={5} />
        ))}
      </View>

      {/* PYQ Cards */}
      <View style={{ gap: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.circRowCard}>
            <ShimmerSkeleton width={42} height={42} borderRadius={5} />
            <View style={{ flex: 1, gap: 5 }}>
              <ShimmerSkeleton width="70%" height={14} borderRadius={4} />
              <ShimmerSkeleton width="45%" height={12} borderRadius={4} />
            </View>
            <ShimmerSkeleton width={75} height={30} borderRadius={5} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 10. Notifications Skeleton
// -------------------------------------------------------------
export const NotificationsSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <ShimmerSkeleton width={150} height={24} borderRadius={5} />
        <ShimmerSkeleton width={110} height={30} borderRadius={5} />
      </View>

      <View style={{ gap: 10, marginTop: 10 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.circRowCard}>
            <ShimmerSkeleton width={38} height={38} borderRadius={19} />
            <View style={{ flex: 1, gap: 6 }}>
              <ShimmerSkeleton width="80%" height={14} borderRadius={4} />
              <ShimmerSkeleton width="95%" height={12} borderRadius={4} />
              <ShimmerSkeleton width="30%" height={10} borderRadius={3} />
            </View>
            <ShimmerSkeleton width={70} height={26} borderRadius={5} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 11. Profile Skeleton
// -------------------------------------------------------------
export const ProfileSkeleton: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      <View style={[styles.cardBox, { alignItems: 'center', paddingVertical: 24, marginBottom: 14 }]}>
        <ShimmerSkeleton width={76} height={76} borderRadius={38} style={{ marginBottom: 12 }} />
        <ShimmerSkeleton width={160} height={18} borderRadius={4} style={{ marginBottom: 6 }} />
        <ShimmerSkeleton width={110} height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        <ShimmerSkeleton width={90} height={22} borderRadius={5} />
      </View>

      <View style={styles.cardBox}>
        <ShimmerSkeleton width={130} height={16} borderRadius={4} style={{ marginBottom: 14 }} />
        <View style={{ gap: 12 }}>
          <ShimmerSkeleton width="100%" height={40} borderRadius={5} />
          <ShimmerSkeleton width="100%" height={40} borderRadius={5} />
          <ShimmerSkeleton width="100%" height={40} borderRadius={5} />
        </View>
      </View>
    </ScrollView>
  );
};

// -------------------------------------------------------------
// 12. Master LibraryPageSkeleton Dispatcher
// -------------------------------------------------------------
export interface LibraryPageSkeletonProps {
  tab: string;
  isBookDetail?: boolean;
}

export const LibraryPageSkeleton: React.FC<LibraryPageSkeletonProps> = ({ tab, isBookDetail = false }) => {
  const renderContent = () => {
    switch (tab) {
      case 'dashboard':
        return <DashboardSkeleton />;
      case 'books':
        return isBookDetail ? <BookDetailSkeleton /> : <BooksSkeleton />;
      case 'issue':
        return <CirculationSkeleton />;
      case 'fines':
        return <FinesSkeleton />;
      case 'students':
        return <MembersSkeleton />;
      case 'reports':
        return <ReportsSkeleton />;
      case 'settings':
        return <SettingsSkeleton />;
      case 'pyqs':
        return <PYQsSkeleton />;
      case 'notifications':
        return <NotificationsSkeleton />;
      case 'profile':
        return <ProfileSkeleton />;
      default:
        return <DashboardSkeleton />;
    }
  };

  return <ShimmerProvider>{renderContent()}</ShimmerProvider>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFEFE',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  metricCardQuarter: {
    flex: 1,
    minWidth: 140,
  },
  metricCardHalf: {
    width: '48%',
    flexGrow: 1,
  },
  cardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    marginBottom: 14,
  },
  circHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  circRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 14,
  },
  colStack: {
    flexDirection: 'column',
  },
  chartBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: 10,
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  catGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '45%',
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
