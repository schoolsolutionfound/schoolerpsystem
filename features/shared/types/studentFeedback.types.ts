export type FeedbackRole = 'student' | 'teacher' | 'hod' | 'principal' | 'admin';

export type ReviewTargetType = 'faculty' | 'college';

export type ReviewCycleStatus = 'active' | 'closed' | 'scheduled';

export type FeedbackReviewStatus = 'submitted' | 'reviewed' | 'action_taken';

export interface StudentReviewCycle {
  id: string;
  title: string;
  academicYear: string; // e.g. "2025-2026"
  semester: string; // e.g. "Odd Semester (V / VII)" or "All Semesters"
  scope: 'both' | 'faculty_only' | 'college_only';
  targetDepartments: string[]; // ['all'] or ['Computer Science', 'AIML', etc.]
  startDate: string; // ISO date or "15 Oct 2026"
  endDate: string;
  status: ReviewCycleStatus;
  totalSubmissions: number;
  description?: string;
  createdDate: string;
}

export interface FacultyRatingParameters {
  subjectKnowledge: number; // 1 - 5
  teachingClarity: number; // 1 - 5
  punctuality: number; // 1 - 5
  doubtResolution: number; // 1 - 5
  courseCoverage: number; // 1 - 5
}

export interface CollegeRatingParameters {
  infrastructureLabs: number; // 1 - 5
  libraryResources: number; // 1 - 5
  canteenCleanliness: number; // 1 - 5
  sportsExtracurriculars: number; // 1 - 5
  adminStudentSupport: number; // 1 - 5
  placementsTraining: number; // 1 - 5
}

export interface FacultyReviewSubmission {
  id: string;
  cycleId: string;
  cycleTitle: string;
  studentId: string;
  studentName?: string;
  studentUSN?: string;
  studentDepartment: string;
  studentSemester: string;
  isAnonymous: boolean;
  facultyId: string;
  facultyName: string;
  facultyDepartment: string;
  subjectName: string;
  ratings: FacultyRatingParameters;
  overallRating: number; // Computed average 1 - 5
  strengths?: string;
  areasOfImprovement?: string;
  generalComments?: string;
  status: FeedbackReviewStatus;
  actionNote?: string;
  actionBy?: string;
  createdAt: string;
}

export interface CollegeReviewSubmission {
  id: string;
  cycleId: string;
  cycleTitle: string;
  studentId: string;
  studentName?: string;
  studentUSN?: string;
  studentDepartment: string;
  studentSemester: string;
  isAnonymous: boolean;
  ratings: CollegeRatingParameters;
  overallRating: number; // Computed average 1 - 5
  campusHighlights?: string;
  improvementSuggestions?: string;
  status: FeedbackReviewStatus;
  actionNote?: string;
  actionBy?: string;
  createdAt: string;
}

export interface TeacherFeedbackSummary {
  teacherId: string;
  teacherName: string;
  department: string;
  averageRating: number;
  totalReviews: number;
  parameterAverages: {
    subjectKnowledge: number;
    teachingClarity: number;
    punctuality: number;
    doubtResolution: number;
    courseCoverage: number;
  };
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  recentReviews: FacultyReviewSubmission[];
}

export interface InstitutionalFeedbackSummary {
  collegeOverallRating: number;
  facultyOverallAverage: number;
  totalStudentReviews: number;
  activeCycleCount: number;
  facilityAverages: {
    infrastructureLabs: number;
    libraryResources: number;
    canteenCleanliness: number;
    sportsExtracurriculars: number;
    adminStudentSupport: number;
    placementsTraining: number;
  };
  departmentRankings: {
    department: string;
    averageRating: number;
    reviewCount: number;
  }[];
}

export interface CreateFeedbackCyclePayload {
  title: string;
  academicYear: string;
  semester: string;
  scope: 'both' | 'faculty_only' | 'college_only';
  targetDepartments: string[];
  startDate: string;
  endDate: string;
  description?: string;
}

export interface SubmitFacultyFeedbackPayload {
  cycleId: string;
  facultyId: string;
  facultyName: string;
  facultyDepartment: string;
  subjectName: string;
  isAnonymous: boolean;
  ratings: FacultyRatingParameters;
  strengths?: string;
  areasOfImprovement?: string;
  generalComments?: string;
}

export interface SubmitCollegeFeedbackPayload {
  cycleId: string;
  isAnonymous: boolean;
  ratings: CollegeRatingParameters;
  campusHighlights?: string;
  improvementSuggestions?: string;
}
