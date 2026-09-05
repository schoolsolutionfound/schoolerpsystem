/**
 * @file useLibraryStore.ts
 * @description Centralized Zustand state management for School Library Management.
 *
 * Covers:
 *  - Book Catalogue & Stock Management + E-Book Support
 *  - Book Borrowing, Issue, Renew & Return Workflow
 *  - Automated Overdue & Late Return Fine Calculation (₹5/day)
 *  - Digital Entry & Exit Gatekeeper & Real-Time Footfall / Occupancy Tracker
 *  - Book Hold & Reservation Queue with automatic availability notifications
 *  - Official Library No-Dues Clearance Certificate Generator
 *  - In-App Overdue & Fine Notification Dispatcher
 *  - Direct Sync to Central Finance Store on Fine Collection
 */

import { create } from 'zustand';
import {
  Book,
  BorrowedBook,
  LibraryEntryExitLog,
  LibraryFine,
  BookReservation,
  LibraryClearanceCertificate,
  InAppLibraryReminder,
  VisitorPurpose,
} from '../types/library';
import { useFinanceStore } from '../../accountant/store/useFinanceStore';

interface LibraryState {
  books: Book[];
  loans: BorrowedBook[];
  entryLogs: LibraryEntryExitLog[];
  fines: LibraryFine[];
  reservations: BookReservation[];
  clearanceCertificates: LibraryClearanceCertificate[];
  inAppReminders: InAppLibraryReminder[];
  maxCapacity: number;
  finePerDay: number; // default ₹5

  // Book Inventory Actions
  addBook: (book: Omit<Book, 'id'>) => void;
  updateBook: (id: string, updates: Partial<Book>) => void;
  deleteBook: (id: string) => void;

  // Loan Actions
  issueBook: (params: {
    bookId: string;
    borrowerId: string;
    borrowerName: string;
    borrowerRole: 'student' | 'teacher' | 'staff';
    borrowerClass?: string;
    borrowerPhone?: string;
    accessionNumber?: string;
    dueDays?: number; // default 14 days
  }) => BorrowedBook;

  returnBook: (
    loanId: string,
    options?: {
      paidFineImmediately?: boolean;
      paymentMethod?: 'cash' | 'upi';
      waiveFine?: boolean;
      waiveReason?: string;
    }
  ) => void;

  renewLoan: (loanId: string, additionalDays?: number) => void;

  // Fine Actions
  collectFine: (fineId: string, paymentMethod?: 'cash' | 'upi') => void;
  waiveFine: (fineId: string, reason: string) => void;

  // Gatekeeper Entry/Exit Actions
  checkInVisitor: (params: {
    visitorId?: string;
    visitorName: string;
    visitorRole: 'student' | 'teacher' | 'staff';
    className?: string;
    purpose: VisitorPurpose;
    tableNumber?: string;
  }) => void;

  checkOutVisitor: (logId: string) => void;

  // Hold & Reservation Actions
  reserveBook: (params: {
    bookId: string;
    studentId: string;
    studentName: string;
    className: string;
  }) => BookReservation;

  fulfillReservation: (reservationId: string) => void;
  cancelReservation: (reservationId: string) => void;

  // In-App Notification Actions
  sendInAppReminder: (params: {
    recipientId: string;
    recipientName: string;
    title: string;
    message: string;
    type: 'overdue_fine' | 'due_soon' | 'book_available' | 'clearance';
  }) => void;

  // Clearance Actions
  generateClearanceCertificate: (params: {
    studentId: string;
    studentName: string;
    className: string;
    rollNo: string;
    clearedBy?: string;
  }) => LibraryClearanceCertificate;

  getStudentClearanceEligibility: (studentName: string) => {
    isEligible: boolean;
    activeLoanCount: number;
    pendingFinesTotal: number;
    reason?: string;
  };

  // Selectors
  getTotalBooksCount: () => number;
  getTotalCopiesCount: () => number;
  getActiveLoansCount: () => number;
  getOverdueLoansCount: () => number;
  getInsideVisitorsCount: () => number;
  getPendingFinesTotal: () => number;
  getCollectedFinesTotal: () => number;
}

const INITIAL_BOOKS: Book[] = [
  {
    id: 'b-101',
    title: 'Concepts of Physics (Vol 1 & 2)',
    author: 'Dr. H. C. Verma',
    isbn: '978-8177091878',
    category: 'science',
    totalCopies: 12,
    availableCopies: 8,
    rackLocation: 'Rack S-02, Shelf 3',
    publisher: 'Bharati Bhawan',
    editionYear: '2024',
    coverColor: '#0284C7',
    summary: 'Essential reference for mechanics, thermodynamics, and wave optics.',
    isEBook: true,
    pdfUrl: 'https://example.com/ebooks/concepts-of-physics.pdf',
  },
  {
    id: 'b-102',
    title: 'Higher Algebra: Classical & Modern',
    author: 'Hall & Knight',
    isbn: '978-9351762145',
    category: 'mathematics',
    totalCopies: 8,
    availableCopies: 5,
    rackLocation: 'Rack M-01, Shelf 2',
    publisher: 'Arihant Classics',
    editionYear: '2023',
    coverColor: '#7E57C2',
    summary: 'Comprehensive treatise on progressions, series, and permutations.',
    isEBook: true,
  },
  {
    id: 'b-103',
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0061120084',
    category: 'literature',
    totalCopies: 6,
    availableCopies: 4,
    rackLocation: 'Rack L-04, Shelf 1',
    publisher: 'HarperCollins',
    editionYear: '2020',
    coverColor: '#059669',
    summary: 'Pulitzer prize-winning masterpiece on empathy and justice.',
    isEBook: true,
  },
  {
    id: 'b-104',
    title: 'Introduction to Algorithms (CLRS)',
    author: 'Cormen, Leiserson, Rivest, Stein',
    isbn: '978-0262033848',
    category: 'computer_science',
    totalCopies: 5,
    availableCopies: 3,
    rackLocation: 'Rack CS-01, Shelf 4',
    publisher: 'MIT Press',
    editionYear: '2022',
    coverColor: '#EA580C',
    summary: 'Standard authoritative textbook on data structures and algorithmic complexity.',
    isEBook: true,
  },
  {
    id: 'b-105',
    title: 'India That Is Bharat: Coloniality, Civilisation',
    author: 'J. Sai Deepak',
    isbn: '978-9391050849',
    category: 'history',
    totalCopies: 4,
    availableCopies: 3,
    rackLocation: 'Rack H-03, Shelf 2',
    publisher: 'Bloomsbury India',
    editionYear: '2023',
    coverColor: '#D97706',
    summary: 'Foundational historical study on civilization and constitutional jurisprudence.',
  },
  {
    id: 'b-106',
    title: 'Oxford Advanced Learner’s Dictionary (10th Ed)',
    author: 'Oxford University Press',
    isbn: '978-0194798488',
    category: 'reference',
    totalCopies: 10,
    availableCopies: 9,
    rackLocation: 'Reference Desk R-01',
    publisher: 'Oxford University Press',
    editionYear: '2024',
    coverColor: '#2563EB',
    summary: 'Definitive reference for vocabulary, pronunciation, and usage.',
    isEBook: true,
  },
];

const INITIAL_LOANS: BorrowedBook[] = [
  {
    id: 'loan-1',
    bookId: 'b-101',
    bookTitle: 'Concepts of Physics (Vol 1 & 2)',
    bookIsbn: '978-8177091878',
    borrowerId: 'std-1082',
    borrowerName: 'Rohan Verma',
    borrowerRole: 'student',
    borrowerClass: 'Class 10-A',
    borrowerPhone: '+91 98765 43210',
    accessionNumber: 'ACC-8821',
    issueDate: '2026-08-20',
    dueDate: '2026-09-03', // 2 days overdue from Sep 5
    status: 'overdue',
    fineAmount: 15,
    fineStatus: 'pending',
    notes: 'In-app reminder sent to student.',
  },
  {
    id: 'loan-2',
    bookId: 'b-103',
    bookTitle: 'To Kill a Mockingbird',
    bookIsbn: '978-0061120084',
    borrowerId: 'std-1094',
    borrowerName: 'Ananya Deshmukh',
    borrowerRole: 'student',
    borrowerClass: 'Class 11-B',
    borrowerPhone: '+91 98123 45678',
    accessionNumber: 'ACC-8910',
    issueDate: '2026-08-28',
    dueDate: '2026-09-11',
    status: 'borrowed',
    fineAmount: 0,
    fineStatus: 'none',
  },
  {
    id: 'loan-3',
    bookId: 'b-104',
    bookTitle: 'Introduction to Algorithms (CLRS)',
    bookIsbn: '978-0262033848',
    borrowerId: 'tch-201',
    borrowerName: 'Mr. Vikrant Mehra',
    borrowerRole: 'teacher',
    borrowerClass: 'Computer Science Faculty',
    borrowerPhone: '+91 97654 32109',
    accessionNumber: 'ACC-7041',
    issueDate: '2026-08-15',
    dueDate: '2026-09-15',
    status: 'borrowed',
    fineAmount: 0,
    fineStatus: 'none',
  },
  {
    id: 'loan-4',
    bookId: 'b-102',
    bookTitle: 'Higher Algebra: Classical & Modern',
    bookIsbn: '978-9351762145',
    borrowerId: 'std-1045',
    borrowerName: 'Kabir Mehta',
    borrowerRole: 'student',
    borrowerClass: 'Class 12-A',
    accessionNumber: 'ACC-6102',
    issueDate: '2026-08-01',
    dueDate: '2026-08-15',
    returnDate: '2026-08-19',
    status: 'returned',
    fineAmount: 20,
    fineStatus: 'paid',
    finePaidDate: '2026-08-19',
    fineReceiptNo: 'LIB-REC-402',
  },
];

const INITIAL_ENTRY_LOGS: LibraryEntryExitLog[] = [
  {
    id: 'entry-1',
    visitorId: 'std-1082',
    visitorName: 'Rohan Verma',
    visitorRole: 'student',
    className: 'Class 10-A',
    entryTime: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    purpose: 'Self Study',
    status: 'inside',
    tableNumber: 'T-14',
  },
  {
    id: 'entry-2',
    visitorId: 'std-1094',
    visitorName: 'Ananya Deshmukh',
    visitorRole: 'student',
    className: 'Class 11-B',
    entryTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    purpose: 'Book Issue / Return',
    status: 'inside',
    tableNumber: 'T-08',
  },
  {
    id: 'entry-3',
    visitorId: 'tch-201',
    visitorName: 'Mr. Vikrant Mehra',
    visitorRole: 'teacher',
    className: 'CS Dept',
    entryTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    exitTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    durationMinutes: 75,
    purpose: 'Research & Reference',
    status: 'exited',
    tableNumber: 'Faculty Desk 2',
  },
  {
    id: 'entry-4',
    visitorId: 'std-1102',
    visitorName: 'Pooja Hegde',
    visitorRole: 'student',
    className: 'Class 9-C',
    entryTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    purpose: 'Digital Lab Access',
    status: 'inside',
    tableNumber: 'PC-04',
  },
];

const INITIAL_FINES: LibraryFine[] = [
  {
    id: 'fine-1',
    borrowId: 'loan-1',
    bookTitle: 'Concepts of Physics (Vol 1 & 2)',
    borrowerName: 'Rohan Verma',
    borrowerRole: 'student',
    className: 'Class 10-A',
    daysLate: 3,
    amount: 15,
    status: 'pending',
    date: '2026-09-05',
  },
  {
    id: 'fine-2',
    borrowId: 'loan-4',
    bookTitle: 'Higher Algebra: Classical & Modern',
    borrowerName: 'Kabir Mehta',
    borrowerRole: 'student',
    className: 'Class 12-A',
    daysLate: 4,
    amount: 20,
    status: 'paid',
    date: '2026-08-19',
    receiptNo: 'LIB-REC-402',
  },
];

const INITIAL_RESERVATIONS: BookReservation[] = [
  {
    id: 'res-1',
    bookId: 'b-104',
    bookTitle: 'Introduction to Algorithms (CLRS)',
    studentId: 'std-1082',
    studentName: 'Rohan Verma',
    className: 'Class 10-A',
    reservedDate: '2026-09-02',
    status: 'waiting',
  },
];

const INITIAL_CLEARANCE: LibraryClearanceCertificate[] = [
  {
    id: 'clr-1',
    studentId: 'std-1045',
    studentName: 'Kabir Mehta',
    className: 'Class 12-A',
    rollNo: '22',
    certificateNo: 'LIB-NODUE-2026-904',
    issueDate: '2026-08-25',
    status: 'cleared',
    clearedBy: 'Chief Librarian',
  },
];

const INITIAL_REMINDERS: InAppLibraryReminder[] = [
  {
    id: 'rem-1',
    recipientId: 'std-1082',
    recipientName: 'Rohan Verma',
    title: 'Book Return Overdue Notice',
    message: 'Concepts of Physics was due on 03-Sep-2026. Current fine: ₹15. Please return at circulation desk.',
    date: '2026-09-04',
    type: 'overdue_fine',
    read: false,
  },
];

export const useLibraryStore = create<LibraryState>((set, get) => ({
  books: INITIAL_BOOKS,
  loans: INITIAL_LOANS,
  entryLogs: INITIAL_ENTRY_LOGS,
  fines: INITIAL_FINES,
  reservations: INITIAL_RESERVATIONS,
  clearanceCertificates: INITIAL_CLEARANCE,
  inAppReminders: INITIAL_REMINDERS,
  maxCapacity: 60,
  finePerDay: 5,

  addBook: (bookData) => {
    const newBook: Book = {
      ...bookData,
      id: `b-${Date.now().toString().slice(-4)}`,
      availableCopies: bookData.availableCopies ?? bookData.totalCopies,
    };
    set((state) => ({ books: [newBook, ...state.books] }));
  },

  updateBook: (id, updates) => {
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
  },

  deleteBook: (id) => {
    set((state) => ({
      books: state.books.filter((b) => b.id !== id),
    }));
  },

  issueBook: ({
    bookId,
    borrowerId,
    borrowerName,
    borrowerRole,
    borrowerClass,
    borrowerPhone,
    accessionNumber,
    dueDays = 14,
  }) => {
    const book = get().books.find((b) => b.id === bookId);
    if (!book) throw new Error('Book not found in library catalogue.');
    if (book.availableCopies <= 0) throw new Error('No available copies left to issue.');

    const today = new Date();
    const dueDateObj = new Date(today.getTime() + dueDays * 24 * 60 * 60 * 1000);

    const issueDateStr = today.toISOString().slice(0, 10);
    const dueDateStr = dueDateObj.toISOString().slice(0, 10);

    const newLoan: BorrowedBook = {
      id: `loan-${Date.now().toString().slice(-5)}`,
      bookId,
      bookTitle: book.title,
      bookIsbn: book.isbn,
      borrowerId,
      borrowerName,
      borrowerRole,
      borrowerClass,
      borrowerPhone,
      accessionNumber: accessionNumber || `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: issueDateStr,
      dueDate: dueDateStr,
      status: 'borrowed',
      fineAmount: 0,
      fineStatus: 'none',
    };

    set((state) => ({
      loans: [newLoan, ...state.loans],
      books: state.books.map((b) =>
        b.id === bookId ? { ...b, availableCopies: Math.max(0, b.availableCopies - 1) } : b
      ),
    }));

    return newLoan;
  },

  returnBook: (loanId, options) => {
    const loan = get().loans.find((l) => l.id === loanId);
    if (!loan) return;

    const returnDateStr = new Date().toISOString().slice(0, 10);
    const dueDateObj = new Date(loan.dueDate);
    const returnDateObj = new Date(returnDateStr);

    let daysLate = 0;
    if (returnDateObj > dueDateObj) {
      const diffTime = returnDateObj.getTime() - dueDateObj.getTime();
      daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const fineAmount = daysLate * get().finePerDay;
    let fineStatus: 'none' | 'pending' | 'paid' | 'waived' = 'none';
    let receiptNo: string | undefined;

    if (fineAmount > 0) {
      let resolvedStatus: 'pending' | 'paid' | 'waived' = 'pending';

      if (options?.waiveFine) {
        resolvedStatus = 'waived';
        fineStatus = 'waived';
      } else if (options?.paidFineImmediately) {
        resolvedStatus = 'paid';
        fineStatus = 'paid';
        receiptNo = `LIB-REC-${Math.floor(1000 + Math.random() * 9000)}`;

        // Reactively record fine in central accounts ledger
        try {
          useFinanceStore.getState().addIncome({
            title: `Library Fine: ${loan.borrowerName} (${loan.bookTitle})`,
            category: 'misc',
            payerName: loan.borrowerName,
            studentId: loan.borrowerId,
            classSection: loan.borrowerClass,
            amount: fineAmount,
            paymentMethod: options.paymentMethod || 'cash',
            paymentDate: returnDateStr,
            status: 'paid',
            notes: `Overdue return by ${daysLate} days (${loan.accessionNumber})`,
          });
        } catch (err) {
          console.warn('[useLibraryStore] Could not post fine to finance store', err);
        }
      } else {
        fineStatus = 'pending';
        resolvedStatus = 'pending';
      }

      // Add to Fines Ledger
      const newFine: LibraryFine = {
        id: `fine-${Date.now().toString().slice(-4)}`,
        borrowId: loan.id,
        bookTitle: loan.bookTitle,
        borrowerName: loan.borrowerName,
        borrowerRole: loan.borrowerRole,
        className: loan.borrowerClass,
        daysLate,
        amount: fineAmount,
        status: resolvedStatus,
        date: returnDateStr,
        receiptNo,
        waiveReason: options?.waiveReason,
      };

      set((state) => ({ fines: [newFine, ...state.fines] }));
    }

    // Check if there is a pending reservation waiting for this book
    const waitingRes = get().reservations.find(
      (r) => r.bookId === loan.bookId && r.status === 'waiting'
    );

    if (waitingRes) {
      // Auto notify reserved student
      get().sendInAppReminder({
        recipientId: waitingRes.studentId,
        recipientName: waitingRes.studentName,
        title: 'Reserved Book Available!',
        message: `Your reserved copy of "${waitingRes.bookTitle}" is now available at the circulation desk. Please claim it within 48 hours.`,
        type: 'book_available',
      });

      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === waitingRes.id
            ? { ...r, status: 'available', notifiedDate: returnDateStr }
            : r
        ),
      }));
    }

    set((state) => ({
      loans: state.loans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'returned',
              returnDate: returnDateStr,
              fineAmount,
              fineStatus,
              finePaidDate: fineStatus === 'paid' ? returnDateStr : undefined,
              fineReceiptNo: receiptNo,
            }
          : l
      ),
      books: state.books.map((b) =>
        b.id === loan.bookId
          ? { ...b, availableCopies: Math.min(b.totalCopies, b.availableCopies + 1) }
          : b
      ),
    }));
  },

  renewLoan: (loanId, additionalDays = 14) => {
    set((state) => ({
      loans: state.loans.map((l) => {
        if (l.id !== loanId) return l;
        const currentDue = new Date(l.dueDate);
        const newDue = new Date(currentDue.getTime() + additionalDays * 24 * 60 * 60 * 1000);
        return {
          ...l,
          dueDate: newDue.toISOString().slice(0, 10),
          status: 'borrowed',
        };
      }),
    }));
  },

  collectFine: (fineId, paymentMethod = 'upi') => {
    const fine = get().fines.find((f) => f.id === fineId);
    if (!fine) return;

    const receiptNo = `LIB-REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    set((state) => ({
      fines: state.fines.map((f) =>
        f.id === fineId ? { ...f, status: 'paid', receiptNo } : f
      ),
      loans: state.loans.map((l) =>
        l.id === fine.borrowId
          ? { ...l, fineStatus: 'paid', finePaidDate: todayStr, fineReceiptNo: receiptNo }
          : l
      ),
    }));

    // Post to School Accounts Income Ledger
    try {
      useFinanceStore.getState().addIncome({
        title: `Library Fine: ${fine.borrowerName} (${fine.bookTitle})`,
        category: 'misc',
        payerName: fine.borrowerName,
        classSection: fine.className,
        amount: fine.amount,
        paymentMethod,
        paymentDate: todayStr,
        status: 'paid',
        notes: `Library late return fee (${fine.daysLate} days late)`,
      });
    } catch (err) {
      console.warn('[useLibraryStore] Could not post to finance store', err);
    }
  },

  waiveFine: (fineId, reason) => {
    const fine = get().fines.find((f) => f.id === fineId);
    if (!fine) return;

    set((state) => ({
      fines: state.fines.map((f) =>
        f.id === fineId ? { ...f, status: 'waived', waiveReason: reason } : f
      ),
      loans: state.loans.map((l) =>
        l.id === fine.borrowId ? { ...l, fineStatus: 'waived' } : l
      ),
    }));
  },

  checkInVisitor: ({ visitorId, visitorName, visitorRole, className, purpose, tableNumber }) => {
    const newLog: LibraryEntryExitLog = {
      id: `entry-${Date.now().toString().slice(-4)}`,
      visitorId: visitorId || `vis-${Date.now().toString().slice(-3)}`,
      visitorName,
      visitorRole,
      className,
      entryTime: new Date().toISOString(),
      purpose,
      status: 'inside',
      tableNumber,
    };
    set((state) => ({ entryLogs: [newLog, ...state.entryLogs] }));
  },

  checkOutVisitor: (logId) => {
    const now = new Date();
    set((state) => ({
      entryLogs: state.entryLogs.map((log) => {
        if (log.id !== logId) return log;
        const entryDate = new Date(log.entryTime);
        const durationMinutes = Math.max(
          1,
          Math.round((now.getTime() - entryDate.getTime()) / (1000 * 60))
        );
        return {
          ...log,
          exitTime: now.toISOString(),
          durationMinutes,
          status: 'exited',
        };
      }),
    }));
  },

  reserveBook: ({ bookId, studentId, studentName, className }) => {
    const book = get().books.find((b) => b.id === bookId);
    if (!book) throw new Error('Book not found.');

    const newRes: BookReservation = {
      id: `res-${Date.now().toString().slice(-4)}`,
      bookId,
      bookTitle: book.title,
      studentId,
      studentName,
      className,
      reservedDate: new Date().toISOString().slice(0, 10),
      status: 'waiting',
    };

    set((state) => ({ reservations: [newRes, ...state.reservations] }));
    return newRes;
  },

  fulfillReservation: (reservationId) => {
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'fulfilled' } : r
      ),
    }));
  },

  cancelReservation: (reservationId) => {
    set((state) => ({
      reservations: state.reservations.map((r) =>
        r.id === reservationId ? { ...r, status: 'cancelled' } : r
      ),
    }));
  },

  sendInAppReminder: ({ recipientId, recipientName, title, message, type }) => {
    const newReminder: InAppLibraryReminder = {
      id: `rem-${Date.now().toString().slice(-4)}`,
      recipientId,
      recipientName,
      title,
      message,
      date: new Date().toISOString().slice(0, 10),
      type,
      read: false,
    };

    set((state) => ({ inAppReminders: [newReminder, ...state.inAppReminders] }));
  },

  generateClearanceCertificate: ({ studentId, studentName, className, rollNo, clearedBy = 'Chief Librarian' }) => {
    const cert: LibraryClearanceCertificate = {
      id: `clr-${Date.now().toString().slice(-4)}`,
      studentId,
      studentName,
      className,
      rollNo,
      certificateNo: `LIB-NODUE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      issueDate: new Date().toISOString().slice(0, 10),
      status: 'cleared',
      clearedBy,
    };

    set((state) => ({ clearanceCertificates: [cert, ...state.clearanceCertificates] }));
    return cert;
  },

  getStudentClearanceEligibility: (studentName) => {
    const activeLoans = get().loans.filter(
      (l) =>
        l.borrowerName.toLowerCase().includes(studentName.toLowerCase()) &&
        (l.status === 'borrowed' || l.status === 'overdue')
    );

    const pendingFines = get().fines.filter(
      (f) =>
        f.borrowerName.toLowerCase().includes(studentName.toLowerCase()) &&
        f.status === 'pending'
    );

    const pendingFinesTotal = pendingFines.reduce((sum, f) => sum + f.amount, 0);

    if (activeLoans.length > 0) {
      return {
        isEligible: false,
        activeLoanCount: activeLoans.length,
        pendingFinesTotal,
        reason: `${activeLoans.length} active borrowed book(s) must be returned first.`,
      };
    }

    if (pendingFinesTotal > 0) {
      return {
        isEligible: false,
        activeLoanCount: 0,
        pendingFinesTotal,
        reason: `Pending library fine of ₹${pendingFinesTotal} must be settled.`,
      };
    }

    return {
      isEligible: true,
      activeLoanCount: 0,
      pendingFinesTotal: 0,
    };
  },

  getTotalBooksCount: () => get().books.length,
  getTotalCopiesCount: () => get().books.reduce((sum, b) => sum + b.totalCopies, 0),
  getActiveLoansCount: () =>
    get().loans.filter((l) => l.status === 'borrowed' || l.status === 'overdue').length,
  getOverdueLoansCount: () => get().loans.filter((l) => l.status === 'overdue').length,
  getInsideVisitorsCount: () =>
    get().entryLogs.filter((log) => log.status === 'inside').length,
  getPendingFinesTotal: () =>
    get()
      .fines.filter((f) => f.status === 'pending')
      .reduce((sum, f) => sum + f.amount, 0),
  getCollectedFinesTotal: () =>
    get()
      .fines.filter((f) => f.status === 'paid')
      .reduce((sum, f) => sum + f.amount, 0),
}));
