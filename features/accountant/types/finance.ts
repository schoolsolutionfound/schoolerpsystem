export type IncomeCategory = 'student_fee' | 'bus_fee' | 'hostel_fee' | 'misc';

export type ExpenseCategory = 'salary' | 'bus_expense' | 'hostel_expense' | 'utility' | 'maintenance' | 'other';

export type PaymentMethod = 'upi' | 'cash' | 'card' | 'bank_transfer' | 'cheque';

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface IncomeRecord {
  id: string;
  title: string;
  category: IncomeCategory;
  payerName: string;
  studentId?: string;
  classSection?: string;
  amount: number;
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
  department?: string;
  amount: number;
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
