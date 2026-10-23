import { useState, useEffect, useCallback } from 'react';
import {
  getCopiesApi,
  getBookCopiesApi,
  createCopyApi,
  updateCopyApi,
  deleteCopyApi,
  LibraryBookCopy,
  CreateCopyPayload,
  UpdateCopyPayload,
} from '../../../api/library';

function mergeCopies(current: LibraryBookCopy[], incoming: LibraryBookCopy[]): LibraryBookCopy[] {
  const byId = new Map(current.map((copy) => [copy.id, copy]));
  incoming.forEach((copy) => byId.set(copy.id, copy));
  return Array.from(byId.values());
}

export function useLibraryBookCopies() {
  const [copies, setCopies] = useState<LibraryBookCopy[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCopies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCopiesApi();
      setCopies(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch physical copies');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCopies = useCallback(async (bookId: string) => {
    if (!bookId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getBookCopiesApi(bookId);
      const bookCopies = Array.isArray(res) ? res : [];
      setCopies((current) => mergeCopies(current, bookCopies));
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch book copies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCopies();
  }, [fetchAllCopies]);

  const createCopy = async (bookId: string, payload: CreateCopyPayload): Promise<LibraryBookCopy> => {
    const newCopy = await createCopyApi(bookId, payload);
    setCopies((current) => mergeCopies(current, [newCopy]));
    return newCopy;
  };

  const updateCopy = async (id: string, _bookId: string, payload: UpdateCopyPayload): Promise<LibraryBookCopy> => {
    const updated = await updateCopyApi(id, payload);
    setCopies((current) => mergeCopies(current, [updated]));
    return updated;
  };

  const deleteCopy = async (id: string, _bookId: string): Promise<void> => {
    await deleteCopyApi(id);
    setCopies((current) => current.filter((copy) => copy.id !== id));
  };

  return {
    copies,
    loading,
    error,
    fetchAllCopies,
    fetchCopies,
    createCopy,
    updateCopy,
    deleteCopy,
    setCopies,
  };
}
