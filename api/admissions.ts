import { apiClient } from './client';
import { AdmissionApplication } from '../features/parent/types/parent.types';

export interface ExtendedAdmissionApplication extends AdmissionApplication {
  schoolName?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

export interface CreateAdmissionInput {
  schoolId: string;
  childFullName: string;
  childAge: number;
  childGender: 'male' | 'female' | 'other';
  previousSchool?: string;
  gradeApplyingFor: string;
  parentId?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
}

export async function fetchAdmissionsApi(params?: {
  parentId?: string;
  schoolId?: string;
}): Promise<ExtendedAdmissionApplication[]> {
  const query = new URLSearchParams();
  if (params?.parentId) query.set('parentId', params.parentId);
  if (params?.schoolId) query.set('schoolId', params.schoolId);

  const qs = query.toString();
  const data = await apiClient<ExtendedAdmissionApplication[]>(
    `/admissions${qs ? `?${qs}` : ''}`
  );
  return data || [];
}

export async function createAdmissionApi(
  payload: CreateAdmissionInput
): Promise<ExtendedAdmissionApplication> {
  const data = await apiClient<ExtendedAdmissionApplication>('/admissions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data;
}

export interface UpdateAdmissionStatusOptions {
  status: 'accepted' | 'rejected' | 'pending' | 'test_scheduled';
  entranceTestDate?: string | null;
  entranceTestVenue?: string;
  entranceTestInstructions?: string;
}

export async function updateAdmissionStatusApi(
  id: string,
  statusOrOptions: 'accepted' | 'rejected' | 'pending' | 'test_scheduled' | UpdateAdmissionStatusOptions
): Promise<ExtendedAdmissionApplication> {
  const payload = typeof statusOrOptions === 'string' ? { status: statusOrOptions } : statusOrOptions;
  const data = await apiClient<ExtendedAdmissionApplication>(
    `/admissions/${id}/status`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }
  );
  return data;
}
