import { FastifyRequest, FastifyReply } from 'fastify';
import { libraryService } from './library.service.js';
import {
  CreateBookSchema,
  UpdateBookSchema,
  BookQuerySchema,
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateAuthorSchema,
  UpdateAuthorSchema,
  CreateCopySchema,
  UpdateCopySchema,
  IssueBookSchema,
  ReturnBookSchema,
  RenewBookSchema,
  LoanQuerySchema,
  PayFineSchema,
  WaiveFineSchema,
  CreateDamageFineSchema,
  FineQuerySchema,
  CreatePYQSchema,
  PYQQuerySchema,
  UpdateLibrarySettingsSchema,
  MemberQuerySchema,
} from './library.schema.js';

function getInstCode(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.institutionCode || '';
}

function getUserId(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.uid || user?.id || '';
}

function getUserName(req: FastifyRequest): string {
  const user = (req as any).user;
  return user?.fullName || user?.name || user?.email || 'Librarian Staff';
}

function parseZod(err: any) {
  if (err?.name === 'ZodError') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: err.errors?.[0]?.message || 'Invalid input data',
    };
  }
  return err;
}

function sendError(reply: FastifyReply, err: any, fallbackMsg: string) {
  const parsed = parseZod(err);
  return reply.status(parsed.statusCode || 500).send({
    success: false,
    error: {
      message: parsed.message || fallbackMsg,
      code: parsed.code || 'INTERNAL_ERROR',
    },
  });
}

// ==================== BOOKS ====================

export async function listBooksHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = BookQuerySchema.parse(request.query || {});
    const data = await libraryService.listBooks(getInstCode(request), query, { limit: query.limit, offset: query.offset });
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch library books');
  }
}

export async function getBookByIdHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const data = await libraryService.getBook(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch book details');
  }
}

export async function createBookHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateBookSchema.parse(request.body);
    const data = await libraryService.createBook(getInstCode(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to create book entry');
  }
}

export async function updateBookHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = UpdateBookSchema.parse(request.body);
    const data = await libraryService.updateBook(getInstCode(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to update book entry');
  }
}

export async function deleteBookHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await libraryService.deleteBook(getInstCode(request), request.params.id);
    return reply.send({ success: true, message: 'Book deleted successfully' });
  } catch (err) {
    return sendError(reply, err, 'Failed to delete book entry');
  }
}

// ==================== CATEGORIES ====================

export async function listCategoriesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await libraryService.listCategories(getInstCode(request));
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch book categories');
  }
}

export async function getCategoryByIdHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const data = await libraryService.getCategory(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch category details');
  }
}

export async function createCategoryHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateCategorySchema.parse(request.body);
    const data = await libraryService.createCategory(getInstCode(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to create book category');
  }
}

export async function updateCategoryHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = UpdateCategorySchema.parse(request.body);
    const data = await libraryService.updateCategory(getInstCode(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to update category');
  }
}

export async function deleteCategoryHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await libraryService.deleteCategory(getInstCode(request), request.params.id);
    return reply.send({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    return sendError(reply, err, 'Failed to delete category');
  }
}

// ==================== AUTHORS ====================

export async function listAuthorsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await libraryService.listAuthors(getInstCode(request));
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch authors');
  }
}

export async function createAuthorHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateAuthorSchema.parse(request.body);
    const data = await libraryService.createAuthor(getInstCode(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to create author');
  }
}

// ==================== PHYSICAL COPIES ====================

export async function listCopiesByBookHandler(request: FastifyRequest<{ Params: { bookId: string } }>, reply: FastifyReply) {
  try {
    const data = await libraryService.listCopiesByBook(getInstCode(request), request.params.bookId);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch book copies');
  }
}

export async function getCopyByIdHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const data = await libraryService.getCopy(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch copy details');
  }
}

export async function createCopyHandler(request: FastifyRequest<{ Params: { bookId: string } }>, reply: FastifyReply) {
  try {
    const body = CreateCopySchema.parse(request.body);
    const data = await libraryService.createCopy(getInstCode(request), request.params.bookId, body);
    return reply.status(201).send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to create physical copy');
  }
}

export async function updateCopyHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = UpdateCopySchema.parse(request.body);
    const data = await libraryService.updateCopy(getInstCode(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to update physical copy');
  }
}

export async function deleteCopyHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await libraryService.deleteCopy(getInstCode(request), request.params.id);
    return reply.send({ success: true, message: 'Copy deleted successfully' });
  } catch (err) {
    return sendError(reply, err, 'Failed to delete physical copy');
  }
}

// ==================== LOANS / ISSUE / RETURN ====================

export async function listLoansHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = LoanQuerySchema.parse(request.query || {});
    const data = await libraryService.listLoans(getInstCode(request), query, { limit: query.limit, offset: query.offset });
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch library loans');
  }
}

export async function issueBookHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = IssueBookSchema.parse(request.body);
    const data = await libraryService.issueBook(getInstCode(request), getUserId(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to issue book loan');
  }
}

export async function returnBookHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = ReturnBookSchema.parse(request.body || {});
    const data = await libraryService.returnBook(getInstCode(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to process book return');
  }
}

export async function renewBookHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = RenewBookSchema.parse(request.body || {});
    const data = await libraryService.renewBook(getInstCode(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to renew book loan');
  }
}

// ==================== FINES & PAYMENTS ====================

export async function listFinesHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = FineQuerySchema.parse(request.query || {});
    const data = await libraryService.listFines(getInstCode(request), query, { limit: query.limit, offset: query.offset });
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch fines ledger');
  }
}

export async function payFineHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = PayFineSchema.parse(request.body);
    const data = await libraryService.payFine(getInstCode(request), getUserName(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to process fine payment');
  }
}

export async function waiveFineHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const body = WaiveFineSchema.parse(request.body);
    const data = await libraryService.waiveFine(getInstCode(request), getUserName(request), request.params.id, body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to process fine waiver');
  }
}

export async function assessDamageFineHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreateDamageFineSchema.parse(request.body);
    const data = await libraryService.assessDamageFine(getInstCode(request), getUserName(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to assess damage fine');
  }
}

// ==================== PYQS ====================

export async function listQuestionPapersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = PYQQuerySchema.parse(request.query || {});
    const data = await libraryService.listQuestionPapers(getInstCode(request), query, { limit: query.limit, offset: query.offset });
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch question papers archive');
  }
}

export async function createQuestionPaperHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = CreatePYQSchema.parse(request.body);
    const data = await libraryService.createQuestionPaper(getInstCode(request), getUserName(request), body);
    return reply.status(201).send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to upload question paper');
  }
}

export async function deleteQuestionPaperHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    await libraryService.deleteQuestionPaper(getInstCode(request), request.params.id);
    return reply.send({ success: true, message: 'Question paper deleted' });
  } catch (err) {
    return sendError(reply, err, 'Failed to delete question paper');
  }
}

export async function incrementPYQDownloadHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const data = await libraryService.incrementPYQDownload(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to record download');
  }
}

// ==================== SETTINGS ====================

export async function getSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await libraryService.getSettings(getInstCode(request));
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch library settings');
  }
}

export async function updateSettingsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const body = UpdateLibrarySettingsSchema.parse(request.body);
    const data = await libraryService.updateSettings(getInstCode(request), body);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to update library settings');
  }
}

// ==================== MEMBERS ====================

export async function listMembersHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const query = MemberQuerySchema.parse(request.query || {});
    const data = await libraryService.listMembers(getInstCode(request), query, { limit: query.limit, offset: query.offset });
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch library members');
  }
}

export async function getMemberDetailsHandler(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
  try {
    const data = await libraryService.getMemberDetails(getInstCode(request), request.params.id);
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch member details');
  }
}

// ==================== DASHBOARD & REPORTS ====================

export async function getDashboardStatsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const data = await libraryService.getDashboardStats(getInstCode(request));
    return reply.send({ success: true, data });
  } catch (err) {
    return sendError(reply, err, 'Failed to fetch library dashboard statistics');
  }
}
