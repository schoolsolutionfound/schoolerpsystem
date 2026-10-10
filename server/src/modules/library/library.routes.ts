import { FastifyInstance } from 'fastify';
import {
  listBooksHandler,
  getBookByIdHandler,
  createBookHandler,
  updateBookHandler,
  deleteBookHandler,
  listCategoriesHandler,
  getCategoryByIdHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listAuthorsHandler,
  createAuthorHandler,
  listCopiesByBookHandler,
  getCopyByIdHandler,
  createCopyHandler,
  updateCopyHandler,
  deleteCopyHandler,
  listLoansHandler,
  issueBookHandler,
  returnBookHandler,
  renewBookHandler,
  listFinesHandler,
  payFineHandler,
  waiveFineHandler,
  assessDamageFineHandler,
  listQuestionPapersHandler,
  createQuestionPaperHandler,
  deleteQuestionPaperHandler,
  incrementPYQDownloadHandler,
  getSettingsHandler,
  updateSettingsHandler,
  listMembersHandler,
  getMemberDetailsHandler,
  getDashboardStatsHandler,
} from './library.controller.js';
import { authenticate, requireLibraryStaff } from '../shared/middleware/auth.js';

/**
 * Catalog reads (books/categories/authors/copies/PYQs) stay open to any
 * authenticated user. Loans, fines, members (PII + money) and settings are
 * library-staff only.
 */
export async function libraryRoutes(fastify: FastifyInstance) {
  // Books
  fastify.get('/books', { preHandler: [authenticate] }, (req, reply) => listBooksHandler(req, reply));
  fastify.get('/books/:id', { preHandler: [authenticate] }, (req: any, reply) => getBookByIdHandler(req, reply));
  fastify.post('/books', { preHandler: [requireLibraryStaff] }, (req, reply) => createBookHandler(req, reply));
  fastify.put('/books/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => updateBookHandler(req, reply));
  fastify.patch('/books/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => updateBookHandler(req, reply));
  fastify.delete('/books/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => deleteBookHandler(req, reply));

  // Categories
  fastify.get('/categories', { preHandler: [authenticate] }, (req, reply) => listCategoriesHandler(req, reply));
  fastify.get('/categories/:id', { preHandler: [authenticate] }, (req: any, reply) => getCategoryByIdHandler(req, reply));
  fastify.post('/categories', { preHandler: [requireLibraryStaff] }, (req, reply) => createCategoryHandler(req, reply));
  fastify.put('/categories/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => updateCategoryHandler(req, reply));
  fastify.patch('/categories/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => updateCategoryHandler(req, reply));
  fastify.delete('/categories/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => deleteCategoryHandler(req, reply));

  // Authors
  fastify.get('/authors', { preHandler: [authenticate] }, (req, reply) => listAuthorsHandler(req, reply));
  fastify.post('/authors', { preHandler: [requireLibraryStaff] }, (req, reply) => createAuthorHandler(req, reply));

  // Physical Book Copies
  fastify.get('/books/:bookId/copies', { preHandler: [authenticate] }, (req: any, reply) => listCopiesByBookHandler(req, reply));
  fastify.get('/copies/:id', { preHandler: [authenticate] }, (req: any, reply) => getCopyByIdHandler(req, reply));
  fastify.post('/books/:bookId/copies', { preHandler: [requireLibraryStaff] }, (req: any, reply) => createCopyHandler(req, reply));
  fastify.put('/copies/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => updateCopyHandler(req, reply));
  fastify.patch('/copies/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => updateCopyHandler(req, reply));
  fastify.delete('/copies/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => deleteCopyHandler(req, reply));

  // Loans / Circulation (PII — staff only, incl. reads)
  fastify.get('/loans', { preHandler: [requireLibraryStaff] }, (req, reply) => listLoansHandler(req, reply));
  fastify.post('/loans/issue', { preHandler: [requireLibraryStaff] }, (req, reply) => issueBookHandler(req, reply));
  fastify.post('/loans/:id/return', { preHandler: [requireLibraryStaff] }, (req: any, reply) => returnBookHandler(req, reply));
  fastify.post('/loans/:id/renew', { preHandler: [requireLibraryStaff] }, (req: any, reply) => renewBookHandler(req, reply));

  // Fines & Payments (money — staff only, incl. reads)
  fastify.get('/fines', { preHandler: [requireLibraryStaff] }, (req, reply) => listFinesHandler(req, reply));
  fastify.post('/fines/:id/pay', { preHandler: [requireLibraryStaff] }, (req: any, reply) => payFineHandler(req, reply));
  fastify.post('/fines/:id/waive', { preHandler: [requireLibraryStaff] }, (req: any, reply) => waiveFineHandler(req, reply));
  fastify.post('/fines/damage', { preHandler: [requireLibraryStaff] }, (req, reply) => assessDamageFineHandler(req, reply));

  // Past Year Question Papers (catalog reads stay open)
  fastify.get('/pyqs', { preHandler: [authenticate] }, (req, reply) => listQuestionPapersHandler(req, reply));
  fastify.post('/pyqs', { preHandler: [requireLibraryStaff] }, (req, reply) => createQuestionPaperHandler(req, reply));
  fastify.delete('/pyqs/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => deleteQuestionPaperHandler(req, reply));
  fastify.post('/pyqs/:id/download', { preHandler: [authenticate] }, (req: any, reply) => incrementPYQDownloadHandler(req, reply));

  // Settings
  fastify.get('/settings', { preHandler: [requireLibraryStaff] }, (req, reply) => getSettingsHandler(req, reply));
  fastify.put('/settings', { preHandler: [requireLibraryStaff] }, (req, reply) => updateSettingsHandler(req, reply));
  fastify.patch('/settings', { preHandler: [requireLibraryStaff] }, (req, reply) => updateSettingsHandler(req, reply));

  // Members / Students (PII — staff only)
  fastify.get('/members', { preHandler: [requireLibraryStaff] }, (req, reply) => listMembersHandler(req, reply));
  fastify.get('/members/:id', { preHandler: [requireLibraryStaff] }, (req: any, reply) => getMemberDetailsHandler(req, reply));

  // Dashboard & Reports (financials — staff only)
  fastify.get('/dashboard', { preHandler: [requireLibraryStaff] }, (req, reply) => getDashboardStatsHandler(req, reply));
  fastify.get('/reports', { preHandler: [requireLibraryStaff] }, (req, reply) => getDashboardStatsHandler(req, reply));
}
