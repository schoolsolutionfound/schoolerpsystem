export type StaffDesignation =
  | 'principal'
  | 'vice_principal'
  | 'academic_coordinator'
  | 'homeroom_teacher'
  | 'subject_teacher'
  | 'counselor'
  | 'sports_director'
  | 'special_educator'
  | 'lab_instructor'
  | 'hod';

export const DESIGNATION_LABELS: Record<StaffDesignation, string> = {
  principal: 'Principal / Headmaster',
  vice_principal: 'Vice Principal',
  academic_coordinator: 'Academic Coordinator',
  homeroom_teacher: 'Homeroom / Class Teacher',
  subject_teacher: 'Subject Teacher',
  counselor: 'Student Counselor / Guidance',
  sports_director: 'Physical Education / Sports Director',
  special_educator: 'Special Educator',
  lab_instructor: 'Laboratory Instructor',
  hod: 'Head of Department (HOD)',
};

export const DESIGNATION_BADGE_COLORS: Record<StaffDesignation, { bg: string; text: string; border: string }> = {
  principal: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  vice_principal: { bg: '#FEF9C3', text: '#854D0E', border: '#FEF08A' },
  academic_coordinator: { bg: '#E0E7FF', text: '#3730A3', border: '#C7D2FE' },
  homeroom_teacher: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  subject_teacher: { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  counselor: { bg: '#FCE7F3', text: '#9D174D', border: '#FBCFE8' },
  sports_director: { bg: '#FFEDD5', text: '#9A3412', border: '#FED7AA' },
  special_educator: { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' },
  lab_instructor: { bg: '#F1F5F9', text: '#334155', border: '#E2E8F0' },
  hod: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
};

export interface PrincipalStaffMember {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  designation: StaffDesignation;
  department?: string;
  assignedClass?: string; // e.g. "Grade 5-A" or "Grade 10-B"
  assignedSubjects?: string[];
  attendanceToday: 'present' | 'absent' | 'on_leave';
  experienceYears?: number;
  qualification?: string;
  avatarUrl?: string;
}

export interface HomeroomSection {
  id: string;
  name: string; // e.g. "Grade 5-A" or "Class 10-B"
  grade: string; // e.g. "5", "10"
  section: string; // e.g. "A", "B"
  roomNumber?: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  studentCount: number;
  presentCount: number;
  attendanceRate: number; // percentage e.g. 94.2
  classRepName?: string;
  dailyNotes?: string;
}

export type CounselingConcernCategory =
  | 'academic_stress'
  | 'attendance_issue'
  | 'behavioral'
  | 'peer_conflict'
  | 'career_guidance'
  | 'family'
  | 'wellbeing';

export const CONCERN_LABELS: Record<CounselingConcernCategory, string> = {
  academic_stress: 'Academic Stress & Performance',
  attendance_issue: 'Chronic Absenteeism (<75%)',
  behavioral: 'Behavioral & Discipline',
  peer_conflict: 'Peer Dynamics / Conflict',
  career_guidance: 'Aspirations & Subject Choice',
  family: 'Family / Home Environment',
  wellbeing: 'Emotional & Mental Wellbeing',
};

export interface CounselingRecord {
  id: string;
  studentId: string;
  studentName: string;
  gradeSection: string;
  counselorName: string;
  counselorId?: string;
  concernCategory: CounselingConcernCategory;
  severity: 'low' | 'medium' | 'high';
  actionPlan: string;
  parentContacted: boolean;
  status: 'active' | 'in_progress' | 'resolved';
  date: string;
  lastFollowUpDate?: string;
}

export interface SchoolNotice {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  targetAudience: 'all' | 'teachers' | 'students' | 'parents' | 'staff';
  publishedDate: string;
  author: string;
  acknowledgedCount?: number;
}

export interface PrincipalKPIs {
  totalStudents: number;
  presentStudents: number;
  studentAttendancePct: number;
  totalFaculty: number;
  presentFaculty: number;
  facultyAttendancePct: number;
  activeSections: number;
  counselingCasesActive: number;
  unassignedHomerooms: number;
  periodCoveragePct: number;
}

export type PrincipalTab =
  | 'dashboard'
  | 'homerooms'
  | 'staff'
  | 'counseling'
  | 'notices'
  | 'attendance'
  | 'profile';
