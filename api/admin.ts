import { apiClient } from './client';
import { SingleFeedInput } from '../schemas/feed.schema';
import type { ProfileFormField } from '../features/shared/formFields/types';

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

export interface BulkCreateRecord {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password?: string;
  rollNoOrUSN?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  employeeId?: string;
  relation?: string;
  childEmails?: string[];
  categoryName?: string;
  seats?: number;
}

/** CSV bulk import — one call creates up to 500 users of a single role. */
export async function bulkCreateUsersApi(role: string, records: BulkCreateRecord[]) {
  return apiClient('/admin/bulk-create', {
    method: 'POST',
    body: JSON.stringify({ role, records }),
  });
}

export async function fetchInstitutionConfigApi() {
  return apiClient('/admin/institution-config');
}

export async function fetchDashboardStatsApi() {
  return apiClient('/admin/dashboard-stats');
}

export async function updateInstitutionConfigApi(payload: { departments?: string[]; academicYears?: string[]; yearsOfStudy?: string[]; courses?: string[]; sections?: string[]; classSubjects?: Record<string, string[]>; terms?: { academicYear: string; terms: string[] }[]; defaultTempPassword?: string; maintenanceEnabled?: boolean; maintenanceMinVersion?: string }) {
  return apiClient('/admin/institution-config', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// --- Settings → Form Fields (per-role dynamic profile fields) ---

export async function fetchProfileFieldsApi() {
  return apiClient<Record<string, ProfileFormField[]>>('/admin/profile-fields', {
    method: 'GET',
  });
}

export async function saveRoleProfileFieldsApi(role: string, fields: ProfileFormField[]) {
  return apiClient<Record<string, ProfileFormField[]>>(`/admin/profile-fields/${role}`, {
    method: 'PUT',
    body: JSON.stringify({ fields }),
  });
}

export interface AdminListParams {
  search?: string;
  limit?: number;
  offset?: number;
}

function listQuery(params?: AdminListParams) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.limit != null) sp.set('limit', String(params.limit));
  if (params?.offset != null) sp.set('offset', String(params.offset));
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export async function fetchStudentsApi(params?: AdminListParams | string) {
  // Back-compat: bare string still treated as search
  const p = typeof params === 'string' ? { search: params } : params;
  return apiClient(`/admin/students${listQuery(p)}`);
}

export async function createStudentApi(payload: {
  firstName: string;
  lastName: string;
  email: string;
  rollNoOrUSN?: string;
  phone?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  password?: string;
  dob?: string;
  gender?: string;
  admissionNo?: string;
  admissionDate?: string;
  sessionId?: string;
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
  dob?: string;
  gender?: string;
  admissionNo?: string;
  admissionDate?: string;
  sessionId?: string;
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

export async function fetchTeachersApi(params?: AdminListParams) {
  return apiClient(`/admin/teachers${listQuery(params)}`);
}

export interface TeacherAcademicAssignment {
  /** School: class/section triple matching class_sections rows */
  classSection?: { department: string; academicYear: string; section: string };
  /** College: program + semester */
  program?: string;
  semester?: string;
}

export async function createTeacherApi(payload: {
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  department?: string;
  password?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  designation?: string;
  employmentType?: string;
  joiningDate?: string;
} & TeacherAcademicAssignment) {
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
  phone?: string;
  dob?: string;
  gender?: string;
  designation?: string;
  employmentType?: string;
  joiningDate?: string;
} & TeacherAcademicAssignment) {
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

export async function fetchUsersApi(params?: AdminListParams) {
  return apiClient(`/admin/users${listQuery(params)}`);
}

export async function createUserApi(payload: {
  fullName: string;
  email: string;
  role: string;
  roles?: string[];
  phone?: string;
  parentPhone?: string;
  employeeId?: string;
  rollNoOrUSN?: string;
  department?: string;
  academicYear?: string;
  section?: string;
  title?: string;
  password?: string;
  address?: string;
  city?: string;
  pincode?: string;
  alternatePhone?: string;
  occupation?: string;
  emergencyContact?: string;
  preferredLanguage?: string;
  relation?: string;
  children?: { studentId: string; relationship?: string; permissions?: string[] }[];
  notificationPrefs?: { pushEnabled?: boolean; disabledTypes?: string[] };
  /** admission_officer only — quota category (name + intake) + assigned fee structures */
  categoryName?: string;
  seats?: number;
  feeStructureIds?: string[];
}) {
  return apiClient('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUserApi(
  id: string,
  payload: {
    fullName?: string;
    role?: string;
    roles?: string[];
    phone?: string;
    parentPhone?: string;
    employeeId?: string;
    rollNoOrUSN?: string;
    department?: string;
    title?: string;
  }
) {
  return apiClient(`/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function resetUserPasswordApi(id: string, password?: string) {
  return apiClient(`/admin/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(password ? { password } : {}),
  });
}

// Fee Management APIs
export async function fetchFeesApi() {
  return apiClient('/admin/fees');
}

export async function createFeeApi(payload: {
  classSectionId?: string;
  title: string;
  category?: string;
  amount: number;
  term?: string;
  academicYear?: string;
  dueDate?: string;
  status?: string;
}) {
  return apiClient('/admin/fees', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFeeApi(id: string, payload: Record<string, any>) {
  return apiClient(`/admin/fees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteFeeApi(id: string) {
  return apiClient(`/admin/fees/${id}`, { method: 'DELETE' });
}

export async function fetchFeePaymentsApi() {
  return apiClient('/admin/fee-payments');
}

export async function createFeePaymentApi(payload: {
  feeStructureId: string;
  studentId: string;
  amount: number;
  paymentMethod?: string;
  paymentDate?: string;
  status?: string;
  notes?: string;
}) {
  return apiClient('/admin/fee-payments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateFeePaymentApi(id: string, payload: Record<string, any>) {
  return apiClient(`/admin/fee-payments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteFeePaymentApi(id: string) {
  return apiClient(`/admin/fee-payments/${id}`, { method: 'DELETE' });
}

// Expense Management (accountant disbursements)
export interface CreateExpensePayload {
  title: string;
  category: string;
  payeeName: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  vehicleNo?: string;
  amount: number;
  paymentMethod?: string;
  paymentDate?: string;
  status?: string;
  notes?: string;
}

export async function fetchExpensesApi() {
  return apiClient('/admin/expenses');
}

export async function createExpenseApi(payload: CreateExpensePayload) {
  return apiClient('/admin/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExpenseApi(id: string, payload: Record<string, any>) {
  return apiClient(`/admin/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteExpenseApi(id: string) {
  return apiClient(`/admin/expenses/${id}`, { method: 'DELETE' });
}
