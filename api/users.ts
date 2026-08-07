import { apiClient } from './client';

export interface CompleteProfilePayload {
  phone?: string;
  parentPhone?: string;
  profilePicUrl?: string;
  institutionType?: 'school' | 'college';
  tenthPercentage?: string;
  twelfthPercentage?: string;
  employeeId?: string;
  department?: string;
  linkedStudentUSN?: string;
  relation?: string;
  qualification?: string;
  experience?: string;
  libraryBadgeId?: string;
  designation?: string;
}

export async function getProfileApi() {
  return apiClient('/users/me', {
    method: 'GET',
  });
}

export async function completeProfileApi(payload: CompleteProfilePayload) {
  return apiClient('/users/complete-profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
