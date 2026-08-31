import { create } from 'zustand';
import { IncomeRecord, ExpenseRecord, IncomeCategory, ExpenseCategory, PaymentStatus } from '../types/finance';

interface FinanceState {
  incomeRecords: IncomeRecord[];
  expenseRecords: ExpenseRecord[];

  // Actions
  addIncome: (record: Omit<IncomeRecord, 'id' | 'receiptNo'>) => void;
  addExpense: (record: Omit<ExpenseRecord, 'id' | 'invoiceNo'>) => void;
  updateIncomeStatus: (id: string, status: PaymentStatus) => void;
  updateExpenseStatus: (id: string, status: PaymentStatus) => void;
  deleteIncome: (id: string) => void;
  deleteExpense: (id: string) => void;

  // Derived Calculations
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getNetTally: () => number;
  getPendingIncomeTotal: () => number;
}

const INITIAL_INCOMES: IncomeRecord[] = [
  {
    id: 'inc-1',
    title: 'Q1 Tuition & Admission Fee',
    category: 'student_fee',
    payerName: 'Rahul Sharma',
    studentId: 'STU-2024-089',
    classSection: 'Class 10-A',
    amount: 24500,
    paymentMethod: 'upi',
    paymentDate: '2026-08-20',
    status: 'paid',
    receiptNo: 'REC-2026-0801',
    notes: 'Paid online via PhonePe UPI',
  },
  {
    id: 'inc-2',
    title: 'Annual Transport Bus Fee',
    category: 'bus_fee',
    payerName: 'Priya Verma',
    studentId: 'STU-2024-042',
    classSection: 'Class 8-B',
    amount: 12000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-18',
    status: 'paid',
    receiptNo: 'REC-2026-0802',
    notes: 'Route #4 City Express',
  },
  {
    id: 'inc-3',
    title: 'Hostel Term 2 Boarding & Mess Fee',
    category: 'hostel_fee',
    payerName: 'Amit Kumar',
    studentId: 'STU-2024-115',
    classSection: 'Class 12-C',
    amount: 35000,
    paymentMethod: 'cheque',
    paymentDate: '2026-08-15',
    status: 'paid',
    receiptNo: 'REC-2026-0803',
    notes: 'HDFC Cheque #492011',
  },
  {
    id: 'inc-4',
    title: 'Term 2 Tuition Fee',
    category: 'student_fee',
    payerName: 'Ananya Gupta',
    studentId: 'STU-2024-204',
    classSection: 'Class 6-A',
    amount: 22000,
    paymentMethod: 'upi',
    paymentDate: '2026-08-24',
    status: 'pending',
    receiptNo: 'REC-2026-0804',
    notes: 'Reminder sent to parent',
  },
  {
    id: 'inc-5',
    title: 'Bus Route #2 Transportation Fee',
    category: 'bus_fee',
    payerName: 'Rohan Mehta',
    studentId: 'STU-2024-012',
    classSection: 'Class 9-B',
    amount: 11500,
    paymentMethod: 'cash',
    paymentDate: '2026-08-22',
    status: 'paid',
    receiptNo: 'REC-2026-0805',
    notes: 'Cash received at fee counter',
  },
  {
    id: 'inc-6',
    title: 'Auditorium Rental & Event Sponsor',
    category: 'misc',
    payerName: 'Apex Sports Academy',
    amount: 15000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-10',
    status: 'paid',
    receiptNo: 'REC-2026-0806',
    notes: 'Inter-school championship venue booking',
  },
];

const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    title: 'Teaching Staff August Salaries',
    category: 'salary',
    payeeName: 'Senior & Primary Teachers Payroll (28 Teachers)',
    department: 'Academics',
    amount: 145000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-01',
    status: 'paid',
    invoiceNo: 'INV-PAY-0826',
    notes: 'Direct bank transfer via SBI Corporate',
  },
  {
    id: 'exp-2',
    title: 'Bus Fleet Fuel & Diesel Filling',
    category: 'bus_expense',
    payeeName: 'Indian Oil Fuel Station',
    department: 'Transport',
    amount: 28400,
    paymentMethod: 'card',
    paymentDate: '2026-08-19',
    status: 'paid',
    invoiceNo: 'INV-TRP-402',
    notes: 'Weekly diesel fill-up for 6 buses',
  },
  {
    id: 'exp-3',
    title: 'School Bus #3 Engine Service & Tyres',
    category: 'bus_expense',
    payeeName: 'Tata Commercial Services',
    department: 'Transport',
    amount: 18500,
    paymentMethod: 'cheque',
    paymentDate: '2026-08-14',
    status: 'paid',
    invoiceNo: 'INV-TRP-410',
    notes: 'Brake pad replacement and wheel alignment',
  },
  {
    id: 'exp-4',
    title: 'Hostel Mess Catering & Grocery Supplies',
    category: 'hostel_expense',
    payeeName: 'Annapurna Food Distributors',
    department: 'Hostel',
    amount: 42000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-12',
    status: 'paid',
    invoiceNo: 'INV-HST-902',
    notes: 'Monthly food grains and dairy supply',
  },
  {
    id: 'exp-5',
    title: 'Campus Electricity & Water Utilities',
    category: 'utility',
    payeeName: 'State Electricity Supply Board',
    department: 'Administration',
    amount: 31200,
    paymentMethod: 'upi',
    paymentDate: '2026-08-05',
    status: 'paid',
    invoiceNo: 'INV-UTIL-108',
    notes: 'High voltage campus transformer bill',
  },
  {
    id: 'exp-6',
    title: 'Computer Lab Upgrades & Servicing',
    category: 'maintenance',
    payeeName: 'TechServe IT Solutions',
    department: 'IT / Computer Science',
    amount: 19800,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-21',
    status: 'pending',
    invoiceNo: 'INV-IT-331',
    notes: 'RAM expansion and antivirus renewal',
  },
];

export const useFinanceStore = create<FinanceState>((set, get) => ({
  incomeRecords: INITIAL_INCOMES,
  expenseRecords: INITIAL_EXPENSES,

  addIncome: (record) => {
    const newId = `inc-${Date.now()}`;
    const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    set((state) => ({
      incomeRecords: [{ ...record, id: newId, receiptNo }, ...state.incomeRecords],
    }));
  },

  addExpense: (record) => {
    const newId = `exp-${Date.now()}`;
    const invoiceNo = `INV-EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    set((state) => ({
      expenseRecords: [{ ...record, id: newId, invoiceNo }, ...state.expenseRecords],
    }));
  },

  updateIncomeStatus: (id, status) => {
    set((state) => ({
      incomeRecords: state.incomeRecords.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  },

  updateExpenseStatus: (id, status) => {
    set((state) => ({
      expenseRecords: state.expenseRecords.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  },

  deleteIncome: (id) => {
    set((state) => ({
      incomeRecords: state.incomeRecords.filter((item) => item.id !== id),
    }));
  },

  deleteExpense: (id) => {
    set((state) => ({
      expenseRecords: state.expenseRecords.filter((item) => item.id !== id),
    }));
  },

  getTotalIncome: () => {
    return get().incomeRecords
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getTotalExpenses: () => {
    return get().expenseRecords
      .filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getNetTally: () => {
    return get().getTotalIncome() - get().getTotalExpenses();
  },

  getPendingIncomeTotal: () => {
    return get().incomeRecords
      .filter((r) => r.status !== 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  },
}));
