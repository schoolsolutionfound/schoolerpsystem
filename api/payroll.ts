import { apiClient } from './client';
import {
  CreatePayrollScheduleInput,
  PayrollFrequency,
} from '../features/accountant/types/finance';

export async function fetchPayrollStaffApi(query?: { role?: string }) {
  const params = query?.role ? `?role=${encodeURIComponent(query.role)}` : '';
  return apiClient(`/payroll/staff${params}`);
}

export async function fetchPayrollSchedulesApi() {
  return apiClient('/payroll/schedules');
}

export async function createPayrollSchedulesApi(payload: CreatePayrollScheduleInput) {
  return apiClient('/payroll/schedules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchPayrollScheduleDetailApi(id: string) {
  return apiClient(`/payroll/schedules/${id}`);
}

export async function updatePayrollScheduleApi(
  id: string,
  payload: {
    amount?: number;
    frequency?: PayrollFrequency;
    dayOfMonth?: number | null;
    daysOfMonth?: number[];
    weekday?: number | null;
    active?: boolean;
    notes?: string | null;
  },
) {
  return apiClient(`/payroll/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function payPayrollScheduleApi(
  id: string,
  payload: { amount: number; paymentMethod: string; reference?: string },
) {
  return apiClient(`/payroll/schedules/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addPayrollBonusApi(
  id: string,
  payload: { amount: number; note: string; paymentMethod: string },
) {
  return apiClient(`/payroll/schedules/${id}/bonus`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateDuePayrollApi() {
  return apiClient('/payroll/generate-due', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
