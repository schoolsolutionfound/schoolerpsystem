import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

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
  const chartHeight = 120;
  const barWidth = 28;
  const gap = 18;
  const totalWidth = gap + 5 * (barWidth + gap) - gap;
  const totalPeriods = weekData.reduce((a, b) => a + b, 0);
  const avg = totalPeriods > 0 ? Math.round(totalPeriods / weekData.filter((v) => v > 0).length) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Weekly Overview</Text>
          <Text style={styles.subtitle}>{totalPeriods} total periods scheduled</Text>
        </View>
        <View style={styles.avgBadge}>
          <Text style={styles.avgValue}>{avg}</Text>
          <Text style={styles.avgLabel}>avg/day</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <View style={styles.chartWithYAxis}>
            <View style={styles.yAxis}>
              {[maxVal, Math.round(maxVal * 0.66), Math.round(maxVal * 0.33), 0].map((val, i) => (
                <Text key={i} style={styles.yLabel}>{val}</Text>
              ))}
            </View>

            <View style={styles.barsWrap}>
              <Svg width={totalWidth} height={chartHeight + 8}>
                <Defs>
                  <LinearGradient id="barGold" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor="#FFD700" />
                    <Stop offset="0.5" stopColor="#F4C430" />
                    <Stop offset="1" stopColor="#D4A418" />
                  </LinearGradient>
                </Defs>

                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                  <React.Fragment key={`grid-${i}`}>
                    <Rect
                      x={0}
                      y={chartHeight * (1 - ratio)}
                      width={totalWidth}
                      height={0.5}
                      fill="#F0F0F0"
                    />
                  </React.Fragment>
                ))}

                {weekData.map((val, i) => {
                  const barHeight = maxVal > 0 ? (val / maxVal) * (chartHeight - 12) : 0;
                  const x = gap + i * (barWidth + gap);
                  const y = chartHeight - barHeight;
                  const isActive = val === maxVal && val > 0;
                  return (
                    <React.Fragment key={i}>
                      <Rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={6}
                        ry={6}
                        fill="#F0F0F0"
                        opacity={val === 0 ? 0.5 : 1}
                      />
                      {val > 0 && (
                        <Rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={barHeight}
                          rx={6}
                          ry={6}
                          fill="url(#barGold)"
                          opacity={isActive ? 1 : 0.8}
                        />
                      )}
                      {isActive && (
                        <Circle
                          cx={x + barWidth / 2}
                          cy={y - 6}
                          r={3}
                          fill="#F4C430"
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </Svg>

              <View style={styles.labelsRow}>
                {DAY_LABELS.map((label, i) => (
                  <View key={i} style={[styles.labelCell, { width: barWidth + gap }]}>
                    <Text style={[styles.barValue, weekData[i] === maxVal && weekData[i] > 0 && styles.barValueHighlight]}>
                      {weekData[i] > 0 ? weekData[i] : '—'}
                    </Text>
                    <Text style={styles.barLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <View style={styles.footerDot} />
              <Text style={styles.footerText}>Periods per day</Text>
            </View>
            <View style={styles.footerItem}>
              <View style={[styles.footerDot, { backgroundColor: '#E8E5DC' }]} />
              <Text style={styles.footerText}>Empty slots</Text>
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
    borderRadius: BorderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#171717' },
  subtitle: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 2 },
  avgBadge: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
    alignItems: 'center',
  },
  avgValue: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#D4A418' },
  avgLabel: { fontSize: 9, fontFamily: FontFamily.regular, color: '#9CA3AF', marginTop: 1 },
  chartContainer: { gap: 12 },
  chartWithYAxis: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  yAxis: {
    height: 120,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  yLabel: { fontSize: 9, color: '#9CA3AF', fontWeight: '600' },
  barsWrap: { flex: 1 },
  labelsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  labelCell: {
    alignItems: 'center',
  },
  barValue: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: '#6B6B6B',
    marginBottom: 3,
  },
  barValueHighlight: {
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  barLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#6B6B6B',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
  footerText: { fontSize: 10, color: '#9CA3AF' },
  loadingWrap: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
