import { apiClient } from './client';
import { Institution } from '../features/developer/types/developer.types';

interface PublicInstitutionRow {
  institutionCode: string;
  institutionName: string;
  institutionType: 'school' | 'college';
  description?: string;
  logoUrl?: string;
  facilities?: string[];
  departments?: string[];
  academicYears?: string[];
  averageRating?: number;
  totalReviews?: number;
}

function toInstitution(row: PublicInstitutionRow): Institution {
  return {
    id: row.institutionCode,
    institutionCode: row.institutionCode,
    institutionName: row.institutionName,
    institutionType: row.institutionType,
    subscriptionStatus: 'active',
    description: row.description,
    logoUrl: row.logoUrl,
    facilities: row.facilities,
    departments: row.departments,
    academicYears: row.academicYears,
    averageRating: row.averageRating,
    totalReviews: row.totalReviews,
  };
}

/**
 * Parent-facing directory. Served by the authentication server
 * (`GET /admissions/public-institutions`), not the developer portal.
 */
export async function fetchInstitutionsApi(type?: 'school' | 'college'): Promise<Institution[]> {
  const qs = type ? `?type=${type}` : '';
  const res = await apiClient<PublicInstitutionRow[]>(`/admissions/public-institutions${qs}`);
  return Array.isArray(res) ? res.map(toInstitution) : [];
}

export async function fetchInstitutionByIdApi(institutionCode: string): Promise<Institution> {
  const data = await apiClient<PublicInstitutionRow>(
    `/admissions/public-institutions/${encodeURIComponent(institutionCode)}`
  );
  return toInstitution(data);
}
