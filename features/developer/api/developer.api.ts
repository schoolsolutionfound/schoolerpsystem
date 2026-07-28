import { apiClient } from '../../../api/client';
import { Institution, CreateInstitutionInput, UpdateInstitutionInput } from '../types/developer.types';

export interface FetchInstitutionsParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: string;
}

export async function fetchInstitutionsApi(params?: FetchInstitutionsParams): Promise<Institution[]> {
  const queryParts: string[] = [];
  if (params?.page) queryParts.push(`page=${params.page}`);
  if (params?.limit) queryParts.push(`limit=${params.limit}`);
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.filter) queryParts.push(`filter=${encodeURIComponent(params.filter)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  return apiClient<Institution[]>(`/developer/institutions${queryString}`, {
    method: 'GET',
  });
}

export async function fetchInstitutionByIdApi(id: string): Promise<Institution> {
  return apiClient<Institution>(`/developer/institutions/${id}`, {
    method: 'GET',
  });
}

export async function createInstitutionApi(payload: CreateInstitutionInput): Promise<Institution> {
  return apiClient<Institution>('/developer/institutions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateInstitutionApi(
  id: string,
  payload: UpdateInstitutionInput
): Promise<Institution> {
  return apiClient<Institution>(`/developer/institutions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteInstitutionApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/developer/institutions/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchDeveloperStatsApi(): Promise<any> {
  return apiClient('/developer/stats', {
    method: 'GET',
  });
}

export async function fetchAdminsApi(): Promise<any[]> {
  return apiClient('/developer/admins', {
    method: 'GET',
  });
}

export async function createAdminApi(payload: any): Promise<any> {
  return apiClient('/developer/admins', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminApi(id: string, payload: any): Promise<any> {
  return apiClient(`/developer/admins/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/developer/admins/${id}`, {
    method: 'DELETE',
  });
}
