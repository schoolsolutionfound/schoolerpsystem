import { z } from 'zod';

export const BookTypes = ['TEXTBOOK', 'REFERENCE', 'FICTION', 'NON_FICTION', 'COMPETITIVE', 'GENERAL'] as const;
export const CopyStatuses = ['AVAILABLE', 'ISSUED', 'RESERVED', 'OVERDUE', 'LOST', 'DAMAGED', 'UNDER_REPAIR', 'WITHDRAWN'] as const;
export const CopyConditions = ['GOOD', 'FAIR', 'DAMAGED', 'BAD'] as const;
export const LoanStatuses = ['ACTIVE', 'RETURNED', 'OVERDUE', 'LOST'] as const;
export const ReservationStatuses = ['WAITING', 'AVAILABLE', 'FULFILLED', 'CANCELLED', 'EXPIRED'] as const;
export const FineTypes = ['OVERDUE', 'LOST_BOOK', 'DAMAGED_BOOK', 'OTHER'] as const;
export const FineStatuses = ['UNPAID', 'PARTIALLY_PAID', 'PAID', 'WAIVED', 'CANCELLED'] as const;
export const ExamTypes = ['MIDTERM', 'FINAL', 'UNIT_TEST', 'ANNUAL', 'SUPPLEMENTARY'] as const;
export const PaymentMethods = ['CASH', 'CARD', 'UPI_ONLINE', 'DIGITAL_WALLET', 'SCANNER_QR'] as const;
export const DamageTypes = [
  'TORN_PAGES',
  'WATER_DAMAGE',
  'BINDING_BROKEN',
  'COVER_DAMAGED',
  'WRITING_ANNOTATIONS',
  'MISSING_PAGES',
  'SEVERE_MOLD',
  'TOTAL_DESTRUCTION',
  'GENERAL_WEAR',
] as const;

// ---------- Book Schemas ----------

export const CreateBookSchema = z.object({
  title: z.string().min(1, 'Book title is required'),
  isbn: z.string().min(1, 'ISBN number is required'),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  publicationYear: z.number().int().optional(),
  language: z.string().optional().default('English'),
  categoryId: z.string().min(1, 'Category is required'),
  subject: z.string().optional(),
  description: z.string().optional(),
  bookType: z.enum(BookTypes).optional().default('TEXTBOOK'),
  coverImage: z.string().optional(),
  keywords: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(',').map((k) => k.trim()).filter(Boolean);
  }),
  authorIds: z.union([z.array(z.string()), z.string()]).optional().transform((val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(',').map((a) => a.trim()).filter(Boolean);
  }),
  totalCopies: z.number().int().min(1).optional().default(1),
});

export const UpdateBookSchema = CreateBookSchema.omit({ totalCopies: true }).partial();

export const BookQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  bookType: z.enum(BookTypes).optional(),
  language: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ---------- Category Schemas ----------

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
});

export const UpdateCategorySchema = CreateCategorySchema.partial();

// ---------- Author Schemas ----------

export const CreateAuthorSchema = z.object({
  name: z.string().min(1, 'Author name is required'),
  bio: z.string().optional(),
});

export const UpdateAuthorSchema = CreateAuthorSchema.partial();

// ---------- Physical Copy Schemas ----------

export const CreateCopySchema = z.object({
  accessionNumber: z.string().min(1, 'Accession number is required'),
  barcode: z.string().min(1, 'Barcode is required'),
  rack: z.string().optional().default('Rack A'),
  shelf: z.string().optional().default('Shelf 1'),
  status: z.enum(CopyStatuses).optional().default('AVAILABLE'),
  condition: z.enum(CopyConditions).optional().default('GOOD'),
});

export const UpdateCopySchema = CreateCopySchema.partial();

// ---------- Loan / Issue Schemas ----------

export const IssueBookSchema = z.object({
  bookId: z.string().min(1, 'Book ID is required'),
  copyId: z.string().min(1, 'Copy ID is required'),
  studentId: z.string().min(1, 'Student/Member ID is required'),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  customDays: z.number().int().min(1).optional(),
});

export const ReturnBookSchema = z.object({
  copyId: z.string().optional(),
  condition: z.enum(CopyConditions).optional().default('GOOD'),
  returnDate: z.string().optional(),
});

export const RenewBookSchema = z.object({
  customDays: z.number().int().min(1).optional(),
});

export const LoanQuerySchema = z.object({
  search: z.string().optional(),
  studentId: z.string().optional(),
  bookId: z.string().optional(),
  copyId: z.string().optional(),
  status: z.enum(LoanStatuses).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ---------- Fine & Payment Schemas ----------

export const PayFineSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(PaymentMethods),
  cashTendered: z.number().optional(),
  changeReturned: z.number().optional(),
  transactionRef: z.string().optional(),
  scannedQrPayload: z.string().optional(),
});

export const WaiveFineSchema = z.object({
  reason: z.string().min(1, 'Exemption reason is required'),
  remarks: z.string().min(1, 'Justification remarks are required'),
});

export const CreateDamageFineSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  bookCopyId: z.string().optional(),
  damageType: z.enum(DamageTypes),
  amount: z.number().positive('Fine amount must be greater than zero'),
  damageNotes: z.string().min(1, 'Damage description is required'),
  copyCondition: z.enum(CopyConditions).optional().default('DAMAGED'),
  copyStatus: z.enum(CopyStatuses).optional().default('UNDER_REPAIR'),
});

export const FineQuerySchema = z.object({
  search: z.string().optional(),
  studentId: z.string().optional(),
  status: z.enum(FineStatuses).optional(),
  fineType: z.enum(FineTypes).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ---------- PYQ Schemas ----------

export const CreatePYQSchema = z.object({
  title: z.string().min(1, 'Paper title is required'),
  subject: z.string().min(1, 'Subject is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  examType: z.enum(ExamTypes),
  classGrade: z.string().min(1, 'Class/Grade is required'),
  totalMarks: z.number().int().optional().default(100),
  durationMinutes: z.number().int().optional().default(180),
  fileUrl: z.string().optional(),
});

export const PYQQuerySchema = z.object({
  search: z.string().optional(),
  subject: z.string().optional(),
  academicYear: z.string().optional(),
  classGrade: z.string().optional(),
  examType: z.enum(ExamTypes).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ---------- Settings Schema ----------

export const UpdateLibrarySettingsSchema = z.object({
  borrowingLimit: z.number().int().min(1).optional(),
  loanPeriodDays: z.number().int().min(1).optional(),
  gracePeriodDays: z.number().int().min(0).optional(),
  finePerDay: z.number().min(0).optional(),
  maxFine: z.number().min(0).optional(),
  renewalLimit: z.number().int().min(0).optional(),
  allowReservation: z.boolean().optional(),
  lostBookPenalty: z.number().min(0).optional(),
  damagedBookPenalty: z.number().min(0).optional(),
  reservationExpiryDays: z.number().int().min(1).optional(),
  unpaidFineLockThreshold: z.number().min(0).optional(),
  openingHours: z.string().optional(),
  closingHours: z.string().optional(),
  openOnWeekends: z.boolean().optional(),
});

// ---------- Member Query Schema ----------

export const MemberQuerySchema = z.object({
  search: z.string().optional(),
  classSection: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// ---------- Types ----------

export type CreateBookInput = z.infer<typeof CreateBookSchema>;
export type UpdateBookInput = z.infer<typeof UpdateBookSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;
export type CreateAuthorInput = z.infer<typeof CreateAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof UpdateAuthorSchema>;
export type CreateCopyInput = z.infer<typeof CreateCopySchema>;
export type UpdateCopyInput = z.infer<typeof UpdateCopySchema>;
export type IssueBookInput = z.infer<typeof IssueBookSchema>;
export type ReturnBookInput = z.infer<typeof ReturnBookSchema>;
export type RenewBookInput = z.infer<typeof RenewBookSchema>;
export type PayFineInput = z.infer<typeof PayFineSchema>;
export type WaiveFineInput = z.infer<typeof WaiveFineSchema>;
export type CreateDamageFineInput = z.infer<typeof CreateDamageFineSchema>;
export type CreatePYQInput = z.infer<typeof CreatePYQSchema>;
export type UpdateLibrarySettingsInput = z.infer<typeof UpdateLibrarySettingsSchema>;
