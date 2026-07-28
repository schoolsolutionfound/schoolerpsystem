export interface Institution {
  id: string;
  institutionCode: string;
  institutionName: string;
  institutionType: 'school' | 'college';
  subscriptionStatus: 'active' | 'inactive' | 'suspended' | 'trial';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateInstitutionInput {
  institutionCode: string;
  institutionName: string;
  institutionType: 'school' | 'college';
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'trial';
}

export interface UpdateInstitutionInput {
  institutionName?: string;
  institutionType?: 'school' | 'college';
  subscriptionStatus?: 'active' | 'inactive' | 'suspended' | 'trial';
}

export type FilterType = 'all' | 'college' | 'school' | 'active' | 'inactive';

export interface AdminScope {
  departments?: string[];
  academicYears?: string[];
}

export interface InstitutionAdmin {
  id: string;
  firebaseUid?: string;
  fullName: string;
  email: string;
  role: string;
  title: string;
  institutionCode: string;
  institutionName: string;
  institutionType: 'school' | 'college';
  status: 'active' | 'inactive' | 'suspended';
  scope: AdminScope;
  permissions: string[];
  createdAt?: string;
}

export interface CreateAdminInput {
  fullName: string;
  email: string;
  password?: string;
  institutionCode: string;
  title?: string;
  scope?: AdminScope;
  permissions?: string[];
}

export interface UpdateAdminInput {
  fullName?: string;
  email?: string;
  institutionCode?: string;
  title?: string;
  scope?: AdminScope;
  permissions?: string[];
  status?: string;
}

export interface DeveloperStats {
  totalInstitutions: number;
  activeInstitutions: number;
  institutionAdmins: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
}
