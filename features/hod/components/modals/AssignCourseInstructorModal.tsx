import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../../constants/theme';
import { FontFamily } from '../../../../constants/fonts';
import { DepartmentCourse, HODFacultyMember } from '../../types/hod.types';

interface AssignCourseInstructorModalProps {
  visible: boolean;
  course: DepartmentCourse | null;
  facultyList: HODFacultyMember[];
  onClose: () => void;
  onAssign: (courseId: string, facultyId: string, facultyName: string) => Promise<void>;
}

export const AssignCourseInstructorModal: React.FC<AssignCourseInstructorModalProps> = ({
  visible,
  course,
  facultyList,
  onClose,
  onAssign,
}) => {
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(course?.instructorId || '');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedFacultyId(course?.instructorId || '');
    setSearch('');
  }, [course]);

  if (!course) return null;

  const filteredFaculty = facultyList.filter((f) => {
    const q = search.toLowerCase();
    const rankLabel = f.rank.replace('_', ' ').toLowerCase();
    return (
      f.name.toLowerCase().includes(q) ||
      f.specialization.toLowerCase().includes(q) ||
      rankLabel.includes(q) ||
      f.employeeId.toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!selectedFacultyId) return;
    const faculty = facultyList.find((f) => f.id === selectedFacultyId);
    if (!faculty) return;

    setSaving(true);
    try {
      await onAssign(course.id, faculty.id, faculty.name);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    try {
      await onAssign(course.id, '', '');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const formatRank = (rank: string) => {
    switch (rank) {
      case 'professor':
        return 'Professor';
      case 'associate_professor':
        return 'Assoc. Professor';
      case 'assistant_professor':
        return 'Asst. Professor';
      case 'adjunct_lecturer':
        return 'Adjunct Lecturer';
      case 'lab_instructor':
        return 'Lab Instructor';
      default:
        return rank;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Assign Course Instructor</Text>
              <Text style={styles.subtitle}>
                {course.code} • {course.name} ({course.credits} Credits)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color="#6B6B6B" />
            </TouchableOpacity>
          </View>

          {/* Course Meta Chip */}
          <View style={styles.courseMetaBanner}>
            <View style={styles.badgeRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {course.type === 'practical_lab' ? 'Laboratory' : course.type.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.metaSemester}>{course.semester}</Text>
            </View>
            <Text style={styles.metaEnrolled}>
              Enrolled: <Text style={{ fontWeight: '700', color: '#171717' }}>{course.enrolledStudentsCount} students</Text>
            </Text>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons name="magnify" size={18} color="#9E9E9E" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by faculty name, rank, or domain..."
              placeholderTextColor="#9E9E9E"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={16} color="#9E9E9E" />
              </TouchableOpacity>
            )}
          </View>

          {/* Faculty List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {filteredFaculty.map((item) => {
              const isSelected = selectedFacultyId === item.id;
              const isOverloaded = item.assignedCredits >= item.maxCreditsPerWeek;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.facultyCard, isSelected && styles.facultyCardSelected]}
                  onPress={() => setSelectedFacultyId(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.radio}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.facultyName, isSelected && styles.facultyNameSelected]}>
                        {item.name}
                      </Text>
                      <View style={styles.rankPill}>
                        <Text style={styles.rankPillText}>{formatRank(item.rank)}</Text>
                      </View>
                    </View>
                    <Text style={styles.specializationText}>{item.specialization}</Text>
                    <View style={styles.workloadRow}>
                      <MaterialCommunityIcons
                        name="book-clock"
                        size={14}
                        color={isOverloaded ? '#EF4444' : '#6B6B6B'}
                      />
                      <Text style={[styles.workloadText, isOverloaded && { color: '#EF4444', fontWeight: '700' }]}>
                        Load: {item.assignedCredits} / {item.maxCreditsPerWeek} credits
                      </Text>
                      {item.assignedCourses.length > 0 && (
                        <Text style={styles.subjectsPreview}>
                          ({item.assignedCourses.join(', ')})
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {filteredFaculty.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-search" size={40} color="#D1D5DB" />
                <Text style={styles.emptyText}>No faculty members match your filter.</Text>
              </View>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            {course.instructorId ? (
              <TouchableOpacity
                style={styles.unassignBtn}
                onPress={handleUnassign}
                disabled={saving}
              >
                <Text style={styles.unassignBtnText}>Unassign</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.saveBtn,
                (!selectedFacultyId || selectedFacultyId === course.instructorId || saving) &&
                  styles.saveBtnDisabled,
              ]}
              onPress={handleSave}
              disabled={!selectedFacultyId || selectedFacultyId === course.instructorId || saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Assign Instructor</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  closeBtn: {
    padding: 4,
  },
  courseMetaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: BorderRadius.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    backgroundColor: '#EA580C',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
  metaSemester: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9A3412',
    fontFamily: FontFamily.poppins,
  },
  metaEnrolled: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  list: {
    maxHeight: 280,
  },
  facultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  facultyCardSelected: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#EA580C',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  facultyName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  facultyNameSelected: {
    color: '#C2410C',
  },
  rankPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  specializationText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  workloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  workloadText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  subjectsPreview: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  unassignBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  unassignBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    fontFamily: FontFamily.poppins,
  },
  saveBtn: {
    backgroundColor: '#EA580C',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#FED7AA',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
});
