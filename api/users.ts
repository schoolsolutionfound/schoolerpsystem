import { apiClient } from './client';
import type { ProfileFormField, CustomFieldValues } from '../features/shared/formFields/types';

export interface CompleteProfilePayload {
  phone?: string;
  parentPhone?: string;
  profilePicUrl?: string;
  institutionType?: 'school' | 'college';
  address?: string;
  city?: string;
  pincode?: string;
  guardianName?: string;
  guardianRelation?: string;
  guardianEmail?: string;
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
  /** Settings → Form Fields values, keyed by field id. */
  customFields?: CustomFieldValues;
}

export async function getProfileApi() {
  return apiClient('/users/me', {
    method: 'GET',
  });
}

/** Settings → Form Fields config for the calling user's role. */
export async function getMyProfileFieldsApi() {
  return apiClient<ProfileFormField[]>('/users/profile-fields', {
    method: 'GET',
  });
}

export async function completeProfileApi(payload: CompleteProfilePayload) {
  return apiClient('/users/complete-profile', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Self-service profile edit (safe fields only — server rejects role/institution changes). */
export async function updateMyProfileApi(payload: {
  fullName?: string;
  phone?: string;
  designation?: string;
  profilePicUrl?: string;
  address?: string;
  city?: string;
  pincode?: string;
  emergencyContact?: string;
  qualification?: string;
  experience?: string;
  customFields?: CustomFieldValues;
}) {
  return apiClient('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
