import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

export const StudentHomePeriodsList: React.FC = () => {
  return (
    <View style={styles.periodsSection}>
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons name="calendar-month-outline" size={20} color="#7E57C2" />
        <Text style={styles.sectionHeaderTitle}>Today's Periods</Text>
      </View>

      <View style={styles.periodsListCard}>
        {/* Period 1 */}
        <View style={styles.periodRow}>
          <View style={styles.periodBadge}>
            <Text style={styles.periodBadgeNum}>1st</Text>
            <Text style={styles.periodBadgeSub}>Period</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={styles.timeText}>08:00 AM</Text>
            <Text style={styles.timeSubText}>– 08:50 AM</Text>
          </View>
          <View style={styles.iconSubjectWrap}>
            <View style={[styles.subjectIconCircle, { backgroundColor: '#E0F2FE' }]}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={18} color="#0284C7" />
            </View>
            <View>
              <Text style={styles.subjectName}>English</Text>
              <Text style={styles.roomName}>Room 101</Text>
            </View>
          </View>
          <View style={styles.checkDoneCircle}>
            <MaterialCommunityIcons name="check" size={16} color="#16A34A" />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Period 2 */}
        <View style={styles.periodRow}>
          <View style={styles.periodBadge}>
            <Text style={styles.periodBadgeNum}>2nd</Text>
            <Text style={styles.periodBadgeSub}>Period</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={styles.timeText}>08:50 AM</Text>
            <Text style={styles.timeSubText}>– 09:40 AM</Text>
          </View>
          <View style={styles.iconSubjectWrap}>
            <View style={[styles.subjectIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="flask-outline" size={18} color="#D97706" />
            </View>
            <View>
              <Text style={styles.subjectName}>Science</Text>
              <Text style={styles.roomName}>Room 203</Text>
            </View>
          </View>
          <View style={styles.checkDoneCircle}>
            <MaterialCommunityIcons name="check" size={16} color="#16A34A" />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Period 3 (Active Now) */}
        <View style={[styles.periodRow, styles.activePeriodRow]}>
          <View style={[styles.periodBadge, styles.activePeriodBadge]}>
            <Text style={[styles.periodBadgeNum, { color: '#FFFFFF' }]}>3rd</Text>
            <Text style={[styles.periodBadgeSub, { color: '#FFFFFF' }]}>Period</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={[styles.timeText, { color: '#7E57C2' }]}>09:40 AM</Text>
            <Text style={styles.timeSubText}>– 10:30 AM</Text>
          </View>
          <View style={styles.iconSubjectWrap}>
            <View style={[styles.subjectIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <MaterialCommunityIcons name="calculator-variant-outline" size={18} color="#7E57C2" />
            </View>
            <View>
              <Text style={styles.subjectName}>Mathematics</Text>
              <Text style={styles.roomName}>Room 204</Text>
            </View>
          </View>
          <View style={styles.nowChip}>
            <Text style={styles.nowChipText}>Now</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Period 4 */}
        <View style={styles.periodRow}>
          <View style={styles.periodBadge}>
            <Text style={styles.periodBadgeNum}>4th</Text>
            <Text style={styles.periodBadgeSub}>Period</Text>
          </View>
          <View style={styles.timeWrap}>
            <Text style={styles.timeText}>10:45 AM</Text>
            <Text style={styles.timeSubText}>– 11:35 AM</Text>
          </View>
          <View style={styles.iconSubjectWrap}>
            <View style={[styles.subjectIconCircle, { backgroundColor: '#DCFCE7' }]}>
              <MaterialCommunityIcons name="earth" size={18} color="#16A34A" />
            </View>
            <View>
              <Text style={styles.subjectName}>Social Studies</Text>
              <Text style={styles.roomName}>Room 105</Text>
            </View>
          </View>
          <View style={{ width: 28 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  periodsSection: { gap: 10 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionHeaderTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  periodsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  activePeriodRow: { backgroundColor: '#FAF5FF' },
  periodBadge: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activePeriodBadge: { backgroundColor: '#7E57C2', borderColor: '#7E57C2' },
  periodBadgeNum: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  periodBadgeSub: { fontSize: 9, color: '#64748B' },
  timeWrap: { width: 70 },
  timeText: { fontSize: 12, fontWeight: '700', color: '#1E293B' },
  timeSubText: { fontSize: 10, color: '#94A3B8' },
  iconSubjectWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  subjectIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectName: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  roomName: { fontSize: 11, color: '#94A3B8' },
  checkDoneCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nowChip: {
    backgroundColor: '#7E57C2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.chip,
  },
  nowChipText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
});
