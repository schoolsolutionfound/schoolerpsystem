import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { FontFamily } from '../../../constants/fonts';
import { TeacherShimmerSkeleton } from './common/TeacherShimmer';

interface TeacherDonutCardProps {
  completed: number;
  total: number;
  loading?: boolean;
}

function Donut({
  value,
  max,
  label,
  gradientId,
  showProgress = true,
}: {
  value: number;
  max: number;
  label: string;
  gradientId: string;
  showProgress?: boolean;
}) {
  const size = 120;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = showProgress && max > 0 ? value / max : 0;
  const offset = circumference * (1 - progress);
  const angle = -90 + 360 * progress;
  const rad = (angle * Math.PI) / 180;
  const tipX = size / 2 + radius * Math.cos(rad);
  const tipY = size / 2 + radius * Math.sin(rad);

  return (
    <View style={donutStyles.col}>
      <View style={donutStyles.wrap}>
        <Svg width={size} height={size}>
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={gradientId === 'dg2' ? '#FED7AA' : '#FFD700'} />
              <Stop offset="0.5" stopColor={gradientId === 'dg2' ? '#FDBA74' : '#F4C430'} />
              <Stop offset="1" stopColor={gradientId === 'dg2' ? '#FB923C' : '#E8B800'} />
            </LinearGradient>
          </Defs>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </G>
          {showProgress && max > 0 && value > 0 && (
            <>
              <Circle cx={tipX} cy={tipY} r={6} fill={gradientId === 'dg2' ? '#FB923C' : '#F4C430'} opacity={0.25} />
              <Circle cx={tipX} cy={tipY} r={3} fill={gradientId === 'dg2' ? '#FB923C' : '#F4C430'} />
            </>
          )}
        </Svg>
        <View style={donutStyles.centerLabel}>
          <Text style={donutStyles.centerValue}>{value}</Text>
          <Text style={donutStyles.centerUnit}>classes</Text>
        </View>
      </View>
      <Text style={donutStyles.label}>{label}</Text>
    </View>
  );
}

const donutStyles = StyleSheet.create({
  col: { alignItems: 'center', gap: 8 },
  wrap: { alignItems: 'center', justifyContent: 'center' },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: { fontSize: 22, fontFamily: FontFamily.extrabold, color: '#111827' },
  centerUnit: { fontSize: 9, fontFamily: FontFamily.medium, color: '#9CA3AF', marginTop: -1 },
  label: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#4B5563' },
});

export const TeacherDonutCard: React.FC<TeacherDonutCardProps> = ({
  completed,
  total,
  loading,
}) => {
  const remaining = Math.max(0, total - completed);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Today&apos;s Progress</Text>
          <Text style={styles.subtitle}>
            {completed} of {total} classes marked
          </Text>
        </View>
        {total > 0 && (
          <View style={styles.pctBadge}>
            <Text style={styles.pctBadgeText}>{pct}%</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.donutsRow}>
          <View style={donutStyles.col}>
            <TeacherShimmerSkeleton width={110} height={110} borderRadius={55} />
            <TeacherShimmerSkeleton width={64} height={12} borderRadius={5} style={{ marginTop: 8 }} />
          </View>
          <View style={donutStyles.col}>
            <TeacherShimmerSkeleton width={110} height={110} borderRadius={55} />
            <TeacherShimmerSkeleton width={64} height={12} borderRadius={5} style={{ marginTop: 8 }} />
          </View>
        </View>
      ) : (
        <View style={styles.donutsRow}>
          <Donut value={completed} max={total} label="Completed" gradientId="dg1" showProgress={true} />
          <Donut value={remaining} max={total} label="Remaining" gradientId="dg2" showProgress={true} />
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#111827' },
  subtitle: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 2 },
  pctBadge: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  pctBadgeText: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
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
  donutsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 4,
  },
});
