import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

async function getAuthToken(forceRefresh = false): Promise<string> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      return await currentUser.getIdToken(forceRefresh);
    } catch (err) {
      console.warn('[Developer Console] Could not retrieve ID token:', err);
    }
  }
  throw new Error('Not authenticated. Please sign in again.');
}

async function request<T>(endpoint: string, options: RequestInit = {}, retried = false): Promise<T> {
  const token = await getAuthToken(retried);
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // ID token may have expired mid-session — force a refresh and retry once.
  if (response.status === 401 && !retried) {
    return request<T>(endpoint, options, true);
  }

  let json: any = {};
  try {
    json = await response.json();
  } catch {
    // Non-JSON response (proxy/CDN error page, etc.)
  }
  if (!response.ok || json.success === false) {
    throw new Error(json.error?.message || json.message || `API Request failed (${response.status})`);
  }

  return json.data ?? json;
}

export interface InstitutionPayload {
  institutionName: string;
  institutionCode: string;
  institutionType: 'school' | 'college';
  subscriptionStatus?: string;
  departments?: string[];
  academicYears?: string[];
  courses?: string[];
}

export interface InstitutionListParams {
  search?: string;
  type?: 'school' | 'college';
  status?: 'active' | 'trial' | 'inactive' | 'suspended';
  sort?: 'newest' | 'oldest' | 'name_asc' | 'name_desc';
  limit?: number;
  offset?: number;
}

export interface InstitutionListResult {
  data: any[];
  total: number;
  limit: number;
  offset: number;
}

export interface ImportInstitutionsResult {
  total: number;
  processed: number;
  imported: number;
  skipped: number;
  truncated: boolean;
  errors: { row: number; message: string }[];
}

export interface AuditEvent {
  id: string;
  actorEmail: string;
  action: string;
  targetType: 'institution' | 'admin' | 'platform';
  targetId?: string;
  targetLabel?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface AuditEventPage {
  data: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

export interface InstitutionPeopleStats {
  institutionCode: string;
  institutionName: string;
  students: number;
  teachers: number;
  admins: number;
  principals: number;
  classSections: number;
  subjects: number;
}

export interface AdminPayload {
  fullName: string;
  email: string;
  phone?: string;
  institutionCode: string;
  password?: string;
  role?: string;
  title?: string;
  scope?: {
    departments?: string[];
    academicYears?: string[];
  };
  permissions?: string[];
}

export const developerApi = {
  logout: () => request('/auth/logout', { method: 'POST', body: '{}' }),
  getStats: () => request('/developer/stats'),
  getInstitutions: (params?: InstitutionListParams) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.type) qs.set('type', params.type);
    if (params?.status) qs.set('status', params.status);
    if (params?.sort) qs.set('sort', params.sort);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset !== undefined) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return request<InstitutionListResult>(`/developer/institutions${query ? `?${query}` : ''}`);
  },
  getInstitutionById: (id: string) => request(`/developer/institutions/${id}`),
  createInstitution: (data: InstitutionPayload) =>
    request('/developer/institutions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateInstitution: (id: string, data: Partial<InstitutionPayload>) =>
    request(`/developer/institutions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteInstitution: (id: string) =>
    request(`/developer/institutions/${id}`, {
      method: 'DELETE',
    }),
  getInstitutionStats: (id: string) =>
    request<InstitutionPeopleStats>(`/developer/institutions/${id}/stats`),
  importInstitutions: (csv: string) =>
    request<ImportInstitutionsResult>('/developer/institutions/import', {
      method: 'POST',
      body: JSON.stringify({ csv }),
    }),
  exportInstitutions: async (params?: Pick<InstitutionListParams, 'search' | 'type' | 'status'>): Promise<Blob> => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.type) qs.set('type', params.type);
    if (params?.status) qs.set('status', params.status);
    const query = qs.toString();
    const token = await getAuthToken();
    const response = await fetch(`${BASE_URL}/developer/institutions/export${query ? `?${query}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      let message = `Export failed (${response.status})`;
      try {
        const json = await response.json();
        message = json.error?.message || message;
      } catch {
        // non-JSON error page
      }
      throw new Error(message);
    }
    return response.blob();
  },
  getAuditEvents: (params?: { action?: string; targetType?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.targetType) qs.set('targetType', params.targetType);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset !== undefined) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return request<AuditEventPage>(`/developer/audit${query ? `?${query}` : ''}`);
  },

  getAdmins: (params?: { institutionCode?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.institutionCode) qs.set('institutionCode', params.institutionCode);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.offset !== undefined) qs.set('offset', String(params.offset));
    const query = qs.toString();
    return request<{ data: any[]; total: number; limit: number; offset: number }>(
      `/developer/admins${query ? `?${query}` : ''}`
    );
  },
  createAdmin: (data: AdminPayload) =>
    request('/developer/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAdmin: (id: string, data: Partial<AdminPayload>) =>
    request(`/developer/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAdmin: (id: string) =>
    request(`/developer/admins/${id}`, {
      method: 'DELETE',
    }),
  resetAdminPassword: (id: string, password: string) =>
    request(`/developer/admins/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
};
