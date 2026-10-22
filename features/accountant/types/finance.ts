/**
 * @file finance.ts
 * @description Data models and types for the School Finance & Accounting module.
 */

export type IncomeCategory = 'student_fee' | 'bus_fee' | 'hostel_fee' | 'misc';

export type ExpenseCategory =
  | 'salary'
  | 'bus_fuel'
  | 'bus_maintenance'
  | 'bus_expense'
  | 'hostel_expense'
  | 'utility'
  | 'maintenance'
  | 'other';

export type PaymentMethod = 'upi' | 'cash' | 'card' | 'bank_transfer' | 'cheque';

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface IncomeRecord {
  id: string;
  title: string;
  category: IncomeCategory;
  payerName: string;
  studentId?: string;
  rollNo?: string;
  classSection?: string;
  totalFee?: number;
  amount: number;
  dueDate?: string;
  parentPhone?: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  receiptNo: string;
  notes?: string;
  feeStructureId?: string;
  paymentId?: string | null;
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: ExpenseCategory;
  payeeName: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  vehicleNo?: string;
  fuelLitres?: number;
  odometerKm?: number;
  maintenanceType?: string;
  amount: number;
  dueDate?: string;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  status: PaymentStatus;
  invoiceNo: string;
  notes?: string;
  scheduleId?: string;
  userId?: string;
  paidAmount?: number;
  payrollType?: PayrollType;
}

export type PayrollFrequency = 'monthly' | 'weekly' | 'daily' | 'days_of_month';

export type PayrollType = 'salary' | 'bonus';

export interface PayrollStaff {
  id: string;
  fullName: string;
  role: string;
  phone?: string | null;
  profilePicUrl?: string | null;
}

export interface CreatePayrollScheduleInput {
  userIds: string[];
  amount: number;
  frequency: PayrollFrequency;
  dayOfMonth?: number;
  daysOfMonth?: number[];
  weekday?: number;
  startDate?: string;
  notes?: string;
}

export interface PayrollSchedule {
  id: string;
  institutionCode: string;
  userId: string;
  payeeName: string;
  role: string;
  department?: string | null;
  amount: number;
  frequency: PayrollFrequency;
  dayOfMonth?: number | null;
  daysOfMonth?: number[] | null;
  weekday?: number | null;
  startDate: string;
  active: boolean;
  notes?: string | null;
  lastGeneratedKey?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  pendingAmount: number;
  pendingPeriods: number;
  paidTotal: number;
  nextDue: string | null;
}

export interface PayrollBalance {
  pendingAmount: number;
  pendingPeriods: number;
  paidTotal: number;
  nextDue: string | null;
}

export interface PayrollScheduleDetail {
  schedule: PayrollSchedule;
  rows: ExpenseRecord[];
  balance: PayrollBalance;
}

export interface FinanceCategoryStat {
  category: string;
  label: string;
  total: number;
  count: number;
  color: string;
}

export interface MonthlyFinancialSummary {
  month: string;
  income: number;
  expense: number;
  tally: number;
}
