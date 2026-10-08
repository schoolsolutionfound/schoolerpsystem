import { apiClient } from '../../../api/client';
import { Institution, CreateInstitutionInput, UpdateInstitutionInput } from '../types/developer.types';

export interface FetchInstitutionsParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: string;
  type?: string;
  status?: string;
  sort?: string;
}

/** Paginated response envelope returned by GET /developer/institutions when any query param is present. */
export interface PaginatedInstitutions {
  data: Institution[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchInstitutionsApi(params?: FetchInstitutionsParams): Promise<Institution[]> {
  const queryParts: string[] = [];
  if (params?.page) queryParts.push(`page=${params.page}`);
  if (params?.limit) queryParts.push(`limit=${params.limit}`);
  if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.filter) queryParts.push(`filter=${encodeURIComponent(params.filter)}`);
  if (params?.type) queryParts.push(`type=${encodeURIComponent(params.type)}`);
  if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  if (params?.sort) queryParts.push(`sort=${encodeURIComponent(params.sort)}`);

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const res = await apiClient<Institution[] | PaginatedInstitutions>(`/developer/institutions${queryString}`, {
    method: 'GET',
  });
  // Dual response shape: no query params -> plain array (legacy contract);
  // any query param -> { data, total, limit, offset }.
  return Array.isArray(res) ? res : (res?.data ?? []);
}

/**
 * One page of the institution list with server-side search/filter.
 * Used by the paginated list screens (infinite scroll).
 */
export async function fetchInstitutionsPageApi(params: {
  page: number;
  limit: number;
  search?: string;
  type?: string;
  status?: string;
}): Promise<PaginatedInstitutions> {
  const queryParts = [`page=${params.page}`, `limit=${params.limit}`];
  if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.type) queryParts.push(`type=${encodeURIComponent(params.type)}`);
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
  return apiClient<PaginatedInstitutions>(`/developer/institutions?${queryParts.join('&')}`, {
    method: 'GET',
  });
}

/**
 * Server-side typeahead search for pickers that must not fetch the full
 * institution list. Always sends `limit` so the paginated envelope comes back.
 */
export async function searchInstitutionsApi(search: string, limit = 50): Promise<PaginatedInstitutions> {
  const queryParts = [`limit=${limit}`];
  if (search) queryParts.push(`search=${encodeURIComponent(search)}`);
  return apiClient<PaginatedInstitutions>(`/developer/institutions?${queryParts.join('&')}`, {
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
  const res = await apiClient<any>('/developer/admins', {
    method: 'GET',
  });
  return Array.isArray(res) ? res : (res?.data || []);
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
