import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useLibraryStore } from '../store/useLibraryStore';

interface Props {
  onNavigateTab: (tab: 'catalog' | 'loans' | 'gate' | 'fines') => void;
}

export const LibraryOverviewView: React.FC<Props> = ({ onNavigateTab }) => {
  const booksCount = useLibraryStore((s) => s.getTotalBooksCount());
  const copiesCount = useLibraryStore((s) => s.getTotalCopiesCount());
  const activeLoans = useLibraryStore((s) => s.getActiveLoansCount());
  const overdueLoans = useLibraryStore((s) => s.getOverdueLoansCount());
  const insideCount = useLibraryStore((s) => s.getInsideVisitorsCount());
  const maxCapacity = useLibraryStore((s) => s.maxCapacity);
  const pendingFines = useLibraryStore((s) => s.getPendingFinesTotal());
  const collectedFines = useLibraryStore((s) => s.getCollectedFinesTotal());
  const loans = useLibraryStore((s) => s.loans);

  const occupancyPct = Math.min(100, Math.round((insideCount / maxCapacity) * 100));

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Stats Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroSub}>LIBRARY CIRCULATION DESK</Text>
            <Text style={styles.heroTitle}>{booksCount} Titles • {copiesCount} Copies</Text>
          </View>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="book-check" size={16} color="#10B981" />
            <Text style={styles.heroBadgeText}>{activeLoans} on Loan</Text>
          </View>
        </View>

        {/* Live Occupancy Gauge */}
        <View style={styles.occupancyBox}>
          <View style={styles.occupancyHeader}>
            <View style={styles.occTitleGroup}>
              <View style={styles.liveDot} />
              <Text style={styles.occTitle}>Reading Hall & Lab Occupancy</Text>
            </View>
            <Text style={styles.occCount}>
              {insideCount} / {maxCapacity} Seats ({occupancyPct}%)
            </Text>
          </View>
          <View style={styles.occTrack}>
            <View style={[styles.occFill, { width: `${occupancyPct}%` }]} />
          </View>
        </View>

        {/* 3 Metric Pills */}
        <View style={styles.metricRow}>
          <TouchableOpacity
            style={styles.metricPill}
            onPress={() => onNavigateTab('loans')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricVal, { color: overdueLoans > 0 ? '#EF4444' : '#FFFFFF' }]}>
              {overdueLoans}
            </Text>
            <Text style={styles.metricLabel}>Overdue Loans</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricPill}
            onPress={() => onNavigateTab('gate')}
            activeOpacity={0.7}
          >
            <Text style={styles.metricVal}>{insideCount}</Text>
            <Text style={styles.metricLabel}>Inside Now</Text>
          </TouchableOpacity>

          <View style={styles.metricDivider} />

          <TouchableOpacity
            style={styles.metricPill}
            onPress={() => onNavigateTab('fines')}
            activeOpacity={0.7}
          >
            <Text style={[styles.metricVal, { color: '#FCD34D' }]}>₹{pendingFines}</Text>
            <Text style={styles.metricLabel}>Due Fines</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Overdue Urgent Alert if any */}
      {overdueLoans > 0 && (
        <TouchableOpacity
          style={styles.alertBanner}
          onPress={() => onNavigateTab('loans')}
          activeOpacity={0.8}
        >
          <View style={styles.alertIconWrap}>
            <MaterialCommunityIcons name="alert-decagram" size={20} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>{overdueLoans} Book(s) Overdue Past Due Date</Text>
            <Text style={styles.alertSub}>Total accrued fine: ₹{pendingFines} (Rate: ₹5/day)</Text>
          </View>
          <View style={styles.alertActionBtn}>
            <Text style={styles.alertActionText}>Inspect →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Action Hub */}
      <Text style={styles.sectionTitle}>Library Operations</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('loans')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="book-arrow-right" size={24} color="#D97706" />
          </View>
          <Text style={styles.gridTitle}>Issue / Return</Text>
          <Text style={styles.gridSub}>Manage borrowing loans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('catalog')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <MaterialCommunityIcons name="bookshelf" size={24} color="#4F46E5" />
          </View>
          <Text style={styles.gridTitle}>Book Catalog</Text>
          <Text style={styles.gridSub}>Search & add titles</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('gate')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="account-clock" size={24} color="#059669" />
          </View>
          <Text style={styles.gridTitle}>Gatekeeper</Text>
          <Text style={styles.gridSub}>Entry & Exit logger</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('fines')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FCE7F3' }]}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#DB2777" />
          </View>
          <Text style={styles.gridTitle}>Fines Ledger</Text>
          <Text style={styles.gridSub}>₹{collectedFines} Collected</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Borrowing Log Feed */}
      <View style={styles.feedHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Borrowing Activity</Text>
        <TouchableOpacity onPress={() => onNavigateTab('loans')}>
          <Text style={styles.seeAllText}>See All ({loans.length})</Text>
        </TouchableOpacity>
      </View>

      {loans.slice(0, 4).map((loan) => {
        const isOverdue = loan.status === 'overdue';
        const isReturned = loan.status === 'returned';
        return (
          <View key={loan.id} style={styles.loanFeedCard}>
            <View style={styles.loanFeedTop}>
              <View style={styles.loanInfoGroup}>
                <View
                  style={[
                    styles.loanStatusIcon,
                    {
                      backgroundColor: isOverdue
                        ? '#FEE2E2'
                        : isReturned
                        ? '#ECFDF5'
                        : '#EEF2FF',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      isOverdue
                        ? 'clock-alert-outline'
                        : isReturned
                        ? 'check'
                        : 'book-outline'
                    }
                    size={18}
                    color={
                      isOverdue ? '#DC2626' : isReturned ? '#059669' : '#4F46E5'
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.loanBookTitle}>{loan.bookTitle}</Text>
                  <Text style={styles.loanBorrowerText}>
                    {loan.borrowerName} • {loan.borrowerClass || loan.borrowerRole}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.statusTag,
                  isOverdue
                    ? styles.tagOverdue
                    : isReturned
                    ? styles.tagReturned
                    : styles.tagActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusTagText,
                    isOverdue
                      ? { color: '#DC2626' }
                      : isReturned
                      ? { color: '#059669' }
                      : { color: '#4F46E5' },
                  ]}
                >
                  {isOverdue ? 'Overdue' : isReturned ? 'Returned' : 'Active'}
                </Text>
              </View>
            </View>

            <View style={styles.loanFeedFooter}>
              <Text style={styles.loanDates}>
                Issued: {loan.issueDate} • Due: {loan.dueDate}
              </Text>
              {loan.fineAmount > 0 && (
                <Text style={styles.loanFineTag}>Fine: ₹{loan.fineAmount}</Text>
              )}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  heroCard: {
    backgroundColor: '#1E1B4B',
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
  heroSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '700', color: '#10B981' },
  occupancyBox: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  occTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  occTitle: { fontSize: 11, color: '#CBD5E1', fontWeight: '600' },
  occCount: { fontSize: 11, color: '#FCD34D', fontWeight: '800' },
  occTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  occFill: { height: '100%', borderRadius: 3, backgroundColor: '#10B981' },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  metricPill: { flex: 1, alignItems: 'center' },
  metricDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)' },
  metricVal: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  metricLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 13, fontWeight: '800', color: '#991B1B' },
  alertSub: { fontSize: 11, color: '#B91C1C', marginTop: 2 },
  alertActionBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertActionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
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
  gridTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  gridSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  loanFeedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  loanFeedTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  loanInfoGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  loanStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanBookTitle: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  loanBorrowerText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagOverdue: { backgroundColor: '#FEE2E2' },
  tagReturned: { backgroundColor: '#ECFDF5' },
  tagActive: { backgroundColor: '#EEF2FF' },
  statusTagText: { fontSize: 10, fontWeight: '800' },
  loanFeedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginTop: 10,
    paddingTop: 8,
  },
  loanDates: { fontSize: 11, color: '#64748B' },
  loanFineTag: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
});
