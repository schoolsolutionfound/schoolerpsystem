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
  loaded: boolean;

  setIncomeRecords: (records: IncomeRecord[]) => void;
  setExpenseRecords: (records: ExpenseRecord[]) => void;

  addIncome: (record: Omit<IncomeRecord, 'id' | 'receiptNo'>) => void;
  addExpense: (record: Omit<ExpenseRecord, 'id' | 'invoiceNo'>) => void;
  updateIncomeRecord: (id: string, updates: Partial<IncomeRecord>) => void;
  updateExpenseRecord: (id: string, updates: Partial<ExpenseRecord>) => void;
  updateIncomeStatus: (id: string, status: PaymentStatus) => void;
  updateExpenseStatus: (id: string, status: PaymentStatus) => void;
  deleteIncome: (id: string) => void;
  deleteExpense: (id: string) => void;

  collectStudentFee: (id: string, paymentMethod: PaymentMethod) => void;
  disburseSalary: (id: string, paymentMethod: PaymentMethod) => void;

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

export const useFinanceStore = create<FinanceState>((set, get) => ({
  incomeRecords: [],
  expenseRecords: [],
  loaded: false,

  setIncomeRecords: (records) => set({ incomeRecords: records, loaded: true }),
  setExpenseRecords: (records) => set({ expenseRecords: records, loaded: true }),

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
