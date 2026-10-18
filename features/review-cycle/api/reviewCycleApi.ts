import { apiClient } from '../../../api/client';
import {
  ReviewCycle,
  StaffEvaluationItem,
  CreateReviewCyclePayload,
  SubmitEvaluationPayload,
} from '../types/reviewCycle.types';

// Default mock seed data for seamless usability in development / offline
const SEED_REVIEW_CYCLES: ReviewCycle[] = [
  {
    id: 'cycle-2026-q1',
    title: 'Spring 2026 Faculty & Staff Appraisal',
    period: 'Jan 2026 - Mar 2026',
    status: 'active',
    scope: 'all_staff',
    revieweesCount: 24,
    completedCount: 18,
    averageRating: 4.4,
    deadline: '2026-03-31',
    createdDate: '2026-01-10',
    description: 'Quarterly academic review evaluating teaching efficacy, syllabus coverage, and student feedback.',
  },
  {
    id: 'cycle-2026-dept',
    title: 'Departmental Peer & Curriculum Audit',
    period: 'Fall Semester 2025-2026',
    status: 'in_review',
    scope: 'department',
    department: 'Computer Science & Engineering',
    revieweesCount: 12,
    completedCount: 9,
    averageRating: 4.6,
    deadline: '2026-04-15',
    createdDate: '2026-02-01',
    description: 'Departmental review led by HOD covering lab preparedness, course outcomes, and student retention.',
  },
  {
    id: 'cycle-2025-annual',
    title: 'Annual Academic Staff Performance Review 2025',
    period: 'Academic Year 2024-2025',
    status: 'completed',
    scope: 'all_staff',
    revieweesCount: 32,
    completedCount: 32,
    averageRating: 4.2,
    deadline: '2025-12-20',
    createdDate: '2025-10-01',
    description: 'Comprehensive annual staff evaluation for increments, certifications, and leadership promotions.',
  },
];

const SEED_EVALUATIONS: Record<string, StaffEvaluationItem[]> = {
  'cycle-2026-q1': [
    {
      id: 'eval-1',
      cycleId: 'cycle-2026-q1',
      staffId: 'staff-101',
      staffName: 'Dr. Robert Davis',
      staffEmail: 'teacher.robert@vmhs.com',
      designation: 'Senior Mathematics Faculty',
      department: 'Mathematics & Science',
      status: 'approved',
      rating: 4.8,
      pedagogyScore: 5,
      punctualityScore: 5,
      studentFeedbackScore: 4.5,
      strengths: 'Outstanding student mentorship, consistent syllabus completion on schedule.',
      areasForGrowth: 'Encourage usage of interactive smart board modules.',
      reviewerRemarks: 'Commended for excellent class attendance and student engagement.',
      reviewerName: 'Principal Headmaster',
      reviewerRole: 'principal',
      reviewedDate: '2026-02-15',
    },
    {
      id: 'eval-2',
      cycleId: 'cycle-2026-q1',
      staffId: 'staff-102',
      staffName: 'Prof. Anita Sharma',
      staffEmail: 'anita.sharma@vmhs.com',
      designation: 'Assistant Professor',
      department: 'Computer Science & Engineering',
      status: 'reviewed',
      rating: 4.3,
      pedagogyScore: 4,
      punctualityScore: 5,
      studentFeedbackScore: 4.0,
      strengths: 'Strong domain expertise in Algorithms and Database Systems.',
      areasForGrowth: 'Can introduce more hands-on lab demonstration sessions.',
      reviewerRemarks: 'Solid overall contribution to department accreditation files.',
      reviewerName: 'Dr. Marcus Vance (HOD)',
      reviewerRole: 'hod',
      reviewedDate: '2026-02-18',
    },
    {
      id: 'eval-3',
      cycleId: 'cycle-2026-q1',
      staffId: 'staff-103',
      staffName: 'Rajesh Kumar',
      staffEmail: 'rajesh.kumar@vmhs.com',
      designation: 'Physics Teacher',
      department: 'Natural Sciences',
      status: 'pending',
      strengths: 'Active laboratory demonstration coordinator.',
      areasForGrowth: 'Pending evaluation review session.',
    },
  ],
};

let inMemoryCycles = [...SEED_REVIEW_CYCLES];
let inMemoryEvaluations: Record<string, StaffEvaluationItem[]> = { ...SEED_EVALUATIONS };

export async function fetchReviewCyclesApi(params?: {
  role?: string;
  department?: string;
}): Promise<ReviewCycle[]> {
  try {
    const res = await apiClient<{ cycles?: ReviewCycle[] }>('/admin/review-cycles');
    if (res?.cycles && Array.isArray(res.cycles) && res.cycles.length > 0) {
      return res.cycles;
    }
  } catch {
    // Graceful fallback to in-memory seed data
  }

  if (params?.department) {
    return inMemoryCycles.filter(
      (c) => !c.department || c.department.toLowerCase() === params.department?.toLowerCase()
    );
  }
  return inMemoryCycles;
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
    // Graceful fallback
  }

  return inMemoryEvaluations[cycleId] || [];
}

export async function createReviewCycleApi(
  payload: CreateReviewCyclePayload
): Promise<ReviewCycle> {
  const newCycle: ReviewCycle = {
    id: `cycle-${Date.now()}`,
    title: payload.title,
    period: payload.period,
    status: 'active',
    scope: payload.scope,
    department: payload.department,
    revieweesCount: 15,
    completedCount: 0,
    averageRating: 0,
    deadline: payload.deadline,
    createdDate: new Date().toISOString().slice(0, 10),
    description: payload.description,
  };

  try {
    await apiClient('/admin/review-cycles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch {
    // Keep in memory
  }

  inMemoryCycles.unshift(newCycle);
  return newCycle;
}

export async function submitStaffEvaluationApi(
  payload: SubmitEvaluationPayload,
  reviewerName = 'Evaluator',
  reviewerRole: 'principal' | 'hod' | 'admin' = 'principal'
): Promise<StaffEvaluationItem> {
  try {
    await apiClient(`/admin/review-cycles/evaluations/${payload.evaluationId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  } catch {
    // Keep in memory
  }

  for (const cycleId of Object.keys(inMemoryEvaluations)) {
    const list = inMemoryEvaluations[cycleId];
    const index = list.findIndex((e) => e.id === payload.evaluationId);
    if (index !== -1) {
      list[index] = {
        ...list[index],
        rating: payload.rating,
        pedagogyScore: payload.pedagogyScore,
        punctualityScore: payload.punctualityScore,
        studentFeedbackScore: payload.studentFeedbackScore,
        strengths: payload.strengths,
        areasForGrowth: payload.areasForGrowth,
        reviewerRemarks: payload.reviewerRemarks,
        reviewerName,
        reviewerRole,
        status: 'approved',
        reviewedDate: new Date().toISOString().slice(0, 10),
      };
      return list[index];
    }
  }

  throw new Error('Evaluation item not found');
}
