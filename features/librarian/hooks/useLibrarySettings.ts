import { useState, useEffect, useCallback } from 'react';
import {
  getLibrarySettingsApi,
  updateLibrarySettingsApi,
  LibrarySettings,
  UpdateLibrarySettingsPayload,
} from '../../../api/library';

export function useLibrarySettings() {
  const [settings, setSettings] = useState<LibrarySettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getLibrarySettingsApi();
      setSettings(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch library settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (payload: UpdateLibrarySettingsPayload): Promise<LibrarySettings> => {
    const updated = await updateLibrarySettingsApi(payload);
    setSettings(updated);
    return updated;
  };

  return {
    settings,
    loading,
    error,
    refetch: fetchSettings,
    updateSettings,
  };
}
