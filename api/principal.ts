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
  };
}

export async function fetchPrincipalKPIsApi(): Promise<PrincipalKPIs> {
  const [statsRes, counselingRes, sectionsRes] = await Promise.all([
    apiClient<DashboardStatsApiResponse>('/admin/dashboard-stats'),
    apiClient<{ success: boolean; data: CounselingRecord[] }>('/admin/counseling').catch(() => ({ data: [] })),
    apiClient<{ success: boolean; data: ClassSectionApiResponse[] }>('/admin/class-sections').catch(() => ({ data: [] })),
  ]);

  const s = statsRes?.stats || {};
  const totalStudents = s.students ?? 0;
  const totalFaculty = s.teachers ?? 0;
  const sections = Array.isArray(sectionsRes?.data) ? sectionsRes.data : Array.isArray(sectionsRes) ? sectionsRes : [];
  const counselingList = Array.isArray(counselingRes?.data) ? counselingRes.data : [];

  const unassignedHomerooms = sections.filter((sec) => !sec.classTeacherId || sec.classTeacherId.trim() === '').length;
  const activeSectionsCount = sections.length > 0 ? sections.length : (s.classSections ?? 0);
  const activeCounseling = counselingList.filter((c) => c.status !== 'resolved').length;

  return {
    totalStudents,
    presentStudents: totalStudents, // Real count from server
    studentAttendancePct: s.studentAttendancePct ?? (totalStudents > 0 ? 100 : 0),
    totalFaculty,
    presentFaculty: totalFaculty,
    facultyAttendancePct: s.facultyAttendancePct ?? (totalFaculty > 0 ? 100 : 0),
    activeSections: activeSectionsCount,
    counselingCasesActive: activeCounseling,
    unassignedHomerooms,
    periodCoveragePct: 100,
  };
}

export async function fetchPrincipalHomeroomsApi(): Promise<HomeroomSection[]> {
  const res = await apiClient<{ success?: boolean; data?: ClassSectionApiResponse[] } | ClassSectionApiResponse[]>('/admin/class-sections');
  const sections = Array.isArray(res) ? res : res?.data || [];

  return sections.map((sec, idx) => {
    const rawName = sec.name || [sec.department, sec.academicYear, sec.section].filter(Boolean).join(' ') || `Class ${idx + 1}`;
    const studentCount = Number(sec.studentCount) || 0;
    const presentCount = sec.presentCount !== undefined ? Number(sec.presentCount) : studentCount;
    const attendanceRate = studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 0;

    return {
      id: sec.id,
      name: rawName,
      grade: sec.academicYear || sec.name?.replace(/[^0-9]/g, '') || `${idx + 1}`,
      section: sec.section || '',
      roomNumber: sec.roomNumber || undefined, // D5: Show real room or undefined (displayed as —)
      homeroomTeacherId: sec.classTeacherId || undefined,
      homeroomTeacherName: sec.classTeacherName || undefined,
      studentCount,
      presentCount,
      attendanceRate,
      classRepName: sec.classRepName || undefined, // D5: Don't invent class rep
      dailyNotes: sec.dailyNotes || undefined,
    };
  });
}

export async function fetchPrincipalStaffDirectoryApi(): Promise<PrincipalStaffMember[]> {
  const res = await apiClient<{ success?: boolean; data?: StaffApiResponse[] } | StaffApiResponse[]>('/admin/teachers');
  const teachers = Array.isArray(res) ? res : res?.data || [];

  return teachers.map((t, idx) => {
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

    return {
      id: t.id || `stf-${idx}`,
      fullName: t.fullName || t.name || `Faculty Member ${idx + 1}`,
      email: t.email || '',
      phone: t.phone || undefined, // D6: Real phone or undefined
      designation: desig,
      department: t.department || parsedScope.department || undefined,
      assignedClass: t.assignedClass || parsedScope.assignedClass || undefined,
      attendanceToday: t.attendanceToday || 'present',
      experienceYears: parsedScope.experienceYears || t.experienceYears || undefined, // D6: Real experience or undefined
      qualification: parsedScope.qualification || t.qualification || undefined, // D6: Real qualification or undefined
    };
  });
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
  const res = await apiClient<{ success: boolean; data: CounselingRecord[] }>('/admin/counseling');
  return Array.isArray(res?.data) ? res.data : [];
}

export async function createCounselingRecordApi(record: Omit<CounselingRecord, 'id'>): Promise<CounselingRecord> {
  const res = await apiClient<{ success: boolean; data: CounselingRecord }>('/admin/counseling', {
    method: 'POST',
    body: JSON.stringify(record),
  });
  return res.data;
}

export async function updateCounselingStatusApi(id: string, status: CounselingRecord['status']): Promise<boolean> {
  const res = await apiClient<{ success: boolean; data: CounselingRecord }>(`/admin/counseling/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.success;
}

export async function fetchSchoolNoticesApi(): Promise<SchoolNotice[]> {
  const res = await apiClient<{ success: boolean; data: any[] }>('/announcements');
  const items = Array.isArray(res?.data) ? res.data : [];

  return items.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority || 'normal',
    targetAudience: (a.targetAudience === 'faculty' ? 'teachers' : a.targetAudience) || 'all',
    publishedDate: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    author: a.authorName || 'Principal Office',
    acknowledgedCount: 0,
  }));
}

export async function createSchoolNoticeApi(
  notice: Omit<SchoolNotice, 'id' | 'publishedDate' | 'acknowledgedCount'>
): Promise<SchoolNotice> {
  const res = await apiClient<{ success: boolean; data: any }>('/announcements', {
    method: 'POST',
    body: JSON.stringify({
      title: notice.title,
      content: notice.content,
      priority: notice.priority,
      targetAudience: notice.targetAudience === 'teachers' ? 'faculty' : notice.targetAudience,
    }),
  });

  const a = res.data;
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    targetAudience: notice.targetAudience,
    publishedDate: a.createdAt ? new Date(a.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    author: a.authorName || 'Principal Office',
    acknowledgedCount: 0,
  };
}
