import {
  StudentReviewCycle,
  FacultyReviewSubmission,
  CollegeReviewSubmission,
  TeacherFeedbackSummary,
  InstitutionalFeedbackSummary,
  CreateFeedbackCyclePayload,
  ReviewCycleStatus,
  CourseSubjectAllocation,
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

// Student course allocations for their class (e.g. Dr. Rajesh Iyer teaching BOTH Maths and English)
let MOCK_COURSE_ALLOCATIONS: CourseSubjectAllocation[] = [
  {
    id: 'alloc-01',
    subjectName: 'Mathematics',
    facultyId: 'fac-01',
    facultyName: 'Dr. Rajesh Iyer',
    facultyDepartment: 'Mathematics & Science',
    classSection: 'Class 10-A / Sec A',
    semester: 'Semester 5',
  },
  {
    id: 'alloc-02',
    subjectName: 'English',
    facultyId: 'fac-01', // Same faculty teaching English!
    facultyName: 'Dr. Rajesh Iyer',
    facultyDepartment: 'Humanities & Languages',
    classSection: 'Class 10-A / Sec A',
    semester: 'Semester 5',
  },
  {
    id: 'alloc-03',
    subjectName: 'Physics',
    facultyId: 'fac-02',
    facultyName: 'Prof. Sneha Sharma',
    facultyDepartment: 'Applied Sciences',
    classSection: 'Class 10-A / Sec A',
    semester: 'Semester 5',
  },
  {
    id: 'alloc-04',
    subjectName: 'Computer Science',
    facultyId: 'fac-03',
    facultyName: 'Dr. Anand Rao',
    facultyDepartment: 'Computer Science',
    classSection: 'Class 10-A / Sec A',
    semester: 'Semester 5',
  },
];

let MOCK_FACULTY_REVIEWS: FacultyReviewSubmission[] = [
  {
    id: 'frev-101',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-02',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-01',
    facultyName: 'Dr. Rajesh Iyer',
    facultyDepartment: 'Mathematics & Science',
    subjectName: 'Mathematics',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 5,
      courseCoverage: 4,
    },
    overallRating: 4.8,
    strengths: 'Very systematic in calculus derivations and solving sample question papers step by step.',
    areasOfImprovement: 'Could give more advanced practice questions for competitive exams.',
    generalComments: 'Outstanding math teacher. Makes difficult concepts easy to grasp.',
    status: 'reviewed',
    actionNote: 'Appreciated in departmental faculty meeting.',
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
    studentDepartment: 'Computer Science',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-01',
    facultyName: 'Dr. Rajesh Iyer',
    facultyDepartment: 'Humanities & Languages',
    subjectName: 'English',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 4,
      punctuality: 5,
      doubtResolution: 4,
      courseCoverage: 5,
    },
    overallRating: 4.6,
    strengths: 'Passionate about literature and drama. Class discussions on prose and poetry are very engaging.',
    areasOfImprovement: 'More grammar exercises and vocabulary quizzes in class.',
    generalComments: 'Great communicator and mentor.',
    status: 'submitted',
    createdAt: '2026-10-12T10:45:00Z',
  },
  {
    id: 'frev-103',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-03',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-01',
    facultyName: 'Dr. Rajesh Iyer',
    facultyDepartment: 'Mathematics & Science',
    subjectName: 'Mathematics',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 4,
      doubtResolution: 5,
      courseCoverage: 5,
    },
    overallRating: 4.8,
    strengths: 'Never rushes through topics. Solves every doubt patiently.',
    areasOfImprovement: 'None.',
    generalComments: 'Best mathematics faculty in the institution.',
    status: 'reviewed',
    createdAt: '2026-10-14T11:20:00Z',
  },
  {
    id: 'frev-104',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-03',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-01',
    facultyName: 'Dr. Rajesh Iyer',
    facultyDepartment: 'Humanities & Languages',
    subjectName: 'English',
    ratings: {
      subjectKnowledge: 4,
      teachingClarity: 4,
      punctuality: 4,
      doubtResolution: 4,
      courseCoverage: 4,
    },
    overallRating: 4.0,
    strengths: 'Helped improve our technical presentation and public speaking skills.',
    areasOfImprovement: 'Assignments could be evaluated more promptly.',
    generalComments: 'Good English class experience.',
    hasComplaint: true,
    complaintText: 'Assignments are returned late and doubts on unit 3 syllabus were dismissed in class without resolution.',
    status: 'submitted',
    createdAt: '2026-10-14T11:35:00Z',
  },
  {
    id: 'frev-105',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-04',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-02',
    facultyName: 'Prof. Sneha Sharma',
    facultyDepartment: 'Applied Sciences',
    subjectName: 'Physics',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 4,
      punctuality: 5,
      doubtResolution: 5,
      courseCoverage: 4,
    },
    overallRating: 4.6,
    strengths: 'Hands-on lab experiments and practical examples for quantum physics concepts.',
    areasOfImprovement: 'Slide notes could be shared prior to class.',
    generalComments: 'Very helpful during lab hours.',
    status: 'reviewed',
    createdAt: '2026-10-15T14:10:00Z',
  },
  {
    id: 'frev-106',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-04',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-03',
    facultyName: 'Dr. Anand Rao',
    facultyDepartment: 'Computer Science',
    subjectName: 'Computer Science',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 5,
      courseCoverage: 5,
    },
    overallRating: 5.0,
    strengths: 'Superb algorithm visualizations, live coding demonstrations, and dynamic programming walk-throughs.',
    areasOfImprovement: 'None.',
    generalComments: 'Brilliant teacher.',
    status: 'reviewed',
    actionNote: 'Recommended for lead curriculum development committee.',
    actionBy: 'Principal Office',
    createdAt: '2026-10-16T15:20:00Z',
  },
  {
    id: 'frev-107',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-05',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Artificial Intelligence & Machine Learning',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-hinton',
    facultyName: 'Dr. Geoffrey Hinton',
    facultyDepartment: 'Artificial Intelligence & Machine Learning',
    subjectName: 'Deep Learning & Neural Networks',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 5,
      courseCoverage: 5,
    },
    overallRating: 5.0,
    strengths: 'Deep intuitive explanations of loss surfaces, backpropagation, and latent representations.',
    areasOfImprovement: 'Provide more GPU lab resources for final year project compute.',
    generalComments: 'Incredible professor. Learned cutting-edge deep learning concepts with supreme clarity.',
    status: 'reviewed',
    actionNote: 'Commended for outstanding pedagogical innovation and research mentorship.',
    actionBy: 'Principal Office',
    createdAt: '2026-10-18T10:15:00Z',
  },
  {
    id: 'frev-108',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-06',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Artificial Intelligence & Machine Learning',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-lecun',
    facultyName: 'Prof. Yann LeCun',
    facultyDepartment: 'Artificial Intelligence & Machine Learning',
    subjectName: 'Computer Vision & Convolutional Nets',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 4,
      doubtResolution: 5,
      courseCoverage: 4,
    },
    overallRating: 4.8,
    strengths: 'Practical PyTorch implementations, architecture trade-offs, and self-supervised learning methods.',
    areasOfImprovement: 'Assignments are quite challenging and take significant time.',
    generalComments: 'Best practical computer vision course experience ever.',
    status: 'reviewed',
    createdAt: '2026-10-18T11:30:00Z',
  },
  {
    id: 'frev-109',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-07',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Artificial Intelligence & Machine Learning',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-bengio',
    facultyName: 'Dr. Yoshua Bengio',
    facultyDepartment: 'Artificial Intelligence & Machine Learning',
    subjectName: 'Natural Language Processing & LLMs',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 4,
      punctuality: 5,
      doubtResolution: 4,
      courseCoverage: 5,
    },
    overallRating: 4.6,
    strengths: 'Attention mechanism proofs, causal reasoning in AI, and transformer architectures.',
    areasOfImprovement: 'Share lecture slide decks a day earlier for pre-reading.',
    generalComments: 'Brilliant faculty with exceptional depth.',
    status: 'reviewed',
    createdAt: '2026-10-19T09:45:00Z',
  },
  {
    id: 'frev-110',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-08',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science & Engineering',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-1',
    facultyName: 'Dr. Linus Torvalds',
    facultyDepartment: 'Computer Science & Engineering',
    subjectName: 'Operating Systems & System Programming',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 4,
      courseCoverage: 5,
    },
    overallRating: 4.8,
    strengths: 'Kernel level memory architecture, concurrency, and real-world C system programming.',
    areasOfImprovement: 'Kernel compilation labs need faster VM server specs.',
    generalComments: 'Hands down the most rigorous and rewarding systems course.',
    status: 'reviewed',
    actionNote: 'Lab server upgrade approved for OS laboratory.',
    actionBy: 'Principal Office',
    createdAt: '2026-10-19T14:20:00Z',
  },
  {
    id: 'frev-111',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-09',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science & Engineering',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-2',
    facultyName: 'Prof. Dennis Ritchie',
    facultyDepartment: 'Computer Science & Engineering',
    subjectName: 'Database Management Systems & SQL',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 5,
      courseCoverage: 4,
    },
    overallRating: 4.9,
    strengths: 'B-tree index mechanics, ACID transaction internals, and query execution optimization.',
    areasOfImprovement: 'Include more PostgreSQL advanced window functions in practical lab sessions.',
    generalComments: 'Masterful teacher. Concepts stick forever.',
    status: 'reviewed',
    createdAt: '2026-10-20T11:00:00Z',
  },
  {
    id: 'frev-112',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-10',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science & Engineering',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-3',
    facultyName: 'Dr. Donald Knuth',
    facultyDepartment: 'Computer Science & Engineering',
    subjectName: 'Algorithm Analysis & TeX',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 5,
      courseCoverage: 5,
    },
    overallRating: 5.0,
    strengths: 'Rigorous asymptotic proofs, elegant algorithmic beauty, and crystal clear derivations.',
    areasOfImprovement: 'None.',
    generalComments: 'Living legend. True privilege to attend lectures.',
    status: 'reviewed',
    createdAt: '2026-10-20T12:00:00Z',
  },
  {
    id: 'frev-113',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-11',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science & Engineering',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    facultyId: 'fac-4',
    facultyName: 'Prof. Ada Lovelace',
    facultyDepartment: 'Computer Science & Engineering',
    subjectName: 'Computational Logic & Databases',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 4,
      courseCoverage: 4,
    },
    overallRating: 4.7,
    strengths: 'Relational algebra, boolean logic synthesis, and excellent query structuring.',
    areasOfImprovement: 'Provide more practice worksheets for relational calculus.',
    generalComments: 'Great lecturer and very inspiring.',
    status: 'reviewed',
    createdAt: '2026-10-21T09:30:00Z',
  },
  {
    id: 'frev-114',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-12',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science & Engineering',
    studentSemester: 'Semester 7',
    isAnonymous: true,
    facultyId: 'fac-5',
    facultyName: 'Dr. Tim Berners-Lee',
    facultyDepartment: 'Computer Science & Engineering',
    subjectName: 'Distributed Systems & WWW',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 5,
      punctuality: 5,
      doubtResolution: 4,
      courseCoverage: 5,
    },
    overallRating: 4.8,
    strengths: 'Web protocols, consensus algorithms (Raft/Paxos), and microservice architectures.',
    areasOfImprovement: 'Lab cluster setup had occasional DNS resolution hiccups.',
    generalComments: 'Outstanding real world knowledge.',
    status: 'reviewed',
    createdAt: '2026-10-21T10:15:00Z',
  },
  {
    id: 'frev-115',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-13',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science & Engineering',
    studentSemester: 'Semester 7',
    isAnonymous: true,
    facultyId: 'fac-6',
    facultyName: 'Dr. Bjarne Stroustrup',
    facultyDepartment: 'Computer Science & Engineering',
    subjectName: 'C++ & Object Oriented Design',
    ratings: {
      subjectKnowledge: 5,
      teachingClarity: 4,
      punctuality: 5,
      doubtResolution: 4,
      courseCoverage: 4,
    },
    overallRating: 4.5,
    strengths: 'Deep dive into templates, move semantics, and RAII memory safety.',
    areasOfImprovement: 'Code assignments are very lengthy.',
    generalComments: 'Challenging course that significantly improved my coding standards.',
    status: 'reviewed',
    createdAt: '2026-10-21T14:40:00Z',
  },
];

let MOCK_COLLEGE_REVIEWS: CollegeReviewSubmission[] = [
  {
    id: 'crev-201',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-01',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Computer Science & Engineering',
    studentSemester: 'Semester 5',
    isAnonymous: true,
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
    studentDepartment: 'Computer Science & Engineering',
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
    overallRating: 4.5,
    campusHighlights: 'Computing lab with modern Linux workstations is superb for our software systems projects.',
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
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Electronics & Comm',
    studentSemester: 'Semester 5',
    isAnonymous: true,
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
  {
    id: 'crev-204',
    cycleId: 'cycle-001',
    cycleTitle: 'Mid-Semester Faculty & Campus Survey 2026',
    studentId: 'stu-04',
    studentName: 'Anonymous Student',
    studentUSN: 'Confidential',
    studentDepartment: 'Artificial Intelligence & Machine Learning',
    studentSemester: 'Semester 5',
    isAnonymous: true,
    ratings: {
      infrastructureLabs: 5,
      libraryResources: 5,
      canteenCleanliness: 4,
      sportsExtracurriculars: 4,
      adminStudentSupport: 5,
      placementsTraining: 5,
    },
    overallRating: 4.8,
    campusHighlights: 'AI GPU research server rack and fast internet connectivity in research labs.',
    improvementSuggestions: 'Additional collaborative whiteboard spaces in library 2nd floor.',
    status: 'reviewed',
    createdAt: '2026-10-18T16:20:00Z',
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

export async function fetchStudentAllocationsApi(
  studentId: string = 'stu-01'
): Promise<CourseSubjectAllocation[]> {
  await delay();
  return MOCK_COURSE_ALLOCATIONS.map((alloc) => {
    const existing = MOCK_FACULTY_REVIEWS.find(
      (r) =>
        r.studentId === studentId &&
        r.facultyId === alloc.facultyId &&
        r.subjectName.toLowerCase() === alloc.subjectName.toLowerCase()
    );
    return {
      ...alloc,
      hasStudentReviewed: !!existing,
      studentReviewRating: existing?.overallRating,
    };
  });
}

export function matchesDepartment(itemDept?: string, filterDept?: string): boolean {
  if (!filterDept || filterDept === 'all') return true;
  if (!itemDept) return true;
  const d1 = itemDept.trim().toLowerCase();
  const d2 = filterDept.trim().toLowerCase();
  if (d1 === d2) return true;
  if ((d1.includes('computer') || d1.includes('cse')) && (d2.includes('computer') || d2.includes('cse'))) return true;
  if ((d1.includes('ai') || d1.includes('aiml') || d1.includes('machine') || d1.includes('intelligence')) && (d2.includes('ai') || d2.includes('aiml') || d2.includes('machine') || d2.includes('intelligence'))) return true;
  if ((d1.includes('electronic') || d1.includes('ece')) && (d2.includes('electronic') || d2.includes('ece'))) return true;
  if (d1.includes('mech') && d2.includes('mech')) return true;
  if (d1.includes('civil') && d2.includes('civil')) return true;
  return d1.includes(d2) || d2.includes(d1);
}

export async function fetchFacultyReviewsApi(filters?: {
  cycleId?: string;
  facultyId?: string;
  facultyName?: string;
  department?: string;
  subjectName?: string;
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
  if (filters?.subjectName && filters.subjectName !== 'all') {
    list = list.filter((r) =>
      r.subjectName.toLowerCase() === filters.subjectName!.toLowerCase()
    );
  }
  if (filters?.department && filters.department !== 'all') {
    list = list.filter((r) => matchesDepartment(r.facultyDepartment, filters.department));
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
    list = list.filter((r) => matchesDepartment(r.studentDepartment, filters.department));
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

  // Compute breakdown by subject
  const subjectsMap: Record<string, { total: number; sum: number }> = {};
  targetReviews.forEach((r) => {
    if (!subjectsMap[r.subjectName]) {
      subjectsMap[r.subjectName] = { total: 0, sum: 0 };
    }
    subjectsMap[r.subjectName].total += 1;
    subjectsMap[r.subjectName].sum += r.overallRating;
  });

  const subjectBreakdown = Object.keys(subjectsMap).map((sub) => ({
    subjectName: sub,
    averageRating: Number((subjectsMap[sub].sum / subjectsMap[sub].total).toFixed(1)),
    totalReviews: subjectsMap[sub].total,
  }));

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
    subjectBreakdown,
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
