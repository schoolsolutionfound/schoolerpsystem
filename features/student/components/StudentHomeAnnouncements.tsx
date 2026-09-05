/**
 * @file StudentHomeAnnouncements.tsx
 * @description School announcements, circulars, and event notifications for students.
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';

interface AnnouncementItem {
  id: string;
  title: string;
  category: 'Academic' | 'Sports' | 'Exam' | 'Admin';
  date: string;
  summary: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
}

const SAMPLE_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-1',
    title: 'Mid-Term Examination Datesheet Released',
    category: 'Exam',
    date: 'Sep 10 - Sep 22, 2026',
    summary: 'The official datesheet for Term 1 board preparatory exams is now available.',
    icon: 'file-document-edit-outline',
    color: '#D97706',
    bgColor: '#FEF3C7',
  },
  {
    id: 'ann-2',
    title: 'Annual Inter-House Sports Meet 2026',
    category: 'Sports',
    date: 'Fri, Sep 18, 2026',
    summary: 'Registration open for 100m, 400m relay, Football, and Basketball events.',
    icon: 'trophy-outline',
    color: '#16A34A',
    bgColor: '#DCFCE7',
  },
  {
    id: 'ann-3',
    title: 'National Science Exhibition & Robotics Fair',
    category: 'Academic',
    date: 'Oct 02, 2026',
    summary: 'Submit working science models and robotics projects to the physics lab.',
    icon: 'atom',
    color: '#7E57C2',
    bgColor: '#EDE7F6',
  },
];

export const StudentHomeAnnouncements: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="bullhorn-outline" size={20} color="#7E57C2" />
          <Text style={styles.headerTitle}>Notice Board & Circulars</Text>
        </View>
        <Text style={styles.headerBadge}>{SAMPLE_ANNOUNCEMENTS.length} New</Text>
      </View>

      <View style={styles.list}>
        {SAMPLE_ANNOUNCEMENTS.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
              <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
            </View>

            <View style={styles.content}>
              <View style={styles.metaRow}>
                <View style={[styles.categoryTag, { backgroundColor: item.bgColor }]}>
                  <Text style={[styles.categoryText, { color: item.color }]}>{item.category}</Text>
                </View>
                <Text style={styles.dateText}>{item.date}</Text>
              </View>

              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.summary}>{item.summary}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 4 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
  headerBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7E57C2',
    backgroundColor: '#EDE7F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  list: { gap: 10 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  categoryText: { fontSize: 10, fontWeight: '700' },
  dateText: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  title: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  summary: { fontSize: 12, color: '#64748B', lineHeight: 16 },
});
