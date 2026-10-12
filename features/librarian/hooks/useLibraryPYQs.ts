import { useState, useEffect, useCallback } from 'react';
import {
  getPYQsApi,
  createPYQApi,
  deletePYQApi,
  trackPYQDownloadApi,
  LibraryPYQ,
  PYQFilters,
  CreatePYQPayload,
} from '../../../api/library';

export function useLibraryPYQs(initialFilters?: PYQFilters) {
  const [pyqs, setPyqs] = useState<LibraryPYQ[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPYQs = useCallback(async (filters?: PYQFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPYQsApi(filters || initialFilters);
      if (Array.isArray(res)) {
        setPyqs(res);
        setTotal(res.length);
      } else if (res && Array.isArray(res.items)) {
        setPyqs(res.items);
        setTotal(res.total ?? res.items.length);
      } else {
        setPyqs([]);
        setTotal(0);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch PYQs');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchPYQs();
  }, [fetchPYQs]);

  const createPYQ = async (payload: CreatePYQPayload): Promise<LibraryPYQ> => {
    const created = await createPYQApi(payload);
    await fetchPYQs();
    return created;
  };

  const deletePYQ = async (id: string): Promise<void> => {
    await deletePYQApi(id);
    await fetchPYQs();
  };

  const trackDownload = async (id: string): Promise<LibraryPYQ> => {
    const updated = await trackPYQDownloadApi(id);
    await fetchPYQs();
    return updated;
  };

  return {
    pyqs,
    total,
    loading,
    error,
    refetch: fetchPYQs,
    createPYQ,
    deletePYQ,
    trackDownload,
  };
}
