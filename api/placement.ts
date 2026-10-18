import { apiClient } from './client';

// Types
export interface PlacementProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  photoUrl: string;
  resumeUrl: string;
  cgpa: number | null;
  tenthPercent: number | null;
  twelfthOrDiplomaPercent: number | null;
  activeBacklogs: number;
  portfolioUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  leetcodeUrl: string;
  otherLinks: { name: string; url: string }[];
  branch: string;
  year: string;
}

export interface PlacementDrive {
  id: string;
  companyName: string;
  logoUrl: string;
  bannerUrl: string;
  title: string;
  description: string;
  jobType: 'full_time' | 'internship' | 'part_time';
  ctcOrStipend: string;
  location: string;
  rounds: { name: string; description: string }[];
  allowedBranches: string[];
  allowedYears: string[];
  minCgpa: number | null;
  maxBacklogs: number | null;
  applyDeadline: string;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  
  // Appended dynamically for students
  eligible?: boolean;
  ineligibilityReason?: string | null;
}

export interface DriveApplication {
  id: string;
  driveId: string;
  studentId: string;
  status: 'applied' | 'withdrawn' | 'shortlisted' | 'rejected' | 'hired';
  currentRoundIndex: number;
  resumeUrl: string;
  appliedAt: string;
  
  // Appended for staff
  profileSnapshot?: any;
  student?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    profilePicUrl: string;
    tenthPercentage: string;
    twelfthPercentage: string;
    branch?: string;
    year?: string;
    cgpa?: number | null;
    activeBacklogs?: number;
    portfolioUrl?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    leetcodeUrl?: string;
    otherLinks?: { name: string; url: string }[];
  };
}

// Student Profile API
export async function getPlacementProfile(): Promise<PlacementProfile> {
  const res = await apiClient<{ profile: PlacementProfile }>('/placement/profile');
  return (res as any).profile;
}

export async function updatePlacementProfile(data: Partial<PlacementProfile>): Promise<PlacementProfile> {
  const res = await apiClient<{ profile: PlacementProfile }>('/placement/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return (res as any).profile;
}

// Student Drives & Applications API
export async function listDrives(): Promise<PlacementDrive[]> {
  const res = await apiClient<{ drives: PlacementDrive[] }>('/placement/drives');
  return (res as any).drives;
}

export async function getStudentApplications(): Promise<DriveApplication[]> {
  const res = await apiClient<{ applications: DriveApplication[] }>('/placement/applications');
  return (res as any).applications;
}

export async function applyForDrive(driveId: string, resumeUrl?: string): Promise<DriveApplication> {
  const res = await apiClient<{ application: DriveApplication }>(`/placement/drives/${driveId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ resumeUrl }),
  });
  return (res as any).application;
}

export async function withdrawApplication(driveId: string): Promise<DriveApplication> {
  const res = await apiClient<{ application: DriveApplication }>(`/placement/drives/${driveId}/withdraw`, {
    method: 'POST',
  });
  return (res as any).application;
}

// STAFF API
export async function createDrive(data: Partial<PlacementDrive>): Promise<PlacementDrive> {
  const res = await apiClient<{ drive: PlacementDrive }>('/placement/drives', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return (res as any).drive;
}

export async function updateDrive(driveId: string, data: Partial<PlacementDrive>): Promise<PlacementDrive> {
  const res = await apiClient<{ drive: PlacementDrive }>(`/placement/drives/${driveId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return (res as any).drive;
}

export async function getDriveApplicationsForStaff(driveId: string): Promise<DriveApplication[]> {
  const res = await apiClient<{ applications: DriveApplication[] }>(`/placement/drives/${driveId}/applications`);
  return (res as any).applications;
}

export async function updateApplicationStatusForStaff(driveId: string, applicationId: string, status: string, currentRoundIndex?: number): Promise<DriveApplication> {
  const res = await apiClient<{ application: DriveApplication }>(`/placement/drives/${driveId}/applications/${applicationId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, currentRoundIndex }),
  });
  return (res as any).application;
}

// TEAM / MEMBER API
export async function listPlacementMembers(): Promise<any[]> {
  const res = await apiClient<{ members: any[] }>('/placement/members');
  return (res as any).members;
}

export async function searchEligibleMembers(): Promise<any[]> {
  const res = await apiClient<{ users: any[] }>('/placement/members/search');
  return (res as any).users;
}

export async function assignPlacementMember(data: { userId: string; accessLevel: string }): Promise<void> {
  await apiClient('/placement/members/assign', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface PlacementStudent {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  rollNoOrUSN: string;
  profilePic?: string;
  branch: string;
  academicYear: string;
  cgpa: number | null;
  tenthPercent: number | null;
  twelfthPercent: number | null;
  activeBacklogs: number;
  resumeUrl: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  leetcodeUrl?: string;
}

export interface PlacementStats {
  totalDrives: number;
  activeDrives: number;
  closedDrives: number;
  draftDrives: number;
  totalApplications: number;
  hiredCount: number;
  shortlistedCount: number;
  totalMembers: number;
  totalStudents: number;
}

export async function listPlacementStudents(): Promise<PlacementStudent[]> {
  const res = await apiClient<{ students: PlacementStudent[] }>('/placement/students');
  return (res as any).students;
}

export async function getPlacementStats(): Promise<PlacementStats> {
  const res = await apiClient<{ stats: PlacementStats }>('/placement/stats');
  return (res as any).stats;
}

