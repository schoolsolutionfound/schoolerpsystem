import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface ParentHomeDashboardProps {
  childName: string;
  overallAttendance: { present: number; total: number; percentage: number } | null;
  onTabSwitch: (tab: string) => void;
  onViewProfile?: () => void;
}

export const ParentHomeDashboard: React.FC<ParentHomeDashboardProps> = ({
  childName,
  overallAttendance,
  onTabSwitch,
  onViewProfile,
}) => {
  const pct = overallAttendance?.percentage ?? 0;
  const present = overallAttendance?.present ?? 0;
  const total = overallAttendance?.total ?? 0;

  return (
    <View style={styles.container}>
      {/* Two-card grid — same as student attendance card */}
      <View style={styles.gridRow}>
        <View style={[styles.gridCard, styles.attendanceCard]}>
          <Text style={styles.cardLabel}>Attendance</Text>
          <View style={styles.gaugeRow}>
            <Text style={styles.gaugeValue}>{pct}%</Text>
            <View style={styles.gaugeIcon}>
              <MaterialCommunityIcons name="book-check" size={22} color="#F4C430" />
            </View>
          </View>
          <Text style={styles.cardSub}>{present} of {total} classes</Text>
        </View>

        <View style={[styles.gridCard, styles.childCard]}>
          <Text style={styles.cardLabelDark}>Linked Child</Text>
          <Text style={styles.childName}>{childName || '—'}</Text>
          <TouchableOpacity style={styles.childTag} onPress={onViewProfile} activeOpacity={0.7}>
            <Text style={styles.childTagText}>View Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Announcements — same style as student */}
      <View style={styles.announcementCard}>
        <View style={styles.announcementIconWrap}>
          <MaterialCommunityIcons name="bullhorn-outline" size={24} color="#1A1B1C" />
        </View>
        <View style={styles.announcementContent}>
          <Text style={styles.announcementTitle}>Announcements</Text>
          <Text style={styles.announcementBody}>No announcements yet.</Text>
          <Text style={styles.announcementSub}>School announcements will appear here.</Text>
        </View>
      </View>

      {/* Admissions Hero Banner */}
      <View style={styles.admissionBanner}>
        <View style={styles.admissionBadge}>
          <MaterialCommunityIcons name="creation" size={13} color="#D97706" />
          <Text style={styles.admissionBadgeText}>ADMISSIONS OPEN 2026</Text>
        </View>
        <Text style={styles.admissionTitle}>Find & Apply to Top Schools</Text>
        <Text style={styles.admissionSubtitle}>
          {childName
            ? 'Exploring new schools or sibling admissions? Discover top institutions and apply online.'
            : 'Welcome! Discover verified schools, explore facilities, compare fee structures & submit applications.'}
        </Text>
        <View style={styles.admissionBtnRow}>
          <TouchableOpacity
            style={styles.admissionPrimaryBtn}
            onPress={() => onTabSwitch('discover')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="compass" size={17} color="#1A1B1C" />
            <Text style={styles.admissionPrimaryBtnText}>Explore Schools</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.admissionSecondaryBtn}
            onPress={() => onTabSwitch('applications')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="file-document-edit-outline" size={17} color="#FFFFFF" />
            <Text style={styles.admissionSecondaryBtnText}>Track Applications</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* What You Can Do — stacked list */}
      <Text style={styles.sectionTitle}>What You Can Do</Text>

      <TouchableOpacity style={styles.listCard} onPress={() => onTabSwitch('discover')} activeOpacity={0.7}>
        <View style={[styles.listIcon, { backgroundColor: '#FEF3C7' }]}>
          <MaterialCommunityIcons name="compass-outline" size={24} color="#D97706" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>School Discovery & Admissions</Text>
          <Text style={styles.listDesc}>Browse top institutions, compare fees & apply</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#C0C0C0" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.listCard} onPress={() => onTabSwitch('applications')} activeOpacity={0.7}>
        <View style={[styles.listIcon, { backgroundColor: '#EDE9FE' }]}>
          <MaterialCommunityIcons name="file-document-edit-outline" size={24} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>My Admission Applications</Text>
          <Text style={styles.listDesc}>Track real-time status of submitted applications</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#C0C0C0" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.listCard} onPress={() => onTabSwitch('attendance')} activeOpacity={0.7}>
        <View style={styles.listIcon}>
          <MaterialCommunityIcons name="book-check-outline" size={24} color="#1A1B1C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>View Attendance</Text>
          <Text style={styles.listDesc}>Check daily attendance and monthly trends</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#C0C0C0" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.listCard} onPress={() => onTabSwitch('marks')} activeOpacity={0.7}>
        <View style={styles.listIcon}>
          <MaterialCommunityIcons name="certificate-outline" size={24} color="#1A1B1C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>Exam Results</Text>
          <Text style={styles.listDesc}>View marks and grades for each subject</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#C0C0C0" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.listCard} onPress={() => onTabSwitch('fees')} activeOpacity={0.7}>
        <View style={styles.listIcon}>
          <MaterialCommunityIcons name="cash" size={24} color="#1A1B1C" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.listTitle}>Fee Status</Text>
          <Text style={styles.listDesc}>Check pending dues and payment history</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#C0C0C0" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 14 },
  gridRow: { flexDirection: 'row', gap: 12 },
  gridCard: {
    flex: 1,
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  attendanceCard: {
    backgroundColor: '#1A1B1C',
    borderColor: '#2A2B2C',
  },
  childCard: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  cardLabel: { fontSize: 12, fontFamily: FontFamily.bold, color: '#A0A0A0' },
  cardLabelDark: { fontSize: 12, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  gaugeValue: { fontSize: 26, fontFamily: FontFamily.extrabold, color: '#F4C430' },
  gaugeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(244,196,48,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#A0A0A0' },
  childName: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#1A1B1C', marginTop: 4 },
  childTag: {
    backgroundColor: 'rgba(26,27,28,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.chip,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  childTagText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#171717' },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  listIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  listDesc: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', marginTop: 2 },
  announcementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    alignItems: 'flex-start',
  },
  announcementIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  announcementContent: { flex: 1, gap: 4 },
  announcementTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#171717' },
  announcementBody: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B6B6B', lineHeight: 17 },
  announcementSub: { fontSize: 11, fontFamily: FontFamily.regular, color: '#6B6B6B', lineHeight: 15 },

  // Admissions Hero Banner
  admissionBanner: {
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.card,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  admissionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.chip,
    alignSelf: 'flex-start',
  },
  admissionBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.extrabold,
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  admissionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    marginTop: 2,
  },
  admissionSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#94A3B8',
    lineHeight: 18,
  },
  admissionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  admissionPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  admissionPrimaryBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#1A1B1C',
  },
  admissionSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  admissionSecondaryBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
