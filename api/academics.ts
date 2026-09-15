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

export async function fetchClassSubjectsApi(classSectionId: string) {
  const stRes = await fetchSubjectTeachersApi({ classSectionId });
  const subRes = await fetchSubjectsApi();
  const subjectIds = new Set((stRes || []).map((st: any) => st.subjectId));
  return (subRes || []).filter((s: any) => subjectIds.has(s.id));
}

export async function createSubjectTeacherApi(payload: { classSectionId: string; subjectId: string; teacherId: string }) {
  return apiClient('/admin/subject-teachers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateSubjectTeacherApi(id: string, payload: { teacherId: string }) {
  return apiClient(`/admin/subject-teachers/${id}`, {
    method: 'PUT',
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

export async function fetchParentMarksApi() {
  return apiClient('/admin/marks/parent');
}

export async function fetchParentTimetableApi(date?: string) {
  const qs = date ? `?date=${date}` : '';
  return apiClient(`/admin/timetable/parent${qs}`);
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

// ---------- Marks / Exams ----------

export async function fetchExamsApi() {
  return apiClient('/admin/exams');
}

export async function fetchExamApi(id: string) {
  return apiClient(`/admin/exams/${id}`);
}

export async function createExamApi(payload: {
  name: string;
  term?: string;
  academicYear?: string;
  startDate?: string;
  endDate?: string;
  subjects: { subjectId: string; maxMarks?: number; passMarks?: number }[];
}) {
  return apiClient('/admin/exams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExamApi(
  id: string,
  payload: { name?: string; status?: 'draft' | 'published' | 'locked' }
) {
  return apiClient(`/admin/exams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchMarksForClassApi(examSubjectId: string, classSectionId: string) {
  const qs = new URLSearchParams({ examSubjectId, classSectionId });
  return apiClient(`/admin/marks?${qs.toString()}`);
}

export async function saveMarksApi(payload: {
  examSubjectId: string;
  classSectionId: string;
  entries: { studentId: string; marksObtained: number; grade?: string; remarks?: string }[];
}) {
  return apiClient('/admin/marks', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchStudentMarksApi(studentId?: string) {
  const path = studentId ? `/admin/marks/student/${studentId}` : '/admin/marks/me';
  return apiClient(path);
}

export async function fetchClassAttendanceReportApi(classSectionId: string, fromDate?: string, toDate?: string) {
  const params = new URLSearchParams({ classSectionId });
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);
  return apiClient(`/admin/attendance/report?${params.toString()}`);
}

export async function fetchClassAttendanceExportApi(classSectionId: string, fromDate?: string, toDate?: string) {
  const { auth } = require('../firebaseConfig');
  const { getApiBaseUrl } = require('./client');
  const params = new URLSearchParams({ classSectionId });
  if (fromDate) params.set('fromDate', fromDate);
  if (toDate) params.set('toDate', toDate);

  let token = '';
  if (auth.currentUser) {
    try { token = await auth.currentUser.getIdToken(); } catch {}
  }

  const res = await fetch(`${getApiBaseUrl()}/admin/attendance/export?${params.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Export failed');
  return res.text();
}

// ---------- Homework ----------

export async function createHomeworkApi(payload: {
  classSectionId: string;
  subjectId: string;
  title: string;
  description?: string;
  dueDate: string;
  priority?: string;
}) {
  return apiClient('/admin/homework', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMyHomeworkApi() {
  return apiClient('/admin/homework/mine');
}

export async function fetchHomeworkByClassApi(classSectionId: string) {
  const params = new URLSearchParams({ classSectionId });
  return apiClient(`/admin/homework?${params.toString()}`);
}

export async function fetchHomeworkByIdApi(id: string) {
  return apiClient(`/admin/homework/${id}`);
}

export async function updateHomeworkApi(id: string, payload: Partial<{
  title: string;
  description: string;
  dueDate: string;
  priority: string;
  status: string;
}>) {
  return apiClient(`/admin/homework/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteHomeworkApi(id: string) {
  return apiClient(`/admin/homework/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchStudentHomeworkApi() {
  return apiClient('/admin/homework/student');
}

export async function fetchParentHomeworkApi() {
  return apiClient('/admin/homework/parent');
}
