import { apiClient } from './client';
import { Institution } from '../features/developer/types/developer.types';

export async function fetchInstitutionsApi(): Promise<Institution[]> {
  const data = await apiClient<Institution[]>('/institutions');
  return data || [];
}

export async function fetchInstitutionByIdApi(id: string): Promise<Institution> {
  const data = await apiClient<Institution>(`/institutions/${id}`);
  return data;
}
