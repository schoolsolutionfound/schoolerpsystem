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
import { authenticate, requireStaff } from '../shared/middleware/auth.js';

export async function libraryRoutes(fastify: FastifyInstance) {
  // Books
  fastify.get('/books', { preHandler: [authenticate] }, (req, reply) => listBooksHandler(req, reply));
  fastify.get('/books/:id', { preHandler: [authenticate] }, (req: any, reply) => getBookByIdHandler(req, reply));
  fastify.post('/books', { preHandler: [requireStaff] }, (req, reply) => createBookHandler(req, reply));
  fastify.put('/books/:id', { preHandler: [requireStaff] }, (req: any, reply) => updateBookHandler(req, reply));
  fastify.patch('/books/:id', { preHandler: [requireStaff] }, (req: any, reply) => updateBookHandler(req, reply));
  fastify.delete('/books/:id', { preHandler: [requireStaff] }, (req: any, reply) => deleteBookHandler(req, reply));

  // Categories
  fastify.get('/categories', { preHandler: [authenticate] }, (req, reply) => listCategoriesHandler(req, reply));
  fastify.get('/categories/:id', { preHandler: [authenticate] }, (req: any, reply) => getCategoryByIdHandler(req, reply));
  fastify.post('/categories', { preHandler: [requireStaff] }, (req, reply) => createCategoryHandler(req, reply));
  fastify.put('/categories/:id', { preHandler: [requireStaff] }, (req: any, reply) => updateCategoryHandler(req, reply));
  fastify.patch('/categories/:id', { preHandler: [requireStaff] }, (req: any, reply) => updateCategoryHandler(req, reply));
  fastify.delete('/categories/:id', { preHandler: [requireStaff] }, (req: any, reply) => deleteCategoryHandler(req, reply));

  // Authors
  fastify.get('/authors', { preHandler: [authenticate] }, (req, reply) => listAuthorsHandler(req, reply));
  fastify.post('/authors', { preHandler: [requireStaff] }, (req, reply) => createAuthorHandler(req, reply));

  // Physical Book Copies
  fastify.get('/books/:bookId/copies', { preHandler: [authenticate] }, (req: any, reply) => listCopiesByBookHandler(req, reply));
  fastify.get('/copies/:id', { preHandler: [authenticate] }, (req: any, reply) => getCopyByIdHandler(req, reply));
  fastify.post('/books/:bookId/copies', { preHandler: [requireStaff] }, (req: any, reply) => createCopyHandler(req, reply));
  fastify.put('/copies/:id', { preHandler: [requireStaff] }, (req: any, reply) => updateCopyHandler(req, reply));
  fastify.patch('/copies/:id', { preHandler: [requireStaff] }, (req: any, reply) => updateCopyHandler(req, reply));
  fastify.delete('/copies/:id', { preHandler: [requireStaff] }, (req: any, reply) => deleteCopyHandler(req, reply));

  // Loans / Circulation
  fastify.get('/loans', { preHandler: [authenticate] }, (req, reply) => listLoansHandler(req, reply));
  fastify.post('/loans/issue', { preHandler: [requireStaff] }, (req, reply) => issueBookHandler(req, reply));
  fastify.post('/loans/:id/return', { preHandler: [requireStaff] }, (req: any, reply) => returnBookHandler(req, reply));
  fastify.post('/loans/:id/renew', { preHandler: [requireStaff] }, (req: any, reply) => renewBookHandler(req, reply));

  // Fines & Payments
  fastify.get('/fines', { preHandler: [authenticate] }, (req, reply) => listFinesHandler(req, reply));
  fastify.post('/fines/:id/pay', { preHandler: [requireStaff] }, (req: any, reply) => payFineHandler(req, reply));
  fastify.post('/fines/:id/waive', { preHandler: [requireStaff] }, (req: any, reply) => waiveFineHandler(req, reply));
  fastify.post('/fines/damage', { preHandler: [requireStaff] }, (req, reply) => assessDamageFineHandler(req, reply));

  // Past Year Question Papers (PYQs)
  fastify.get('/pyqs', { preHandler: [authenticate] }, (req, reply) => listQuestionPapersHandler(req, reply));
  fastify.post('/pyqs', { preHandler: [requireStaff] }, (req, reply) => createQuestionPaperHandler(req, reply));
  fastify.delete('/pyqs/:id', { preHandler: [requireStaff] }, (req: any, reply) => deleteQuestionPaperHandler(req, reply));
  fastify.post('/pyqs/:id/download', { preHandler: [authenticate] }, (req: any, reply) => incrementPYQDownloadHandler(req, reply));

  // Settings
  fastify.get('/settings', { preHandler: [authenticate] }, (req, reply) => getSettingsHandler(req, reply));
  fastify.put('/settings', { preHandler: [requireStaff] }, (req, reply) => updateSettingsHandler(req, reply));
  fastify.patch('/settings', { preHandler: [requireStaff] }, (req, reply) => updateSettingsHandler(req, reply));

  // Members / Students
  fastify.get('/members', { preHandler: [authenticate] }, (req, reply) => listMembersHandler(req, reply));
  fastify.get('/members/:id', { preHandler: [authenticate] }, (req: any, reply) => getMemberDetailsHandler(req, reply));

  // Dashboard & Reports
  fastify.get('/dashboard', { preHandler: [authenticate] }, (req, reply) => getDashboardStatsHandler(req, reply));
  fastify.get('/reports', { preHandler: [authenticate] }, (req, reply) => getDashboardStatsHandler(req, reply));
}
