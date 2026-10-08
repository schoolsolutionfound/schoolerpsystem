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
  PaymentStatus,
  PaymentMethod,
} from '../types/finance';
import {
  fetchFeesApi,
  fetchFeePaymentsApi,
  fetchStudentsApi,
  fetchExpensesApi,
  createFeePaymentApi,
  createExpenseApi,
  updateFeePaymentApi,
  updateFeeApi,
  updateExpenseApi,
  deleteFeeApi,
  deleteFeePaymentApi,
  deleteExpenseApi,
} from '../../../api/admin';
import { mapFeeData, mapExpenseRecords } from '../utils/feeMappers';

interface FinanceState {
  incomeRecords: IncomeRecord[];
  expenseRecords: ExpenseRecord[];
  loaded: boolean;
  loading: boolean;
  error: string | null;

  loadFees: () => Promise<void>;
  setIncomeRecords: (records: IncomeRecord[]) => void;
  setExpenseRecords: (records: ExpenseRecord[]) => void;

  addIncome: (record: Omit<IncomeRecord, 'id' | 'receiptNo'>) => void;
  addExpense: (record: Omit<ExpenseRecord, 'id' | 'invoiceNo'>) => Promise<void>;
  updateIncomeRecord: (id: string, updates: Partial<IncomeRecord>) => Promise<void>;
  updateExpenseRecord: (id: string, updates: Partial<ExpenseRecord>) => Promise<void>;
  updateIncomeStatus: (id: string, status: PaymentStatus) => void;
  updateExpenseStatus: (id: string, status: PaymentStatus) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  collectStudentFee: (id: string, paymentMethod: PaymentMethod) => Promise<void>;
  disburseSalary: (id: string, paymentMethod: PaymentMethod) => Promise<void>;

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
  loading: false,
  error: null,

  loadFees: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const [feesRes, paymentsRes, studentsRes, expensesRes] = await Promise.all([
        fetchFeesApi().catch(() => [] as any[]),
        fetchFeePaymentsApi().catch(() => [] as any[]),
        fetchStudentsApi().catch(() => ({ data: [] }) as any),
        fetchExpensesApi().catch(() => [] as any[]),
      ]);
      const fees = Array.isArray(feesRes) ? feesRes : [];
      const payments = Array.isArray(paymentsRes) ? paymentsRes : [];
      const students = Array.isArray(studentsRes)
        ? studentsRes
        : Array.isArray(studentsRes?.data)
          ? studentsRes.data
          : [];
      const expenses = Array.isArray(expensesRes) ? expensesRes : [];
      set({
        incomeRecords: mapFeeData(fees, payments, students),
        expenseRecords: mapExpenseRecords(expenses),
        loaded: true,
        loading: false,
      });
    } catch (err: any) {
      set({ loading: false, loaded: true, error: err?.message || 'Failed to load fees' });
    }
  },

  setIncomeRecords: (records) => set({ incomeRecords: records, loaded: true, loading: false }),
  setExpenseRecords: (records) => set({ expenseRecords: records, loaded: true }),

  addIncome: (record) => {
    const newId = `inc-${Date.now()}`;
    const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    set((state) => ({
      incomeRecords: [{ ...record, id: newId, receiptNo }, ...state.incomeRecords],
    }));
  },

  addExpense: async (record) => {
    const newId = `exp-${Date.now()}`;
    const invoiceNo = `INV-EXP-${Math.floor(1000 + Math.random() * 9000)}`;
    const prev = get().expenseRecords;
    set({ expenseRecords: [{ ...record, id: newId, invoiceNo }, ...prev], error: null });
    try {
      await createExpenseApi({
        title: record.title,
        category: record.category,
        payeeName: record.payeeName,
        employeeId: record.employeeId || undefined,
        designation: record.designation || undefined,
        department: record.department || undefined,
        vehicleNo: record.vehicleNo || undefined,
        amount: record.amount,
        paymentMethod: record.paymentMethod,
        paymentDate: record.paymentDate || undefined,
        status: record.status,
        notes: record.notes || undefined,
      });
      await get().loadFees();
    } catch (err: any) {
      set({ expenseRecords: prev, error: err?.message || 'Failed to record expense' });
      throw err;
    }
  },

  updateIncomeRecord: async (id, updates) => {
    const prev = get().incomeRecords;
    set({ incomeRecords: prev.map((item) => (item.id === id ? { ...item, ...updates } : item)) });
    const target = prev.find((item) => item.id === id);
    if (!target) return;
    try {
      if (target.paymentId) {
        await updateFeePaymentApi(target.paymentId, {
          amount: updates.amount ?? target.amount,
          status: updates.status ?? target.status,
          paymentMethod: updates.paymentMethod ?? target.paymentMethod,
          paymentDate: updates.paymentDate ?? target.paymentDate,
          notes: updates.notes ?? target.notes,
        });
      } else if (target.feeStructureId) {
        await updateFeeApi(target.feeStructureId, {
          amount: updates.amount ?? target.amount,
          dueDate: updates.dueDate ?? target.dueDate,
        });
      }
      await get().loadFees();
    } catch {
      set({ incomeRecords: prev, error: 'Failed to update fee record' });
    }
  },

  updateExpenseRecord: async (id, updates) => {
    const prev = get().expenseRecords;
    set({
      expenseRecords: prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    });
    try {
      await updateExpenseApi(id, {
        title: updates.title,
        category: updates.category,
        payeeName: updates.payeeName,
        employeeId: updates.employeeId || undefined,
        designation: updates.designation || undefined,
        department: updates.department || undefined,
        vehicleNo: updates.vehicleNo || undefined,
        amount: updates.amount,
        paymentMethod: updates.paymentMethod,
        paymentDate: updates.paymentDate ? updates.paymentDate : undefined,
        status: updates.status,
        notes: updates.notes || undefined,
      });
      await get().loadFees();
    } catch (err: any) {
      set({ expenseRecords: prev, error: err?.message || 'Failed to update expense' });
      throw err;
    }
  },

  updateIncomeStatus: (id, status) => {
    set((state) => ({
      incomeRecords: state.incomeRecords.map((item) =>
        item.id === id ? { ...item, status } : item
      ),
    }));
  },

  updateExpenseStatus: async (id, status) => {
    const prev = get().expenseRecords;
    set({
      expenseRecords: prev.map((item) => (item.id === id ? { ...item, status } : item)),
    });
    try {
      await updateExpenseApi(id, { status });
      await get().loadFees();
    } catch (err: any) {
      set({ expenseRecords: prev, error: err?.message || 'Failed to update expense status' });
      throw err;
    }
  },

  collectStudentFee: async (id, paymentMethod) => {
    const prev = get().incomeRecords;
    const target = prev.find((item) => item.id === id);
    if (!target) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      if (target.paymentId) {
        await updateFeePaymentApi(target.paymentId, {
          status: 'paid',
          paymentMethod,
          paymentDate: today,
          amount: target.amount,
        });
      } else if (target.feeStructureId && target.studentId) {
        await createFeePaymentApi({
          feeStructureId: target.feeStructureId,
          studentId: target.studentId,
          amount: target.amount,
          paymentMethod,
          paymentDate: today,
          status: 'paid',
          notes: 'Collected by Accountant',
        });
      } else {
        set({
          incomeRecords: prev.map((item) =>
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
        });
        return;
      }
      await get().loadFees();
    } catch (err: any) {
      set({ error: err?.message || 'Failed to collect fee' });
      throw err;
    }
  },

  disburseSalary: async (id, paymentMethod) => {
    const today = new Date().toISOString().split('T')[0];
    const prev = get().expenseRecords;
    set({
      expenseRecords: prev.map((item) =>
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
    });
    try {
      await updateExpenseApi(id, { status: 'paid', paymentMethod, paymentDate: today });
      await get().loadFees();
    } catch (err: any) {
      set({ expenseRecords: prev, error: err?.message || 'Failed to disburse salary' });
      throw err;
    }
  },

  deleteIncome: async (id) => {
    const prev = get().incomeRecords;
    const target = prev.find((item) => item.id === id);
    set({ incomeRecords: prev.filter((item) => item.id !== id) });
    if (!target) return;
    try {
      if (target.paymentId) {
        await deleteFeePaymentApi(target.paymentId);
      } else if (target.feeStructureId) {
        await deleteFeeApi(target.feeStructureId);
      }
      await get().loadFees();
    } catch {
      set({ incomeRecords: prev, error: 'Failed to delete fee record' });
    }
  },

  deleteExpense: async (id) => {
    const prev = get().expenseRecords;
    set({ expenseRecords: prev.filter((item) => item.id !== id) });
    try {
      await deleteExpenseApi(id);
      await get().loadFees();
    } catch (err: any) {
      set({ expenseRecords: prev, error: err?.message || 'Failed to delete expense' });
      throw err;
    }
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
