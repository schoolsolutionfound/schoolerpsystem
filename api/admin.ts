import { apiClient } from './client';
import { SingleFeedInput } from '../schemas/feed.schema';

export async function singleFeedApi(payload: SingleFeedInput) {
  return apiClient('/admin/single-feed', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function bulkFeedApi(records: SingleFeedInput[], options?: { sendEmails?: boolean; overwriteUsers?: boolean }) {
  return apiClient('/admin/bulk-feed', {
    method: 'POST',
    body: JSON.stringify({ records, ...options }),
  });
}

export async function fetchInstitutionConfigApi() {
  return apiClient('/admin/institution-config');
}

export async function fetchDashboardStatsApi() {
  return apiClient('/admin/dashboard-stats');
}

export async function updateInstitutionConfigApi(payload: { departments?: string[]; academicYears?: string[]; courses?: string[]; sections?: string[] }) {
  return apiClient('/admin/institution-config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function fetchStudentsApi() {
  return apiClient('/admin/students');
}

export async function createStudentApi(payload: {
  firstName: string;
  lastName: string;
  email: string;
  rollNoOrUSN: string;
  department?: string;
  academicYear?: string;
  section?: string;
  password?: string;
}) {
  return apiClient('/admin/students', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchStudentByIdApi(id: string) {
  return apiClient(`/admin/students/${id}`);
}

export async function updateStudentApi(id: string, payload: {
  firstName?: string;
  lastName?: string;
  email?: string;
  rollNoOrUSN?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  phone?: string;
  parentPhone?: string;
  tenthPercentage?: string;
  twelfthPercentage?: string;
}) {
  return apiClient(`/admin/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteStudentApi(id: string) {
  return apiClient(`/admin/students/${id}`, {
    method: 'DELETE',
  });
}

export async function promoteStudentsApi(studentIds: string[], targetClassSectionId: string, academicYear: string) {
  return apiClient('/admin/students/promote', {
    method: 'POST',
    body: JSON.stringify({ studentIds, targetClassSectionId, academicYear }),
  });
}

export async function graduateStudentsApi(studentIds: string[]) {
  return apiClient('/admin/students/graduate', {
    method: 'POST',
    body: JSON.stringify({ studentIds }),
  });
}

export async function fetchAlumniApi() {
  return apiClient('/admin/students/alumni');
}

export async function fetchStudentDocumentsApi(studentId: string) {
  return apiClient(`/admin/students/${studentId}/documents`);
}

export async function uploadStudentDocumentApi(studentId: string, payload: {
  documentType: string;
  fileName: string;
  fileUrl: string;
}) {
  return apiClient(`/admin/students/${studentId}/documents`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteStudentDocumentApi(studentId: string, docId: string) {
  return apiClient(`/admin/students/${studentId}/documents/${docId}`, {
    method: 'DELETE',
  });
}

export async function fetchMyDocumentsApi() {
  return apiClient('/admin/my/documents');
}

export async function uploadMyDocumentApi(payload: {
  documentType: string;
  fileName: string;
  fileUrl: string;
}) {
  return apiClient('/admin/my/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteMyDocumentApi(docId: string) {
  return apiClient(`/admin/my/documents/${docId}`, {
    method: 'DELETE',
  });
}

export async function fetchTeachersApi() {
  return apiClient('/admin/teachers');
}

export async function createTeacherApi(payload: {
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: string;
  password?: string;
}) {
  return apiClient('/admin/teachers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTeacherApi(id: string, payload: {
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeId?: string;
  department?: string;
}) {
  return apiClient(`/admin/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteTeacherApi(id: string) {
  return apiClient(`/admin/teachers/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchUsersApi() {
  return apiClient('/admin/users');
}

export async function createUserApi(payload: {
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  parentPhone?: string;
  employeeId?: string;
  rollNoOrUSN?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  title?: string;
  password?: string;
}) {
  return apiClient('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
