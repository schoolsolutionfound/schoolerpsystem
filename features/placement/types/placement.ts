/**
 * @file placement.ts
 * @description Data models and types for the Complete Placement & Career Management module.
 */

export type JobType = 'Full-Time' | 'Internship' | 'PPO';

export type DriveStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type ApplicationStatus =
  | 'applied'
  | 'shortlisted'
  | 'interview_scheduled'
  | 'offered'
  | 'rejected';

export interface JobDrive {
  id: string;
  companyName: string;
  companyLogo?: string;
  roleTitle: string;
  jobType: JobType;
  packageCTC: string; // e.g. "18.5 LPA"
  packageLPA: number; // e.g. 18.5
  location: string;
  minPercentage: number; // e.g. 70 (%) or 7.0 (CGPA)
  allowedBranches: string[]; // e.g. ["Computer Science", "Information Tech", "Electronics"]
  maxBacklogs: number; // e.g. 0
  driveDate: string; // "YYYY-MM-DD"
  applicationDeadline: string; // "YYYY-MM-DD"
  rounds: string[]; // e.g. ["Online Assessment", "Technical Interview 1", "HR Interview"]
  status: DriveStatus;
  vacancies: number;
  description: string;
  selectionProcess?: string;
  bondPeriodMonths?: number;
}

export interface CandidateApplication {
  id: string;
  driveId: string;
  companyName: string;
  roleTitle: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  branch: string; // e.g. "Class 12-A" / "Computer Science"
  percentage: number;
  appliedDate: string; // "YYYY-MM-DD"
  currentRound: string; // e.g. "Technical Interview 1"
  status: ApplicationStatus;
  interviewSlot?: string; // e.g. "10 Sep 2026, 11:30 AM (Google Meet)"
  offerCTC?: string;
  notes?: string;
}

export type CompanyTier = 'Tier 1' | 'Tier 2' | 'Startup' | 'MNC';

export interface CompanyPartner {
  id: string;
  name: string;
  industry: string;
  website: string;
  hrContactName: string;
  hrEmail: string;
  hrPhone: string;
  tier: CompanyTier;
  pastHiresCount: number;
  activeDrivesCount: number;
  averageCTCLPA: number;
}

export interface PlacementOffer {
  id: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  branch: string;
  companyName: string;
  roleTitle: string;
  packageCTC: string;
  packageLPA: number;
  offerDate: string;
  joiningDate: string;
  status: 'accepted' | 'declined' | 'pending';
  offerLetterNo: string;
}
