import { apiClient } from './client';

// ==================== DATA MODELS & TYPES ====================

export interface LibraryCategory {
  id: string;
  institutionCode: string;
  name: string;
  description?: string | null;
  parentCategoryId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryAuthor {
  id: string;
  institutionCode: string;
  name: string;
  biography?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryBook {
  id: string;
  institutionCode: string;
  title: string;
  isbn: string;
  authors?: string | null;
  publisher?: string | null;
  publicationYear?: number | null;
  categoryId?: string | null;
  description?: string | null;
  coverImage?: string | null;
  language?: string | null;
  subject?: string | null;
  edition?: string | null;
  pages?: number | null;
  shelfLocation?: string | null;
  bookType?: string | null;
  totalCopies: number;
  availableCopies: number;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryBookCopy {
  id: string;
  institutionCode: string;
  bookId: string;
  accessionNumber: string;
  barcode?: string | null;
  condition: string;
  status: string;
  purchaseDate?: string | null;
  price?: string | null;
  vendor?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryLoan {
  id: string;
  institutionCode: string;
  bookId: string;
  copyId: string;
  studentId: string;
  issuedBy: string;
  issuedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  renewalCount: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryFine {
  id: string;
  institutionCode: string;
  loanId?: string | null;
  copyId?: string | null;
  studentId: string;
  fineType: string;
  amount: string;
  paidAmount: string;
  status: string;
  reason?: string | null;
  waivedBy?: string | null;
  waivedReason?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryPaymentTransaction {
  id: string;
  institutionCode: string;
  fineId: string;
  studentId: string;
  amount: string;
  paymentMode: string;
  transactionRef?: string | null;
  notes?: string | null;
  paidAt: string;
  recordedBy: string;
  createdAt: string;
}

export interface LibraryPYQ {
  id: string;
  institutionCode: string;
  title: string;
  subject: string;
  academicYear: string;
  classGrade?: string | null;
  examType?: string | null;
  fileUrl: string;
  fileSize?: string | null;
  uploadedBy: string;
  downloadsCount: number;
  uploadedAt: string;
  updatedAt: string;
}

export interface LibrarySettings {
  id: string;
  institutionCode: string;
  borrowingLimit: number;
  loanPeriodDays: number;
  gracePeriodDays: number;
  finePerDay: string;
  maxFine: string;
  renewalLimit: number;
  allowReservation: boolean;
  lostBookPenalty: string;
  damagedBookPenalty: string;
  reservationExpiryDays: number;
  unpaidFineLockThreshold: string;
  openingHours: string;
  closingHours: string;
  openOnWeekends: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryMember {
  id: string;
  fullName: string;
  admissionNo?: string;
  email?: string;
  phone?: string;
  profilePicUrl?: string;
  classSection?: string;
  createdAt?: string;
  activeLoansCount?: number;
  totalUnpaidFine?: number;
}

export interface LibraryDashboardStats {
  totalBooks: number;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  activeLoans: number;
  overdueLoans: number;
  totalFinesAmount: number;
  unpaidFinesAmount: number;
  recentLoans: LibraryLoan[];
  recentFines: LibraryFine[];
}

export interface LibraryReportStats extends LibraryDashboardStats {}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
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
  authors?: string;
  publisher?: string;
  publicationYear?: number;
  categoryId?: string;
  description?: string;
  coverImage?: string;
  language?: string;
  subject?: string;
  edition?: string;
  pages?: number;
  shelfLocation?: string;
  bookType?: string;
  totalCopies?: number;
}

export type UpdateBookPayload = Partial<CreateBookPayload>;

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  parentCategoryId?: string;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface CreateAuthorPayload {
  name: string;
  biography?: string;
}

export interface CreateCopyPayload {
  accessionNumber: string;
  barcode?: string;
  condition?: string;
  status?: string;
  purchaseDate?: string;
  price?: string;
  vendor?: string;
  notes?: string;
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
  bookCopyId: string;
  studentId: string;
  dueDate?: string;
  notes?: string;
}

export interface ReturnBookPayload {
  returnCondition?: string;
  notes?: string;
}

export interface RenewLoanPayload {
  notes?: string;
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
  paymentMode?: string;
  transactionRef?: string;
  notes?: string;
}

export interface WaiveFinePayload {
  reason: string;
}

export interface CreateDamageFinePayload {
  studentId: string;
  bookCopyId?: string;
  loanId?: string;
  fineType: 'DAMAGE' | 'LOST';
  amount: number;
  reason: string;
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
  classGrade?: string;
  examType?: string;
  fileUrl: string;
  fileSize?: string;
}

export type UpdateLibrarySettingsPayload = Partial<Omit<LibrarySettings, 'id' | 'institutionCode' | 'createdAt' | 'updatedAt'>>;

export interface MemberFilters {
  search?: string;
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
): Promise<{ loan: LibraryLoan; fineCreated: boolean; fineAmount: number }> {
  return apiClient<{ loan: LibraryLoan; fineCreated: boolean; fineAmount: number }>(`/library/loans/${id}/return`, {
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

export async function createDamageFineApi(payload: CreateDamageFinePayload): Promise<LibraryFine> {
  return apiClient<LibraryFine>('/library/fines/damage', {
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
  if (filters?.limit) qs.set('limit', String(filters.limit));
  if (filters?.offset) qs.set('offset', String(filters.offset));
  const q = qs.toString();
  return apiClient<PaginatedResult<LibraryMember>>(`/library/members${q ? `?${q}` : ''}`);
}

export async function getMemberApi(id: string): Promise<{
  member: LibraryMember;
  activeLoans: LibraryLoan[];
  borrowingHistory: LibraryLoan[];
  fines: LibraryFine[];
}> {
  return apiClient<{
    member: LibraryMember;
    activeLoans: LibraryLoan[];
    borrowingHistory: LibraryLoan[];
    fines: LibraryFine[];
  }>(`/library/members/${id}`);
}

// ==================== DASHBOARD & REPORT APIS ====================

export async function getLibraryDashboardApi(): Promise<LibraryDashboardStats> {
  return apiClient<LibraryDashboardStats>('/library/dashboard');
}

export async function getLibraryReportsApi(): Promise<LibraryReportStats> {
  return apiClient<LibraryReportStats>('/library/reports');
}
