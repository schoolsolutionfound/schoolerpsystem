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
  CourseSubjectAllocation,
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
  fetchStudentAllocationsApi,
  matchesDepartment,
} from '../../../api/studentFeedback';

const INSTITUTION_DEPARTMENTS = [
  'Mathematics & Science',
  'Humanities & Languages',
  'Computer Science & Engineering',
  'Computer Science',
  'Artificial Intelligence & Machine Learning',
  'AIML',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'Commerce & Mgmt',
  'Applied Sciences',
];

const SAMPLE_FACULTY_MEMBERS = [
  { id: 'fac-1', name: 'Dr. Linus Torvalds', department: 'Computer Science & Engineering', subject: 'Operating Systems & System Programming' },
  { id: 'fac-2', name: 'Prof. Dennis Ritchie', department: 'Computer Science & Engineering', subject: 'Database Management Systems & SQL' },
  { id: 'fac-3', name: 'Dr. Donald Knuth', department: 'Computer Science & Engineering', subject: 'Algorithm Analysis & TeX' },
  { id: 'fac-4', name: 'Prof. Ada Lovelace', department: 'Computer Science & Engineering', subject: 'Computational Logic & Databases' },
  { id: 'fac-5', name: 'Dr. Tim Berners-Lee', department: 'Computer Science & Engineering', subject: 'Distributed Systems & WWW' },
  { id: 'fac-6', name: 'Dr. Bjarne Stroustrup', department: 'Computer Science & Engineering', subject: 'C++ & Object Oriented Design' },
  { id: 'fac-hinton', name: 'Dr. Geoffrey Hinton', department: 'Artificial Intelligence & Machine Learning', subject: 'Deep Learning & Neural Networks' },
  { id: 'fac-lecun', name: 'Prof. Yann LeCun', department: 'Artificial Intelligence & Machine Learning', subject: 'Computer Vision & Convolutional Nets' },
  { id: 'fac-bengio', name: 'Dr. Yoshua Bengio', department: 'Artificial Intelligence & Machine Learning', subject: 'Natural Language Processing & LLMs' },
  { id: 'fac-01', name: 'Dr. Rajesh Iyer', department: 'Mathematics & Science', subject: 'Mathematics' },
  { id: 'fac-01', name: 'Dr. Rajesh Iyer', department: 'Humanities & Languages', subject: 'English' },
  { id: 'fac-02', name: 'Prof. Sneha Sharma', department: 'Applied Sciences', subject: 'Physics' },
  { id: 'fac-03', name: 'Dr. Anand Rao', department: 'Computer Science', subject: 'Computer Science' },
  { id: 'fac-04', name: 'Dr. Ramesh Kumar', department: 'Electronics & Comm', subject: 'Digital Signal Processing' },
  { id: 'fac-05', name: 'Prof. Vikram Hegde', department: 'Mechanical Eng', subject: 'Thermodynamics & Heat Transfer' },
];

export function getRatingLabel(score: number): string {
  const rounded = Math.round(score);
  if (rounded <= 1) return 'Very Poor';
  if (rounded === 2) return 'Poor';
  if (rounded === 3) return 'Average';
  if (rounded === 4) return 'Good';
  return 'Very Good';
}

const renderVisualStars = (score: number, size = 13) => {
  const rounded = Math.round(score);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <MaterialCommunityIcons
          key={i}
          name={i <= rounded ? 'star' : 'star-outline'}
          size={size}
          color={i <= rounded ? '#F4C430' : '#CBD5E1'}
        />
      ))}
    </View>
  );
};

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

  // Student course allocations (each subject evaluated separately)
  const [studentAllocations, setStudentAllocations] = useState<CourseSubjectAllocation[]>([]);
  const [selectedAllocation, setSelectedAllocation] = useState<CourseSubjectAllocation | null>(null);

  // Active sub-tab for Principal / HOD
  const [adminTab, setAdminTab] = useState<'reviews' | 'faculty_overview' | 'complaints' | 'cycles' | 'analytics'>('reviews');
  const [reviewTypeTab, setReviewTypeTab] = useState<'faculty' | 'college'>('faculty');

  // Clubbed faculty drilldown selection & subject sub-filters
  const [selectedFacultyForClubbed, setSelectedFacultyForClubbed] = useState<string | null>(null);
  const [clubbedSubjectFilter, setClubbedSubjectFilter] = useState<string>('all');

  // Pagination states & Page loader (5 items per page)
  const ITEMS_PER_PAGE = 5;
  const [facultyPage, setFacultyPage] = useState(1);
  const [clubbedReviewsPage, setClubbedReviewsPage] = useState(1);
  const [collegeReviewsPage, setCollegeReviewsPage] = useState(1);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // Search & Filters for reviews
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [teacherSubjectFilter, setTeacherSubjectFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');
  const [complaintsOnlyFilter, setComplaintsOnlyFilter] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // Tab & Drilldown Switchers with smooth loading animation
  const handleSwitchAdminTab = (newTab: typeof adminTab) => {
    setIsPageLoading(true);
    setAdminTab(newTab);
    setSelectedFacultyForClubbed(null);
    setFacultyPage(1);
    setClubbedReviewsPage(1);
    setTimeout(() => setIsPageLoading(false), 140);
  };

  const handleSwitchReviewType = (newType: 'faculty' | 'college') => {
    setIsPageLoading(true);
    setReviewTypeTab(newType);
    setSelectedFacultyForClubbed(null);
    setFacultyPage(1);
    setCollegeReviewsPage(1);
    setTimeout(() => setIsPageLoading(false), 140);
  };

  const handleSelectFacultyForClubbed = (facId: string) => {
    setIsPageLoading(true);
    setSelectedFacultyForClubbed(facId);
    setClubbedSubjectFilter('all');
    setClubbedReviewsPage(1);
    setTimeout(() => setIsPageLoading(false), 140);
  };

  const handleBackToFacultyList = () => {
    setIsPageLoading(true);
    setSelectedFacultyForClubbed(null);
    setTimeout(() => setIsPageLoading(false), 140);
  };

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
  const [newCycleDeptDropdownOpen, setNewCycleDeptDropdownOpen] = useState(false);
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
  const [facHasComplaint, setFacHasComplaint] = useState(false);
  const [facComplaintText, setFacComplaintText] = useState('');

  // Collapsible criteria details per card to keep card compact
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const toggleCriteriaExpanded = (reviewId: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [reviewId]: !prev[reviewId] }));
  };

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
  const [colHasComplaint, setColHasComplaint] = useState(false);
  const [colComplaintText, setColComplaintText] = useState('');

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

      if (userRole === 'student') {
        const allocs = await fetchStudentAllocationsApi(currentUserId);
        setStudentAllocations(allocs);
      } else if (userRole === 'teacher') {
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
  }, [userRole, userDepartment, currentUserName, currentUserId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Dynamically derived faculty list
  const facultyMembersList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; department: string }>();
    SAMPLE_FACULTY_MEMBERS.forEach((f) => map.set(f.id, { id: f.id, name: f.name, department: f.department }));
    facultyReviews.forEach((r) => {
      if (!map.has(r.facultyId)) {
        map.set(r.facultyId, { id: r.facultyId, name: r.facultyName, department: r.facultyDepartment });
      }
    });
    return Array.from(map.values());
  }, [facultyReviews]);

  // Overall Faculty Performance Summary for Principal
  const facultySummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        facultyId: string;
        facultyName: string;
        facultyDepartment: string;
        totalReviews: number;
        totalScore: number;
        complaintsCount: number;
        subjects: { [sub: string]: { count: number; scoreSum: number } };
      }
    >();

    facultyMembersList.forEach((f) => {
      map.set(f.id, {
        facultyId: f.id,
        facultyName: f.name,
        facultyDepartment: f.department,
        totalReviews: 0,
        totalScore: 0,
        complaintsCount: 0,
        subjects: {},
      });
    });

    facultyReviews.forEach((r) => {
      let item = map.get(r.facultyId);
      if (!item) {
        item = {
          facultyId: r.facultyId,
          facultyName: r.facultyName,
          facultyDepartment: r.facultyDepartment,
          totalReviews: 0,
          totalScore: 0,
          complaintsCount: 0,
          subjects: {},
        };
        map.set(r.facultyId, item);
      }
      item.totalReviews += 1;
      item.totalScore += r.overallRating;
      if (r.hasComplaint) item.complaintsCount += 1;
      if (!item.subjects[r.subjectName]) {
        item.subjects[r.subjectName] = { count: 0, scoreSum: 0 };
      }
      item.subjects[r.subjectName].count += 1;
      item.subjects[r.subjectName].scoreSum += r.overallRating;
    });

    return Array.from(map.values()).map((f) => ({
      ...f,
      averageRating: f.totalReviews > 0 ? Number((f.totalScore / f.totalReviews).toFixed(1)) : 0,
      subjectBreakdown: Object.keys(f.subjects).map((sub) => ({
        subjectName: sub,
        count: f.subjects[sub].count,
        averageRating: Number((f.subjects[sub].scoreSum / f.subjects[sub].count).toFixed(1)),
      })),
    }));
  }, [facultyReviews, facultyMembersList]);

  // Dynamically derived subject list for filters
  const subjectList = useMemo(() => {
    const set = new Set<string>();
    facultyReviews.forEach((r) => {
      if (r.subjectName) set.add(r.subjectName);
    });
    studentAllocations.forEach((a) => {
      if (a.subjectName) set.add(a.subjectName);
    });
    return ['all', ...Array.from(set)];
  }, [facultyReviews, studentAllocations]);

  // Total student complaints across faculty and campus
  const totalComplaintsCount = useMemo(() => {
    return (
      facultyReviews.filter((r) => r.hasComplaint).length +
      collegeReviews.filter((r) => r.hasComplaint).length
    );
  }, [facultyReviews, collegeReviews]);

  // Filtered Reviews for Admin/HOD
  const filteredFacultyReviews = useMemo(() => {
    return facultyReviews.filter((r) => {
      const matchSearch =
        searchQuery === '' ||
        r.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.studentName && r.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.strengths && r.strengths.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.complaintText && r.complaintText.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept =
        selectedDeptFilter === 'all' || matchesDepartment(r.facultyDepartment, selectedDeptFilter);

      const matchFaculty =
        selectedFacultyFilter === 'all' || r.facultyId === selectedFacultyFilter;

      const matchSubject =
        selectedSubjectFilter === 'all' ||
        r.subjectName.toLowerCase() === selectedSubjectFilter.toLowerCase();

      let matchRating = true;
      if (ratingFilter === '5') matchRating = Math.round(r.overallRating) === 5;
      else if (ratingFilter === '4') matchRating = Math.round(r.overallRating) === 4;
      else if (ratingFilter === '3') matchRating = Math.round(r.overallRating) === 3;
      else if (ratingFilter === '2') matchRating = Math.round(r.overallRating) === 2;
      else if (ratingFilter === '1') matchRating = Math.round(r.overallRating) === 1;

      const matchComplaint =
        (!complaintsOnlyFilter && adminTab !== 'complaints') || !!r.hasComplaint;

      return matchSearch && matchDept && matchFaculty && matchSubject && matchRating && matchComplaint;
    });
  }, [
    facultyReviews,
    searchQuery,
    selectedDeptFilter,
    selectedFacultyFilter,
    selectedSubjectFilter,
    ratingFilter,
    complaintsOnlyFilter,
    adminTab,
  ]);

  const teacherFilteredReviews = useMemo(() => {
    if (!teacherSummary) return [];
    if (teacherSubjectFilter === 'all') return teacherSummary.recentReviews;
    return teacherSummary.recentReviews.filter(
      (r) => r.subjectName.toLowerCase() === teacherSubjectFilter.toLowerCase()
    );
  }, [teacherSummary, teacherSubjectFilter]);

  const filteredCollegeReviews = useMemo(() => {
    return collegeReviews.filter((r) => {
      const matchSearch =
        searchQuery === '' ||
        (r.studentName && r.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.campusHighlights && r.campusHighlights.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.improvementSuggestions && r.improvementSuggestions.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept =
        selectedDeptFilter === 'all' || matchesDepartment(r.studentDepartment, selectedDeptFilter);

      let matchRating = true;
      if (ratingFilter === '5') matchRating = Math.round(r.overallRating) === 5;
      else if (ratingFilter === '4') matchRating = Math.round(r.overallRating) === 4;
      else if (ratingFilter === '3') matchRating = Math.round(r.overallRating) === 3;
      else if (ratingFilter === '2') matchRating = Math.round(r.overallRating) === 2;
      else if (ratingFilter === '1') matchRating = Math.round(r.overallRating) === 1;

      const matchComplaint =
        (!complaintsOnlyFilter && adminTab !== 'complaints') || !!r.hasComplaint;

      return matchSearch && matchDept && matchRating && matchComplaint;
    });
  }, [collegeReviews, searchQuery, selectedDeptFilter, ratingFilter, complaintsOnlyFilter, adminTab]);

  // Filtered Faculty Summaries for the main Faculty Directory view
  const filteredFacultySummaries = useMemo(() => {
    return facultySummaries.filter((f) => {
      if (f.totalReviews === 0) return false;
      const matchSearch =
        searchQuery === '' ||
        f.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.facultyDepartment.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.subjectBreakdown.some((s) => s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept =
        selectedDeptFilter === 'all' || matchesDepartment(f.facultyDepartment, selectedDeptFilter);

      const matchFaculty =
        selectedFacultyFilter === 'all' || f.facultyId === selectedFacultyFilter;

      const matchSubject =
        selectedSubjectFilter === 'all' ||
        f.subjectBreakdown.some((s) => s.subjectName.toLowerCase() === selectedSubjectFilter.toLowerCase());

      let matchRating = true;
      if (ratingFilter === '5') matchRating = Math.round(f.averageRating) === 5;
      else if (ratingFilter === '4') matchRating = Math.round(f.averageRating) === 4;
      else if (ratingFilter === '3') matchRating = Math.round(f.averageRating) === 3;
      else if (ratingFilter === '2') matchRating = Math.round(f.averageRating) === 2;
      else if (ratingFilter === '1') matchRating = Math.round(f.averageRating) === 1;

      const matchComplaint =
        (!complaintsOnlyFilter && adminTab !== 'complaints') || f.complaintsCount > 0;

      return matchSearch && matchDept && matchFaculty && matchSubject && matchRating && matchComplaint;
    });
  }, [
    facultySummaries,
    searchQuery,
    selectedDeptFilter,
    selectedFacultyFilter,
    selectedSubjectFilter,
    ratingFilter,
    complaintsOnlyFilter,
    adminTab,
  ]);

  // Selected faculty's summary data
  const activeFacultySummary = useMemo(() => {
    if (!selectedFacultyForClubbed) return null;
    return facultySummaries.find((f) => f.facultyId === selectedFacultyForClubbed) || null;
  }, [selectedFacultyForClubbed, facultySummaries]);

  // All reviews for the selected faculty clubbed together
  const activeFacultyClubbedReviews = useMemo(() => {
    if (!selectedFacultyForClubbed) return [];
    return facultyReviews.filter((r) => {
      if (r.facultyId !== selectedFacultyForClubbed) return false;
      if (clubbedSubjectFilter !== 'all' && r.subjectName.toLowerCase() !== clubbedSubjectFilter.toLowerCase()) {
        return false;
      }
      if (complaintsOnlyFilter || adminTab === 'complaints') {
        if (!r.hasComplaint) return false;
      }
      return true;
    });
  }, [selectedFacultyForClubbed, facultyReviews, clubbedSubjectFilter, complaintsOnlyFilter, adminTab]);

  // Slices for pagination (5 items per page)
  const totalFacultyPages = Math.max(1, Math.ceil(filteredFacultySummaries.length / ITEMS_PER_PAGE));
  const paginatedFaculty = useMemo(() => {
    const start = (facultyPage - 1) * ITEMS_PER_PAGE;
    return filteredFacultySummaries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFacultySummaries, facultyPage, ITEMS_PER_PAGE]);

  const totalClubbedPages = Math.max(1, Math.ceil(activeFacultyClubbedReviews.length / ITEMS_PER_PAGE));
  const paginatedClubbedReviews = useMemo(() => {
    const start = (clubbedReviewsPage - 1) * ITEMS_PER_PAGE;
    return activeFacultyClubbedReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [activeFacultyClubbedReviews, clubbedReviewsPage, ITEMS_PER_PAGE]);

  const totalCollegePages = Math.max(1, Math.ceil(filteredCollegeReviews.length / ITEMS_PER_PAGE));
  const paginatedCollegeReviews = useMemo(() => {
    const start = (collegeReviewsPage - 1) * ITEMS_PER_PAGE;
    return filteredCollegeReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCollegeReviews, collegeReviewsPage, ITEMS_PER_PAGE]);

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
        studentName: 'Anonymous Student',
        studentUSN: 'Confidential',
        studentDepartment: userDepartment,
        studentSemester: 'Semester 5',
        isAnonymous: true,
        facultyId: selectedFaculty.id,
        facultyName: selectedFaculty.name,
        facultyDepartment: selectedFaculty.department,
        subjectName: selectedFaculty.subject,
        ratings: facRatings,
        overallRating: avg,
        strengths: facStrengths.trim() || undefined,
        areasOfImprovement: facImprovements.trim() || undefined,
        generalComments: facComments.trim() || undefined,
        hasComplaint: facHasComplaint,
        complaintText: facHasComplaint ? facComplaintText.trim() : undefined,
      });

      setFacultyReviews((prev) => [created, ...prev]);

      // Update student allocations status immediately so reviewed card switches to completed
      setStudentAllocations((prev) =>
        prev.map((a) =>
          a.facultyId === selectedFaculty.id &&
          a.subjectName.toLowerCase() === selectedFaculty.subject.toLowerCase()
            ? { ...a, hasStudentReviewed: true, studentReviewRating: avg }
            : a
        )
      );

      setRateFacultyModalVisible(false);
      setFacStrengths('');
      setFacImprovements('');
      setFacComments('');
      setFacHasComplaint(false);
      setFacComplaintText('');
      Alert.alert(
        'Review Submitted',
        `Your review for ${selectedFaculty.name} (${selectedFaculty.subject}) has been recorded.`
      );
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
        studentName: 'Anonymous Student',
        studentUSN: 'Confidential',
        studentDepartment: userDepartment,
        studentSemester: 'Semester 5',
        isAnonymous: true,
        ratings: colRatings,
        overallRating: avg,
        campusHighlights: colHighlights.trim() || undefined,
        improvementSuggestions: colSuggestions.trim() || undefined,
        hasComplaint: colHasComplaint,
        complaintText: colHasComplaint ? colComplaintText.trim() : undefined,
      });

      setCollegeReviews((prev) => [created, ...prev]);
      setRateCollegeModalVisible(false);
      setColHighlights('');
      setColSuggestions('');
      setColHasComplaint(false);
      setColComplaintText('');
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

  // Helper: 5-point qualitative evaluation scale (out of 5)
  // 1: Very Poor, 2: Poor, 3: Average, 4: Good, 5: Very Good
  const render5OptionSelector = (
    label: string,
    currentVal: number,
    onChange: (val: number) => void
  ) => {
    const scale = [
      { score: 1, label: 'Very Poor' },
      { score: 2, label: 'Poor' },
      { score: 3, label: 'Average' },
      { score: 4, label: 'Good' },
      { score: 5, label: 'Very Good' },
    ];

    return (
      <View style={styles.optionSelectorBlock}>
        <View style={styles.optionSelectorHeader}>
          <Text style={styles.starLabel}>{label}</Text>
          <View style={styles.currentRatingBadge}>
            <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
            <Text style={styles.currentRatingScoreText}>
              {currentVal}/5 · {getRatingLabel(currentVal)}
            </Text>
          </View>
        </View>

        <View style={styles.optionChipsRow}>
          {scale.map((opt) => {
            const isSelected = currentVal === opt.score;
            return (
              <TouchableOpacity
                key={opt.score}
                style={[
                  styles.scaleOptionBtn,
                  isSelected && styles.scaleOptionBtnActive,
                ]}
                onPress={() => onChange(opt.score)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.scaleOptionScore,
                    isSelected && styles.scaleOptionScoreActive,
                  ]}
                >
                  {opt.score}★
                </Text>
                <Text
                  style={[
                    styles.scaleOptionLabel,
                    isSelected && styles.scaleOptionLabelActive,
                  ]}
                  numberOfLines={1}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Helper: Pagination Controls
  const renderPaginationControls = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    itemName: string,
    onPageChange: (newPage: number) => void
  ) => {
    if (totalItems <= ITEMS_PER_PAGE) return null;
    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

    return (
      <View style={styles.paginationBox}>
        <Text style={styles.paginationText}>
          Showing <Text style={{ fontFamily: FontFamily.bold }}>{startItem}-{endItem}</Text> of{' '}
          <Text style={{ fontFamily: FontFamily.bold }}>{totalItems}</Text> {itemName}
        </Text>

        <View style={styles.paginationActionRow}>
          <TouchableOpacity
            style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]}
            disabled={currentPage === 1}
            onPress={() => {
              setIsPageLoading(true);
              onPageChange(currentPage - 1);
              setTimeout(() => setIsPageLoading(false), 120);
            }}
            activeOpacity={0.8}
          >
            <Feather name="chevron-left" size={15} color={currentPage === 1 ? '#94A3B8' : '#0F172A'} />
            <Text style={[styles.pageBtnText, currentPage === 1 && styles.pageBtnTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          <View style={styles.pageIndicatorPill}>
            <Text style={styles.pageIndicatorText}>
              {currentPage} / {totalPages}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]}
            disabled={currentPage === totalPages}
            onPress={() => {
              setIsPageLoading(true);
              onPageChange(currentPage + 1);
              setTimeout(() => setIsPageLoading(false), 120);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.pageBtnText, currentPage === totalPages && styles.pageBtnTextDisabled]}>Next</Text>
            <Feather name="chevron-right" size={15} color={currentPage === totalPages ? '#94A3B8' : '#0F172A'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Computed dynamic ratings for KPI summary strip so values correlate directly with actual reviews
  const computedFacultyRating = useMemo(() => {
    if (facultyReviews.length > 0) {
      const sum = facultyReviews.reduce((acc, r) => acc + r.overallRating, 0);
      return (sum / facultyReviews.length).toFixed(1);
    }
    if (userRole === 'principal' && instSummary?.facultyOverallAverage) {
      return instSummary.facultyOverallAverage.toFixed(1);
    }
    return '—';
  }, [facultyReviews, userRole, instSummary]);

  const computedCampusRating = useMemo(() => {
    if (collegeReviews.length > 0) {
      const sum = collegeReviews.reduce((acc, r) => acc + r.overallRating, 0);
      return (sum / collegeReviews.length).toFixed(1);
    }
    if (instSummary?.collegeOverallRating) {
      return instSummary.collegeOverallRating.toFixed(1);
    }
    return '—';
  }, [collegeReviews, instSummary]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#0F172A" />
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
        </View>
        {(userRole === 'principal' || userRole === 'hod') && (
          <TouchableOpacity
            style={styles.launchBtn}
            onPress={() => setCreateCycleModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus-circle" size={15} color="#0F172A" />
            <Text style={styles.launchBtnText}>Launch Survey</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* COMPACT BRAND KPI SUMMARY STRIP */}
      <View style={styles.summaryStrip}>
        {userRole === 'teacher' ? (
          <>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Rating</Text>
              <View style={styles.summaryValRow}>
                <MaterialCommunityIcons name="star" size={13} color="#F4C430" />
                <Text style={styles.summaryVal}>{teacherSummary?.averageRating || 4.8}</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Reviews</Text>
              <Text style={styles.summaryVal}>{teacherSummary?.totalReviews || 42}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Complaints</Text>
              <Text
                style={[
                  styles.summaryVal,
                  {
                    color: teacherSummary?.recentReviews.filter((r) => r.hasComplaint).length
                      ? '#DC2626'
                      : '#0F172A',
                  },
                ]}
              >
                {teacherSummary?.recentReviews.filter((r) => r.hasComplaint).length || 0}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Campus</Text>
              <View style={styles.summaryValRow}>
                {computedCampusRating !== '—' && (
                  <MaterialCommunityIcons name="star" size={13} color="#F4C430" />
                )}
                <Text style={styles.summaryVal}>{computedCampusRating}</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Faculty</Text>
              <View style={styles.summaryValRow}>
                {computedFacultyRating !== '—' && (
                  <MaterialCommunityIcons name="star" size={13} color="#F4C430" />
                )}
                <Text style={styles.summaryVal}>{computedFacultyRating}</Text>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Reviews</Text>
              <Text style={styles.summaryVal}>{facultyReviews.length + collegeReviews.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Complaints</Text>
              <Text style={[styles.summaryVal, totalComplaintsCount > 0 && { color: '#DC2626' }]}>
                {totalComplaintsCount}
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
          {/* Active Survey Banner */}
          <View style={styles.actionBanner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionBannerTitle}>Subject Faculty Feedback Campaign</Text>
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
                style={styles.neutralActionBtn}
                onPress={() => setRateCollegeModalVisible(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="office-building-marker" size={16} color="#0F172A" />
                <Text style={styles.neutralActionBtnText}>Review Campus Facilities</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Assigned Subjects & Teachers to Review */}
          <View style={styles.allocSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>My Courses & Faculty Evaluations</Text>
                <Text style={styles.sectionSubtitle}>
                  Every student must review each assigned subject separately. If a teacher teaches multiple subjects (e.g., Mathematics and English), review that teacher once for each subject.
                </Text>
              </View>
            </View>

            <View style={styles.allocList}>
              {studentAllocations.map((alloc) => (
                <View key={alloc.id} style={styles.allocCard}>
                  <View style={styles.allocHeader}>
                    <View style={styles.allocIconBox}>
                      <MaterialCommunityIcons
                        name={
                          alloc.subjectName.toLowerCase().includes('math')
                            ? 'calculator'
                            : alloc.subjectName.toLowerCase().includes('english')
                            ? 'book-open-page-variant'
                            : alloc.subjectName.toLowerCase().includes('physics')
                            ? 'atom'
                            : 'school-outline'
                        }
                        size={22}
                        color="#0F172A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={styles.allocTitleRow}>
                        <Text style={styles.allocSubjectName}>{alloc.subjectName}</Text>
                        {alloc.hasStudentReviewed ? (
                          <View style={styles.reviewedBadge}>
                            <MaterialCommunityIcons name="check-circle" size={13} color="#15803D" />
                            <Text style={styles.reviewedBadgeText}>
                              Reviewed ({alloc.studentReviewRating?.toFixed(1) || '4.8'}★)
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.pendingBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={13} color="#B45309" />
                            <Text style={styles.pendingBadgeText}>Pending Review</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.allocFacultyName}>
                        Faculty: <Text style={{ fontFamily: FontFamily.bold, color: '#0F172A' }}>{alloc.facultyName}</Text>
                      </Text>
                      <Text style={styles.allocMeta}>
                        {alloc.facultyDepartment} • {alloc.classSection}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.allocFooter}>
                    {!alloc.hasStudentReviewed ? (
                      <TouchableOpacity
                        style={styles.reviewSubjectBtn}
                        onPress={() => {
                          setSelectedFaculty({
                            id: alloc.facultyId,
                            name: alloc.facultyName,
                            department: alloc.facultyDepartment,
                            subject: alloc.subjectName,
                          });
                          setSelectedAllocation(alloc);
                          setRateFacultyModalVisible(true);
                        }}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons name="star-outline" size={16} color="#0F172A" />
                        <Text style={styles.reviewSubjectBtnText}>
                          Review for {alloc.subjectName}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.reviewedDoneBox}>
                        <MaterialCommunityIcons name="check" size={15} color="#15803D" />
                        <Text style={styles.reviewedDoneText}>
                          Feedback submitted for {alloc.subjectName}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Student's Submissions History */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
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
                Click the review buttons above to evaluate your teachers for each subject.
              </Text>
            </View>
          ) : (
            <View style={styles.submissionsList}>
              {studentSubmittedFaculty.map((item) => (
                <View key={item.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.reviewAvatar}>
                      <Feather name="user" size={18} color="#0F172A" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.reviewTarget}>{item.facultyName}</Text>
                        <View style={styles.subjectInlineBadge}>
                          <Text style={styles.subjectInlineBadgeText}>{item.subjectName}</Text>
                        </View>
                      </View>
                      <Text style={styles.reviewMeta}>
                        {item.facultyDepartment}
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
                  {item.areasOfImprovement && (
                    <Text style={styles.reviewComment}>
                      <Text style={{ fontFamily: FontFamily.bold, color: '#991B1B' }}>
                        Suggestions:{' '}
                      </Text>
                      {item.areasOfImprovement}
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
                    <View style={[styles.reviewAvatar, { backgroundColor: '#F1F5F9' }]}>
                      <Feather name="home" size={18} color="#0F172A" />
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
                      backgroundColor: '#0F172A',
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
                      backgroundColor: '#0F172A',
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
            {teacherSummary.recentReviews.map((rev) => {
              const commentText = [rev.strengths, rev.areasOfImprovement].filter(Boolean).join(' ');
              return (
                <View key={rev.id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={styles.reviewHeaderLeft}>
                      <View style={styles.starRowWithScore}>
                        {renderVisualStars(rev.overallRating, 14)}
                        <Text style={styles.starRatingNumber}>{rev.overallRating.toFixed(1)}</Text>
                      </View>
                      <View style={styles.reviewMetaRow}>
                        <Feather name={rev.isAnonymous ? 'shield' : 'user'} size={11} color="#64748B" />
                        <Text style={styles.reviewAuthor}>
                          {rev.isAnonymous ? 'Verified Student (Anonymous)' : rev.studentName}
                        </Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaSemester}>
                          {rev.subjectName} • {rev.studentSemester}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {commentText ? (
                    <Text style={styles.naturalCommentText}>{commentText}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* ============================================================== */}
      {/* ROLE 3 & 4: PRINCIPAL & HOD VIEW                               */}
      {/* ============================================================== */}
      {(userRole === 'principal' || userRole === 'hod') && (
        <View style={styles.adminSection}>
          {/* UNIFIED FULL-WIDTH SEGMENTED CONTROL (NO HORIZONTAL SCROLL) */}
          <View style={styles.unifiedSegmentRow}>
            <TouchableOpacity
              style={[
                styles.unifiedSegmentBtn,
                adminTab === 'reviews' && reviewTypeTab === 'faculty' && styles.unifiedSegmentBtnActive,
              ]}
              onPress={() => {
                setReviewTypeTab('faculty');
                handleSwitchAdminTab('reviews');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="account-tie"
                size={16}
                color={adminTab === 'reviews' && reviewTypeTab === 'faculty' ? '#FFFFFF' : '#475569'}
              />
              <Text
                style={[
                  styles.unifiedSegmentBtnText,
                  adminTab === 'reviews' && reviewTypeTab === 'faculty' && styles.unifiedSegmentBtnTextActive,
                ]}
              >
                Faculty
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.unifiedSegmentBtn,
                adminTab === 'reviews' && reviewTypeTab === 'college' && styles.unifiedSegmentBtnActive,
              ]}
              onPress={() => {
                setReviewTypeTab('college');
                handleSwitchAdminTab('reviews');
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="office-building"
                size={16}
                color={adminTab === 'reviews' && reviewTypeTab === 'college' ? '#FFFFFF' : '#475569'}
              />
              <Text
                style={[
                  styles.unifiedSegmentBtnText,
                  adminTab === 'reviews' && reviewTypeTab === 'college' && styles.unifiedSegmentBtnTextActive,
                ]}
              >
                Campus ({filteredCollegeReviews.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.unifiedSegmentBtn,
                adminTab === 'cycles' && styles.unifiedSegmentBtnActive,
              ]}
              onPress={() => handleSwitchAdminTab('cycles')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="calendar-clock"
                size={16}
                color={adminTab === 'cycles' ? '#FFFFFF' : '#475569'}
              />
              <Text
                style={[
                  styles.unifiedSegmentBtnText,
                  adminTab === 'cycles' && styles.unifiedSegmentBtnTextActive,
                ]}
              >
                Campaigns
              </Text>
            </TouchableOpacity>
          </View>

          {/* ============================================================== */}
          {/* TAB: REVIEWS (FACULTY DIRECTORY & CAMPUS)                      */}
          {/* ============================================================== */}
          {(adminTab === 'reviews' || adminTab === 'complaints') && (
            <View>
              {/* Clean Single Search & Action Row */}
              <View style={styles.searchRow}>
                <View style={styles.searchBox}>
                  <Feather name="search" size={16} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search faculty, subject..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholderTextColor="#94A3B8"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Feather name="x" size={15} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {totalComplaintsCount > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.complaintToggleBtn,
                      complaintsOnlyFilter && styles.complaintToggleBtnActive,
                    ]}
                    onPress={() => setComplaintsOnlyFilter(!complaintsOnlyFilter)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="alert-octagon"
                      size={14}
                      color={complaintsOnlyFilter ? '#FFFFFF' : '#DC2626'}
                    />
                    <Text
                      style={[
                        styles.complaintToggleText,
                        complaintsOnlyFilter && styles.complaintToggleTextActive,
                      ]}
                    >
                      {totalComplaintsCount}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.filterBtn,
                    (selectedDeptFilter !== 'all' || ratingFilter !== 'all' || selectedFacultyFilter !== 'all') &&
                      styles.filterBtnActive,
                  ]}
                  onPress={() => setFilterModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Feather
                    name="sliders"
                    size={16}
                    color={
                      selectedDeptFilter !== 'all' || ratingFilter !== 'all' || selectedFacultyFilter !== 'all'
                        ? '#FFFFFF'
                        : '#0F172A'
                    }
                  />
                </TouchableOpacity>
              </View>

              {/* Active Filter Chips Bar */}
              {(selectedDeptFilter !== 'all' ||
                selectedFacultyFilter !== 'all' ||
                selectedSubjectFilter !== 'all' ||
                ratingFilter !== 'all' ||
                complaintsOnlyFilter) && (
                <View style={styles.chipsRow}>
                  {selectedFacultyFilter !== 'all' && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        Faculty: {facultyMembersList.find((f) => f.id === selectedFacultyFilter)?.name || 'Faculty'}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedFacultyFilter('all')}>
                        <Feather name="x" size={12} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {selectedSubjectFilter !== 'all' && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>Subject: {selectedSubjectFilter}</Text>
                      <TouchableOpacity onPress={() => setSelectedSubjectFilter('all')}>
                        <Feather name="x" size={12} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {ratingFilter !== 'all' && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>
                        Rating: {ratingFilter}★ ({getRatingLabel(Number(ratingFilter))})
                      </Text>
                      <TouchableOpacity onPress={() => setRatingFilter('all')}>
                        <Feather name="x" size={12} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {complaintsOnlyFilter && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>Filter: Complaints Only</Text>
                      <TouchableOpacity onPress={() => setComplaintsOnlyFilter(false)}>
                        <Feather name="x" size={12} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedDeptFilter('all');
                      setSelectedFacultyFilter('all');
                      setSelectedSubjectFilter('all');
                      setRatingFilter('all');
                      setComplaintsOnlyFilter(false);
                    }}
                  >
                    <Text style={styles.clearAllFilters}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Cards List with Page Loader and Clubbed View */}
              {isPageLoading ? (
                <View style={styles.tabLoaderContainer}>
                  <ActivityIndicator size="small" color="#0F172A" />
                  <Text style={styles.tabLoaderText}>Loading reviews & records...</Text>
                </View>
              ) : reviewTypeTab === 'faculty' ? (
                !selectedFacultyForClubbed ? (
                  /* ============================================================== */
                  /* VIEW 1: FACULTY MEMBERS DIRECTORY (PAGINATED)                  */
                  /* ============================================================== */
                  <View>
                    <View style={styles.directoryHeaderRow}>
                      <Text style={styles.directoryTitle}>Faculty Reviews</Text>
                      <Text style={styles.directoryCountBadge}>
                        {filteredFacultySummaries.length} {filteredFacultySummaries.length === 1 ? 'Faculty' : 'Faculty Members'}
                      </Text>
                    </View>

                    <View style={styles.submissionsList}>
                      {filteredFacultySummaries.length === 0 ? (
                        <View style={styles.emptyCard}>
                          <MaterialCommunityIcons name="clipboard-text-outline" size={38} color="#94A3B8" />
                          <Text style={styles.emptyTitle}>No Faculty Found</Text>
                          <Text style={styles.emptyDesc}>No faculty match your selected search or filter criteria.</Text>
                        </View>
                      ) : (
                        paginatedFaculty.map((f) => (
                          <TouchableOpacity
                            key={f.facultyId}
                            style={styles.cleanFacultyCard}
                            onPress={() => handleSelectFacultyForClubbed(f.facultyId)}
                            activeOpacity={0.85}
                          >
                            <View style={styles.cleanFacultyAvatar}>
                              <Feather name="user" size={18} color="#0F172A" />
                            </View>

                            <View style={{ flex: 1, marginHorizontal: 12 }}>
                              <Text style={styles.cleanFacultyName}>{f.facultyName}</Text>
                              <View style={styles.cleanFacultyMetaRow}>
                                <Text style={styles.cleanFacultyDept}>{f.facultyDepartment}</Text>
                                <Text style={styles.cleanFacultyDot}>•</Text>
                                <Text style={styles.cleanFacultyReviews}>
                                  {f.totalReviews} {f.totalReviews === 1 ? 'review' : 'reviews'}
                                </Text>
                                {f.complaintsCount > 0 && (
                                  <View style={styles.cleanComplaintTag}>
                                    <MaterialCommunityIcons name="alert-circle" size={11} color="#DC2626" />
                                    <Text style={styles.cleanComplaintTagText}>
                                      {f.complaintsCount} {f.complaintsCount === 1 ? 'complaint' : 'complaints'}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            <View style={styles.cleanRatingScoreBadge}>
                              <MaterialCommunityIcons name="star" size={14} color="#F4C430" />
                              <Text style={styles.cleanRatingScoreVal}>{f.averageRating.toFixed(1)}</Text>
                            </View>

                            <Feather name="chevron-right" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
                          </TouchableOpacity>
                        ))
                      )}
                    </View>

                    {renderPaginationControls(
                      facultyPage,
                      totalFacultyPages,
                      filteredFacultySummaries.length,
                      'Faculty Members',
                      setFacultyPage
                    )}
                  </View>
                ) : (
                  /* ============================================================== */
                  /* VIEW 2: CLUBBED REVIEWS FOR SELECTED FACULTY                  */
                  /* ============================================================== */
                  <View>
                    <TouchableOpacity
                      style={styles.backToFacultyBtn}
                      onPress={handleBackToFacultyList}
                      activeOpacity={0.8}
                    >
                      <Feather name="arrow-left" size={15} color="#0F172A" />
                      <Text style={styles.backToFacultyText}>Back to All Faculty</Text>
                    </TouchableOpacity>

                    {activeFacultySummary && (
                      <View style={styles.facultyHeroCard}>
                        <View style={styles.facultySummaryHeader}>
                          <View style={styles.facultyAvatarBox}>
                            <Feather name="user-check" size={22} color="#0F172A" />
                          </View>
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.facultyHeroName}>{activeFacultySummary.facultyName}</Text>
                            <Text style={styles.facultyHeroDept}>{activeFacultySummary.facultyDepartment}</Text>
                          </View>
                          <View style={styles.facultySummaryScoreBadge}>
                            <MaterialCommunityIcons name="star" size={17} color="#F4C430" />
                            <Text style={styles.facultySummaryScoreText}>
                              {activeFacultySummary.averageRating.toFixed(1)} / 5
                            </Text>
                            <Text style={styles.facultySummaryLabelText}>
                              · {getRatingLabel(Math.round(activeFacultySummary.averageRating))}
                            </Text>
                          </View>
                        </View>

                        {/* Quick subject filter chips if faculty teaches multiple subjects */}
                        {activeFacultySummary.subjectBreakdown.length > 1 && (
                          <View style={styles.clubbedSubjectFilterRow}>
                            <TouchableOpacity
                              style={[
                                styles.clubbedSubjectFilterChip,
                                clubbedSubjectFilter === 'all' && styles.clubbedSubjectFilterChipActive,
                              ]}
                              onPress={() => {
                                setClubbedSubjectFilter('all');
                                setClubbedReviewsPage(1);
                              }}
                            >
                              <Text
                                style={[
                                  styles.clubbedSubjectFilterText,
                                  clubbedSubjectFilter === 'all' && styles.clubbedSubjectFilterTextActive,
                                ]}
                              >
                                All Subjects ({activeFacultySummary.totalReviews})
                              </Text>
                            </TouchableOpacity>

                            {activeFacultySummary.subjectBreakdown.map((s) => (
                              <TouchableOpacity
                                key={s.subjectName}
                                style={[
                                  styles.clubbedSubjectFilterChip,
                                  clubbedSubjectFilter.toLowerCase() === s.subjectName.toLowerCase() &&
                                    styles.clubbedSubjectFilterChipActive,
                                ]}
                                onPress={() => {
                                  setClubbedSubjectFilter(s.subjectName);
                                  setClubbedReviewsPage(1);
                                }}
                              >
                                <Text
                                  style={[
                                    styles.clubbedSubjectFilterText,
                                    clubbedSubjectFilter.toLowerCase() === s.subjectName.toLowerCase() &&
                                      styles.clubbedSubjectFilterTextActive,
                                  ]}
                                >
                                  {s.subjectName} ({s.count})
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    )}

                    {/* List of Clubbed Reviews */}
                    <View style={styles.submissionsList}>
                      {paginatedClubbedReviews.length === 0 ? (
                        <View style={styles.emptyCard}>
                          <MaterialCommunityIcons name="clipboard-text-outline" size={38} color="#94A3B8" />
                          <Text style={styles.emptyTitle}>No Reviews Found</Text>
                          <Text style={styles.emptyDesc}>No reviews found for this selection.</Text>
                        </View>
                      ) : (
                        paginatedClubbedReviews.map((r) => {
                          const commentText = [r.strengths, r.areasOfImprovement].filter(Boolean).join(' ');
                          const isDetailsOpen = !!expandedCriteria[r.id];

                          return (
                            <View key={r.id} style={styles.reviewCard}>
                              {/* Header: Rating on top left with visual stars, student meta, complaint pill on right */}
                              <View style={styles.reviewCardHeader}>
                                <View style={styles.reviewHeaderLeft}>
                                  <View style={styles.starRowWithScore}>
                                    {renderVisualStars(r.overallRating, 14)}
                                    <Text style={styles.starRatingNumber}>{r.overallRating.toFixed(1)}</Text>
                                  </View>
                                  <View style={styles.reviewMetaRow}>
                                    <Feather name="shield" size={11} color="#64748B" />
                                    <Text style={styles.reviewAuthor}>Anonymous Student</Text>
                                    <Text style={styles.metaDot}>•</Text>
                                    <Text style={styles.metaSemester}>{r.studentSemester}</Text>
                                  </View>
                                </View>

                                {r.hasComplaint && (
                                  <View style={styles.complaintBadgePill}>
                                    <Feather name="alert-circle" size={10} color="#DC2626" />
                                    <Text style={styles.complaintBadgePillText}>Flagged</Text>
                                  </View>
                                )}
                              </View>

                              {/* Natural Feedback Paragraph */}
                              {commentText ? (
                                <Text style={styles.naturalCommentText}>
                                  {commentText}
                                </Text>
                              ) : null}

                              {/* Complaint Callout Box if flagged */}
                              {r.hasComplaint && r.complaintText && (
                                <View style={styles.complaintCalloutBox}>
                                  <Feather name="alert-triangle" size={12} color="#DC2626" style={{ marginTop: 2 }} />
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.complaintCalloutTitle}>Grievance Logged</Text>
                                    <Text style={styles.complaintCalloutText}>{r.complaintText}</Text>
                                  </View>
                                </View>
                              )}

                              {/* Discreet Parameter Breakdown Trigger */}
                              <TouchableOpacity
                                style={styles.breakdownLinkBtn}
                                onPress={() => toggleCriteriaExpanded(r.id)}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.breakdownLinkText}>
                                  {isDetailsOpen ? 'Hide parameter ratings' : 'Rating details'}
                                </Text>
                                <Feather
                                  name={isDetailsOpen ? 'chevron-up' : 'chevron-down'}
                                  size={11}
                                  color="#64748B"
                                />
                              </TouchableOpacity>

                              {/* Expanded Parameter Breakdown Rows */}
                              {isDetailsOpen && (
                                <View style={styles.parametersBreakdownList}>
                                  {[
                                    { label: 'Subject Knowledge', score: r.ratings.subjectKnowledge },
                                    { label: 'Teaching Clarity', score: r.ratings.teachingClarity },
                                    { label: 'Punctuality', score: r.ratings.punctuality },
                                    { label: 'Doubt Resolution', score: r.ratings.doubtResolution },
                                    { label: 'Course Coverage', score: r.ratings.courseCoverage },
                                  ].map((param, pIdx) => (
                                    <View key={pIdx} style={styles.parameterRow}>
                                      <Text style={styles.paramLabel}>{param.label}</Text>
                                      <View style={styles.paramStars}>
                                        {renderVisualStars(param.score, 11)}
                                        <Text style={styles.paramValText}>{param.score.toFixed(1)}</Text>
                                      </View>
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Action Bar / Note Footer */}
                              {r.actionNote ? (
                                <View style={styles.actionLoggedRow}>
                                  <Feather name="check" size={12} color="#059669" />
                                  <Text style={styles.actionLoggedText}>
                                    <Text style={{ fontFamily: FontFamily.bold, color: '#047857' }}>
                                      {r.actionBy || 'Admin'}:{' '}
                                    </Text>
                                    {r.actionNote}
                                  </Text>
                                </View>
                              ) : (
                                <TouchableOpacity
                                  style={styles.subtleActionBtn}
                                  onPress={() => {
                                    setSelectedReviewForAction({
                                      id: r.id,
                                      type: 'faculty',
                                      targetName: `${r.facultyName} (${r.subjectName})`,
                                      studentName: r.studentName || 'Student',
                                      existingNote: r.actionNote,
                                    });
                                    setActionNoteInput(r.actionNote || '');
                                    setActionNoteModalVisible(true);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Feather name="message-square" size={11} color="#64748B" />
                                  <Text style={styles.subtleActionBtnText}>
                                    {r.hasComplaint ? 'Resolve grievance' : 'Record note / action'}
                                  </Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })
                    )}
                  </View>

                  {renderPaginationControls(
                    clubbedReviewsPage,
                    totalClubbedPages,
                    activeFacultyClubbedReviews.length,
                    'Reviews',
                    setClubbedReviewsPage
                  )}
                  </View>
                )
              ) : (
                /* ============================================================== */
                /* CAMPUS & FACILITIES REVIEWS (PAGINATED)                        */
                /* ============================================================== */
                <View>
                  <View style={styles.submissionsList}>
                    {paginatedCollegeReviews.length === 0 ? (
                      <View style={styles.emptyCard}>
                        <MaterialCommunityIcons name="office-building" size={38} color="#94A3B8" />
                        <Text style={styles.emptyTitle}>No Campus Reviews Found</Text>
                        <Text style={styles.emptyDesc}>No reviews match your selected filter criteria.</Text>
                      </View>
                    ) : (
                      paginatedCollegeReviews.map((r) => {
                        const commentText = [r.campusHighlights, r.improvementSuggestions].filter(Boolean).join(' ');
                        const isDetailsOpen = !!expandedCriteria[r.id];

                        return (
                          <View key={r.id} style={styles.reviewCard}>
                            {/* Header: Rating stars on top left, student meta, complaint pill on right */}
                            <View style={styles.reviewCardHeader}>
                              <View style={styles.reviewHeaderLeft}>
                                <View style={styles.starRowWithScore}>
                                  {renderVisualStars(r.overallRating, 14)}
                                  <Text style={styles.starRatingNumber}>{r.overallRating.toFixed(1)}</Text>
                                </View>
                                <View style={styles.reviewMetaRow}>
                                  <Feather name="shield" size={11} color="#64748B" />
                                  <Text style={styles.reviewAuthor}>Anonymous Student</Text>
                                  <Text style={styles.metaDot}>•</Text>
                                  <Text style={styles.metaSemester}>{r.studentDepartment} • {r.studentSemester}</Text>
                                </View>
                              </View>

                              {r.hasComplaint && (
                                <View style={styles.complaintBadgePill}>
                                  <Feather name="alert-circle" size={10} color="#DC2626" />
                                  <Text style={styles.complaintBadgePillText}>Flagged</Text>
                                </View>
                              )}
                            </View>

                            {/* Natural Feedback Paragraph */}
                            {commentText ? (
                              <Text style={styles.naturalCommentText}>
                                {commentText}
                              </Text>
                            ) : null}

                            {/* Complaint Callout Box if flagged */}
                            {r.hasComplaint && r.complaintText && (
                              <View style={styles.complaintCalloutBox}>
                                <Feather name="alert-triangle" size={12} color="#DC2626" style={{ marginTop: 2 }} />
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.complaintCalloutTitle}>Facility Issue Logged</Text>
                                  <Text style={styles.complaintCalloutText}>{r.complaintText}</Text>
                                </View>
                              </View>
                            )}

                            {/* Discreet Parameter Breakdown Trigger */}
                            <TouchableOpacity
                              style={styles.breakdownLinkBtn}
                              onPress={() => toggleCriteriaExpanded(r.id)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.breakdownLinkText}>
                                {isDetailsOpen ? 'Hide parameter ratings' : 'Rating details'}
                              </Text>
                              <Feather
                                name={isDetailsOpen ? 'chevron-up' : 'chevron-down'}
                                size={11}
                                color="#64748B"
                              />
                            </TouchableOpacity>

                            {/* Expanded Parameter Breakdown Rows */}
                            {isDetailsOpen && (
                              <View style={styles.parametersBreakdownList}>
                                {[
                                  { label: 'Labs & Wi-Fi', score: r.ratings.infrastructureLabs },
                                  { label: 'Library Resources', score: r.ratings.libraryResources },
                                  { label: 'Canteen & Hygiene', score: r.ratings.canteenCleanliness },
                                  { label: 'Sports & Activities', score: r.ratings.sportsExtracurriculars },
                                  { label: 'Admin Support', score: r.ratings.adminStudentSupport },
                                  { label: 'Training & Placements', score: r.ratings.placementsTraining },
                                ].map((param, pIdx) => (
                                  <View key={pIdx} style={styles.parameterRow}>
                                    <Text style={styles.paramLabel}>{param.label}</Text>
                                    <View style={styles.paramStars}>
                                      {renderVisualStars(param.score, 11)}
                                      <Text style={styles.paramValText}>{param.score.toFixed(1)}</Text>
                                    </View>
                                  </View>
                                ))}
                              </View>
                            )}

                            {/* Action Bar / Note Footer */}
                            {r.actionNote ? (
                              <View style={styles.actionLoggedRow}>
                                <Feather name="check" size={12} color="#059669" />
                                <Text style={styles.actionLoggedText}>
                                  <Text style={{ fontFamily: FontFamily.bold, color: '#047857' }}>
                                    {r.actionBy || 'Admin'}:{' '}
                                  </Text>
                                  {r.actionNote}
                                </Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={styles.subtleActionBtn}
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
                                activeOpacity={0.7}
                              >
                                <Feather name="message-square" size={11} color="#64748B" />
                                <Text style={styles.subtleActionBtnText}>Record note / action</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>

                  {renderPaginationControls(
                    collegeReviewsPage,
                    totalCollegePages,
                    filteredCollegeReviews.length,
                    'Campus Reviews',
                    setCollegeReviewsPage
                  )}
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
                    <View style={[styles.progressBarFill, { width: '98%', backgroundColor: '#0F172A' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.9 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Computing Labs & High-Speed Wi-Fi</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '96%', backgroundColor: '#0F172A' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.8 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Digital Library & Academic Journals</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '94%', backgroundColor: '#0F172A' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.7 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Student Welfare & Admin Support</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '90%', backgroundColor: '#0F172A' }]} />
                  </View>
                  <Text style={styles.progressScore}>4.5 / 5.0</Text>
                </View>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Cafeteria Hygiene & Food Quality</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: '86%', backgroundColor: '#0F172A' }]} />
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
              <TouchableOpacity
                style={[
                  styles.dropdownTrigger,
                  newCycleDeptDropdownOpen && styles.dropdownTriggerActive,
                ]}
                onPress={() => setNewCycleDeptDropdownOpen(!newCycleDeptDropdownOpen)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                  <Feather name="layers" size={14} color="#64748B" />
                  <Text style={styles.dropdownTriggerText} numberOfLines={1}>
                    {newCycleDept === 'all' ? 'All Departments' : newCycleDept}
                  </Text>
                </View>
                <Feather
                  name={newCycleDeptDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color="#0F172A"
                />
              </TouchableOpacity>

              {newCycleDeptDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownMenuItem,
                        newCycleDept === 'all' && styles.dropdownMenuItemActive,
                      ]}
                      onPress={() => {
                        setNewCycleDept('all');
                        setNewCycleDeptDropdownOpen(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownMenuText,
                          newCycleDept === 'all' && styles.dropdownMenuTextActive,
                        ]}
                      >
                        All Departments
                      </Text>
                      {newCycleDept === 'all' && (
                        <Feather name="check" size={14} color="#0F172A" />
                      )}
                    </TouchableOpacity>
                    {INSTITUTION_DEPARTMENTS.map((dept) => (
                      <TouchableOpacity
                        key={dept}
                        style={[
                          styles.dropdownMenuItem,
                          newCycleDept === dept && styles.dropdownMenuItemActive,
                        ]}
                        onPress={() => {
                          setNewCycleDept(dept);
                          setNewCycleDeptDropdownOpen(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownMenuText,
                            newCycleDept === dept && styles.dropdownMenuTextActive,
                          ]}
                        >
                          {dept}
                        </Text>
                        {newCycleDept === dept && (
                          <Feather name="check" size={14} color="#0F172A" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

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
              <TouchableOpacity
                style={styles.launchSurveyModalBtn}
                onPress={handleCreateCycle}
              >
                <Text style={styles.launchSurveyModalBtnText}>Launch Survey</Text>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
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
              </View>

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
                  trackColor={{ false: '#CBD5E1', true: '#F4C430' }}
                  thumbColor={facIsAnonymous ? '#0F172A' : '#F1F5F9'}
                />
              </View>

              {/* Star Rating Parameters (5 Options: Very Poor, Poor, Avg, Good, V.Good) */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Evaluation Criteria (1 to 5 Stars)</Text>
              {render5OptionSelector('Subject Knowledge & Expertise', facRatings.subjectKnowledge, (val) =>
                setFacRatings((p) => ({ ...p, subjectKnowledge: val }))
              )}
              {render5OptionSelector('Teaching Clarity & Methodology', facRatings.teachingClarity, (val) =>
                setFacRatings((p) => ({ ...p, teachingClarity: val }))
              )}
              {render5OptionSelector('Punctuality & Class Regularity', facRatings.punctuality, (val) =>
                setFacRatings((p) => ({ ...p, punctuality: val }))
              )}
              {render5OptionSelector('Doubt Clearing & Mentorship', facRatings.doubtResolution, (val) =>
                setFacRatings((p) => ({ ...p, doubtResolution: val }))
              )}
              {render5OptionSelector('Course Coverage & Lab Guidance', facRatings.courseCoverage, (val) =>
                setFacRatings((p) => ({ ...p, courseCoverage: val }))
              )}

              {/* Written Remarks */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Key Strengths (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What does this professor do best? (Optional)"
                value={facStrengths}
                onChangeText={setFacStrengths}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Areas of Growth / Improvement (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Constructive suggestions for improvement... (Optional)"
                value={facImprovements}
                onChangeText={setFacImprovements}
                placeholderTextColor="#94A3B8"
              />

              {/* Formal Complaint Checkbox to Principal */}
              <TouchableOpacity
                style={styles.complaintCheckboxRow}
                onPress={() => setFacHasComplaint(!facHasComplaint)}
                activeOpacity={0.8}
              >
                <View style={[styles.customCheckbox, facHasComplaint && styles.customCheckboxActive]}>
                  {facHasComplaint && <Feather name="check" size={13} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.complaintCheckboxTitle}>
                    File a formal complaint / grievance to Principal
                  </Text>
                  <Text style={styles.complaintCheckboxSub}>
                    Tick this box if there is a grievance requiring direct Principal attention.
                  </Text>
                </View>
              </TouchableOpacity>

              {facHasComplaint && (
                <View style={styles.complaintInputContainer}>
                  <Text style={styles.complaintInputLabel}>Complaint / Grievance Details</Text>
                  <TextInput
                    style={styles.complaintInput}
                    placeholder="Write your specific complaint or issue for Principal review..."
                    multiline
                    value={facComplaintText}
                    onChangeText={setFacComplaintText}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}
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
                  trackColor={{ false: '#CBD5E1', true: '#F4C430' }}
                  thumbColor={colIsAnonymous ? '#0F172A' : '#F1F5F9'}
                />
              </View>

              {/* 5-Option Facility Ratings */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Facility Ratings (1 to 5 Stars)</Text>
              {render5OptionSelector('Infrastructure, Labs & Wi-Fi', colRatings.infrastructureLabs, (val) =>
                setColRatings((p) => ({ ...p, infrastructureLabs: val }))
              )}
              {render5OptionSelector('Library & Academic Resources', colRatings.libraryResources, (val) =>
                setColRatings((p) => ({ ...p, libraryResources: val }))
              )}
              {render5OptionSelector('Canteen Hygiene & Cleanliness', colRatings.canteenCleanliness, (val) =>
                setColRatings((p) => ({ ...p, canteenCleanliness: val }))
              )}
              {render5OptionSelector('Sports & Extracurriculars', colRatings.sportsExtracurriculars, (val) =>
                setColRatings((p) => ({ ...p, sportsExtracurriculars: val }))
              )}
              {render5OptionSelector('Administration & Student Support', colRatings.adminStudentSupport, (val) =>
                setColRatings((p) => ({ ...p, adminStudentSupport: val }))
              )}
              {render5OptionSelector('Placements & Internship Cell', colRatings.placementsTraining, (val) =>
                setColRatings((p) => ({ ...p, placementsTraining: val }))
              )}

              {/* Written Remarks */}
              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Campus Highlights (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What facilities do you appreciate the most? (Optional)"
                value={colHighlights}
                onChangeText={setColHighlights}
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Suggestions for Improvement (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What can the college administration enhance or fix? (Optional)"
                value={colSuggestions}
                onChangeText={setColSuggestions}
                placeholderTextColor="#94A3B8"
              />

              {/* Formal Facility Complaint Checkbox to Principal */}
              <TouchableOpacity
                style={styles.complaintCheckboxRow}
                onPress={() => setColHasComplaint(!colHasComplaint)}
                activeOpacity={0.8}
              >
                <View style={[styles.customCheckbox, colHasComplaint && styles.customCheckboxActive]}>
                  {colHasComplaint && <Feather name="check" size={13} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.complaintCheckboxTitle}>
                    Report facility grievance / issue to Principal
                  </Text>
                  <Text style={styles.complaintCheckboxSub}>
                    Tick this box if there is a serious maintenance or facility grievance.
                  </Text>
                </View>
              </TouchableOpacity>

              {colHasComplaint && (
                <View style={styles.complaintInputContainer}>
                  <Text style={styles.complaintInputLabel}>Facility Grievance Details</Text>
                  <TextInput
                    style={styles.complaintInput}
                    placeholder="Describe the facility issue or grievance for Principal attention..."
                    multiline
                    value={colComplaintText}
                    onChangeText={setColComplaintText}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setRateCollegeModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
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

            <Text style={styles.inputLabel}>Filter by Faculty</Text>
            <ScrollView style={{ maxHeight: 130 }} nestedScrollEnabled>
              <TouchableOpacity
                style={[
                  styles.filterOptionRow,
                  selectedFacultyFilter === 'all' && styles.filterOptionRowActive,
                ]}
                onPress={() => setSelectedFacultyFilter('all')}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedFacultyFilter === 'all' && styles.filterOptionTextActive,
                  ]}
                >
                  All Faculty
                </Text>
                {selectedFacultyFilter === 'all' && (
                  <Feather name="check" size={16} color="#0F172A" />
                )}
              </TouchableOpacity>
              {facultyMembersList.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[
                    styles.filterOptionRow,
                    selectedFacultyFilter === f.id && styles.filterOptionRowActive,
                  ]}
                  onPress={() => setSelectedFacultyFilter(f.id)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFacultyFilter === f.id && styles.filterOptionTextActive,
                    ]}
                  >
                    {f.name} ({f.department})
                  </Text>
                  {selectedFacultyFilter === f.id && (
                    <Feather name="check" size={16} color="#0F172A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Filter by Department</Text>
            <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled>
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
                  <Feather name="check" size={16} color="#0F172A" />
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
                    <Feather name="check" size={16} color="#0F172A" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Filter by Star Rating Scale</Text>
            <View style={styles.ratingFilterRow}>
              {(
                [
                  { key: 'all', label: 'All Ratings' },
                  { key: '5', label: '5★ Very Good' },
                  { key: '4', label: '4★ Good' },
                  { key: '3', label: '3★ Average' },
                  { key: '2', label: '2★ Poor' },
                  { key: '1', label: '1★ Very Poor' },
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
                  setSelectedFacultyFilter('all');
                  setSelectedSubjectFilter('all');
                  setRatingFilter('all');
                  setComplaintsOnlyFilter(false);
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.confirmBtnText}>Apply Filters</Text>
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
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 5,
    gap: 8,
  },
  launchBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },

  // COMPACT SUMMARY STRIP
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },
  summaryLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  summaryVal: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#0F172A',
    marginTop: 2,
  },

  // STUDENT VIEW
  studentSection: {
    width: '100%',
  },
  actionBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#0F172A',
  },
  actionBannerDesc: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#475569',
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 5,
    gap: 6,
  },
  primaryActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  neutralActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 5,
    gap: 6,
  },
  neutralActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },

  // STUDENT COURSE ALLOCATIONS SECTION
  allocSection: {
    marginBottom: 20,
  },
  allocList: {
    gap: 10,
  },
  allocCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  allocHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  allocIconBox: {
    width: 40,
    height: 40,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  allocTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  allocSubjectName: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#0F172A',
  },
  allocFacultyName: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  allocMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  allocFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  reviewSubjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
    gap: 6,
  },
  reviewSubjectBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  reviewedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 4,
  },
  reviewedBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 4,
  },
  pendingBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#64748B',
  },
  reviewedDoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewedDoneText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#15803D',
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
  sectionSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionBadge: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#0F172A',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
  },

  // CARDS & SUBMISSIONS LIST
  submissionsList: {
    gap: 8,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewHeaderLeft: {
    flex: 1,
    gap: 3,
  },
  starRowWithScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starRatingNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  reviewMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  reviewAuthor: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#475569',
  },
  metaDot: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  metaSemester: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#64748B',
  },
  complaintBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  complaintBadgePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  naturalCommentText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
    color: '#1E293B',
    marginVertical: 4,
  },
  complaintCalloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 6,
    marginBottom: 6,
  },
  complaintCalloutTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#991B1B',
    marginBottom: 2,
  },
  complaintCalloutText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#7F1D1D',
  },
  breakdownLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginTop: 4,
  },
  breakdownLinkText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  parametersBreakdownList: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 5,
    maxWidth: 320,
  },
  parameterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  paramLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#64748B',
  },
  paramStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paramValText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
    minWidth: 20,
    textAlign: 'right',
  },
  actionLoggedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    marginTop: 8,
  },
  actionLoggedText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
    color: '#166534',
    flex: 1,
  },
  subtleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
  },
  subtleActionBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#475569',
  },
  // Legacy / fallback styles for other tabs
  reviewStudentName: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  reviewMetaDot: {
    fontSize: 12,
    color: '#CBD5E1',
  },
  reviewMetaText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#64748B',
  },
  complaintPillBadge: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  complaintPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: '#DC2626',
    letterSpacing: 0.3,
  },
  headerRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  headerRatingNumber: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  feedbackQuoteText: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#1E293B',
    marginBottom: 4,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 2,
    marginBottom: 4,
  },
  suggestionText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16.5,
    color: '#475569',
    flex: 1,
  },
  suggestionPrefix: {
    fontFamily: FontFamily.bold,
    color: '#334155',
  },
  complaintAlertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 5,
    marginTop: 4,
    marginBottom: 4,
  },
  complaintAlertContent: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 16,
    color: '#991B1B',
    flex: 1,
  },
  breakdownToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    marginTop: 2,
  },
  breakdownToggleText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#64748B',
  },
  breakdownChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  breakdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  breakdownChipLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#64748B',
  },
  breakdownChipScore: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#0F172A',
  },
  actionNoteBox: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  actionNoteSource: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  actionNoteContent: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
    color: '#334155',
  },
  actionNoteText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
    color: '#334155',
    flex: 1,
  },
  addActionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  addActionLinkText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#64748B',
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
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
  subjectInlineBadge: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  subjectInlineBadgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#475569',
  },
  ratingBadgeContainer: {
    alignItems: 'flex-end',
    gap: 3,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#F4C430',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    gap: 3,
  },
  ratingPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#0F172A',
  },
  ratingLabelText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#475569',
  },

  // 5 PARAMETERS GRID
  miniParamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 10,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  miniParamBox: {
    flex: 1,
    minWidth: 90,
  },
  miniParamTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase',
  },
  miniParamValue: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
    marginTop: 1,
  },
  miniParamsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
  },
  miniParam: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#475569',
  },

  // COMPLAINT ALERT STYLES
  complaintAlertBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    padding: 8,
    marginBottom: 8,
    flexDirection: 'row',
    gap: 8,
  },
  complaintAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  complaintAlertTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#DC2626',
  },
  complaintAlertText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#7F1D1D',
    lineHeight: 17,
  },
  complaintCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    padding: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#94A3B8',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCheckboxActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  complaintCheckboxTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  complaintCheckboxSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  complaintInputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 10,
  },
  complaintInputLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
    marginBottom: 6,
  },
  complaintInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    padding: 10,
    height: 60,
    textAlignVertical: 'top',
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#0F172A',
  },

  // COMMENTS & ACTIONS
  reviewComment: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#334155',
    lineHeight: 16.5,
    marginTop: 4,
  },
  actionNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    gap: 5,
  },
  complaintTagBadge: {
    borderWidth: 1,
    borderColor: '#0F172A',
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  complaintTagBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  complaintPrefix: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  addActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 5,
    alignSelf: 'flex-start',
  },
  addActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#0F172A',
  },

  // EMPTY STATE
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
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

  // TEACHER PROGRESS BARS
  teacherSection: {
    width: '100%',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
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
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressScore: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'right',
  },

  // ADMIN SECTION & RESPONSIVE TABS
  adminSection: {
    width: '100%',
  },
  // UNIFIED FULL-WIDTH SEGMENTED CONTROL
  unifiedSegmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  unifiedSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 10,
    borderRadius: 5,
    gap: 6,
  },
  unifiedSegmentBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  unifiedSegmentBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#475569',
  },
  unifiedSegmentBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // COMPLAINT TOGGLE BUTTON IN SEARCH ROW
  complaintToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 5,
  },
  complaintToggleBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  complaintToggleText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  complaintToggleTextActive: {
    color: '#FFFFFF',
  },

  // CLEAN MINIMAL FACULTY CARD
  cleanFacultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE047',
    padding: 12,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  cleanFacultyAvatar: {
    width: 36,
    height: 36,
    borderRadius: 5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cleanFacultyName: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#0F172A',
  },
  cleanFacultyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  cleanFacultyDept: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
  },
  cleanFacultyDot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cleanFacultyReviews: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#475569',
  },
  cleanComplaintTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  cleanComplaintTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#0F172A',
  },
  cleanRatingScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'transparent',
  },
  cleanRatingScoreVal: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  directoryCountBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },

  // FACULTY OVERVIEW TAB
  facultyOverviewSection: {
    width: '100%',
  },
  facultySummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  facultySummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facultyAvatarBox: {
    width: 42,
    height: 42,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facultySummaryName: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#0F172A',
  },
  facultySummaryDept: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  facultySummaryScoreBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 5,
  },
  facultySummaryScoreText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  facultySummaryLabelText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#64748B',
  },
  facultySubjectsList: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
  },
  subHeadingText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#475569',
    marginBottom: 6,
  },
  subjectBreakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectScoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    gap: 4,
  },
  subjectChipTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
  },
  subjectChipScore: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#B45309',
  },
  subjectChipCount: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#64748B',
  },
  facultySummaryFooter: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  facultyComplaintWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  facultyComplaintWarningText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#0F172A',
  },
  noComplaintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noComplaintText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#15803D',
  },
  viewFacultyReviewsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  viewFacultyReviewsBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },

  // REVIEW TYPE SELECTOR
  reviewTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  reviewTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    gap: 6,
  },
  reviewTypeBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
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
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#0F172A',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  quickFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickFilterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  complaintFilterChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  quickFilterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#475569',
  },
  quickFilterChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#0F172A',
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
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    gap: 4,
  },
  inlineCreateBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  cycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
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
    borderRadius: 5,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
  },
  statusActive: {
    backgroundColor: '#0F172A',
  },
  statusActiveText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#FFFFFF',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  statusScheduledText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#0F172A',
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
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
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
    borderRadius: 5,
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
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  dropdownTriggerActive: {
    borderColor: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#0F172A',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 5,
    marginTop: -4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#F8FAFC',
  },
  dropdownMenuText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#334155',
  },
  dropdownMenuTextActive: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
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
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
  },
  scopeBtnActive: {
    backgroundColor: '#0F172A',
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
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    marginRight: 6,
  },
  tagBtnActive: {
    backgroundColor: '#0F172A',
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
    borderRadius: 5,
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
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
    minWidth: 140,
  },
  facultyChipActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#0F172A',
  },
  facultyChipName: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
  },
  facultyChipNameActive: {
    color: '#0F172A',
  },
  facultyChipSubject: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  facultyChipSubjectActive: {
    color: '#0F172A',
  },

  // 5-OPTION RATING SCALE BUTTONS
  optionSelectorBlock: {
    marginBottom: 12,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#F8FAFC',
  },
  optionSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  currentRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 4,
  },
  currentRatingScoreText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#92400E',
  },
  optionChipsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  scaleOptionBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleOptionBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  scaleOptionScore: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#475569',
  },
  scaleOptionScoreActive: {
    color: '#F4C430',
  },
  scaleOptionLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 9,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  scaleOptionLabelActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
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
    borderRadius: 5,
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
    borderRadius: 5,
    backgroundColor: '#0F172A',
  },
  confirmBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  launchSurveyModalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 5,
    backgroundColor: '#F4C430',
  },
  launchSurveyModalBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#0F172A',
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
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
  },
  filterOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#334155',
  },
  filterOptionTextActive: {
    fontFamily: FontFamily.bold,
    color: '#0F172A',
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
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
  },
  ratingPillBtnActive: {
    backgroundColor: '#0F172A',
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

  // TAB & PAGE LOADER
  tabLoaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabLoaderText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
  },

  // FACULTY DIRECTORY HEADER
  directoryHeaderRow: {
    marginBottom: 14,
  },
  directoryTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#0F172A',
  },
  directorySubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // BACK TO FACULTY DIRECTORY BUTTON
  backToFacultyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 5,
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  backToFacultyText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },

  // FACULTY HERO CARD (CLUBBED VIEW)
  facultyHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  facultyHeroName: {
    fontFamily: FontFamily.bold,
    fontSize: 17,
    color: '#0F172A',
  },
  facultyHeroDept: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  clubbedSubjectFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#F8FAFC',
  },
  clubbedSubjectFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clubbedSubjectFilterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  clubbedSubjectFilterText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#475569',
  },
  clubbedSubjectFilterTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // REVIEWER DETAILS IN CLUBBED CARD
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },

  // PAGINATION CONTROLS
  paginationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  paginationText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#64748B',
  },
  paginationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    gap: 4,
  },
  pageBtnDisabled: {
    opacity: 0.45,
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  pageBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },
  pageBtnTextDisabled: {
    color: '#94A3B8',
  },
  pageIndicatorPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  pageIndicatorText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#0F172A',
  },
});
