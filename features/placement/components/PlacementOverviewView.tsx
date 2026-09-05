import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { usePlacementStore } from '../store/usePlacementStore';

interface Props {
  onNavigateTab: (tab: 'drives' | 'pipeline' | 'companies' | 'offers') => void;
}

export const PlacementOverviewView: React.FC<Props> = ({ onNavigateTab }) => {
  const drives = usePlacementStore((s) => s.drives);
  const applications = usePlacementStore((s) => s.applications);
  const companies = usePlacementStore((s) => s.companies);
  const highestCTC = usePlacementStore((s) => s.getHighestCTCLPA());
  const averageCTC = usePlacementStore((s) => s.getAverageCTCLPA());
  const placementRate = usePlacementStore((s) => s.getPlacementRatePercentage());
  const totalOffers = usePlacementStore((s) => s.getTotalOffersCount());
  const activeDrives = usePlacementStore((s) => s.getActiveDrivesCount());

  // Upcoming interviews
  const upcomingInterviews = applications.filter(
    (a) => a.status === 'interview_scheduled' && a.interviewSlot
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Analytics Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroSubtitle}>CAMPUS RECRUITMENT 2026-27</Text>
            <Text style={styles.heroTitle}>{placementRate}% Placement Rate</Text>
          </View>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="briefcase" size={16} color="#10B981" />
            <Text style={styles.heroBadgeText}>{activeDrives} Active Drives</Text>
          </View>
        </View>

        {/* 3 Metric Pills */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={[styles.kpiValue, { color: '#FCD34D' }]}>₹{highestCTC} LPA</Text>
            <Text style={styles.kpiLabel}>Highest CTC</Text>
          </View>

          <View style={styles.kpiDivider} />

          <View style={styles.kpiBox}>
            <Text style={styles.kpiValue}>₹{averageCTC} LPA</Text>
            <Text style={styles.kpiLabel}>Average CTC</Text>
          </View>

          <View style={styles.kpiDivider} />

          <TouchableOpacity
            style={styles.kpiBox}
            onPress={() => onNavigateTab('offers')}
            activeOpacity={0.7}
          >
            <Text style={[styles.kpiValue, { color: '#6EE7B7' }]}>{totalOffers}</Text>
            <Text style={styles.kpiLabel}>Total Offers</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Placement Operations</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('drives')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#059669" />
          </View>
          <Text style={styles.gridCardTitle}>Recruitment Drives</Text>
          <Text style={styles.gridCardSub}>{drives.length} corporate postings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('pipeline')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <MaterialCommunityIcons name="account-group-outline" size={24} color="#4F46E5" />
          </View>
          <Text style={styles.gridCardTitle}>Candidate Pipeline</Text>
          <Text style={styles.gridCardSub}>{applications.length} active applicants</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('companies')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="domain" size={24} color="#D97706" />
          </View>
          <Text style={styles.gridCardTitle}>Recruiter CRM</Text>
          <Text style={styles.gridCardSub}>{companies.length} corporate partners</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('offers')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FCE7F3' }]}>
            <MaterialCommunityIcons name="file-certificate-outline" size={24} color="#DB2777" />
          </View>
          <Text style={styles.gridCardTitle}>Offers Ledger</Text>
          <Text style={styles.gridCardSub}>{totalOffers} verified offers</Text>
        </TouchableOpacity>
      </View>

      {/* Scheduled Interviews Carousel / Section */}
      <View style={styles.feedHeaderRow}>
        <Text style={styles.sectionTitle}>Upcoming Interview Rounds</Text>
        <TouchableOpacity onPress={() => onNavigateTab('pipeline')}>
          <Text style={styles.seeAllText}>Pipeline →</Text>
        </TouchableOpacity>
      </View>

      {upcomingInterviews.length === 0 ? (
        <View style={styles.emptyInterviewCard}>
          <Text style={styles.emptyInterviewText}>No interviews scheduled today.</Text>
        </View>
      ) : (
        upcomingInterviews.map((app) => (
          <View key={app.id} style={styles.interviewCard}>
            <View style={styles.interviewTop}>
              <View style={styles.companyBadge}>
                <MaterialCommunityIcons name="google" size={18} color="#4F46E5" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.interviewCandidate}>{app.studentName}</Text>
                <Text style={styles.interviewRole}>
                  {app.companyName} • {app.roleTitle}
                </Text>
              </View>
              <View style={styles.roundTag}>
                <Text style={styles.roundTagText}>{app.currentRound}</Text>
              </View>
            </View>

            <View style={styles.slotRow}>
              <MaterialCommunityIcons name="clock-outline" size={14} color="#059669" />
              <Text style={styles.slotText}>{app.interviewSlot}</Text>
            </View>
          </View>
        ))
      )}

      {/* Top Hiring Corporate Partners */}
      <View style={[styles.feedHeaderRow, { marginTop: 14 }]}>
        <Text style={styles.sectionTitle}>Key Corporate Recruiters</Text>
        <TouchableOpacity onPress={() => onNavigateTab('companies')}>
          <Text style={styles.seeAllText}>All ({companies.length})</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.companyRow}>
        {companies.map((comp) => (
          <View key={comp.id} style={styles.companyCard}>
            <View style={styles.companyIconWrap}>
              <MaterialCommunityIcons name="domain" size={22} color="#059669" />
            </View>
            <Text style={styles.companyCardName}>{comp.name}</Text>
            <Text style={styles.companyIndustry}>{comp.industry}</Text>
            <View style={styles.hireBadge}>
              <Text style={styles.hireBadgeText}>{comp.pastHiresCount} Hires</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#064E3B',
    borderRadius: BorderRadius.card,
    padding: 18,
    marginBottom: 16,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  kpiBox: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
  kpiValue: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  kpiLabel: { fontSize: 10, color: '#A7F3D0', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  gridIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridCardTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  gridCardSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  seeAllText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  emptyInterviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyInterviewText: { fontSize: 12, color: '#64748B' },
  interviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  interviewTop: { flexDirection: 'row', alignItems: 'center' },
  companyBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  interviewCandidate: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  interviewRole: { fontSize: 11, color: '#64748B', marginTop: 2 },
  roundTag: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roundTagText: { fontSize: 10, fontWeight: '800', color: '#059669' },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
  },
  slotText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  companyRow: { gap: 10, paddingVertical: 4 },
  companyCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
  },
  companyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  companyCardName: { fontSize: 13, fontWeight: '800', color: '#1E293B', textAlign: 'center' },
  companyIndustry: { fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 2 },
  hireBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  hireBadgeText: { fontSize: 10, fontWeight: '700', color: '#475569' },
});
