import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the repository before importing the service
vi.mock('../library.repository.js', () => ({
  libraryRepository: {
    getBookById: vi.fn(),
    getCopyById: vi.fn(),
    getActiveLoanByCopyId: vi.fn(),
    getMemberById: vi.fn(),
    getSettings: vi.fn(),
    upsertSettings: vi.fn(),
    countActiveLoansByStudent: vi.fn(),
    sumUnpaidFinesByStudent: vi.fn(),
    createLoan: vi.fn(),
    updateLoan: vi.fn(),
    updateCopy: vi.fn(),
    getLoanById: vi.fn(),
    listLoans: vi.fn(),
    listFines: vi.fn(),
    listMembers: vi.fn(),
    updateMember: vi.fn(),
    listAllCopies: vi.fn(),
    listReservations: vi.fn(),
    getFineById: vi.fn(),
    updateFine: vi.fn(),
    applyFinePayment: vi.fn(),
    createTransaction: vi.fn(),
    createFine: vi.fn(),
    countLoansByCopyId: vi.fn(),
    deleteCopy: vi.fn(),
    listBooks: vi.fn(),
    listCategories: vi.fn(),
    countBooksByCategory: vi.fn(),
    countBooks: vi.fn(),
    countCopiesByStatus: vi.fn(),
    countLoansByStatus: vi.fn(),
    sumFines: vi.fn(),
    countMembers: vi.fn(),
    listRecentLoans: vi.fn(),
    countCopiesInInstitution: vi.fn(),
    countTransactionsInInstitution: vi.fn(),
    syncOverdueLoans: vi.fn(),
  },
}));

vi.mock('../../shared/db/index.js', () => ({
  db: {
    transaction: vi.fn(async (fn: any) => fn({})),
  },
  getDb: () => ({}),
}));

import { LibraryService } from '../library.service.js';
import { libraryRepository } from '../library.repository.js';

const svc = new LibraryService();
const INST = 'TST001';

function mockSettings(overrides = {}): any {
  return {
    id: 'set-1',
    institutionCode: INST,
    borrowingLimit: 3,
    loanPeriodDays: 14,
    gracePeriodDays: 2,
    finePerDay: '1.00',
    maxFine: '100.00',
    renewalLimit: 2,
    allowReservation: true,
    lostBookPenalty: '50.00',
    damagedBookPenalty: '25.00',
    reservationExpiryDays: 7,
    unpaidFineLockThreshold: '20.00',
    openingHours: '08:00 AM',
    closingHours: '06:00 PM',
    openOnWeekends: true,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function mockBook(id = 'b1'): any {
  return {
    id,
    institutionCode: INST,
    title: 'Test Book',
    isbn: '123',
    publisher: '',
    edition: '',
    publicationYear: null,
    language: 'English',
    categoryId: 'cat-1',
    subject: '',
    description: '',
    bookType: 'TEXTBOOK',
    coverImage: '',
    keywords: [],
    authorIds: [],
    createdAt: null,
    updatedAt: null,
  };
}
function mockCopy(id = 'c1', overrides: any = {}): any {
  return { id, bookId: 'b1', institutionCode: INST, accessionNumber: 'ACC-001', barcode: 'BAR-001', status: 'AVAILABLE', condition: 'GOOD', createdAt: null, updatedAt: null, ...overrides };
}
function mockStudent(id = 's1', overrides: any = {}): any {
  return { id, fullName: 'Test Student', admissionNo: 'ADM-001', institutionCode: INST, classSection: 'Class 10', email: 'a@b.c', phone: null, profilePicUrl: null, createdAt: null, ...overrides };
}
function mockLoan(id = 'l1', overrides: any = {}): any {
  return {
    id,
    institutionCode: INST,
    bookId: 'b1',
    copyId: 'c1',
    studentId: 's1',
    issuedBy: 'staff',
    issueDate: '2026-09-01',
    dueDate: '2026-09-15',
    returnDate: null,
    status: 'ACTIVE',
    renewalCount: 0,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}
function mockFine(id = 'f1', overrides: any = {}): any {
  return {
    id,
    institutionCode: INST,
    loanId: null,
    bookCopyId: null,
    studentId: 's1',
    fineType: 'OVERDUE',
    damageType: null,
    damageNotes: '',
    amount: '10.00',
    paidAmount: '0.00',
    status: 'UNPAID',
    waivedBy: null,
    waivedReason: '',
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('issueBook', () => {
  it('rejects when copy is not AVAILABLE', async () => {
    vi.mocked(libraryRepository.getBookById).mockResolvedValue(mockBook());
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1', { status: 'ISSUED' }));

    await expect(
      svc.issueBook(INST, 'staff-user', { bookId: 'b1', copyId: 'c1', studentId: 's1' } as any)
    ).rejects.toMatchObject({ code: 'COPY_UNAVAILABLE' });
  });

  it('rejects when copy already has an active loan', async () => {
    vi.mocked(libraryRepository.getBookById).mockResolvedValue(mockBook());
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.getActiveLoanByCopyId).mockResolvedValue(mockLoan('l-old'));

    await expect(
      svc.issueBook(INST, 'staff-user', { bookId: 'b1', copyId: 'c1', studentId: 's1' } as any)
    ).rejects.toMatchObject({ code: 'COPY_ALREADY_ISSUED' });
  });

  it('rejects when student exceeds borrowing limit', async () => {
    vi.mocked(libraryRepository.getBookById).mockResolvedValue(mockBook());
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.getActiveLoanByCopyId).mockResolvedValue(undefined);
    vi.mocked(libraryRepository.getMemberById).mockResolvedValue(mockStudent());
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings({ borrowingLimit: 1 }));
    vi.mocked(libraryRepository.countActiveLoansByStudent).mockResolvedValue(1);

    await expect(
      svc.issueBook(INST, 'staff-user', { bookId: 'b1', copyId: 'c1', studentId: 's1' } as any)
    ).rejects.toMatchObject({ code: 'BORROWING_LIMIT_EXCEEDED' });
  });

  it('rejects when unpaid fines exceed lock threshold', async () => {
    vi.mocked(libraryRepository.getBookById).mockResolvedValue(mockBook());
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.getActiveLoanByCopyId).mockResolvedValue(undefined);
    vi.mocked(libraryRepository.getMemberById).mockResolvedValue(mockStudent());
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings({ unpaidFineLockThreshold: '20.00' }));
    vi.mocked(libraryRepository.countActiveLoansByStudent).mockResolvedValue(0);
    vi.mocked(libraryRepository.sumUnpaidFinesByStudent).mockResolvedValue(25);

    await expect(
      svc.issueBook(INST, 'staff-user', { bookId: 'b1', copyId: 'c1', studentId: 's1' } as any)
    ).rejects.toMatchObject({ code: 'UNPAID_FINE_LOCK' });
  });

  it('issues successfully with default dates and marks copy ISSUED', async () => {
    vi.mocked(libraryRepository.getBookById).mockResolvedValue(mockBook());
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.getActiveLoanByCopyId).mockResolvedValue(undefined);
    vi.mocked(libraryRepository.getMemberById).mockResolvedValue(mockStudent());
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings());
    vi.mocked(libraryRepository.countActiveLoansByStudent).mockResolvedValue(0);
    vi.mocked(libraryRepository.sumUnpaidFinesByStudent).mockResolvedValue(0);
    vi.mocked(libraryRepository.createLoan).mockResolvedValue(mockLoan('l-new'));
    vi.mocked(libraryRepository.updateCopy).mockResolvedValue(mockCopy('c1', { status: 'ISSUED' }));

    const result = await svc.issueBook(INST, 'staff-user', { bookId: 'b1', copyId: 'c1', studentId: 's1' } as any);
    expect(result).toMatchObject({ id: 'l-new', status: 'ACTIVE' });
    expect(libraryRepository.updateCopy).toHaveBeenCalledWith('c1', { status: 'ISSUED' }, expect.anything());
  });
});

describe('returnBook', () => {
  it('rejects already-returned loan', async () => {
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { status: 'RETURNED' }));

    await expect(svc.returnBook(INST, 'l1', {} as any)).rejects.toMatchObject({ code: 'LOAN_ALREADY_RETURNED' });
  });

  it('returns within grace period without a fine', async () => {
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { dueDate: '2026-09-15' }));
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings({ gracePeriodDays: 2 }));
    vi.mocked(libraryRepository.updateLoan).mockResolvedValue(mockLoan('l1', { status: 'RETURNED' }));
    vi.mocked(libraryRepository.updateCopy).mockResolvedValue(mockCopy('c1'));

    const res = await svc.returnBook(INST, 'l1', { returnDate: '2026-09-16' } as any);
    expect(res.fineAmount).toBe(0);
    expect(res.fine).toBeNull();
  });

  it('charges fine beyond grace period, capped at maxFine', async () => {
    // due 2026-09-15, returned 2026-09-25 → 10 days late − 2 grace = 8 days × ₹1 = ₹8
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { dueDate: '2026-09-15' }));
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings({ gracePeriodDays: 2, finePerDay: '1.00', maxFine: '100.00' }));
    vi.mocked(libraryRepository.updateLoan).mockResolvedValue(mockLoan('l1', { status: 'RETURNED' }));
    vi.mocked(libraryRepository.updateCopy).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.createFine).mockResolvedValue(mockFine('f-new'));

    const res = await svc.returnBook(INST, 'l1', { returnDate: '2026-09-25' } as any);
    expect(res.fineAmount).toBe(8);
    expect(libraryRepository.createFine).toHaveBeenCalled();
  });

  it('caps fine at maxFine regardless of days overdue', async () => {
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { dueDate: '2026-01-01' }));
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings({ gracePeriodDays: 0, finePerDay: '10.00', maxFine: '100.00' }));
    vi.mocked(libraryRepository.updateLoan).mockResolvedValue(mockLoan('l1', { status: 'RETURNED' }));
    vi.mocked(libraryRepository.updateCopy).mockResolvedValue(mockCopy('c1'));
    vi.mocked(libraryRepository.createFine).mockResolvedValue(mockFine('f-cap'));

    const res = await svc.returnBook(INST, 'l1', { returnDate: '2026-12-31' } as any);
    expect(res.fineAmount).toBe(100); // capped
  });
});

describe('payFine', () => {
  it('rejects closed fine', async () => {
    vi.mocked(libraryRepository.getFineById).mockResolvedValue(mockFine('f1', { status: 'PAID' }));
    await expect(
      svc.payFine(INST, 'Cashier', 'f1', { amount: 5, paymentMethod: 'CASH' } as any)
    ).rejects.toMatchObject({ code: 'FINE_CLOSED' });
  });

  it('rejects payment exceeding remaining balance', async () => {
    vi.mocked(libraryRepository.getFineById).mockResolvedValue(mockFine('f1', { amount: '10.00', paidAmount: '4.00' }));
    await expect(
      svc.payFine(INST, 'Cashier', 'f1', { amount: 10, paymentMethod: 'CASH' } as any)
    ).rejects.toMatchObject({ code: 'PAYMENT_EXCEEDS_BALANCE' });
  });

  it('rejects insufficient cash tendered', async () => {
    vi.mocked(libraryRepository.getFineById).mockResolvedValue(mockFine('f1', { amount: '10.00', paidAmount: '0.00' }));
    await expect(
      svc.payFine(INST, 'Cashier', 'f1', { amount: 10, paymentMethod: 'CASH', cashTendered: 5 } as any)
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_CASH' });
  });

  it('creates transaction and applies atomic payment', async () => {
    vi.mocked(libraryRepository.getFineById).mockResolvedValue(mockFine('f1', { amount: '10.00', paidAmount: '0.00' }));
    vi.mocked(libraryRepository.countTransactionsInInstitution).mockResolvedValue(41);
    vi.mocked(libraryRepository.createTransaction).mockResolvedValue({ id: 'txn1', receiptNo: 'REC-000042', institutionCode: INST, fineId: 'f1', amount: '10.00', paymentMethod: 'CASH', cashTendered: null, changeReturned: null, transactionRef: '', scannedQrPayload: '', paidAt: null, cashier: 'Cashier', createdAt: null } as any);
    vi.mocked(libraryRepository.applyFinePayment).mockResolvedValue(mockFine('f1', { amount: '10.00', paidAmount: '10.00', status: 'PAID' }));

    const res = await svc.payFine(INST, 'Cashier', 'f1', { amount: 10, paymentMethod: 'CASH', cashTendered: 10 } as any);
    expect(res.transaction.receiptNo).toBe('REC-000042');
    expect(res.fine.status).toBe('PAID');
    expect(libraryRepository.applyFinePayment).toHaveBeenCalledWith('f1', 10, expect.anything());
  });

  it('throws race conflict when applyFinePayment returns undefined', async () => {
    vi.mocked(libraryRepository.getFineById).mockResolvedValue(mockFine('f1', { amount: '10.00', paidAmount: '0.00' }));
    vi.mocked(libraryRepository.countTransactionsInInstitution).mockResolvedValue(0);
    vi.mocked(libraryRepository.createTransaction).mockResolvedValue({ id: 'txn-race', receiptNo: 'REC-000001', institutionCode: INST, fineId: 'f1', amount: '5.00', paymentMethod: 'CASH', cashTendered: null, changeReturned: null, transactionRef: '', scannedQrPayload: '', paidAt: null, cashier: 'Cashier', createdAt: null } as any);
    vi.mocked(libraryRepository.applyFinePayment).mockResolvedValue(undefined);

    await expect(
      svc.payFine(INST, 'Cashier', 'f1', { amount: 5, paymentMethod: 'CASH', cashTendered: 5 } as any)
    ).rejects.toMatchObject({ code: 'FINE_RACE_CONFLICT' });
  });
});

describe('waiveFine', () => {
  it('rejects already-closed fine', async () => {
    vi.mocked(libraryRepository.getFineById).mockResolvedValue(mockFine('f1', { status: 'WAIVED' }));
    await expect(
      svc.waiveFine(INST, 'Staff', 'f1', { reason: 'OTHER', remarks: 'n/a' } as any)
    ).rejects.toMatchObject({ code: 'FINE_CLOSED' });
  });

  it('waives unpaid fine with reason + remarks', async () => {
    vi.mocked(libraryRepository.getFineById).mockResolvedValue(mockFine('f1', { status: 'UNPAID' }));
    vi.mocked(libraryRepository.updateFine).mockResolvedValue(mockFine('f1', { status: 'WAIVED' }));

    const res = await svc.waiveFine(INST, 'Staff', 'f1', { reason: 'LOST_WAIVED', remarks: 'Book recovered' } as any);
    expect(res?.status).toBe('WAIVED');
    expect(libraryRepository.updateFine).toHaveBeenCalledWith('f1', expect.objectContaining({ status: 'WAIVED' }));
  });
});

describe('renewBook', () => {
  it('rejects returned loan', async () => {
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { status: 'RETURNED' }));
    await expect(svc.renewBook(INST, 'l1', {} as any)).rejects.toMatchObject({ code: 'LOAN_RETURNED' });
  });

  it('rejects when renewal limit reached', async () => {
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { renewalCount: 2 }));
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings({ renewalLimit: 2 }));
    vi.mocked(libraryRepository.sumUnpaidFinesByStudent).mockResolvedValue(0);

    await expect(svc.renewBook(INST, 'l1', {} as any)).rejects.toMatchObject({ code: 'RENEWAL_LIMIT_EXCEEDED' });
  });

  it('rejects renewal when unpaid fines exceed lock threshold', async () => {
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { renewalCount: 0 }));
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings({ unpaidFineLockThreshold: '20.00' }));
    vi.mocked(libraryRepository.sumUnpaidFinesByStudent).mockResolvedValue(25);

    await expect(svc.renewBook(INST, 'l1', {} as any)).rejects.toMatchObject({ code: 'UNPAID_FINE_LOCK' });
  });

  it('extends due date and increments renewal count', async () => {
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { dueDate: '2026-09-15', renewalCount: 1 }));
    vi.mocked(libraryRepository.getSettings).mockResolvedValue(mockSettings({ renewalLimit: 2, loanPeriodDays: 14 }));
    vi.mocked(libraryRepository.sumUnpaidFinesByStudent).mockResolvedValue(0);
    vi.mocked(libraryRepository.updateLoan).mockResolvedValue({} as any);

    const res = await svc.renewBook(INST, 'l1', {} as any);
    expect(libraryRepository.updateLoan).toHaveBeenCalledWith('l1', expect.objectContaining({ renewalCount: 2, status: 'ACTIVE' }));
    expect(res).toBeDefined();
  });
});

describe('tenancy (institution scoping)', () => {
  it('returnBook throws LOAN_NOT_FOUND for cross-institution loan', async () => {
    vi.mocked(libraryRepository.getLoanById).mockResolvedValue(mockLoan('l1', { institutionCode: 'OTHER_INST' }));
    await expect(svc.returnBook(INST, 'l1', {} as any)).rejects.toMatchObject({ code: 'LOAN_NOT_FOUND' });
  });

  it('payFine throws FINE_NOT_FOUND for cross-institution fine', async () => {
    vi.mocked(libraryRepository.getFineById).mockResolvedValue(mockFine('f1', { institutionCode: 'OTHER_INST' }));
    await expect(
      svc.payFine(INST, 'Cashier', 'f1', { amount: 5, paymentMethod: 'CASH' } as any)
    ).rejects.toMatchObject({ code: 'FINE_NOT_FOUND' });
  });

  it('getMemberDetails throws MEMBER_NOT_FOUND for cross-institution member', async () => {
    vi.mocked(libraryRepository.getMemberById).mockResolvedValue(mockStudent('s1', { institutionCode: 'OTHER_INST' }));
    await expect(svc.getMemberDetails(INST, 's1')).rejects.toMatchObject({ code: 'MEMBER_NOT_FOUND' });
  });
});

describe('global copies and member updates', () => {
  it('lists copies scoped to the librarian institution', async () => {
    vi.mocked(libraryRepository.listAllCopies).mockResolvedValue([mockCopy('c1')] as any);

    await expect(svc.listCopies(INST)).resolves.toHaveLength(1);
    expect(libraryRepository.listAllCopies).toHaveBeenCalledWith(INST);
  });

  it('updates a member in the same institution', async () => {
    vi.mocked(libraryRepository.getMemberById).mockResolvedValue(mockStudent('s1'));
    vi.mocked(libraryRepository.updateMember).mockResolvedValue(mockStudent('s1', { fullName: 'Updated' }));

    const result = await svc.updateMember(INST, 's1', { fullName: 'Updated' });
    expect(result.fullName).toBe('Updated');
    expect(libraryRepository.updateMember).toHaveBeenCalledWith('s1', { fullName: 'Updated' });
  });

  it('rejects member updates across institutions', async () => {
    vi.mocked(libraryRepository.getMemberById).mockResolvedValue(mockStudent('s1', { institutionCode: 'OTHER_INST' }));

    await expect(svc.updateMember(INST, 's1', { fullName: 'Nope' })).rejects.toMatchObject({ code: 'MEMBER_NOT_FOUND' });
    expect(libraryRepository.updateMember).not.toHaveBeenCalled();
  });
});

describe('deleteCopy (LIB-18 ledger protection)', () => {
  it('rejects delete when copy has any loan history', async () => {
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1', { institutionCode: INST }));
    vi.mocked(libraryRepository.countLoansByCopyId).mockResolvedValue(3);

    await expect(svc.deleteCopy(INST, 'c1')).rejects.toMatchObject({ code: 'COPY_HAS_LOAN_HISTORY' });
  });

  it('deletes when no loan history exists', async () => {
    vi.mocked(libraryRepository.getCopyById).mockResolvedValue(mockCopy('c1', { institutionCode: INST }));
    vi.mocked(libraryRepository.countLoansByCopyId).mockResolvedValue(0);
    vi.mocked(libraryRepository.deleteCopy).mockResolvedValue({} as any);

    await expect(svc.deleteCopy(INST, 'c1')).resolves.toBeDefined();
  });
});
