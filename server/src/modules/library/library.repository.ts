import { eq, and, desc, sql, ilike, inArray, count, sum } from 'drizzle-orm';
import { db } from '../shared/db/index.js';
import {
  libraryCategories,
  libraryAuthors,
  libraryBooks,
  libraryBookCopies,
  libraryLoans,
  libraryReservations,
  libraryFines,
  libraryPaymentTransactions,
  libraryQuestionPapers,
  librarySettings,
  users,
  LibraryCategoryRecord,
  NewLibraryCategoryRecord,
  LibraryAuthorRecord,
  NewLibraryAuthorRecord,
  LibraryBookRecord,
  NewLibraryBookRecord,
  LibraryBookCopyRecord,
  NewLibraryBookCopyRecord,
  LibraryLoanRecord,
  NewLibraryLoanRecord,
  LibraryReservationRecord,
  NewLibraryReservationRecord,
  LibraryFineRecord,
  NewLibraryFineRecord,
  LibraryPaymentTransactionRecord,
  NewLibraryPaymentTransactionRecord,
  LibraryQuestionPaperRecord,
  NewLibraryQuestionPaperRecord,
  LibrarySettingsRecord,
  NewLibrarySettingsRecord,
} from '../shared/db/schema.js';

export class LibraryRepository {
  private getDb(txRunner?: any) {
    const client = txRunner || db;
    if (!client) {
      throw new Error('Database client not initialized');
    }
    return client;
  }

  // ==================== CATEGORIES ====================

  public async listCategories(institutionCode: string): Promise<LibraryCategoryRecord[]> {
    return this.getDb()
      .select()
      .from(libraryCategories)
      .where(eq(libraryCategories.institutionCode, institutionCode))
      .orderBy(libraryCategories.name);
  }

  public async getCategoryById(id: string): Promise<LibraryCategoryRecord | undefined> {
    const [res] = await this.getDb().select().from(libraryCategories).where(eq(libraryCategories.id, id));
    return res;
  }

  public async getCategoryByName(institutionCode: string, name: string): Promise<LibraryCategoryRecord | undefined> {
    const [res] = await this.getDb()
      .select()
      .from(libraryCategories)
      .where(and(eq(libraryCategories.institutionCode, institutionCode), ilike(libraryCategories.name, name)));
    return res;
  }

  public async createCategory(data: NewLibraryCategoryRecord): Promise<LibraryCategoryRecord> {
    const [res] = await this.getDb().insert(libraryCategories).values(data).returning();
    return res;
  }

  public async updateCategory(id: string, data: Partial<NewLibraryCategoryRecord>): Promise<LibraryCategoryRecord | undefined> {
    const [res] = await this.getDb()
      .update(libraryCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(libraryCategories.id, id))
      .returning();
    return res;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const res = await this.getDb().delete(libraryCategories).where(eq(libraryCategories.id, id)).returning();
    return res.length > 0;
  }

  public async countBooksByCategoryId(categoryId: string): Promise<number> {
    const [res] = await this.getDb().select({ count: count() }).from(libraryBooks).where(eq(libraryBooks.categoryId, categoryId));
    return Number(res?.count || 0);
  }

  // ==================== AUTHORS ====================

  public async listAuthors(institutionCode: string): Promise<LibraryAuthorRecord[]> {
    return this.getDb()
      .select()
      .from(libraryAuthors)
      .where(eq(libraryAuthors.institutionCode, institutionCode))
      .orderBy(libraryAuthors.name);
  }

  public async getAuthorById(id: string): Promise<LibraryAuthorRecord | undefined> {
    const [res] = await this.getDb().select().from(libraryAuthors).where(eq(libraryAuthors.id, id));
    return res;
  }

  public async createAuthor(data: NewLibraryAuthorRecord): Promise<LibraryAuthorRecord> {
    const [res] = await this.getDb().insert(libraryAuthors).values(data).returning();
    return res;
  }

  public async updateAuthor(id: string, data: Partial<NewLibraryAuthorRecord>): Promise<LibraryAuthorRecord | undefined> {
    const [res] = await this.getDb()
      .update(libraryAuthors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(libraryAuthors.id, id))
      .returning();
    return res;
  }

  // ==================== BOOKS ====================

  public async listBooks(
    institutionCode: string,
    filters?: { search?: string; categoryId?: string; bookType?: string; language?: string },
    opts?: { limit?: number; offset?: number }
  ): Promise<{ items: LibraryBookRecord[]; total: number }> {
    const conditions = [eq(libraryBooks.institutionCode, institutionCode)];

    if (filters?.categoryId) {
      conditions.push(eq(libraryBooks.categoryId, filters.categoryId));
    }
    if (filters?.bookType) {
      conditions.push(eq(libraryBooks.bookType, filters.bookType));
    }
    if (filters?.language) {
      conditions.push(ilike(libraryBooks.language, filters.language));
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        sql`(${libraryBooks.title} ILIKE ${q} OR ${libraryBooks.isbn} ILIKE ${q} OR ${libraryBooks.publisher} ILIKE ${q} OR ${libraryBooks.subject} ILIKE ${q})`
      );
    }

    const whereClause = and(...conditions);

    const [{ totalCount }] = await this.getDb().select({ totalCount: count() }).from(libraryBooks).where(whereClause);

    let query = this.getDb()
      .select()
      .from(libraryBooks)
      .where(whereClause)
      .orderBy(desc(libraryBooks.createdAt));

    if (opts?.limit) query = query.limit(opts.limit) as any;
    if (opts?.offset) query = query.offset(opts.offset) as any;

    const items = await query;
    return { items, total: Number(totalCount || 0) };
  }

  public async getBookById(id: string): Promise<LibraryBookRecord | undefined> {
    const [res] = await this.getDb().select().from(libraryBooks).where(eq(libraryBooks.id, id));
    return res;
  }

  public async getBookByIsbn(institutionCode: string, isbn: string): Promise<LibraryBookRecord | undefined> {
    const [res] = await this.getDb()
      .select()
      .from(libraryBooks)
      .where(and(eq(libraryBooks.institutionCode, institutionCode), eq(libraryBooks.isbn, isbn)));
    return res;
  }

  public async createBook(data: NewLibraryBookRecord, txRunner?: any): Promise<LibraryBookRecord> {
    const executor = this.getDb(txRunner);
    const [res] = await executor.insert(libraryBooks).values(data).returning();
    return res;
  }

  public async updateBook(id: string, data: Partial<NewLibraryBookRecord>, txRunner?: any): Promise<LibraryBookRecord | undefined> {
    const executor = this.getDb(txRunner);
    const [res] = await executor
      .update(libraryBooks)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(libraryBooks.id, id))
      .returning();
    return res;
  }

  public async deleteBook(id: string, txRunner?: any): Promise<boolean> {
    const executor = this.getDb(txRunner);
    const res = await executor.delete(libraryBooks).where(eq(libraryBooks.id, id)).returning();
    return res.length > 0;
  }

  // ==================== BOOK COPIES ====================

  public async listCopiesByBookId(bookId: string): Promise<LibraryBookCopyRecord[]> {
    return this.getDb()
      .select()
      .from(libraryBookCopies)
      .where(eq(libraryBookCopies.bookId, bookId))
      .orderBy(libraryBookCopies.accessionNumber);
  }

  public async listAllCopies(institutionCode: string): Promise<LibraryBookCopyRecord[]> {
    return this.getDb()
      .select()
      .from(libraryBookCopies)
      .where(eq(libraryBookCopies.institutionCode, institutionCode))
      .orderBy(desc(libraryBookCopies.createdAt));
  }

  public async getCopyById(id: string): Promise<LibraryBookCopyRecord | undefined> {
    const [res] = await this.getDb().select().from(libraryBookCopies).where(eq(libraryBookCopies.id, id));
    return res;
  }

  public async getCopyByAccession(institutionCode: string, accessionNumber: string): Promise<LibraryBookCopyRecord | undefined> {
    const [res] = await this.getDb()
      .select()
      .from(libraryBookCopies)
      .where(and(eq(libraryBookCopies.institutionCode, institutionCode), eq(libraryBookCopies.accessionNumber, accessionNumber)));
    return res;
  }

  public async getCopyByBarcode(institutionCode: string, barcode: string): Promise<LibraryBookCopyRecord | undefined> {
    const [res] = await this.getDb()
      .select()
      .from(libraryBookCopies)
      .where(and(eq(libraryBookCopies.institutionCode, institutionCode), eq(libraryBookCopies.barcode, barcode)));
    return res;
  }

  public async createCopy(data: NewLibraryBookCopyRecord, txRunner?: any): Promise<LibraryBookCopyRecord> {
    const executor = this.getDb(txRunner);
    const [res] = await executor.insert(libraryBookCopies).values(data).returning();
    return res;
  }

  public async updateCopy(id: string, data: Partial<NewLibraryBookCopyRecord>, txRunner?: any): Promise<LibraryBookCopyRecord | undefined> {
    const executor = this.getDb(txRunner);
    const [res] = await executor
      .update(libraryBookCopies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(libraryBookCopies.id, id))
      .returning();
    return res;
  }

  public async deleteCopy(id: string, txRunner?: any): Promise<boolean> {
    const executor = this.getDb(txRunner);
    const res = await executor.delete(libraryBookCopies).where(eq(libraryBookCopies.id, id)).returning();
    return res.length > 0;
  }

  public async countCopiesByBookId(bookId: string): Promise<{ total: number; available: number }> {
    const copiesList = await this.listCopiesByBookId(bookId);
    const total = copiesList.length;
    const available = copiesList.filter((c) => c.status === 'AVAILABLE').length;
    return { total, available };
  }

  // ==================== LOANS ====================

  public async listLoans(
    institutionCode: string,
    filters?: { search?: string; studentId?: string; bookId?: string; copyId?: string; status?: string },
    opts?: { limit?: number; offset?: number }
  ): Promise<{ items: LibraryLoanRecord[]; total: number }> {
    const conditions = [eq(libraryLoans.institutionCode, institutionCode)];

    if (filters?.studentId) conditions.push(eq(libraryLoans.studentId, filters.studentId));
    if (filters?.bookId) conditions.push(eq(libraryLoans.bookId, filters.bookId));
    if (filters?.copyId) conditions.push(eq(libraryLoans.copyId, filters.copyId));
    if (filters?.status) conditions.push(eq(libraryLoans.status, filters.status));

    const whereClause = and(...conditions);
    const [{ totalCount }] = await this.getDb().select({ totalCount: count() }).from(libraryLoans).where(whereClause);

    let query = this.getDb()
      .select()
      .from(libraryLoans)
      .where(whereClause)
      .orderBy(desc(libraryLoans.createdAt));

    if (opts?.limit) query = query.limit(opts.limit) as any;
    if (opts?.offset) query = query.offset(opts.offset) as any;

    const items = await query;
    return { items, total: Number(totalCount || 0) };
  }

  public async getLoanById(id: string): Promise<LibraryLoanRecord | undefined> {
    const [res] = await this.getDb().select().from(libraryLoans).where(eq(libraryLoans.id, id));
    return res;
  }

  public async getActiveLoanByCopyId(copyId: string): Promise<LibraryLoanRecord | undefined> {
    const [res] = await this.getDb()
      .select()
      .from(libraryLoans)
      .where(and(eq(libraryLoans.copyId, copyId), inArray(libraryLoans.status, ['ACTIVE', 'OVERDUE'])));
    return res;
  }

  public async countActiveLoansByStudent(studentId: string): Promise<number> {
    const [res] = await this.getDb()
      .select({ totalCount: count() })
      .from(libraryLoans)
      .where(and(eq(libraryLoans.studentId, studentId), inArray(libraryLoans.status, ['ACTIVE', 'OVERDUE'])));
    return Number(res?.totalCount || 0);
  }

  public async createLoan(data: NewLibraryLoanRecord, txRunner?: any): Promise<LibraryLoanRecord> {
    const executor = this.getDb(txRunner);
    const [res] = await executor.insert(libraryLoans).values(data).returning();
    return res;
  }

  public async updateLoan(id: string, data: Partial<NewLibraryLoanRecord>, txRunner?: any): Promise<LibraryLoanRecord | undefined> {
    const executor = this.getDb(txRunner);
    const [res] = await executor
      .update(libraryLoans)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(libraryLoans.id, id))
      .returning();
    return res;
  }

  // ==================== RESERVATIONS ====================

  public async listReservations(institutionCode: string): Promise<LibraryReservationRecord[]> {
    return this.getDb()
      .select()
      .from(libraryReservations)
      .where(eq(libraryReservations.institutionCode, institutionCode))
      .orderBy(desc(libraryReservations.reservedAt));
  }

  public async getReservationById(id: string): Promise<LibraryReservationRecord | undefined> {
    const [res] = await this.getDb().select().from(libraryReservations).where(eq(libraryReservations.id, id));
    return res;
  }

  public async createReservation(data: NewLibraryReservationRecord): Promise<LibraryReservationRecord> {
    const [res] = await this.getDb().insert(libraryReservations).values(data).returning();
    return res;
  }

  public async updateReservation(id: string, data: Partial<NewLibraryReservationRecord>): Promise<LibraryReservationRecord | undefined> {
    const [res] = await this.getDb()
      .update(libraryReservations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(libraryReservations.id, id))
      .returning();
    return res;
  }

  // ==================== FINES ====================

  public async listFines(
    institutionCode: string,
    filters?: { search?: string; studentId?: string; status?: string; fineType?: string },
    opts?: { limit?: number; offset?: number }
  ): Promise<{ items: LibraryFineRecord[]; total: number }> {
    const conditions = [eq(libraryFines.institutionCode, institutionCode)];

    if (filters?.studentId) conditions.push(eq(libraryFines.studentId, filters.studentId));
    if (filters?.status) conditions.push(eq(libraryFines.status, filters.status));
    if (filters?.fineType) conditions.push(eq(libraryFines.fineType, filters.fineType));

    const whereClause = and(...conditions);
    const [{ totalCount }] = await this.getDb().select({ totalCount: count() }).from(libraryFines).where(whereClause);

    let query = this.getDb()
      .select()
      .from(libraryFines)
      .where(whereClause)
      .orderBy(desc(libraryFines.createdAt));

    if (opts?.limit) query = query.limit(opts.limit) as any;
    if (opts?.offset) query = query.offset(opts.offset) as any;

    const items = await query;
    return { items, total: Number(totalCount || 0) };
  }

  public async getFineById(id: string): Promise<LibraryFineRecord | undefined> {
    const [res] = await this.getDb().select().from(libraryFines).where(eq(libraryFines.id, id));
    return res;
  }

  public async createFine(data: NewLibraryFineRecord, txRunner?: any): Promise<LibraryFineRecord> {
    const executor = this.getDb(txRunner);
    const [res] = await executor.insert(libraryFines).values(data).returning();
    return res;
  }

  public async updateFine(id: string, data: Partial<NewLibraryFineRecord>, txRunner?: any): Promise<LibraryFineRecord | undefined> {
    const executor = this.getDb(txRunner);
    const [res] = await executor
      .update(libraryFines)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(libraryFines.id, id))
      .returning();
    return res;
  }

  public async sumUnpaidFinesByStudent(studentId: string): Promise<number> {
    const [res] = await this.getDb()
      .select({ totalUnpaid: sum(sql`${libraryFines.amount} - ${libraryFines.paidAmount}`) })
      .from(libraryFines)
      .where(
        and(
          eq(libraryFines.studentId, studentId),
          inArray(libraryFines.status, ['UNPAID', 'PARTIALLY_PAID'])
        )
      );
    return Number(res?.totalUnpaid || 0);
  }

  // ==================== PAYMENT TRANSACTIONS ====================

  public async listTransactionsByFineId(fineId: string): Promise<LibraryPaymentTransactionRecord[]> {
    return this.getDb()
      .select()
      .from(libraryPaymentTransactions)
      .where(eq(libraryPaymentTransactions.fineId, fineId))
      .orderBy(desc(libraryPaymentTransactions.paidAt));
  }

  public async createTransaction(data: NewLibraryPaymentTransactionRecord, txRunner?: any): Promise<LibraryPaymentTransactionRecord> {
    const executor = this.getDb(txRunner);
    const [res] = await executor.insert(libraryPaymentTransactions).values(data).returning();
    return res;
  }

  // ==================== PYQS ====================

  public async listQuestionPapers(
    institutionCode: string,
    filters?: { search?: string; subject?: string; academicYear?: string; classGrade?: string; examType?: string },
    opts?: { limit?: number; offset?: number }
  ): Promise<{ items: LibraryQuestionPaperRecord[]; total: number }> {
    const conditions = [eq(libraryQuestionPapers.institutionCode, institutionCode)];

    if (filters?.subject) conditions.push(eq(libraryQuestionPapers.subject, filters.subject));
    if (filters?.academicYear) conditions.push(eq(libraryQuestionPapers.academicYear, filters.academicYear));
    if (filters?.classGrade) conditions.push(eq(libraryQuestionPapers.classGrade, filters.classGrade));
    if (filters?.examType) conditions.push(eq(libraryQuestionPapers.examType, filters.examType));
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        sql`(${libraryQuestionPapers.title} ILIKE ${q} OR ${libraryQuestionPapers.subject} ILIKE ${q} OR ${libraryQuestionPapers.uploadedBy} ILIKE ${q})`
      );
    }

    const whereClause = and(...conditions);
    const [{ totalCount }] = await this.getDb().select({ totalCount: count() }).from(libraryQuestionPapers).where(whereClause);

    let query = this.getDb()
      .select()
      .from(libraryQuestionPapers)
      .where(whereClause)
      .orderBy(desc(libraryQuestionPapers.uploadedAt));

    if (opts?.limit) query = query.limit(opts.limit) as any;
    if (opts?.offset) query = query.offset(opts.offset) as any;

    const items = await query;
    return { items, total: Number(totalCount || 0) };
  }

  public async getQuestionPaperById(id: string): Promise<LibraryQuestionPaperRecord | undefined> {
    const [res] = await this.getDb().select().from(libraryQuestionPapers).where(eq(libraryQuestionPapers.id, id));
    return res;
  }

  public async createQuestionPaper(data: NewLibraryQuestionPaperRecord): Promise<LibraryQuestionPaperRecord> {
    const [res] = await this.getDb().insert(libraryQuestionPapers).values(data).returning();
    return res;
  }

  public async deleteQuestionPaper(id: string): Promise<boolean> {
    const res = await this.getDb().delete(libraryQuestionPapers).where(eq(libraryQuestionPapers.id, id)).returning();
    return res.length > 0;
  }

  public async incrementPYQDownloads(id: string): Promise<LibraryQuestionPaperRecord | undefined> {
    const [res] = await this.getDb()
      .update(libraryQuestionPapers)
      .set({ downloadsCount: sql`${libraryQuestionPapers.downloadsCount} + 1`, updatedAt: new Date() })
      .where(eq(libraryQuestionPapers.id, id))
      .returning();
    return res;
  }

  // ==================== SETTINGS ====================

  public async getSettings(institutionCode: string): Promise<LibrarySettingsRecord | undefined> {
    const [res] = await this.getDb()
      .select()
      .from(librarySettings)
      .where(eq(librarySettings.institutionCode, institutionCode));
    return res;
  }

  public async upsertSettings(institutionCode: string, data: Partial<NewLibrarySettingsRecord>): Promise<LibrarySettingsRecord> {
    const existing = await this.getSettings(institutionCode);
    if (existing) {
      const [updated] = await this.getDb()
        .update(librarySettings)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(librarySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [inserted] = await this.getDb()
        .insert(librarySettings)
        .values({
          institutionCode,
          borrowingLimit: data.borrowingLimit ?? 3,
          loanPeriodDays: data.loanPeriodDays ?? 14,
          gracePeriodDays: data.gracePeriodDays ?? 2,
          finePerDay: data.finePerDay ? String(data.finePerDay) : '1.00',
          maxFine: data.maxFine ? String(data.maxFine) : '100.00',
          renewalLimit: data.renewalLimit ?? 2,
          allowReservation: data.allowReservation ?? true,
          lostBookPenalty: data.lostBookPenalty ? String(data.lostBookPenalty) : '50.00',
          damagedBookPenalty: data.damagedBookPenalty ? String(data.damagedBookPenalty) : '25.00',
          reservationExpiryDays: data.reservationExpiryDays ?? 7,
          unpaidFineLockThreshold: data.unpaidFineLockThreshold ? String(data.unpaidFineLockThreshold) : '20.00',
          openingHours: data.openingHours ?? '08:00 AM',
          closingHours: data.closingHours ?? '06:00 PM',
          openOnWeekends: data.openOnWeekends ?? true,
        })
        .returning();
      return inserted;
    }
  }

  // ==================== MEMBERS (USERS TABLE) ====================

  public async listMembers(
    institutionCode: string,
    filters?: { search?: string },
    opts?: { limit?: number; offset?: number }
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [
      eq(users.institutionCode, institutionCode),
      eq(users.role, 'student'),
    ];

    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        sql`(${users.fullName} ILIKE ${q} OR ${users.email} ILIKE ${q} OR ${users.rollNoOrUSN} ILIKE ${q})`
      );
    }

    const whereClause = and(...conditions);
    const [{ totalCount }] = await this.getDb().select({ totalCount: count() }).from(users).where(whereClause);

    let query = this.getDb()
      .select({
        id: users.id,
        fullName: users.fullName,
        admissionNo: users.rollNoOrUSN,
        email: users.email,
        phone: users.phone,
        profilePicUrl: users.profilePicUrl,
        classSection: users.institutionType,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(users.fullName);

    if (opts?.limit) query = query.limit(opts.limit) as any;
    if (opts?.offset) query = query.offset(opts.offset) as any;

    const items = await query;
    return { items, total: Number(totalCount || 0) };
  }

  public async getMemberById(studentId: string): Promise<any | undefined> {
    const [user] = await this.getDb()
      .select({
        id: users.id,
        fullName: users.fullName,
        admissionNo: users.rollNoOrUSN,
        email: users.email,
        phone: users.phone,
        profilePicUrl: users.profilePicUrl,
        classSection: users.institutionType,
        institutionCode: users.institutionCode,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, studentId));
    return user;
  }
}

export const libraryRepository = new LibraryRepository();
