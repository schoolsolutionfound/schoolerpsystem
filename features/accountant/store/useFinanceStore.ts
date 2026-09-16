/**
 * @file useFinanceStore.ts
 * @description Centralized Zustand state management for School Finance & Accounts.
 *
 * Covers:
 *  - Income Records (Tuition, Bus Fees, Hostel, Miscellaneous)
 *  - Expense Records (Salaries, Fuel, Vehicle Maintenance, Utilities)
 *  - Outstanding Student Fees tracking & 1-tap fee collection
 *  - Pending Payroll & Salary Disbursement tracking
 *  - Bus Fleet Logistics (Fuel logs vs Repairs breakdown)
 */

import { create } from 'zustand';
import {
  IncomeRecord,
  ExpenseRecord,
  IncomeCategory,
  ExpenseCategory,
  PaymentStatus,
  PaymentMethod,
} from '../types/finance';

interface FinanceState {
  incomeRecords: IncomeRecord[];
  expenseRecords: ExpenseRecord[];

  // Actions
  addIncome: (record: Omit<IncomeRecord, 'id' | 'receiptNo'>) => void;
  addExpense: (record: Omit<ExpenseRecord, 'id' | 'invoiceNo'>) => void;
  updateIncomeRecord: (id: string, updates: Partial<IncomeRecord>) => void;
  updateExpenseRecord: (id: string, updates: Partial<ExpenseRecord>) => void;
  updateIncomeStatus: (id: string, status: PaymentStatus) => void;
  updateExpenseStatus: (id: string, status: PaymentStatus) => void;
  deleteIncome: (id: string) => void;
  deleteExpense: (id: string) => void;

  // Direct Operations
  collectStudentFee: (id: string, paymentMethod: PaymentMethod) => void;
  disburseSalary: (id: string, paymentMethod: PaymentMethod) => void;

  // Derived Metrics & Filters
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getNetTally: () => number;
  getPendingIncomeTotal: () => number;
  getPendingExpenseTotal: () => number;
  getPendingStudentFees: () => IncomeRecord[];
  getPendingSalaries: () => ExpenseRecord[];
  getBusFuelRecords: () => ExpenseRecord[];
  getBusMaintenanceRecords: () => ExpenseRecord[];
  getBusFuelTotal: () => number;
  getBusMaintenanceTotal: () => number;
}

const INITIAL_INCOMES: IncomeRecord[] = [
  {
    id: 'inc-1',
    title: 'Term 1 Tuition & Admission Fee',
    category: 'student_fee',
    payerName: 'Rahul Sharma',
    studentId: 'GIS2026001',
    rollNo: '10A-01',
    classSection: 'Grade 10-A',
    totalFee: 35000,
    amount: 24500,
    dueDate: '2026-08-30',
    parentPhone: '+91-9876543210',
    paymentMethod: 'upi',
    paymentDate: '2026-08-20',
    status: 'paid',
    receiptNo: 'REC-2026-0801',
    notes: 'Paid online via PhonePe UPI',
  },
  {
    id: 'inc-2',
    title: 'Annual Transport Bus Fee (Route #4)',
    category: 'bus_fee',
    payerName: 'Priya Verma',
    studentId: 'GIS2026002',
    rollNo: '10A-02',
    classSection: 'Grade 10-A',
    totalFee: 12000,
    amount: 12000,
    dueDate: '2026-08-15',
    parentPhone: '+91-9876543211',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-18',
    status: 'paid',
    receiptNo: 'REC-2026-0802',
    notes: 'Route #4 City Express (Indiranagar to School)',
  },
  {
    id: 'inc-3',
    title: 'Hostel Term 2 Boarding & Mess Fee',
    category: 'hostel_fee',
    payerName: 'Amit Kumar',
    studentId: 'GIS2026015',
    rollNo: '12C-15',
    classSection: 'Grade 12-C',
    totalFee: 35000,
    amount: 35000,
    dueDate: '2026-08-10',
    parentPhone: '+91-9876543220',
    paymentMethod: 'cheque',
    paymentDate: '2026-08-15',
    status: 'paid',
    receiptNo: 'REC-2026-0803',
    notes: 'HDFC Cheque #492011 Cleared',
  },
  {
    id: 'inc-4',
    title: 'Term 2 Tuition Fee (Outstanding)',
    category: 'student_fee',
    payerName: 'Ananya Gupta',
    studentId: 'GIS2026024',
    rollNo: '06A-12',
    classSection: 'Grade 6-A',
    totalFee: 22000,
    amount: 22000,
    dueDate: '2026-08-25',
    parentPhone: '+91-9876543230',
    paymentMethod: 'upi',
    paymentDate: '2026-08-24',
    status: 'pending',
    receiptNo: 'REC-2026-0804',
    notes: 'First reminder sent to parent WhatsApp',
  },
  {
    id: 'inc-5',
    title: 'Term 2 Tuition & Science Lab Fee',
    category: 'student_fee',
    payerName: 'Siddharth Joshi',
    studentId: 'GIS2026045',
    rollNo: '09B-18',
    classSection: 'Grade 9-B',
    totalFee: 18500,
    amount: 18500,
    dueDate: '2026-08-28',
    parentPhone: '+91-9876543245',
    paymentMethod: 'cash',
    paymentDate: '2026-08-28',
    status: 'pending',
    receiptNo: 'REC-2026-0805',
    notes: 'Parent requested extension till 5th September',
  },
  {
    id: 'inc-6',
    title: 'Bus Route #2 Transportation Fee',
    category: 'bus_fee',
    payerName: 'Rohan Mehta',
    studentId: 'GIS2026003',
    rollNo: '09B-05',
    classSection: 'Grade 9-B',
    totalFee: 11500,
    amount: 11500,
    dueDate: '2026-08-20',
    parentPhone: '+91-9876543212',
    paymentMethod: 'cash',
    paymentDate: '2026-08-22',
    status: 'paid',
    receiptNo: 'REC-2026-0806',
    notes: 'Cash received at fee counter counter #2',
  },
  {
    id: 'inc-7',
    title: 'Hostel Term 2 Mess Fee (Pending)',
    category: 'hostel_fee',
    payerName: 'Tanvi Rao',
    studentId: 'GIS2026088',
    rollNo: '11A-22',
    classSection: 'Grade 11-A',
    totalFee: 15000,
    amount: 15000,
    dueDate: '2026-08-31',
    parentPhone: '+91-9876543288',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-31',
    status: 'pending',
    receiptNo: 'REC-2026-0807',
    notes: 'Hostel warden notified for fee follow-up',
  },
  {
    id: 'inc-8',
    title: 'Auditorium Rental & Sports Sponsor',
    category: 'misc',
    payerName: 'Apex Sports Academy',
    amount: 15000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-10',
    status: 'paid',
    receiptNo: 'REC-2026-0808',
    notes: 'Inter-school championship venue booking',
  },
];

const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp-1',
    title: 'Senior Teaching Staff August Payroll',
    category: 'salary',
    payeeName: 'Senior Teachers Group (18 Teachers)',
    employeeId: 'PAY-TCH-AUG-01',
    designation: 'Senior Faculty',
    department: 'Academics',
    amount: 145000,
    dueDate: '2026-08-01',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-01',
    status: 'paid',
    invoiceNo: 'INV-PAY-0826',
    notes: 'Direct bank NEFT via SBI Corporate Portal',
  },
  {
    id: 'exp-2',
    title: 'Science Dept Head August Salary',
    category: 'salary',
    payeeName: 'Anita Desai',
    employeeId: 'TCH-GIS-001',
    designation: 'HOD Science & Physics',
    department: 'Academics',
    amount: 48000,
    dueDate: '2026-09-01',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-09-01',
    status: 'pending',
    invoiceNo: 'INV-SAL-0901',
    notes: 'Awaiting monthly attendance audit sign-off',
  },
  {
    id: 'exp-3',
    title: 'Bus Fleet Drivers & Conductors Salary',
    category: 'salary',
    payeeName: 'Transport Staff (6 Drivers, 6 Conductors)',
    employeeId: 'DRV-GIS-GRP',
    designation: 'Transport Operations Team',
    department: 'Transport',
    amount: 72000,
    dueDate: '2026-09-01',
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-09-01',
    status: 'pending',
    invoiceNo: 'INV-SAL-0902',
    notes: 'Payroll clearance queued for approval',
  },
  {
    id: 'exp-4',
    title: 'Bus #1 & #2 Weekly Diesel Refueling',
    category: 'bus_fuel',
    payeeName: 'Indian Oil Highway Petro Station',
    department: 'Transport',
    vehicleNo: 'KA-04-E-1122 / Bus #1',
    fuelLitres: 180,
    odometerKm: 42150,
    amount: 16800,
    paymentMethod: 'card',
    paymentDate: '2026-08-25',
    status: 'paid',
    invoiceNo: 'INV-FUEL-401',
    notes: '180 Litres Diesel @ ₹93.33/L — Route #1 & #2',
  },
  {
    id: 'exp-5',
    title: 'Bus #3 & #4 Weekly Diesel Refueling',
    category: 'bus_fuel',
    payeeName: 'Bharat Petroleum Outlet',
    department: 'Transport',
    vehicleNo: 'KA-04-E-1124 / Bus #3',
    fuelLitres: 125,
    odometerKm: 38400,
    amount: 11600,
    paymentMethod: 'upi',
    paymentDate: '2026-08-20',
    status: 'paid',
    invoiceNo: 'INV-FUEL-402',
    notes: '125 Litres Diesel @ ₹92.80/L — Route #3 & #4',
  },
  {
    id: 'exp-6',
    title: 'Bus #3 Brake Overhaul & Suspension Repair',
    category: 'bus_maintenance',
    payeeName: 'Tata Commercial Authorised Garage',
    department: 'Transport',
    vehicleNo: 'KA-04-E-1124 / Bus #3',
    maintenanceType: 'Brake Liners & Suspension Bush',
    amount: 18500,
    paymentMethod: 'cheque',
    paymentDate: '2026-08-14',
    status: 'paid',
    invoiceNo: 'INV-SVC-301',
    notes: 'Front brake drum replacement and wheel alignment',
  },
  {
    id: 'exp-7',
    title: 'Bus #2 New Radial Tyres (Set of 4)',
    category: 'bus_maintenance',
    payeeName: 'MRF Commercial Tyre Zone',
    department: 'Transport',
    vehicleNo: 'KA-04-E-1123 / Bus #2',
    maintenanceType: 'Tyre Replacement (4 Tyres)',
    amount: 28400,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-27',
    status: 'pending',
    invoiceNo: 'INV-TYRE-882',
    notes: 'Invoice received, due payment by 3rd Sept',
  },
  {
    id: 'exp-8',
    title: 'Hostel Mess Catering & Grocery Supplies',
    category: 'hostel_expense',
    payeeName: 'Annapurna Food Distributors',
    department: 'Hostel',
    amount: 42000,
    paymentMethod: 'bank_transfer',
    paymentDate: '2026-08-12',
    status: 'paid',
    invoiceNo: 'INV-HST-902',
    notes: 'Monthly food grains, dairy, and cooking gas supply',
  },
  {
    id: 'exp-9',
    title: 'Campus Electricity & High-Tension Transformer',
    category: 'utility',
    payeeName: 'State Electricity Supply Board',
    department: 'Administration',
    amount: 31200,
    paymentMethod: 'upi',
    paymentDate: '2026-08-05',
    status: 'paid',
    invoiceNo: 'INV-UTIL-108',
    notes: 'Campus administrative & classroom building bill',
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

  updateIncomeRecord: (id, updates) => {
    set((state) => ({
      incomeRecords: state.incomeRecords.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  updateExpenseRecord: (id, updates) => {
    set((state) => ({
      expenseRecords: state.expenseRecords.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  updateIncomeStatus: (id, status) => {
    set((state) => ({
      incomeRecords: state.incomeRecords.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    }));
  },

  updateExpenseStatus: (id, status) => {
    set((state) => ({
      expenseRecords: state.expenseRecords.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    }));
  },

  collectStudentFee: (id, paymentMethod) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      incomeRecords: state.incomeRecords.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'paid',
              paymentMethod,
              paymentDate: today,
              notes: (item.notes ? item.notes + ' • ' : '') + 'Collected by Accountant',
            }
          : item
      ),
    }));
  },

  disburseSalary: (id, paymentMethod) => {
    const today = new Date().toISOString().split('T')[0];
    set((state) => ({
      expenseRecords: state.expenseRecords.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'paid',
              paymentMethod,
              paymentDate: today,
              notes: (item.notes ? item.notes + ' • ' : '') + 'Disbursed by Accounts',
            }
          : item
      ),
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
    return get()
      .incomeRecords.filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getTotalExpenses: () => {
    return get()
      .expenseRecords.filter((r) => r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getNetTally: () => {
    return get().getTotalIncome() - get().getTotalExpenses();
  },

  getPendingIncomeTotal: () => {
    return get()
      .incomeRecords.filter((r) => r.status !== 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getPendingExpenseTotal: () => {
    return get()
      .expenseRecords.filter((r) => r.status !== 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getPendingStudentFees: () => {
    return get().incomeRecords.filter(
      (r) => r.status !== 'paid' && (r.category === 'student_fee' || r.category === 'hostel_fee' || r.category === 'bus_fee')
    );
  },

  getPendingSalaries: () => {
    return get().expenseRecords.filter((r) => r.category === 'salary' && r.status !== 'paid');
  },

  getBusFuelRecords: () => {
    return get().expenseRecords.filter((r) => r.category === 'bus_fuel');
  },

  getBusMaintenanceRecords: () => {
    return get().expenseRecords.filter(
      (r) => r.category === 'bus_maintenance' || r.category === 'bus_expense'
    );
  },

  getBusFuelTotal: () => {
    return get()
      .expenseRecords.filter((r) => r.category === 'bus_fuel' && r.status === 'paid')
      .reduce((sum, r) => sum + r.amount, 0);
  },

  getBusMaintenanceTotal: () => {
    return get()
      .expenseRecords.filter(
        (r) => (r.category === 'bus_maintenance' || r.category === 'bus_expense') && r.status === 'paid'
      )
      .reduce((sum, r) => sum + r.amount, 0);
  },
}));
