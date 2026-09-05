import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PlacementHeader } from '../features/placement/components/PlacementHeader';
import { PlacementOverviewView } from '../features/placement/components/PlacementOverviewView';
import { PlacementDrivesView } from '../features/placement/components/PlacementDrivesView';
import { CandidatePipelineView } from '../features/placement/components/CandidatePipelineView';
import { CompanyDirectoryView } from '../features/placement/components/CompanyDirectoryView';
import { PlacementOffersLedgerView } from '../features/placement/components/PlacementOffersLedgerView';
import { usePlacementStore } from '../features/placement/store/usePlacementStore';

type Tab = 'overview' | 'drives' | 'pipeline' | 'companies' | 'offers';

export default function PlacementScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const activeDrives = usePlacementStore((s) => s.getActiveDrivesCount());
  const applications = usePlacementStore((s) => s.applications);

  const interviewCount = applications.filter((a) => a.status === 'interview_scheduled').length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        {/* Placement Header */}
        <PlacementHeader />

        {/* Dynamic Tab Body */}
        <View style={styles.content}>
          {activeTab === 'overview' && (
            <PlacementOverviewView onNavigateTab={(tab) => setActiveTab(tab)} />
          )}
          {activeTab === 'drives' && <PlacementDrivesView />}
          {activeTab === 'pipeline' && <CandidatePipelineView />}
          {activeTab === 'companies' && <CompanyDirectoryView />}
          {activeTab === 'offers' && <PlacementOffersLedgerView />}
        </View>

        {/* Bottom Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('overview')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'overview' ? 'view-dashboard' : 'view-dashboard-outline'}
              size={22}
              color={activeTab === 'overview' ? '#059669' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'overview' && styles.tabLabelActive]}>
              Overview
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('drives')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={activeTab === 'drives' ? 'bullhorn' : 'bullhorn-outline'}
                size={22}
                color={activeTab === 'drives' ? '#059669' : '#94A3B8'}
              />
              {activeDrives > 0 && <View style={styles.badgeDot} />}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'drives' && styles.tabLabelActive]}>
              Drives
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('pipeline')}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={activeTab === 'pipeline' ? 'account-group' : 'account-group-outline'}
                size={22}
                color={activeTab === 'pipeline' ? '#059669' : '#94A3B8'}
              />
              {interviewCount > 0 && <View style={styles.badgeDot} />}
            </View>
            <Text style={[styles.tabLabel, activeTab === 'pipeline' && styles.tabLabelActive]}>
              Pipeline
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('companies')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'companies' ? 'domain' : 'domain'}
              size={22}
              color={activeTab === 'companies' ? '#059669' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'companies' && styles.tabLabelActive]}>
              Recruiters
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => setActiveTab('offers')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={activeTab === 'offers' ? 'file-certificate' : 'file-certificate-outline'}
              size={22}
              color={activeTab === 'offers' ? '#059669' : '#94A3B8'}
            />
            <Text style={[styles.tabLabel, activeTab === 'offers' && styles.tabLabelActive]}>
              Offers
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
  iconWrap: { position: 'relative' },
  badgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 3,
  },
  tabLabelActive: {
    color: '#059669',
    fontWeight: '800',
  },
});
