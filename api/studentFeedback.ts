import {
  StudentReviewCycle,
  FacultyReviewSubmission,
  CollegeReviewSubmission,
  TeacherFeedbackSummary,
  InstitutionalFeedbackSummary,
  CreateFeedbackCyclePayload,
  ReviewCycleStatus,
} from '../features/shared/types/studentFeedback.types';

// In-memory store initialized with realistic institutional review data
let MOCK_CYCLES: StudentReviewCycle[] = [
  {
    id: 'cycle-001',
    title: 'Mid-Semester Faculty & Campus Survey 2026',
    academicYear: '2025-2026',
    semester: 'Odd Semester (V / VII)',
    scope: 'both',
    targetDepartments: ['all'],
    startDate: '2026-10-01',
    endDate: '2026-11-15',
    status: 'active',
    totalSubmissions: 148,
    description: 'Comprehensive student review regarding teaching effectiveness, course coverage, lab infrastructure, and library resources.',
    createdDate: '2026-10-01',
  },
  {
    id: 'cycle-002',
    title: 'Annual Institutional Infrastructure & Facilities Review',
    academicYear: '2025-2026',
    semester: 'All Semesters',
    scope: 'college_only',
    targetDepartments: ['Computer Science', 'AIML', 'Electronics & Comm'],
    startDate: '2026-09-01',
    endDate: '2026-10-10',
    status: 'closed',
    totalSubmissions: 312,
    description: 'Campus amenity assessment: High-speed Wi-Fi, modern labs, cafeteria hygiene, and placement cell support.',
    createdDate: '2026-09-01',
  },
  {
    id: 'cycle-003',
    title: 'End-Semester Faculty Teaching Appraisal 2026',
    academicYear: '2025-2026',
    semester: 'Even Semester (II / IV / VI)',
    scope: 'faculty_only',
    targetDepartments: ['all'],
    startDate: '2026-12-01',
    endDate: '2026-12-28',
    status: 'scheduled',
    totalSubmissions: 0,
    description: 'Upcoming mandatory end-semester evaluation for NBA accreditation and faculty developmental goals.',
    createdDate: '2026-10-15',
  },
];

let MOCK_FACULTY_REVIEWS: FacultyReviewSubmission[] = [
  {
    id: 'frev-101',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-01',
    studentName: 'Rahul Verma',
    studentUSN: '1MS21CS042',
    studentDepartment: 'Computer Science',
    studentSemester: 'Semester 5',
    isAnonymous: false,
    facultyId: 'fac-01',
    facultyName: 'Dr. Anand Rao',
    facultyDepartment: 'Computer Science',
    subjectName: 'Design & Analysis of Algorithms',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 4,
      courseCoverage: 5,
    },
    overallRating: 4.8,
    strengths: 'Explains complex dynamic programming and graph algorithms using real-world analogies. Highly inspiring.',
    areasOfImprovement: 'Could provide extra practice problem sets for competitive programming before mid-terms.',
    generalComments: 'One of the best professors in the department.',
    status: 'reviewed',
    actionNote: 'Recommended for lead curriculum development committee.',
    actionBy: 'Principal Office',
    createdAt: '2026-10-12T10:30:00Z',
  },
  {
    id: 'frev-102',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-02',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'AIML',
    studentSemester: 'Semester 3',
    isAnonymous: true,
    facultyId: 'fac-02',
    facultyName: 'Prof. Sneha Sharma',
    facultyDepartment: 'AIML',
    subjectName: 'Neural Networks & Deep Learning',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 4,
      punctuality: 5,
      doubtResolution: 5,
      courseCoverage: 4,
    },
    overallRating: 4.6,
    strengths: 'Very interactive sessions with hands-on PyTorch demos during class. Clears all math derivations patiently.',
    areasOfImprovement: 'Slide notes could be shared on Google Classroom a day earlier.',
    generalComments: 'Great teacher and mentor for hackathons.',
    status: 'submitted',
    createdAt: '2026-10-14T14:15:00Z',
  },
  {
    id: 'frev-103',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-03',
    studentName: 'Priya Nair',
    studentUSN: '1MS22EC018',
    studentDepartment: 'Electronics & Comm',
    studentSemester: 'Semester 5',
    isAnonymous: false,
    facultyId: 'fac-03',
    facultyName: 'Dr. Ramesh Kumar',
    facultyDepartment: 'Electronics & Comm',
    subjectName: 'Digital Signal Processing',
    ratings: {
      subjectKnowledge: 4,
      teachingClarity: 3,
      punctuality: 4,
      doubtResolution: 3,
      courseCoverage: 4,
    },
    overallRating: 3.6,
    strengths: 'Very punctual and strict with syllabus milestones. Extensive theoretical background.',
    areasOfImprovement: 'Need more MATLAB visual simulations for Fast Fourier Transform concepts.',
    generalComments: 'Strict evaluator, but helpful when approached during office hours.',
    status: 'action_taken',
    actionNote: 'HOD arranged 2 additional lab demonstration sessions with teaching assistants.',
    actionBy: 'HOD - ECE',
    createdAt: '2026-10-15T09:45:00Z',
  },
  {
    id: 'frev-104',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-04',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Mechanical Eng',
    studentSemester: 'Semester 7',
    isAnonymous: true,
    facultyId: 'fac-04',
    facultyName: 'Prof. Vikram Hegde',
    facultyDepartment: 'Mechanical Eng',
    subjectName: 'Thermodynamics & Heat Transfer',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 4,
      doubtResolution: 5,
      courseCoverage: 5,
    },
    overallRating: 4.8,
    strengths: 'Industrial case studies and visits to boiler plants made the subject fascinating.',
    areasOfImprovement: 'None, fantastic methodology.',
    generalComments: 'Role model professor.',
    status: 'reviewed',
    createdAt: '2026-10-16T11:20:00Z',
  },
];

let MOCK_COLLEGE_REVIEWS: CollegeReviewSubmission[] = [
  {
    id: 'crev-201',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-01',
    studentName: 'Rahul Verma',
    studentUSN: '1MS21CS042',
    studentDepartment: 'Computer Science',
    studentSemester: 'Semester 5',
    isAnonymous: false,
    ratings: {
      infrastructureLabs: 5,
      libraryResources: 5,
      canteenCleanliness: 4,
      sportsExtracurriculars: 4,
      adminStudentSupport: 5,
      placementsTraining: 5,
    },
    overallRating: 4.7,
    campusHighlights: 'High-speed gigabit Wi-Fi across campus, 24/7 central library with digital IEEE access, and top-tier tier-1 placement companies visiting early.',
    improvementSuggestions: 'Canteen counter lines get crowded during lunch hour; a second cashier counter or digital pre-order system would help greatly.',
    status: 'action_taken',
    actionNote: 'Canteen management notified; automated token system installed in block B cafeteria.',
    actionBy: 'Principal Office',
    createdAt: '2026-10-12T10:45:00Z',
  },
  {
    id: 'crev-202',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-02',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'AIML',
    studentSemester: 'Semester 3',
    isAnonymous: true,
    ratings: {
      infrastructureLabs: 5,
      libraryResources: 4,
      canteenCleanliness: 4,
      sportsExtracurriculars: 3,
      adminStudentSupport: 4,
      placementsTraining: 5,
    },
    overallRating: 4.2,
    campusHighlights: 'GPU computing lab with NVIDIA A100 rigs is superb for our machine learning projects.',
    improvementSuggestions: 'Need more badminton court lighting for evening sports after 6 PM.',
    status: 'reviewed',
    actionNote: 'Forwarded to Physical Education Director for LED spotlight installation.',
    actionBy: 'Principal Office',
    createdAt: '2026-10-14T14:30:00Z',
  },
  {
    id: 'crev-203',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-03',
    studentName: 'Priya Nair',
    studentUSN: '1MS22EC018',
    studentDepartment: 'Electronics & Comm',
    studentSemester: 'Semester 5',
    isAnonymous: false,
    ratings: {
      infrastructureLabs: 4,
      libraryResources: 5,
      canteenCleanliness: 5,
      sportsExtracurriculars: 5,
      adminStudentSupport: 4,
      placementsTraining: 5,
    },
    overallRating: 4.6,
    campusHighlights: 'Clean eco-friendly campus, lush greenery, and responsive scholarship documentation cell.',
    improvementSuggestions: 'VLSI lab licenses for Cadence should be extended to remote VPN access during weekends.',
    status: 'submitted',
    createdAt: '2026-10-15T10:10:00Z',
  },
];

// Helper to simulate network latency
const delay = (ms = 180) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchFeedbackCyclesApi(): Promise<StudentReviewCycle[]> {
  await delay();
  return [...MOCK_CYCLES];
}

export async function createFeedbackCycleApi(
  payload: CreateFeedbackCyclePayload
): Promise<StudentReviewCycle> {
  await delay();
  const newCycle: StudentReviewCycle = {
    id: `cycle-${Date.now()}`,
    title: payload.title,
    academicYear: payload.academicYear,
    semester: payload.semester,
    scope: payload.scope,
    targetDepartments: payload.targetDepartments.length > 0 ? payload.targetDepartments : ['all'],
    startDate: payload.startDate || new Date().toISOString().slice(0, 10),
    endDate: payload.endDate,
    status: 'active',
    totalSubmissions: 0,
    description: payload.description || 'Institutional survey for students.',
    createdDate: new Date().toISOString().slice(0, 10),
  };
  MOCK_CYCLES = [newCycle, ...MOCK_CYCLES];
  return newCycle;
}

export async function updateCycleStatusApi(
  cycleId: string,
  status: ReviewCycleStatus
): Promise<boolean> {
  await delay();
  const cycle = MOCK_CYCLES.find((c) => c.id === cycleId);
  if (cycle) {
    cycle.status = status;
    return true;
  }
  return false;
}

export async function fetchFacultyReviewsApi(filters?: {
  cycleId?: string;
  facultyId?: string;
  facultyName?: string;
  department?: string;
  ratingMin?: number;
  studentId?: string;
}): Promise<FacultyReviewSubmission[]> {
  await delay();
  let list = [...MOCK_FACULTY_REVIEWS];
  if (filters?.cycleId) {
    list = list.filter((r) => r.cycleId === filters.cycleId);
  }
  if (filters?.facultyId) {
    list = list.filter((r) => r.facultyId === filters.facultyId);
  }
  if (filters?.facultyName) {
    list = list.filter((r) =>
      r.facultyName.toLowerCase().includes(filters.facultyName!.toLowerCase())
    );
  }
  if (filters?.department && filters.department !== 'all') {
    list = list.filter((r) => r.facultyDepartment === filters.department);
  }
  if (filters?.ratingMin) {
    list = list.filter((r) => r.overallRating >= filters.ratingMin!);
  }
  if (filters?.studentId) {
    list = list.filter((r) => r.studentId === filters.studentId);
  }
  return list;
}

export async function fetchCollegeReviewsApi(filters?: {
  cycleId?: string;
  department?: string;
  studentId?: string;
}): Promise<CollegeReviewSubmission[]> {
  await delay();
  let list = [...MOCK_COLLEGE_REVIEWS];
  if (filters?.cycleId) {
    list = list.filter((r) => r.cycleId === filters.cycleId);
  }
  if (filters?.department && filters.department !== 'all') {
    list = list.filter((r) => r.studentDepartment === filters.department);
  }
  if (filters?.studentId) {
    list = list.filter((r) => r.studentId === filters.studentId);
  }
  return list;
}

export async function submitFacultyReviewApi(
  reviewData: Omit<FacultyReviewSubmission, 'id' | 'createdAt' | 'status'>
): Promise<FacultyReviewSubmission> {
  await delay();
  const newReview: FacultyReviewSubmission = {
    ...reviewData,
    id: `frev-${Date.now()}`,
    status: 'submitted',
    createdAt: new Date().toISOString(),
  };
  MOCK_FACULTY_REVIEWS = [newReview, ...MOCK_FACULTY_REVIEWS];
  // increment cycle submission count
  const cycle = MOCK_CYCLES.find((c) => c.id === reviewData.cycleId);
  if (cycle) cycle.totalSubmissions += 1;
  return newReview;
}

export async function submitCollegeReviewApi(
  reviewData: Omit<CollegeReviewSubmission, 'id' | 'createdAt' | 'status'>
): Promise<CollegeReviewSubmission> {
  await delay();
  const newReview: CollegeReviewSubmission = {
    ...reviewData,
    id: `crev-${Date.now()}`,
    status: 'submitted',
    createdAt: new Date().toISOString(),
  };
  MOCK_COLLEGE_REVIEWS = [newReview, ...MOCK_COLLEGE_REVIEWS];
  const cycle = MOCK_CYCLES.find((c) => c.id === reviewData.cycleId);
  if (cycle) cycle.totalSubmissions += 1;
  return newReview;
}

export async function updateReviewActionNoteApi(
  type: 'faculty' | 'college',
  reviewId: string,
  actionNote: string,
  actionBy: string
): Promise<boolean> {
  await delay();
  if (type === 'faculty') {
    const item = MOCK_FACULTY_REVIEWS.find((r) => r.id === reviewId);
    if (item) {
      item.actionNote = actionNote;
      item.actionBy = actionBy;
      item.status = 'action_taken';
      return true;
    }
  } else {
    const item = MOCK_COLLEGE_REVIEWS.find((r) => r.id === reviewId);
    if (item) {
      item.actionNote = actionNote;
      item.actionBy = actionBy;
      item.status = 'action_taken';
      return true;
    }
  }
  return false;
}

export async function fetchTeacherFeedbackStatsApi(
  teacherName: string
): Promise<TeacherFeedbackSummary> {
  await delay();
  // Filter faculty reviews matching name or default to first
  const reviews = MOCK_FACULTY_REVIEWS.filter((r) =>
    r.facultyName.toLowerCase().includes(teacherName.toLowerCase())
  );

  const targetReviews = reviews.length > 0 ? reviews : MOCK_FACULTY_REVIEWS;

  const total = targetReviews.length;
  const avg =
    total > 0
      ? Number((targetReviews.reduce((acc, r) => acc + r.overallRating, 0) / total).toFixed(1))
      : 4.8;

  const paramAvg = {
    subjectKnowledge: Number(
      (targetReviews.reduce((acc, r) => acc + r.ratings.subjectKnowledge, 0) / (total || 1)).toFixed(1)
    ),
    teachingClarity: Number(
      (targetReviews.reduce((acc, r) => acc + r.ratings.teachingClarity, 0) / (total || 1)).toFixed(1)
    ),
    punctuality: Number(
      (targetReviews.reduce((acc, r) => acc + r.ratings.punctuality, 0) / (total || 1)).toFixed(1)
    ),
    doubtResolution: Number(
      (targetReviews.reduce((acc, r) => acc + r.ratings.doubtResolution, 0) / (total || 1)).toFixed(1)
    ),
    courseCoverage: Number(
      (targetReviews.reduce((acc, r) => acc + r.ratings.courseCoverage, 0) / (total || 1)).toFixed(1)
    ),
  };

  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  targetReviews.forEach((r) => {
    const rounded = Math.round(r.overallRating) as 1 | 2 | 3 | 4 | 5;
    if (dist[rounded] !== undefined) dist[rounded]++;
  });

  return {
    teacherId: 'teacher-current',
    teacherName,
    department: 'Computer Science',
    averageRating: avg,
    totalReviews: total,
    parameterAverages: paramAvg,
    ratingDistribution: dist,
    recentReviews: targetReviews,
  };
}

export async function fetchInstitutionalFeedbackSummaryApi(): Promise<InstitutionalFeedbackSummary> {
  await delay();
  const facTotal = MOCK_FACULTY_REVIEWS.length;
  const facAvg =
    facTotal > 0
      ? Number((MOCK_FACULTY_REVIEWS.reduce((acc, r) => acc + r.overallRating, 0) / facTotal).toFixed(1))
      : 4.7;

  const colTotal = MOCK_COLLEGE_REVIEWS.length;
  const colAvg =
    colTotal > 0
      ? Number((MOCK_COLLEGE_REVIEWS.reduce((acc, r) => acc + r.overallRating, 0) / colTotal).toFixed(1))
      : 4.6;

  return {
    collegeOverallRating: colAvg,
    facultyOverallAverage: facAvg,
    totalStudentReviews: facTotal + colTotal,
    activeCycleCount: MOCK_CYCLES.filter((c) => c.status === 'active').length,
    facilityAverages: {
      infrastructureLabs: 4.8,
      libraryResources: 4.7,
      canteenCleanliness: 4.3,
      sportsExtracurriculars: 4.1,
      adminStudentSupport: 4.5,
      placementsTraining: 4.9,
    },
    departmentRankings: [
      { department: 'Computer Science', averageRating: 4.8, reviewCount: 64 },
      { department: 'AIML', averageRating: 4.7, reviewCount: 42 },
      { department: 'Electronics & Comm', averageRating: 4.5, reviewCount: 38 },
      { department: 'Mechanical Eng', averageRating: 4.6, reviewCount: 26 },
      { department: 'Civil Eng', averageRating: 4.4, reviewCount: 19 },
      { department: 'Commerce & Mgmt', averageRating: 4.5, reviewCount: 22 },
    ],
  };
}
