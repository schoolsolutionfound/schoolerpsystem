import { apiClient } from './client';
import { SingleFeedInput } from '../schemas/feed.schema';

export async function singleFeedApi(payload: SingleFeedInput) {
  return apiClient('/admin/single-feed', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function bulkFeedApi(records: SingleFeedInput[]) {
  return apiClient('/admin/bulk-feed', {
    method: 'POST',
    body: JSON.stringify({ records }),
  });
}

export async function fetchInstitutionConfigApi() {
  return apiClient('/admin/institution-config');
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
