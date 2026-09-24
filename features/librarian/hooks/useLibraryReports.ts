import { useState, useEffect, useCallback } from 'react';
import { getLibraryReportsApi, LibraryReportStats } from '../../../api/library';

export function useLibraryReports() {
  const [reports, setReports] = useState<LibraryReportStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLibraryReportsApi();
      setReports(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch library reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    refetch: fetchReports,
  };
}
