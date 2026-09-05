import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface NoticeItem {
  id: string;
  title: string;
  category: 'Circular' | 'Exam' | 'Event' | 'Teacher Remark';
  date: string;
  sender: string;
  description: string;
  isUrgent?: boolean;
}

const NOTICES: NoticeItem[] = [
  {
    id: 'n1',
    title: 'Mid-Term Examination Datesheet & Syllabus',
    category: 'Exam',
    date: '04 Sep 2026',
    sender: 'Academic Controller',
    description:
      'Mid-term examinations will commence from September 18, 2026. Detailed time table and syllabus are uploaded in student section.',
    isUrgent: true,
  },
  {
    id: 'n2',
    title: 'Parent-Teacher Meeting (PTM) Scheduled',
    category: 'Event',
    date: '02 Sep 2026',
    sender: 'Principal Office',
    description:
      'Quarterly PTM is scheduled on Saturday, Sept 12 from 08:30 AM to 12:30 PM. Parents are requested to attend in their allotted slots.',
  },
  {
    id: 'n3',
    title: 'Commendable Performance in Science Lab Test',
    category: 'Teacher Remark',
    date: '30 Aug 2026',
    sender: 'Dr. Sunita Rao (Physics)',
    description:
      'Rohan displayed excellent problem-solving ability in the Optics experiment. Keep up the dedication!',
  },
  {
    id: 'n4',
    title: 'Annual Sports Day Registration Open',
    category: 'Circular',
    date: '28 Aug 2026',
    sender: 'Sports Dept.',
    description:
      'Registrations for Track & Field events (100m, 400m, Long Jump, Relay) are open till Sept 10.',
  },
];

export const ParentNoticesView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'exam' | 'remarks'>('all');

  const filteredNotices = NOTICES.filter((n) => {
    if (filter === 'exam') return n.category === 'Exam';
    if (filter === 'remarks') return n.category === 'Teacher Remark';
    return true;
  });

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Teacher Connect Quick Action */}
      <View style={styles.teacherConnectCard}>
        <View style={styles.teacherAvatar}>
          <MaterialCommunityIcons name="account-tie" size={24} color="#4F46E5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.teacherName}>Mrs. Kavita Verma</Text>
          <Text style={styles.teacherRole}>Class 10-A Teacher • Available 2-4 PM</Text>
        </View>
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={() => {
            Alert.alert(
              'Teacher Connect',
              'Connect with Mrs. Kavita Verma:\nPhone: +91 98112 34567\nEmail: kavita.verma@school.com'
            );
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="phone-message" size={16} color="#FFFFFF" />
          <Text style={styles.connectBtnText}>Contact</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
            All Notices ({NOTICES.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'exam' && styles.filterChipActive]}
          onPress={() => setFilter('exam')}
        >
          <Text style={[styles.filterText, filter === 'exam' && styles.filterTextActive]}>
            Exams & Datesheet
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filter === 'remarks' && styles.filterChipActive]}
          onPress={() => setFilter('remarks')}
        >
          <Text style={[styles.filterText, filter === 'remarks' && styles.filterTextActive]}>
            Teacher Remarks
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notices List */}
      <Text style={styles.sectionTitle}>Circulars & Updates</Text>
      {filteredNotices.map((notice) => {
        const isRemark = notice.category === 'Teacher Remark';
        return (
          <View key={notice.id} style={styles.noticeCard}>
            <View style={styles.noticeTop}>
              <View style={styles.categoryPill}>
                <MaterialCommunityIcons
                  name={
                    notice.category === 'Exam'
                      ? 'file-document-edit-outline'
                      : isRemark
                      ? 'star-outline'
                      : 'bullhorn-outline'
                  }
                  size={12}
                  color="#4F46E5"
                />
                <Text style={styles.categoryText}>{notice.category}</Text>
              </View>
              {notice.isUrgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
              <Text style={styles.noticeDate}>{notice.date}</Text>
            </View>

            <Text style={styles.noticeTitle}>{notice.title}</Text>
            <Text style={styles.noticeDesc}>{notice.description}</Text>

            <View style={styles.noticeFooter}>
              <View style={styles.senderGroup}>
                <MaterialCommunityIcons name="account-circle-outline" size={14} color="#64748B" />
                <Text style={styles.senderText}>{notice.sender}</Text>
              </View>

              <TouchableOpacity
                style={styles.shareBtn}
                onPress={() => {
                  Alert.alert('Notice Shared', 'Notice summary copied to clipboard.');
                }}
              >
                <MaterialCommunityIcons name="share-variant-outline" size={14} color="#4F46E5" />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  teacherConnectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    marginBottom: 16,
    gap: 10,
  },
  teacherAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  teacherName: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  teacherRole: { fontSize: 11, color: '#4F46E5', marginTop: 2 },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  connectBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterChipActive: { backgroundColor: '#4F46E5' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  noticeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 12,
  },
  noticeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: { fontSize: 9, fontWeight: '800', color: '#DC2626' },
  noticeDate: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  noticeTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B', marginBottom: 6 },
  noticeDesc: { fontSize: 12, color: '#475569', lineHeight: 18, marginBottom: 12 },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  senderGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  senderText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shareBtnText: { fontSize: 11, fontWeight: '700', color: '#4F46E5' },
});
