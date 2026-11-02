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

const NOT_CONFIGURED = 'Feedback service is not configured for this institution.';

export async function fetchFeedbackCyclesApi(): Promise<StudentReviewCycle[]> {
  return [];
}

export async function createFeedbackCycleApi(
  _payload: CreateFeedbackCyclePayload
): Promise<StudentReviewCycle> {
  throw new Error(NOT_CONFIGURED);
}

export async function updateCycleStatusApi(
  _cycleId: string,
  _status: ReviewCycleStatus
): Promise<boolean> {
  throw new Error(NOT_CONFIGURED);
}

export async function fetchStudentAllocationsApi(
  _studentId?: string
): Promise<CourseSubjectAllocation[]> {
  return [];
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

export async function fetchFacultyReviewsApi(_filters?: {
  cycleId?: string;
  facultyId?: string;
  facultyName?: string;
  department?: string;
  subjectName?: string;
  ratingMin?: number;
  studentId?: string;
}): Promise<FacultyReviewSubmission[]> {
  return [];
}

export async function fetchCollegeReviewsApi(_filters?: {
  cycleId?: string;
  department?: string;
  studentId?: string;
}): Promise<CollegeReviewSubmission[]> {
  return [];
}

export async function submitFacultyReviewApi(
  _reviewData: Omit<FacultyReviewSubmission, 'id' | 'createdAt' | 'status'>
): Promise<FacultyReviewSubmission> {
  throw new Error(NOT_CONFIGURED);
}

export async function submitCollegeReviewApi(
  _reviewData: Omit<CollegeReviewSubmission, 'id' | 'createdAt' | 'status'>
): Promise<CollegeReviewSubmission> {
  throw new Error(NOT_CONFIGURED);
}

export async function updateReviewActionNoteApi(
  _type: 'faculty' | 'college',
  _reviewId: string,
  _actionNote: string,
  _actionBy: string
): Promise<boolean> {
  throw new Error(NOT_CONFIGURED);
}

export async function fetchTeacherFeedbackStatsApi(
  teacherName: string
): Promise<TeacherFeedbackSummary> {
  return {
    teacherId: '',
    teacherName,
    department: '',
    averageRating: 0,
    totalReviews: 0,
    subjectBreakdown: [],
    parameterAverages: {
      subjectKnowledge: 0,
      teachingClarity: 0,
      punctuality: 0,
      doubtResolution: 0,
      courseCoverage: 0,
    },
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    recentReviews: [],
  };
}

export async function fetchInstitutionalFeedbackSummaryApi(): Promise<InstitutionalFeedbackSummary> {
  return {
    collegeOverallRating: 0,
    facultyOverallAverage: 0,
    totalStudentReviews: 0,
    activeCycleCount: 0,
    facilityAverages: {
      infrastructureLabs: 0,
      libraryResources: 0,
      canteenCleanliness: 0,
      sportsExtracurriculars: 0,
      adminStudentSupport: 0,
      placementsTraining: 0,
    },
    departmentRankings: [],
  };
}
