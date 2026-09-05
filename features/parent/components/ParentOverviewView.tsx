import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface Props {
  onNavigateTab: (tab: 'attendance' | 'fees' | 'bus' | 'notices') => void;
}

export const ParentOverviewView: React.FC<Props> = ({ onNavigateTab }) => {
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Child Academic Snapshot Card */}
      <View style={styles.childCard}>
        <View style={styles.childCardTop}>
          <View>
            <Text style={styles.childCardSubtitle}>ACADEMIC OVERVIEW</Text>
            <Text style={styles.childCardName}>Rohan Verma • Class 10-A</Text>
          </View>
          <View style={styles.gpaBadge}>
            <Text style={styles.gpaText}>Grade A+ (91.8%)</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <TouchableOpacity
            style={styles.kpiBox}
            onPress={() => onNavigateTab('attendance')}
            activeOpacity={0.7}
          >
            <Text style={styles.kpiValue}>94.2%</Text>
            <Text style={styles.kpiLabel}>Attendance</Text>
            <Text style={styles.kpiStatusGood}>Eligible ✓</Text>
          </TouchableOpacity>

          <View style={styles.kpiDivider} />

          <TouchableOpacity
            style={styles.kpiBox}
            onPress={() => onNavigateTab('fees')}
            activeOpacity={0.7}
          >
            <Text style={[styles.kpiValue, { color: '#EF4444' }]}>₹18,100</Text>
            <Text style={styles.kpiLabel}>Pending Fees</Text>
            <Text style={styles.kpiAction}>Pay Now →</Text>
          </TouchableOpacity>

          <View style={styles.kpiDivider} />

          <TouchableOpacity
            style={styles.kpiBox}
            onPress={() => onNavigateTab('bus')}
            activeOpacity={0.7}
          >
            <Text style={[styles.kpiValue, { color: '#10B981' }]}>Route #4</Text>
            <Text style={styles.kpiLabel}>School Bus</Text>
            <Text style={styles.kpiStatusGood}>On Time</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Access Grid */}
      <Text style={styles.sectionTitle}>Parent Services</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('attendance')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <MaterialCommunityIcons name="calendar-check" size={24} color="#4F46E5" />
          </View>
          <Text style={styles.gridCardTitle}>Attendance</Text>
          <Text style={styles.gridCardSub}>Daily & monthly log</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('fees')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="credit-card-outline" size={24} color="#D97706" />
          </View>
          <Text style={styles.gridCardTitle}>Pay Fees</Text>
          <Text style={styles.gridCardSub}>UPI & receipts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('bus')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="bus-marker" size={24} color="#059669" />
          </View>
          <Text style={styles.gridCardTitle}>Track Bus</Text>
          <Text style={styles.gridCardSub}>Live GPS #4</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => onNavigateTab('notices')}
          activeOpacity={0.7}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FCE7F3' }]}>
            <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#DB2777" />
          </View>
          <Text style={styles.gridCardTitle}>Circulars</Text>
          <Text style={styles.gridCardSub}>Notices & PTM</Text>
        </TouchableOpacity>
      </View>

      {/* Live Alert Banner */}
      <View style={styles.alertCard}>
        <View style={styles.alertIconCircle}>
          <MaterialCommunityIcons name="bell-ring" size={20} color="#D97706" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>Mid-Term Exams Begin Sept 18</Text>
          <Text style={styles.alertSub}>Please clear Term 2 fee dues before Sept 15 for admit card.</Text>
        </View>
        <TouchableOpacity
          style={styles.alertBtn}
          onPress={() => onNavigateTab('fees')}
          activeOpacity={0.7}
        >
          <Text style={styles.alertBtnText}>Pay</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Schedule for Child */}
      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Today&apos;s Class Schedule</Text>
      <View style={styles.scheduleCard}>
        {[
          { time: '08:30 AM', subject: 'Mathematics', room: 'Room 204', teacher: 'Mr. Rajesh Sharma' },
          { time: '09:20 AM', subject: 'Physics & Lab', room: 'Physics Lab', teacher: 'Dr. Sunita Rao' },
          { time: '10:10 AM', subject: 'English Literature', room: 'Room 204', teacher: 'Ms. Ananya Sen' },
          { time: '11:20 AM', subject: 'Computer Science', room: 'Lab 2', teacher: 'Mr. Vikrant Mehra' },
        ].map((slot, i) => (
          <View key={i} style={[styles.scheduleRow, i > 0 && styles.scheduleDivider]}>
            <View style={styles.timeWrap}>
              <Text style={styles.scheduleTime}>{slot.time}</Text>
            </View>
            <View style={styles.scheduleDetails}>
              <Text style={styles.scheduleSubject}>{slot.subject}</Text>
              <Text style={styles.scheduleTeacher}>{slot.teacher} • {slot.room}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  childCard: {
    backgroundColor: '#1E1B4B',
    borderRadius: BorderRadius.card,
    padding: 18,
    marginBottom: 20,
  },
  childCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  childCardSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 0.8,
  },
  childCardName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 3,
  },
  gpaBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gpaText: { fontSize: 11, fontWeight: '800', color: '#FCD34D' },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
  },
  kpiBox: { flex: 1, alignItems: 'center' },
  kpiDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },
  kpiValue: { fontSize: 16, fontWeight: '900', color: '#FFFFFF' },
  kpiLabel: { fontSize: 10, color: '#CBD5E1', marginTop: 2 },
  kpiStatusGood: { fontSize: 10, fontWeight: '700', color: '#34D399', marginTop: 3 },
  kpiAction: { fontSize: 10, fontWeight: '800', color: '#FCA5A5', marginTop: 3 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
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
  gridCardTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  gridCardSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#FDE68A',
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  alertIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  alertSub: { fontSize: 11, color: '#B45309', marginTop: 2 },
  alertBtn: {
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  alertBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  scheduleDivider: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeWrap: {
    width: 76,
  },
  scheduleTime: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
  scheduleDetails: { flex: 1, marginLeft: 8 },
  scheduleSubject: { fontSize: 13, fontWeight: '700', color: '#1E293B' },
  scheduleTeacher: { fontSize: 11, color: '#64748B', marginTop: 2 },
});
