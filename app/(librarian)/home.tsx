import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LibrarianHeader } from '../../features/librarian/components/LibrarianHeader';
import { LibraryOverviewView } from '../../features/librarian/components/LibraryOverviewView';
import { BookCatalogView } from '../../features/librarian/components/BookCatalogView';
import { BorrowingRegisterView } from '../../features/librarian/components/BorrowingRegisterView';
import { LibraryGatekeeperView } from '../../features/librarian/components/LibraryGatekeeperView';
import { LibraryFinesLedgerView } from '../../features/librarian/components/LibraryFinesLedgerView';
import { useLibraryStore } from '../../features/librarian/store/useLibraryStore';

type Tab = 'overview' | 'catalog' | 'loans' | 'gate' | 'fines';

export default function LibrarianHomeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const overdueCount = useLibraryStore((s) => s.getOverdueLoansCount());
  const pendingFines = useLibraryStore((s) => s.getPendingFinesTotal());

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* Librarian Top Header */}
        <LibrarianHeader />

        {/* Dynamic Tab Body */}
        <View style={styles.content}>
          {activeTab === 'overview' && (
            <LibraryOverviewView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'catalog' && <BookCatalogView />}
          {activeTab === 'loans' && <BorrowingRegisterView />}
          {activeTab === 'gate' && <LibraryGatekeeperView />}
          {activeTab === 'fines' && <LibraryFinesLedgerView />}
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'overview' ? 'view-dashboard' : 'view-dashboard-outline'}
              size={22}
              color={activeTab === 'overview' ? '#D97706' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'overview' && styles.tabLabelActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('catalog')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'catalog' ? 'bookshelf' : 'book-outline'}
              size={22}
              color={activeTab === 'catalog' ? '#D97706' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'catalog' && styles.tabLabelActive]}>
              Catalog
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('loans')}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconWrap}>
              <MaterialCommunityIcons
                name={activeTab === 'loans' ? 'book-arrow-right' : 'book-arrow-right-outline'}
                size={22}
                color={activeTab === 'loans' ? '#D97706' : '#94A3B8'}
              />
              {overdueCount > 0 && <View style={styles.tabBadgeDot} />}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'loans' && styles.tabLabelActive]}>
              Issue/Return
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('gate')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'gate' ? 'account-clock' : 'account-clock-outline'}
              size={22}
              color={activeTab === 'gate' ? '#D97706' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'gate' && styles.tabLabelActive]}>
              Gatekeeper
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('fines')}
            activeOpacity={0.7}
          >
            <View style={styles.tabIconWrap}>
              <MaterialCommunityIcons
                name={activeTab === 'fines' ? 'cash-multiple' : 'cash-remove'}
                size={22}
                color={activeTab === 'fines' ? '#D97706' : '#94A3B8'}
              />
              {pendingFines > 0 && <View style={styles.tabBadgeDot} />}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'fines' && styles.tabLabelActive]}>
              Fines
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safe: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabIconWrap: {
    position: 'relative',
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#D97706',
    fontWeight: '800',
  },
});
