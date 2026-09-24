import { useState, useEffect, useCallback } from 'react';
import { getLibraryDashboardApi, LibraryDashboardStats } from '../../../api/library';

export function useLibraryDashboard() {
  const [stats, setStats] = useState<LibraryDashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLibraryDashboardApi();
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch library dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
