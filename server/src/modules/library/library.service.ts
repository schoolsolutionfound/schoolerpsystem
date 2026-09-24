import { libraryRepository } from './library.repository.js';
import { db } from '../shared/db/index.js';
import {
  CreateBookInput,
  UpdateBookInput,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateAuthorInput,
  UpdateAuthorInput,
  CreateCopyInput,
  UpdateCopyInput,
  IssueBookInput,
  ReturnBookInput,
  RenewBookInput,
  PayFineInput,
  WaiveFineInput,
  CreateDamageFineInput,
  CreatePYQInput,
  UpdateLibrarySettingsInput,
} from './library.schema.js';

export class LibraryService {
  // ==================== CATEGORIES ====================

  public async listCategories(institutionCode: string) {
    const categories = await libraryRepository.listCategories(institutionCode);
    const books = (await libraryRepository.listBooks(institutionCode)).items;

    return categories.map((cat) => {
      const bookCount = books.filter((b) => b.categoryId === cat.id).length;
      return { ...cat, bookCount };
    });
  }

  public async getCategory(institutionCode: string, id: string) {
    const category = await libraryRepository.getCategoryById(id);
    if (!category || category.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'CATEGORY_NOT_FOUND', message: 'Category not found' };
    }
    return category;
  }

  public async createCategory(institutionCode: string, input: CreateCategoryInput) {
    const existing = await libraryRepository.getCategoryByName(institutionCode, input.name);
    if (existing) {
      throw { statusCode: 400, code: 'DUPLICATE_CATEGORY', message: `Category "${input.name}" already exists` };
    }
    return libraryRepository.createCategory({
      ...input,
      institutionCode,
    });
  }

  public async updateCategory(institutionCode: string, id: string, input: UpdateCategoryInput) {
    await this.getCategory(institutionCode, id);
    return libraryRepository.updateCategory(id, input);
  }

  public async deleteCategory(institutionCode: string, id: string) {
    await this.getCategory(institutionCode, id);
    const bookCount = await libraryRepository.countBooksByCategoryId(id);
    if (bookCount > 0) {
      throw {
        statusCode: 400,
        code: 'CATEGORY_IN_USE',
        message: `Cannot delete category. ${bookCount} book(s) are associated with this category.`,
      };
    }
    return libraryRepository.deleteCategory(id);
  }

  // ==================== AUTHORS ====================

  public async listAuthors(institutionCode: string) {
    return libraryRepository.listAuthors(institutionCode);
  }

  public async getAuthor(institutionCode: string, id: string) {
    const author = await libraryRepository.getAuthorById(id);
    if (!author || author.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'AUTHOR_NOT_FOUND', message: 'Author not found' };
    }
    return author;
  }

  public async createAuthor(institutionCode: string, input: CreateAuthorInput) {
    return libraryRepository.createAuthor({
      ...input,
      institutionCode,
    });
  }

  public async updateAuthor(institutionCode: string, id: string, input: UpdateAuthorInput) {
    await this.getAuthor(institutionCode, id);
    return libraryRepository.updateAuthor(id, input);
  }

  // ==================== BOOKS ====================

  public async listBooks(
    institutionCode: string,
    filters?: { search?: string; categoryId?: string; bookType?: string; language?: string },
    opts?: { limit?: number; offset?: number }
  ) {
    const { items, total } = await libraryRepository.listBooks(institutionCode, filters, opts);
    const allCopies = await libraryRepository.listAllCopies(institutionCode);

    const enrichedBooks = items.map((b) => {
      const bookCopies = allCopies.filter((c) => c.bookId === b.id);
      const totalCopies = bookCopies.length;
      const availableCopies = bookCopies.filter((c) => c.status === 'AVAILABLE').length;
      return {
        ...b,
        totalCopies,
        availableCopies,
      };
    });

    return { data: enrichedBooks, total, limit: opts?.limit, offset: opts?.offset };
  }

  public async getBook(institutionCode: string, id: string) {
    const book = await libraryRepository.getBookById(id);
    if (!book || book.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'BOOK_NOT_FOUND', message: 'Book not found' };
    }

    const copies = await libraryRepository.listCopiesByBookId(id);
    const category = book.categoryId ? await libraryRepository.getCategoryById(book.categoryId) : null;

    return {
      ...book,
      category,
      copies,
      totalCopies: copies.length,
      availableCopies: copies.filter((c) => c.status === 'AVAILABLE').length,
    };
  }

  public async createBook(institutionCode: string, input: CreateBookInput) {
    const existingIsbn = await libraryRepository.getBookByIsbn(institutionCode, input.isbn);
    if (existingIsbn) {
      throw { statusCode: 400, code: 'DUPLICATE_ISBN', message: `Book with ISBN "${input.isbn}" already exists` };
    }

    if (!db) throw new Error('Database connection unavailable');
    return db.transaction(async (tx) => {
      const { totalCopies, ...bookData } = input;

      const newBook = await libraryRepository.createBook(
        {
          ...bookData,
          institutionCode,
        },
        tx
      );

      const copyCount = totalCopies && totalCopies > 0 ? totalCopies : 1;
      const now = new Date();

      for (let i = 1; i <= copyCount; i++) {
        const randNum = String(Math.floor(100000 + Math.random() * 900000));
        const accessionNumber = `ACC-${randNum}`;
        const barcode = `BAR-${randNum}`;

        await libraryRepository.createCopy(
          {
            institutionCode,
            bookId: newBook.id,
            accessionNumber,
            barcode,
            rack: 'Rack A',
            shelf: 'Shelf 1',
            status: 'AVAILABLE',
            condition: 'GOOD',
            addedAt: now.toISOString().split('T')[0] as any,
          },
          tx
        );
      }

      return newBook;
    });
  }

  public async updateBook(institutionCode: string, id: string, input: UpdateBookInput) {
    await this.getBook(institutionCode, id);
    if (input.isbn) {
      const existingIsbn = await libraryRepository.getBookByIsbn(institutionCode, input.isbn);
      if (existingIsbn && existingIsbn.id !== id) {
        throw { statusCode: 400, code: 'DUPLICATE_ISBN', message: `Book with ISBN "${input.isbn}" already exists` };
      }
    }
    return libraryRepository.updateBook(id, input);
  }

  public async deleteBook(institutionCode: string, id: string) {
    await this.getBook(institutionCode, id);
    const copies = await libraryRepository.listCopiesByBookId(id);

    for (const copy of copies) {
      const activeLoan = await libraryRepository.getActiveLoanByCopyId(copy.id);
      if (activeLoan) {
        throw {
          statusCode: 400,
          code: 'CANNOT_DELETE_BOOK',
          message: `Cannot delete book. Physical copy "${copy.accessionNumber}" has an active loan.`,
        };
      }
    }

    if (!db) throw new Error('Database connection unavailable');
    return db.transaction(async (tx) => {
      for (const copy of copies) {
        await libraryRepository.deleteCopy(copy.id, tx);
      }
      return libraryRepository.deleteBook(id, tx);
    });
  }

  // ==================== BOOK COPIES ====================

  public async listCopiesByBook(institutionCode: string, bookId: string) {
    await this.getBook(institutionCode, bookId);
    return libraryRepository.listCopiesByBookId(bookId);
  }

  public async getCopy(institutionCode: string, id: string) {
    const copy = await libraryRepository.getCopyById(id);
    if (!copy || copy.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'COPY_NOT_FOUND', message: 'Physical copy record not found' };
    }
    return copy;
  }

  public async createCopy(institutionCode: string, bookId: string, input: CreateCopyInput) {
    await this.getBook(institutionCode, bookId);

    const existingAcc = await libraryRepository.getCopyByAccession(institutionCode, input.accessionNumber);
    if (existingAcc) {
      throw { statusCode: 400, code: 'DUPLICATE_ACCESSION', message: `Accession number "${input.accessionNumber}" already exists` };
    }

    const existingBar = await libraryRepository.getCopyByBarcode(institutionCode, input.barcode);
    if (existingBar) {
      throw { statusCode: 400, code: 'DUPLICATE_BARCODE', message: `Barcode "${input.barcode}" already exists` };
    }

    return libraryRepository.createCopy({
      ...input,
      institutionCode,
      bookId,
    });
  }

  public async updateCopy(institutionCode: string, id: string, input: UpdateCopyInput) {
    const existing = await this.getCopy(institutionCode, id);

    if (input.accessionNumber && input.accessionNumber !== existing.accessionNumber) {
      const accCheck = await libraryRepository.getCopyByAccession(institutionCode, input.accessionNumber);
      if (accCheck) throw { statusCode: 400, code: 'DUPLICATE_ACCESSION', message: `Accession number "${input.accessionNumber}" already exists` };
    }

    if (input.barcode && input.barcode !== existing.barcode) {
      const barCheck = await libraryRepository.getCopyByBarcode(institutionCode, input.barcode);
      if (barCheck) throw { statusCode: 400, code: 'DUPLICATE_BARCODE', message: `Barcode "${input.barcode}" already exists` };
    }

    return libraryRepository.updateCopy(id, input);
  }

  public async deleteCopy(institutionCode: string, id: string) {
    await this.getCopy(institutionCode, id);
    const activeLoan = await libraryRepository.getActiveLoanByCopyId(id);
    if (activeLoan) {
      throw { statusCode: 400, code: 'COPY_HAS_ACTIVE_LOANS', message: 'Cannot delete physical copy with an active or overdue loan.' };
    }
    return libraryRepository.deleteCopy(id);
  }

  // ==================== LOANS / ISSUE / RETURN ====================

  public async listLoans(
    institutionCode: string,
    filters?: { search?: string; studentId?: string; bookId?: string; copyId?: string; status?: string },
    opts?: { limit?: number; offset?: number }
  ) {
    const { items, total } = await libraryRepository.listLoans(institutionCode, filters, opts);
    const books = (await libraryRepository.listBooks(institutionCode)).items;

    const enrichedLoans = await Promise.all(
      items.map(async (loan) => {
        const book = books.find((b) => b.id === loan.bookId);
        const copy = await libraryRepository.getCopyById(loan.copyId);
        const student = await libraryRepository.getMemberById(loan.studentId);
        return {
          ...loan,
          bookTitle: book?.title || 'Book Title',
          accessionNumber: copy?.accessionNumber || 'ACC',
          barcode: copy?.barcode || 'BAR',
          studentName: student?.fullName || 'Student Member',
          admissionNo: student?.admissionNo || 'ADM',
          classSection: student?.classSection || 'Class',
        };
      })
    );

    return { data: enrichedLoans, total, limit: opts?.limit, offset: opts?.offset };
  }

  public async issueBook(institutionCode: string, issuedBy: string, input: IssueBookInput) {
    const book = await libraryRepository.getBookById(input.bookId);
    if (!book || book.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'BOOK_NOT_FOUND', message: 'Book not found' };
    }

    const copy = await libraryRepository.getCopyById(input.copyId);
    if (!copy || copy.bookId !== input.bookId || copy.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'COPY_NOT_FOUND', message: 'Physical book copy not found or does not belong to this book' };
    }

    if (copy.status !== 'AVAILABLE') {
      throw { statusCode: 400, code: 'COPY_UNAVAILABLE', message: `Physical copy "${copy.accessionNumber}" is currently ${copy.status.replace('_', ' ')}` };
    }

    const activeCopyLoan = await libraryRepository.getActiveLoanByCopyId(input.copyId);
    if (activeCopyLoan) {
      throw { statusCode: 400, code: 'COPY_ALREADY_ISSUED', message: `Physical copy "${copy.accessionNumber}" already has an active loan (#${activeCopyLoan.id})` };
    }

    const student = await libraryRepository.getMemberById(input.studentId);
    if (!student || student.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'MEMBER_NOT_FOUND', message: 'Student/Member not found in this institution' };
    }

    const settings = await this.getSettings(institutionCode);

    const activeStudentLoansCount = await libraryRepository.countActiveLoansByStudent(input.studentId);
    if (activeStudentLoansCount >= settings.borrowingLimit) {
      throw {
        statusCode: 400,
        code: 'BORROWING_LIMIT_EXCEEDED',
        message: `Member ${student.fullName} has reached the maximum borrowing limit of ${settings.borrowingLimit} books.`,
      };
    }

    const unpaidFineTotal = await libraryRepository.sumUnpaidFinesByStudent(input.studentId);
    const lockThreshold = parseFloat(String(settings.unpaidFineLockThreshold || '20.00'));
    if (unpaidFineTotal > lockThreshold) {
      throw {
        statusCode: 400,
        code: 'UNPAID_FINE_LOCK',
        message: `Member ${student.fullName} has $${unpaidFineTotal.toFixed(2)} in unpaid fines, exceeding the threshold of $${lockThreshold.toFixed(2)}.`,
      };
    }

    const issueDateStr = input.issueDate || new Date().toISOString().split('T')[0];
    const loanDays = input.customDays || settings.loanPeriodDays;

    const issueDateObj = new Date(issueDateStr);
    const dueDateObj = new Date(issueDateObj);
    dueDateObj.setDate(dueDateObj.getDate() + loanDays);
    const dueDateStr = input.dueDate || dueDateObj.toISOString().split('T')[0];

    if (!db) throw new Error('Database connection unavailable');
    return db.transaction(async (tx) => {
      const loan = await libraryRepository.createLoan(
        {
          institutionCode,
          copyId: input.copyId,
          bookId: input.bookId,
          studentId: input.studentId,
          issuedBy: issuedBy || 'staff',
          issueDate: issueDateStr as any,
          dueDate: dueDateStr as any,
          status: 'ACTIVE',
          renewalCount: 0,
        },
        tx
      );

      await libraryRepository.updateCopy(input.copyId, { status: 'ISSUED' }, tx);

      return loan;
    });
  }

  public async returnBook(institutionCode: string, loanId: string, input: ReturnBookInput) {
    const loan = await libraryRepository.getLoanById(loanId);
    if (!loan || loan.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'LOAN_NOT_FOUND', message: 'Loan record not found' };
    }

    if (loan.status === 'RETURNED') {
      throw { statusCode: 400, code: 'LOAN_ALREADY_RETURNED', message: 'Book loan has already been returned.' };
    }

    const copy = await libraryRepository.getCopyById(loan.copyId);
    const settings = await this.getSettings(institutionCode);

    const returnDateStr = input.returnDate || new Date().toISOString().split('T')[0];
    const returnDateObj = new Date(returnDateStr);
    const dueDateObj = new Date(loan.dueDate);

    const diffMs = returnDateObj.getTime() - dueDateObj.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const overdueDays = Math.max(0, diffDays - settings.gracePeriodDays);

    const finePerDay = parseFloat(String(settings.finePerDay || '1.00'));
    const maxFine = parseFloat(String(settings.maxFine || '100.00'));
    const calculatedFine = Math.min(maxFine, overdueDays * finePerDay);

    if (!db) throw new Error('Database connection unavailable');
    return db.transaction(async (tx) => {
      const updatedLoan = await libraryRepository.updateLoan(
        loanId,
        {
          status: 'RETURNED',
          returnDate: returnDateStr as any,
        },
        tx
      );

      if (copy) {
        await libraryRepository.updateCopy(
          copy.id,
          {
            status: 'AVAILABLE',
            condition: input.condition || copy.condition || 'GOOD',
          },
          tx
        );
      }

      let generatedFine = null;
      if (calculatedFine > 0) {
        generatedFine = await libraryRepository.createFine(
          {
            institutionCode,
            loanId: loan.id,
            bookCopyId: loan.copyId,
            studentId: loan.studentId,
            fineType: 'OVERDUE',
            damageNotes: `Overdue return penalty (${overdueDays} days overdue beyond ${settings.gracePeriodDays} days grace period)`,
            amount: String(calculatedFine) as any,
            paidAmount: '0.00' as any,
            status: 'UNPAID',
          },
          tx
        );
      }

      return { loan: updatedLoan, fine: generatedFine, fineAmount: calculatedFine };
    });
  }

  public async renewBook(institutionCode: string, loanId: string, input: RenewBookInput) {
    const loan = await libraryRepository.getLoanById(loanId);
    if (!loan || loan.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'LOAN_NOT_FOUND', message: 'Loan record not found' };
    }

    if (loan.status === 'RETURNED') {
      throw { statusCode: 400, code: 'LOAN_RETURNED', message: 'Cannot renew a returned loan.' };
    }

    const settings = await this.getSettings(institutionCode);
    if ((loan.renewalCount || 0) >= settings.renewalLimit) {
      throw {
        statusCode: 400,
        code: 'RENEWAL_LIMIT_EXCEEDED',
        message: `Loan renewal limit of ${settings.renewalLimit} times has been reached.`,
      };
    }

    const extensionDays = input.customDays || settings.loanPeriodDays;
    const currentDueDateObj = new Date(loan.dueDate);
    currentDueDateObj.setDate(currentDueDateObj.getDate() + extensionDays);
    const newDueDateStr = currentDueDateObj.toISOString().split('T')[0];

    return libraryRepository.updateLoan(loanId, {
      dueDate: newDueDateStr as any,
      renewalCount: (loan.renewalCount || 0) + 1,
      status: 'ACTIVE',
    });
  }

  // ==================== FINES & PAYMENTS ====================

  public async listFines(
    institutionCode: string,
    filters?: { search?: string; studentId?: string; status?: string; fineType?: string },
    opts?: { limit?: number; offset?: number }
  ) {
    const { items, total } = await libraryRepository.listFines(institutionCode, filters, opts);

    const enrichedFines = await Promise.all(
      items.map(async (fine) => {
        const student = await libraryRepository.getMemberById(fine.studentId);
        const txns = await libraryRepository.listTransactionsByFineId(fine.id);
        const copy = fine.bookCopyId ? await libraryRepository.getCopyById(fine.bookCopyId) : null;
        const book = copy ? await libraryRepository.getBookById(copy.bookId) : null;

        return {
          ...fine,
          amount: parseFloat(String(fine.amount)),
          paidAmount: parseFloat(String(fine.paidAmount)),
          studentName: student?.fullName || 'Student Member',
          admissionNo: student?.admissionNo || 'ADM',
          classSection: student?.classSection || 'Class',
          accessionNumber: copy?.accessionNumber,
          bookTitle: book?.title,
          paymentTransactions: txns.map((t) => ({
            ...t,
            amount: parseFloat(String(t.amount)),
            cashTendered: t.cashTendered ? parseFloat(String(t.cashTendered)) : undefined,
            changeReturned: t.changeReturned ? parseFloat(String(t.changeReturned)) : undefined,
          })),
        };
      })
    );

    return { data: enrichedFines, total, limit: opts?.limit, offset: opts?.offset };
  }

  public async payFine(institutionCode: string, cashierName: string, fineId: string, input: PayFineInput) {
    const fine = await libraryRepository.getFineById(fineId);
    if (!fine || fine.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'FINE_NOT_FOUND', message: 'Fine record not found' };
    }

    if (fine.status === 'PAID' || fine.status === 'WAIVED') {
      throw { statusCode: 400, code: 'FINE_CLOSED', message: `Fine is already ${fine.status}.` };
    }

    const currentPaid = parseFloat(String(fine.paidAmount || '0'));
    const totalAmount = parseFloat(String(fine.amount));
    const remainingBalance = Math.max(0, totalAmount - currentPaid);

    if (input.amount > remainingBalance + 0.01) {
      throw {
        statusCode: 400,
        code: 'PAYMENT_EXCEEDS_BALANCE',
        message: `Payment amount $${input.amount.toFixed(2)} exceeds remaining balance of $${remainingBalance.toFixed(2)}.`,
      };
    }

    if (input.paymentMethod === 'CASH') {
      const tendered = input.cashTendered || 0;
      if (tendered < input.amount - 0.01) {
        throw { statusCode: 400, code: 'INSUFFICIENT_CASH', message: `Cash tendered ($${tendered.toFixed(2)}) is less than payment amount ($${input.amount.toFixed(2)}).` };
      }
    }

    const newPaidTotal = currentPaid + input.amount;
    const isFullyPaid = newPaidTotal >= totalAmount - 0.01;
    const newStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';
    const receiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;

    if (!db) throw new Error('Database connection unavailable');
    return db.transaction(async (tx) => {
      const transactionRecord = await libraryRepository.createTransaction(
        {
          institutionCode,
          fineId: fine.id,
          receiptNo,
          amount: String(input.amount) as any,
          paymentMethod: input.paymentMethod,
          cashTendered: input.cashTendered ? String(input.cashTendered) as any : null,
          changeReturned: input.changeReturned ? String(input.changeReturned) as any : null,
          transactionRef: input.transactionRef || '',
          scannedQrPayload: input.scannedQrPayload || '',
          paidAt: new Date(),
          cashier: cashierName || 'Librarian Staff',
        },
        tx
      );

      const updatedFine = await libraryRepository.updateFine(
        fine.id,
        {
          paidAmount: String(newPaidTotal) as any,
          status: newStatus as any,
        },
        tx
      );

      return { fine: updatedFine, transaction: transactionRecord };
    });
  }

  public async waiveFine(institutionCode: string, staffName: string, fineId: string, input: WaiveFineInput) {
    const fine = await libraryRepository.getFineById(fineId);
    if (!fine || fine.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'FINE_NOT_FOUND', message: 'Fine record not found' };
    }

    if (fine.status === 'PAID' || fine.status === 'WAIVED') {
      throw { statusCode: 400, code: 'FINE_CLOSED', message: `Fine is already ${fine.status}.` };
    }

    return libraryRepository.updateFine(fineId, {
      status: 'WAIVED',
      waivedBy: staffName || 'Librarian Staff',
      waivedReason: `[${input.reason}] ${input.remarks}`,
    });
  }

  public async assessDamageFine(institutionCode: string, staffName: string, input: CreateDamageFineInput) {
    const student = await libraryRepository.getMemberById(input.studentId);
    if (!student || student.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'MEMBER_NOT_FOUND', message: 'Member not found in this institution' };
    }

    let copy = null;
    if (input.bookCopyId) {
      copy = await libraryRepository.getCopyById(input.bookCopyId);
    }

    if (!db) throw new Error('Database connection unavailable');
    return db.transaction(async (tx) => {
      const newFine = await libraryRepository.createFine(
        {
          institutionCode,
          studentId: input.studentId,
          bookCopyId: input.bookCopyId || null,
          fineType: 'DAMAGED_BOOK',
          damageType: input.damageType,
          damageNotes: input.damageNotes,
          amount: String(input.amount) as any,
          paidAmount: '0.00' as any,
          status: 'UNPAID',
        },
        tx
      );

      let updatedCopy = null;
      if (copy) {
        updatedCopy = await libraryRepository.updateCopy(
          copy.id,
          {
            condition: input.copyCondition || 'DAMAGED',
            status: input.copyStatus || 'UNDER_REPAIR',
          },
          tx
        );
      }

      return { fine: newFine, copy: updatedCopy };
    });
  }

  // ==================== PYQS ====================

  public async listQuestionPapers(
    institutionCode: string,
    filters?: { search?: string; subject?: string; academicYear?: string; classGrade?: string; examType?: string },
    opts?: { limit?: number; offset?: number }
  ) {
    return libraryRepository.listQuestionPapers(institutionCode, filters, opts);
  }

  public async getQuestionPaper(institutionCode: string, id: string) {
    const paper = await libraryRepository.getQuestionPaperById(id);
    if (!paper || paper.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'PYQ_NOT_FOUND', message: 'Question paper record not found' };
    }
    return paper;
  }

  public async createQuestionPaper(institutionCode: string, uploaderName: string, input: CreatePYQInput) {
    return libraryRepository.createQuestionPaper({
      ...input,
      institutionCode,
      uploadedBy: uploaderName || 'Librarian Staff',
      downloadsCount: 0,
      fileUrl: input.fileUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    });
  }

  public async deleteQuestionPaper(institutionCode: string, id: string) {
    await this.getQuestionPaper(institutionCode, id);
    return libraryRepository.deleteQuestionPaper(id);
  }

  public async incrementPYQDownload(institutionCode: string, id: string) {
    await this.getQuestionPaper(institutionCode, id);
    return libraryRepository.incrementPYQDownloads(id);
  }

  // ==================== SETTINGS ====================

  public async getSettings(institutionCode: string) {
    let settings = await libraryRepository.getSettings(institutionCode);
    if (!settings) {
      settings = await libraryRepository.upsertSettings(institutionCode, {});
    }
    return {
      ...settings,
      finePerDay: parseFloat(String(settings.finePerDay)),
      maxFine: parseFloat(String(settings.maxFine)),
      lostBookPenalty: parseFloat(String(settings.lostBookPenalty)),
      damagedBookPenalty: parseFloat(String(settings.damagedBookPenalty)),
      unpaidFineLockThreshold: parseFloat(String(settings.unpaidFineLockThreshold)),
    };
  }

  public async updateSettings(institutionCode: string, input: UpdateLibrarySettingsInput) {
    const updated = await libraryRepository.upsertSettings(institutionCode, {
      ...input,
      finePerDay: input.finePerDay !== undefined ? String(input.finePerDay) as any : undefined,
      maxFine: input.maxFine !== undefined ? String(input.maxFine) as any : undefined,
      lostBookPenalty: input.lostBookPenalty !== undefined ? String(input.lostBookPenalty) as any : undefined,
      damagedBookPenalty: input.damagedBookPenalty !== undefined ? String(input.damagedBookPenalty) as any : undefined,
      unpaidFineLockThreshold: input.unpaidFineLockThreshold !== undefined ? String(input.unpaidFineLockThreshold) as any : undefined,
    });
    return {
      ...updated,
      finePerDay: parseFloat(String(updated.finePerDay)),
      maxFine: parseFloat(String(updated.maxFine)),
      lostBookPenalty: parseFloat(String(updated.lostBookPenalty)),
      damagedBookPenalty: parseFloat(String(updated.damagedBookPenalty)),
      unpaidFineLockThreshold: parseFloat(String(updated.unpaidFineLockThreshold)),
    };
  }

  // ==================== MEMBERS ====================

  public async listMembers(institutionCode: string, filters?: { search?: string }, opts?: { limit?: number; offset?: number }) {
    return libraryRepository.listMembers(institutionCode, filters, opts);
  }

  public async getMemberDetails(institutionCode: string, studentId: string) {
    const member = await libraryRepository.getMemberById(studentId);
    if (!member || member.institutionCode.toLowerCase() !== institutionCode.toLowerCase()) {
      throw { statusCode: 404, code: 'MEMBER_NOT_FOUND', message: 'Member not found' };
    }

    const { items: loans } = await libraryRepository.listLoans(institutionCode, { studentId });
    const { items: fines } = await libraryRepository.listFines(institutionCode, { studentId });
    const reservations = (await libraryRepository.listReservations(institutionCode)).filter((r) => r.studentId === studentId);

    const activeLoansCount = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;

    return {
      member,
      activeLoansCount,
      totalLoansCount: loans.length,
      loans,
      fines,
      reservations,
    };
  }

  // ==================== DASHBOARD & REPORTS ====================

  public async getDashboardStats(institutionCode: string) {
    const books = (await libraryRepository.listBooks(institutionCode)).items;
    const copies = await libraryRepository.listAllCopies(institutionCode);
    const { items: loans } = await libraryRepository.listLoans(institutionCode);
    const { items: fines } = await libraryRepository.listFines(institutionCode);
    const { items: members } = await libraryRepository.listMembers(institutionCode);

    const totalBooks = books.length;
    const totalCopies = copies.length;
    const availableCopies = copies.filter((c) => c.status === 'AVAILABLE').length;
    const issuedCopies = copies.filter((c) => c.status === 'ISSUED').length;
    const overdueLoans = loans.filter((l) => l.status === 'OVERDUE').length;
    const activeLoans = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;

    const totalFinesCollected = fines.reduce((acc, f) => acc + parseFloat(String(f.paidAmount || '0')), 0);
    const totalFinesOutstanding = fines
      .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
      .reduce((acc, f) => acc + (parseFloat(String(f.amount)) - parseFloat(String(f.paidAmount || '0'))), 0);

    return {
      totalBooks,
      totalCopies,
      availableCopies,
      issuedCopies,
      activeLoans,
      overdueLoans,
      totalMembers: members.length,
      totalFinesCollected,
      totalFinesOutstanding,
      recentLoans: loans.slice(0, 5),
    };
  }
}

export const libraryService = new LibraryService();
