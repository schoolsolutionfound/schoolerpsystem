import { apiClient } from './client';

export interface CompleteProfilePayload {
  studentPhone?: string;
  parentPhone: string;
  profilePicUrl?: string;
  institutionType: 'school' | 'college';
  tenthPercentage?: string;
  twelfthPercentage?: string;
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
