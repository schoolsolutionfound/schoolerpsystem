import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { fetchParentAttendanceApi } from '../../../api/academics';

export const ParentAttendanceView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('September 2026');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchParentAttendanceApi();
      setData(res);
    } catch (err: any) {
      console.warn('[Parent Attendance]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const overall = data?.overall || { present: 48, absent: 3, total: 51, percentage: 94.2 };
  const perSubject = data?.perSubject || [];
  const pct = overall.percentage || 0;
  const isEligible = pct >= 75;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Attendance KPI Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroBadgeText}>ACADEMIC ATTENDANCE</Text>
            <Text style={styles.heroPct}>{pct.toFixed(1)}%</Text>
          </View>
          <View style={[styles.statusTag, isEligible ? styles.tagSuccess : styles.tagWarning]}>
            <MaterialCommunityIcons
              name={isEligible ? 'check-decagram' : 'alert-circle'}
              size={14}
              color={isEligible ? '#059669' : '#D97706'}
            />
            <Text style={[styles.statusTagText, { color: isEligible ? '#059669' : '#D97706' }]}>
              {isEligible ? 'Eligible (>75%)' : 'Short Attendance'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(pct, 100)}%` }]} />
        </View>

        <View style={styles.statPillsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statPillNum}>{overall.present}</Text>
            <Text style={styles.statPillLabel}>Days Present</Text>
          </View>
          <View style={styles.pillDivider} />
          <View style={styles.statPill}>
            <Text style={[styles.statPillNum, { color: '#EF4444' }]}>{overall.absent}</Text>
            <Text style={styles.statPillLabel}>Days Absent</Text>
          </View>
          <View style={styles.pillDivider} />
          <View style={styles.statPill}>
            <Text style={styles.statPillNum}>{overall.total}</Text>
            <Text style={styles.statPillLabel}>Total Classes</Text>
          </View>
        </View>
      </View>

      {/* Monthly Breakdown / Quick Summary */}
      <View style={styles.monthHeaderRow}>
        <Text style={styles.sectionTitle}>Monthly Log</Text>
        <View style={styles.monthSelector}>
          <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#4F46E5" />
          <Text style={styles.monthSelectorText}>{selectedMonth}</Text>
        </View>
      </View>

      {/* Week overview */}
      <View style={styles.weekCard}>
        <Text style={styles.weekTitle}>This Week&apos;s Daily Log</Text>
        <View style={styles.daysRow}>
          {[
            { day: 'Mon', date: '01', status: 'present' },
            { day: 'Tue', date: '02', status: 'present' },
            { day: 'Wed', date: '03', status: 'present' },
            { day: 'Thu', date: '04', status: 'present' },
            { day: 'Fri', date: '05', status: 'present' },
            { day: 'Sat', date: '06', status: 'weekend' },
          ].map((d, i) => (
            <View key={i} style={styles.dayCol}>
              <Text style={styles.dayName}>{d.day}</Text>
              <View
                style={[
                  styles.dayDot,
                  d.status === 'present' && styles.dotPresent,
                  d.status === 'absent' && styles.dotAbsent,
                  d.status === 'weekend' && styles.dotWeekend,
                ]}
              >
                <Text
                  style={[
                    styles.dayDateText,
                    d.status === 'present' && { color: '#065F46' },
                    d.status === 'weekend' && { color: '#94A3B8' },
                  ]}
                >
                  {d.date}
                </Text>
              </View>
              <Text style={styles.dayStatusText}>
                {d.status === 'present' ? 'P' : d.status === 'absent' ? 'A' : 'Off'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Per Subject Breakdown */}
      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Subject-Wise Attendance</Text>
      {perSubject.map((row: any, i: number) => {
        const subPct = row.percentage || 0;
        const subGood = subPct >= 75;
        return (
          <View key={i} style={styles.subjectCard}>
            <View style={styles.subjectHeader}>
              <View style={styles.subjectTitleGroup}>
                <View style={[styles.subjectIcon, { backgroundColor: subGood ? '#EEF2FF' : '#FEF2F2' }]}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant"
                    size={18}
                    color={subGood ? '#4F46E5' : '#EF4444'}
                  />
                </View>
                <View>
                  <Text style={styles.subjectName}>{row.subject?.name || 'Subject'}</Text>
                  <Text style={styles.subjectCode}>{row.subject?.code || 'SUB-10'}</Text>
                </View>
              </View>

              <View style={styles.subPctWrap}>
                <Text style={[styles.subjectPct, { color: subGood ? '#059669' : '#DC2626' }]}>
                  {subPct}%
                </Text>
              </View>
            </View>

            <View style={styles.subProgressTrack}>
              <View
                style={[
                  styles.subProgressFill,
                  {
                    width: `${Math.min(subPct, 100)}%`,
                    backgroundColor: subGood ? '#10B981' : '#EF4444',
                  },
                ]}
              />
            </View>

            <View style={styles.subjectFooter}>
              <Text style={styles.subjectDetail}>
                {row.present} attended of {row.total} classes
              </Text>
              <Text style={[styles.attendanceAlert, { color: subGood ? '#059669' : '#DC2626' }]}>
                {subGood ? 'On Track' : 'Needs Attention'}
              </Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  heroCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: BorderRadius.card,
    padding: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 0.8,
  },
  heroPct: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagSuccess: { backgroundColor: '#ECFDF5' },
  tagWarning: { backgroundColor: '#FEF3C7' },
  statusTagText: { fontSize: 11, fontWeight: '700' },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  statPill: { alignItems: 'center', flex: 1 },
  pillDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.15)' },
  statPillNum: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  statPillLabel: { fontSize: 10, color: '#CBD5E1', marginTop: 2 },
  monthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
  },
  monthSelectorText: { fontSize: 12, fontWeight: '700', color: '#4F46E5' },
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  weekTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 12 },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayCol: { alignItems: 'center' },
  dayName: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 6 },
  dayDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotPresent: { backgroundColor: '#D1FAE5' },
  dotAbsent: { backgroundColor: '#FEE2E2' },
  dotWeekend: { backgroundColor: '#F1F5F9' },
  dayDateText: { fontSize: 12, fontWeight: '700' },
  dayStatusText: { fontSize: 10, fontWeight: '800', color: '#475569', marginTop: 4 },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subjectIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
  subjectCode: { fontSize: 11, color: '#64748B', marginTop: 1 },
  subPctWrap: { alignItems: 'flex-end' },
  subjectPct: { fontSize: 16, fontWeight: '800' },
  subProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 8,
  },
  subProgressFill: { height: '100%', borderRadius: 3 },
  subjectFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subjectDetail: { fontSize: 11, color: '#64748B' },
  attendanceAlert: { fontSize: 11, fontWeight: '700' },
});
