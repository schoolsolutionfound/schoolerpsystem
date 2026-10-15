import { apiClient } from './client';
import {
  HODKPIs,
  HODFacultyMember,
  DepartmentCourse,
  ExamEligibilityRecord,
  DepartmentNotice,
  HallTicketStatus,
} from '../features/hod/types/hod.types';

export async function fetchHODKPIsApi(department?: string): Promise<HODKPIs> {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  const res = await apiClient<{ success?: boolean; data?: HODKPIs }>('/admin/hod/kpis' + query);
  if (res?.data) {
    return res.data;
  }
  return {
    totalStudents: 0,
    facultyOnDuty: 0,
    totalFaculty: 0,
    activeCourses: 0,
    practicalLabsCount: 0,
    averageSyllabusProgress: 0,
    detentionAlertsCount: 0,
    unassignedCoursesCount: 0,
    todayLabSessions: 0,
  };
}

export async function fetchHODFacultyApi(department?: string): Promise<HODFacultyMember[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  const res = await apiClient<{ success?: boolean; data?: HODFacultyMember[] } | HODFacultyMember[]>(
    '/admin/hod/faculty' + query
  );
  // E3: Treat [] as valid empty result without triggering fake data fallback
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export async function fetchDepartmentCoursesApi(department?: string): Promise<DepartmentCourse[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  const res = await apiClient<{ success?: boolean; data?: DepartmentCourse[] } | DepartmentCourse[]>(
    '/admin/hod/courses' + query
  );
  // E3: Treat [] as valid empty result
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export async function assignCourseInstructorApi(
  courseId: string,
  facultyId: string,
  facultyName: string
): Promise<{ success: boolean; course: DepartmentCourse }> {
  // E2: Let errors reach the caller; don't return success when server fails
  const res = await apiClient<any>(
    `/admin/hod/courses/${courseId}/assign`,
    {
      method: 'POST',
      body: JSON.stringify({ facultyId, facultyName }),
    }
  );
  const course = res?.course || res?.data?.course || res?.data || res;
  return { success: true, course };
}

export async function fetchExamEligibilityApi(
  department?: string,
  semester?: string
): Promise<ExamEligibilityRecord[]> {
  const query = [
    department ? `department=${encodeURIComponent(department)}` : '',
    semester && semester !== 'all' ? `semester=${encodeURIComponent(semester)}` : '',
  ]
    .filter(Boolean)
    .join('&');

  const res = await apiClient<{ success?: boolean; data?: any[] } | any[]>(
    `/admin/hod/eligibility${query ? `?${query}` : ''}`
  );

  const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  return rawList.map((e) => ({
    id: e.id,
    studentId: e.studentId,
    studentName: e.studentName,
    usn: e.usn,
    semester: e.semester,
    department: e.department,
    overallAttendancePct: Number(e.overallAttendancePct) || 0,
    coursesBelowThreshold: Number(e.coursesBelowThreshold) || 0,
    internalAssessmentScore: Number(e.internalAssessmentScore) || 0,
    hallTicketStatus: e.hallTicketStatus as HallTicketStatus,
    condonationReason: e.condonationReason || undefined,
    approvedBy: e.approvedBy || undefined,
    approvalDate: e.approvalDate || undefined,
    remarks: e.remarks || undefined,
  }));
}

export async function updateHallTicketStatusApi(
  recordId: string,
  status: HallTicketStatus,
  note?: string
): Promise<{ success: boolean; record: ExamEligibilityRecord }> {
  // E2 & E6: Let errors reach the caller (enforcing 75% rule on server)
  const res = await apiClient<any>(
    `/admin/hod/eligibility/${recordId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }
  );

  const e = res?.record || res?.data?.record || res?.data || res;
  return {
    success: true,
    record: {
      id: e?.id,
      studentId: e?.studentId,
      studentName: e?.studentName,
      usn: e?.usn,
      semester: e?.semester,
      department: e?.department,
      overallAttendancePct: Number(e?.overallAttendancePct) || 0,
      coursesBelowThreshold: Number(e?.coursesBelowThreshold) || 0,
      internalAssessmentScore: Number(e?.internalAssessmentScore) || 0,
      hallTicketStatus: (e?.hallTicketStatus as HallTicketStatus) || status,
      condonationReason: e?.condonationReason || undefined,
      approvedBy: e?.approvedBy || undefined,
      approvalDate: e?.approvalDate || undefined,
      remarks: e?.remarks || undefined,
    },
  };
}

export async function fetchDepartmentNoticesApi(department?: string): Promise<DepartmentNotice[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : '';
  const res = await apiClient<{ success?: boolean; data?: any[] } | any[]>(
    `/admin/hod/notices${query}`
  );

  const rawList = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
  return rawList.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    department: n.department || department || '',
    priority: n.priority || 'normal',
    targetAudience: n.targetAudience || 'faculty',
    publishedDate: n.createdAt
      ? new Date(n.createdAt).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    authorName: n.authorName || 'Head of Department',
    authorRole: n.authorRole || 'hod',
  }));
}

export async function createDepartmentNoticeApi(
  noticeData: Omit<DepartmentNotice, 'id' | 'publishedDate'>
): Promise<{ success: boolean; notice: DepartmentNotice }> {
  const res = await apiClient<any>(
    '/admin/hod/notices',
    {
      method: 'POST',
      body: JSON.stringify(noticeData),
    }
  );

  const n = res?.notice || res?.data?.notice || res?.data || res;
  return {
    success: true,
    notice: {
      id: n?.id || `notice-${Date.now()}`,
      title: n?.title || noticeData.title,
      content: n?.content || noticeData.content,
      department: n?.department || noticeData.department,
      priority: n?.priority || noticeData.priority,
      targetAudience: n?.targetAudience || noticeData.targetAudience,
      publishedDate: n?.createdAt
        ? new Date(n.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      authorName: n?.authorName || 'Head of Department',
      authorRole: n?.authorRole || 'hod',
    },
  };
}
