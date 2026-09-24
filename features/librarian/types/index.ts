export type BookType = 'TEXTBOOK' | 'REFERENCE' | 'FICTION' | 'NON_FICTION' | 'COMPETITIVE' | 'GENERAL' | string;
export type CopyStatus = 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'OVERDUE' | 'LOST' | 'DAMAGED' | 'UNDER_REPAIR' | 'WITHDRAWN' | string;
export type CopyCondition = 'GOOD' | 'FAIR' | 'DAMAGED' | 'BAD' | string;
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST' | string;
export type ReservationStatus = 'WAITING' | 'AVAILABLE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED' | string;
export type FineType = 'OVERDUE' | 'LOST_BOOK' | 'DAMAGED_BOOK' | 'OTHER' | string;
export type FineStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED' | 'CANCELLED' | string;
export type ExamType = 'MIDTERM' | 'FINAL' | 'UNIT_TEST' | 'ANNUAL' | 'SUPPLEMENTARY' | string;

export type DamageType =
  | 'TORN_PAGES'
  | 'WATER_DAMAGE'
  | 'BINDING_BROKEN'
  | 'COVER_DAMAGED'
  | 'WRITING_ANNOTATIONS'
  | 'MISSING_PAGES'
  | 'SEVERE_MOLD'
  | 'TOTAL_DESTRUCTION'
  | 'GENERAL_WEAR'
  | string;

export type PaymentTransaction = {
  id: string;
  fineId: string;
  receiptNo?: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI_ONLINE' | 'DIGITAL_WALLET' | 'SCANNER_QR' | string;
  cashTendered?: number;
  changeReturned?: number;
  transactionRef?: string;
  scannedQrPayload?: string;
  paidAt: string;
  cashier?: string;
};

export interface Author {
  id: string;
  name: string;
  bio?: string | null;
  biography?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  parentCategoryId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookCopy {
  id: string;
  bookId: string;
  accessionNumber: string;
  barcode?: string | null;
  rack?: string | null;
  shelf?: string | null;
  status: CopyStatus;
  condition: CopyCondition;
  notes?: string | null;
  price?: string | null;
  vendor?: string | null;
  addedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  publisher?: string | null;
  edition?: string | null;
  publicationYear?: number | null;
  language?: string | null;
  categoryId?: string | null;
  subject?: string | null;
  description?: string | null;
  bookType?: BookType | null;
  coverImage?: string | null;
  totalCopies?: number;
  availableCopies?: number;
  keywords?: string[];
  authorIds?: string[];
  authors?: string | null;
  shelfLocation?: string | null;
  pages?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  academicYear: string;
  examType?: ExamType | null;
  classGrade?: string | null;
  totalMarks?: number | null;
  durationMinutes?: number | null;
  fileUrl?: string;
  fileSize?: string | null;
  downloadsCount: number;
  uploadedAt: string;
  uploadedBy: string;
  updatedAt?: string;
}

export interface Loan {
  id: string;
  copyId: string;
  bookId: string;
  studentId: string;
  issuedBy: string;
  issueDate?: string;
  issuedAt?: string;
  dueDate: string;
  returnDate?: string | null;
  returnedAt?: string | null;
  status: LoanStatus;
  renewalCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Reservation {
  id: string;
  bookId: string;
  studentId: string;
  status: ReservationStatus;
  reservedAt: string;
  expiresAt: string;
}

export interface Fine {
  id: string;
  loanId?: string | null;
  bookCopyId?: string | null;
  copyId?: string | null;
  studentId: string;
  fineType: FineType;
  damageType?: DamageType;
  damageNotes?: string | null;
  reason?: string | null;
  amount: number;
  paidAmount: number;
  status: FineStatus;
  waivedBy?: string | null;
  waivedReason?: string | null;
  createdAt: string;
  updatedAt: string;
  paymentTransactions?: PaymentTransaction[];
}

export interface LibrarySettings {
  id?: string;
  borrowingLimit: number;
  loanPeriodDays: number;
  gracePeriodDays: number;
  finePerDay: number | string;
  maxFine: number | string;
  renewalLimit: number;
  allowReservation: boolean;
  lostBookPenalty: number | string;
  damagedBookPenalty: number | string;
  reservationExpiryDays?: number;
  unpaidFineLockThreshold?: number | string;
  openingHours?: string;
  closingHours?: string;
  openOnWeekends?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  admissionNo: string;
  classSection?: string;
  email?: string;
  phone?: string;
  profilePicUrl?: string;
  activeLoansCount?: number;
  totalUnpaidFine?: number;
}
