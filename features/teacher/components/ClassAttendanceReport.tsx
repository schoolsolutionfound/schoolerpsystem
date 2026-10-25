import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from './common/Icons';
import { FontFamily } from '../../../constants/fonts';
import { fetchClassAttendanceReportApi, fetchClassAttendanceExportApi } from '../../../api/academics';
import { TeacherShimmerSkeleton } from './common/TeacherShimmer';
import { generateClassAttendancePdfReport } from '../utils/attendancePdfGenerator';

export const ClassAttendanceReport: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
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
      await fetchClassAttendanceExportApi('');
      Alert.alert('Export Ready', 'CSV data has been generated.', [{ text: 'OK' }]);
    } catch (err: any) {
      Alert.alert('Export Failed', err.message || 'Could not export data');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (exportingPdf || !report) return;
    setExportingPdf(true);
    try {
      await generateClassAttendancePdfReport(report);
    } catch (err: any) {
      Alert.alert('PDF Export Failed', err?.message || 'Could not generate attendance PDF report.');
    } finally {
      setExportingPdf(false);
    }
  };

  const { summary, subjects, dailyTrend, lowAttendance, topPerformers, classSection, range } = report || {};

  const chartHeight = 90;
  const chartWidth = 300;
  const barWidth = 24;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000000" colors={['#000000']} />}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <TeacherShimmerSkeleton width="100%" height={180} borderRadius={5} />
            <TeacherShimmerSkeleton width="100%" height={120} borderRadius={5} />
          </View>
        ) : report ? (
          <>
            {/* Overall Summary Card */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>{classSection?.name || 'My Class'}</Text>
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
                  <View style={[styles.progressFill, { width: `${Math.min(100, summary?.averagePercentage || 0)}%` }]} />
                </View>
              </View>
            </View>

            {/* Subject Breakdown */}
            {subjects && subjects.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="book-open-page-variant-outline" size={16} color="#B45309" />
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
                          width: `${Math.min(100, sub.percentage)}%`,
                          backgroundColor: sub.percentage >= 75 ? '#026440' : sub.percentage >= 60 ? '#D97706' : '#DC2626',
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
                  <MaterialCommunityIcons name="chart-line" size={16} color="#B45309" />
                  <Text style={styles.cardTitle}>Daily Trend</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <Svg width={Math.max(chartWidth, dailyTrend.length * (barWidth + 10))} height={chartHeight + 24}>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                      <Line key={i} x1={0} y1={chartHeight * (1 - ratio)} x2={Math.max(chartWidth, dailyTrend.length * (barWidth + 10))} y2={chartHeight * (1 - ratio)} stroke="#F3F4F6" strokeWidth={0.5} />
                    ))}
                    {dailyTrend.map((d: any, i: number) => {
                      const barH = (d.percentage / 100) * (chartHeight - 8);
                      const x = 12 + i * (barWidth + 10);
                      const y = chartHeight - barH;
                      return (
                        <React.Fragment key={i}>
                          <Rect x={x} y={y} width={barWidth} height={barH} rx={4} fill={d.percentage >= 75 ? '#F4C430' : d.percentage >= 60 ? '#FEF08A' : '#FECACA'} />
                          <SvgText x={x + barWidth / 2} y={chartHeight + 14} textAnchor="middle" fontSize={9} fill="#6B7280">{d.date.slice(5)}</SvgText>
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
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
                  <Text style={[styles.cardTitle, { color: '#DC2626' }]}>Low Attendance ({'>'}25% absent)</Text>
                </View>
                {lowAttendance.map((s: any, i: number) => (
                  <View key={i} style={styles.alertRow}>
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertName}>{s.fullName}</Text>
                      <Text style={styles.alertUSN}>{s.rollNoOrUSN}</Text>
                    </View>
                    <View style={[styles.alertBadge, { backgroundColor: s.percentage < 50 ? '#FEE2E2' : '#FEF3C7', borderColor: s.percentage < 50 ? '#FECACA' : '#FDE68A' }]}>
                      <Text style={[styles.alertPct, { color: s.percentage < 50 ? '#DC2626' : '#B45309' }]}>{s.percentage}%</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Top Performers */}
            {topPerformers && topPerformers.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="trophy-outline" size={16} color="#B45309" />
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

            {/* Export Buttons */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                style={[styles.exportBtn, { flex: 1, backgroundColor: '#026440', opacity: exportingPdf ? 0.7 : 1 }]}
                onPress={handleExportPdf}
                disabled={exportingPdf}
                activeOpacity={0.85}
              >
                {exportingPdf ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <MaterialCommunityIcons name="file-pdf-box" size={18} color="#FFFFFF" />
                )}
                <Text style={[styles.exportBtnText, { color: '#FFFFFF' }]}>
                  {exportingPdf ? 'Generating...' : 'Export PDF'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.exportBtn, { flex: 1, backgroundColor: '#F4C430' }]} onPress={handleExport} disabled={exporting} activeOpacity={0.85}>
                <MaterialCommunityIcons name="download" size={18} color="#171717" />
                <Text style={[styles.exportBtnText, { color: '#171717' }]}>{exporting ? 'Exporting...' : 'Export CSV'}</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="chart-bar" size={38} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No attendance data</Text>
            <Text style={styles.emptySub}>Mark attendance for your class to see reports.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { paddingHorizontal: 20, paddingVertical: 14, gap: 14, paddingBottom: 110 },

  summaryCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: 5,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: { marginBottom: 14 },
  summaryTitle: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#FFFFFF' },
  summarySub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#8A8A8A', marginTop: 2 },
  summaryGrid: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontFamily: FontFamily.extrabold, color: '#F4C430' },
  summaryLabel: { fontSize: 10, fontFamily: FontFamily.medium, color: '#8A8A8A', marginTop: 2 },
  summaryDivider: { width: 1, height: 30, backgroundColor: '#2A2B2C' },
  progressBar: {},
  progressBg: { height: 6, backgroundColor: '#2A2B2C', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#F4C430', borderRadius: 5 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },

  subjectRow: { gap: 6, marginBottom: 10 },
  subjectInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  subjectName: { fontSize: 12, fontFamily: FontFamily.bold, color: '#111827' },
  subjectPct: { fontSize: 12, fontFamily: FontFamily.bold, color: '#B45309' },
  subjectBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectBarBg: { flex: 1, height: 5, backgroundColor: '#F3F4F6', borderRadius: 5, overflow: 'hidden' },
  subjectBarFill: { height: '100%', borderRadius: 5 },
  subjectDetail: { fontSize: 10.5, fontFamily: FontFamily.medium, color: '#6B7280', width: 36, textAlign: 'right' },

  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 12, fontFamily: FontFamily.bold, color: '#111827' },
  alertUSN: { fontSize: 10.5, fontFamily: FontFamily.regular, color: '#6B7280' },
  alertBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, borderWidth: 1 },
  alertPct: { fontSize: 11, fontFamily: FontFamily.bold },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  topRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topRankText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#D97706' },
  topInfo: { flex: 1 },
  topName: { fontSize: 12, fontFamily: FontFamily.bold, color: '#111827' },
  topUSN: { fontSize: 10.5, fontFamily: FontFamily.regular, color: '#6B7280' },
  topPct: { fontSize: 13, fontFamily: FontFamily.extrabold, color: '#026440' },

  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 5,
    paddingVertical: 12,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exportBtnText: { fontSize: 13, fontFamily: FontFamily.bold },

  loadingWrap: { gap: 14 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 6,
  },
  emptyTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  emptySub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280', textAlign: 'center' },
});
