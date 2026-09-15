import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface TeacherDonutCardProps {
  completed: number;
  total: number;
  loading?: boolean;
}

function Donut({ value, max, label, gradientId, showProgress = true }: { value: number; max: number; label: string; gradientId: string; showProgress?: boolean }) {
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
              <Stop offset="0" stopColor="#FFD700" />
              <Stop offset="0.5" stopColor="#F4C430" />
              <Stop offset="1" stopColor="#E8B800" />
            </LinearGradient>
          </Defs>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#2A2B2C"
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
              <Circle cx={tipX} cy={tipY} r={6} fill="#F4C430" opacity={0.25} />
              <Circle cx={tipX} cy={tipY} r={3} fill="#F4C430" />
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
  centerValue: { fontSize: 22, fontFamily: FontFamily.extrabold, color: '#171717' },
  centerUnit: { fontSize: 9, fontFamily: FontFamily.regular, color: '#9CA3AF', marginTop: -1 },
  label: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#6B6B6B' },
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
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <View style={styles.donutsRow}>
          <Donut value={completed} max={total} label="Completed" gradientId="dg1" />
          <Donut value={remaining} max={total} label="Remaining" gradientId="dg2" showProgress={false} />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#171717' },
  subtitle: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 2 },
  pctBadge: {
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  pctBadgeText: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: '#D4A418',
  },
  loadingWrap: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
  },
  donutsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 24,
  },
});
