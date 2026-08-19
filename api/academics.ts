import { apiClient } from './client';

// ---------- Class Sections ----------
export async function fetchClassSectionsApi() {
  return apiClient('/admin/class-sections');
}

export async function createClassSectionApi(payload: {
  name: string;
  department?: string;
  academicYear?: string;
  section?: string;
  classTeacherId?: string;
}) {
  return apiClient('/admin/class-sections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateClassSectionApi(id: string, payload: Partial<{
  name: string;
  department: string;
  academicYear: string;
  section: string;
  classTeacherId: string;
}>) {
  return apiClient(`/admin/class-sections/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteClassSectionApi(id: string) {
  return apiClient(`/admin/class-sections/${id}`, {
    method: 'DELETE',
  });
}

// ---------- Subjects ----------
export async function fetchSubjectsApi() {
  return apiClient('/admin/subjects');
}

export async function createSubjectApi(payload: { name: string; code?: string }) {
  return apiClient('/admin/subjects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------- Subject Teachers ----------
export async function fetchSubjectTeachersApi(params?: { classSectionId?: string; teacherId?: string }) {
  const qs = new URLSearchParams();
  if (params?.classSectionId) qs.set('classSectionId', params.classSectionId);
  if (params?.teacherId) qs.set('teacherId', params.teacherId);
  const q = qs.toString();
  return apiClient(`/admin/subject-teachers${q ? `?${q}` : ''}`);
}

export async function createSubjectTeacherApi(payload: { classSectionId: string; subjectId: string; teacherId: string }) {
  return apiClient('/admin/subject-teachers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteSubjectTeacherApi(id: string) {
  return apiClient(`/admin/subject-teachers/${id}`, {
    method: 'DELETE',
  });
}

// ---------- Periods ----------
export async function fetchPeriodsApi() {
  return apiClient('/admin/periods');
}

export async function createPeriodApi(payload: { label: string; startTime: string; endTime: string; sortOrder?: number }) {
  return apiClient('/admin/periods', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------- Terms & Holidays ----------
export async function updateTermsApi(payload: { academicYear: string; terms: string[] }) {
  return apiClient('/admin/config/terms', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function updateHolidaysApi(payload: { blockedDates: { date: string; reason: string }[] }) {
  return apiClient('/admin/config/holidays', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ---------- Timetable ----------
export interface TimetableSlotPayload {
  subjectId: string;
  teacherId: string;
  periodId: string;
  dayOfWeek: number;
  room?: string;
}

export async function createTimetableApi(payload: {
  classSectionId: string;
  academicYear?: string;
  term?: string;
  effectiveFrom: string;
  slots: TimetableSlotPayload[];
}) {
  return apiClient('/admin/timetable', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchClassTimetableApi(classSectionId: string, date?: string) {
  const qs = new URLSearchParams({ classSectionId });
  if (date) qs.set('date', date);
  return apiClient(`/admin/timetable/class?${qs.toString()}`);
}

export async function fetchTeacherTimetableApi(date?: string) {
  const qs = new URLSearchParams();
  if (date) qs.set('date', date);
  return apiClient(`/admin/timetable/teacher${qs.toString() ? `?${qs.toString()}` : ''}`);
}

export async function fetchMyTimetableApi(date?: string) {
  const qs = new URLSearchParams();
  if (date) qs.set('date', date);
  return apiClient(`/admin/timetable/me${qs.toString() ? `?${qs.toString()}` : ''}`);
}

export async function fetchMyClassSectionApi() {
  return apiClient('/admin/timetable/my-class');
}

export async function fetchTimetableVersionsApi(classSectionId: string) {
  return apiClient(`/admin/timetable/class/${classSectionId}/versions`);
}

// ---------- Attendance ----------
export async function fetchRosterApi(timetableSlotId: string) {
  return apiClient(`/admin/attendance/roster?timetableSlotId=${encodeURIComponent(timetableSlotId)}`);
}

export async function fetchAttendanceForSlotApi(timetableSlotId: string, date?: string) {
  const qs = new URLSearchParams({ timetableSlotId });
  if (date) qs.set('date', date);
  return apiClient(`/admin/attendance/slot?${qs.toString()}`);
}

export async function markAttendanceApi(payload: {
  timetableSlotId: string;
  date: string;
  entries: { studentId: string; attendanceStatus: 'present' | 'absent' | 'late' | 'excused'; remarks?: string }[];
}) {
  return apiClient('/admin/attendance/mark', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchStudentAttendanceHistoryApi(params?: { fromDate?: string; toDate?: string }) {
  const qs = new URLSearchParams();
  if (params?.fromDate) qs.set('fromDate', params.fromDate);
  if (params?.toDate) qs.set('toDate', params.toDate);
  const q = qs.toString();
  return apiClient(`/admin/attendance/history/student${q ? `?${q}` : ''}`);
}

export async function fetchParentAttendanceApi() {
  return apiClient('/admin/attendance/history/parent');
}

export async function fetchDepartmentStatsApi(department?: string) {
  const qs = new URLSearchParams();
  if (department) qs.set('department', department);
  return apiClient(`/admin/attendance/stats/department${qs.toString() ? `?${qs.toString()}` : ''}`);
}

export async function fetchInstitutionStatsApi() {
  return apiClient('/admin/attendance/stats/institution');
}

export async function fetchClassAttendanceApi(params: {
  classSectionId: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}) {
  const qs = new URLSearchParams({ classSectionId: params.classSectionId });
  if (params.fromDate) qs.set('fromDate', params.fromDate);
  if (params.toDate) qs.set('toDate', params.toDate);
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  return apiClient(`/admin/attendance/class?${qs.toString()}`);
}
