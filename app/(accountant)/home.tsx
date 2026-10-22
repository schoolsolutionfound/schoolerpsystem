import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserStore } from '../../store/useUserStore';
import { AccountantHeader } from '../../features/accountant/components/AccountantHeader';
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
        return <AccountantHomeOverview onNavigateTab={setActiveTab} />;
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
        <AccountantHeader
          fullName={fullName}
          profilePic={profilePic}
          showGreeting={activeTab === 'overview'}
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push('/(accountant)/profile')}
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

        {/* Bottom Tab Bar (mirrors student portal) */}
        <View style={styles.tabBarBg}>
          <View style={styles.tabBar}>
            {BOTTOM_TABS.map((tab) => {
              const isCenter = tab.key === 'income';
              const isActive = activeTab === tab.key;

              if (isCenter) {
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.centerBtnWrap}
                    onPress={() => setActiveTab(tab.key)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.centerBtnRing, isActive && styles.centerBtnRingActive]}>
                      <View style={[styles.centerBtn, isActive && styles.centerBtnActive]}>
                        <MaterialCommunityIcons
                          name={tab.iconFilled as any}
                          size={26}
                          color={isActive ? '#F4C430' : '#E8E5DC'}
                        />
                      </View>
                    </View>
                    <Text style={[styles.centerLabel, isActive && styles.centerLabelActive]}>{tab.label}</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconBg, isActive && styles.tabIconBgActive]}>
                    <MaterialCommunityIcons
                      name={isActive ? (tab.iconFilled as any) : (tab.icon as any)}
                      size={22}
                      color={isActive ? '#171717' : '#9CA3AF'}
                    />
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
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
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  safe: { flex: 1 },
  contentScroll: { flex: 1 },
  content: { paddingBottom: 24 },

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

  // ── Bottom Tab Bar (student-portal mirror) ────────────────────────────────
  tabBarBg: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    marginHorizontal: 16,
    marginBottom: Platform.OS === 'ios' ? 16 : 8,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  tabIconBg: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#F4C430',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#171717',
    fontFamily: FontFamily.bold,
  },

  // Center floating button (Income)
  centerBtnWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    marginTop: -28,
  },
  centerBtnRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: '#E8E5DC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  centerBtnRingActive: {
    borderColor: '#F4C430',
    shadowColor: '#F4C430',
    shadowOpacity: 0.35,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBtnActive: {
    backgroundColor: '#171717',
  },
  centerLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 5,
  },
  centerLabelActive: {
    color: '#F4C430',
    fontFamily: FontFamily.bold,
  },
});
