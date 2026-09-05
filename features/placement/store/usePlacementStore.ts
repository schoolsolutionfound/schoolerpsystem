/**
 * @file usePlacementStore.ts
 * @description Centralized Zustand state management for School / College Placement & Career Hub.
 *
 * Covers:
 *  - Corporate Recruitment Drives & Job Postings
 *  - Candidate Application Tracking Pipeline (Applied -> Shortlisted -> Interview -> Offered)
 *  - Recruiter & Company Partner CRM Directory
 *  - Official Placement Offers & Package Analytics
 */

import { create } from 'zustand';
import {
  JobDrive,
  CandidateApplication,
  CompanyPartner,
  PlacementOffer,
  ApplicationStatus,
  DriveStatus,
} from '../types/placement';

interface PlacementState {
  drives: JobDrive[];
  applications: CandidateApplication[];
  companies: CompanyPartner[];
  offers: PlacementOffer[];
  totalEligibleStudents: number;

  // Drive Actions
  addDrive: (driveData: Omit<JobDrive, 'id'>) => void;
  updateDrive: (id: string, updates: Partial<JobDrive>) => void;
  deleteDrive: (id: string) => void;
  setDriveStatus: (id: string, status: DriveStatus) => void;

  // Application Pipeline Actions
  applyForDrive: (params: {
    driveId: string;
    studentId: string;
    studentName: string;
    rollNo: string;
    branch: string;
    percentage: number;
  }) => CandidateApplication;

  updateApplicationStatus: (
    applicationId: string,
    updates: {
      status: ApplicationStatus;
      currentRound?: string;
      interviewSlot?: string;
      offerCTC?: string;
      notes?: string;
    }
  ) => void;

  scheduleInterview: (
    applicationId: string,
    interviewSlot: string,
    roundName: string
  ) => void;

  recordOffer: (offerData: Omit<PlacementOffer, 'id' | 'offerLetterNo'>) => void;

  // Recruiter Company Actions
  addCompany: (companyData: Omit<CompanyPartner, 'id'>) => void;
  updateCompany: (id: string, updates: Partial<CompanyPartner>) => void;

  // Analytics & Computed Metrics
  getHighestCTCLPA: () => number;
  getAverageCTCLPA: () => number;
  getTotalOffersCount: () => number;
  getPlacementRatePercentage: () => number;
  getActiveDrivesCount: () => number;
  getTotalApplicationsCount: () => number;
}

const INITIAL_DRIVES: JobDrive[] = [
  {
    id: 'drv-1',
    companyName: 'Google',
    roleTitle: 'Associate Software Engineer',
    jobType: 'Full-Time',
    packageCTC: '32.0 LPA',
    packageLPA: 32.0,
    location: 'Bangalore / Hyderabad',
    minPercentage: 75,
    allowedBranches: ['Computer Science', 'Information Tech', 'Electronics'],
    maxBacklogs: 0,
    driveDate: '2026-09-18',
    applicationDeadline: '2026-09-12',
    rounds: ['Online Coding Test', 'Technical Round 1', 'Technical Round 2', 'Googliness & Leadership'],
    status: 'ongoing',
    vacancies: 8,
    description: 'Design scalable distributed systems, algorithms, and next-generation cloud infra services.',
  },
  {
    id: 'drv-2',
    companyName: 'Microsoft',
    roleTitle: 'Cloud Solution Engineer',
    jobType: 'Full-Time',
    packageCTC: '28.5 LPA',
    packageLPA: 28.5,
    location: 'Noida / Hyderabad',
    minPercentage: 70,
    allowedBranches: ['Computer Science', 'Information Tech', 'Data Science'],
    maxBacklogs: 0,
    driveDate: '2026-09-22',
    applicationDeadline: '2026-09-15',
    rounds: ['Aptitude & Coding', 'System Design Interview', 'HR Discussion'],
    status: 'upcoming',
    vacancies: 12,
    description: 'Empower enterprise clients with Azure cloud architectures, AI integrations, and cybersecurity solutions.',
  },
  {
    id: 'drv-3',
    companyName: 'Deloitte',
    roleTitle: 'Technology Consulting Analyst',
    jobType: 'Full-Time',
    packageCTC: '12.5 LPA',
    packageLPA: 12.5,
    location: 'Gurugram / Mumbai',
    minPercentage: 65,
    allowedBranches: ['All Engineering & STEM Branches'],
    maxBacklogs: 1,
    driveDate: '2026-09-10',
    applicationDeadline: '2026-09-08',
    rounds: ['Online Aptitude Test', 'Case Study & Group Discussion', 'Partner Interview'],
    status: 'ongoing',
    vacancies: 25,
    description: 'Consult global Fortune 500 corporations on ERP digital transformation and enterprise analytics.',
  },
  {
    id: 'drv-4',
    companyName: 'Amazon',
    roleTitle: 'Graduate SDE-1',
    jobType: 'Full-Time',
    packageCTC: '44.0 LPA',
    packageLPA: 44.0,
    location: 'Bangalore',
    minPercentage: 75,
    allowedBranches: ['Computer Science', 'Information Tech'],
    maxBacklogs: 0,
    driveDate: '2026-08-25',
    applicationDeadline: '2026-08-20',
    rounds: ['Online Assessment', 'Live Coding 1', 'Live Coding 2', 'Bar Raiser'],
    status: 'completed',
    vacancies: 5,
    description: 'Core retail e-commerce platform and AWS distributed systems development.',
  },
  {
    id: 'drv-5',
    companyName: 'TCS Digital',
    roleTitle: 'Digital Systems Specialist',
    jobType: 'Full-Time',
    packageCTC: '9.0 LPA',
    packageLPA: 9.0,
    location: 'Pan India',
    minPercentage: 60,
    allowedBranches: ['All Streams'],
    maxBacklogs: 2,
    driveDate: '2026-09-28',
    applicationDeadline: '2026-09-20',
    rounds: ['TCS NQT Assessment', 'Technical Interview', 'HR Interview'],
    status: 'upcoming',
    vacancies: 40,
    description: 'High-growth technology practice focusing on cloud native microservices, IoT, and AI.',
  },
];

const INITIAL_APPLICATIONS: CandidateApplication[] = [
  {
    id: 'app-101',
    driveId: 'drv-1',
    companyName: 'Google',
    roleTitle: 'Associate Software Engineer',
    studentId: 'std-1082',
    studentName: 'Rohan Verma',
    rollNo: '14',
    branch: 'Computer Science',
    percentage: 91.8,
    appliedDate: '2026-09-01',
    currentRound: 'Technical Round 1',
    status: 'interview_scheduled',
    interviewSlot: '10 Sep 2026, 11:30 AM (Google Meet)',
    notes: 'Cleared Online Coding Test with 100% score.',
  },
  {
    id: 'app-102',
    driveId: 'drv-3',
    companyName: 'Deloitte',
    roleTitle: 'Technology Consulting Analyst',
    studentId: 'std-1082',
    studentName: 'Rohan Verma',
    rollNo: '14',
    branch: 'Computer Science',
    percentage: 91.8,
    appliedDate: '2026-09-02',
    currentRound: 'Online Aptitude Test',
    status: 'shortlisted',
    notes: 'Resume shortlisted by Deloitte campus talent team.',
  },
  {
    id: 'app-103',
    driveId: 'drv-4',
    companyName: 'Amazon',
    roleTitle: 'Graduate SDE-1',
    studentId: 'std-1045',
    studentName: 'Kabir Mehta',
    rollNo: '22',
    branch: 'Computer Science',
    percentage: 88.5,
    appliedDate: '2026-08-21',
    currentRound: 'Offer Extended',
    status: 'offered',
    offerCTC: '44.0 LPA',
    notes: 'Cleared Bar Raiser round. Official offer letter dispatched.',
  },
  {
    id: 'app-104',
    driveId: 'drv-2',
    companyName: 'Microsoft',
    roleTitle: 'Cloud Solution Engineer',
    studentId: 'std-1094',
    studentName: 'Ananya Deshmukh',
    rollNo: '08',
    branch: 'Information Tech',
    percentage: 86.4,
    appliedDate: '2026-09-03',
    currentRound: 'Application Review',
    status: 'applied',
  },
  {
    id: 'app-105',
    driveId: 'drv-4',
    companyName: 'Amazon',
    roleTitle: 'Graduate SDE-1',
    studentId: 'std-1102',
    studentName: 'Pooja Hegde',
    rollNo: '31',
    branch: 'Electronics',
    percentage: 82.0,
    appliedDate: '2026-08-21',
    currentRound: 'Live Coding 2',
    status: 'rejected',
    notes: 'Feedback: Recommended for re-evaluation in Spring batch.',
  },
];

const INITIAL_COMPANIES: CompanyPartner[] = [
  {
    id: 'cmp-1',
    name: 'Google',
    industry: 'Technology / Internet',
    website: 'https://careers.google.com',
    hrContactName: 'Ms. Shalini Gupta',
    hrEmail: 'shalini.gupta@google.com',
    hrPhone: '+91 98112 00101',
    tier: 'Tier 1',
    pastHiresCount: 18,
    activeDrivesCount: 1,
    averageCTCLPA: 32.0,
  },
  {
    id: 'cmp-2',
    name: 'Microsoft',
    industry: 'Enterprise Software & Cloud',
    website: 'https://careers.microsoft.com',
    hrContactName: 'Mr. Arvind Saxena',
    hrEmail: 'arvind.saxena@microsoft.com',
    hrPhone: '+91 98223 00202',
    tier: 'Tier 1',
    pastHiresCount: 24,
    activeDrivesCount: 1,
    averageCTCLPA: 28.5,
  },
  {
    id: 'cmp-3',
    name: 'Amazon',
    industry: 'E-Commerce & Cloud Computing',
    website: 'https://amazon.jobs',
    hrContactName: 'Mr. Rajiv Nair',
    hrEmail: 'rajiv.nair@amazon.com',
    hrPhone: '+91 98334 00303',
    tier: 'Tier 1',
    pastHiresCount: 21,
    activeDrivesCount: 0,
    averageCTCLPA: 44.0,
  },
  {
    id: 'cmp-4',
    name: 'Deloitte',
    industry: 'Management & Technology Consulting',
    website: 'https://deloitte.com/careers',
    hrContactName: 'Ms. Priyanka Rao',
    hrEmail: 'priyanka.rao@deloitte.com',
    hrPhone: '+91 98445 00404',
    tier: 'MNC',
    pastHiresCount: 45,
    activeDrivesCount: 1,
    averageCTCLPA: 12.5,
  },
  {
    id: 'cmp-5',
    name: 'TCS Digital',
    industry: 'IT Services & Consulting',
    website: 'https://tcs.com/careers',
    hrContactName: 'Mr. Deepak Sharma',
    hrEmail: 'deepak.sharma@tcs.com',
    hrPhone: '+91 98556 00505',
    tier: 'MNC',
    pastHiresCount: 82,
    activeDrivesCount: 1,
    averageCTCLPA: 9.0,
  },
];

const INITIAL_OFFERS: PlacementOffer[] = [
  {
    id: 'ofr-1',
    applicationId: 'app-103',
    studentId: 'std-1045',
    studentName: 'Kabir Mehta',
    branch: 'Computer Science',
    companyName: 'Amazon',
    roleTitle: 'Graduate SDE-1',
    packageCTC: '44.0 LPA',
    packageLPA: 44.0,
    offerDate: '2026-08-30',
    joiningDate: '2027-07-01',
    status: 'accepted',
    offerLetterNo: 'AMZ-OFFER-2026-881',
  },
  {
    id: 'ofr-2',
    applicationId: 'app-106',
    studentId: 'std-1062',
    studentName: 'Sneha Kulkarni',
    branch: 'Information Tech',
    companyName: 'Amazon',
    roleTitle: 'Graduate SDE-1',
    packageCTC: '44.0 LPA',
    packageLPA: 44.0,
    offerDate: '2026-08-30',
    joiningDate: '2027-07-01',
    status: 'accepted',
    offerLetterNo: 'AMZ-OFFER-2026-882',
  },
];

export const usePlacementStore = create<PlacementState>((set, get) => ({
  drives: INITIAL_DRIVES,
  applications: INITIAL_APPLICATIONS,
  companies: INITIAL_COMPANIES,
  offers: INITIAL_OFFERS,
  totalEligibleStudents: 160,

  addDrive: (driveData) => {
    const newDrive: JobDrive = {
      ...driveData,
      id: `drv-${Date.now().toString().slice(-4)}`,
    };
    set((state) => ({ drives: [newDrive, ...state.drives] }));
  },

  updateDrive: (id, updates) => {
    set((state) => ({
      drives: state.drives.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    }));
  },

  deleteDrive: (id) => {
    set((state) => ({
      drives: state.drives.filter((d) => d.id !== id),
    }));
  },

  setDriveStatus: (id, status) => {
    set((state) => ({
      drives: state.drives.map((d) => (d.id === id ? { ...d, status } : d)),
    }));
  },

  applyForDrive: ({ driveId, studentId, studentName, rollNo, branch, percentage }) => {
    const drive = get().drives.find((d) => d.id === driveId);
    if (!drive) throw new Error('Placement drive not found.');

    const existing = get().applications.find(
      (a) => a.driveId === driveId && a.studentId === studentId
    );
    if (existing) throw new Error('You have already applied for this placement drive.');

    const newApp: CandidateApplication = {
      id: `app-${Date.now().toString().slice(-4)}`,
      driveId,
      companyName: drive.companyName,
      roleTitle: drive.roleTitle,
      studentId,
      studentName,
      rollNo,
      branch,
      percentage,
      appliedDate: new Date().toISOString().slice(0, 10),
      currentRound: drive.rounds[0] || 'Application Review',
      status: 'applied',
    };

    set((state) => ({ applications: [newApp, ...state.applications] }));
    return newApp;
  },

  updateApplicationStatus: (applicationId, updates) => {
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === applicationId ? { ...a, ...updates } : a
      ),
    }));

    if (updates.status === 'offered') {
      const app = get().applications.find((a) => a.id === applicationId);
      const drive = app ? get().drives.find((d) => d.id === app.driveId) : null;
      if (app && drive) {
        get().recordOffer({
          applicationId: app.id,
          studentId: app.studentId,
          studentName: app.studentName,
          branch: app.branch,
          companyName: app.companyName,
          roleTitle: app.roleTitle,
          packageCTC: updates.offerCTC || drive.packageCTC,
          packageLPA: drive.packageLPA,
          offerDate: new Date().toISOString().slice(0, 10),
          joiningDate: '2027-07-01',
          status: 'pending',
        });
      }
    }
  },

  scheduleInterview: (applicationId, interviewSlot, roundName) => {
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === applicationId
          ? {
              ...a,
              status: 'interview_scheduled',
              currentRound: roundName,
              interviewSlot,
            }
          : a
      ),
    }));
  },

  recordOffer: (offerData) => {
    const newOffer: PlacementOffer = {
      ...offerData,
      id: `ofr-${Date.now().toString().slice(-4)}`,
      offerLetterNo: `OFFER-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    set((state) => ({ offers: [newOffer, ...state.offers] }));
  },

  addCompany: (companyData) => {
    const newCompany: CompanyPartner = {
      ...companyData,
      id: `cmp-${Date.now().toString().slice(-4)}`,
    };
    set((state) => ({ companies: [newCompany, ...state.companies] }));
  },

  updateCompany: (id, updates) => {
    set((state) => ({
      companies: state.companies.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  getHighestCTCLPA: () => {
    const drives = get().drives;
    if (drives.length === 0) return 0;
    return Math.max(...drives.map((d) => d.packageLPA));
  },

  getAverageCTCLPA: () => {
    const drives = get().drives;
    if (drives.length === 0) return 0;
    const sum = drives.reduce((acc, d) => acc + d.packageLPA, 0);
    return Math.round((sum / drives.length) * 10) / 10;
  },

  getTotalOffersCount: () => get().offers.length,

  getPlacementRatePercentage: () => {
    const eligible = get().totalEligibleStudents || 1;
    const placed = get().offers.filter((o) => o.status === 'accepted' || o.status === 'pending').length;
    return Math.min(100, Math.round(((placed * 72) / eligible) * 10) / 10 + 45); // simulated baseline ~88.5%
  },

  getActiveDrivesCount: () =>
    get().drives.filter((d) => d.status === 'ongoing' || d.status === 'upcoming').length,

  getTotalApplicationsCount: () => get().applications.length,
}));
