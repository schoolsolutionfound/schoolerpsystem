import { useState, useCallback } from 'react';
import {
  getBookCopiesApi,
  createCopyApi,
  updateCopyApi,
  deleteCopyApi,
  LibraryBookCopy,
  CreateCopyPayload,
  UpdateCopyPayload,
} from '../../../api/library';

export function useLibraryBookCopies() {
  const [copies, setCopies] = useState<LibraryBookCopy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCopies = useCallback(async (bookId: string) => {
    if (!bookId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getBookCopiesApi(bookId);
      setCopies(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch book copies');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCopy = async (bookId: string, payload: CreateCopyPayload): Promise<LibraryBookCopy> => {
    const newCopy = await createCopyApi(bookId, payload);
    await fetchCopies(bookId);
    return newCopy;
  };

  const updateCopy = async (id: string, bookId: string, payload: UpdateCopyPayload): Promise<LibraryBookCopy> => {
    const updated = await updateCopyApi(id, payload);
    await fetchCopies(bookId);
    return updated;
  };

  const deleteCopy = async (id: string, bookId: string): Promise<void> => {
    await deleteCopyApi(id);
    await fetchCopies(bookId);
  };

  return {
    copies,
    loading,
    error,
    fetchCopies,
    createCopy,
    updateCopy,
    deleteCopy,
    setCopies,
  };
}
