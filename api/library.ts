import { apiClient } from './client';

// ==================== DATA MODELS & TYPES ====================

export interface LibraryCategory {
  id: string;
  institutionCode: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  bookCount?: number;
}

export interface LibraryAuthor {
  id: string;
  institutionCode: string;
  name: string;
  bio?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LibraryBook {
  id: string;
  institutionCode: string;
  title: string;
  isbn: string;
  publisher?: string | null;
  edition?: string | null;
  publicationYear?: number | null;
  language: string;
  categoryId: string;
  subject?: string | null;
  description?: string | null;
  bookType: string;
  coverImage?: string | null;
  keywords?: string[] | null;
  authorIds?: string[] | null;
  totalCopies?: number;
  availableCopies?: number;
  category?: LibraryCategory | null;
  copies?: LibraryBookCopy[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LibraryBookCopy {
  id: string;
  institutionCode: string;
  bookId: string;
  accessionNumber: string;
  barcode: string;
  rack?: string | null;
  shelf?: string | null;
  status: string;
  condition: string;
  addedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LibraryLoan {
  id: string;
  institutionCode: string;
  copyId: string;
  bookId: string;
  studentId: string;
  issuedBy: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string | null;
  status: string;
  renewalCount: number;
  createdAt?: string;
  updatedAt?: string;
  // Joined fields from list endpoint
  bookTitle?: string;
  accessionNumber?: string;
  barcode?: string;
  studentName?: string;
  admissionNo?: string;
  classSection?: string;
}

export interface LibraryFine {
  id: string;
  institutionCode: string;
  loanId?: string | null;
  bookCopyId?: string | null;
  studentId: string;
  fineType: string;
  damageType?: string | null;
  damageNotes?: string | null;
  amount: number | string;
  paidAmount: number | string;
  status: string;
  waivedBy?: string | null;
  waivedReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // Joined fields from list endpoint
  studentName?: string;
  admissionNo?: string;
  classSection?: string;
  accessionNumber?: string;
  bookTitle?: string;
  paymentTransactions?: LibraryPaymentTransaction[];
}

export interface LibraryPaymentTransaction {
  id: string;
  institutionCode: string;
  fineId: string;
  receiptNo: string;
  amount: number | string;
  paymentMethod: string;
  cashTendered?: number | string | null;
  changeReturned?: number | string | null;
  transactionRef?: string | null;
  scannedQrPayload?: string | null;
  paidAt?: string;
  cashier?: string | null;
  createdAt?: string;
}

export interface LibraryReservation {
  id: string;
  institutionCode: string;
  bookId: string;
  studentId: string;
  status: string;
  reservedAt?: string;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LibraryPYQ {
  id: string;
  institutionCode: string;
  title: string;
  subject: string;
  academicYear: string;
  examType: string;
  classGrade: string;
  totalMarks: number;
  durationMinutes: number;
  fileUrl?: string | null;
  downloadsCount: number;
  uploadedBy: string;
  uploadedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LibrarySettings {
  id: string;
  institutionCode: string;
  borrowingLimit: number;
  loanPeriodDays: number;
  gracePeriodDays: number;
  finePerDay: number;
  maxFine: number;
  renewalLimit: number;
  allowReservation: boolean;
  lostBookPenalty: number;
  damagedBookPenalty: number;
  reservationExpiryDays: number;
  unpaidFineLockThreshold: number;
  openingHours?: string | null;
  closingHours?: string | null;
  openOnWeekends: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LibraryMember {
  id: string;
  fullName: string;
  admissionNo?: string | null;
  email?: string | null;
  phone?: string | null;
  profilePicUrl?: string | null;
  classSection?: string | null;
  activeLoansCount?: number;
  institutionCode?: string;
  createdAt?: string;
}

export interface LibraryMemberDetails {
  member: LibraryMember;
  activeLoansCount: number;
  totalLoansCount: number;
  loans: LibraryLoan[];
  fines: LibraryFine[];
  reservations: LibraryReservation[];
}

export interface LibraryDashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  activeLoans: number;
  overdueLoans: number;
  totalMembers: number;
  totalFinesCollected: number;
  totalFinesOutstanding: number;
  recentLoans: LibraryLoan[];
}

export type LibraryReportStats = LibraryDashboardStats;

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
}

// ==================== QUERY & PAYLOAD INTERFACES ====================

export interface BookFilters {
  search?: string;
  categoryId?: string;
  bookType?: string;
  language?: string;
  limit?: number;
  offset?: number;
}

export interface CreateBookPayload {
  title: string;
  isbn: string;
  publisher?: string;
  edition?: string;
  publicationYear?: number;
  language?: string;
  categoryId: string;
  subject?: string;
  description?: string;
  bookType?: string;
  coverImage?: string;
  keywords?: string[];
  authorIds?: string[];
  totalCopies?: number;
}

export type UpdateBookPayload = Partial<CreateBookPayload>;

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  parentId?: string | null;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface CreateAuthorPayload {
  name: string;
  bio?: string;
}

export interface CreateCopyPayload {
  accessionNumber: string;
  barcode: string;
  rack?: string;
  shelf?: string;
  status?: string;
  condition?: string;
}

export type UpdateCopyPayload = Partial<CreateCopyPayload>;

export interface LoanFilters {
  search?: string;
  studentId?: string;
  bookId?: string;
  copyId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface IssueBookPayload {
  bookId: string;
  copyId: string;
  studentId: string;
  issueDate?: string;
  dueDate?: string;
  customDays?: number;
}

export interface ReturnBookPayload {
  copyId?: string;
  condition?: string;
  returnDate?: string;
}

export interface RenewLoanPayload {
  customDays?: number;
}

export interface FineFilters {
  search?: string;
  studentId?: string;
  status?: string;
  fineType?: string;
  limit?: number;
  offset?: number;
}

export interface PayFinePayload {
  amount: number;
  paymentMethod: string; // 'CASH' | 'CARD' | 'UPI_ONLINE' | 'DIGITAL_WALLET' | 'SCANNER_QR'
  cashTendered?: number;
  changeReturned?: number;
  transactionRef?: string;
  scannedQrPayload?: string;
}

export interface WaiveFinePayload {
  reason: string;
  remarks: string;
}

export interface CreateDamageFinePayload {
  studentId: string;
  bookCopyId?: string;
  damageType: string; // TORN_PAGES | WATER_DAMAGE | ...
  amount: number;
  damageNotes: string;
  copyCondition?: string;
  copyStatus?: string;
}

export interface PYQFilters {
  search?: string;
  subject?: string;
  academicYear?: string;
  classGrade?: string;
  examType?: string;
  limit?: number;
  offset?: number;
}

export interface CreatePYQPayload {
  title: string;
  subject: string;
  academicYear: string;
  examType: string;
  classGrade: string;
  totalMarks?: number;
  durationMinutes?: number;
  fileUrl?: string;
}

export type UpdateLibrarySettingsPayload = Partial<{
  borrowingLimit: number;
  loanPeriodDays: number;
  gracePeriodDays: number;
  finePerDay: number;
  maxFine: number;
  renewalLimit: number;
  allowReservation: boolean;
  lostBookPenalty: number;
  damagedBookPenalty: number;
  reservationExpiryDays: number;
  unpaidFineLockThreshold: number;
  openingHours: string;
  closingHours: string;
  openOnWeekends: boolean;
}>;

export interface MemberFilters {
  search?: string;
  classSection?: string;
  limit?: number;
  offset?: number;
}

// ==================== BOOK APIS ====================

export async function getBooksApi(filters?: BookFilters): Promise<PaginatedResult<LibraryBook>> {
  const qs = new URLSearchParams();
  if (filters?.search) qs.set('search', filters.search);
  if (filters?.categoryId) qs.set('categoryId', filters.categoryId);
  if (filters?.bookType) qs.set('bookType', filters.bookType);
  if (filters?.language) qs.set('language', filters.language);
  if (filters?.limit) qs.set('limit', String(filters.limit));
  if (filters?.offset) qs.set('offset', String(filters.offset));
  const q = qs.toString();
  return apiClient<PaginatedResult<LibraryBook>>(`/library/books${q ? `?${q}` : ''}`);
}

export async function getBookApi(id: string): Promise<LibraryBook> {
  return apiClient<LibraryBook>(`/library/books/${id}`);
}

export async function createBookApi(payload: CreateBookPayload): Promise<LibraryBook> {
  return apiClient<LibraryBook>('/library/books', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateBookApi(id: string, payload: UpdateBookPayload): Promise<LibraryBook> {
  return apiClient<LibraryBook>(`/library/books/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteBookApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/library/books/${id}`, {
    method: 'DELETE',
  });
}

// ==================== CATEGORY APIS ====================

export async function getCategoriesApi(): Promise<LibraryCategory[]> {
  return apiClient<LibraryCategory[]>('/library/categories');
}

export async function getCategoryApi(id: string): Promise<LibraryCategory> {
  return apiClient<LibraryCategory>(`/library/categories/${id}`);
}

export async function createCategoryApi(payload: CreateCategoryPayload): Promise<LibraryCategory> {
  return apiClient<LibraryCategory>('/library/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCategoryApi(id: string, payload: UpdateCategoryPayload): Promise<LibraryCategory> {
  return apiClient<LibraryCategory>(`/library/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCategoryApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/library/categories/${id}`, {
    method: 'DELETE',
  });
}

// ==================== AUTHOR APIS ====================

export async function getAuthorsApi(): Promise<LibraryAuthor[]> {
  return apiClient<LibraryAuthor[]>('/library/authors');
}

export async function createAuthorApi(payload: CreateAuthorPayload): Promise<LibraryAuthor> {
  return apiClient<LibraryAuthor>('/library/authors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==================== PHYSICAL COPY APIS ====================

export async function getBookCopiesApi(bookId: string): Promise<LibraryBookCopy[]> {
  return apiClient<LibraryBookCopy[]>(`/library/books/${bookId}/copies`);
}

export async function getCopyApi(id: string): Promise<LibraryBookCopy> {
  return apiClient<LibraryBookCopy>(`/library/copies/${id}`);
}

export async function createCopyApi(bookId: string, payload: CreateCopyPayload): Promise<LibraryBookCopy> {
  return apiClient<LibraryBookCopy>(`/library/books/${bookId}/copies`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCopyApi(id: string, payload: UpdateCopyPayload): Promise<LibraryBookCopy> {
  return apiClient<LibraryBookCopy>(`/library/copies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCopyApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/library/copies/${id}`, {
    method: 'DELETE',
  });
}

// ==================== LOAN APIS ====================

export async function getLoansApi(filters?: LoanFilters): Promise<PaginatedResult<LibraryLoan>> {
  const qs = new URLSearchParams();
  if (filters?.search) qs.set('search', filters.search);
  if (filters?.studentId) qs.set('studentId', filters.studentId);
  if (filters?.bookId) qs.set('bookId', filters.bookId);
  if (filters?.copyId) qs.set('copyId', filters.copyId);
  if (filters?.status) qs.set('status', filters.status);
  if (filters?.limit) qs.set('limit', String(filters.limit));
  if (filters?.offset) qs.set('offset', String(filters.offset));
  const q = qs.toString();
  return apiClient<PaginatedResult<LibraryLoan>>(`/library/loans${q ? `?${q}` : ''}`);
}

export async function issueBookApi(payload: IssueBookPayload): Promise<LibraryLoan> {
  return apiClient<LibraryLoan>('/library/loans/issue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function returnBookApi(
  id: string,
  payload?: ReturnBookPayload
): Promise<{ loan: LibraryLoan; fine: LibraryFine | null; fineAmount: number }> {
  return apiClient<{ loan: LibraryLoan; fine: LibraryFine | null; fineAmount: number }>(`/library/loans/${id}/return`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

export async function renewLoanApi(id: string, payload?: RenewLoanPayload): Promise<LibraryLoan> {
  return apiClient<LibraryLoan>(`/library/loans/${id}/renew`, {
    method: 'POST',
    body: JSON.stringify(payload || {}),
  });
}

// ==================== FINE APIS ====================

export async function getFinesApi(filters?: FineFilters): Promise<PaginatedResult<LibraryFine>> {
  const qs = new URLSearchParams();
  if (filters?.search) qs.set('search', filters.search);
  if (filters?.studentId) qs.set('studentId', filters.studentId);
  if (filters?.status) qs.set('status', filters.status);
  if (filters?.fineType) qs.set('fineType', filters.fineType);
  if (filters?.limit) qs.set('limit', String(filters.limit));
  if (filters?.offset) qs.set('offset', String(filters.offset));
  const q = qs.toString();
  return apiClient<PaginatedResult<LibraryFine>>(`/library/fines${q ? `?${q}` : ''}`);
}

export async function payFineApi(
  id: string,
  payload: PayFinePayload
): Promise<{ fine: LibraryFine; transaction: LibraryPaymentTransaction }> {
  return apiClient<{ fine: LibraryFine; transaction: LibraryPaymentTransaction }>(`/library/fines/${id}/pay`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function waiveFineApi(id: string, payload: WaiveFinePayload): Promise<LibraryFine> {
  return apiClient<LibraryFine>(`/library/fines/${id}/waive`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createDamageFineApi(payload: CreateDamageFinePayload): Promise<{ fine: LibraryFine; copy: LibraryBookCopy | null }> {
  return apiClient<{ fine: LibraryFine; copy: LibraryBookCopy | null }>('/library/fines/damage', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==================== PYQ APIS ====================

export async function getPYQsApi(filters?: PYQFilters): Promise<PaginatedResult<LibraryPYQ>> {
  const qs = new URLSearchParams();
  if (filters?.search) qs.set('search', filters.search);
  if (filters?.subject) qs.set('subject', filters.subject);
  if (filters?.academicYear) qs.set('academicYear', filters.academicYear);
  if (filters?.classGrade) qs.set('classGrade', filters.classGrade);
  if (filters?.examType) qs.set('examType', filters.examType);
  if (filters?.limit) qs.set('limit', String(filters.limit));
  if (filters?.offset) qs.set('offset', String(filters.offset));
  const q = qs.toString();
  return apiClient<PaginatedResult<LibraryPYQ>>(`/library/pyqs${q ? `?${q}` : ''}`);
}

export async function createPYQApi(payload: CreatePYQPayload): Promise<LibraryPYQ> {
  return apiClient<LibraryPYQ>('/library/pyqs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deletePYQApi(id: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/library/pyqs/${id}`, {
    method: 'DELETE',
  });
}

export async function trackPYQDownloadApi(id: string): Promise<LibraryPYQ> {
  return apiClient<LibraryPYQ>(`/library/pyqs/${id}/download`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

// ==================== SETTINGS APIS ====================

export async function getLibrarySettingsApi(): Promise<LibrarySettings> {
  return apiClient<LibrarySettings>('/library/settings');
}

export async function updateLibrarySettingsApi(payload: UpdateLibrarySettingsPayload): Promise<LibrarySettings> {
  return apiClient<LibrarySettings>('/library/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

// ==================== MEMBER APIS ====================

export async function getMembersApi(filters?: MemberFilters): Promise<PaginatedResult<LibraryMember>> {
  const qs = new URLSearchParams();
  if (filters?.search) qs.set('search', filters.search);
  if (filters?.classSection) qs.set('classSection', filters.classSection);
  if (filters?.limit) qs.set('limit', String(filters.limit));
  if (filters?.offset) qs.set('offset', String(filters.offset));
  const q = qs.toString();
  return apiClient<PaginatedResult<LibraryMember>>(`/library/members${q ? `?${q}` : ''}`);
}

export async function getMemberApi(id: string): Promise<LibraryMemberDetails> {
  return apiClient<LibraryMemberDetails>(`/library/members/${id}`);
}

// ==================== DASHBOARD & REPORT APIS ====================

export async function getLibraryDashboardApi(): Promise<LibraryDashboardStats> {
  return apiClient<LibraryDashboardStats>('/library/dashboard');
}

export async function getLibraryReportsApi(): Promise<LibraryReportStats> {
  return apiClient<LibraryReportStats>('/library/reports');
}
