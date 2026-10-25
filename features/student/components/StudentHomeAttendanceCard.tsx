import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { ShimmerSkeleton } from './ShimmerSkeleton';

interface StudentHomeAttendanceCardProps {
  loading?: boolean;
  overall?: { present: number; total: number; percentage: number } | null;
  currentSlot?: any;
}

export const StudentHomeAttendanceCard: React.FC<StudentHomeAttendanceCardProps> = ({
  loading,
  overall,
  currentSlot,
}) => {
  const pct = overall?.percentage;
  const periodStart = currentSlot?.period?.startTime || '';
  const periodEnd = currentSlot?.period?.endTime || '';

  return (
    <View style={styles.gridRow}>
      {/* Attendance Card */}
      <View style={styles.attendanceCard}>
        {/* Background image fully covering container with 5px radius */}
        <Image
          source={require('../../../assets/attendance-card-bg.png')}
          style={styles.cardBgImage}
          resizeMode="cover"
        />

        <View style={styles.cardContent}>
          <Text style={styles.attendanceLabel}>Attendance</Text>

          <View style={styles.attendanceBodyRow}>
            <View style={styles.attendanceTextCol}>
              {loading ? (
                <View style={{ gap: 4 }}>
                  <ShimmerSkeleton width={60} height={26} borderRadius={4} />
                  <ShimmerSkeleton width="85%" height={12} borderRadius={4} />
                </View>
              ) : (
                <>
                  <Text style={styles.attendanceValue}>
                    {pct !== undefined ? `${pct}%` : '89%'}
                  </Text>
                  <Text style={styles.attendanceSub}>
                    {overall && overall.total > 0
                      ? `${overall.present} of ${overall.total} classes`
                      : '16 of 18 classes'}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.calendarIconCircle}>
              <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#78350F" />
            </View>
          </View>
        </View>
      </View>

      {/* Current Period Card */}
      <View style={styles.periodCard}>
        {/* Background image fully covering container with 5px radius */}
        <Image
          source={require('../../../assets/current-period-card-bg.png')}
          style={styles.cardBgImage}
          resizeMode="cover"
        />

        <View style={styles.cardContent}>
          <Text style={styles.periodLabel}>Current Period</Text>

          <View style={styles.periodBodyRow}>
            <View style={styles.periodTextCol}>
              {loading ? (
                <View style={{ gap: 6, marginTop: 4 }}>
                  <ShimmerSkeleton width={90} height={16} borderRadius={4} />
                  <ShimmerSkeleton width={65} height={12} borderRadius={4} />
                </View>
              ) : (
                <>
                  <Text
                    style={styles.periodSubject}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.85}
                  >
                    {currentSlot?.subject?.name || 'No class now'}
                  </Text>
                  <Text style={styles.periodSub}>
                    {currentSlot
                      ? `${periodStart}${periodEnd ? ` – ${periodEnd}` : ''}`
                      : 'Free period'}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.clockIconCircle}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={20} color="#78350F" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  attendanceCard: {
    flex: 1,
    backgroundColor: '#FFFDF9',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    minHeight: 124,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  periodCard: {
    flex: 1,
    backgroundColor: '#FDC836',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    minHeight: 124,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  attendanceLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  attendanceBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  attendanceTextCol: {
    flex: 1,
    paddingRight: 2,
  },
  attendanceValue: {
    fontSize: 26,
    fontFamily: FontFamily.bold,
    color: '#292524',
  },
  calendarIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(254, 243, 199, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attendanceSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#78716C',
    marginTop: 2,
  },

  periodLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#1F2937',
  },
  periodBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  periodTextCol: {
    flex: 1,
    paddingRight: 2,
  },
  periodSubject: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginTop: 2,
  },
  periodSub: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: '#374151',
    opacity: 0.85,
    marginTop: 2,
  },
  clockIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

