/**
 * @file StudentHomeAssignments.tsx
 * @description Homework, Assignments & Test Tracker for students.
 */

import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { showAlert } from '../../shared/utils/showAlert';

interface AssignmentItem {
  id: string;
  subject: string;
  title: string;
  dueDate: string;
  isSubmitted: boolean;
  teacher: string;
  color: string;
  bgColor: string;
}

const SAMPLE_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 'asg-1',
    subject: 'Mathematics',
    title: 'Ex 4.2 Quadratic Equations Practice & Solutions',
    dueDate: 'Tomorrow, 11:59 PM',
    isSubmitted: false,
    teacher: 'Mr. Rajesh Sharma',
    color: '#7E57C2',
    bgColor: '#EDE7F6',
  },
  {
    id: 'asg-2',
    subject: 'Physics Lab',
    title: 'Experiment 5: Focal Length of Convex Lens Record',
    dueDate: 'Fri, Sep 05',
    isSubmitted: false,
    teacher: 'Dr. Sunita Rao',
    color: '#0284C7',
    bgColor: '#E0F2FE',
  },
  {
    id: 'asg-3',
    subject: 'Computer Science',
    title: 'Mini Project: Python File Handling & Student ERP Model',
    dueDate: 'Mon, Sep 08',
    isSubmitted: true,
    teacher: 'Mr. Vikrant Mehra',
    color: '#16A34A',
    bgColor: '#DCFCE7',
  },
];

export const StudentHomeAssignments: React.FC = () => {
  const [items, setItems] = useState<AssignmentItem[]>(SAMPLE_ASSIGNMENTS);

  const toggleSubmit = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, isSubmitted: !item.isSubmitted }
          : item
      )
    );
    const it = items.find((x) => x.id === id);
    if (it && !it.isSubmitted) {
      showAlert('Assignment Submitted', `Marked "${it.title}" as completed & submitted to teacher.`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#7E57C2" />
          <Text style={styles.headerTitle}>Homework & Assignments</Text>
        </View>
        <Text style={styles.pendingBadge}>
          {items.filter((i) => !i.isSubmitted).length} Pending
        </Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.topRow}>
              <View style={[styles.subBadge, { backgroundColor: item.bgColor }]}>
                <Text style={[styles.subBadgeText, { color: item.color }]}>{item.subject}</Text>
              </View>

              <Text style={styles.dueText}>Due: {item.dueDate}</Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.teacherText}>Assigned by: {item.teacher}</Text>

            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[styles.submitBtn, item.isSubmitted ? styles.submittedBtn : styles.unsubmittedBtn]}
                onPress={() => toggleSubmit(item.id)}
              >
                <MaterialCommunityIcons
                  name={item.isSubmitted ? 'check-circle' : 'checkbox-blank-circle-outline'}
                  size={16}
                  color={item.isSubmitted ? '#16A34A' : '#7E57C2'}
                />
                <Text style={[styles.submitBtnText, { color: item.isSubmitted ? '#16A34A' : '#7E57C2' }]}>
                  {item.isSubmitted ? 'Completed' : 'Mark as Done'}
                </Text>
              </TouchableOpacity>
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
  pendingBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  list: { gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  subBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  subBadgeText: { fontSize: 10, fontWeight: '700' },
  dueText: { fontSize: 11, color: '#DC2626', fontWeight: '600' },
  title: { fontSize: 13, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  teacherText: { fontSize: 11, color: '#64748B' },
  footerRow: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  submittedBtn: { backgroundColor: '#DCFCE7' },
  unsubmittedBtn: { backgroundColor: '#EDE7F6' },
  submitBtnText: { fontSize: 11, fontWeight: '700' },
});
