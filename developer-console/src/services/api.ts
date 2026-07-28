import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

async function getAuthToken(): Promise<string> {
  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      return await currentUser.getIdToken();
    } catch (err) {
      console.warn('[Developer Console] Could not retrieve ID token:', err);
    }
  }
  return 'mock_dev_token';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.error?.message || json.message || 'API Request failed');
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

export interface AdminPayload {
  fullName: string;
  email: string;
  phone?: string;
  institutionCode: string;
  password?: string;
  title?: string;
  scope?: {
    departments?: string[];
    academicYears?: string[];
  };
  permissions?: string[];
}

export const developerApi = {
  getStats: () => request('/developer/stats'),
  getInstitutions: () => request('/developer/institutions'),
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

  getAdmins: () => request('/developer/admins'),
  createAdmin: (data: AdminPayload) =>
    request('/developer/admins', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteAdmin: (id: string) =>
    request(`/developer/admins/${id}`, {
      method: 'DELETE',
    }),
};
