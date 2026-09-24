import { useState, useEffect, useCallback } from 'react';
import {
  getBooksApi,
  createBookApi,
  updateBookApi,
  deleteBookApi,
  BookFilters,
  CreateBookPayload,
  UpdateBookPayload,
} from '../../../api/library';
import { Book, BookType } from '../types';

export function useLibraryBooks(initialFilters?: BookFilters) {
  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async (filters?: BookFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBooksApi(filters || initialFilters);
      const itemsList = Array.isArray(res) ? res : res?.items || [];
      const totalCount = Array.isArray(res) ? res.length : (res?.total ?? itemsList.length);

      const mapped: Book[] = itemsList.map((b: any) => ({
        id: b.id,
        title: b.title,
        isbn: b.isbn,
        publisher: b.publisher || undefined,
        edition: b.edition || undefined,
        publicationYear: b.publicationYear || undefined,
        language: b.language || 'English',
        categoryId: b.categoryId || '',
        subject: b.subject || undefined,
        description: b.description || undefined,
        bookType: (b.bookType as BookType) || 'TEXTBOOK',
        coverImage: b.coverImage || undefined,
        totalCopies: b.totalCopies || 0,
        availableCopies: b.availableCopies || 0,
        keywords: b.keywords || [],
        authorIds: b.authorIds || [],
        authors: b.authors || undefined,
        shelfLocation: b.shelfLocation || undefined,
        pages: b.pages || undefined,
        createdAt: b.createdAt ? String(b.createdAt) : undefined,
        updatedAt: b.updatedAt ? String(b.updatedAt) : undefined,
      }));

      setBooks(mapped);
      setTotal(totalCount);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch library books');
    } finally {
      setLoading(false);
    }
  }, [initialFilters]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const createBook = async (payload: CreateBookPayload): Promise<any> => {
    const newBook = await createBookApi(payload);
    await fetchBooks();
    return newBook;
  };

  const updateBook = async (id: string, payload: UpdateBookPayload): Promise<any> => {
    const updated = await updateBookApi(id, payload);
    await fetchBooks();
    return updated;
  };

  const deleteBook = async (id: string): Promise<void> => {
    await deleteBookApi(id);
    await fetchBooks();
  };

  return {
    books,
    total,
    loading,
    error,
    refetch: fetchBooks,
    createBook,
    updateBook,
    deleteBook,
  };
}
