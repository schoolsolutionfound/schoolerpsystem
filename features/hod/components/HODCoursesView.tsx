import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { DepartmentCourse, CourseType } from '../types/hod.types';

interface HODCoursesViewProps {
  courses: DepartmentCourse[];
  refreshing: boolean;
  onRefresh: () => void;
  onAssignCourse: (course: DepartmentCourse) => void;
}

export const HODCoursesView: React.FC<HODCoursesViewProps> = ({
  courses,
  refreshing,
  onRefresh,
  onAssignCourse,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<CourseType | 'all'>('all');

  const semesters = ['all', ...Array.from(new Set(courses.map((c) => c.semester)))];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.instructorName && c.instructorName.toLowerCase().includes(search.toLowerCase()));

    const matchesSemester =
      selectedSemester === 'all' || c.semester.toLowerCase() === selectedSemester.toLowerCase();

    const matchesType = selectedType === 'all' || c.type === selectedType;

    return matchesSearch && matchesSemester && matchesType;
  });

  const getTypeColor = (type: CourseType) => {
    switch (type) {
      case 'theory':
        return '#2563EB';
      case 'practical_lab':
        return '#7C3AED';
      case 'elective':
        return '#D97706';
      case 'project':
        return '#059669';
    }
  };

  const formatType = (type: CourseType) => {
    switch (type) {
      case 'practical_lab':
        return 'LAB';
      default:
        return type.toUpperCase();
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by code (e.g. CS501), subject, or faculty..."
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs (Semester & Course Type) */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {semesters.map((sem) => {
            const isSelected = selectedSemester === sem;
            return (
              <TouchableOpacity
                key={sem}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedSemester(sem)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {sem === 'all' ? 'All Semesters' : sem}
                </Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.filterDivider} />

          {(['all', 'theory', 'practical_lab', 'elective'] as const).map((t) => {
            const isSelected = selectedType === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedType(t)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {t === 'all' ? 'All Types' : t === 'practical_lab' ? 'Labs' : t.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Course List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Showing <Text style={{ fontWeight: '800', color: '#171717' }}>{filteredCourses.length}</Text> Courses & Labs
          </Text>
        </View>

        {filteredCourses.map((c) => {
          const typeColor = getTypeColor(c.type);

          return (
            <View key={c.id} style={styles.courseCard}>
              {/* Card Header */}
              <View style={styles.cardTopRow}>
                <View style={styles.codeGroup}>
                  <Text style={styles.courseCode}>{c.code}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: `${typeColor}15`, borderColor: `${typeColor}40` }]}>
                    <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                      {formatType(c.type)}
                    </Text>
                  </View>
                  <Text style={styles.creditsText}>{c.credits} Credits</Text>
                </View>
                <Text style={styles.semesterText}>{c.semester}</Text>
              </View>

              {/* Title */}
              <Text style={styles.courseName}>{c.name}</Text>

              {/* Instructor Section */}
              <View style={styles.instructorRow}>
                <MaterialCommunityIcons
                  name="account-tie"
                  size={16}
                  color={c.instructorName ? '#4B5563' : '#DC2626'}
                />
                <Text style={styles.instructorLabel}>Faculty In-Charge:</Text>
                <Text
                  style={[
                    styles.instructorValue,
                    !c.instructorName && { color: '#DC2626', fontWeight: '800' },
                  ]}
                >
                  {c.instructorName || 'Unassigned'}
                </Text>
                {c.instructorRank && (
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{c.instructorRank.replace('_', ' ')}</Text>
                  </View>
                )}
              </View>

              {/* Syllabus Progress Meter */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressTitle}>Syllabus Coverage</Text>
                  <Text style={styles.progressPct}>{c.syllabusProgressPct}% Completed</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, c.syllabusProgressPct)}%`,
                        backgroundColor: c.syllabusProgressPct >= 70 ? '#10B981' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
                <View style={styles.progressFooter}>
                  <Text style={styles.hoursSub}>
                    Hours: {c.completedHours} of {c.totalPlannedHours} planned
                  </Text>
                  <Text style={styles.studentsSub}>
                    {c.enrolledStudentsCount} enrolled {c.labBatchesCount ? `(${c.labBatchesCount} lab batches)` : ''}
                  </Text>
                </View>
              </View>

              {/* Action Button */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.assignBtn, !c.instructorId && styles.assignBtnWarning]}
                  onPress={() => onAssignCourse(c)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="account-edit"
                    size={16}
                    color={!c.instructorId ? '#FFFFFF' : '#EA580C'}
                  />
                  <Text
                    style={[
                      styles.assignBtnText,
                      !c.instructorId && { color: '#FFFFFF', fontWeight: '800' },
                    ]}
                  >
                    {c.instructorId ? 'Reassign Faculty' : 'Assign Faculty Instructor'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {filteredCourses.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="book-open-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No courses found</Text>
            <Text style={styles.emptyStateSub}>Try adjusting your search or semester filter.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF7',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  filterChipTextSelected: {
    color: '#EA580C',
    fontWeight: '800',
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  summaryBar: {
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  courseCode: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
    fontFamily: FontFamily.poppins,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.poppins,
  },
  creditsText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontWeight: '600',
    fontFamily: FontFamily.poppins,
  },
  semesterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  courseName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  instructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  instructorLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  instructorValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  rankBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rankBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4B5563',
    textTransform: 'capitalize',
    fontFamily: FontFamily.poppins,
  },
  progressSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.chip,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 11,
    color: '#6B6B6B',
    fontWeight: '600',
    fontFamily: FontFamily.poppins,
  },
  progressPct: {
    fontSize: 12,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursSub: {
    fontSize: 10,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  studentsSub: {
    fontSize: 10,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  cardActions: {
    marginTop: 2,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.button,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    gap: 6,
  },
  assignBtnWarning: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    fontFamily: FontFamily.poppins,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
});
