/**
 * @file library.ts
 * @description Data models and types for the Complete School Library Management module.
 */

export type BookCategory =
  | 'science'
  | 'mathematics'
  | 'literature'
  | 'computer_science'
  | 'history'
  | 'reference'
  | 'fiction'
  | 'general';

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  totalCopies: number;
  availableCopies: number;
  rackLocation: string; // e.g. "Rack B-04, Shelf 2"
  publisher: string;
  editionYear: string;
  coverColor?: string;
  summary?: string;
}

export type LoanStatus = 'borrowed' | 'returned' | 'overdue';
export type FineStatus = 'none' | 'pending' | 'paid' | 'waived';

export interface BorrowedBook {
  id: string;
  bookId: string;
  bookTitle: string;
  bookIsbn: string;
  borrowerId: string;
  borrowerName: string;
  borrowerRole: 'student' | 'teacher' | 'staff';
  borrowerClass?: string; // e.g. "Class 10-A"
  borrowerPhone?: string;
  accessionNumber: string; // e.g. "ACC-8821"
  issueDate: string; // "YYYY-MM-DD"
  dueDate: string; // "YYYY-MM-DD"
  returnDate?: string; // "YYYY-MM-DD"
  status: LoanStatus;
  fineAmount: number; // e.g. 25
  fineStatus: FineStatus;
  finePaidDate?: string;
  fineReceiptNo?: string;
  notes?: string;
}

export type VisitorPurpose =
  | 'Self Study'
  | 'Book Issue / Return'
  | 'Research & Reference'
  | 'Digital Lab Access'
  | 'Class Reading Period'
  | 'Faculty Research';

export interface LibraryEntryExitLog {
  id: string;
  visitorId: string;
  visitorName: string;
  visitorRole: 'student' | 'teacher' | 'staff';
  className?: string;
  entryTime: string; // "YYYY-MM-DDTHH:mm:ss"
  exitTime?: string; // "YYYY-MM-DDTHH:mm:ss"
  durationMinutes?: number;
  purpose: VisitorPurpose;
  status: 'inside' | 'exited';
  tableNumber?: string;
}

export interface LibraryFine {
  id: string;
  borrowId: string;
  bookTitle: string;
  borrowerName: string;
  borrowerRole: 'student' | 'teacher' | 'staff';
  className?: string;
  daysLate: number;
  amount: number;
  status: 'pending' | 'paid' | 'waived';
  date: string;
  receiptNo?: string;
  waiveReason?: string;
}
