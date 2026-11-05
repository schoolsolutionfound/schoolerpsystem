import { apiClient } from './client';
import {
  PrincipalKPIs,
  PrincipalStaffMember,
  HomeroomSection,
  CounselingRecord,
  SchoolNotice,
  StaffDesignation,
} from '../features/principal/types/principal.types';

export interface DashboardStatsApiResponse {
  success?: boolean;
  stats?: {
    students?: number;
    teachers?: number;
    classSections?: number;
    subjects?: number;
    attendanceSessions?: number;
    studentAttendancePct?: number;
    facultyAttendancePct?: number;
  };
}

export interface ClassSectionApiResponse {
  id: string;
  name?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  roomNumber?: string;
  classTeacherId?: string;
  classTeacherName?: string;
  studentCount?: number;
  presentCount?: number;
  attendanceRate?: number;
  classRepName?: string;
  dailyNotes?: string;
}

export interface StaffApiResponse {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  department?: string;
  designation?: string;
  assignedClass?: string;
  qualification?: string;
  experienceYears?: number;
  attendanceToday?: 'present' | 'absent' | 'on_leave';
  scope?: {
    department?: string;
    designation?: string;
    assignedClass?: string;
    qualification?: string;
    experienceYears?: number;
    rank?: string;
    attendanceToday?: string;
    status?: string;
  };
}

export interface PrincipalFeeSummary {
  institutionCode: string;
  studentCount: number;
  totals: {
    expected: number;
    collected: number;
    pending: number;
    collectionRate: number;
  };
  byDepartment: {
    department: string;
    expected: number;
    collected: number;
    pending: number;
    collectionRate: number;
    studentCount: number;
    paidStudentCount: number;
  }[];
  terms: { term: string; expected: number; collected: number; pending: number }[];
  academicYears: { academicYear: string; expected: number; collected: number; pending: number }[];
  generatedAt: string;
}

export interface PrincipalTodayClassSlot {
  id: string;
  dayOfWeek: number;
  room?: string;
  subject: { id: string; name: string; code?: string } | null;
  period: { id: string; label: string; startTime: string; endTime: string; sortOrder: number } | null;
  teacher: { id: string; fullName: string } | null;
}

export interface PrincipalTodayClass {
  classSectionId: string;
  name: string;
  department: string;
  section: string;
  academicYear: string;
  studentCount: number;
  classTeacherId: string;
  classTeacherName: string;
  slots: PrincipalTodayClassSlot[];
}

export interface PrincipalTodayClasses {
  date: string;
  dayOfWeek: number;
  classes: PrincipalTodayClass[];
  totals: { classes: number; periodsScheduled: number; teachersEngaged: number };
}

export interface UpcomingEvent {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  status: string;
  publishAt: string | null;
  expiresAt: string | null;
}

export async function fetchPrincipalFeeSummaryApi(): Promise<PrincipalFeeSummary | null> {
  try {
    const res = await apiClient<any>('/admin/fees/summary');
    return res?.data || res || null;
  } catch (err) {
    console.warn('[fetchPrincipalFeeSummaryApi] error:', err);
    return null;
  }
}

export async function fetchPrincipalTodayClassesApi(date?: string): Promise<PrincipalTodayClasses | null> {
  try {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await apiClient<any>(`/admin/timetable/today${qs}`);
    return res?.data || res || null;
  } catch (err) {
    console.warn('[fetchPrincipalTodayClassesApi] error:', err);
    return null;
  }
}

export async function fetchUpcomingEventsApi(limit = 10): Promise<UpcomingEvent[]> {
  try {
    const res = await apiClient<any>(`/announcements/upcoming-events?limit=${limit}`);
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return items;
  } catch (err) {
    console.warn('[fetchUpcomingEventsApi] error:', err);
    return [];
  }
}

export async function fetchPrincipalKPIsApi(): Promise<PrincipalKPIs> {
  try {
    const [statsRes, counselingRes, sectionsRes] = await Promise.all([
      apiClient<any>('/admin/dashboard-stats').catch(() => null),
      apiClient<any>('/admin/counseling').catch(() => ({ data: [] })),
      apiClient<any>('/admin/class-sections').catch(() => ({ data: [] })),
    ]);

    const rawStats = statsRes?.data || statsRes?.stats || (statsRes && typeof statsRes === 'object' && !Array.isArray(statsRes) ? statsRes : {}) || {};
    const sections = Array.isArray(sectionsRes?.data) ? sectionsRes.data : Array.isArray(sectionsRes) ? sectionsRes : [];
    const counselingList = Array.isArray(counselingRes?.data) ? counselingRes.data : Array.isArray(counselingRes) ? counselingRes : [];

    // Compute live values dynamically from actual class sections
    const sectionsTotalStudents = sections.reduce((sum: number, sec: any) => sum + (Number(sec.studentCount) || 0), 0);
    const sectionsPresentStudents = sections.reduce((sum: number, sec: any) => sum + (sec.presentCount !== undefined ? Number(sec.presentCount) : Number(sec.studentCount) || 0), 0);

    const totalStudents = sectionsTotalStudents > 0 ? sectionsTotalStudents : (Number(rawStats.students ?? rawStats.totalStudents) || 0);
    const presentStudents = sectionsTotalStudents > 0
      ? sectionsPresentStudents
      : (rawStats.presentStudents !== undefined ? Number(rawStats.presentStudents) : 0);
    const studentAttPct = totalStudents > 0
      ? Math.round((presentStudents / totalStudents) * 100)
      : (rawStats.studentAttendancePct !== undefined ? Number(rawStats.studentAttendancePct) : 0);

    const totalFaculty = Number(rawStats.teachers ?? rawStats.totalFaculty) || 0;
    const hasFacultyAttendance = rawStats.presentFaculty !== undefined;
    const presentFaculty = hasFacultyAttendance ? Number(rawStats.presentFaculty) : 0;
    const facultyAttPct = hasFacultyAttendance && totalFaculty > 0
      ? Math.round((presentFaculty / totalFaculty) * 100)
      : 0;

    const unassignedHomerooms = sections.filter((sec: any) => !sec.classTeacherId || sec.classTeacherId.trim() === '').length;
    const activeSectionsCount = sections.length > 0 ? sections.length : (rawStats.classSections ?? 0);
    const activeCounseling = counselingList.filter((c: any) => c.status !== 'resolved').length;

    return {
      totalStudents,
      presentStudents,
      studentAttendancePct: studentAttPct,
      totalFaculty,
      presentFaculty,
      facultyAttendancePct: facultyAttPct,
      activeSections: activeSectionsCount,
      counselingCasesActive: activeCounseling,
      unassignedHomerooms,
      periodCoveragePct: 0,
    };
  } catch (err) {
    console.warn('[fetchPrincipalKPIsApi] error:', err);
    return {
      totalStudents: 0,
      presentStudents: 0,
      studentAttendancePct: 0,
      totalFaculty: 0,
      presentFaculty: 0,
      facultyAttendancePct: 0,
      activeSections: 0,
      counselingCasesActive: 0,
      unassignedHomerooms: 0,
      periodCoveragePct: 0,
    };
  }
}

export async function fetchPrincipalHomeroomsApi(): Promise<HomeroomSection[]> {
  try {
    const res = await apiClient<{ success?: boolean; data?: ClassSectionApiResponse[] } | ClassSectionApiResponse[]>('/admin/class-sections');
    const sections = Array.isArray(res) ? res : res?.data || [];

    if (!sections || sections.length === 0) {
      return [];
    }

    return sections.map((sec) => {
      const rawName = sec.name || [sec.department, sec.academicYear, sec.section].filter(Boolean).join(' ').trim() || 'Unnamed Class';
      const studentCount = Number(sec.studentCount) || 0;
      const presentCount = sec.presentCount !== undefined ? Number(sec.presentCount) : 0;
      const attendanceRate = studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 0;

      return {
        id: sec.id,
        name: rawName,
        department: sec.department || '',
        grade: sec.academicYear || sec.name?.replace(/[^0-9]/g, '') || '',
        section: sec.section || '',
        roomNumber: sec.roomNumber || undefined,
        homeroomTeacherId: sec.classTeacherId || undefined,
        homeroomTeacherName: sec.classTeacherName || undefined,
        studentCount,
        presentCount,
        attendanceRate,
        classRepName: sec.classRepName || undefined,
        dailyNotes: sec.dailyNotes || undefined,
      };
    });
  } catch (err) {
    console.warn('[fetchPrincipalHomeroomsApi] error:', err);
    return [];
  }
}

export async function fetchPrincipalStaffDirectoryApi(): Promise<PrincipalStaffMember[]> {
  try {
    const res = await apiClient<any>('/admin/teachers');
    const teachers: StaffApiResponse[] = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.data?.data)
      ? res.data.data
      : Array.isArray(res?.items)
      ? res.items
      : [];

    return teachers.map((t) => {
      const parsedScope = t.scope && typeof t.scope === 'object' ? t.scope : {};
      let desig: StaffDesignation = 'subject_teacher';

      const rawDesig = (t.designation || parsedScope.designation || t.role || '').toLowerCase();
      if (rawDesig.includes('principal') && !rawDesig.includes('vice')) desig = 'principal';
      else if (rawDesig.includes('vice')) desig = 'vice_principal';
      else if (rawDesig.includes('coord')) desig = 'academic_coordinator';
      else if (rawDesig.includes('counsel')) desig = 'counselor';
      else if (rawDesig.includes('sport')) desig = 'sports_director';
      else if (rawDesig.includes('special')) desig = 'special_educator';
      else if (rawDesig.includes('lab')) desig = 'lab_instructor';
      else if (rawDesig.includes('hod')) desig = 'hod';
      else if (t.assignedClass) desig = 'homeroom_teacher';

      const rawAttendance = String(t.attendanceToday || parsedScope.attendanceToday || parsedScope.status || '').toLowerCase();
      const attendanceToday: PrincipalStaffMember['attendanceToday'] =
        rawAttendance === 'present' || rawAttendance === 'absent' || rawAttendance === 'on_leave'
          ? rawAttendance
          : 'unknown';

      return {
        id: t.id || t.email || '',
        fullName: t.fullName || t.name || 'Unnamed Faculty',
        email: t.email || '',
        phone: t.phone || undefined,
        designation: desig,
        department: t.department || parsedScope.department || undefined,
        assignedClass: t.assignedClass || parsedScope.assignedClass || undefined,
        attendanceToday,
        experienceYears: parsedScope.experienceYears ?? t.experienceYears ?? undefined,
        qualification: parsedScope.qualification || t.qualification || undefined,
      };
    });
  } catch (err) {
    console.warn('[fetchPrincipalStaffDirectoryApi] error:', err);
    return [];
  }
}

export async function assignHomeroomTeacherApi(
  sectionId: string,
  teacherId?: string,
  teacherName?: string
): Promise<boolean> {
  // D3: Let errors propagate to caller so false success is never reported
  await apiClient(`/admin/class-sections/${sectionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      classTeacherId: teacherId || '',
      classTeacherName: teacherName || '',
    }),
  });
  return true;
}

export async function fetchCounselingRecordsApi(): Promise<CounselingRecord[]> {
  const res = await apiClient<any>('/admin/counseling');
  const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  return items;
}

export async function createCounselingRecordApi(record: Omit<CounselingRecord, 'id'>): Promise<CounselingRecord> {
  const res = await apiClient<any>('/admin/counseling', {
    method: 'POST',
    body: JSON.stringify(record),
  });
  return res?.data || res;
}

export async function updateCounselingStatusApi(id: string, status: CounselingRecord['status']): Promise<boolean> {
  const res = await apiClient<any>(`/admin/counseling/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return !!res;
}

function normalizeNoticePriority(raw: any): SchoolNotice['priority'] {
  const value = String(raw || '').toLowerCase();
  if (value === 'urgent') return 'urgent';
  if (value === 'high' || value === 'important') return 'important';
  return 'normal';
}

function deriveNoticeAudience(targets: any[]): SchoolNotice['targetAudience'] {
  if (!Array.isArray(targets) || targets.length === 0) return 'all';
  const roles = targets
    .filter((target) => String(target?.targetType || '').toLowerCase() === 'role')
    .map((target) => String(target?.targetRole || '').toLowerCase());
  if (roles.includes('faculty') || roles.includes('teacher')) return 'teachers';
  if (roles.includes('student')) return 'students';
  if (roles.includes('parent')) return 'parents';
  if (roles.includes('staff')) return 'staff';
  return 'all';
}

function toIsoDateOnly(value: any): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
}

export async function fetchSchoolNoticesApi(): Promise<SchoolNotice[]> {
  const res = await apiClient<any>('/principal-notices');
  const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];

  return items.map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    priority: normalizeNoticePriority(a.priority),
    targetAudience: deriveNoticeAudience(a.targets),
    department: a.department || '',
    publishedDate: toIsoDateOnly(a.publishAt || a.createdAt),
    author: a.authorName || a.createdByName || '',
    acknowledgedCount: Number(a.readCount) || 0,
  }));
}

export async function createSchoolNoticeApi(
  notice: Omit<SchoolNotice, 'id' | 'publishedDate' | 'acknowledgedCount'>
): Promise<SchoolNotice> {
  const res = await apiClient<any>('/principal-notices', {
    method: 'POST',
    body: JSON.stringify({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      targetAudience: notice.targetAudience === 'teachers' ? 'faculty' : notice.targetAudience,
      department: notice.department || '',
    }),
  });

  const a = res?.data || res;
  return {
    id: a?.id || '',
    title: a?.title || notice.title,
    content: a?.content || notice.content,
    priority: normalizeNoticePriority(a?.priority || notice.priority),
    targetAudience: notice.targetAudience,
    department: a?.department || notice.department || '',
    publishedDate: toIsoDateOnly(a?.publishAt || a?.createdAt),
    author: a?.authorName || a?.createdByName || '',
    acknowledgedCount: 0,
  };
}

export async function deleteSchoolNoticeApi(id: string): Promise<boolean> {
  try {
    await apiClient(`/principal-notices/${id}`, { method: 'DELETE' });
    return true;
  } catch (err) {
    console.warn('Failed to delete announcement:', err);
    return false;
  }
}

export async function updateSchoolNoticeApi(
  id: string,
  notice: Partial<Omit<SchoolNotice, 'id'>>
): Promise<boolean> {
  try {
    await apiClient(`/principal-notices/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        targetAudience: notice.targetAudience === 'teachers' ? 'faculty' : notice.targetAudience,
        department: notice.department || '',
      }),
    });
    return true;
  } catch (err) {
    console.warn('Failed to update announcement:', err);
    return false;
  }
}

export interface StudentDetailDossier {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  parentPhone: string;
  rollNoOrUSN: string;
  profilePicUrl?: string;
  tenthPercentage?: string;
  twelfthPercentage?: string;
  department: string;
  academicYear: string;
  section: string;
  className: string;
  roomNumber?: string;
  classTeacherName?: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  address: string;
  admissionDate: string;
  institutionType?: string;
  attendance: {
    rate: number;
    presentDays: number;
    absentDays: number;
    totalDays: number;
    status: 'good' | 'normal' | 'at_risk';
  };
  fees: {
    totalFee: number;
    paidFee: number;
    pendingFee: number;
    status: 'paid' | 'partial' | 'pending' | 'overdue';
    dueDate?: string;
  };
  academics: {
    cgpa: number;
    backlogs: number;
    status: 'passed' | 'reappear';
    semester: string;
  };
}

export interface ClassSectionStudentsResponse {
  classSection: any;
  students: StudentDetailDossier[];
  summary: {
    totalStudents: number;
    totalFeesDue: number;
    defaultersCount: number;
    averageAttendance: number;
  };
}

export async function fetchClassSectionStudentsApi(classSectionId: string): Promise<ClassSectionStudentsResponse> {
  const res = await apiClient<any>(`/admin/class-sections/${classSectionId}/students`);
  return res?.data || res;
}

export async function updateStudentDetailApi(
  studentId: string,
  updates: Partial<StudentDetailDossier>
): Promise<boolean> {
  await apiClient(`/admin/students/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return true;
}
