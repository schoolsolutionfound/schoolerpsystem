import { eq, and, desc, sql, ilike, inArray, count, sum, lt, or } from 'drizzle-orm';
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
  studentClasses,
  classSections,
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

  /** One GROUP BY query: book counts per category for an institution. */
  public async countBooksByCategory(institutionCode: string): Promise<Map<string, number>> {
    const rows = await this.getDb()
      .select({ categoryId: libraryBooks.categoryId, cnt: count() })
      .from(libraryBooks)
      .where(eq(libraryBooks.institutionCode, institutionCode))
      .groupBy(libraryBooks.categoryId);
    const map = new Map<string, number>();
    for (const r of rows) {
      if (r.categoryId) map.set(r.categoryId, Number(r.cnt));
    }
    return map;
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

  /**
   * Lazily flip ACTIVE loans past their due date to OVERDUE so status
   * filters, dashboard counts and lists stay truthful without a cron job.
   */
  public async syncOverdueLoans(institutionCode: string): Promise<void> {
    await this.getDb()
      .update(libraryLoans)
      .set({ status: 'OVERDUE', updatedAt: new Date() })
      .where(
        and(
          eq(libraryLoans.institutionCode, institutionCode),
          eq(libraryLoans.status, 'ACTIVE'),
          lt(libraryLoans.dueDate, sql`CURRENT_DATE`)
        )
      );
  }

  /**
   * Loans joined with book / copy / member (+ real class section) in a
   * single query. Search spans book title/ISBN, member name/admission no
   * and accession number.
   */
  public async listLoans(
    institutionCode: string,
    filters?: { search?: string; studentId?: string; bookId?: string; copyId?: string; status?: string },
    opts?: { limit?: number; offset?: number }
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [eq(libraryLoans.institutionCode, institutionCode)];

    if (filters?.studentId) conditions.push(eq(libraryLoans.studentId, filters.studentId));
    if (filters?.bookId) conditions.push(eq(libraryLoans.bookId, filters.bookId));
    if (filters?.copyId) conditions.push(eq(libraryLoans.copyId, filters.copyId));
    if (filters?.status === 'OVERDUE') {
      // OVERDUE includes not-yet-flipped ACTIVE loans past due.
      conditions.push(
        or(
          eq(libraryLoans.status, 'OVERDUE'),
          and(eq(libraryLoans.status, 'ACTIVE'), lt(libraryLoans.dueDate, sql`CURRENT_DATE`))
        )!
      );
    } else if (filters?.status) {
      conditions.push(eq(libraryLoans.status, filters.status));
    }
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        sql`(${libraryBooks.title} ILIKE ${q} OR ${libraryBooks.isbn} ILIKE ${q} OR ${users.fullName} ILIKE ${q} OR ${users.rollNoOrUSN} ILIKE ${q} OR ${libraryBookCopies.accessionNumber} ILIKE ${q})`
      );
    }

    const whereClause = and(...conditions);

    const baseQuery = this.getDb()
      .select({
        loan: libraryLoans,
        bookTitle: libraryBooks.title,
        bookIsbn: libraryBooks.isbn,
        accessionNumber: libraryBookCopies.accessionNumber,
        barcode: libraryBookCopies.barcode,
        studentName: users.fullName,
        admissionNo: users.rollNoOrUSN,
        classSectionName: classSections.name,
      })
      .from(libraryLoans)
      .leftJoin(libraryBooks, eq(libraryLoans.bookId, libraryBooks.id))
      .leftJoin(libraryBookCopies, eq(libraryLoans.copyId, libraryBookCopies.id))
      .leftJoin(users, eq(libraryLoans.studentId, users.id))
      .leftJoin(studentClasses, and(eq(studentClasses.studentId, users.id), eq(studentClasses.isActive, true)))
      .leftJoin(classSections, eq(studentClasses.classSectionId, classSections.id));

    const [{ totalCount }] = await this.getDb()
      .select({ totalCount: count() })
      .from(libraryLoans)
      .leftJoin(libraryBooks, eq(libraryLoans.bookId, libraryBooks.id))
      .leftJoin(libraryBookCopies, eq(libraryLoans.copyId, libraryBookCopies.id))
      .leftJoin(users, eq(libraryLoans.studentId, users.id))
      .where(whereClause);

    let query = baseQuery.where(whereClause).orderBy(desc(libraryLoans.createdAt));
    if (opts?.limit) query = query.limit(opts.limit) as any;
    if (opts?.offset) query = query.offset(opts.offset) as any;

    const rows: any[] = await query;
    const items = rows.map((r: any) => ({
      ...r.loan,
      bookTitle: r.bookTitle || 'Unknown Title',
      accessionNumber: r.accessionNumber || '—',
      barcode: r.barcode || '—',
      studentName: r.studentName || 'Unknown Member',
      admissionNo: r.admissionNo || '—',
      classSection: r.classSectionName || '—',
    }));
    return { items, total: Number(totalCount || 0) };
  }

  /** Any loan history (any status) for a copy — used to protect ledger integrity on delete. */
  public async countLoansByCopyId(copyId: string): Promise<number> {
    const [res] = await this.getDb().select({ cnt: count() }).from(libraryLoans).where(eq(libraryLoans.copyId, copyId));
    return Number(res?.cnt || 0);
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

  public async listReservations(institutionCode: string, studentId?: string): Promise<LibraryReservationRecord[]> {
    const conditions = [eq(libraryReservations.institutionCode, institutionCode)];
    if (studentId) conditions.push(eq(libraryReservations.studentId, studentId));
    return this.getDb()
      .select()
      .from(libraryReservations)
      .where(and(...conditions))
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

  /**
   * Fines joined with member / copy / book in one query. Search spans
   * member name, admission no and book title.
   */
  public async listFines(
    institutionCode: string,
    filters?: { search?: string; studentId?: string; status?: string; fineType?: string },
    opts?: { limit?: number; offset?: number }
  ): Promise<{ items: any[]; total: number }> {
    const conditions = [eq(libraryFines.institutionCode, institutionCode)];

    if (filters?.studentId) conditions.push(eq(libraryFines.studentId, filters.studentId));
    if (filters?.status) conditions.push(eq(libraryFines.status, filters.status));
    if (filters?.fineType) conditions.push(eq(libraryFines.fineType, filters.fineType));
    if (filters?.search && filters.search.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        sql`(${users.fullName} ILIKE ${q} OR ${users.rollNoOrUSN} ILIKE ${q} OR ${libraryBooks.title} ILIKE ${q} OR ${libraryBookCopies.accessionNumber} ILIKE ${q})`
      );
    }

    const whereClause = and(...conditions);

    const baseQuery = this.getDb()
      .select({
        fine: libraryFines,
        studentName: users.fullName,
        admissionNo: users.rollNoOrUSN,
        classSectionName: classSections.name,
        accessionNumber: libraryBookCopies.accessionNumber,
        bookTitle: libraryBooks.title,
      })
      .from(libraryFines)
      .leftJoin(users, eq(libraryFines.studentId, users.id))
      .leftJoin(studentClasses, and(eq(studentClasses.studentId, users.id), eq(studentClasses.isActive, true)))
      .leftJoin(classSections, eq(studentClasses.classSectionId, classSections.id))
      .leftJoin(libraryBookCopies, eq(libraryFines.bookCopyId, libraryBookCopies.id))
      .leftJoin(libraryBooks, eq(libraryBookCopies.bookId, libraryBooks.id));

    const [{ totalCount }] = await this.getDb()
      .select({ totalCount: count() })
      .from(libraryFines)
      .leftJoin(users, eq(libraryFines.studentId, users.id))
      .leftJoin(libraryBookCopies, eq(libraryFines.bookCopyId, libraryBookCopies.id))
      .leftJoin(libraryBooks, eq(libraryBookCopies.bookId, libraryBooks.id))
      .where(whereClause);

    let query = baseQuery.where(whereClause).orderBy(desc(libraryFines.createdAt));
    if (opts?.limit) query = query.limit(opts.limit) as any;
    if (opts?.offset) query = query.offset(opts.offset) as any;

    const rows: any[] = await query;

    // One extra query for the whole page of transactions (not N+1).
    const fineIds = rows.map((r: any) => r.fine.id);
    const txns = fineIds.length
      ? await this.getDb()
          .select()
          .from(libraryPaymentTransactions)
          .where(inArray(libraryPaymentTransactions.fineId, fineIds))
          .orderBy(desc(libraryPaymentTransactions.paidAt))
      : [];

    const txnsByFine = new Map<string, LibraryPaymentTransactionRecord[]>();
    for (const t of txns) {
      const list = txnsByFine.get(t.fineId) || [];
      list.push(t);
      txnsByFine.set(t.fineId, list);
    }

    const items = rows.map((r: any) => ({
      ...r.fine,
      amount: parseFloat(String(r.fine.amount)),
      paidAmount: parseFloat(String(r.fine.paidAmount)),
      studentName: r.studentName || 'Unknown Member',
      admissionNo: r.admissionNo || '—',
      classSection: r.classSectionName || '—',
      accessionNumber: r.accessionNumber || undefined,
      bookTitle: r.bookTitle || undefined,
      paymentTransactions: (txnsByFine.get(r.fine.id) || []).map((t) => ({
        ...t,
        amount: parseFloat(String(t.amount)),
        cashTendered: t.cashTendered ? parseFloat(String(t.cashTendered)) : undefined,
        changeReturned: t.changeReturned ? parseFloat(String(t.changeReturned)) : undefined,
      })),
    }));
    return { items, total: Number(totalCount || 0) };
  }

  /**
   * Atomically credit a fine payment via SQL increment with a status guard,
   * so two concurrent payments cannot over-credit or double-close a fine.
   */
  public async applyFinePayment(
    fineId: string,
    amount: number,
    txRunner?: any
  ): Promise<LibraryFineRecord | undefined> {
    const executor = this.getDb(txRunner);
    const [updated] = await executor
      .update(libraryFines)
      .set({
        paidAmount: sql`ROUND((${libraryFines.paidAmount} + ${String(amount)})::numeric, 2)`,
        status: sql`CASE WHEN (${libraryFines.paidAmount} + ${String(amount)}) >= ${libraryFines.amount} - 0.01 THEN 'PAID' ELSE 'PARTIALLY_PAID' END`,
        updatedAt: new Date(),
      })
      .where(and(eq(libraryFines.id, fineId), inArray(libraryFines.status, ['UNPAID', 'PARTIALLY_PAID'])))
      .returning();
    return updated;
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

  /**
   * Students joined with their active class section (NOT institutionType,
   * which is a different field). Supports classSection + search filters.
   */
  public async listMembers(
    institutionCode: string,
    filters?: { search?: string; classSection?: string },
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
    if (filters?.classSection && filters.classSection.trim()) {
      conditions.push(eq(classSections.name, filters.classSection.trim()));
    }

    const whereClause = and(...conditions);

    const baseQuery = this.getDb()
      .select({
        id: users.id,
        fullName: users.fullName,
        admissionNo: users.rollNoOrUSN,
        email: users.email,
        phone: users.phone,
        profilePicUrl: users.profilePicUrl,
        classSectionName: classSections.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(studentClasses, and(eq(studentClasses.studentId, users.id), eq(studentClasses.isActive, true)))
      .leftJoin(classSections, eq(studentClasses.classSectionId, classSections.id));

    const [{ totalCount }] = await this.getDb()
      .select({ totalCount: count() })
      .from(users)
      .leftJoin(studentClasses, and(eq(studentClasses.studentId, users.id), eq(studentClasses.isActive, true)))
      .leftJoin(classSections, eq(studentClasses.classSectionId, classSections.id))
      .where(whereClause);

    let query = baseQuery.where(whereClause).orderBy(users.fullName);
    if (opts?.limit) query = query.limit(opts.limit) as any;
    if (opts?.offset) query = query.offset(opts.offset) as any;

    const rows: any[] = await query;

    // One batch query for active-loan counts for the whole page (not N+1).
    const ids = rows.map((r: any) => r.id);
    const counts: { studentId: string; cnt: number | string }[] = ids.length
      ? await this.getDb()
          .select({ studentId: libraryLoans.studentId, cnt: count() })
          .from(libraryLoans)
          .where(and(inArray(libraryLoans.studentId, ids), inArray(libraryLoans.status, ['ACTIVE', 'OVERDUE'])))
          .groupBy(libraryLoans.studentId)
      : [];
    const countMap = new Map(counts.map((c) => [c.studentId, Number(c.cnt)]));

    const items = rows.map((r: any) => ({
      id: r.id,
      fullName: r.fullName,
      admissionNo: r.admissionNo,
      email: r.email,
      phone: r.phone,
      profilePicUrl: r.profilePicUrl,
      classSection: r.classSectionName || '—',
      activeLoansCount: countMap.get(r.id) || 0,
      createdAt: r.createdAt,
    }));
    return { items, total: Number(totalCount || 0) };
  }

  public async updateMember(
    studentId: string,
    input: { fullName?: string; admissionNo?: string; phone?: string }
  ): Promise<any | undefined> {
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (input.fullName !== undefined) updateData.fullName = input.fullName;
    if (input.admissionNo !== undefined) updateData.rollNoOrUSN = input.admissionNo;
    if (input.phone !== undefined) updateData.phone = input.phone;

    await this.getDb().update(users).set(updateData).where(eq(users.id, studentId));
    return this.getMemberById(studentId);
  }

  public async getMemberById(studentId: string): Promise<any | undefined> {
    const [row] = await this.getDb()
      .select({
        id: users.id,
        fullName: users.fullName,
        admissionNo: users.rollNoOrUSN,
        email: users.email,
        phone: users.phone,
        profilePicUrl: users.profilePicUrl,
        classSectionName: classSections.name,
        institutionCode: users.institutionCode,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(studentClasses, and(eq(studentClasses.studentId, users.id), eq(studentClasses.isActive, true)))
      .leftJoin(classSections, eq(studentClasses.classSectionId, classSections.id))
      .where(and(eq(users.id, studentId), eq(users.role, 'student')));
    if (!row) return undefined;
    return {
      id: row.id,
      fullName: row.fullName,
      admissionNo: row.admissionNo,
      email: row.email,
      phone: row.phone,
      profilePicUrl: row.profilePicUrl,
      classSection: row.classSectionName || '—',
      institutionCode: row.institutionCode,
      createdAt: row.createdAt,
    };
  }

  // ==================== DASHBOARD AGGREGATES (SQL, not full-table loads) ====================

  public async countBooks(institutionCode: string): Promise<number> {
    const [res] = await this.getDb().select({ cnt: count() }).from(libraryBooks).where(eq(libraryBooks.institutionCode, institutionCode));
    return Number(res?.cnt || 0);
  }

  public async countCopiesByStatus(institutionCode: string): Promise<Record<string, number>> {
    const rows = await this.getDb()
      .select({ status: libraryBookCopies.status, cnt: count() })
      .from(libraryBookCopies)
      .where(eq(libraryBookCopies.institutionCode, institutionCode))
      .groupBy(libraryBookCopies.status);
    const out: Record<string, number> = { AVAILABLE: 0, ISSUED: 0, LOST: 0, DAMAGED: 0, UNDER_REPAIR: 0, WITHDRAWN: 0 };
    for (const r of rows) out[r.status] = Number(r.cnt);
    return out;
  }

  /** Syncs overdue status first so OVERDUE counts are never stale. */
  public async countLoansByStatus(institutionCode: string): Promise<{ active: number; overdue: number; total: number }> {
    await this.syncOverdueLoans(institutionCode);
    const rows: { status: string; cnt: number | string }[] = await this.getDb()
      .select({ status: libraryLoans.status, cnt: count() })
      .from(libraryLoans)
      .where(eq(libraryLoans.institutionCode, institutionCode))
      .groupBy(libraryLoans.status);
    const byStatus = new Map(rows.map((r) => [r.status, Number(r.cnt)]));
    const overdue = byStatus.get('OVERDUE') || 0;
    const active = overdue + (byStatus.get('ACTIVE') || 0);
    const total = rows.reduce((acc, r) => acc + Number(r.cnt), 0);
    return { active, overdue, total };
  }

  public async sumFines(institutionCode: string): Promise<{ collected: number; outstanding: number }> {
    const [agg] = await this.getDb()
      .select({
        collected: sum(sql`COALESCE(${libraryFines.paidAmount}, 0)`),
        outstanding: sql<number>`COALESCE(SUM(CASE WHEN ${libraryFines.status} IN ('UNPAID','PARTIALLY_PAID') THEN (${libraryFines.amount} - COALESCE(${libraryFines.paidAmount},0)) ELSE 0 END), 0)`,
      })
      .from(libraryFines)
      .where(eq(libraryFines.institutionCode, institutionCode));
    return {
      collected: parseFloat(String(agg?.collected || 0)),
      outstanding: parseFloat(String(agg?.outstanding || 0)),
    };
  }

  public async countMembers(institutionCode: string): Promise<number> {
    const [res] = await this.getDb()
      .select({ cnt: count() })
      .from(users)
      .where(and(eq(users.institutionCode, institutionCode), eq(users.role, 'student')));
    return Number(res?.cnt || 0);
  }

  public async listRecentLoans(institutionCode: string, limit = 5): Promise<LibraryLoanRecord[]> {
    return this.getDb().select().from(libraryLoans).where(eq(libraryLoans.institutionCode, institutionCode)).orderBy(desc(libraryLoans.createdAt)).limit(limit);
  }

  // ==================== SEQUENCES (count-based, collision-safe) ====================

  public async countCopiesInInstitution(txOrDb?: any): Promise<number> {
    const [res] = await this.getDb(txOrDb).select({ cnt: count() }).from(libraryBookCopies);
    return Number(res?.cnt || 0);
  }

  public async countTransactionsInInstitution(txOrDb?: any): Promise<number> {
    const [res] = await this.getDb(txOrDb).select({ cnt: count() }).from(libraryPaymentTransactions);
    return Number(res?.cnt || 0);
  }
}

export const libraryRepository = new LibraryRepository();
