/**
 * @file financeUtils.ts
 * @description Shared utility functions for the Finance & Accounting module.
 */

import { IncomeCategory, ExpenseCategory } from '../types/finance';

/** Formats a numeric amount as an Indian-Rupee string. */
export const formatINR = (amount: number): string =>
  '₹' + Math.abs(amount).toLocaleString('en-IN');

/** Returns human-readable label for an income category */
export const getIncomeCategoryLabel = (cat: IncomeCategory): string => {
  switch (cat) {
    case 'student_fee': return 'Student Fee';
    case 'bus_fee':     return 'Bus Fee';
    case 'hostel_fee':  return 'Hostel Fee';
    case 'misc':        return 'Misc Income';
  }
};

/** Returns background and text color for an income category */
export const getIncomeCategoryColor = (
  cat: IncomeCategory
): { bg: string; text: string } => {
  switch (cat) {
    case 'student_fee': return { bg: '#E0E7FF', text: '#4338CA' };
    case 'bus_fee':     return { bg: '#FEF3C7', text: '#B45309' };
    case 'hostel_fee':  return { bg: '#FCE7F3', text: '#BE185D' };
    case 'misc':        return { bg: '#E0F2FE', text: '#0369A1' };
  }
};

/** Returns human-readable label for an expense category */
export const getExpenseCategoryLabel = (cat: ExpenseCategory): string => {
  switch (cat) {
    case 'salary':          return 'Staff Salary';
    case 'bus_fuel':        return 'Bus Diesel & Fuel';
    case 'bus_maintenance': return 'Bus Repairs & Service';
    case 'bus_expense':     return 'Transport / Fleet';
    case 'hostel_expense':  return 'Hostel Mess & Ops';
    case 'utility':         return 'Utilities & Bills';
    case 'maintenance':     return 'Campus Maintenance';
    case 'other':           return 'Other Expense';
  }
};

/** Returns background and text color for an expense category */
export const getExpenseCategoryColor = (
  cat: ExpenseCategory
): { bg: string; text: string } => {
  switch (cat) {
    case 'salary':          return { bg: '#FEE2E2', text: '#991B1B' };
    case 'bus_fuel':        return { bg: '#FEF3C7', text: '#D97706' };
    case 'bus_maintenance': return { bg: '#FFEDD5', text: '#C2410C' };
    case 'bus_expense':     return { bg: '#FEF3C7', text: '#92400E' };
    case 'hostel_expense':  return { bg: '#FCE7F3', text: '#9D174D' };
    case 'utility':         return { bg: '#E0F2FE', text: '#075985' };
    case 'maintenance':     return { bg: '#F3E8FF', text: '#6B21A8' };
    case 'other':           return { bg: '#F1F5F9', text: '#475569' };
  }
};

/** Sums the `amount` field of all paid records matching a category key */
export function getCategoryTotal<
  T extends { category: string; status: string; amount: number }
>(records: T[], category: string): number {
  return records
    .filter((r) => r.category === category && r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);
}
