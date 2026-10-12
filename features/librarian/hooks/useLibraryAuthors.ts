import { useState, useEffect, useCallback } from 'react';
import {
  getAuthorsApi,
  createAuthorApi,
  LibraryAuthor,
  CreateAuthorPayload,
} from '../../../api/library';

export function useLibraryAuthors() {
  const [authors, setAuthors] = useState<LibraryAuthor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuthorsApi();
      setAuthors(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch authors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const createAuthor = async (payload: CreateAuthorPayload): Promise<LibraryAuthor> => {
    const newAuthor = await createAuthorApi(payload);
    await fetchAuthors();
    return newAuthor;
  };

  return {
    authors,
    loading,
    error,
    refetch: fetchAuthors,
    createAuthor,
  };
}
