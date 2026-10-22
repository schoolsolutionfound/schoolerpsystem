import { IncomeCategory, IncomeRecord, PaymentMethod, PaymentStatus, ExpenseCategory, ExpenseRecord } from '../types/finance';

export interface FeeStructureRow {
  id: string;
  institutionCode?: string;
  classSectionId?: string | null;
  title: string;
  category?: string;
  amount: string | number;
  term?: string | null;
  academicYear?: string | null;
  dueDate?: string | null;
  status?: string;
}

export interface FeePaymentRow {
  id: string;
  institutionCode?: string;
  feeStructureId: string;
  studentId: string;
  amount: string | number;
  paymentMethod?: string;
  paymentDate?: string | null;
  status?: string;
  receiptNo?: string | null;
  notes?: string | null;
}

export interface StudentRow {
  id: string;
  fullName?: string;
  rollNoOrUSN?: string;
  scope?: string | Record<string, unknown>;
  parentPhone?: string;
}

const VALID_CATEGORIES: IncomeCategory[] = ['student_fee', 'bus_fee', 'hostel_fee', 'misc'];
const VALID_METHODS: PaymentMethod[] = ['upi', 'cash', 'card', 'bank_transfer', 'cheque'];

function toNumber(v: string | number | null | undefined): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeCategory(cat?: string): IncomeCategory {
  const c = (cat || '').toLowerCase().trim();
  if ((VALID_CATEGORIES as string[]).includes(c)) return c as IncomeCategory;
  if (c === 'transport' || c === 'bus') return 'bus_fee';
  if (c === 'tuition' || c === 'fee') return 'student_fee';
  return 'student_fee';
}

function normalizeMethod(m?: string): PaymentMethod {
  const v = (m || '').toLowerCase().trim() as PaymentMethod;
  if ((VALID_METHODS as string[]).includes(v)) return v;
  return 'upi';
}

function normalizeStatus(s?: string): PaymentStatus {
  const v = (s || '').toLowerCase().trim();
  if (v === 'paid') return 'paid';
  if (v === 'overdue') return 'overdue';
  return 'pending';
}

function parseScope(scope: StudentRow['scope']): Record<string, string> {
  if (!scope) return {};
  if (typeof scope === 'string') {
    try {
      const parsed = JSON.parse(scope);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return scope as Record<string, string>;
}

/**
 * Join fee_structures + fee_payments + users into accountant IncomeRecords.
 * One record per payment; fee structures with no payment for a student
 * become pending dues (when a student list is provided).
 */
export function mapFeeData(
  fees: FeeStructureRow[],
  payments: FeePaymentRow[],
  students: StudentRow[] = []
): IncomeRecord[] {
  const feeById = new Map((fees || []).map((f) => [f.id, f]));
  const studentById = new Map((students || []).map((s) => [s.id, s]));
  const records: IncomeRecord[] = [];
  const covered = new Set<string>();

  for (const p of payments || []) {
    const fee = feeById.get(p.feeStructureId);
    const student = studentById.get(p.studentId);
    const scope = parseScope(student?.scope);
    covered.add(`${p.feeStructureId}:${p.studentId}`);
    records.push({
      id: p.id,
      title: fee?.title || 'Fee Payment',
      category: normalizeCategory(fee?.category),
      payerName: student?.fullName || p.studentId,
      studentId: p.studentId,
      rollNo: student?.rollNoOrUSN || scope.rollNo || '',
      classSection: scope.classSectionName || scope.section || '',
      totalFee: fee ? toNumber(fee.amount) : undefined,
      amount: toNumber(p.amount),
      dueDate: fee?.dueDate || undefined,
      parentPhone: student?.parentPhone || '',
      paymentMethod: normalizeMethod(p.paymentMethod),
      paymentDate: p.paymentDate || '',
      status: normalizeStatus(p.status),
      receiptNo: p.receiptNo || '',
      notes: p.notes || undefined,
      feeStructureId: p.feeStructureId,
      paymentId: p.id,
    });
  }

  for (const fee of fees || []) {
    if (fee.status && fee.status !== 'active') continue;
    for (const student of students || []) {
      const key = `${fee.id}:${student.id}`;
      if (covered.has(key)) continue;
      const scope = parseScope(student.scope);
      if (fee.classSectionId) {
        const childClass = scope.classSectionId || '';
        if (childClass && childClass !== fee.classSectionId) continue;
      }
      records.push({
        id: `due_${fee.id}_${student.id}`,
        title: fee.title,
        category: normalizeCategory(fee.category),
        payerName: student.fullName || student.id,
        studentId: student.id,
        rollNo: student.rollNoOrUSN || '',
        classSection: scope.classSectionName || scope.section || '',
        totalFee: toNumber(fee.amount),
        amount: toNumber(fee.amount),
        dueDate: fee.dueDate || undefined,
        parentPhone: student.parentPhone || '',
        paymentMethod: 'upi',
        paymentDate: fee.dueDate || '',
        status: 'pending',
        receiptNo: '',
        feeStructureId: fee.id,
        paymentId: null,
      });
    }
  }

  return records;
}

/** Map parent fee-statement rows (GET /admin/fees/parent) → IncomeRecord[]. */
export function mapParentFees(rows: any[]): IncomeRecord[] {
  return (rows || []).map((row) => ({
    id: row.paymentId || row.id,
    title: row.title || 'Fee',
    category: normalizeCategory(row.category),
    payerName: row.studentName || '',
    studentId: row.studentId || '',
    rollNo: row.rollNo || '',
    totalFee: toNumber(row.amount),
    amount: toNumber(row.amount),
    dueDate: row.dueDate || undefined,
    paymentMethod: normalizeMethod(row.paymentMethod),
    paymentDate: row.paymentDate || '',
    status: normalizeStatus(row.status),
    receiptNo: row.receiptNo || '',
    notes: row.notes || undefined,
    feeStructureId: row.id,
    paymentId: row.paymentId || null,
  }));
}

export interface ExpenseRow {
  id: string;
  institutionCode?: string;
  title: string;
  category?: string;
  payeeName?: string;
  employeeId?: string | null;
  designation?: string | null;
  department?: string | null;
  vehicleNo?: string | null;
  amount: string | number;
  paymentMethod?: string;
  paymentDate?: string | null;
  status?: string;
  invoiceNo?: string | null;
  notes?: string | null;
  dueDate?: string | null;
  scheduleId?: string | null;
  userId?: string | null;
  paidAmount?: string | number | null;
  payrollType?: string | null;
}

const VALID_EXPENSE_CATEGORIES: string[] = [
  'salary',
  'bus_fuel',
  'bus_maintenance',
  'bus_expense',
  'hostel_expense',
  'utility',
  'maintenance',
  'other',
];

export function mapExpenseRecords(rows: ExpenseRow[]): ExpenseRecord[] {
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const cat = (row.category || '').toLowerCase().trim();
    return {
      id: row.id,
      title: row.title || 'Untitled expense',
      category: (VALID_EXPENSE_CATEGORIES.includes(cat) ? cat : 'other') as ExpenseCategory,
      payeeName: row.payeeName || 'Unknown payee',
      employeeId: row.employeeId || undefined,
      designation: row.designation || undefined,
      department: row.department || undefined,
      vehicleNo: row.vehicleNo || undefined,
      amount: toNumber(row.amount),
      paymentMethod: normalizeMethod(row.paymentMethod),
      paymentDate: row.paymentDate || '',
      status: normalizeStatus(row.status),
      invoiceNo: row.invoiceNo || '',
      notes: row.notes || undefined,
      dueDate: row.dueDate || undefined,
      scheduleId: row.scheduleId || undefined,
      userId: row.userId || undefined,
      paidAmount: row.paidAmount === null || row.paidAmount === undefined ? undefined : toNumber(row.paidAmount),
      payrollType:
        row.payrollType === 'salary' || row.payrollType === 'bonus' ? row.payrollType : undefined,
    };
  });
}
