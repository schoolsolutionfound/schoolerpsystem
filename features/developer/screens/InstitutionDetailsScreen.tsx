import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../../constants/theme';
import { AppLayout } from '../../shared/components/AppLayout';
import { safeGoBack } from '../../shared/utils/safeNavigation';
import { AppCard } from '../../shared/components/AppCard';
import { AppBadge } from '../../shared/components/AppBadge';
import { LoadingView } from '../../shared/components/LoadingView';
import { ErrorState } from '../../shared/components/ErrorState';
import { useInstitutionDetailsQuery } from '../hooks/useDeveloperQueries';

interface InstitutionDetailsScreenProps {
  id: string;
}

type TabType = 'overview' | 'structure' | 'subscription';

interface StructureGroupProps {
  label: string;
  items: string[];
  emptyText: string;
}

function StructureGroup({ label, items, emptyText }: StructureGroupProps) {
  return (
    <View style={styles.structureGroup}>
      <Text style={styles.groupLabel}>{label}</Text>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        <View style={styles.chipsRow}>
          {items.map((item, index) => (
            <AppBadge key={`${item}-${index}`} label={item} type="college" />
          ))}
        </View>
      )}
    </View>
  );
}

export function InstitutionDetailsScreen({ id }: InstitutionDetailsScreenProps) {
  const router = useRouter();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: institution, isLoading, isError, error, refetch } = useInstitutionDetailsQuery(id);

  const isSchool = institution?.institutionType === 'school';
  const tabs: { key: TabType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'overview', label: 'Overview', icon: 'information-outline' },
    {
      key: 'structure',
      label: isSchool ? 'Subjects & Classes' : 'Departments & Years',
      icon: isSchool ? 'school-outline' : 'office-building-outline',
    },
    { key: 'subscription', label: 'Subscription', icon: 'card-account-details-outline' },
  ];

  const units = Array.isArray(institution?.departments)
    ? institution.departments
    : Array.isArray(institution?.subjects)
      ? institution.subjects
      : [];
  const levels = isSchool
    ? Array.isArray(institution?.academicYears)
      ? institution.academicYears
      : Array.isArray(institution?.classes)
        ? institution.classes
        : []
    : Array.isArray(institution?.yearsOfStudy) && institution.yearsOfStudy.length > 0
      ? institution.yearsOfStudy
      : Array.isArray(institution?.academicYears)
        ? institution.academicYears
        : Array.isArray(institution?.classes)
          ? institution.classes
          : [];
  const programs = Array.isArray(institution?.courses)
    ? institution.courses
    : Array.isArray(institution?.programs)
      ? institution.programs
      : [];
  const sections = Array.isArray(institution?.sections) ? institution.sections : [];

  return (
    <AppLayout>
      <View style={styles.topNav}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => safeGoBack(navigation, '/(developer)/home')}
        >
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

          {activeTab === 'structure' && (
            <AppCard style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>
                {isSchool ? 'Subjects & Classes' : 'Departments & Years of Study'}
              </Text>
              <Text style={styles.sectionDesc}>
                {isSchool
                  ? 'Subjects, classes, and sections configured for this school.'
                  : 'Departments, years of study, programs, and sections configured for this college. Academic sessions (e.g. 2026-27) are managed by the institution admin.'}
              </Text>

              <View style={styles.structureList}>
                <StructureGroup
                  label={isSchool ? 'Subjects' : 'Departments'}
                  items={units}
                  emptyText={`No ${isSchool ? 'subjects' : 'departments'} configured.`}
                />
                <StructureGroup
                  label={isSchool ? 'Classes' : 'Years of Study'}
                  items={levels}
                  emptyText={`No ${isSchool ? 'classes' : 'years of study'} configured.`}
                />
                {!isSchool && (
                  <StructureGroup
                    label="Programs"
                    items={programs}
                    emptyText="No programs configured."
                  />
                )}
                <StructureGroup
                  label="Sections"
                  items={sections}
                  emptyText="No sections configured."
                />
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
    backgroundColor: '#FFF4C7',
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
    backgroundColor: '#FFF4C7',
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
  structureList: {
    gap: 14,
    marginTop: 4,
  },
  structureGroup: {
    gap: 6,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.light.muted,
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
    backgroundColor: '#FFFDF7',
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
