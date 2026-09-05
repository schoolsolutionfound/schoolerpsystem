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
