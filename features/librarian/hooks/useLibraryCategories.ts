import { useState, useEffect, useCallback } from 'react';
import {
  getCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  LibraryCategory,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../../../api/library';

export function useLibraryCategories() {
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCategoriesApi();
      setCategories(Array.isArray(res) ? res : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (payload: CreateCategoryPayload): Promise<LibraryCategory> => {
    const newCat = await createCategoryApi(payload);
    await fetchCategories();
    return newCat;
  };

  const updateCategory = async (id: string, payload: UpdateCategoryPayload): Promise<LibraryCategory> => {
    const updated = await updateCategoryApi(id, payload);
    await fetchCategories();
    return updated;
  };

  const deleteCategory = async (id: string): Promise<void> => {
    await deleteCategoryApi(id);
    await fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
