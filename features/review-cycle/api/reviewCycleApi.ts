import { apiClient } from '../../../api/client';
import {
  ReviewCycle,
  StaffEvaluationItem,
  CreateReviewCyclePayload,
  SubmitEvaluationPayload,
} from '../types/reviewCycle.types';

const NOT_CONFIGURED = 'Review cycle service is not configured for this institution.';

export async function fetchReviewCyclesApi(params?: {
  role?: string;
  department?: string;
}): Promise<ReviewCycle[]> {
  try {
    const res = await apiClient<{ cycles?: ReviewCycle[] }>('/admin/review-cycles');
    if (res?.cycles && Array.isArray(res.cycles)) {
      return res.cycles;
    }
  } catch {
    return [];
  }
  return [];
}

export async function fetchStaffEvaluationsApi(cycleId: string): Promise<StaffEvaluationItem[]> {
  try {
    const res = await apiClient<{ evaluations?: StaffEvaluationItem[] }>(
      `/admin/review-cycles/${cycleId}/evaluations`
    );
    if (res?.evaluations && Array.isArray(res.evaluations)) {
      return res.evaluations;
    }
  } catch {
    return [];
  }
  return [];
}

export async function createReviewCycleApi(
  _payload: CreateReviewCyclePayload
): Promise<ReviewCycle> {
  throw new Error(NOT_CONFIGURED);
}

export async function submitStaffEvaluationApi(
  _payload: SubmitEvaluationPayload,
  _reviewerName = '',
  _reviewerRole: 'principal' | 'hod' | 'admin' = 'principal'
): Promise<StaffEvaluationItem> {
  throw new Error(NOT_CONFIGURED);
}
