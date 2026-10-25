import { apiClient } from './client';

export interface QuotaItem {
  quotaName: string;
  seats: number;
}

export interface QuotaSummary {
  quotaName: string;
  total: number;
  allocated: number;
  confirmed: number;
  available: number;
}

export interface AdmissionCourse {
  id: string;
  institutionCode: string;
  academicYear: string;
  courseCode: string;
  courseName: string;
  programType: 'school' | 'pu' | 'engineering' | 'degree';
  totalSeats: number;
  quotas: QuotaItem[];
  allocatedSeats: number;
  confirmedSeats: number;
  availableSeats: number;
  quotaSummaries: QuotaSummary[];
  createdAt: string;
}

export interface AdmissionApplication {
  id: string;
  institutionCode: string;
  academicYear: string;
  applicationNumber: string;
  fullName: string;
  parentPhone: string;
  dob: string;
  fatherName: string;
  motherName: string;
  guardianPhone: string;
  address: string;
  bloodGroup: string;
  programType: string;
  preferredCourseId: string | null;
  preferredCourseName: string;
  status: 'waiting_list' | 'allocated' | 'confirmed' | 'cancelled';
  allocatedCourseId: string | null;
  allocatedCourseName: string;
  allocatedQuota: string;
  allocatedAt: string | null;
  confirmedAt: string | null;
  notes: string;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionStats {
  totalSeats: number;
  allocatedSeats: number;
  confirmedSeats: number;
  availableSeats: number;
  waitingListCount: number;
  cancelledCount: number;
  totalApplications: number;
  batches: string[];
}

export interface AdmissionFormField {
  id: string;
  institutionCode: string;
  programType: string;
  fieldKey: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'textarea';
  options: string[];
  placeholder: string;
  isRequired: boolean;
  order: number;
  isActive: boolean;
}

// --- API Client Methods ---

export async function getAdmissionStats(academicYear?: string): Promise<AdmissionStats> {
  const query = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
  const res = await apiClient<{ success: boolean; stats: AdmissionStats }>(`/admission/stats${query}`);
  return res.stats;
}

export async function getAdmissionCourses(academicYear?: string): Promise<AdmissionCourse[]> {
  const query = academicYear ? `?academicYear=${encodeURIComponent(academicYear)}` : '';
  const res = await apiClient<{ success: boolean; courses: AdmissionCourse[] }>(`/admission/courses${query}`);
  return res.courses || [];
}

export async function createAdmissionCourse(data: {
  academicYear: string;
  courseCode: string;
  courseName: string;
  programType?: string;
  totalSeats: number;
  quotas: QuotaItem[];
}): Promise<AdmissionCourse> {
  const res = await apiClient<{ success: boolean; course: AdmissionCourse }>('/admission/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.course;
}

export async function updateAdmissionCourse(
  id: string,
  data: Partial<{
    courseName: string;
    programType: string;
    totalSeats: number;
    quotas: QuotaItem[];
  }>
): Promise<AdmissionCourse> {
  const res = await apiClient<{ success: boolean; course: AdmissionCourse }>(`/admission/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.course;
}

export async function deleteAdmissionCourse(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient(`/admission/courses/${id}`, { method: 'DELETE' });
}

export async function getAdmissionApplications(filters: {
  academicYear?: string;
  status?: string;
  branchId?: string;
  quota?: string;
  search?: string;
}): Promise<AdmissionApplication[]> {
  const params = new URLSearchParams();
  if (filters.academicYear && filters.academicYear !== 'all') params.append('academicYear', filters.academicYear);
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.branchId && filters.branchId !== 'all') params.append('branchId', filters.branchId);
  if (filters.quota && filters.quota !== 'all') params.append('quota', filters.quota);
  if (filters.search) params.append('search', filters.search);

  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await apiClient<{ success: boolean; applications: AdmissionApplication[] }>(`/admission/applications${query}`);
  return res.applications || [];
}

export async function getAdmissionApplicationById(id: string): Promise<AdmissionApplication> {
  const res = await apiClient<{ success: boolean; application: AdmissionApplication }>(`/admission/applications/${id}`);
  return res.application;
}

export async function createAdmissionApplication(data: {
  academicYear: string;
  fullName: string;
  parentPhone: string;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  guardianPhone?: string;
  address?: string;
  bloodGroup?: string;
  programType?: string;
  preferredCourseId?: string | null;
  preferredCourseName?: string;
  notes?: string;
  customFields?: Record<string, any>;
}): Promise<AdmissionApplication> {
  const res = await apiClient<{ success: boolean; application: AdmissionApplication }>('/admission/applications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.application;
}

export async function updateAdmissionApplication(
  id: string,
  data: Partial<AdmissionApplication>
): Promise<AdmissionApplication> {
  const res = await apiClient<{ success: boolean; application: AdmissionApplication }>(`/admission/applications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.application;
}

export async function allocateAdmissionSeat(
  id: string,
  data: { courseId: string; quota: string; notes?: string }
): Promise<{ success: boolean; application: AdmissionApplication; message: string }> {
  return apiClient(`/admission/applications/${id}/allocate`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function unallocateAdmissionSeat(
  id: string,
  notes?: string
): Promise<{ success: boolean; application: AdmissionApplication; message: string }> {
  return apiClient(`/admission/applications/${id}/unallocate`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function confirmAdmissionSeat(
  id: string,
  notes?: string
): Promise<{ success: boolean; application: AdmissionApplication; message: string }> {
  return apiClient(`/admission/applications/${id}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function cancelAdmissionApplication(
  id: string,
  notes?: string
): Promise<{ success: boolean; application: AdmissionApplication; message: string }> {
  return apiClient(`/admission/applications/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export async function getAdmissionFormConfigs(programType?: string): Promise<AdmissionFormField[]> {
  const query = programType ? `?programType=${encodeURIComponent(programType)}` : '';
  const res = await apiClient<{ success: boolean; configs: AdmissionFormField[] }>(`/admission/form-config${query}`);
  return res.configs || [];
}
