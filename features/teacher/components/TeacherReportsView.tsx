import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { Feather } from './common/Icons';
import { FontFamily } from '../../../constants/fonts';
import { fetchTeacherTimetableApi } from '../../../api/academics';
import { StudentMarksCardReport } from './reports/StudentMarksCardReport';
import { AttendanceStudentReport } from './reports/AttendanceStudentReport';
import { TeacherReportsSkeleton } from './skeletons';

export type ReportTabType = 'marks-card' | 'attendance';

export interface TeacherClassCard {
  id: string;
  className: string;
  sectionName: string;
  subjectName?: string;
  studentCount?: number;
}

const DEFAULT_TEACHER_CLASSES: TeacherClassCard[] = [
  { id: 'tc-1', className: 'Class 8', sectionName: 'A', subjectName: 'Mathematics', studentCount: 32 },
  { id: 'tc-2', className: 'Class 9', sectionName: 'B', subjectName: 'Algebra', studentCount: 30 },
  { id: 'tc-3', className: 'Class 9', sectionName: 'C', subjectName: 'Algebra', studentCount: 28 },
  { id: 'tc-4', className: 'Class 10', sectionName: 'A', subjectName: 'Mathematics', studentCount: 34 },
  { id: 'tc-5', className: 'Class 10', sectionName: 'B', subjectName: 'Geometry', studentCount: 31 },
  { id: 'tc-6', className: 'Class 11', sectionName: 'B', subjectName: 'Physics', studentCount: 29 },
  { id: 'tc-7', className: 'Class 12', sectionName: 'A', subjectName: 'Chemistry', studentCount: 27 },
];

export const TeacherReportsView: React.FC = () => {
  // Step 1: Selected class card. When null, displays the classes taken by the teacher.
  const [selectedClassCard, setSelectedClassCard] = useState<TeacherClassCard | null>(null);

  // Dynamic teacher classes list
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassCard[]>(DEFAULT_TEACHER_CLASSES);

  // Search filter for classes list
  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Tab switcher in reports view
  const [activeTab, setActiveTab] = useState<ReportTabType>('marks-card');

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load teacher's dynamic timetable classes if available
  const loadClasses = useCallback(async () => {
    try {
      const ttRes: any = await fetchTeacherTimetableApi();
      if (ttRes?.periods && Array.isArray(ttRes.periods) && ttRes.periods.length > 0) {
        const cardMap = new Map<string, TeacherClassCard>();
        ttRes.periods.forEach((p: any, idx: number) => {
          const rawName = p.classSectionName || p.classSection?.name || '';
          const sub = p.subject?.name || p.subjectName || '';
          if (rawName) {
            const parts = rawName.split('-');
            const cName = parts[0]?.trim() || rawName;
            const sName = parts[1]?.trim() || 'A';
            const fullCls = cName.toLowerCase().startsWith('class') ? cName : `Class ${cName}`;
            const key = `${fullCls}_${sName}`;
            if (!cardMap.has(key)) {
              cardMap.set(key, {
                id: `tc-dyn-${idx}`,
                className: fullCls,
                sectionName: sName,
                subjectName: sub || 'Mathematics',
                studentCount: 30 + ((idx * 3) % 6),
              });
            }
          }
        });
        if (cardMap.size > 0) {
          setTeacherClasses(Array.from(cardMap.values()));
        }
      }
    } catch {
      // Fallback to default teacher classes
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  }, [loadClasses]);

  // Filtered classes taken by the teacher
  const filteredTeacherClasses = useMemo(() => {
    if (!classSearchQuery.trim()) return teacherClasses;
    const q = classSearchQuery.toLowerCase().trim();
    return teacherClasses.filter(
      (c) =>
        c.className.toLowerCase().includes(q) ||
        c.sectionName.toLowerCase().includes(q) ||
        (c.subjectName && c.subjectName.toLowerCase().includes(q))
    );
  }, [teacherClasses, classSearchQuery]);

  const handleSelectClass = (item: TeacherClassCard) => {
    setSelectedClassCard(item);
  };

  // =========================================================================
  // VIEW 1: FIRST SHOW ALL CLASSES TAKEN BY THIS TEACHER IN RECTANGULAR BOXES
  // =========================================================================
  if (!selectedClassCard) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.classesScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#000000"
              colors={['#000000']}
              progressBackgroundColor="#FFFFFF"
            />
          }
        >
          {/* Header Title */}
          <View style={styles.classesHeader}>
            <Text style={styles.headerTitle}>Reports</Text>
          </View>

          {/* Search Box */}
          <View style={styles.classSearchBox}>
            <TextInput
              style={styles.classSearchInput}
              placeholder="Search class or section..."
              placeholderTextColor="#9CA3AF"
              value={classSearchQuery}
              onChangeText={setClassSearchQuery}
              returnKeyType="search"
            />
            {classSearchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setClassSearchQuery('')} hitSlop={8}>
                <Text style={styles.clearSearchText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Section Title Row (No background box on count) */}
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>CLASSES TAKEN BY YOU</Text>
            <Text style={styles.classCountText}>
              {filteredTeacherClasses.length} {filteredTeacherClasses.length === 1 ? 'Class' : 'Classes'}
            </Text>
          </View>

          {/* Rectangular Containers List */}
          <View style={styles.classListWrap}>
            {loading ? (
              <TeacherReportsSkeleton />
            ) : filteredTeacherClasses.length === 0 ? (
              <View style={styles.emptyClassesCard}>
                <Text style={styles.emptyClassesText}>No matching classes found</Text>
              </View>
            ) : (
              filteredTeacherClasses.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.rectangularClassCard}
                  activeOpacity={0.8}
                  onPress={() => handleSelectClass(item)}
                >
                  <View style={styles.classCardLeft}>
                    {/* No background box on Section */}
                    <View style={styles.classNameSectionRow}>
                      <Text style={styles.cardClassName}>{item.className}</Text>
                      <Text style={styles.cardSectionText}>Section {item.sectionName}</Text>
                    </View>
                    <View style={styles.cardSubjectRow}>
                      <Text style={styles.cardSubjectText}>{item.subjectName || 'General'}</Text>
                    </View>
                  </View>

                  <View style={styles.classCardRight}>
                    <View style={styles.viewReportsBtn}>
                      <Text style={styles.viewReportsBtnText}>View Reports</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // =========================================================================
  // VIEW 2: REPORTS FOR THE SELECTED CLASS
  // =========================================================================
  return (
    <View style={styles.container}>
      {/* Top Navigation Bar: Back Icon, Selected Class Info, & Plain Text Change Class */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={() => setSelectedClassCard(null)}
        >
          <Feather name="arrow-left" size={18} color="#111827" />
        </TouchableOpacity>

        <View style={styles.topNavTextWrap}>
          <Text style={styles.topNavTitle}>
            {selectedClassCard.className} · Section {selectedClassCard.sectionName}
          </Text>
          <Text style={styles.topNavSubjectText}>
            {selectedClassCard.subjectName || 'General'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.changeClassBtn}
          activeOpacity={0.7}
          onPress={() => setSelectedClassCard(null)}
        >
          <Text style={styles.changeClassBtnText}>Change Class</Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Two-Report Switcher (Yellow & White Theme, No Icons) */}
      <View style={styles.tabContainerWrapper}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'marks-card' && styles.tabButtonActive]}
            onPress={() => setActiveTab('marks-card')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'marks-card' && styles.tabButtonTextActive,
              ]}
            >
              Marks Card
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'attendance' && styles.tabButtonActive]}
            onPress={() => setActiveTab('attendance')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'attendance' && styles.tabButtonTextActive,
              ]}
            >
              Attendance reports
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'marks-card' ? (
          <StudentMarksCardReport
            initialClass={selectedClassCard.className}
            initialSection={`Section ${selectedClassCard.sectionName}`}
          />
        ) : (
          <AttendanceStudentReport
            initialClass={selectedClassCard.className}
            initialSection={`Section ${selectedClassCard.sectionName}`}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  /* VIEW 1: Classes Taken By Teacher Styles */
  classesScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },
  classesHeader: {
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#111827',
    letterSpacing: -0.3,
  },
  classSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 14,
  },
  classSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FontFamily.regular,
    color: '#111827',
  },
  clearSearchText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
    paddingLeft: 6,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  classCountText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  classListWrap: {
    gap: 8,
  },
  rectangularClassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  classCardLeft: {
    flex: 1,
  },
  classNameSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardClassName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  cardSectionText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  cardSubjectRow: {
    marginTop: 3,
  },
  cardSubjectText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  classCardRight: {
    marginLeft: 10,
  },
  viewReportsBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
  },
  viewReportsBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  emptyClassesCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyClassesText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: FontFamily.medium,
  },

  /* VIEW 2: Top Nav Bar on Reports Page */
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  backBtn: {
    paddingRight: 4,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNavTextWrap: {
    flex: 1,
  },
  topNavTitle: {
    fontSize: 14.5,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  topNavSubjectText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 1,
  },
  changeClassBtn: {
    paddingHorizontal: 4,
    paddingVertical: 5,
  },
  changeClassBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  tabContainerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFBEB',
    borderRadius: 5,
    padding: 3,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 5,
  },
  tabButtonActive: {
    backgroundColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
  },
  tabButtonTextActive: {
    fontFamily: FontFamily.extrabold,
    color: '#111827',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
