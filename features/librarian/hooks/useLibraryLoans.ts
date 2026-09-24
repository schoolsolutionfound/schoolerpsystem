import { useState, useEffect, useCallback } from 'react';
import {
  getLoansApi,
  issueBookApi,
  returnBookApi,
  renewLoanApi,
  LoanFilters,
  IssueBookPayload,
  ReturnBookPayload,
  RenewLoanPayload,
} from '../../../api/library';
import { Loan, LoanStatus } from '../types';

export function useLibraryLoans(initialFilters?: LoanFilters) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = useCallback(async (filters?: LoanFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLoansApi(filters || initialFilters);
      const itemsList = Array.isArray(res) ? res : res?.items || [];
      const totalCount = Array.isArray(res) ? res.length : (res?.total ?? itemsList.length);

      const mapped: Loan[] = itemsList.map((l: any) => ({
        id: l.id,
        copyId: l.copyId,
        bookId: l.bookId,
        studentId: l.studentId,
        issuedBy: l.issuedBy || 'Staff',
        issueDate: l.issuedAt ? String(l.issuedAt).split('T')[0] : (l.issueDate || ''),
        issuedAt: l.issuedAt ? String(l.issuedAt) : undefined,
        dueDate: l.dueDate ? String(l.dueDate).split('T')[0] : '',
        returnDate: l.returnedAt ? String(l.returnedAt).split('T')[0] : (l.returnDate || undefined),
        returnedAt: l.returnedAt ? String(l.returnedAt) : undefined,
        status: (l.status as LoanStatus) || 'ACTIVE',
        renewalCount: l.renewalCount || 0,
        createdAt: l.createdAt ? String(l.createdAt) : undefined,
        updatedAt: l.updatedAt ? String(l.updatedAt) : undefined,
      }));

      setLoans(mapped);
      setTotal(totalCount);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch loans');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const issueBook = async (payload: IssueBookPayload): Promise<any> => {
    const loan = await issueBookApi(payload);
    await fetchLoans();
    return loan;
  };

  const returnBook = async (id: string, payload?: ReturnBookPayload) => {
    const result = await returnBookApi(id, payload);
    await fetchLoans();
    return result;
  };

  const renewLoan = async (id: string, payload?: RenewLoanPayload): Promise<any> => {
    const updated = await renewLoanApi(id, payload);
    await fetchLoans();
    return updated;
  };

  return {
    loans,
    total,
    loading,
    error,
    refetch: fetchLoans,
    issueBook,
    returnBook,
    renewLoan,
  };
}
