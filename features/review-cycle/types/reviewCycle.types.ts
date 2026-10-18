export type ReviewCycleStatus = 'draft' | 'active' | 'in_review' | 'completed';
export type ReviewCycleScope = 'all_staff' | 'department' | 'teaching_only' | 'support_staff';
export type EvaluationStatus = 'pending' | 'self_submitted' | 'reviewed' | 'approved';

export interface ReviewCycle {
  id: string;
  title: string;
  period: string; // e.g. "Q1 2026" or "Annual Faculty Appraisal 2025-2026"
  status: ReviewCycleStatus;
  scope: ReviewCycleScope;
  department?: string;
  revieweesCount: number;
  completedCount: number;
  averageRating?: number; // 1.0 - 5.0
  deadline: string;
  createdDate: string;
  description?: string;
}

export interface StaffEvaluationItem {
  id: string;
  cycleId: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  designation: string;
  department: string;
  status: EvaluationStatus;
  rating?: number; // 1 to 5
  pedagogyScore?: number; // 1 to 5
  punctualityScore?: number; // 1 to 5
  studentFeedbackScore?: number; // 1 to 5
  strengths?: string;
  areasForGrowth?: string;
  reviewerRemarks?: string;
  reviewerName?: string;
  reviewerRole?: 'principal' | 'hod' | 'admin';
  reviewedDate?: string;
}

export interface CreateReviewCyclePayload {
  title: string;
  period: string;
  scope: ReviewCycleScope;
  department?: string;
  deadline: string;
  description?: string;
}

export interface SubmitEvaluationPayload {
  evaluationId: string;
  rating: number;
  pedagogyScore: number;
  punctualityScore: number;
  studentFeedbackScore: number;
  strengths: string;
  areasForGrowth: string;
  reviewerRemarks: string;
}
