import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { FontFamily } from '../../../constants/fonts';
import { TeacherShimmerSkeleton } from './common/TeacherShimmer';

interface TeacherWeeklyBarCardProps {
  weekData?: number[];
  loading?: boolean;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const TeacherWeeklyBarCard: React.FC<TeacherWeeklyBarCardProps> = ({
  weekData = [0, 0, 0, 0, 0],
  loading,
}) => {
  const maxVal = Math.max(...weekData, 1);
  const totalPeriods = weekData.reduce((a, b) => a + b, 0);
  const activeDays = weekData.filter((v) => v > 0).length;
  const avg = activeDays > 0 ? Math.round(totalPeriods / activeDays) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Weekly Overview</Text>
        </View>
        <View style={styles.avgBadge}>
          <Text style={styles.avgValue}>{avg}</Text>
          <Text style={styles.avgLabel}>avg/day</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.contentWrap}>
          <View style={[styles.chartContainer, { height: 120, alignItems: 'flex-end' }]}>
            {[45, 75, 55, 90, 60].map((h, idx) => (
              <View key={idx} style={styles.barCol}>
                <TeacherShimmerSkeleton width={32} height={h} borderRadius={5} />
                <TeacherShimmerSkeleton width={24} height={10} borderRadius={5} style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.contentWrap}>
          <View style={styles.chartContainer}>
            {DAY_LABELS.map((day, i) => {
              const val = weekData[i] || 0;
              const isPeak = val === maxVal && val > 0;
              const heightPct = val > 0 ? Math.max(12, Math.round((val / maxVal) * 100)) : 0;

              return (
                <View key={day} style={styles.barCol}>
                  <Text style={[styles.barValue, isPeak && styles.barValuePeak]}>
                    {val > 0 ? val : '—'}
                  </Text>

                  <View style={styles.track}>
                    {val > 0 && (
                      <View
                        style={[
                          styles.barFill,
                          { height: `${heightPct}%` },
                          isPeak && styles.barFillPeak,
                        ]}
                      />
                    )}
                  </View>

                  <Text style={[styles.barLabel, isPeak && styles.barLabelPeak]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>{totalPeriods} periods this week</Text>
            </View>
            <View style={styles.footerItem}>
              <View style={[styles.footerDot, { backgroundColor: '#1A1B1C' }]} />
              <Text style={styles.footerText}>Peak: {maxVal} periods</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  avgBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minWidth: 48,
  },
  avgValue: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    lineHeight: 22,
  },
  avgLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 1,
    textAlign: 'center',
  },
  contentWrap: {
    gap: 14,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAF9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  barValue: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#6B7280',
    height: 16,
    lineHeight: 16,
    textAlign: 'center',
  },
  barValuePeak: {
    color: '#111827',
    fontFamily: FontFamily.extrabold,
  },
  track: {
    width: 24,
    height: 110,
    borderRadius: 5,
    backgroundColor: '#E5E7EB',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#F4C430',
    borderRadius: 5,
  },
  barFillPeak: {
    backgroundColor: '#EAB308',
  },
  barLabel: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
  },
  barLabelPeak: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F4C430',
  },
  footerText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  loadingWrap: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
  },
});
