import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { UnifiedHeader } from '../../features/shared/components/layout/UnifiedHeader';
import { FloatingFooter } from '../../features/shared/components/layout/FloatingFooter';
import { useDebugTab } from '../../features/shared/hooks/useDebugTab';
import { AccountantDrawer } from '../../features/accountant/components/AccountantDrawer';
import { AccountantHomeOverview } from '../../features/accountant/components/AccountantHomeOverview';
import { StudentFeesView } from '../../features/accountant/components/StudentFeesView';
import { PendingDuesView } from '../../features/accountant/components/PendingDuesView';
import { IncomeManagementView } from '../../features/accountant/components/IncomeManagementView';
import { AccountsTallyView } from '../../features/accountant/components/AccountsTallyView';
import { ExpenseManagementView } from '../../features/accountant/components/ExpenseManagementView';
import { OnlinePaymentsView } from '../../features/accountant/components/OnlinePaymentsView';
import { useFinanceStore } from '../../features/accountant/store/useFinanceStore';
import { UserAnnouncementFeedView } from '../../features/announcements';
import { FontFamily } from '../../constants/fonts';

type FinanceTab = 'overview' | 'fees' | 'dues' | 'income' | 'payments' | 'expenses' | 'accounts' | 'announcements';

const TAB_VALUES: FinanceTab[] = [
  'overview',
  'fees',
  'dues',
  'income',
  'payments',
  'expenses',
  'accounts',
  'announcements',
];

const BOTTOM_TABS: { key: FinanceTab; label: string; icon: string; iconFilled: string }[] = [
  { key: 'overview', label: 'Home', icon: 'view-dashboard-outline', iconFilled: 'view-dashboard' },
  { key: 'expenses', label: 'Expenses', icon: 'cash-minus', iconFilled: 'cash-minus' },
  { key: 'income', label: 'Income', icon: 'cash-plus', iconFilled: 'cash-plus' },
  { key: 'fees', label: 'Fees', icon: 'school-outline', iconFilled: 'school' },
  { key: 'accounts', label: 'Accounts', icon: 'calculator-variant-outline', iconFilled: 'calculator-variant' },
];

export default function AccountantHomeScreen() {
  const router = useRouter();
  const fullName = useUserStore((state) => state.fullName) || 'Accountant';
  const email = useUserStore((state) => state.email) || '';
  const profilePic = useUserStore((state) => state.profilePic);
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const params = useLocalSearchParams<{ tab?: string }>();
  const paramTab = String(params.tab ?? '') as FinanceTab;
  const [activeTab, setActiveTab] = useState<FinanceTab>(
    TAB_VALUES.includes(paramTab) ? paramTab : 'overview',
  );
  useDebugTab('accountant', activeTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadFees = useFinanceStore((s) => s.loadFees);
  const bumpRefresh = useFinanceStore((s) => s.bumpRefresh);
  const loading = useFinanceStore((s) => s.loading);
  const error = useFinanceStore((s) => s.error);

  useEffect(() => {
    loadFees();
  }, [loadFees]);

  const handlePullRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadFees();
      bumpRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [loadFees, bumpRefresh]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AccountantHomeOverview onNavigateTab={setActiveTab} userName={fullName} />;
      case 'fees':
        return <StudentFeesView />;
      case 'dues':
        return <PendingDuesView />;
      case 'income':
        return <IncomeManagementView />;
      case 'payments':
        return <OnlinePaymentsView />;
      case 'expenses':
        return <ExpenseManagementView />;
      case 'accounts':
        return <AccountsTallyView />;
      case 'announcements':
        return <UserAnnouncementFeedView />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <UnifiedHeader
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
        />

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handlePullRefresh}
              tintColor="#171717"
              colors={['#F4C430']}
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {error ? (
            <View style={styles.errorBanner}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC3545" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {loading && !useFinanceStore.getState().loaded ? (
            <Text style={styles.loadingText}>Loading fee data…</Text>
          ) : null}

          {renderTabContent()}
        </ScrollView>

        <FloatingFooter
          tabs={BOTTOM_TABS}
          activeKey={activeTab}
          onTabPress={setActiveTab}
        />
      </SafeAreaView>

      <AccountantDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSwitchTab={(tab: string) => setActiveTab(tab as FinanceTab)}
        fullName={fullName}
        email={email}
        profilePic={profilePic}
        institutionName={institutionName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  safe: { flex: 1 },
  contentScroll: { flex: 1 },
  content: { paddingBottom: 16 },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FEE2E2',
  },
  errorText: { fontSize: 12, color: '#991B1B', flex: 1 },
  loadingText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 8,
    fontFamily: FontFamily.regular,
  },

  // ── Floating Bottom Tab Bar (Librarian-portal mirror) ─────────────────────
  tabBarBg: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 4,
    paddingBottom: 6,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 16,
    width: '94%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 54,
  },
  tabIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
});
