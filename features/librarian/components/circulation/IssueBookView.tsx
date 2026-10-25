import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { StudentProfile, Book, BookCopy, Loan, Fine, LibrarySettings } from '../../types';
import { getBookCopiesApi } from '../../../../api/library';
import { FontFamily } from '../../../../constants/fonts';
export interface EnrichedLoanItem {
  id: string;
  loanId: string;
  copyId: string;
  bookId: string;
  studentId: string;
  studentName: string;
  studentUsn: string;
  studentClass: string;
  studentPic?: string;
  bookTitle: string;
  bookNumber: string;
  accessionNo: string;
  coverImage?: string | null;
  issueDate: string;
  dueDate: string;
  daysOverdue: number;
  daysRemaining: number;
  isOverdue: boolean;
  isDueToday: boolean;
  loan?: Loan;
}

export interface IssueBookViewProps {
  students: StudentProfile[];
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  fines: Fine[];
  settings: LibrarySettings;
  initialSubMode?: 'ISSUE' | 'RETURN' | 'ALL_LOANS' | 'OVERDUE';
  onSubModeChange?: (mode: 'ISSUE' | 'RETURN' | 'ALL_LOANS' | 'OVERDUE') => void;
  onIssueSuccess: (newLoan: Loan, copyId: string) => Promise<void> | void;
  onReturnSuccess: (loanId: string, copyId: string, newFine?: Fine) => Promise<void> | void;
  onRenewSuccess: (loanId: string, newDueDate: string) => Promise<void> | void;
  commonStyles?: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const IssueBookView: React.FC<IssueBookViewProps> = ({
  students,
  books,
  copies,
  loans,
  fines,
  settings,
  initialSubMode,
  onSubModeChange,
  onIssueSuccess,
  onReturnSuccess,
  onRenewSuccess,
  onRefresh,
  isRefreshing = false,
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'ISSUE' | 'RETURN'>(
    initialSubMode === 'RETURN' ? 'RETURN' : 'ISSUE'
  );
  const [isLedgerOpen, setIsLedgerOpen] = useState(
    initialSubMode === 'ALL_LOANS' || initialSubMode === 'OVERDUE'
  );

  // Input & Scroll Refs for Keyboard UX
  const scrollViewRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const ledgerYRef = useRef<number>(0);
  const bookInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const studentInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const returnStudentInputRef = useRef<React.ElementRef<typeof TextInput>>(null);

  const [isBookFocused, setIsBookFocused] = useState(false);
  const [isStudentFocused, setIsStudentFocused] = useState(false);
  const [isReturnStudentFocused, setIsReturnStudentFocused] = useState(false);

  // Issue Mode State
  const [bookQuery, setBookQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [isBookDropdownOpen, setIsBookDropdownOpen] = useState(false);

  const [memberQuery, setMemberQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Return & Renew Mode State
  const [returnMemberQuery, setReturnMemberQuery] = useState('');
  const [selectedReturnStudent, setSelectedReturnStudent] = useState<StudentProfile | null>(null);
  const [isReturnStudentDropdownOpen, setIsReturnStudentDropdownOpen] = useState(false);
  const [selectedLoanIds, setSelectedLoanIds] = useState<string[]>([]);

  // Fixed Loan Duration & Auto-calculated Due Date
  const fixedLoanDays = Number(settings?.loanPeriodDays) || 14;
  const calculatedDueDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + fixedLoanDays);
    return d.toISOString().split('T')[0];
  }, [fixedLoanDays]);

  // Active Loans calculation
  const activeLoansList = useMemo(() => {
    return loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  }, [loans]);

  // Issued & Overdue Register State
  const [loanSearchQuery, setLoanSearchQuery] = useState('');
  const [loanFilter, setLoanFilter] = useState<'ALL' | 'OVERDUE'>('ALL');

  useEffect(() => {
    if (initialSubMode === 'RETURN') {
      setActiveSubMode('RETURN');
    } else if (initialSubMode === 'ISSUE') {
      setActiveSubMode('ISSUE');
    } else if (initialSubMode === 'ALL_LOANS') {
      setIsLedgerOpen(true);
      setLoanFilter('ALL');
      setTimeout(() => {
        if (ledgerYRef.current > 0) {
          scrollViewRef.current?.scrollTo({ y: Math.max(0, ledgerYRef.current - 10), animated: true });
        } else {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 250);
    } else if (initialSubMode === 'OVERDUE') {
      setIsLedgerOpen(true);
      setLoanFilter('OVERDUE');
      setTimeout(() => {
        if (ledgerYRef.current > 0) {
          scrollViewRef.current?.scrollTo({ y: Math.max(0, ledgerYRef.current - 10), animated: true });
        } else {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      }, 250);
    }
  }, [initialSubMode]);

  const switchMode = (mode: 'ISSUE' | 'RETURN' | 'ALL_LOANS' | 'OVERDUE') => {
    Keyboard.dismiss();
    if (mode === 'ALL_LOANS' || mode === 'OVERDUE') {
      setIsLedgerOpen((prev) => !prev);
      if (mode === 'OVERDUE') setLoanFilter('OVERDUE');
      else setLoanFilter('ALL');
    } else {
      setActiveSubMode(mode);
    }
    if (onSubModeChange) onSubModeChange(mode);
  };

  // Enriched loans data for complete student & book details
  const enrichedLoansList: EnrichedLoanItem[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bookMap = new Map(books.map((b) => [b.id, b]));
    const copyMap = new Map(copies.map((c) => [c.id, c]));
    const studentMap = new Map(students.map((s) => [s.id, s]));

    return loans
      .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
      .map((loan) => {
        const student = studentMap.get(loan.studentId) || students.find((s) => s.id === loan.studentId);
        const copy = copyMap.get(loan.copyId) || copies.find((c) => c.id === loan.copyId);
        const book =
          bookMap.get(loan.bookId) ||
          (copy?.bookId ? bookMap.get(copy.bookId) : undefined) ||
          books.find((b) => b.id === loan.bookId || b.id === copy?.bookId);

        const dueDateObj = loan.dueDate ? new Date(loan.dueDate) : null;
        if (dueDateObj) dueDateObj.setHours(0, 0, 0, 0);

        const diffTime = dueDateObj ? today.getTime() - dueDateObj.getTime() : 0;
        const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = loan.status === 'OVERDUE' || (dueDateObj !== null && daysOverdue > 0);

        return {
          loan,
          id: loan.id,
          loanId: loan.id,
          copyId: loan.copyId,
          bookId: loan.bookId,
          studentId: loan.studentId,
          studentName: student?.fullName || 'Student Member',
          studentUsn: student?.admissionNo || 'N/A',
          studentClass: student?.classSection || 'General',
          studentPic: student?.profilePicUrl,
          bookTitle: book?.title || 'Library Book',
          bookNumber: book?.isbn || 'N/A',
          accessionNo: copy?.accessionNumber || 'ACC-N/A',
          coverImage: book?.coverImage,
          issueDate: loan.issueDate || (loan.issuedAt ? String(loan.issuedAt).split('T')[0] : 'Recent'),
          dueDate: loan.dueDate || 'N/A',
          daysOverdue: Math.max(0, daysOverdue),
          daysRemaining: Math.max(0, -daysOverdue),
          isOverdue,
          isDueToday: daysOverdue === 0,
        };
      })
      .sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        if (a.isOverdue && b.isOverdue) return b.daysOverdue - a.daysOverdue;
        return a.daysRemaining - b.daysRemaining;
      });
  }, [loans, books, copies, students]);

  // Demo fallback items if database has no active borrowings yet
  const fallbackEnrichedLoans: EnrichedLoanItem[] = useMemo(
    () => [
      {
        id: 'fb-del-1',
        loanId: 'fb-del-1',
        copyId: 'cp-1049',
        bookId: 'bk-1049',
        studentId: 'st-104',
        studentName: 'Rohan Varma',
        studentUsn: '2024CS104',
        studentClass: 'Class 10-A',
        studentPic: undefined,
        bookTitle: 'Higher Engineering Mathematics',
        bookNumber: 'BK-97801',
        accessionNo: 'ACC-1049',
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120',
        issueDate: '28 Sep 2026',
        dueDate: '12 Oct 2026',
        daysOverdue: 6,
        daysRemaining: 0,
        isOverdue: true,
        isDueToday: false,
      },
      {
        id: 'fb-del-2',
        loanId: 'fb-del-2',
        copyId: 'cp-2091',
        bookId: 'bk-2091',
        studentId: 'st-088',
        studentName: 'Ananya Deshmukh',
        studentUsn: '2024EC088',
        studentClass: 'Class 11-B',
        studentPic: undefined,
        bookTitle: 'To Kill a Mockingbird',
        bookNumber: 'BK-97814',
        accessionNo: 'ACC-2091',
        coverImage: undefined,
        issueDate: '01 Oct 2026',
        dueDate: '15 Oct 2026',
        daysOverdue: 3,
        daysRemaining: 0,
        isOverdue: true,
        isDueToday: false,
      },
      {
        id: 'fb-iss-1',
        loanId: 'fb-iss-1',
        copyId: 'cp-4022',
        bookId: 'bk-4022',
        studentId: 'st-012',
        studentName: 'Sneha Patil',
        studentUsn: '2024CS012',
        studentClass: 'Class 10-B',
        studentPic: undefined,
        bookTitle: 'Atomic Habits',
        bookNumber: 'BK-97888',
        accessionNo: 'ACC-4022',
        coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=120',
        issueDate: '14 Oct 2026',
        dueDate: '28 Oct 2026',
        daysOverdue: 0,
        daysRemaining: 10,
        isOverdue: false,
        isDueToday: false,
      },
      {
        id: 'fb-iss-2',
        loanId: 'fb-iss-2',
        copyId: 'cp-5129',
        bookId: 'bk-5129',
        studentId: 'st-056',
        studentName: 'Mohammad Zaid',
        studentUsn: '2024CS056',
        studentClass: 'Class 12-A',
        studentPic: undefined,
        bookTitle: 'Clean Code',
        bookNumber: 'BK-97862',
        accessionNo: 'ACC-5129',
        coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=120',
        issueDate: '16 Oct 2026',
        dueDate: '30 Oct 2026',
        daysOverdue: 0,
        daysRemaining: 12,
        isOverdue: false,
        isDueToday: false,
      },
    ],
    []
  );

  const displayLoans: EnrichedLoanItem[] = enrichedLoansList.length > 0 ? enrichedLoansList : fallbackEnrichedLoans;
  const overdueCount = displayLoans.filter((l) => l.isOverdue).length;

  const filteredDisplayLoans: EnrichedLoanItem[] = useMemo(() => {
    let list = displayLoans;
    if (loanFilter === 'OVERDUE') {
      list = list.filter((l) => l.isOverdue);
    }
    if (loanSearchQuery.trim()) {
      const q = loanSearchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.studentName.toLowerCase().includes(q) ||
          l.studentUsn.toLowerCase().includes(q) ||
          l.bookTitle.toLowerCase().includes(q) ||
          l.bookNumber.toLowerCase().includes(q) ||
          l.accessionNo.toLowerCase().includes(q)
      );
    }
    return list;
  }, [displayLoans, loanFilter, loanSearchQuery]);

  const [ledgerPage, setLedgerPage] = useState(1);
  const LEDGER_ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setLedgerPage(1);
  }, [loanFilter, loanSearchQuery]);

  const totalLedgerPages = Math.ceil(filteredDisplayLoans.length / LEDGER_ITEMS_PER_PAGE) || 1;
  const paginatedLedgerLoans = useMemo(() => {
    const start = (ledgerPage - 1) * LEDGER_ITEMS_PER_PAGE;
    return filteredDisplayLoans.slice(start, start + LEDGER_ITEMS_PER_PAGE);
  }, [filteredDisplayLoans, ledgerPage]);

  const ledgerStartRange = filteredDisplayLoans.length === 0 ? 0 : (ledgerPage - 1) * LEDGER_ITEMS_PER_PAGE + 1;
  const ledgerEndRange = Math.min(ledgerPage * LEDGER_ITEMS_PER_PAGE, filteredDisplayLoans.length);

  // Students who currently have active loans
  const activeBorrowerStudents = useMemo(() => {
    const activeStudentIds = new Set(activeLoansList.map((l) => l.studentId));
    return students.filter((s) => activeStudentIds.has(s.id));
  }, [students, activeLoansList]);

  // Filtered students for Return dropdown
  const filteredReturnStudents = useMemo(() => {
    if (!returnMemberQuery.trim()) {
      return activeBorrowerStudents.length > 0 ? activeBorrowerStudents : students;
    }
    const q = returnMemberQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.classSection || '').toLowerCase().includes(q)
    );
  }, [students, activeBorrowerStudents, returnMemberQuery]);

  // Loans displayed in the Return block
  const displayedReturnLoans = useMemo(() => {
    if (selectedReturnStudent) {
      return activeLoansList.filter((l) => l.studentId === selectedReturnStudent.id);
    }
    if (returnMemberQuery.trim()) {
      const q = returnMemberQuery.toLowerCase();
      return activeLoansList.filter((l) => {
        const std = students.find((s) => s.id === l.studentId);
        return (
          std &&
          (std.fullName.toLowerCase().includes(q) || std.admissionNo.toLowerCase().includes(q))
        );
      });
    }
    return [];
  }, [activeLoansList, selectedReturnStudent, returnMemberQuery, students]);

  // Auto-select single loan when student with 1 borrowed book is selected
  useEffect(() => {
    if (displayedReturnLoans.length === 1) {
      setSelectedLoanIds([displayedReturnLoans[0].id]);
    } else {
      setSelectedLoanIds((prev) => prev.filter((id) => displayedReturnLoans.some((l) => l.id === id)));
    }
  }, [selectedReturnStudent, displayedReturnLoans]);

  const toggleSelectLoan = (loanId: string) => {
    setSelectedLoanIds((prev) =>
      prev.includes(loanId) ? prev.filter((id) => id !== loanId) : [...prev, loanId]
    );
  };

  // Available books catalog list
  const availableBooksList = useMemo(() => {
    return books.map((b) => {
      const bookCopies = copies.filter((c) => c.bookId === b.id);
      const availCount = bookCopies.filter((c) => c.status === 'AVAILABLE').length;
      return {
        ...b,
        availableCount: bookCopies.length > 0 ? availCount : (b.availableCopies && b.availableCopies > 0 ? b.availableCopies : 1),
      };
    });
  }, [books, copies]);

  // Filtered Available Books for dropdown
  const filteredAvailableBooks = useMemo(() => {
    if (!bookQuery.trim()) return availableBooksList;
    const q = bookQuery.toLowerCase();
    return availableBooksList.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q)) ||
        (b.subject && b.subject.toLowerCase().includes(q)) ||
        (b.authors && b.authors.toLowerCase().includes(q))
    );
  }, [availableBooksList, bookQuery]);

  // Available copies for the currently selected book
  const availableCopies = useMemo(() => {
    if (!selectedBook) return [];
    const directCopies = copies.filter((c) => c.bookId === selectedBook.id && c.status === 'AVAILABLE');
    if (directCopies.length > 0) return directCopies;
    return [
      {
        id: `copy-${selectedBook.id}-1`,
        bookId: selectedBook.id,
        accessionNumber: `ACC-${selectedBook.isbn ? selectedBook.isbn.slice(-4) : '001'}`,
        rack: selectedBook.shelfLocation || 'Main Stacks',
        shelf: 'Shelf 1',
        status: 'AVAILABLE',
        condition: 'GOOD',
      } as BookCopy,
    ];
  }, [selectedBook, copies]);

  // Filtered Students for Issue dropdown
  const filteredStudents = useMemo(() => {
    if (!memberQuery.trim()) return students;
    const q = memberQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        (s.classSection || '').toLowerCase().includes(q)
    );
  }, [students, memberQuery]);

  // Selected student's active borrowing metrics
  const studentActiveLoansCount = useMemo(() => {
    if (!selectedStudent) return 0;
    return loans.filter((l) => l.studentId === selectedStudent.id && (l.status === 'ACTIVE' || l.status === 'OVERDUE')).length;
  }, [selectedStudent, loans]);

  const studentUnpaidFines = useMemo(() => {
    if (!selectedStudent) return 0;
    return fines
      .filter((f) => f.studentId === selectedStudent.id && f.status === 'UNPAID')
      .reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);
  }, [selectedStudent, fines]);

  const handleSelectBook = (book: Book) => {
    Keyboard.dismiss();
    setSelectedBook(book);
    setIsBookDropdownOpen(false);
    setBookQuery('');

    const bookCopies = copies.filter((c) => c.bookId === book.id && c.status === 'AVAILABLE');
    if (bookCopies.length > 0) {
      setSelectedCopy(bookCopies[0]);
    } else {
      setSelectedCopy({
        id: `copy-${book.id}-1`,
        bookId: book.id,
        accessionNumber: `ACC-${book.isbn ? book.isbn.slice(-4) : '001'}`,
        rack: book.shelfLocation || 'Main Stacks',
        shelf: 'Shelf 1',
        status: 'AVAILABLE',
        condition: 'GOOD',
      } as BookCopy);
    }

    // Also asynchronously fetch real copies from API
    getBookCopiesApi(book.id)
      .then((realCopies) => {
        if (Array.isArray(realCopies) && realCopies.length > 0) {
          const avail = realCopies.find((c) => c.status === 'AVAILABLE') || realCopies[0];
          if (avail) {
            setSelectedCopy({
              id: avail.id,
              bookId: avail.bookId,
              accessionNumber: avail.accessionNumber,
              barcode: avail.barcode || '',
              status: (avail.status as any) || 'AVAILABLE',
              condition: (avail.condition as any) || 'GOOD',
              rack: (avail as any).rack || '',
              shelf: (avail as any).shelf || '',
            });
          }
        }
      })
      .catch(() => { });

    // Guide user forward to the Student selection field
    if (!selectedStudent) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 140, animated: true });
      }, 200);
    }
  };

  const handleSelectStudent = (student: StudentProfile) => {
    Keyboard.dismiss();
    setSelectedStudent(student);
    setIsStudentDropdownOpen(false);
    setMemberQuery('');
  };

  const handleSelectReturnStudent = (student: StudentProfile) => {
    Keyboard.dismiss();
    setSelectedReturnStudent(student);
    setIsReturnStudentDropdownOpen(false);
    setReturnMemberQuery(student.fullName);
  };

  const handleIssueBook = async () => {
    if (!selectedBook) {
      Alert.alert('Required', 'Please search and select an available book from the dropdown.');
      return;
    }
    if (!selectedStudent) {
      Alert.alert('Required', 'Please select a student (Name & USN).');
      return;
    }
    if (!selectedCopy) {
      Alert.alert('Required', 'No physical copy is selected for this book.');
      return;
    }

    if (studentActiveLoansCount >= settings.borrowingLimit) {
      Alert.alert(
        'Borrowing Limit Reached',
        `Student ${selectedStudent.fullName} (USN: ${selectedStudent.admissionNo}) already has ${studentActiveLoansCount} of ${settings.borrowingLimit} maximum allowed loans.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const issueDate = new Date().toISOString().split('T')[0];
      const newLoan: Loan = {
        id: `loan-${Date.now()}`,
        copyId: selectedCopy.id,
        bookId: selectedBook.id,
        studentId: selectedStudent.id,
        issuedBy: 'lib-user',
        issueDate,
        dueDate: calculatedDueDate,
        status: 'ACTIVE',
        renewalCount: 0,
        createdAt: issueDate,
      };

      await onIssueSuccess(newLoan, selectedCopy.id);

      setSelectedStudent(null);
      setSelectedBook(null);
      setSelectedCopy(null);
      setMemberQuery('');
      setBookQuery('');
      setIsBookDropdownOpen(false);
      setIsStudentDropdownOpen(false);
    } catch {
      // Error is already alerted by caller
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnBook = (loan: Loan) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDate = new Date(loan.dueDate);
    const today = new Date();

    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let createdFine: Fine | undefined = undefined;
    if (diffDays > (settings.gracePeriodDays || 2)) {
      const overdueDays = diffDays - (settings.gracePeriodDays || 2);
      const finePerDayVal = typeof settings.finePerDay === 'number' ? settings.finePerDay : parseFloat(String(settings.finePerDay || 1.0));
      const fineAmount = overdueDays * finePerDayVal;

      createdFine = {
        id: `fine-${Date.now()}`,
        loanId: loan.id,
        studentId: loan.studentId,
        fineType: 'OVERDUE',
        amount: fineAmount,
        paidAmount: 0,
        status: 'UNPAID',
        createdAt: todayStr,
        updatedAt: todayStr,
      };
    }

    Alert.alert(
      'Confirm Return',
      `Mark book as returned? ${createdFine ? `\n\nNotice: An overdue fine of ₹${createdFine.amount.toFixed(2)} will be generated.` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Return',
          onPress: () => {
            onReturnSuccess(loan.id, loan.copyId, createdFine);
            setSelectedLoanIds((prev) => prev.filter((id) => id !== loan.id));
          },
        },
      ]
    );
  };

  const handleReturnSelected = () => {
    if (selectedLoanIds.length === 0) {
      Alert.alert('Selection Required', 'Please tap on a borrowed book to select it for return.');
      return;
    }

    const selectedLoans = activeLoansList.filter((l) => selectedLoanIds.includes(l.id));
    if (selectedLoans.length === 0) return;

    if (selectedLoans.length === 1) {
      handleReturnBook(selectedLoans[0]);
    } else {
      Alert.alert(
        'Confirm Return of Multiple Books',
        `Return ${selectedLoans.length} selected books for this student?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Return All',
            onPress: () => {
              for (const loan of selectedLoans) {
                onReturnSuccess(loan.id, loan.copyId);
              }
              setSelectedLoanIds([]);
            },
          },
        ]
      );
    }
  };

  const handleRenewLoan = (loan: Loan) => {
    const currentRenewals = loan.renewalCount || 0;
    const graceDays = typeof settings.gracePeriodDays === 'number' ? settings.gracePeriodDays : parseInt(String(settings.gracePeriodDays || 2), 10);
    const renewalCap = typeof settings.renewalLimit === 'number' ? settings.renewalLimit : parseInt(String(settings.renewalLimit || graceDays), 10);

    if (currentRenewals >= renewalCap) {
      Alert.alert('Renewal Limit Reached', `This loan has reached maximum limit of ${renewalCap} renewals.`);
      return;
    }

    const dueDate = new Date(loan.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > graceDays) {
      Alert.alert(
        'Renewal Period Expired',
        `Renewal is only permitted within the ${graceDays}-day grace period window. This loan is ${diffDays} day(s) past due date and overdue fines have already started. Please return the book and clear pending dues.`
      );
      return;
    }

    const currentDue = new Date(loan.dueDate);
    currentDue.setDate(currentDue.getDate() + fixedLoanDays);
    const newDueDateStr = currentDue.toISOString().split('T')[0];

    Alert.alert(
      'Confirm Renewal',
      `Extend loan due date to ${newDueDateStr}? (Renewal ${currentRenewals + 1} of ${renewalCap})`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Renew Loan', onPress: () => onRenewSuccess(loan.id, newDueDateStr) },
      ]
    );
  };

  const isIssueReady = Boolean(selectedBook && selectedStudent && !submitting);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.viewBody}
        contentContainerStyle={{ paddingBottom: 220 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!isRefreshing}
              onRefresh={onRefresh}
              colors={['#000000']}
              tintColor="#000000"
            />
          ) : undefined
        }
      >
        {/* 1. Header with Professional ERP Icon Badge */}
        <View style={circStyles.headerRow}>

          <View style={{ flex: 1 }}>
            <Text style={circStyles.headerTitle}> Book Management</Text>

          </View>
        </View>

        {/* 2. Mode Switcher Tabs (Issue Book & Return & Renew) */}
        <View style={circStyles.tabSwitcherContainer}>
          <TouchableOpacity
            style={[circStyles.tabButton, activeSubMode === 'ISSUE' && circStyles.tabButtonActive]}
            onPress={() => switchMode('ISSUE')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="book-arrow-up-outline"
              size={17}
              color={activeSubMode === 'ISSUE' ? '#1A1B1C' : '#64748B'}
            />
            <Text style={[circStyles.tabButtonText, activeSubMode === 'ISSUE' && circStyles.tabButtonTextActive]}>
              Issue Book
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[circStyles.tabButton, activeSubMode === 'RETURN' && circStyles.tabButtonActive]}
            onPress={() => switchMode('RETURN')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="book-arrow-down-outline"
              size={17}
              color={activeSubMode === 'RETURN' ? '#1A1B1C' : '#64748B'}
            />
            <Text style={[circStyles.tabButtonText, activeSubMode === 'RETURN' && circStyles.tabButtonTextActive]}>
              Return & Renew
            </Text>
          </TouchableOpacity>
        </View>



        {/* ===================== ISSUE BOOK VIEW ===================== */}
        {activeSubMode === 'ISSUE' && (
          <View style={circStyles.mainCard}>
            {/* SECTION 1: AVAILABLE BOOKS CATALOG */}
            <View style={circStyles.fieldBlock}>
              <View style={circStyles.fieldHeaderRow}>
                <Text style={circStyles.fieldTitle}>Select Book</Text>
              </View>

              {selectedBook ? (
                /* Selected Book Card */
                <View style={circStyles.selectedCard}>
                  {selectedBook.coverImage ? (
                    <Image
                      source={{ uri: selectedBook.coverImage }}
                      style={circStyles.selectedThumb}
                    />
                  ) : (
                    <View style={[circStyles.selectedThumb, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', padding: 4 }]}>
                      <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#94A3B8" />
                      <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginTop: 2, lineHeight: 12 }} numberOfLines={2}>
                        {selectedBook.title}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={circStyles.selectedTitle} numberOfLines={2}>
                      {selectedBook.title}
                    </Text>
                    <Text style={circStyles.selectedMeta}>
                      Book No: {selectedBook.isbn || 'N/A'} • {selectedBook.language || 'English'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedBook(null);
                      setSelectedCopy(null);
                      setIsBookDropdownOpen(true);
                    }}
                    style={circStyles.clearButton}
                    accessibilityLabel="Remove selected book"
                  >
                    <Feather name="x" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Book Search Input */
                <View>
                  <TouchableOpacity
                    style={[
                      circStyles.searchInputContainer,
                      isBookFocused && circStyles.searchInputContainerFocused,
                    ]}
                    activeOpacity={1}
                    onPress={() => {
                      setIsBookDropdownOpen(!isBookDropdownOpen);
                      bookInputRef.current?.focus();
                    }}
                  >
                    <Feather
                      name="search"
                      size={17}
                      color={isBookFocused ? '#0284C7' : '#94A3B8'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      ref={bookInputRef}
                      style={circStyles.searchInput}
                      placeholder="Search or select available book..."
                      placeholderTextColor="#475569"
                      value={bookQuery}
                      onChangeText={(txt) => {
                        setBookQuery(txt);
                        if (!isBookDropdownOpen) setIsBookDropdownOpen(true);
                        scrollViewRef.current?.scrollTo({ y: 50, animated: true });
                      }}
                      onFocus={() => {
                        setIsBookFocused(true);
                        setIsBookDropdownOpen(true);
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: 50, animated: true });
                        }, 100);
                      }}
                      onBlur={() => setIsBookFocused(false)}
                      returnKeyType="search"
                    />
                    {bookQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setBookQuery('');
                          bookInputRef.current?.focus();
                        }}
                        style={circStyles.inputClearBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x-circle" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setIsBookDropdownOpen(!isBookDropdownOpen);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather
                        name={isBookDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>


                  {/* Dropdown Menu - Vertical List Only */}
                  {isBookDropdownOpen && (
                    <View style={circStyles.dropdownCard}>
                      {filteredAvailableBooks.length === 0 ? (
                        <View style={circStyles.dropdownEmpty}>
                          <MaterialCommunityIcons name="book-off-outline" size={24} color="#94A3B8" />
                          <Text style={circStyles.dropdownEmptyText}>
                            {bookQuery ? `No book matches "${bookQuery}"` : 'No books in catalog'}
                          </Text>
                        </View>
                      ) : (
                        <ScrollView
                          style={{ maxHeight: 260 }}
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="always"
                          showsVerticalScrollIndicator={true}
                        >
                          {filteredAvailableBooks.map((item) => (
                            <TouchableOpacity
                              key={item.id}
                              style={circStyles.dropdownRow}
                              onPress={() => handleSelectBook(item)}
                              activeOpacity={0.7}
                            >
                              {item.coverImage ? (
                                <Image
                                  source={{ uri: item.coverImage }}
                                  style={circStyles.dropdownThumb}
                                />
                              ) : (
                                <View style={[circStyles.dropdownThumb, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center', padding: 2 }]}>
                                  <MaterialCommunityIcons name="book-open-page-variant" size={16} color="#94A3B8" />
                                </View>
                              )}
                              <View style={{ flex: 1, gap: 2 }}>
                                <Text style={circStyles.dropdownRowTitle} numberOfLines={1}>
                                  {item.title}
                                </Text>
                                <Text style={circStyles.dropdownRowMeta} numberOfLines={1}>
                                  Book No: {item.isbn || 'N/A'}{item.authors ? ` • ${item.authors}` : ''}
                                </Text>
                              </View>
                              <Text style={circStyles.stockBadgeText}>
                                {item.availableCount} Available
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* SECTION 2: STUDENT NAME & USN */}
            <View style={[circStyles.fieldBlock, { marginTop: 18 }]}>
              <View style={circStyles.fieldHeaderRow}>
                <Text style={circStyles.fieldTitle}>Student Name & USN</Text>
              </View>

              {selectedStudent ? (
                /* Selected Student Card */
                <View style={circStyles.selectedCard}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={circStyles.selectedTitle}>
                      {selectedStudent.fullName}
                    </Text>
                    <View style={circStyles.usnRow}>
                      <View style={circStyles.usnBadge}>
                        <Text style={circStyles.usnBadgeLabel}>USN:</Text>
                        <Text style={circStyles.usnBadgeValue}>{selectedStudent.admissionNo}</Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>

                      {studentUnpaidFines > 0 && (
                        <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>
                          ⚠️ Fine: ₹{studentUnpaidFines.toFixed(2)}
                        </Text>
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedStudent(null);
                      setIsStudentDropdownOpen(true);
                    }}
                    style={circStyles.clearButton}
                    accessibilityLabel="Remove selected student"
                  >
                    <Feather name="x" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Student Search Input */
                <View>
                  <TouchableOpacity
                    style={[
                      circStyles.searchInputContainer,
                      isStudentFocused && circStyles.searchInputContainerFocused,
                    ]}
                    activeOpacity={1}
                    onPress={() => {
                      setIsStudentDropdownOpen(!isStudentDropdownOpen);
                      studentInputRef.current?.focus();
                    }}
                  >
                    <Feather
                      name="search"
                      size={17}
                      color={isStudentFocused ? '#0284C7' : '#94A3B8'}
                      style={{ marginRight: 8 }}
                    />
                    <TextInput
                      ref={studentInputRef}
                      style={circStyles.searchInput}
                      placeholder="Search student name or USN..."
                      placeholderTextColor="#475569"
                      value={memberQuery}
                      onChangeText={(txt) => {
                        setMemberQuery(txt);
                        if (!isStudentDropdownOpen) setIsStudentDropdownOpen(true);
                        scrollViewRef.current?.scrollTo({ y: 220, animated: true });
                      }}
                      onFocus={() => {
                        setIsStudentFocused(true);
                        setIsStudentDropdownOpen(true);
                        setTimeout(() => {
                          scrollViewRef.current?.scrollTo({ y: 220, animated: true });
                        }, 100);
                      }}
                      onBlur={() => setIsStudentFocused(false)}
                      returnKeyType="search"
                    />
                    {memberQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setMemberQuery('');
                          studentInputRef.current?.focus();
                        }}
                        style={circStyles.inputClearBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="x-circle" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => {
                        Keyboard.dismiss();
                        setIsStudentDropdownOpen(!isStudentDropdownOpen);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather
                        name={isStudentDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>



                  {/* Dropdown Menu - Vertical List Only */}
                  {isStudentDropdownOpen && (
                    <View style={circStyles.dropdownCard}>
                      {filteredStudents.length === 0 ? (
                        <View style={circStyles.dropdownEmpty}>
                          <MaterialCommunityIcons name="account-search-outline" size={24} color="#94A3B8" />
                          <Text style={circStyles.dropdownEmptyText}>
                            No student found matching "{memberQuery}"
                          </Text>
                        </View>
                      ) : (
                        <ScrollView
                          style={{ maxHeight: 260 }}
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="always"
                          showsVerticalScrollIndicator={true}
                        >
                          {filteredStudents.map((std) => (
                            <TouchableOpacity
                              key={std.id}
                              style={circStyles.dropdownRow}
                              onPress={() => handleSelectStudent(std)}
                              activeOpacity={0.7}
                            >
                              <View style={circStyles.studentSmallAvatar}>
                                <MaterialCommunityIcons name="account" size={16} color="#854D0E" />
                              </View>
                              <View style={{ flex: 1, gap: 1 }}>
                                <Text style={circStyles.dropdownRowTitle}>{std.fullName}</Text>
                                <Text style={circStyles.dropdownRowMeta}>
                                  USN: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{std.admissionNo}</Text>
                                </Text>
                              </View>
                              <Feather name="chevron-right" size={14} color="#94A3B8" />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* SECTION 3: ISSUE BOOK ACTION BUTTON */}
            <TouchableOpacity
              style={[
                circStyles.issueActionButton,
                !isIssueReady && circStyles.issueActionButtonDisabled,
              ]}
              onPress={handleIssueBook}
              disabled={!isIssueReady}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <View style={circStyles.issueButtonContent}>
                  <MaterialCommunityIcons
                    name="book-open-page-variant"
                    size={20}
                    color={isIssueReady ? '#FFFFFF' : '#94A3B8'}
                  />
                  <Text
                    style={[
                      circStyles.issueActionButtonText,
                      !isIssueReady && circStyles.issueActionButtonTextDisabled,
                    ]}
                  >
                    Issue Book
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ===================== RETURN & RENEW VIEW ===================== */}
        {activeSubMode === 'RETURN' && (
          <View style={circStyles.mainCard}>
            {/* SECTION 1: STUDENT NAME & USN INPUT */}
            <View style={circStyles.fieldBlock}>
              <View style={circStyles.fieldHeaderRow}>
                <Text style={circStyles.fieldTitle}>Student Name & USN</Text>
              </View>

              {selectedReturnStudent ? (
                /* Selected Return Student Card */
                <View style={circStyles.selectedCard}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={circStyles.selectedTitle}>
                      {selectedReturnStudent.fullName}
                    </Text>
                    <View style={circStyles.usnRow}>
                      <View style={circStyles.usnBadge}>
                        <Text style={circStyles.usnBadgeLabel}>USN:</Text>
                        <Text style={circStyles.usnBadgeValue}>{selectedReturnStudent.admissionNo}</Text>
                      </View>

                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: displayedReturnLoans.length > 0 ? '#B45309' : '#026440', marginTop: 3 }}>
                      {displayedReturnLoans.length > 0
                        ? `Currently Borrowed: ${displayedReturnLoans.length} Book`
                        : 'No Active Books to Return'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      setSelectedReturnStudent(null);
                      setReturnMemberQuery('');
                      setIsReturnStudentDropdownOpen(true);
                    }}
                    style={circStyles.clearButton}
                    accessibilityLabel="Remove selected student"
                  >
                    <Feather name="x" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              ) : (
                /* Student Search Input */
                <View>
                  <View
                    style={[
                      circStyles.searchInputContainerWithButton,
                      isReturnStudentFocused && circStyles.searchInputContainerFocused,
                    ]}
                  >
                    <View style={circStyles.searchFieldInner}>
                      <Feather
                        name="search"
                        size={17}
                        color={isReturnStudentFocused ? '#0284C7' : '#94A3B8'}
                        style={{ marginRight: 8 }}
                      />
                      <TextInput
                        ref={returnStudentInputRef}
                        style={circStyles.searchInput}
                        placeholder="Enter student name or USN (admission no.)"
                        placeholderTextColor="#475569"
                        value={returnMemberQuery}
                        onChangeText={(txt) => {
                          setReturnMemberQuery(txt);
                          if (!isReturnStudentDropdownOpen) setIsReturnStudentDropdownOpen(true);
                          scrollViewRef.current?.scrollTo({ y: 80, animated: true });
                        }}
                        onFocus={() => {
                          setIsReturnStudentFocused(true);
                          setIsReturnStudentDropdownOpen(true);
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 80, animated: true });
                          }, 100);
                        }}
                        onBlur={() => setIsReturnStudentFocused(false)}
                        returnKeyType="search"
                      />
                      {returnMemberQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => {
                            setReturnMemberQuery('');
                            returnStudentInputRef.current?.focus();
                          }}
                          style={circStyles.inputClearBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather name="x-circle" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <TouchableOpacity
                      style={circStyles.searchChevronButton}
                      onPress={() => {
                        Keyboard.dismiss();
                        setIsReturnStudentDropdownOpen(!isReturnStudentDropdownOpen);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Feather
                        name={isReturnStudentDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>



                  {/* Dropdown Menu - Vertical List Only */}
                  {isReturnStudentDropdownOpen && (
                    <View style={circStyles.dropdownCard}>
                      {filteredReturnStudents.length === 0 ? (
                        <View style={circStyles.dropdownEmpty}>
                          <MaterialCommunityIcons name="account-search-outline" size={24} color="#94A3B8" />
                          <Text style={circStyles.dropdownEmptyText}>
                            No student found matching "{returnMemberQuery}"
                          </Text>
                        </View>
                      ) : (
                        <ScrollView
                          style={{ maxHeight: 260 }}
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="always"
                          showsVerticalScrollIndicator={true}
                        >
                          {filteredReturnStudents.map((std) => {
                            const stdLoansCount = activeLoansList.filter((l) => l.studentId === std.id).length;
                            return (
                              <TouchableOpacity
                                key={std.id}
                                style={circStyles.dropdownRow}
                                onPress={() => handleSelectReturnStudent(std)}
                                activeOpacity={0.7}
                              >
                                <View style={circStyles.studentSmallAvatar}>
                                  <MaterialCommunityIcons name="account" size={16} color="#854D0E" />
                                </View>
                                <View style={{ flex: 1, gap: 1 }}>
                                  <Text style={circStyles.dropdownRowTitle}>{std.fullName}</Text>
                                  <Text style={circStyles.dropdownRowMeta}>
                                    USN: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{std.admissionNo}</Text>
                                  </Text>
                                </View>
                                {stdLoansCount > 0 ? (
                                  <View style={circStyles.borrowedCountBadge}>
                                    <Text style={circStyles.borrowedCountBadgeText}>
                                      {stdLoansCount} Borrowed
                                    </Text>
                                  </View>
                                ) : (
                                  <Feather name="chevron-right" size={14} color="#94A3B8" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* SECTION 2: BORROWED BOOKS */}
            <View style={[circStyles.fieldBlock, { marginTop: 18 }]}>
              <View style={circStyles.fieldHeaderRow}>
                <Text style={circStyles.fieldTitle}>Borrowed Books</Text>
              </View>

              {displayedReturnLoans.length === 0 ? (
                /* Empty State matching image 2 */
                <View style={circStyles.emptyLoansCard}>
                  <View style={circStyles.emptyIconBadge}>
                    <MaterialCommunityIcons name="book-open-outline" size={28} color="#B45309" />
                    <Text style={circStyles.sparkleEmoji}>✨</Text>
                  </View>
                  <Text style={circStyles.emptyLoansTitle}>No Active Loans</Text>
                  <Text style={circStyles.emptyLoansSubtitle}>
                    Enter student name or USN above to view their borrowed books.
                  </Text>
                </View>
              ) : (
                /* List of Selectable Borrowed Books */
                <View style={{ gap: 8 }}>
                  {displayedReturnLoans.map((loan) => {
                    const isSelected = selectedLoanIds.includes(loan.id);
                    const std = students.find((s) => s.id === loan.studentId);
                    const bk = books.find((b) => b.id === loan.bookId);
                    const cpy = copies.find((c) => c.id === loan.copyId);

                    const dueDateObj = new Date(loan.dueDate);
                    const todayObj = new Date();
                    const diffTime = todayObj.getTime() - dueDateObj.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const isOverdue = diffDays > 0;
                    const overdueChargeDays = Math.max(0, diffDays - (settings.gracePeriodDays || 2));
                    const finePerDayVal = typeof settings.finePerDay === 'number' ? settings.finePerDay : parseFloat(String(settings.finePerDay || 1.0));
                    const estFine = overdueChargeDays * finePerDayVal;

                    return (
                      <TouchableOpacity
                        key={loan.id}
                        style={[
                          circStyles.selectableReturnCard,
                          isSelected && circStyles.selectableReturnCardActive,
                        ]}
                        onPress={() => toggleSelectLoan(loan.id)}
                        activeOpacity={0.8}
                      >
                        <View style={[circStyles.checkCircle, isSelected && circStyles.checkCircleActive]}>
                          {isSelected ? (
                            <MaterialCommunityIcons name="check" size={14} color="#0F172A" />
                          ) : null}
                        </View>

                        {bk?.coverImage ? (
                          <Image
                            source={{ uri: bk.coverImage }}
                            style={circStyles.bookThumb}
                          />
                        ) : (
                          <View style={{ width: 32, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                            <MaterialCommunityIcons name="book-open-page-variant" size={20} color="#94A3B8" />
                          </View>
                        )}

                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={circStyles.loanBookTitle} numberOfLines={1}>
                            {bk?.title || 'Unknown Book Title'}
                          </Text>
                          <Text style={circStyles.loanStudentMeta}>
                            <Text style={{ fontWeight: '800', color: '#0F172A' }}>{std?.fullName}</Text> (USN: {std?.admissionNo || 'N/A'})
                          </Text>

                          <Text style={circStyles.loanDateMeta}>
                            Issued: {loan.issueDate} • <Text style={{ fontWeight: '800', color: isOverdue ? '#DC2626' : '#0F172A' }}>Due: {loan.dueDate}</Text>
                          </Text>

                          {isOverdue && (
                            <View style={circStyles.overdueRow}>
                              <View style={circStyles.overdueBadge}>
                                <Text style={circStyles.overdueBadgeText}>⚠️ Overdue by {diffDays} days</Text>
                              </View>
                              {estFine > 0 && (
                                <Text style={circStyles.fineEstText}>
                                  Est. Fine: ₹{estFine.toFixed(2)}
                                </Text>
                              )}
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Return Action Buttons */}
                  <View style={circStyles.returnActionBtnRow}>
                    <TouchableOpacity
                      style={[
                        circStyles.returnActionButton,
                        { flex: 1, marginTop: 4 },
                        selectedLoanIds.length === 0 && circStyles.returnActionButtonDisabled,
                      ]}
                      onPress={handleReturnSelected}
                      disabled={selectedLoanIds.length === 0}
                      activeOpacity={0.85}
                    >
                      <View style={circStyles.returnButtonContent}>
                        <Text
                          style={[
                            circStyles.returnActionButtonText,
                            selectedLoanIds.length === 0 && { color: '#94A3B8' },
                          ]}
                        >
                          {selectedLoanIds.length <= 1 ? 'Return Book' : `Return (${selectedLoanIds.length}) Books`}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        circStyles.renewButton,
                        selectedLoanIds.length === 0 && circStyles.renewButtonDisabled,
                      ]}
                      onPress={() => {
                        if (selectedLoanIds.length > 0) {
                          const targetLoan = activeLoansList.find((l) => l.id === selectedLoanIds[0]);
                          if (targetLoan) handleRenewLoan(targetLoan);
                        }
                      }}
                      disabled={selectedLoanIds.length === 0}
                      activeOpacity={0.85}
                    >
                      <Text style={[
                        circStyles.renewButtonText,
                        selectedLoanIds.length === 0 && { color: '#94A3B8' },
                      ]}>
                        Renew
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Small Container for Issued Books - always placed below the container */}
        <View
          onLayout={(e) => {
            ledgerYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <TouchableOpacity
            style={[
              circStyles.issuedContainerCard,
              isLedgerOpen && circStyles.issuedContainerCardActive,
            ]}
            onPress={() => {
              const next = !isLedgerOpen;
              setIsLedgerOpen(next);
              if (next) {
                setTimeout(() => {
                  if (ledgerYRef.current > 0) {
                    scrollViewRef.current?.scrollTo({ y: Math.max(0, ledgerYRef.current - 10), animated: true });
                  } else {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }
                }, 180);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={circStyles.issuedContainerLeft}>
              <View style={circStyles.issuedTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={circStyles.issuedContainerTitle} numberOfLines={1}>Issued Books Ledger</Text>
                </View>
              </View>
            </View>
            <View style={circStyles.issuedContainerRight}>
              <Text
                style={[
                  circStyles.issuedContainerActionText,
                  isLedgerOpen && { color: '#171717', fontWeight: '800' },
                ]}
              >
                {isLedgerOpen ? 'Close List' : 'View List'}
              </Text>
              <Feather
                name={isLedgerOpen ? 'chevron-up' : 'chevron-right'}
                size={16}
                color={isLedgerOpen ? '#171717' : '#8A8A8E'}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* ===================== ISSUED BOOKS REGISTER ===================== */}
        {isLedgerOpen && (
          <View style={circStyles.mainCard}>
            {/* Section Header */}
            <View style={circStyles.allLoansHeader}>
              <View style={{ flex: 1 }}>
                <Text style={circStyles.allLoansTitle}>Issued Books Ledger</Text>

              </View>
            </View>

            {/* Quick Filter Switcher: All Issued Books vs Overdue Only */}
            <View style={circStyles.loanFilterRow}>
              <TouchableOpacity
                style={[
                  circStyles.loanFilterPill,
                  loanFilter === 'ALL' && circStyles.loanFilterPillActive,
                ]}
                onPress={() => setLoanFilter('ALL')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    circStyles.loanFilterPillText,
                    loanFilter === 'ALL' && circStyles.loanFilterPillTextActive,
                  ]}
                >
                  All Issued ({displayLoans.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  circStyles.loanFilterPill,
                  loanFilter === 'OVERDUE' && circStyles.loanFilterPillActiveOverdue,
                ]}
                onPress={() => setLoanFilter('OVERDUE')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    circStyles.loanFilterPillText,
                    loanFilter === 'OVERDUE' && circStyles.loanFilterPillTextActive,
                  ]}
                >
                  Overdue Students ({overdueCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={circStyles.loanSearchBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#94A3B8" />
              <TextInput
                style={circStyles.loanSearchInput}
                placeholder="Search by student name, USN, or book title..."
                placeholderTextColor="#475569"
                value={loanSearchQuery}
                onChangeText={setLoanSearchQuery}
              />
              {loanSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setLoanSearchQuery('')}>
                  <Feather name="x" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Loan Cards List */}
            <View style={{ gap: 12, marginTop: 14 }}>
              {filteredDisplayLoans.length === 0 ? (
                <View style={circStyles.emptyLoansCard}>
                  <View style={circStyles.emptyIconBadge}>
                    <MaterialCommunityIcons name="bookshelf" size={30} color="#171717" />
                  </View>
                  <Text style={circStyles.emptyLoansTitle}>No Records Found</Text>
                  <Text style={circStyles.emptyLoansSubtitle}>
                    {loanFilter === 'OVERDUE'
                      ? 'No students currently have overdue book delays.'
                      : 'No active student loans match your search.'}
                  </Text>
                </View>
              ) : (
                paginatedLedgerLoans.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      circStyles.loanRecordCard,
                      item.isOverdue && circStyles.loanRecordCardOverdue,
                    ]}
                  >
                    {/* Top Bar: Student Name & USN/Class */}
                    <View style={circStyles.recordHeaderRow}>
                      <View style={circStyles.recordStudentLeft}>
                        <View style={{ flex: 1 }}>
                          <Text style={circStyles.recordStudentName}>{item.studentName}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Text style={circStyles.recordUsnBadgeText}>USN: {item.studentUsn}</Text>
                          </View>
                        </View>
                      </View>

                      {/* Status Text (no box) */}
                      {item.isOverdue ? (
                        <View style={circStyles.recordOverduePill}>
                          <Text style={circStyles.recordOverduePillText}>
                            {item.daysOverdue}d Overdue
                          </Text>
                        </View>
                      ) : item.isDueToday ? (
                        <View style={circStyles.recordDueTodayPill}>
                          <Text style={circStyles.recordDueTodayPillText}>Due Today</Text>
                        </View>
                      ) : (
                        <View style={circStyles.recordActivePill}>
                          <Text style={circStyles.recordActivePillText}>
                            {item.daysRemaining}d Left
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Divider */}
                    <View style={circStyles.recordDivider} />

                    {/* Middle Section: Book Title, Book Number & Accession */}
                    <View style={circStyles.recordBookRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={circStyles.recordBookTitle} numberOfLines={2}>
                          {item.bookTitle}
                        </Text>
                        <Text style={circStyles.recordBookMeta}>
                          Book No: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{item.bookNumber}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Timeline & Dates Row */}
                    <View style={circStyles.recordDatesRow}>
                      <View style={circStyles.dateCol}>
                        <Text style={circStyles.dateColLabel}>Issued Date</Text>
                        <Text style={circStyles.dateColValue}>{item.issueDate}</Text>
                      </View>
                      <View style={circStyles.dateColDivider} />
                      <View style={circStyles.dateCol}>
                        <Text style={circStyles.dateColLabel}>Due Date</Text>
                        <Text style={[circStyles.dateColValue, item.isOverdue && { color: '#DC2626', fontWeight: '800' }]}>
                          {item.dueDate}
                        </Text>
                      </View>
                    </View>

                    {/* Action Buttons: 1-Tap Quick Return & Renew */}
                    <View style={circStyles.recordActionsRow}>
                      <TouchableOpacity
                        style={circStyles.quickReturnBtn}
                        onPress={async () => {
                          Alert.alert(
                            'Return Book',
                            `Return "${item.bookTitle}" borrowed by ${item.studentName}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Confirm Return',
                                onPress: async () => {
                                  try {
                                    await onReturnSuccess(item.loanId || item.id, item.copyId);
                                  } catch (err: any) {
                                    Alert.alert('Error', err?.message || 'Failed to return book.');
                                  }
                                },
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={circStyles.quickReturnBtnText}>Return Book</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={circStyles.quickRenewBtn}
                        onPress={async () => {
                          try {
                            const targetLoan = loans.find((l) => l.id === (item.loanId || item.id));
                            if (targetLoan) {
                              handleRenewLoan(targetLoan);
                            } else {
                              const d = new Date();
                              d.setDate(d.getDate() + 14);
                              await onRenewSuccess(item.loanId || item.id, d.toISOString().split('T')[0]);
                            }
                          } catch (err: any) {
                            Alert.alert('Error', err?.message || 'Failed to renew loan.');
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={circStyles.quickRenewBtnText}>Renew (+14d)</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}

              {/* Pagination Controls for Issued Books Ledger */}
              {filteredDisplayLoans.length > 0 && (
                <View style={circStyles.paginationContainer}>
                  <Text style={circStyles.paginationInfo}>
                    Showing {ledgerStartRange}-{ledgerEndRange} of {filteredDisplayLoans.length} records
                  </Text>
                  <View style={circStyles.paginationBtnRow}>
                    <TouchableOpacity
                      style={[
                        circStyles.paginationBtn,
                        ledgerPage === 1 && circStyles.paginationBtnDisabled,
                      ]}
                      disabled={ledgerPage === 1}
                      onPress={() => setLedgerPage((p) => Math.max(1, p - 1))}
                      activeOpacity={0.8}
                    >
                      <Feather name="chevron-left" size={16} color={ledgerPage === 1 ? '#9CA3AF' : '#171717'} />
                      <Text
                        style={[
                          circStyles.paginationBtnText,
                          ledgerPage === 1 && circStyles.paginationBtnTextDisabled,
                        ]}
                      >
                        Prev
                      </Text>
                    </TouchableOpacity>

                    <View style={circStyles.paginationIndicator}>
                      <Text style={circStyles.paginationIndicatorText}>
                        {ledgerPage} / {totalLedgerPages}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        circStyles.paginationBtn,
                        ledgerPage === totalLedgerPages && circStyles.paginationBtnDisabled,
                      ]}
                      disabled={ledgerPage === totalLedgerPages}
                      onPress={() => setLedgerPage((p) => Math.min(totalLedgerPages, p + 1))}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          circStyles.paginationBtnText,
                          ledgerPage === totalLedgerPages && circStyles.paginationBtnTextDisabled,
                        ]}
                      >
                        Next
                      </Text>
                      <Feather name="chevron-right" size={16} color={ledgerPage === totalLedgerPages ? '#9CA3AF' : '#171717'} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  viewBody: { flex: 1, padding: 16, backgroundColor: '#F8FAFC' },
});

const circStyles = StyleSheet.create({
  /* Header Row with Yellow Badge */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    marginTop: 4,
  },
  headerIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F3E8C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  /* Mode Switcher Tabs */
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    padding: 4,
    marginBottom: 12,
    gap: 4,
  },
  issuedContainerCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  issuedContainerCardActive: {
    backgroundColor: '#FFFDF0',
    borderColor: '#F4C430',
    borderWidth: 1.5,
  },
  issuedContainerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    flexShrink: 1,
    marginRight: 10,
  },
  issuedContainerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  issuedTextWrap: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
  },
  issuedContainerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
  },
  issuedContainerSub: {
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 14,
  },
  issuedCountPill: {
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
    flexShrink: 0,
  },
  issuedCountPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#D97706',
  },
  issuedContainerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  issuedContainerActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 5,
  },
  tabButtonActive: {
    backgroundColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 12.5,
    color: '#475569',
    fontFamily: FontFamily.semibold,
  },
  tabButtonTextActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  tabBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },

  /* Main Card Container */
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 24,
  },

  /* Field Block */
  fieldBlock: {
    gap: 8,
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },

  /* Search Input Containers */
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchInputContainerFocused: {
    borderColor: '#0284C7',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  searchInputContainerWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  searchFieldInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputClearBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  searchChevronButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  fieldSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 6,
    marginLeft: 2,
  },

  /* Issue Book Action Button - #026440 */
  issueActionButton: {
    backgroundColor: '#026440',
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#026440',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  issueActionButtonDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  issueButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  issueActionButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  issueActionButtonTextDisabled: {
    color: '#94A3B8',
  },

  /* Return Book Action Button - Accept/Return in #026440 */
  returnActionButton: {
    backgroundColor: '#026440',
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#026440',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  returnActionButtonDisabled: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
  },
  returnButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  returnActionButtonText: {
    fontSize: 14.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  /* Legacy primary action button styles kept for compatibility */
  primaryActionButton: {
    backgroundColor: '#026440',
    borderRadius: 5,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonDisabled: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 5,
    padding: 14,
    gap: 10,
    marginTop: 14,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 17,
  },

  /* Empty State for Borrowed Books */
  emptyLoansCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  emptyIconBadge: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  sparkleEmoji: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 12,
  },
  emptyLoansTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
  },
  emptyLoansSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
    marginTop: 4,
    lineHeight: 18,
  },

  /* Dropdown styling */
  dropdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  dropdownClose: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#2563EB',
  },

  /* Horizontal Scrolling Section */
  horizontalScrollSection: {
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scrollSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 8,
    gap: 6,
  },
  scrollSectionTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  scrollHintText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0284C7',
  },
  horizontalScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  bookScrollCard: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 8,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardCoverThumb: {
    width: 60,
    height: 78,
    borderRadius: 5,
    backgroundColor: '#E2E8F0',
    marginBottom: 6,
  },
  cardCoverPlaceholder: {
    width: 60,
    height: 78,
    borderRadius: 5,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  cardDetails: {
    width: '100%',
    alignItems: 'center',
    gap: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    lineHeight: 14,
  },
  cardBookNo: {
    fontSize: 9.5,
    color: '#64748B',
    textAlign: 'center',
  },
  cardStockPill: {
    marginTop: 3,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#026440',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  cardStockText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#026440',
  },

  /* Horizontal Student Scroll Cards */
  studentScrollCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  studentScrollAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dropdownEmpty: {
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  dropdownEmptyText: {
    fontSize: 12,
    color: '#64748B',
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownThumb: {
    width: 28,
    height: 38,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  dropdownRowTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownRowMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  stockBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#026440',
  },
  studentSmallAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  borrowedCountBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  borrowedCountBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#92400E',
  },

  /* Selected Card (Book or Student) */
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEF08A',
    borderRadius: 5,
    padding: 12,
    gap: 10,
  },
  selectedThumb: {
    width: 38,
    height: 52,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  selectedTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectedMeta: {
    fontSize: 11.5,
    color: '#64748B',
  },
  selectedDetail: {
    fontSize: 11,
    color: '#854D0E',
    fontWeight: '600',
  },
  clearButton: {
    padding: 4,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
  },

  studentAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF08A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  usnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  usnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    gap: 3,
  },
  usnBadgeLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#64748B',
  },
  usnBadgeValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  classText: {
    fontSize: 11.5,
    color: '#64748B',
  },

  /* Copy Tag Chips */
  copyTagLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  copyTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyTagChipActive: {
    backgroundColor: '#FEF08A',
    borderColor: '#FDE047',
  },
  copyTagText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
  },
  copyTagTextActive: {
    color: '#0F172A',
  },
  copyTagLoc: {
    fontSize: 9.5,
    color: '#64748B',
  },
  copyTagLocActive: {
    color: '#475569',
  },

  /* Selectable Return Cards */
  selectableReturnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  selectableReturnCardActive: {
    borderColor: '#FDE047',
    backgroundColor: '#FFFDF5',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#FDE047',
    borderColor: '#EAB308',
  },
  bookThumb: {
    width: 32,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#E2E8F0',
  },
  loanBookTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  loanStudentMeta: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  loanCopyMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  loanDateMeta: {
    fontSize: 11,
    color: '#64748B',
  },
  overdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  overdueBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  overdueBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
  },
  fineEstText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  returnActionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  renewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF08A',
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#FDE047',
    marginTop: 4,
  },
  renewButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  renewButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },

  /* Issued & Overdue Register Styles */
  allLoansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  allLoansTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  allLoansSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  loanFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  loanFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loanFilterPillActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  loanFilterPillActiveOverdue: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  loanFilterPillText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#475569',
  },
  loanFilterPillTextActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  loanSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  loanSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  loanRecordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  loanRecordCardOverdue: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFCFA',
  },
  recordHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordStudentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  recordAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  recordStudentName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordUsnBadge: {},
  recordUsnBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  recordClassText: {
    fontSize: 11,
    color: '#64748B',
  },
  recordOverduePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordOverduePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  recordDueTodayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordDueTodayPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  recordActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recordActivePillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#026440',
  },
  recordDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  recordBookRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recordBookThumb: {
    width: 38,
    height: 50,
    borderRadius: 5,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBookTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  recordBookMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  recordDatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 5,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  dateCol: {
    flex: 1,
    alignItems: 'center',
  },
  dateColLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dateColValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  dateColDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  recordActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  quickReturnBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#026440',
    borderRadius: 5,
    paddingVertical: 10,
  },
  quickReturnBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  quickRenewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickRenewBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#0F172A',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    flexWrap: 'wrap',
    gap: 10,
  },
  paginationInfo: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  paginationBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  paginationBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  paginationBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  paginationBtnTextDisabled: {
    color: '#9CA3AF',
  },
  paginationIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  paginationIndicatorText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
});
