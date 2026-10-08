import { describe, it, expect } from 'vitest';
import { mapFeeData, mapParentFees } from '../../features/accountant/utils/feeMappers';

const fees = [
  {
    id: 'fs_1',
    title: 'Term 1 Tuition',
    category: 'student_fee',
    amount: '15000',
    dueDate: '2026-10-15',
    status: 'active',
    classSectionId: null,
  },
  {
    id: 'fs_2',
    title: 'Archived Fee',
    category: 'student_fee',
    amount: '100',
    status: 'archived',
  },
];

const students = [
  {
    id: 'stu_1',
    fullName: 'Asha Rao',
    rollNoOrUSN: 'USN01',
    scope: JSON.stringify({ classSectionName: '10-A', section: 'A' }),
    parentPhone: '9999999999',
  },
  {
    id: 'stu_2',
    fullName: 'Ben Park',
    rollNoOrUSN: 'USN02',
    scope: '{}',
  },
];

const payments = [
  {
    id: 'fp_1',
    feeStructureId: 'fs_1',
    studentId: 'stu_1',
    amount: '15000',
    paymentMethod: 'upi',
    paymentDate: '2026-09-20',
    status: 'paid',
    receiptNo: 'REC-1001',
    notes: null,
  },
];

describe('mapFeeData', () => {
  it('maps payments to paid IncomeRecords with joined student/fee data', () => {
    const records = mapFeeData(fees as any, payments as any, students as any);
    const paid = records.find((r) => r.id === 'fp_1');
    expect(paid).toBeDefined();
    expect(paid!.status).toBe('paid');
    expect(paid!.title).toBe('Term 1 Tuition');
    expect(paid!.payerName).toBe('Asha Rao');
    expect(paid!.amount).toBe(15000);
    expect(paid!.receiptNo).toBe('REC-1001');
    expect(paid!.paymentMethod).toBe('upi');
    expect(paid!.feeStructureId).toBe('fs_1');
    expect(paid!.paymentId).toBe('fp_1');
    expect(paid!.classSection).toBe('10-A');
  });

  it('creates pending dues for students without a payment', () => {
    const records = mapFeeData(fees as any, payments as any, students as any);
    const pendingForStu2 = records.filter((r) => r.studentId === 'stu_2' && r.status === 'pending');
    expect(pendingForStu2.length).toBeGreaterThanOrEqual(1);
    const due = pendingForStu2.find((r) => r.feeStructureId === 'fs_1');
    expect(due).toBeDefined();
    expect(due!.amount).toBe(15000);
    expect(due!.paymentId).toBeNull();
  });

  it('skips archived fee structures for pending dues', () => {
    const records = mapFeeData(fees as any, [], students as any);
    expect(records.some((r) => r.feeStructureId === 'fs_2')).toBe(false);
  });

  it('returns only payment-based records when student list is empty', () => {
    const records = mapFeeData(fees as any, payments as any, []);
    // student missing → payerName falls back to studentId
    expect(records).toHaveLength(1);
    expect(records[0].payerName).toBe('stu_1');
  });

  it('handles empty inputs', () => {
    expect(mapFeeData([], [], [])).toEqual([]);
  });

  it('normalizes invalid category/method/status', () => {
    const records = mapFeeData(
      [{ id: 'f', title: 'X', category: 'weird', amount: '10', status: 'active' }] as any,
      [
        {
          id: 'p',
          feeStructureId: 'f',
          studentId: 's',
          amount: '10',
          paymentMethod: 'bitcoin',
          status: 'zzz',
        },
      ] as any,
      []
    );
    expect(records[0].category).toBe('student_fee');
    expect(records[0].paymentMethod).toBe('upi');
    expect(records[0].status).toBe('pending');
  });
});

describe('mapParentFees', () => {
  it('maps parent statement rows to IncomeRecords', () => {
    const rows = [
      {
        id: 'fs_1',
        title: 'Term 1',
        category: 'student_fee',
        amount: 5000,
        status: 'paid',
        studentId: 's1',
        studentName: 'Kid',
        rollNo: 'R1',
        paymentId: 'fp_9',
        paymentDate: '2026-09-01',
        receiptNo: 'REC-9',
        paymentMethod: 'cash',
        dueDate: '2026-09-15',
        notes: null,
      },
    ];
    const out = mapParentFees(rows);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('fp_9');
    expect(out[0].status).toBe('paid');
    expect(out[0].amount).toBe(5000);
    expect(out[0].receiptNo).toBe('REC-9');
    expect(out[0].paymentMethod).toBe('cash');
  });

  it('uses structure id when no payment yet', () => {
    const out = mapParentFees([
      { id: 'fs_2', title: 'Bus', amount: '2000', status: 'pending', category: 'bus_fee' },
    ]);
    expect(out[0].id).toBe('fs_2');
    expect(out[0].status).toBe('pending');
    expect(out[0].amount).toBe(2000);
    expect(out[0].category).toBe('bus_fee');
  });

  it('handles empty array', () => {
    expect(mapParentFees([])).toEqual([]);
    expect(mapParentFees(undefined as any)).toEqual([]);
  });
});
