import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
  Alert,
  Switch,
  RefreshControl,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import {
  StudentReviewCycle,
  FacultyReviewSubmission,
  CollegeReviewSubmission,
  FeedbackRole,
  TeacherFeedbackSummary,
  InstitutionalFeedbackSummary,
  CreateFeedbackCyclePayload,
  FacultyRatingParameters,
  CollegeRatingParameters,
} from '../types/studentFeedback.types';
import {
  fetchFeedbackCyclesApi,
  createFeedbackCycleApi,
  updateCycleStatusApi,
  fetchFacultyReviewsApi,
  fetchCollegeReviewsApi,
  submitFacultyReviewApi,
  submitCollegeReviewApi,
  updateReviewActionNoteApi,
  fetchTeacherFeedbackStatsApi,
  fetchInstitutionalFeedbackSummaryApi,
} from '../../../api/studentFeedback';

const INSTITUTION_DEPARTMENTS = [
  'Computer Science',
  'AIML',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'Commerce & Mgmt',
  'Applied Sciences',
];

const SAMPLE_FACULTY_MEMBERS = [
  { id: 'fac-01', name: 'Dr. Anand Rao', department: 'Computer Science', subject: 'Design & Analysis of Algorithms' },
  { id: 'fac-02', name: 'Prof. Sneha Sharma', department: 'AIML', subject: 'Neural Networks & Deep Learning' },
  { id: 'fac-03', name: 'Dr. Ramesh Kumar', department: 'Electronics & Comm', subject: 'Digital Signal Processing' },
  { id: 'fac-04', name: 'Prof. Vikram Hegde', department: 'Mechanical Eng', subject: 'Thermodynamics & Heat Transfer' },
  { id: 'fac-05', name: 'Prof. Kavita Desai', department: 'Civil Eng', subject: 'Structural Analysis' },
  { id: 'fac-06', name: 'Dr. Suresh Mehta', department: 'Commerce & Mgmt', subject: 'Financial Accounting' },
];

interface StudentFeedbackReviewManagerViewProps {
  userRole: FeedbackRole;
  currentUserId?: string;
  currentUserName?: string;
  userDepartment?: string;
}

export const StudentFeedbackReviewManagerView: React.FC<StudentFeedbackReviewManagerViewProps> = ({
  userRole = 'student',
  currentUserId = 'user-01',
  currentUserName = 'Rahul Verma',
  userDepartment = 'Computer Science',
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;
  const maxContentWidth = Math.min(windowWidth, 1200);

  // Core Data
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cycles, setCycles] = useState<StudentReviewCycle[]>([]);
  const [facultyReviews, setFacultyReviews] = useState<FacultyReviewSubmission[]>([]);
  const [collegeReviews, setCollegeReviews] = useState<CollegeReviewSubmission[]>([]);
  const [teacherSummary, setTeacherSummary] = useState<TeacherFeedbackSummary | null>(null);
  const [instSummary, setInstSummary] = useState<InstitutionalFeedbackSummary | null>(null);

  // Active sub-tab for Principal / HOD
  const [adminTab, setAdminTab] = useState<'reviews' | 'cycles' | 'analytics'>('reviews');
  const [reviewTypeTab, setReviewTypeTab] = useState<'faculty' | 'college'>('faculty');

  // Search & Filters for reviews
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | 'under_4'>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Modals
  const [createCycleModalVisible, setCreateCycleModalVisible] = useState(false);
  const [rateFacultyModalVisible, setRateFacultyModalVisible] = useState(false);
  const [rateCollegeModalVisible, setRateCollegeModalVisible] = useState(false);
  const [actionNoteModalVisible, setActionNoteModalVisible] = useState(false);

  // Selected item for Action Note Modal
  const [selectedReviewForAction, setSelectedReviewForAction] = useState<{
    id: string;
    type: 'faculty' | 'college';
    targetName: string;
    studentName: string;
    existingNote?: string;
  } | null>(null);
  const [actionNoteInput, setActionNoteInput] = useState('');

  // Form State: Create Cycle
  const [newCycleTitle, setNewCycleTitle] = useState('');
  const [newCycleAcadYear, setNewCycleAcadYear] = useState('2025-2026');
  const [newCycleSemester, setNewCycleSemester] = useState('Odd Semester (V / VII)');
  const [newCycleScope, setNewCycleScope] = useState<'both' | 'faculty_only' | 'college_only'>('both');
  const [newCycleDept, setNewCycleDept] = useState('all');
  const [newCycleEndDate, setNewCycleEndDate] = useState('2026-11-30');
  const [newCycleDesc, setNewCycleDesc] = useState('');

  // Form State: Rate Faculty (Student)
  const [selectedFaculty, setSelectedFaculty] = useState(SAMPLE_FACULTY_MEMBERS[0]);
  const [facIsAnonymous, setFacIsAnonymous] = useState(true);
  const [facRatings, setFacRatings] = useState<FacultyRatingParameters>({
    subjectKnowledge: 5,
    teachingClarity: 5,
    punctuality: 5,
    doubtResolution: 5,
    courseCoverage: 5,
  });
  const [facStrengths, setFacStrengths] = useState('');
  const [facImprovements, setFacImprovements] = useState('');
  const [facComments, setFacComments] = useState('');

  // Form State: Rate College (Student)
  const [colIsAnonymous, setColIsAnonymous] = useState(true);
  const [colRatings, setColRatings] = useState<CollegeRatingParameters>({
    infrastructureLabs: 5,
    libraryResources: 5,
    canteenCleanliness: 4,
    sportsExtracurriculars: 4,
    adminStudentSupport: 5,
    placementsTraining: 5,
  });
  const [colHighlights, setColHighlights] = useState('');
  const [colSuggestions, setColSuggestions] = useState('');

  // Initial Data Load
  const loadData = useCallback(async () => {
    try {
      const [cycleList, facList, colList] = await Promise.all([
        fetchFeedbackCyclesApi(),
        fetchFacultyReviewsApi({ department: userRole === 'hod' ? userDepartment : undefined }),
        fetchCollegeReviewsApi({ department: userRole === 'hod' ? userDepartment : undefined }),
      ]);
      setCycles(cycleList);
      setFacultyReviews(facList);
      setCollegeReviews(colList);

      if (userRole === 'teacher') {
        const stats = await fetchTeacherFeedbackStatsApi(currentUserName);
        setTeacherSummary(stats);
      } else if (userRole === 'principal' || userRole === 'hod') {
        const inst = await fetchInstitutionalFeedbackSummaryApi();
        setInstSummary(inst);
      }
    } catch (err) {
      console.error('Failed to load feedback review data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userRole, userDepartment, currentUserName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filtered Reviews for Admin/HOD
  const filteredFacultyReviews = useMemo(() => {
    return facultyReviews.filter((r) => {
      const matchSearch =
        searchQuery === '' ||
        r.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.studentName && r.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.strengths && r.strengths.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept =
        selectedDeptFilter === 'all' || r.facultyDepartment === selectedDeptFilter;

      let matchRating = true;
      if (ratingFilter === '5') matchRating = r.overallRating >= 4.7;
      else if (ratingFilter === '4') matchRating = r.overallRating >= 3.8 && r.overallRating < 4.7;
      else if (ratingFilter === 'under_4') matchRating = r.overallRating < 3.8;

      return matchSearch && matchDept && matchRating;
    });
  }, [facultyReviews, searchQuery, selectedDeptFilter, ratingFilter]);

  const filteredCollegeReviews = useMemo(() => {
    return collegeReviews.filter((r) => {
      const matchSearch =
        searchQuery === '' ||
        (r.studentName && r.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.campusHighlights && r.campusHighlights.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.improvementSuggestions && r.improvementSuggestions.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept =
        selectedDeptFilter === 'all' || r.studentDepartment === selectedDeptFilter;

      let matchRating = true;
      if (ratingFilter === '5') matchRating = r.overallRating >= 4.7;
      else if (ratingFilter === '4') matchRating = r.overallRating >= 3.8 && r.overallRating < 4.7;
      else if (ratingFilter === 'under_4') matchRating = r.overallRating < 3.8;

      return matchSearch && matchDept && matchRating;
    });
  }, [collegeReviews, searchQuery, selectedDeptFilter, ratingFilter]);

  // Student reviews submitted by current student
  const studentSubmittedFaculty = useMemo(() => {
    return facultyReviews.filter((r) => r.studentId === currentUserId);
  }, [facultyReviews, currentUserId]);

  const studentSubmittedCollege = useMemo(() => {
    return collegeReviews.filter((r) => r.studentId === currentUserId);
  }, [collegeReviews, currentUserId]);

  // Handlers: Create Cycle
  const handleCreateCycle = async () => {
    if (!newCycleTitle.trim()) {
      Alert.alert('Required', 'Please enter a campaign title.');
      return;
    }
    try {
      const payload: CreateFeedbackCyclePayload = {
        title: newCycleTitle.trim(),
        academicYear: newCycleAcadYear,
        semester: newCycleSemester,
        scope: newCycleScope,
        targetDepartments: newCycleDept === 'all' ? ['all'] : [newCycleDept],
        startDate: new Date().toISOString().slice(0, 10),
        endDate: newCycleEndDate,
        description: newCycleDesc.trim(),
      };
      const created = await createFeedbackCycleApi(payload);
      setCycles((prev) => [created, ...prev]);
      setCreateCycleModalVisible(false);
      setNewCycleTitle('');
      setNewCycleDesc('');
      Alert.alert('Success', 'Feedback survey campaign launched successfully!');
    } catch {
      Alert.alert('Error', 'Failed to create feedback survey.');
    }
  };

  // Handlers: Submit Faculty Review (Student)
  const handleSubmitFacultyReview = async () => {
    const activeCycle = cycles.find((c) => c.status === 'active') || cycles[0];
    if (!activeCycle) {
      Alert.alert('Notice', 'No active survey campaign found.');
      return;
    }
    try {
      const avg = Number(
        (
          (facRatings.subjectKnowledge +
            facRatings.teachingClarity +
            facRatings.punctuality +
            facRatings.doubtResolution +
            facRatings.courseCoverage) /
          5
        ).toFixed(1)
      );

      const created = await submitFacultyReviewApi({
        cycleId: activeCycle.id,
        cycleTitle: activeCycle.title,
        studentId: currentUserId,
        studentName: facIsAnonymous ? 'Anonymous Student' : currentUserName,
        studentUSN: facIsAnonymous ? 'Confidential' : '1MS21CS042',
        studentDepartment: userDepartment,
        studentSemester: 'Semester 5',
        isAnonymous: facIsAnonymous,
        facultyId: selectedFaculty.id,
        facultyName: selectedFaculty.name,
        facultyDepartment: selectedFaculty.department,
        subjectName: selectedFaculty.subject,
        ratings: facRatings,
        overallRating: avg,
        strengths: facStrengths.trim() || undefined,
        areasOfImprovement: facImprovements.trim() || undefined,
        generalComments: facComments.trim() || undefined,
      });

      setFacultyReviews((prev) => [created, ...prev]);
      setRateFacultyModalVisible(false);
      setFacStrengths('');
      setFacImprovements('');
      setFacComments('');
      Alert.alert('Thank You!', 'Your review for ' + selectedFaculty.name + ' has been submitted.');
    } catch {
      Alert.alert('Error', 'Failed to submit review.');
    }
  };

  // Handlers: Submit College Review (Student)
  const handleSubmitCollegeReview = async () => {
    const activeCycle = cycles.find((c) => c.status === 'active') || cycles[0];
    if (!activeCycle) {
      Alert.alert('Notice', 'No active survey campaign found.');
      return;
    }
    try {
      const avg = Number(
        (
          (colRatings.infrastructureLabs +
            colRatings.libraryResources +
            colRatings.canteenCleanliness +
            colRatings.sportsExtracurriculars +
            colRatings.adminStudentSupport +
            colRatings.placementsTraining) /
          6
        ).toFixed(1)
      );

      const created = await submitCollegeReviewApi({
        cycleId: activeCycle.id,
        cycleTitle: activeCycle.title,
        studentId: currentUserId,
        studentName: colIsAnonymous ? 'Anonymous Student' : currentUserName,
        studentUSN: colIsAnonymous ? 'Confidential' : '1MS21CS042',
        studentDepartment: userDepartment,
        studentSemester: 'Semester 5',
        isAnonymous: colIsAnonymous,
        ratings: colRatings,
        overallRating: avg,
        campusHighlights: colHighlights.trim() || undefined,
        improvementSuggestions: colSuggestions.trim() || undefined,
      });

      setCollegeReviews((prev) => [created, ...prev]);
      setRateCollegeModalVisible(false);
      setColHighlights('');
      setColSuggestions('');
      Alert.alert('Thank You!', 'Your feedback on college facilities has been submitted.');
    } catch {
      Alert.alert('Error', 'Failed to submit feedback.');
    }
  };

  // Handlers: Action Note (Admin / HOD)
  const handleSaveActionNote = async () => {
    if (!selectedReviewForAction || !actionNoteInput.trim()) return;
    try {
      const actor = userRole === 'principal' ? 'Principal Office' : `HOD - ${userDepartment}`;
      await updateReviewActionNoteApi(
        selectedReviewForAction.type,
        selectedReviewForAction.id,
        actionNoteInput.trim(),
        actor
      );

      if (selectedReviewForAction.type === 'faculty') {
        setFacultyReviews((prev) =>
          prev.map((r) =>
            r.id === selectedReviewForAction.id
              ? { ...r, actionNote: actionNoteInput.trim(), actionBy: actor, status: 'action_taken' }
              : r
          )
        );
      } else {
        setCollegeReviews((prev) =>
          prev.map((r) =>
            r.id === selectedReviewForAction.id
              ? { ...r, actionNote: actionNoteInput.trim(), actionBy: actor, status: 'action_taken' }
              : r
          )
        );
      }

      setActionNoteModalVisible(false);
      setActionNoteInput('');
      setSelectedReviewForAction(null);
      Alert.alert('Saved', 'Administrative action note recorded successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update action note.');
    }
  };

  // Helper: Star Rating Selector Component
  const renderStarSelector = (
    label: string,
    currentVal: number,
    onChange: (val: number) => void
  ) => {
    return (
      <View style={styles.starRow}>
        <Text style={styles.starLabel}>{label}</Text>
        <View style={styles.starButtonGroup}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => onChange(star)}
              activeOpacity={0.7}
              style={styles.starTouch}
            >
              <MaterialCommunityIcons
                name={star <= currentVal ? 'star' : 'star-outline'}
                size={22}
                color={star <= currentVal ? '#F59E0B' : '#CBD5E1'}
              />
            </TouchableOpacity>
          ))}
          <Text style={styles.starScoreText}>{currentVal}.0</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading feedback & reviews...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.contentContainer, { maxWidth: maxContentWidth }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER SECTION */}
      <View style={styles.headerBox}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Student Feedback & Reviews</Text>
          <Text style={styles.headerSubtitle}>
            {userRole === 'student'
              ? 'Submit ratings for professors and campus facilities. Anonymous submission supported.'
              : userRole === 'teacher'
              ? 'Comprehensive pedagogy evaluations and qualitative reviews from students.'
              : 'Institutional feedback cycles, department analytics, and action tracking.'}
          </Text>
        </View>
        {(userRole === 'principal' || userRole === 'hod') && (
          <TouchableOpacity
            style={styles.launchBtn}
            onPress={() => setCreateCycleModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus-circle" size={16} color="#FFFFFF" />
            <Text style={styles.launchBtnText}>Launch Survey</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* KPI STATS BAR */}
      <View style={styles.kpiRow}>
        {userRole === 'teacher' ? (
          <>
            <View style={[styles.kpiCard, { borderColor: '#E0E7FF' }]}>
              <Text style={styles.kpiLabel}>My Overall Rating</Text>
              <View style={styles.kpiValRow}>
                <MaterialCommunityIcons name="star" size={22} color="#F59E0B" />
                <Text style={styles.kpiVal}>{teacherSummary?.averageRating || 4.8}</Text>
                <Text style={styles.kpiSub}>/ 5.0</Text>
              </View>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#DCFCE7' }]}>
              <Text style={styles.kpiLabel}>Total Student Reviews</Text>
              <Text style={styles.kpiVal}>{teacherSummary?.totalReviews || 42}</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#FEF3C7' }]}>
              <Text style={styles.kpiLabel}>Top Parameter</Text>
              <Text style={[styles.kpiVal, { fontSize: 16, color: '#D97706' }]}>
                Subject Knowledge (5.0★)
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={[styles.kpiCard, { borderColor: '#E0E7FF' }]}>
              <Text style={styles.kpiLabel}>College Rating</Text>
              <View style={styles.kpiValRow}>
                <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
                <Text style={styles.kpiVal}>{instSummary?.collegeOverallRating || 4.7}</Text>
                <Text style={styles.kpiSub}>/ 5.0</Text>
              </View>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#DCFCE7' }]}>
              <Text style={styles.kpiLabel}>Faculty Average</Text>
              <View style={styles.kpiValRow}>
                <MaterialCommunityIcons name="star" size={20} color="#F59E0B" />
                <Text style={styles.kpiVal}>{instSummary?.facultyOverallAverage || 4.7}</Text>
                <Text style={styles.kpiSub}>/ 5.0</Text>
              </View>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#FEF3C7' }]}>
              <Text style={styles.kpiLabel}>Total Reviews</Text>
              <Text style={styles.kpiVal}>{instSummary?.totalStudentReviews || 148}</Text>
            </View>
            <View style={[styles.kpiCard, { borderColor: '#F3E8FF' }]}>
              <Text style={styles.kpiLabel}>Active Surveys</Text>
              <Text style={[styles.kpiVal, { color: '#7C3AED' }]}>
                {cycles.filter((c) => c.status === 'active').length}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* ============================================================== */}
      {/* ROLE 1: STUDENT VIEW                                           */}
      {/* ============================================================== */}
      {userRole === 'student' && (
        <View style={styles.studentSection}>
          {/* Active Survey Banner & Submission Buttons */}
          <View style={styles.actionBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBannerTitle}>Active Review Campaign</Text>
              <Text style={styles.actionBannerDesc}>
                {cycles[0]?.title || 'Mid-Semester Faculty & Campus Survey 2026'}
              </Text>
              <Text style={styles.actionBannerDeadline}>
                Deadline:{' '}
                <Text style={{ fontFamily: FontFamily.bold, color: '#DC2626' }}>
                  {cycles[0]?.endDate || '15 Nov 2026'}
                </Text>
              </Text>
            </View>
            <View style={styles.actionBtnGroup}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#4F46E5' }]}
                onPress={() => setRateFacultyModalVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="account-star-outline" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Rate Faculty</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#059669' }]}
                onPress={() => setRateCollegeModalVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="office-building-marker" size={18} color="#FFFFFF" />
                <Text style={styles.primaryActionBtnText}>Review College</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Student's Submissions History */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Submitted Reviews</Text>
            <Text style={styles.sectionBadge}>
              {studentSubmittedFaculty.length + studentSubmittedCollege.length} Submissions
            </Text>
          </View>

          {studentSubmittedFaculty.length === 0 && studentSubmittedCollege.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Reviews Submitted Yet</Text>
              <Text style={styles.emptyDesc}>
                Click the buttons above to review your teachers and campus facilities.
              </Text>
            </View>
          ) : (
            <View style={styles.submissionsList}>
              {studentSubmittedFaculty.map((item) => (
                <View key={item.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.reviewAvatar}>
                      <Feather name="user" size={18} color="#4F46E5" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewTarget}>{item.facultyName}</Text>
                      <Text style={styles.reviewMeta}>
                        {item.subjectName} • {item.facultyDepartment}
                      </Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.ratingPillText}>{item.overallRating.toFixed(1)}</Text>
                    </View>
                  </View>
                  {item.strengths && (
                    <Text style={styles.reviewComment}>
                      <Text style={{ fontFamily: FontFamily.bold, color: '#166534' }}>
                        Strengths:{' '}
                      </Text>
                      {item.strengths}
                    </Text>
                  )}
                  {item.actionNote && (
                    <View style={styles.actionNoteBox}>
                      <Feather name="check-circle" size={14} color="#15803D" />
                      <Text style={styles.actionNoteText}>
                        <Text style={{ fontFamily: FontFamily.bold }}>
                          Action Taken by {item.actionBy}:{' '}
                        </Text>
                        {item.actionNote}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {studentSubmittedCollege.map((item) => (
                <View key={item.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={[styles.reviewAvatar, { backgroundColor: '#DCFCE7' }]}>
                      <Feather name="home" size={18} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.reviewTarget}>College Infrastructure & Facilities</Text>
                      <Text style={styles.reviewMeta}>{item.cycleTitle}</Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.ratingPillText}>{item.overallRating.toFixed(1)}</Text>
                    </View>
                  </View>
                  {item.campusHighlights && (
                    <Text style={styles.reviewComment}>
                      <Text style={{ fontFamily: FontFamily.bold, color: '#1E40AF' }}>
                        Highlights:{' '}
                      </Text>
                      {item.campusHighlights}
                    </Text>
                  )}
                  {item.improvementSuggestions && (
                    <Text style={styles.reviewComment}>
                      <Text style={{ fontFamily: FontFamily.bold, color: '#991B1B' }}>
                        Suggestions:{' '}
                      </Text>
                      {item.improvementSuggestions}
                    </Text>
                  )}
                  {item.actionNote && (
                    <View style={styles.actionNoteBox}>
                      <Feather name="check-circle" size={14} color="#15803D" />
                      <Text style={styles.actionNoteText}>
                        <Text style={{ fontFamily: FontFamily.bold }}>
                          Action Taken by {item.actionBy}:{' '}
                        </Text>
                        {item.actionNote}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ============================================================== */}
      {/* ROLE 2: TEACHER VIEW                                           */}
      {/* ============================================================== */}
      {userRole === 'teacher' && teacherSummary && (
        <View style={styles.teacherSection}>
          {/* Parameter Breakdown Card */}
          <View style={styles.cardContainer}>
            <Text style={styles.cardSectionTitle}>Pedagogy & Performance Breakdown</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Subject Knowledge</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(teacherSummary.parameterAverages.subjectKnowledge / 5) * 100}%`,
                      backgroundColor: '#4F46E5',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressScore}>
                {teacherSummary.parameterAverages.subjectKnowledge.toFixed(1)} / 5.0
              </Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Teaching Clarity & Pedagogy</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(teacherSummary.parameterAverages.teachingClarity / 5) * 100}%`,
                      backgroundColor: '#2563EB',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressScore}>
                {teacherSummary.parameterAverages.teachingClarity.toFixed(1)} / 5.0
              </Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Punctuality & Discipline</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(teacherSummary.parameterAverages.punctuality / 5) * 100}%`,
                      backgroundColor: '#10B981',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressScore}>
                {teacherSummary.parameterAverages.punctuality.toFixed(1)} / 5.0
              </Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Doubt Resolution & Mentoring</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(teacherSummary.parameterAverages.doubtResolution / 5) * 100}%`,
                      backgroundColor: '#F59E0B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressScore}>
                {teacherSummary.parameterAverages.doubtResolution.toFixed(1)} / 5.0
              </Text>
            </View>

            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Course Coverage & Syllabus</Text>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(teacherSummary.parameterAverages.courseCoverage / 5) * 100}%`,
                      backgroundColor: '#8B5CF6',
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressScore}>
                {teacherSummary.parameterAverages.courseCoverage.toFixed(1)} / 5.0
              </Text>
            </View>
          </View>

          {/* Student Comments & Testimonials */}
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Student Feedback & Remarks</Text>
          <View style={styles.submissionsList}>
            {teacherSummary.recentReviews.map((rev) => (
              <View key={rev.id} style={styles.reviewCard}>
                <View style={styles.reviewCardHeader}>
                  <View style={styles.reviewAvatar}>
                    <Feather name={rev.isAnonymous ? 'shield' : 'user'} size={18} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.reviewTarget}>
                      {rev.isAnonymous ? 'Verified Student (Anonymous)' : rev.studentName}
                    </Text>
                    <Text style={styles.reviewMeta}>
                      {rev.subjectName} • {rev.studentSemester}
                    </Text>
                  </View>
                  <View style={styles.ratingPill}>
                    <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                    <Text style={styles.ratingPillText}>{rev.overallRating.toFixed(1)}</Text>
                  </View>
                </View>
                {rev.strengths && (
                  <Text style={styles.reviewComment}>
                    <Text style={{ fontFamily: FontFamily.bold, color: '#166534' }}>
                      Strengths:{' '}
                    </Text>
                    {rev.strengths}
                  </Text>
                )}
                {rev.areasOfImprovement && (
                  <Text style={styles.reviewComment}>
                    <Text style={{ fontFamily: FontFamily.bold, color: '#991B1B' }}>
                      Areas of Growth:{' '}
                    </Text>
                    {rev.areasOfImprovement}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* ROLE 3 & 4: PRINCIPAL & HOD VIEW                               */}
      {/* ============================================================== */}
      {(userRole === 'principal' || userRole === 'hod') && (
        <View style={styles.adminSection}>
          {/* Sub Navigation Segment */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, adminTab === 'reviews' && styles.segmentBtnActive]}
              onPress={() => setAdminTab('reviews')}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  adminTab === 'reviews' && styles.segmentBtnTextActive,
                ]}
              >
                All Student Reviews
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, adminTab === 'cycles' && styles.segmentBtnActive]}
              onPress={() => setAdminTab('cycles')}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  adminTab === 'cycles' && styles.segmentBtnTextActive,
                ]}
              >
                Survey Campaigns ({cycles.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, adminTab === 'analytics' && styles.segmentBtnActive]}
              onPress={() => setAdminTab('analytics')}
            >
              <Text
                style={[
                  styles.segmentBtnText,
                  adminTab === 'analytics' && styles.segmentBtnTextActive,
                ]}
              >
                Campus & Dept Analytics
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: REVIEWS LEDGER */}
          {adminTab === 'reviews' && (
            <View>
              {/* Type Switcher: Faculty vs College */}
              <View style={styles.reviewTypeRow}>
                <TouchableOpacity
                  style={[
                    styles.reviewTypeBtn,
                    reviewTypeTab === 'faculty' && styles.reviewTypeBtnActive,
                  ]}
                  onPress={() => setReviewTypeTab('faculty')}
                >
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={16}
                    color={reviewTypeTab === 'faculty' ? '#FFFFFF' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.reviewTypeBtnText,
                      reviewTypeTab === 'faculty' && styles.reviewTypeBtnTextActive,
                    ]}
                  >
                    Faculty Reviews ({filteredFacultyReviews.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.reviewTypeBtn,
                    reviewTypeTab === 'college' && styles.reviewTypeBtnActive,
                  ]}
                  onPress={() => setReviewTypeTab('college')}
                >
                  <MaterialCommunityIcons
                    name="office-building"
                    size={16}
                    color={reviewTypeTab === 'college' ? '#FFFFFF' : '#475569'}
                  />
                  <Text
                    style={[
                      styles.reviewTypeBtnText,
                      reviewTypeTab === 'college' && styles.reviewTypeBtnTextActive,
                    ]}
                  >
                    Campus & Facilities ({filteredCollegeReviews.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Search & Filter Bar */}
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Feather name="search" size={18} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by faculty, student, subject, or keywords..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#94A3B8"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Feather name="x" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity
                  style={[
                    styles.filterBtn,
                    (selectedDeptFilter !== 'all' || ratingFilter !== 'all') &&
                      styles.filterBtnActive,
                  ]}
                  onPress={() => setFilterModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="sliders"
                    size={16}
                    color={
                      selectedDeptFilter !== 'all' || ratingFilter !== 'all' ? '#FFFFFF' : '#4F46E5'
                    }
                  />
                </TouchableOpacity>
              </View>

              {/* Active Filter Chips */}
              {(selectedDeptFilter !== 'all' || ratingFilter !== 'all') && (
                <View style={styles.chipsRow}>
                  {selectedDeptFilter !== 'all' && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>Dept: {selectedDeptFilter}</Text>
                      <TouchableOpacity onPress={() => setSelectedDeptFilter('all')}>
                        <Feather name="x" size={12} color="#1E293B" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {ratingFilter !== 'all' && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        Rating: {ratingFilter === '5' ? '4.7+ ★' : ratingFilter === '4' ? '3.8 - 4.6 ★' : '< 3.8 ★'}
                      </Text>
                      <TouchableOpacity onPress={() => setRatingFilter('all')}>
                        <Feather name="x" size={12} color="#1E293B" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDeptFilter('all');
                      setRatingFilter('all');
                    }}
                  >
                    <Text style={styles.clearAllFilters}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Cards List */}
              {reviewTypeTab === 'faculty' ? (
                <View style={styles.submissionsList}>
                  {filteredFacultyReviews.map((r) => (
                    <View key={r.id} style={styles.reviewCard}>
                      <View style={styles.reviewCardHeader}>
                        <View style={styles.reviewAvatar}>
                          <Feather name="user-check" size={18} color="#4F46E5" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.reviewTarget}>{r.facultyName}</Text>
                          <Text style={styles.reviewMeta}>
                            {r.subjectName} • {r.facultyDepartment}
                          </Text>
                          <Text style={styles.reviewStudentBadge}>
                            Student: {r.isAnonymous ? '🔒 Anonymous / Confidential' : `${r.studentName} (${r.studentUSN})`}
                          </Text>
                        </View>
                        <View style={styles.ratingPill}>
                          <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                          <Text style={styles.ratingPillText}>{r.overallRating.toFixed(1)}</Text>
                        </View>
                      </View>

                      {/* Parameter mini ratings */}
                      <View style={styles.miniParamsRow}>
                        <Text style={styles.miniParam}>
                          Knowledge: <Text style={{ fontFamily: FontFamily.bold }}>{r.ratings.subjectKnowledge}★</Text>
                        </Text>
                        <Text style={styles.miniParam}>
                          Clarity: <Text style={{ fontFamily: FontFamily.bold }}>{r.ratings.teachingClarity}★</Text>
                        </Text>
                        <Text style={styles.miniParam}>
                          Punctuality: <Text style={{ fontFamily: FontFamily.bold }}>{r.ratings.punctuality}★</Text>
                        </Text>
                        <Text style={styles.miniParam}>
                          Doubt Solving: <Text style={{ fontFamily: FontFamily.bold }}>{r.ratings.doubtResolution}★</Text>
                        </Text>
                      </View>

                      {r.strengths && (
                        <Text style={styles.reviewComment}>
                          <Text style={{ fontFamily: FontFamily.bold, color: '#166534' }}>
                            Strengths:{' '}
                          </Text>
                          {r.strengths}
                        </Text>
                      )}
                      {r.areasOfImprovement && (
                        <Text style={styles.reviewComment}>
                          <Text style={{ fontFamily: FontFamily.bold, color: '#991B1B' }}>
                            Areas for Growth:{' '}
                          </Text>
                          {r.areasOfImprovement}
                        </Text>
                      )}

                      {/* Action Note Row */}
                      {r.actionNote ? (
                        <View style={styles.actionNoteBox}>
                          <Feather name="check-circle" size={14} color="#15803D" />
                          <Text style={styles.actionNoteText}>
                            <Text style={{ fontFamily: FontFamily.bold }}>
                              Action Recorded ({r.actionBy}):{' '}
                            </Text>
                            {r.actionNote}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addActionBtn}
                          onPress={() => {
                            setSelectedReviewForAction({
                              id: r.id,
                              type: 'faculty',
                              targetName: r.facultyName,
                              studentName: r.studentName || 'Student',
                              existingNote: r.actionNote,
                            });
                            setActionNoteInput(r.actionNote || '');
                            setActionNoteModalVisible(true);
                          }}
                        >
                          <Feather name="edit-3" size={13} color="#4F46E5" />
                          <Text style={styles.addActionBtnText}>Record Action Taken</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.submissionsList}>
                  {filteredCollegeReviews.map((r) => (
                    <View key={r.id} style={styles.reviewCard}>
                      <View style={styles.reviewCardHeader}>
                        <View style={[styles.reviewAvatar, { backgroundColor: '#DCFCE7' }]}>
                          <Feather name="home" size={18} color="#16A34A" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.reviewTarget}>Campus & Facilities Review</Text>
                          <Text style={styles.reviewMeta}>
                            Dept: {r.studentDepartment} • {r.studentSemester}
                          </Text>
                          <Text style={styles.reviewStudentBadge}>
                            Submitted by: {r.isAnonymous ? '🔒 Anonymous / Confidential' : `${r.studentName} (${r.studentUSN})`}
                          </Text>
                        </View>
                        <View style={styles.ratingPill}>
                          <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                          <Text style={styles.ratingPillText}>{r.overallRating.toFixed(1)}</Text>
                        </View>
                      </View>

                      {/* Facility mini ratings */}
                      <View style={styles.miniParamsRow}>
                        <Text style={styles.miniParam}>
                          Labs: <Text style={{ fontFamily: FontFamily.bold }}>{r.ratings.infrastructureLabs}★</Text>
                        </Text>
                        <Text style={styles.miniParam}>
                          Library: <Text style={{ fontFamily: FontFamily.bold }}>{r.ratings.libraryResources}★</Text>
                        </Text>
                        <Text style={styles.miniParam}>
                          Canteen: <Text style={{ fontFamily: FontFamily.bold }}>{r.ratings.canteenCleanliness}★</Text>
                        </Text>
                        <Text style={styles.miniParam}>
                          Placements: <Text style={{ fontFamily: FontFamily.bold }}>{r.ratings.placementsTraining}★</Text>
                        </Text>
                      </View>

                      {r.campusHighlights && (
                        <Text style={styles.reviewComment}>
                          <Text style={{ fontFamily: FontFamily.bold, color: '#1E40AF' }}>
                            Highlights:{' '}
                          </Text>
                          {r.campusHighlights}
                        </Text>
                      )}
                      {r.improvementSuggestions && (
                        <Text style={styles.reviewComment}>
                          <Text style={{ fontFamily: FontFamily.bold, color: '#991B1B' }}>
                            Improvement Suggestions:{' '}
                          </Text>
                          {r.improvementSuggestions}
                        </Text>
                      )}

                      {/* Action Note Row */}
                      {r.actionNote ? (
                        <View style={styles.actionNoteBox}>
                          <Feather name="check-circle" size={14} color="#15803D" />
                          <Text style={styles.actionNoteText}>
                            <Text style={{ fontFamily: FontFamily.bold }}>
                              Action Recorded ({r.actionBy}):{' '}
                            </Text>
                            {r.actionNote}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addActionBtn}
                          onPress={() => {
                            setSelectedReviewForAction({
                              id: r.id,
                              type: 'college',
                              targetName: 'Campus & Facilities',
                              studentName: r.studentName || 'Student',
                              existingNote: r.actionNote,
                            });
                            setActionNoteInput(r.actionNote || '');
                            setActionNoteModalVisible(true);
                          }}
                        >
                          <Feather name="edit-3" size={13} color="#4F46E5" />
                          <Text style={styles.addActionBtnText}>Record Action Taken</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* TAB 2: CAMPAIGN / CYCLE MANAGEMENT */}
          {adminTab === 'cycles' && (
            <View>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Review & Feedback Campaigns</Text>
                <TouchableOpacity
                  style={styles.inlineCreateBtn}
                  onPress={() => setCreateCycleModalVisible(true)}
                >
                  <Feather name="plus" size={14} color="#FFFFFF" />
                  <Text style={styles.inlineCreateBtnText}>New Campaign</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.submissionsList}>
                {cycles.map((c) => (
                  <View key={c.id} style={styles.cycleCard}>
                    <View style={styles.cycleCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cycleTitle}>{c.title}</Text>
                        <Text style={styles.cycleMeta}>
                          {c.academicYear} • {c.semester} • Scope: {c.scope.toUpperCase()}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          c.status === 'active'
                            ? styles.statusActive
                            : c.status === 'closed'
                            ? styles.statusClosed
                            : styles.statusScheduled,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            c.status === 'active'
                              ? styles.statusActiveText
                              : c.status === 'closed'
                              ? styles.statusClosedText
                              : styles.statusScheduledText,
                          ]}
                        >
                          {c.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {c.description && <Text style={styles.cycleDesc}>{c.description}</Text>}

                    <View style={styles.cycleStatsRow}>
                      <View style={styles.cycleStatItem}>
                        <Feather name="users" size={14} color="#64748B" />
                        <Text style={styles.cycleStatText}>
                          {c.totalSubmissions} Submissions
                        </Text>
                      </View>
                      <View style={styles.cycleStatItem}>
                        <Feather name="calendar" size={14} color="#64748B" />
                        <Text style={styles.cycleStatText}>Deadline: {c.endDate}</Text>
                      </View>
                      <View style={styles.cycleStatItem}>
                        <Feather name="layers" size={14} color="#64748B" />
                        <Text style={styles.cycleStatText}>
                          Depts: {c.targetDepartments.join(', ')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cycleActionRow}>
                      {c.status === 'active' ? (
                        <TouchableOpacity
                          style={styles.cycleToggleBtn}
                          onPress={async () => {
                            await updateCycleStatusApi(c.id, 'closed');
                            setCycles((prev) =>
                              prev.map((item) =>
                                item.id === c.id ? { ...item, status: 'closed' } : item
                              )
                            );
                            Alert.alert('Status Updated', 'Campaign marked as Closed.');
                          }}
                        >
                          <Feather name="slash" size={13} color="#DC2626" />
                          <Text style={[styles.cycleToggleBtnText, { color: '#DC2626' }]}>
                            Close Campaign
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.cycleToggleBtn}
                          onPress={async () => {
                            await updateCycleStatusApi(c.id, 'active');
                            setCycles((prev) =>
                              prev.map((item) =>
                                item.id === c.id ? { ...item, status: 'active' } : item
                              )
                            );
                            Alert.alert('Status Updated', 'Campaign marked as Active.');
                          }}
                        >
                          <Feather name="play" size={13} color="#16A34A" />
                          <Text style={[styles.cycleToggleBtnText, { color: '#16A34A' }]}>
                            Reopen Campaign
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 3: CAMPUS & DEPARTMENT ANALYTICS */}
          {adminTab === 'analytics' && (
            <View>
              {/* Campus Facilities Rating Card */}
              <View style={styles.cardContainer}>
                <Text style={styles.cardSectionTitle}>Campus Facilities Satisfaction Index</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Placements & Career Training</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '98%', backgroundColor: '#059669' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.9 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Computing Labs & High-Speed Wi-Fi</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '96%', backgroundColor: '#4F46E5' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.8 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Digital Library & Academic Journals</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '94%', backgroundColor: '#2563EB' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.7 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Student Welfare & Admin Support</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '90%', backgroundColor: '#7C3AED' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.5 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Cafeteria Hygiene & Food Quality</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '86%', backgroundColor: '#D97706' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.3 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Sports Amenities & Gymnasium</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '82%', backgroundColor: '#DC2626' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.1 / 5.0</Text>
                </View>
              </View>

              {/* Department Rankings Table */}
              <View style={[styles.cardContainer, { marginTop: 16 }]}>
                <Text style={styles.cardSectionTitle}>Department Student Satisfaction Index</Text>
                {instSummary?.departmentRankings.map((dept, idx) => (
                  <View key={dept.department} style={styles.deptRankRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>#{idx + 1}</Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.deptRankName}>{dept.department}</Text>
                      <Text style={styles.deptRankCount}>{dept.reviewCount} student responses</Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
                      <Text style={styles.ratingPillText}>{dept.averageRating.toFixed(1)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CREATE SURVEY CAMPAIGN (PRINCIPAL / HOD)               */}
      {/* ============================================================== */}
      <Modal
        visible={createCycleModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateCycleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 560 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Launch Feedback Survey</Text>
              <TouchableOpacity onPress={() => setCreateCycleModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }}>
              <Text style={styles.inputLabel}>Survey Campaign Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. End-Semester Faculty & Campus Appraisal 2026"
                value={newCycleTitle}
                onChangeText={setNewCycleTitle}
                placeholderTextColor="#94A3B8"
              />

              <View style={styles.twoColRow}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputLabel}>Academic Year</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newCycleAcadYear}
                    onChangeText={setNewCycleAcadYear}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.inputLabel}>Deadline</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={newCycleEndDate}
                    onChangeText={setNewCycleEndDate}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Evaluation Scope</Text>
              <View style={styles.scopeSelectorRow}>
                {(['both', 'faculty_only', 'college_only'] as const).map((sc) => (
                  <TouchableOpacity
                    key={sc}
                    style={[styles.scopeBtn, newCycleScope === sc && styles.scopeBtnActive]}
                    onPress={() => setNewCycleScope(sc)}
                  >
                    <Text
                      style={[
                        styles.scopeBtnText,
                        newCycleScope === sc && styles.scopeBtnTextActive,
                      ]}
                    >
                      {sc === 'both' ? 'Both' : sc === 'faculty_only' ? 'Faculty Only' : 'College Only'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Target Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  style={[styles.tagBtn, newCycleDept === 'all' && styles.tagBtnActive]}
                  onPress={() => setNewCycleDept('all')}
                >
                  <Text style={[styles.tagBtnText, newCycleDept === 'all' && styles.tagBtnTextActive]}>
                    All Departments
                  </Text>
                </TouchableOpacity>
                {INSTITUTION_DEPARTMENTS.map((dept) => (
                  <TouchableOpacity
                    key={dept}
                    style={[styles.tagBtn, newCycleDept === dept && styles.tagBtnActive]}
                    onPress={() => setNewCycleDept(dept)}
                  >
                    <Text
                      style={[
                        styles.tagBtnText,
                        newCycleDept === dept && styles.tagBtnTextActive,
                      ]}
                    >
                      {dept}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Description / Instructions</Text>
              <TextInput
                style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Guidelines for students regarding constructive evaluation..."
                multiline
                value={newCycleDesc}
                onChangeText={setNewCycleDesc}
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateCycleModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateCycle}>
                <Text style={styles.confirmBtnText}>Launch Survey</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: RATE FACULTY (STUDENT SUBMISSION)                      */}
      {/* ============================================================== */}
      <Modal
        visible={rateFacultyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRateFacultyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 580 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate a Faculty Member</Text>
              <TouchableOpacity onPress={() => setRateFacultyModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Select Professor / Lecturer</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {SAMPLE_FACULTY_MEMBERS.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.facultyChip,
                      selectedFaculty.id === f.id && styles.facultyChipActive,
                    ]}
                    onPress={() => setSelectedFaculty(f)}
                  >
                    <Text
                      style={[
                        styles.facultyChipName,
                        selectedFaculty.id === f.id && styles.facultyChipNameActive,
                      ]}
                    >
                      {f.name}
                    </Text>
                    <Text
                      style={[
                        styles.facultyChipSubject,
                        selectedFaculty.id === f.id && styles.facultyChipSubjectActive,
                      ]}
                    >
                      {f.subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Anonymous Toggle */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Submit Anonymously</Text>
                  <Text style={styles.switchSub}>
                    Your name and USN will remain strictly confidential.
                  </Text>
                </View>
                <Switch
                  value={facIsAnonymous}
                  onValueChange={setFacIsAnonymous}
                  trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                  thumbColor={facIsAnonymous ? '#4F46E5' : '#F1F5F9'}
                />
              </View>

              {/* Star Rating Parameters */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Evaluation Criteria (1 to 5 Stars)</Text>
              {renderStarSelector('Subject Knowledge & Expertise', facRatings.subjectKnowledge, (val) =>
                setFacRatings((p) => ({ ...p, subjectKnowledge: val }))
              )}
              {renderStarSelector('Teaching Clarity & Methodology', facRatings.teachingClarity, (val) =>
                setFacRatings((p) => ({ ...p, teachingClarity: val }))
              )}
              {renderStarSelector('Punctuality & Class Regularity', facRatings.punctuality, (val) =>
                setFacRatings((p) => ({ ...p, punctuality: val }))
              )}
              {renderStarSelector('Doubt Clearing & Mentorship', facRatings.doubtResolution, (val) =>
                setFacRatings((p) => ({ ...p, doubtResolution: val }))
              )}
              {renderStarSelector('Course Coverage & Lab Guidance', facRatings.courseCoverage, (val) =>
                setFacRatings((p) => ({ ...p, courseCoverage: val }))
              )}

              {/* Written Remarks */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Key Strengths</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What does this professor do best? e.g. Clear examples..."
                value={facStrengths}
                onChangeText={setFacStrengths}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Areas of Growth / Improvement</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Constructive suggestions for improvement..."
                value={facImprovements}
                onChangeText={setFacImprovements}
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRateFacultyModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSubmitFacultyReview}>
                <Text style={styles.confirmBtnText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: RATE COLLEGE FACILITIES (STUDENT SUBMISSION)           */}
      {/* ============================================================== */}
      <Modal
        visible={rateCollegeModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setRateCollegeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 580 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review College & Facilities</Text>
              <TouchableOpacity onPress={() => setRateCollegeModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              {/* Anonymous Toggle */}
              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchTitle}>Submit Anonymously</Text>
                  <Text style={styles.switchSub}>
                    Your feedback will be delivered directly to the management team.
                  </Text>
                </View>
                <Switch
                  value={colIsAnonymous}
                  onValueChange={setColIsAnonymous}
                  trackColor={{ false: '#CBD5E1', true: '#818CF8' }}
                  thumbColor={colIsAnonymous ? '#4F46E5' : '#F1F5F9'}
                />
              </View>

              {/* Star Rating Parameters */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Facility Ratings (1 to 5 Stars)</Text>
              {renderStarSelector('Infrastructure, Labs & Wi-Fi', colRatings.infrastructureLabs, (val) =>
                setColRatings((p) => ({ ...p, infrastructureLabs: val }))
              )}
              {renderStarSelector('Library & Academic Resources', colRatings.libraryResources, (val) =>
                setColRatings((p) => ({ ...p, libraryResources: val }))
              )}
              {renderStarSelector('Canteen Hygiene & Cleanliness', colRatings.canteenCleanliness, (val) =>
                setColRatings((p) => ({ ...p, canteenCleanliness: val }))
              )}
              {renderStarSelector('Sports & Extracurriculars', colRatings.sportsExtracurriculars, (val) =>
                setColRatings((p) => ({ ...p, sportsExtracurriculars: val }))
              )}
              {renderStarSelector('Administration & Student Support', colRatings.adminStudentSupport, (val) =>
                setColRatings((p) => ({ ...p, adminStudentSupport: val }))
              )}
              {renderStarSelector('Placements & Internship Cell', colRatings.placementsTraining, (val) =>
                setColRatings((p) => ({ ...p, placementsTraining: val }))
              )}

              {/* Written Remarks */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Campus Highlights</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What facilities do you appreciate the most?"
                value={colHighlights}
                onChangeText={setColHighlights}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Suggestions for Improvement</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What can the college administration enhance or fix?"
                value={colSuggestions}
                onChangeText={setColSuggestions}
                placeholderTextColor="#94A3B8"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRateCollegeModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: '#059669' }]}
                onPress={handleSubmitCollegeReview}
              >
                <Text style={styles.confirmBtnText}>Submit College Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 4: RECORD ACTION NOTE (PRINCIPAL / HOD)                   */}
      {/* ============================================================== */}
      <Modal
        visible={actionNoteModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setActionNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Record Action Taken</Text>
              <TouchableOpacity onPress={() => setActionNoteModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.actionModalSub}>
              Target: <Text style={{ fontFamily: FontFamily.bold }}>{selectedReviewForAction?.targetName}</Text>
            </Text>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Administrative Action / Resolution</Text>
            <TextInput
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="e.g. Discussed in academic council; extra practice sessions and lab equipment upgrade scheduled."
              multiline
              value={actionNoteInput}
              onChangeText={setActionNoteInput}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setActionNoteModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSaveActionNote}>
                <Text style={styles.confirmBtnText}>Save Action Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 5: FILTER MODAL (DEPT & RATING)                           */}
      {/* ============================================================== */}
      <Modal
        visible={filterModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 440 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Reviews</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Filter by Department</Text>
            <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
              <TouchableOpacity
                style={[
                  styles.filterOptionRow,
                  selectedDeptFilter === 'all' && styles.filterOptionRowActive,
                ]}
                onPress={() => setSelectedDeptFilter('all')}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedDeptFilter === 'all' && styles.filterOptionTextActive,
                  ]}
                >
                  All Departments
                </Text>
                {selectedDeptFilter === 'all' && (
                  <Feather name="check" size={16} color="#4F46E5" />
                )}
              </TouchableOpacity>
              {INSTITUTION_DEPARTMENTS.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[
                    styles.filterOptionRow,
                    selectedDeptFilter === dept && styles.filterOptionRowActive,
                  ]}
                  onPress={() => setSelectedDeptFilter(dept)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedDeptFilter === dept && styles.filterOptionTextActive,
                    ]}
                  >
                    {dept}
                  </Text>
                  {selectedDeptFilter === dept && (
                    <Feather name="check" size={16} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>Filter by Star Rating</Text>
            <View style={styles.ratingFilterRow}>
              {(
                [
                  { key: 'all', label: 'All Ratings' },
                  { key: '5', label: '4.7+ ★' },
                  { key: '4', label: '3.8 - 4.6 ★' },
                  { key: 'under_4', label: '< 3.8 ★' },
                ] as const
              ).map((rf) => (
                <TouchableOpacity
                  key={rf.key}
                  style={[styles.ratingPillBtn, ratingFilter === rf.key && styles.ratingPillBtnActive]}
                  onPress={() => setRatingFilter(rf.key)}
                >
                  <Text
                    style={[
                      styles.ratingPillBtnText,
                      ratingFilter === rf.key && styles.ratingPillBtnTextActive,
                    ]}
                  >
                    {rf.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setSelectedDeptFilter('all');
                  setRatingFilter('all');
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.confirmBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    alignSelf: 'center',
    width: '100%',
    padding: 16,
    paddingBottom: 40,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: '#64748B',
  },

  // HEADER
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 260,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: '#0F172A',
  },
  headerSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  launchBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // KPI STATS
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  kpiLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  kpiVal: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#0F172A',
  },
  kpiSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#94A3B8',
  },

  // STUDENT VIEW
  studentSection: {
    width: '100%',
  },
  actionBanner: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  actionBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#312E81',
  },
  actionBannerDesc: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#4338CA',
    marginTop: 2,
  },
  actionBannerDeadline: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  actionBtnGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  primaryActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // SECTION HEADERS
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#0F172A',
  },
  sectionBadge: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // CARDS & SUBMISSIONS LIST
  submissionsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewTarget: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  reviewMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  reviewStudentBadge: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#475569',
    marginTop: 3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  ratingPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#92400E',
  },
  miniParamsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  miniParam: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#475569',
  },
  reviewComment: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 6,
  },
  actionNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  actionNoteText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#14532D',
    flex: 1,
  },
  addActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    alignSelf: 'flex-start',
  },
  addActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#4F46E5',
  },

  // EMPTY STATE
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 36,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#334155',
    marginTop: 10,
  },
  emptyDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  // TEACHER & ANALYTICS PROGRESS BARS
  teacherSection: {
    width: '100%',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#0F172A',
    marginBottom: 16,
  },
  progressRow: {
    marginBottom: 14,
  },
  progressLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#334155',
    marginBottom: 5,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressScore: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
  },

  // ADMIN SECTION & SEGMENTS
  adminSection: {
    width: '100%',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  segmentBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#64748B',
  },
  segmentBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },

  // REVIEW TYPE SELECTOR
  reviewTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  reviewTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  reviewTypeBtnActive: {
    backgroundColor: '#4F46E5',
  },
  reviewTypeBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#475569',
  },
  reviewTypeBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // SEARCH & FILTER
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#0F172A',
  },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#3730A3',
  },
  clearAllFilters: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#DC2626',
    marginLeft: 4,
  },

  // CYCLES CARD
  inlineCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  inlineCreateBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  cycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cycleCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cycleTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  cycleMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cycleDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#334155',
    marginTop: 8,
  },
  cycleStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  cycleStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cycleStatText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#64748B',
  },
  cycleActionRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cycleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    gap: 4,
  },
  cycleToggleBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
  },

  // STATUS BADGES
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
  },
  statusActive: {
    backgroundColor: '#DCFCE7',
  },
  statusActiveText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#15803D',
  },
  statusClosed: {
    backgroundColor: '#F1F5F9',
  },
  statusClosedText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#64748B',
  },
  statusScheduled: {
    backgroundColor: '#FEF3C7',
  },
  statusScheduledText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#B45309',
  },

  // DEPT RANKING TABLE
  deptRankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#4F46E5',
  },
  deptRankName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#0F172A',
  },
  deptRankCount: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
  },

  // MODAL OVERLAYS & CARDS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#0F172A',
  },
  actionModalSub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#64748B',
  },
  inputLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  twoColRow: {
    flexDirection: 'row',
  },
  scopeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  scopeBtnActive: {
    backgroundColor: '#4F46E5',
  },
  scopeBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#475569',
  },
  scopeBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  tagBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  tagBtnActive: {
    backgroundColor: '#4F46E5',
  },
  tagBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#475569',
  },
  tagBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  switchTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  switchSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  facultyChip: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    minWidth: 140,
  },
  facultyChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4F46E5',
  },
  facultyChipName: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  facultyChipNameActive: {
    color: '#4F46E5',
  },
  facultyChipSubject: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  facultyChipSubjectActive: {
    color: '#3730A3',
  },

  // STAR SELECTOR
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
  },
  starLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  starButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starTouch: {
    padding: 2,
  },
  starScoreText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#D97706',
    marginLeft: 6,
    minWidth: 26,
  },

  // MODAL FOOTERS
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#475569',
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#4F46E5',
  },
  confirmBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // FILTER MODAL ROWS
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  filterOptionRowActive: {
    backgroundColor: '#EEF2FF',
    borderRadius: 6,
  },
  filterOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#334155',
  },
  filterOptionTextActive: {
    fontFamily: FontFamily.bold,
    color: '#4F46E5',
  },
  ratingFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  ratingPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  ratingPillBtnActive: {
    backgroundColor: '#4F46E5',
  },
  ratingPillBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#475569',
  },
  ratingPillBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
});
