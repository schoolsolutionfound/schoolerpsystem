import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';
import { AppLayout } from '../../shared/components/AppLayout';
import { AppCard } from '../../shared/components/AppCard';
import { AppBadge } from '../../shared/components/AppBadge';
import { LoadingView } from '../../shared/components/LoadingView';
import { ErrorState } from '../../shared/components/ErrorState';
import { EmptyState } from '../../shared/components/EmptyState';
import { useInstitutionDetailsQuery } from '../hooks/useDeveloperQueries';

interface InstitutionDetailsScreenProps {
  id: string;
}

type TabType =
  | 'overview'
  | 'subscription'
  | 'teachers'
  | 'students'
  | 'departments'
  | 'courses'
  | 'fees'
  | 'settings';

export function InstitutionDetailsScreen({ id }: InstitutionDetailsScreenProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: institution, isLoading, isError, error, refetch } = useInstitutionDetailsQuery(id);

  const tabs: { key: TabType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'overview', label: 'Overview', icon: 'information-outline' },
    { key: 'subscription', label: 'Subscription', icon: 'card-account-details-outline' },
    { key: 'teachers', label: 'Teachers', icon: 'account-tie-outline' },
    { key: 'students', label: 'Students', icon: 'school-outline' },
    { key: 'departments', label: 'Departments', icon: 'domain' },
    { key: 'courses', label: 'Courses', icon: 'book-open-variant' },
    { key: 'fees', label: 'Fees', icon: 'cash-multiple' },
    { key: 'settings', label: 'Settings', icon: 'cog-outline' },
  ];

  return (
    <AppLayout>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.light.text} />
          <Text style={styles.backText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingView message="Loading institution details..." />
      ) : isError || !institution ? (
        <ErrorState
          title="Institution Not Found"
          message={(error as any)?.message || 'Target institution details could not be retrieved.'}
          onRetry={refetch}
        />
      ) : (
        <View style={styles.contentWrap}>
          {/* Header Summary Card */}
          <AppCard style={styles.headerCard}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="office-building" size={28} color={Colors.light.primary} />
              </View>
              <View style={styles.titleTextWrap}>
                <Text style={styles.instName}>{institution.institutionName}</Text>
                <Text style={styles.instCode}>Code: {institution.institutionCode}</Text>
              </View>
            </View>

            <View style={styles.badgesRow}>
              <AppBadge label={institution.institutionType} type={institution.institutionType} />
              <AppBadge label={institution.subscriptionStatus} type={institution.subscriptionStatus} />
            </View>
          </AppCard>

          {/* Scalable Details Tab Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabItem, isActive && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={16}
                    color={isActive ? Colors.light.primary : Colors.light.muted}
                  />
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Tab Content */}
          {activeTab === 'overview' && (
            <AppCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>General Information</Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Primary Key (ID):</Text>
                  <Text style={styles.infoValue}>{institution.id}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Business Code:</Text>
                  <Text style={[styles.infoValue, { fontWeight: '800', color: Colors.light.primary }]}>
                    {institution.institutionCode}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Institution Name:</Text>
                  <Text style={styles.infoValue}>{institution.institutionName}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Institution Type:</Text>
                  <Text style={styles.infoValue}>{institution.institutionType.toUpperCase()}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Subscription Status:</Text>
                  <Text style={styles.infoValue}>{institution.subscriptionStatus.toUpperCase()}</Text>
                </View>

                {institution.createdAt && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Created At:</Text>
                    <Text style={styles.infoValue}>{new Date(institution.createdAt).toLocaleDateString()}</Text>
                  </View>
                )}
              </View>
            </AppCard>
          )}

          {activeTab === 'subscription' && (
            <AppCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Subscription & Licensing</Text>
              <Text style={styles.sectionDesc}>
                Manage ERP access tier and active status for {institution.institutionName}.
              </Text>

              <View style={styles.statusBox}>
                <Text style={styles.statusBoxLabel}>Current Subscription Status</Text>
                <AppBadge label={institution.subscriptionStatus} type={institution.subscriptionStatus} />
              </View>
            </AppCard>
          )}

          {activeTab !== 'overview' && activeTab !== 'subscription' && (
            <EmptyState
              title={`${tabs.find((t) => t.key === activeTab)?.label} Module Coming Soon`}
              description={`The ${tabs.find((t) => t.key === activeTab)?.label} management domain for ${institution.institutionName} will be available in upcoming sprint releases.`}
              iconName={tabs.find((t) => t.key === activeTab)?.icon}
            />
          )}
        </View>
      )}
    </AppLayout>
  );
}

const styles = StyleSheet.create({
  topNav: {
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  contentWrap: {
    gap: 16,
  },
  headerCard: {
    gap: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EDE9F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleTextWrap: {
    flex: 1,
    gap: 2,
  },
  instName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  instCode: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tabItemActive: {
    backgroundColor: '#EDE9F6',
    borderColor: Colors.light.primary,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.muted,
  },
  tabLabelActive: {
    color: Colors.light.primary,
    fontWeight: '800',
  },
  sectionCard: {
    gap: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  sectionDesc: {
    fontSize: 13,
    color: Colors.light.muted,
    lineHeight: 18,
  },
  infoGrid: {
    gap: 10,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.light.muted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '700',
  },
  statusBox: {
    backgroundColor: '#F8F9FB',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  statusBoxLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
});
