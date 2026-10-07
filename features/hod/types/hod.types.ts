export type FacultyRank =
  | 'professor'
  | 'associate_professor'
  | 'assistant_professor'
  | 'adjunct_lecturer'
  | 'lab_instructor';

export type CourseType = 'theory' | 'practical_lab' | 'elective' | 'project';

export interface HODFacultyMember {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  rank: FacultyRank;
  department: string;
  specialization: string;
  maxCreditsPerWeek: number;
  assignedCredits: number;
  assignedCourses: string[]; // e.g. ["CS501", "CS505L"]
  status: 'present' | 'on_leave' | 'in_lecture' | 'in_lab' | 'absent';
  cabinNumber?: string;
  avatarUrl?: string;
}

export interface DepartmentCourse {
  id: string;
  code: string; // e.g. "CS501"
  name: string; // e.g. "Operating Systems & Kernels"
  department: string;
  semester: string; // e.g. "Semester 5"
  batchYear?: string; // e.g. "2024-2028"
  type: CourseType;
  credits: number;
  instructorId?: string;
  instructorName?: string;
  instructorRank?: FacultyRank;
  enrolledStudentsCount: number;
  syllabusProgressPct: number; // 0 to 100
  totalPlannedHours: number;
  completedHours: number;
  labBatchesCount?: number; // e.g. 3 batches for lab
}

export type HallTicketStatus = 'eligible' | 'condonation_needed' | 'detained';

export interface ExamEligibilityRecord {
  id: string;
  studentId: string;
  studentName: string;
  usn: string; // University Seat Number or Roll No
  semester: string;
  department: string;
  overallAttendancePct: number;
  coursesBelowThreshold: number; // number of subjects < 75%
  internalAssessmentScore: number; // e.g. 38 / 50
  hallTicketStatus: HallTicketStatus;
  condonationReason?: string;
  approvedBy?: string;
  approvalDate?: string;
  remarks?: string;
}

export interface DepartmentNotice {
  id: string;
  title: string;
  content: string;
  department: string;
  priority: 'normal' | 'important' | 'urgent';
  targetAudience: 'all' | 'faculty' | 'students' | 'lab_assistants';
  publishedDate: string;
  authorName: string;
  authorRole: string;
  attachedFile?: string;
}

export interface HODKPIs {
  totalStudents: number;
  facultyOnDuty: number;
  totalFaculty: number;
  activeCourses: number;
  practicalLabsCount: number;
  averageSyllabusProgress: number; // e.g. 68%
  detentionAlertsCount: number; // students < 75% attendance
  unassignedCoursesCount: number;
  todayLabSessions: number;
}

export type HODTab =
  | 'dashboard'
  | 'courses'
  | 'faculty'
  | 'eligibility'
  | 'notices'
  | 'attendance';
