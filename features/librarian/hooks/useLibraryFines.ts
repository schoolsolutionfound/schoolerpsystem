import { useState, useEffect, useCallback } from 'react';
import {
  getFinesApi,
  payFineApi,
  waiveFineApi,
  createDamageFineApi,
  FineFilters,
  PayFinePayload,
  WaiveFinePayload,
  CreateDamageFinePayload,
} from '../../../api/library';
import { Fine, FineType, FineStatus } from '../types';

export function useLibraryFines(initialFilters?: FineFilters) {
  const [fines, setFines] = useState<Fine[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFines = useCallback(async (filters?: FineFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getFinesApi(filters || initialFilters);
      const itemsList = Array.isArray(res) ? res : res?.items || [];
      const totalCount = Array.isArray(res) ? res.length : (res?.total ?? itemsList.length);

      const mapped: Fine[] = itemsList.map((f: any) => ({
        id: f.id,
        loanId: f.loanId || undefined,
        bookCopyId: f.copyId || f.bookCopyId || undefined,
        copyId: f.copyId || f.bookCopyId || undefined,
        studentId: f.studentId,
        fineType: (f.fineType as FineType) || 'OVERDUE',
        damageType: f.damageType || undefined,
        damageNotes: f.damageNotes || f.reason || undefined,
        reason: f.reason || undefined,
        amount: typeof f.amount === 'string' ? parseFloat(f.amount) || 0 : (f.amount || 0),
        paidAmount: typeof f.paidAmount === 'string' ? parseFloat(f.paidAmount) || 0 : (f.paidAmount || 0),
        status: (f.status as FineStatus) || 'UNPAID',
        waivedBy: f.waivedBy || undefined,
        waivedReason: f.waivedReason || undefined,
        createdAt: f.createdAt ? String(f.createdAt).split('T')[0] : new Date().toISOString().split('T')[0],
        updatedAt: f.updatedAt ? String(f.updatedAt).split('T')[0] : new Date().toISOString().split('T')[0],
        paymentTransactions: f.paymentTransactions || [],
      }));

      setFines(mapped);
      setTotal(totalCount);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch fines');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const payFine = async (id: string, payload: PayFinePayload) => {
    const res = await payFineApi(id, payload);
    await fetchFines();
    return res;
  };

  const waiveFine = async (id: string, payload: WaiveFinePayload) => {
    const res = await waiveFineApi(id, payload);
    await fetchFines();
    return res;
  };

  const createDamageFine = async (payload: CreateDamageFinePayload) => {
    const res = await createDamageFineApi(payload);
    await fetchFines();
    return res;
  };

  return {
    fines,
    total,
    loading,
    error,
    refetch: fetchFines,
    payFine,
    waiveFine,
    createDamageFine,
  };
}
