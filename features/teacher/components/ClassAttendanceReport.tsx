import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Platform } from 'react-native';
import Svg, { Rect, Line, Circle, G, Path, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { fetchClassAttendanceReportApi, fetchClassAttendanceExportApi } from '../../../api/academics';
import { ShimmerSkeleton } from '../../student/components/ShimmerSkeleton';

export const ClassAttendanceReport: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      // No classSectionId — backend auto-resolves teacher's own class
      const res = await fetchClassAttendanceReportApi('');
      setReport(res);
    } catch (err: any) {
      console.warn('[Report] Could not load report:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReport(); }, [loadReport]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReport();
    setRefreshing(false);
  }, [loadReport]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await fetchClassAttendanceExportApi('');
      Alert.alert('Export Ready', 'CSV data has been generated.', [{ text: 'OK' }]);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export data');
    } finally {
      setExporting(false);
    }
  };

  const { summary, subjects, dailyTrend, lowAttendance, topPerformers, classSection, range } = report || {};

  const chartHeight = 80;
  const chartWidth = 300;
  const barWidth = 24;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1A1B1C" colors={['#1A1B1C']} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ShimmerSkeleton width="100%" height={200} borderRadius={12} />
            <ShimmerSkeleton width="100%" height={120} borderRadius={12} />
          </View>
        ) : report ? (
          <>
            {/* Overall Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>{classSection?.name}</Text>
                <Text style={styles.summarySub}>{range?.fromDate} to {range?.toDate}</Text>
              </View>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{summary?.averagePercentage || 0}%</Text>
                  <Text style={styles.summaryLabel}>Average</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{summary?.studentsCount || 0}</Text>
                  <Text style={styles.summaryLabel}>Students</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{summary?.totalMarks || 0}</Text>
                  <Text style={styles.summaryLabel}>Total Marks</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${summary?.averagePercentage || 0}%` }]} />
                </View>
              </View>
            </View>

            {/* Subject Breakdown */}
            {subjects && subjects.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color="#F4C430" />
                  <Text style={styles.cardTitle}>Subject Breakdown</Text>
                </View>
                {subjects.map((sub: any, i: number) => (
                  <View key={i} style={styles.subjectRow}>
                    <View style={styles.subjectInfo}>
                      <Text style={styles.subjectName}>{sub.subjectName}</Text>
                      <Text style={styles.subjectPct}>{sub.percentage}%</Text>
                    </View>
                    <View style={styles.subjectBar}>
                      <View style={styles.subjectBarBg}>
                        <View style={[styles.subjectBarFill, {
                          width: `${sub.percentage}%`,
                          backgroundColor: sub.percentage >= 75 ? '#F4C430' : sub.percentage >= 60 ? '#F59E0B' : '#EF4444',
                        }]} />
                      </View>
                      <Text style={styles.subjectDetail}>{sub.present}/{sub.total}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Daily Trend Chart */}
            {dailyTrend && dailyTrend.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="chart-line" size={16} color="#F4C430" />
                  <Text style={styles.cardTitle}>Daily Trend</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Svg width={Math.max(chartWidth, dailyTrend.length * (barWidth + 8))} height={chartHeight + 24}>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                      <Line key={i} x1={0} y1={chartHeight * (1 - ratio)} x2={chartWidth} y2={chartHeight * (1 - ratio)} stroke="#2A2B2C" strokeWidth={0.5} />
                    ))}
                    {dailyTrend.map((d: any, i: number) => {
                      const barH = (d.percentage / 100) * (chartHeight - 8);
                      const x = 12 + i * (barWidth + 8);
                      const y = chartHeight - barH;
                      return (
                        <React.Fragment key={i}>
                          <Rect x={x} y={y} width={barWidth} height={barH} rx={4} fill={d.percentage >= 75 ? '#F4C430' : d.percentage >= 60 ? '#F59E0B' : '#EF4444'} />
                          <SvgText x={x + barWidth / 2} y={chartHeight + 14} textAnchor="middle" fontSize={8} fill="#6A6A6A">{d.date.slice(5)}</SvgText>
                        </React.Fragment>
                      );
                    })}
                  </Svg>
                </ScrollView>
              </View>
            )}

            {/* Low Attendance Alerts */}
            {lowAttendance && lowAttendance.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#EF4444" />
                  <Text style={[styles.cardTitle, { color: '#EF4444' }]}>Low Attendance ({'>'}25% absent)</Text>
                </View>
                {lowAttendance.map((s: any, i: number) => (
                  <View key={i} style={styles.alertRow}>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertName}>{s.fullName}</Text>
                      <Text style={styles.alertUSN}>{s.rollNoOrUSN}</Text>
                    </View>
                    <View style={[styles.alertBadge, { backgroundColor: s.percentage < 50 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)' }]}>
                      <Text style={[styles.alertPct, { color: s.percentage < 50 ? '#EF4444' : '#F59E0B' }]}>{s.percentage}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Top Performers */}
            {topPerformers && topPerformers.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="trophy-outline" size={16} color="#F4C430" />
                  <Text style={styles.cardTitle}>Top Performers</Text>
                </View>
                {topPerformers.map((s: any, i: number) => (
                  <View key={i} style={styles.topRow}>
                    <View style={styles.topRank}>
                      <Text style={styles.topRankText}>{i + 1}</Text>
                    </View>
                    <View style={styles.topInfo}>
                      <Text style={styles.topName}>{s.fullName}</Text>
                      <Text style={styles.topUSN}>{s.rollNoOrUSN}</Text>
                    </View>
                    <Text style={styles.topPct}>{s.percentage}%</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Export Button */}
            <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
              <MaterialCommunityIcons name="download" size={18} color="#1A1B1C" />
              <Text style={styles.exportBtnText}>{exporting ? 'Exporting...' : 'Export CSV Report'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="chart-bar" size={40} color="#E8E5DC" />
            <Text style={styles.emptyTitle}>No attendance data</Text>
            <Text style={styles.emptySub}>Mark attendance for your class to see reports.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFEFE' },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 14, paddingBottom: 40 },
  section: { gap: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#171717' },
  chipRow: { gap: 8 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  chipActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#6B6B6B' },
  chipTextActive: { color: '#1A1B1C' },

  summaryCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  summaryHeader: { marginBottom: 14 },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  summarySub: { fontSize: 11, color: '#6A6A6A', marginTop: 2 },
  summaryGrid: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#F4C430' },
  summaryLabel: { fontSize: 10, color: '#6A6A6A', marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#2A2B2C' },
  progressBar: {},
  progressBg: { height: 6, backgroundColor: '#232425', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 3 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#171717' },

  subjectRow: { gap: 6, marginBottom: 10 },
  subjectInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectName: { fontSize: 12, fontWeight: '700', color: '#171717' },
  subjectPct: { fontSize: 12, fontWeight: '800', color: '#F4C430' },
  subjectBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectBarBg: { flex: 1, height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  subjectBarFill: { height: '100%', borderRadius: 3 },
  subjectDetail: { fontSize: 10, color: '#6B6B6B', width: 36, textAlign: 'right' },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 12, fontWeight: '700', color: '#171717' },
  alertUSN: { fontSize: 10, color: '#6B6B6B' },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  alertPct: { fontSize: 12, fontWeight: '800' },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  topRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRankText: { fontSize: 11, fontWeight: '800', color: '#F4C430' },
  topInfo: { flex: 1 },
  topName: { fontSize: 12, fontWeight: '700', color: '#171717' },
  topUSN: { fontSize: 10, color: '#6B6B6B' },
  topPct: { fontSize: 13, fontWeight: '800', color: '#F4C430' },

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingVertical: 14,
  },
  exportBtnText: { fontSize: 14, fontWeight: '800', color: '#1A1B1C' },

  loadingWrap: { gap: 14 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 6,
  },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: '#171717' },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center' },
});
