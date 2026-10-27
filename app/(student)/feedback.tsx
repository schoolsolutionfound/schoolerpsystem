import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../constants/fonts';
import { fetchMyTimetableApi } from '../../api/academics';
import { useUserStore } from '../../store/useUserStore';

interface SubjectItem {
  id: string;
  name: string;
  classSection: string;
  teacherName: string;
  submitted: boolean;
  submittedAt?: string;
  semester: string;
  ratings: Record<string, number>;
  description: string;
}

const CRITERIA = [
  { id: 'communication', label: 'Communication skills' },
  { id: 'punctuality', label: 'Punctuality' },
  { id: 'approachability', label: 'Approachability' },
  { id: 'fairness', label: 'Fairness & support' },
  { id: 'clarity', label: 'Clarity of explanation' },
  { id: 'examples', label: 'Use of examples' },
  { id: 'participation', label: 'Encourages participation' },
  { id: 'interesting', label: 'Makes the subject interesting' },
];

const SEMESTERS = ['Semester 1', 'Semester 2'];

const INITIAL_SUBJECTS: SubjectItem[] = [
  {
    id: 'sub-math',
    name: 'Mathematics',
    classSection: 'Class 10 A',
    teacherName: 'Mr. Rahul Sharma',
    submitted: false,
    semester: 'Semester 1',
    ratings: {},
    description: '',
  },
  {
    id: 'sub-phy',
    name: 'Physics',
    classSection: 'Class 10 A',
    teacherName: 'Mrs. Neha Verma',
    submitted: false,
    semester: 'Semester 1',
    ratings: {},
    description: '',
  },
  {
    id: 'sub-chem',
    name: 'Chemistry',
    classSection: 'Class 10 A',
    teacherName: 'Mr. Arjun Nair',
    submitted: false,
    semester: 'Semester 1',
    ratings: {},
    description: '',
  },
  {
    id: 'sub-eng',
    name: 'English',
    classSection: 'Class 10 A',
    teacherName: 'Ms. Priya Menon',
    submitted: false,
    semester: 'Semester 1',
    ratings: {},
    description: '',
  },
  {
    id: 'sub-cs',
    name: 'Computer Science',
    classSection: 'Class 10 A',
    teacherName: 'Mr. Adil Khan',
    submitted: false,
    semester: 'Semester 1',
    ratings: {},
    description: '',
  },
];

export default function StudentFeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Navigation state between Subject Selection (Image 1) and Feedback Form (Image 2)
  const [currentScreen, setCurrentScreen] = useState<'select' | 'form'>('select');
  const [subjects, setSubjects] = useState<SubjectItem[]>(INITIAL_SUBJECTS);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('sub-math');

  // Dynamic semester based on academic calendar
  const currentMonth = new Date().getMonth();
  const defaultSem = currentMonth >= 6 ? 'Semester 1' : 'Semester 2';

  // Form state
  const [semester, setSemester] = useState<string>(defaultSem);
  const [showSemesterModal, setShowSemesterModal] = useState<boolean>(false);
  const [currentRatings, setCurrentRatings] = useState<Record<string, number>>({});
  const [description, setDescription] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const userDept = useUserStore((s) => s.department);

  // Dynamically load enrolled subjects and teachers from student's timetable API
  const loadSubjects = useCallback(async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await fetchMyTimetableApi(today);
      const slots = res?.slots || [];
      const className = res?.classSection?.name || userDept || 'Class 10 A';

      if (slots.length > 0) {
        const subjectMap = new Map<string, SubjectItem>();
        slots.forEach((s: any) => {
          if (s.subject?.name && !subjectMap.has(s.subject.name)) {
            const teacher = s.teacher
              ? `${s.teacher.firstName || ''} ${s.teacher.lastName || ''}`.trim()
              : 'Faculty Member';
            subjectMap.set(s.subject.name, {
              id: `sub-${s.subject.id || s.subject.name.toLowerCase().replace(/\s+/g, '-')}`,
              name: s.subject.name,
              classSection: className,
              teacherName: teacher || 'Faculty Member',
              submitted: false,
              semester: defaultSem,
              ratings: {},
              description: '',
            });
          }
        });
        if (subjectMap.size > 0) {
          const dynamicList = Array.from(subjectMap.values());
          setSubjects((prev) => {
            return dynamicList.map((d) => {
              const foundPrev = prev.find((p) => p.name.toLowerCase() === d.name.toLowerCase());
              return foundPrev ? { ...d, ...foundPrev } : d;
            });
          });
          setSelectedSubjectId(dynamicList[0].id);
        }
      }
    } catch (err) {
      console.warn('[StudentFeedback] error loading dynamic subjects:', err);
    }
  }, [userDept, defaultSem]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSubjects();
  }, [loadSubjects]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSubjects();
    setRefreshing(false);
  }, [loadSubjects]);

  const activeSubject =
    subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Navigate to Form screen for chosen subject
  const openSubjectForm = (subject: SubjectItem) => {
    setSelectedSubjectId(subject.id);
    setSemester(subject.semester || 'Semester 1');
    setCurrentRatings(subject.ratings || {});
    setDescription(subject.description || '');
    setCurrentScreen('form');
  };

  // Set star rating for a specific criterion
  const handleRateCriterion = (criterionId: string, starVal: number) => {
    if (activeSubject.submitted) return; // Locked: no modification after submission
    setCurrentRatings((prev) => ({
      ...prev,
      [criterionId]: starVal,
    }));
  };

  // Handle Submit Feedback
  const handleSubmitFeedback = () => {
    if (activeSubject.submitted) {
      Alert.alert('Locked', 'This feedback has already been submitted and cannot be modified.');
      return;
    }

    // Check if at least some criteria are rated
    const ratedCount = Object.keys(currentRatings).filter((k) => currentRatings[k] > 0).length;
    if (ratedCount === 0) {
      Alert.alert('Ratings Required', 'Please provide ratings for the criteria before submitting.');
      return;
    }

    Alert.alert(
      'Submit Feedback',
      `Once submitted, feedback for ${activeSubject.name} cannot be modified or edited. Are you sure you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Submit',
          onPress: () => {
            const todayStr = new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            // Update subject as submitted with no further modifications allowed
            setSubjects((prev) =>
              prev.map((s) => {
                if (s.id === activeSubject.id) {
                  return {
                    ...s,
                    submitted: true,
                    submittedAt: todayStr,
                    semester,
                    ratings: currentRatings,
                    description: description.trim(),
                  };
                }
                return s;
              })
            );

            Alert.alert(
              'Feedback Submitted!',
              `Your feedback for ${activeSubject.name} has been recorded successfully. No further modifications are permitted.`,
              [
                {
                  text: 'Back to Subjects',
                  onPress: () => setCurrentScreen('select'),
                },
                { text: 'View Form' },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ─── Top Header Bar ─────────────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (currentScreen === 'form') {
              setCurrentScreen('select');
            } else {
              router.back();
            }
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>Feedback</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
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
          {/* ══════════════════════════════════════════════════════════════════
              SCREEN 1: SELECT SUBJECT (Matching Image 1)
              ══════════════════════════════════════════════════════════════════ */}
          {currentScreen === 'select' ? (
            <View style={styles.screenWrapper}>
              {/* Select Subject Header Card */}
              <View style={styles.selectHeaderCard}>
                <Text style={styles.selectHeaderTitle}>Select Subject</Text>
              </View>

              {/* Subjects List */}
              <View style={styles.subjectsList}>
                {subjects.map((sub) => {
                  const isSelected = selectedSubjectId === sub.id;

                  return (
                    <TouchableOpacity
                      key={sub.id}
                      style={[
                        styles.subjectCard,
                        isSelected && styles.subjectCardSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setSelectedSubjectId(sub.id)}
                    >
                      <View style={styles.subjectMetaCol}>
                        <View style={styles.subjectTitleRow}>
                          <Text
                            style={[
                              styles.subjectName,
                              isSelected && styles.subjectNameSelected,
                            ]}
                          >
                            {sub.name}
                          </Text>
                          {sub.submitted && (
                            <View style={styles.submittedPill}>
                              <Text style={styles.submittedPillText}>Submitted</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.subjectTeacher}>
                          {sub.classSection}  |  {sub.teacherName}
                        </Text>
                      </View>

                      <View style={styles.subjectRightWrap}>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && styles.radioCircleSelected,
                          ]}
                        >
                          {isSelected && <View style={styles.radioDot} />}
                        </View>
                        <Feather name="chevron-right" size={20} color="#6B7280" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Continue Button */}
              <TouchableOpacity
                style={styles.continueBtn}
                activeOpacity={0.85}
                onPress={() => openSubjectForm(activeSubject)}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ══════════════════════════════════════════════════════════════════
                SCREEN 2: FEEDBACK FORM (Matching Image 2)
                ══════════════════════════════════════════════════════════════════ */
            <View style={styles.screenWrapper}>
              {/* Subject Info Card */}
              <View style={styles.subjectInfoCard}>
                <View style={styles.subjectTitleRow}>
                  <Text style={styles.formSubjectName}>{activeSubject.name}</Text>
                  {activeSubject.submitted && (
                    <View style={styles.submittedPill}>
                      <Text style={styles.submittedPillText}>Submitted (Locked)</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.formClassSection}>{activeSubject.classSection}</Text>

                {/* Semester Dropdown */}
                <TouchableOpacity
                  style={[
                    styles.semesterDropdown,
                    activeSubject.submitted && styles.semesterDropdownDisabled,
                  ]}
                  activeOpacity={activeSubject.submitted ? 1 : 0.8}
                  onPress={() => {
                    if (!activeSubject.submitted) setShowSemesterModal(true);
                  }}
                >
                  <Text style={styles.semesterDropdownText}>{semester}</Text>
                  {!activeSubject.submitted && (
                    <Feather name="chevron-down" size={18} color="#111827" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Already Submitted Locked Warning Banner */}
              {activeSubject.submitted && (
                <View style={styles.lockedInfoBanner}>
                  <MaterialCommunityIcons name="lock-outline" size={18} color="#B45309" />
                  <Text style={styles.lockedInfoBannerText}>
                    Feedback for this subject has been submitted. No further modifications are allowed.
                  </Text>
                </View>
              )}

              {/* Evaluation Criteria Table */}
              <View style={styles.criteriaCard}>
                {CRITERIA.map((crit, index) => {
                  const currentScore = currentRatings[crit.id] || 0;

                  return (
                    <View
                      key={crit.id}
                      style={[
                        styles.criteriaRow,
                        index < CRITERIA.length - 1 && styles.criteriaRowDivider,
                      ]}
                    >
                      <Text style={styles.criteriaLabel}>{crit.label}</Text>

                      {/* 5 Stars */}
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((starVal) => {
                          const isFilled = starVal <= currentScore;

                          return (
                            <TouchableOpacity
                              key={starVal}
                              activeOpacity={activeSubject.submitted ? 1 : 0.7}
                              onPress={() => handleRateCriterion(crit.id, starVal)}
                              disabled={activeSubject.submitted}
                              style={styles.starBtn}
                            >
                              <MaterialCommunityIcons
                                name={isFilled ? 'star' : 'star-outline'}
                                size={22}
                                color={isFilled ? '#FDC836' : '#9CA3AF'}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Description Card */}
              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionTitle}>Description</Text>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    activeSubject.submitted && styles.descriptionInputDisabled,
                  ]}
                  placeholder="Share your overall feedback or suggestions here..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                  value={activeSubject.submitted ? activeSubject.description : description}
                  onChangeText={setDescription}
                  editable={!activeSubject.submitted}
                />
                <Text style={styles.charCounterText}>
                  {(activeSubject.submitted ? activeSubject.description : description).length}/500
                </Text>
              </View>

              {/* Bottom Action Button */}
              {activeSubject.submitted ? (
                <View style={styles.submittedLockedBtn}>
                  <MaterialCommunityIcons name="check-circle" size={18} color="#15803D" />
                  <Text style={styles.submittedLockedBtnText}>Feedback Submitted</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.submitFeedbackBtn}
                  activeOpacity={0.85}
                  onPress={handleSubmitFeedback}
                >
                  <Text style={styles.submitFeedbackBtnText}>Submit Feedback</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Semester Selection Modal ─────────────────────────────────────── */}
      <Modal
        visible={showSemesterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSemesterModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSemesterModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Semester</Text>
            {SEMESTERS.map((sem) => (
              <TouchableOpacity
                key={sem}
                style={[styles.modalItem, semester === sem && styles.modalItemActive]}
                onPress={() => {
                  setSemester(sem);
                  setShowSemesterModal(false);
                }}
              >
                <Text style={[styles.modalItemText, semester === sem && styles.modalItemTextActive]}>
                  {sem}
                </Text>
                {semester === sem && <Feather name="check" size={18} color="#111827" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  topBarTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  screenWrapper: {
    gap: 12,
  },

  /* ─── Screen 1: Select Subject Styles ────────────────────────────── */
  selectHeaderCard: {
    backgroundColor: '#FFFDF0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  selectHeaderTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  subjectsList: {
    gap: 10,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  subjectCardSelected: {
    backgroundColor: '#FFFDF0',
    borderColor: '#FDC836',
  },
  subjectMetaCol: {
    flex: 1,
    paddingRight: 8,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectName: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  subjectNameSelected: {
    color: '#111827',
  },
  subjectTeacher: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 4,
  },
  subjectRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#FDC836',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FDC836',
  },

  submittedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  submittedPillText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },

  continueBtn: {
    backgroundColor: '#FDC836',
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  continueBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  /* ─── Screen 2: Feedback Form Styles ─────────────────────────────── */
  subjectInfoCard: {
    backgroundColor: '#FFFDF0',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 16,
  },
  formSubjectName: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  formClassSection: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 12,
  },
  semesterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  semesterDropdownDisabled: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  semesterDropdownText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },

  lockedInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 5,
    padding: 12,
    gap: 8,
  },
  lockedInfoBannerText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#92400E',
    lineHeight: 16,
  },

  criteriaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  criteriaRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  criteriaLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#111827',
    paddingRight: 8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starBtn: {
    padding: 2,
  },

  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 10,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 5,
    padding: 12,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: '#111827',
    minHeight: 90,
  },
  descriptionInputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#4B5563',
  },
  charCounterText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 6,
  },

  submitFeedbackBtn: {
    backgroundColor: '#FDC836',
    borderRadius: 5,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitFeedbackBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  submittedLockedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 5,
    paddingVertical: 14,
    gap: 8,
    marginTop: 4,
  },
  submittedLockedBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#15803D',
  },

  /* ─── Modal ──────────────────────────────────────────────────────── */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#111827',
    marginBottom: 6,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  modalItemActive: {
    backgroundColor: '#FFFDF0',
  },
  modalItemText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: '#111827',
  },
  modalItemTextActive: {
    fontFamily: FontFamily.bold,
  },
});
