export type DocumentType =
  | 'marks_card'
  | 'hall_ticket'
  | 'transfer_certificate'
  | 'study_certificate'
  | 'conduct_certificate'
  | 'fee_clearance'
  | 'migration_certificate'
  | 'custom';

export type DocumentStatus = 'pending' | 'approved' | 'generated' | 'rejected';

export interface DocumentCourseRecord {
  code: string;
  name: string;
  credits: number;
  marksObtained: number;
  maxMarks: number;
  grade: string;
  gradePoints: number;
}

export interface DocumentAcademicDetails {
  semester?: string;
  academicYear?: string;
  sgpa?: number;
  cgpa?: number;
  totalCredits?: number;
  resultStatus?: string;
  admissionDate?: string;
  completionDate?: string;
  feeStatus?: 'paid' | 'due';
  examCenter?: string;
  courses?: DocumentCourseRecord[];
}

export interface DocumentRequest {
  id: string;
  requestNumber: string;
  studentId: string;
  studentName: string;
  rollNoOrUSN: string;
  department: string;
  classOrSemester: string;
  documentType: DocumentType;
  purpose: string;
  urgency: 'normal' | 'urgent';
  copiesCount: number;
  studentRemarks?: string;
  appliedDate: string;
  status: DocumentStatus;
  reviewedBy?: string;
  reviewDate?: string;
  reviewRemarks?: string;
  certificateNumber?: string;
  generatedDate?: string;
  academicDetails?: DocumentAcademicDetails;
}

export const DOCUMENT_TYPE_CONFIG: Record<
  DocumentType,
  {
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    badgeBg: string;
    prefix: string;
    description: string;
  }
> = {
  marks_card: {
    label: 'Marks Card / Grade Sheet',
    shortLabel: 'Marks Card',
    icon: 'certificate-outline',
    color: '#2563EB',
    badgeBg: '#EFF6FF',
    prefix: 'MC',
    description: 'Official academic transcript & semester performance record with credits and SGPA/CGPA.',
  },
  hall_ticket: {
    label: 'Exam Hall Ticket / Admit Card',
    shortLabel: 'Hall Ticket',
    icon: 'card-account-details-outline',
    color: '#7C3AED',
    badgeBg: '#F5F3FF',
    prefix: 'HT',
    description: 'Official examination authorization card with room allotments and schedule table.',
  },
  transfer_certificate: {
    label: 'Transfer Certificate (TC)',
    shortLabel: 'TC Certificate',
    icon: 'file-export-outline',
    color: '#D97706',
    badgeBg: '#FFFBEB',
    prefix: 'TC',
    description: 'Official institutional transfer credential stating date of admission, leaving, and conduct.',
  },
  study_certificate: {
    label: 'Study / Bonafide Certificate',
    shortLabel: 'Study Certificate',
    icon: 'school-outline',
    color: '#059669',
    badgeBg: '#ECFDF5',
    prefix: 'SC',
    description: 'Institutional declaration certifying active student enrollment for passports, scholarships, or loans.',
  },
  conduct_certificate: {
    label: 'Conduct & Character Certificate',
    shortLabel: 'Conduct Cert',
    icon: 'shield-check-outline',
    color: '#0284C7',
    badgeBg: '#F0F9FF',
    prefix: 'CC',
    description: 'Certification of moral character, institutional discipline, and exemplary campus conduct.',
  },
  fee_clearance: {
    label: 'Fee Clearance / No Due Certificate',
    shortLabel: 'Fee Clearance',
    icon: 'cash-check',
    color: '#16A34A',
    badgeBg: '#F0FDF4',
    prefix: 'FC',
    description: 'Official clearance confirming all academic, lab, library, and examination dues have been settled.',
  },
  migration_certificate: {
    label: 'Migration / NOC Certificate',
    shortLabel: 'Migration Cert',
    icon: 'file-swap-outline',
    color: '#9333EA',
    badgeBg: '#FAF5FF',
    prefix: 'MC',
    description: 'Institutional No Objection Certificate for university/board transfer.',
  },
  custom: {
    label: 'Custom / Other Document',
    shortLabel: 'Custom Doc',
    icon: 'file-document-outline',
    color: '#4B5563',
    badgeBg: '#F3F4F6',
    prefix: 'DOC',
    description: 'Special administrative letter or customized endorsement issued by the principal/dean.',
  },
};
