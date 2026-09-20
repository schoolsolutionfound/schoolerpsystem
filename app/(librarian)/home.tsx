import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
  Animated,
  Easing,
  Pressable,
  Platform,
  FlatList,
  Switch,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
let NativeMCI: any = null;
try {
  NativeMCI = require('@expo/vector-icons')?.MaterialCommunityIcons;
} catch (_e) {
  NativeMCI = null;
}

const ICON_FALLBACK_MAP: { [key: string]: string } = {
  'book-multiple': '📚',
  'swap-horizontal': '🔄',
  'alert-circle-outline': '⚠️',
  'book-open-page-variant': '📖',
  'file-document-multiple': '📄',
  'cash-register': '💵',
  'package-variant-closed': '📦',
  'lightning-bolt': '⚡',
  'file-chart-outline': '📊',
  'calendar-outline': '📅',
  'clipboard-check-outline': '📋',
  'clock-outline': '⏰',
  'tray-arrow-down': '📥',
  'eye-outline': '👁️',
  'download-outline': '📥',
  'trash-can-outline': '🗑️',
  'book-plus-outline': '➕',
  'account-plus-outline': '👤',
  'book-arrow-up': '📤',
  'book-arrow-down': '📥',
  'book-arrow-up-outline': '📤',
  'book-arrow-down-outline': '📥',
  'cash-multiple': '💵',
  'magnify': '🔍',
  'close': '✖',
  'close-circle-outline': '✖',
  'plus': '➕',
  'minus': '➖',
  'pencil-outline': '✏️',
  'upload': '📤',
  'download': '📥',
  'eye': '👁️',
  'menu': '☰',
  'chevron-left': '‹',
  'chevron-right': '›',
  'chevron-down': '⌄',
  'currency-usd': '💲',
  'check-circle-outline': '✅',
  'file-document-outline': '📄',
  'book-open-variant': '📖',
  'account-group-outline': '👥',
  'information-outline': 'ℹ️',
  'cog-outline': '⚙️',
  'shield-check-outline': '🛡️',
  'trending-up': '📈',
  'circle-outline': '⭕',
};

class SafeMaterialCommunityIcons extends React.Component<{ name: string; size?: number; color?: string; style?: any }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: any) {
    // Suppress missing native module crash
  }

  render() {
    const { name, size = 18, color = '#374151', style } = this.props;

    if (!this.state.hasError && NativeMCI) {
      try {
        return <NativeMCI name={name as any} size={size} color={color} style={style} />;
      } catch (_e) {
        // Fallback to text symbol
      }
    }

    const symbol = ICON_FALLBACK_MAP[name] || '•';
    return (
      <Text style={[{ fontSize: Math.round(size * 0.85), color, textAlign: 'center' }, style]}>
        {symbol}
      </Text>
    );
  }
}

const MaterialCommunityIcons = SafeMaterialCommunityIcons;

// Safe MaterialCommunityIcons wrapper for Feather icon names
const FEATHER_TO_MCI_MAP: { [key: string]: string } = {
  'search': 'magnify',
  'x': 'close',
  'x-circle': 'close-circle-outline',
  'plus': 'plus',
  'minus': 'minus',
  'edit-2': 'pencil-outline',
  'trash-2': 'trash-can-outline',
  'user-plus': 'account-plus-outline',
  'upload': 'upload',
  'download': 'download',
  'eye': 'eye-outline',
  'menu': 'menu',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'chevron-down': 'chevron-down',
  'dollar-sign': 'currency-usd',
  'check-circle': 'check-circle-outline',
  'alert-circle': 'alert-circle-outline',
  'file-text': 'file-document-outline',
  'book-open': 'book-open-variant',
  'log-out': 'book-arrow-up-outline',
  'log-in': 'book-arrow-down-outline',
  'book': 'book-open-variant',
  'users': 'account-group-outline',
  'file': 'file-document-outline',
};

const Feather: React.FC<{ name: string; size?: number; color?: string; style?: any }> = ({ name, size = 20, color = '#000', style }) => {
  const mciName = FEATHER_TO_MCI_MAP[name] || 'circle-outline';
  return <MaterialCommunityIcons name={mciName as any} size={size} color={color} style={style} />;
};

const Ionicons: React.FC<{ name: string; size?: number; color?: string; style?: any }> = ({ name, size = 20, color = '#000', style }) => {
  return <MaterialCommunityIcons name="information-outline" size={size} color={color} style={style} />;
};
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { apiClient } from '../../api/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type BookType = 'TEXTBOOK' | 'REFERENCE' | 'FICTION' | 'NON_FICTION' | 'COMPETITIVE' | 'GENERAL';
export type CopyStatus = 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'OVERDUE' | 'LOST' | 'DAMAGED' | 'UNDER_REPAIR' | 'WITHDRAWN';
export type CopyCondition = 'GOOD' | 'FAIR' | 'DAMAGED' | 'BAD';
export type LoanStatus = 'ACTIVE' | 'RETURNED' | 'OVERDUE' | 'LOST';
export type ReservationStatus = 'WAITING' | 'AVAILABLE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
export type FineType = 'OVERDUE' | 'LOST_BOOK' | 'DAMAGED_BOOK' | 'OTHER';
export type FineStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED' | 'CANCELLED';
export type ExamType = 'MIDTERM' | 'FINAL' | 'UNIT_TEST' | 'ANNUAL' | 'SUPPLEMENTARY';

export type DamageType =
  | 'TORN_PAGES'
  | 'WATER_DAMAGE'
  | 'BINDING_BROKEN'
  | 'COVER_DAMAGED'
  | 'WRITING_ANNOTATIONS'
  | 'MISSING_PAGES'
  | 'SEVERE_MOLD'
  | 'TOTAL_DESTRUCTION'
  | 'GENERAL_WEAR';

export type PaymentTransaction = {
  id: string;
  fineId: string;
  receiptNo: string;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI_ONLINE' | 'DIGITAL_WALLET' | 'SCANNER_QR';
  cashTendered?: number;
  changeReturned?: number;
  transactionRef?: string;
  scannedQrPayload?: string;
  paidAt: string;
  cashier: string;
};

export interface Author {
  id: string;
  name: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null;
}

export interface BookCopy {
  id: string;
  bookId: string;
  accessionNumber: string;
  barcode: string;
  rack: string;
  shelf: string;
  status: CopyStatus;
  condition: CopyCondition;
  addedAt: string;
  updatedAt: string;
}

export interface Book {
  id: string;
  title: string;
  isbn: string;
  publisher?: string;
  edition?: string;
  publicationYear?: number;
  language: string;
  categoryId: string;
  subject?: string;
  description?: string;
  bookType: BookType;
  coverImage?: string;
  keywords: string[];
  authorIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionPaper {
  id: string;
  title: string;
  subject: string;
  academicYear: string;
  examType: ExamType;
  classGrade: string;
  totalMarks: number;
  durationMinutes: number;
  fileUrl?: string;
  downloadsCount: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Loan {
  id: string;
  copyId: string;
  bookId: string;
  studentId: string;
  issuedBy: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: LoanStatus;
  renewalCount: number;
  createdAt: string;
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
  loanId?: string;
  bookCopyId?: string;
  studentId: string;
  fineType: FineType;
  damageType?: DamageType;
  damageNotes?: string;
  amount: number;
  paidAmount: number;
  status: FineStatus;
  waivedBy?: string;
  waivedReason?: string;
  createdAt: string;
  updatedAt: string;
  paymentTransactions?: PaymentTransaction[];
}

export interface LibrarySettings {
  id: string;
  borrowingLimit: number;
  loanPeriodDays: number;
  gracePeriodDays: number;
  finePerDay: number;
  maxFine: number;
  renewalLimit: number;
  allowReservation: boolean;
  lostBookPenalty: number;
  damagedBookPenalty: number;
  reservationExpiryDays?: number;
  unpaidFineLockThreshold?: number;
  openingHours?: string;
  closingHours?: string;
  openOnWeekends?: boolean;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  admissionNo: string;
  classSection: string;
  email: string;
  phone?: string;
}

// ============================================================================
// INITIAL MOCK DATA (FALLBACK)
// ============================================================================

const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Computer Science & IT', description: 'Software engineering, programming, AI & databases' },
  { id: 'cat-2', name: 'Mathematics & Statistics', description: 'Algebra, calculus, geometry, probability & statistics' },
  { id: 'cat-3', name: 'Physics & Astronomy', description: 'Classical mechanics, quantum physics & astrophysics' },
  { id: 'cat-4', name: 'Chemistry & Materials', description: 'Organic, inorganic, physical chemistry & material science' },
  { id: 'cat-5', name: 'Biological & Life Sciences', description: 'Botany, zoology, genetics, biochemistry & biotechnology' },
  { id: 'cat-6', name: 'Mechanical & Civil Eng.', description: 'Thermodynamics, mechanics, structural design & robotics' },
  { id: 'cat-7', name: 'Electrical & Electronics', description: 'Circuits, microprocessors, signal processing & VLSI' },
  { id: 'cat-8', name: 'Literature & Languages', description: 'Fiction, poetry, drama, linguistics & classics' },
  { id: 'cat-9', name: 'History & Civics', description: 'World history, political science, civics & heritage' },
  { id: 'cat-10', name: 'Economics & Finance', description: 'Microeconomics, macroeconomics, accounting & commerce' },
  { id: 'cat-11', name: 'Business & Management', description: 'Entrepreneurship, marketing, strategy & leadership' },
  { id: 'cat-12', name: 'Psychology & Philosophy', description: 'Behavioral science, ethics, logic & cognitive science' },
  { id: 'cat-13', name: 'Competitive Exams & Prep', description: 'JEE, NEET, SAT, GRE, Olympiads & civil services prep' },
  { id: 'cat-14', name: 'General Reference', description: 'Encyclopedias, dictionaries, yearbooks & atlases' },
  { id: 'cat-15', name: 'Magazines & Periodicals', description: 'Research periodicals, science journals & academic bulletins' },
];

const INITIAL_AUTHORS: Author[] = [
  { id: 'auth-1', name: 'Robert C. Martin', bio: 'Software engineer and author of Clean Code' },
  { id: 'auth-2', name: 'Thomas H. Cormen', bio: 'Co-author of Introduction to Algorithms' },
  { id: 'auth-3', name: 'H.C. Verma', bio: 'Renowned physicist and author of Concepts of Physics' },
  { id: 'auth-4', name: 'J.K. Rowling', bio: 'Author of the Harry Potter fantasy series' },
  { id: 'auth-5', name: 'R.D. Sharma', bio: 'Prominent mathematics educator' },
];

const INITIAL_BOOKS: Book[] = [
  {
    id: 'book-1',
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    isbn: '978-0132350884',
    publisher: 'Prentice Hall',
    edition: '1st Edition',
    publicationYear: 2008,
    language: 'English',
    categoryId: 'cat-1',
    subject: 'Software Engineering',
    description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.',
    bookType: 'TEXTBOOK',
    coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
    keywords: ['clean code', 'refactoring', 'java', 'programming'],
    authorIds: ['auth-1'],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'book-2',
    title: 'Introduction to Algorithms (CLRS)',
    isbn: '978-0262033848',
    publisher: 'MIT Press',
    edition: '3rd Edition',
    publicationYear: 2009,
    language: 'English',
    categoryId: 'cat-1',
    subject: 'Algorithms & Data Structures',
    description: 'Comprehensive textbook covering data structures, sorting algorithms, graph theory, and dynamic programming.',
    bookType: 'REFERENCE',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    keywords: ['algorithms', 'data structures', 'clrs', 'mit'],
    authorIds: ['auth-2'],
    createdAt: '2026-01-12T11:00:00Z',
    updatedAt: '2026-01-12T11:00:00Z',
  },
  {
    id: 'book-3',
    title: 'Concepts of Physics (Vol 1 & 2)',
    isbn: '978-8177091877',
    publisher: 'Bharti Bhawan',
    edition: 'Revised Edition',
    publicationYear: 2021,
    language: 'English',
    categoryId: 'cat-3',
    subject: 'Physics',
    description: 'Essential physics guidebook for secondary school students and competitive exam aspirants.',
    bookType: 'COMPETITIVE',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400',
    keywords: ['physics', 'mechanics', 'jee', 'hc verma'],
    authorIds: ['auth-3'],
    createdAt: '2026-01-15T09:30:00Z',
    updatedAt: '2026-01-15T09:30:00Z',
  },
  {
    id: 'book-4',
    title: 'Harry Potter and the Philosopher\'s Stone',
    isbn: '978-0747532699',
    publisher: 'Bloomsbury',
    edition: 'Special Edition',
    publicationYear: 1997,
    language: 'English',
    categoryId: 'cat-4',
    subject: 'Fantasy Fiction',
    description: 'The story of Harry Potter, an 11-year-old boy who discovers he is a wizard on his birthday.',
    bookType: 'FICTION',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    keywords: ['harry potter', 'magic', 'fiction', 'hogwarts'],
    authorIds: ['auth-4'],
    createdAt: '2026-02-01T14:00:00Z',
    updatedAt: '2026-02-01T14:00:00Z',
  },
  {
    id: 'book-5',
    title: 'Mathematics for Class 10',
    isbn: '978-9352530861',
    publisher: 'Dhanpat Rai Publications',
    edition: '2025 Edition',
    publicationYear: 2024,
    language: 'English',
    categoryId: 'cat-2',
    subject: 'Mathematics',
    description: 'Standard textbook for CBSE Class 10 Mathematics syllabus.',
    bookType: 'TEXTBOOK',
    coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
    keywords: ['maths', 'class 10', 'cbse', 'rd sharma'],
    authorIds: ['auth-5'],
    createdAt: '2026-02-05T08:00:00Z',
    updatedAt: '2026-02-05T08:00:00Z',
  },
];

const INITIAL_COPIES: BookCopy[] = [
  { id: 'copy-101', bookId: 'book-1', accessionNumber: 'ACC-000101', barcode: 'BAR-100101', rack: 'Rack A', shelf: 'Shelf 1', status: 'AVAILABLE', condition: 'GOOD', addedAt: '2026-01-10', updatedAt: '2026-01-10' },
  { id: 'copy-102', bookId: 'book-1', accessionNumber: 'ACC-000102', barcode: 'BAR-100102', rack: 'Rack A', shelf: 'Shelf 1', status: 'ISSUED', condition: 'GOOD', addedAt: '2026-01-10', updatedAt: '2026-02-15' },
  { id: 'copy-103', bookId: 'book-2', accessionNumber: 'ACC-000201', barcode: 'BAR-100201', rack: 'Rack A', shelf: 'Shelf 3', status: 'AVAILABLE', condition: 'GOOD', addedAt: '2026-01-12', updatedAt: '2026-01-12' },
  { id: 'copy-104', bookId: 'book-3', accessionNumber: 'ACC-000301', barcode: 'BAR-100301', rack: 'Rack B', shelf: 'Shelf 2', status: 'ISSUED', condition: 'GOOD', addedAt: '2026-01-15', updatedAt: '2026-02-10' },
  { id: 'copy-105', bookId: 'book-3', accessionNumber: 'ACC-000302', barcode: 'BAR-100302', rack: 'Rack B', shelf: 'Shelf 2', status: 'OVERDUE', condition: 'FAIR', addedAt: '2026-01-15', updatedAt: '2026-02-01' },
  { id: 'copy-106', bookId: 'book-4', accessionNumber: 'ACC-000401', barcode: 'BAR-100401', rack: 'Rack C', shelf: 'Shelf 4', status: 'RESERVED', condition: 'GOOD', addedAt: '2026-02-01', updatedAt: '2026-03-01' },
  { id: 'copy-107', bookId: 'book-5', accessionNumber: 'ACC-000501', barcode: 'BAR-100501', rack: 'Rack D', shelf: 'Shelf 1', status: 'AVAILABLE', condition: 'GOOD', addedAt: '2026-02-05', updatedAt: '2026-02-05' },
];

const INITIAL_QUESTION_PAPERS: QuestionPaper[] = [
  {
    id: 'qp-1',
    title: 'Mathematics Final Term Examination Paper',
    subject: 'Mathematics',
    academicYear: '2024-2025',
    examType: 'FINAL',
    classGrade: 'Class 10',
    totalMarks: 80,
    durationMinutes: 180,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadsCount: 142,
    uploadedAt: '2025-03-15T10:00:00Z',
    uploadedBy: 'Amina Rahman',
  },
  {
    id: 'qp-2',
    title: 'Physics Midterm Assessment Paper',
    subject: 'Physics',
    academicYear: '2024-2025',
    examType: 'MIDTERM',
    classGrade: 'Class 12',
    totalMarks: 70,
    durationMinutes: 180,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadsCount: 98,
    uploadedAt: '2024-10-20T11:30:00Z',
    uploadedBy: 'Amina Rahman',
  },
  {
    id: 'qp-3',
    title: 'Computer Science Annual Examination Paper',
    subject: 'Computer Science',
    academicYear: '2023-2024',
    examType: 'ANNUAL',
    classGrade: 'Class 12',
    totalMarks: 70,
    durationMinutes: 180,
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    downloadsCount: 215,
    uploadedAt: '2024-03-10T09:15:00Z',
    uploadedBy: 'Amina Rahman',
  },
];

const INITIAL_STUDENTS: StudentProfile[] = [
  { id: 'std-1', fullName: 'Rahul Mehta', admissionNo: 'ADM-2024-001', classSection: 'Class 10-A', email: 'rahul.m@school.com', phone: '+1 555-0192' },
  { id: 'std-2', fullName: 'Sneha Nair', admissionNo: 'ADM-2024-042', classSection: 'Class 12-B', email: 'sneha.n@school.com', phone: '+1 555-0143' },
  { id: 'std-3', fullName: 'Aman Shah', admissionNo: 'ADM-2024-108', classSection: 'Class 9-C', email: 'aman.s@school.com', phone: '+1 555-0177' },
  { id: 'std-4', fullName: 'Fatima Ali', admissionNo: 'ADM-2024-215', classSection: 'Class 11-A', email: 'fatima.a@school.com', phone: '+1 555-0211' },
  { id: 'std-5', fullName: 'Vishnu R', admissionNo: 'ADM-2024-301', classSection: 'Class 10-B', email: 'vishnu.r@school.com', phone: '+1 555-0301' },
];

const INITIAL_LOANS: Loan[] = [
  { id: 'loan-1', copyId: 'copy-102', bookId: 'book-1', studentId: 'std-1', issuedBy: 'lib-user', issueDate: '2026-09-01', dueDate: '2026-09-15', status: 'ACTIVE', renewalCount: 0, createdAt: '2026-09-01' },
  { id: 'loan-2', copyId: 'copy-104', bookId: 'book-3', studentId: 'std-2', issuedBy: 'lib-user', issueDate: '2026-09-05', dueDate: '2026-09-19', status: 'ACTIVE', renewalCount: 1, createdAt: '2026-09-05' },
  { id: 'loan-3', copyId: 'copy-105', bookId: 'book-3', studentId: 'std-3', issuedBy: 'lib-user', issueDate: '2026-08-10', dueDate: '2026-08-24', status: 'OVERDUE', renewalCount: 0, createdAt: '2026-08-10' },
];

const INITIAL_RESERVATIONS: Reservation[] = [
  { id: 'res-1', bookId: 'book-4', studentId: 'std-4', status: 'WAITING', reservedAt: '2026-09-18T10:00:00Z', expiresAt: '2026-09-25T10:00:00Z' },
  { id: 'res-2', bookId: 'book-1', studentId: 'std-2', status: 'AVAILABLE', reservedAt: '2026-09-15T14:30:00Z', expiresAt: '2026-09-22T14:30:00Z' },
];

const INITIAL_FINES: Fine[] = [
  { id: 'fine-1', loanId: 'loan-3', studentId: 'std-3', fineType: 'OVERDUE', amount: 25.0, paidAmount: 0, status: 'UNPAID', createdAt: '2026-08-27', updatedAt: '2026-08-27' },
  { id: 'fine-2', studentId: 'std-1', fineType: 'DAMAGED_BOOK', amount: 15.0, paidAmount: 15.0, status: 'PAID', createdAt: '2026-08-01', updatedAt: '2026-08-02' },
];

const INITIAL_SETTINGS: LibrarySettings = {
  id: 'set-1',
  borrowingLimit: 3,
  loanPeriodDays: 14,
  gracePeriodDays: 2,
  finePerDay: 1.0,
  maxFine: 100.0,
  renewalLimit: 2,
  allowReservation: true,
  lostBookPenalty: 50.0,
  damagedBookPenalty: 25.0,
  reservationExpiryDays: 7,
  unpaidFineLockThreshold: 20.0,
  openingHours: '08:00 AM',
  closingHours: '06:00 PM',
  openOnWeekends: true,
};

// ============================================================================
// NAVIGATION MENU DEFINITION
// ============================================================================

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'view-dashboard-outline' },
  { key: 'books', label: 'Book Entry', icon: 'book-open-outline' },
  { key: 'issue', label: 'Issue / Return', icon: 'swap-horizontal' },
  { key: 'categories', label: 'Book Categories', icon: 'tag-outline' },
  { key: 'pyqs', label: 'Question Papers', icon: 'file-document-multiple-outline' },
  { key: 'students', label: 'Members', icon: 'account-group-outline' },
  { key: 'fines', label: 'Fine Management', icon: 'cash-multiple' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline', badge: 3 },
  { key: 'settings', label: 'Settings', icon: 'cog-outline' },
];

// ============================================================================
// SIDEBAR / DRAWER COMPONENT
// ============================================================================

interface SidebarContentProps {
  activeTab: string;
  onNavigate: (key: string) => void;
  onLogout: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ activeTab, onNavigate, onLogout }) => {
  return (
    <View style={sidebarStyles.container}>
      {/* Brand Header */}
      <View style={sidebarStyles.brandBox}>
        <View style={sidebarStyles.logoBadge}>
          <Text style={sidebarStyles.logoText}>K</Text>
        </View>
        <View>
          <Text style={sidebarStyles.brandTitle}>KIVQUO</Text>
          <Text style={sidebarStyles.brandSubtitle}>Smart School Management</Text>
        </View>
      </View>

      {/* Nav List */}
      <ScrollView style={sidebarStyles.menuList} showsVerticalScrollIndicator={false}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[sidebarStyles.navItem, isActive && sidebarStyles.navItemActive]}
              onPress={() => onNavigate(item.key)}
            >
              <MaterialCommunityIcons
                name={item.icon as any}
                size={20}
                color={isActive ? '#EAB308' : '#9CA3AF'}
              />
              <Text style={[sidebarStyles.navLabel, isActive && sidebarStyles.navLabelActive]}>
                {item.label}
              </Text>
              {item.badge ? (
                <View style={sidebarStyles.badgePill}>
                  <Text style={sidebarStyles.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Quote Illustration Box */}
      <View style={sidebarStyles.quoteBox}>
        <MaterialCommunityIcons name="book-open-page-variant" size={40} color="#EAB308" />
        <Text style={sidebarStyles.quoteText}>“Good books build great minds.”</Text>
      </View>
    </View>
  );
};

const sidebarStyles = StyleSheet.create({
  container: { width: 250, backgroundColor: '#121316', borderRightWidth: 1, borderRightColor: '#1F2228', flex: 1, paddingVertical: 18, paddingHorizontal: 14, justifyContent: 'space-between' },
  brandBox: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#1F2228', paddingHorizontal: 6 },
  logoBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#EAB308', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#121316', fontSize: 22, fontWeight: '900' },
  brandTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  brandSubtitle: { color: '#9CA3AF', fontSize: 10, fontWeight: '500' },
  menuList: { flex: 1, marginTop: 16 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4 },
  navItemActive: { backgroundColor: '#1A1C20', borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.3)' },
  navLabel: { flex: 1, color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  navLabelActive: { color: '#EAB308', fontWeight: '800' },
  badgePill: { backgroundColor: '#EAB308', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#121316', fontSize: 10, fontWeight: '900' },
  quoteBox: { marginTop: 16, backgroundColor: '#181A1F', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: '#EAB308', gap: 6 },
  quoteText: { color: '#D1D5DB', fontSize: 11, fontStyle: 'italic', lineHeight: 16, fontWeight: '500' },
});

// ============================================================================
// TOP HEADER BAR COMPONENT
// ============================================================================

interface LibrarianHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onMenuPress: () => void;
  onNotificationsPress: () => void;
  onProfilePress: () => void;
  userName: string;
}

const LibrarianHeader: React.FC<LibrarianHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onMenuPress,
  onNotificationsPress,
  onProfilePress,
  userName,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 900;
  const isSmall = width < 480;

  return (
    <View style={[topHeaderStyles.bar, isSmall && { paddingHorizontal: 10, gap: 6 }]}>
      {isMobile && (
        <TouchableOpacity style={topHeaderStyles.iconBtn} onPress={onMenuPress}>
          <Feather name="menu" size={20} color="#1F2937" />
        </TouchableOpacity>
      )}

      {/* Global Search Bar */}
      <View style={[topHeaderStyles.searchWrap, isSmall && { paddingHorizontal: 10, paddingVertical: 6, marginRight: 0 }]}>
        <Feather name="search" size={15} color="#6B7280" />
        <TextInput
          style={topHeaderStyles.searchInput}
          placeholder={isSmall ? "Search..." : "Search books, members, or anything..."}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>

      <View style={[topHeaderStyles.rightContainer, isSmall && { gap: 6 }]}>
        {/* Notification Bell */}
        <TouchableOpacity style={topHeaderStyles.iconBtn} onPress={onNotificationsPress}>
          <Feather name="bell" size={18} color="#374151" />
          <View style={topHeaderStyles.notifBadge} />
        </TouchableOpacity>

        {/* Brand / Profile Logo Trigger */}
        <TouchableOpacity style={[topHeaderStyles.userBox, isSmall && { paddingHorizontal: 6, paddingVertical: 4 }]} onPress={onProfilePress}>
          <View style={topHeaderStyles.brandLogoBadge}>
            <Text style={topHeaderStyles.brandLogoText}>K</Text>
          </View>
          {!isMobile && (
            <View>
              <Text style={topHeaderStyles.userName}>{userName}</Text>
              <Text style={topHeaderStyles.userRole}>Librarian Portal</Text>
            </View>
          )}
          <Feather name="chevron-down" size={14} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const topHeaderStyles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 10 },
  searchWrap: { flex: 1, maxWidth: 440, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, gap: 8, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#1F2937', paddingVertical: 0 },
  rightContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 8, borderRadius: 20, backgroundColor: '#F3F4F6', position: 'relative' },
  notifBadge: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  userBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFFDF7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 24, borderWidth: 1, borderColor: '#FEF08A' },
  brandLogoBadge: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EAB308', alignItems: 'center', justifyContent: 'center' },
  brandLogoText: { color: '#121316', fontSize: 17, fontWeight: '900' },
  userName: { fontSize: 13, fontWeight: '800', color: '#1F2937' },
  userRole: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
});

// ============================================================================
// MAIN LIBRARIAN SCREEN
// ============================================================================

export default function LibrarianHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const userName = useUserStore((state) => state.fullName) || 'Amina Rahman';
  const resetUser = useUserStore((state) => state.resetUser);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Entities State
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [authors, setAuthors] = useState<Author[]>(INITIAL_AUTHORS);
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [copies, setCopies] = useState<BookCopy[]>(INITIAL_COPIES);
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>(INITIAL_QUESTION_PAPERS);
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [fines, setFines] = useState<Fine[]>(INITIAL_FINES);
  const [students, setStudents] = useState<StudentProfile[]>(INITIAL_STUDENTS);
  const [settings, setSettings] = useState<LibrarySettings>(INITIAL_SETTINGS);

  // Modals state
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [editingCopy, setEditingCopy] = useState<BookCopy | null>(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [payFineModalOpen, setPayFineModalOpen] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [waiveFineModalOpen, setWaiveFineModalOpen] = useState(false);
  const [damageFineModalOpen, setDamageFineModalOpen] = useState(false);
  const [pyqModalOpen, setPyqModalOpen] = useState(false);
  const [previewPyq, setPreviewPyq] = useState<QuestionPaper | null>(null);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Silent backend sync
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [booksRes, categoriesRes, authorsRes, loansRes, resRes, finesRes, settingsRes] = await Promise.all([
          apiClient('/library/books').catch(() => null),
          apiClient('/library/categories').catch(() => null),
          apiClient('/library/authors').catch(() => null),
          apiClient('/library/loans').catch(() => null),
          apiClient('/library/reservations').catch(() => null),
          apiClient('/library/fines').catch(() => null),
          apiClient('/library/settings').catch(() => null),
        ]);

        if (booksRes && Array.isArray(booksRes)) setBooks(booksRes);
        if (categoriesRes && Array.isArray(categoriesRes)) setCategories(categoriesRes);
        if (authorsRes && Array.isArray(authorsRes)) setAuthors(authorsRes);
        if (loansRes && Array.isArray(loansRes)) setLoans(loansRes);
        if (resRes && Array.isArray(resRes)) setReservations(resRes);
        if (finesRes && Array.isArray(finesRes)) setFines(finesRes);
        if (settingsRes && settingsRes.borrowingLimit) setSettings(settingsRes);
      } catch (err) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Librarian Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch {}
          resetUser();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleDeleteBook = (bookId: string) => {
    Alert.alert(
      'Delete Book Entry',
      'Are you sure you want to delete this book from the catalog? All associated inventory copies will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient(`/library/books/${bookId}`, { method: 'DELETE' });
            } catch {}
            setBooks((prev) => prev.filter((b) => b.id !== bookId));
            setCopies((prev) => prev.filter((c) => c.bookId !== bookId));
            if (selectedBook?.id === bookId) {
              setSelectedBook(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const activeStudentLoans = loans.filter((l) => l.studentId === studentId && (l.status === 'ACTIVE' || l.status === 'OVERDUE'));

    if (activeStudentLoans.length > 0) {
      Alert.alert(
        'Cannot Remove Member',
        `Member ${student?.fullName || ''} currently has ${activeStudentLoans.length} active unreturned loan(s). Please return all borrowed books first.`
      );
      return;
    }

    Alert.alert(
      'Remove Library Member',
      `Are you sure you want to remove ${student?.fullName || 'this member'} from the library directory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient(`/library/students/${studentId}`, { method: 'DELETE' });
            } catch {}
            setStudents((prev) => prev.filter((s) => s.id !== studentId));
            Alert.alert('Member Removed', 'The member record has been deleted from the directory.');
          },
        },
      ]
    );
  };

  const handleDeletePYQ = (pyqId: string) => {
    const paper = questionPapers.find((p) => p.id === pyqId);
    Alert.alert(
      'Delete Question Paper',
      `Are you sure you want to remove "${paper?.title || 'this paper'}" from the PYQ repository?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient(`/library/pyqs/${pyqId}`, { method: 'DELETE' });
            } catch {}
            setQuestionPapers((prev) => prev.filter((p) => p.id !== pyqId));
            Alert.alert('Paper Deleted', 'The question paper has been permanently removed.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.rootContainer}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.appBody}>
          {/* Permanent Left Sidebar on Desktop */}
          {isDesktop && (
            <SidebarContent
              activeTab={activeTab}
              onNavigate={(tab) => {
                if (tab === 'notifications') setNotificationsModalOpen(true);
                else setActiveTab(tab);
              }}
              onLogout={handleLogout}
            />
          )}

          {/* Main Dashboard Content Area */}
          <View style={styles.mainWorkspace}>
            <LibrarianHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onMenuPress={() => setDrawerOpen(true)}
              onNotificationsPress={() => setNotificationsModalOpen(true)}
              onProfilePress={() => setActiveTab('profile')}
              userName={userName}
            />

            <View style={styles.tabContentArea}>
              {activeTab === 'dashboard' && (
                <LibrarianDashboardView
                  books={books}
                  copies={copies}
                  loans={loans}
                  students={students}
                  fines={fines}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onAddBook={() => {
                    setEditingBook(null);
                    setBookModalOpen(true);
                  }}
                />
              )}

              {activeTab === 'books' && (
                selectedBook ? (
                  <BookDetailView
                    book={selectedBook}
                    copies={copies.filter((c) => c.bookId === selectedBook.id)}
                    authors={authors}
                    categories={categories}
                    onBack={() => setSelectedBook(null)}
                    onEditBook={() => {
                      setEditingBook(selectedBook);
                      setBookModalOpen(true);
                    }}
                    onDeleteBook={handleDeleteBook}
                    onAddCopy={() => {
                      setEditingCopy(null);
                      setCopyModalOpen(true);
                    }}
                    onEditCopy={(copy: BookCopy) => {
                      setEditingCopy(copy);
                      setCopyModalOpen(true);
                    }}
                    onDeleteCopy={(copyId: string) => {
                      setCopies((prev) => prev.filter((c) => c.id !== copyId));
                    }}
                  />
                ) : (
                  <BooksView
                    books={books}
                    copies={copies}
                    categories={categories}
                    authors={authors}
                    onSelectBook={(book) => setSelectedBook(book)}
                    onAddBook={() => {
                      setEditingBook(null);
                      setBookModalOpen(true);
                    }}
                    onDeleteBook={handleDeleteBook}
                  />
                )
              )}

              {activeTab === 'issue' && (
                <IssueBookView
                  students={students}
                  books={books}
                  copies={copies}
                  loans={loans}
                  fines={fines}
                  settings={settings}
                  onIssueSuccess={(newLoan: Loan, copyId: string) => {
                    setLoans((prev) => [newLoan, ...prev]);
                    setCopies((prev) => prev.map((c) => c.id === copyId ? { ...c, status: 'ISSUED' } : c));
                    Alert.alert('Book Issued', 'Successfully issued book to member.');
                  }}
                  onReturnSuccess={(loanId: string, copyId: string, newFine?: Fine) => {
                    setLoans((prev) => prev.map((l) => l.id === loanId ? { ...l, status: 'RETURNED', returnDate: new Date().toISOString().split('T')[0] } : l));
                    setCopies((prev) => prev.map((c) => c.id === copyId ? { ...c, status: 'AVAILABLE' } : c));
                    if (newFine) {
                      setFines((prev) => [newFine, ...prev]);
                      Alert.alert('Book Returned', `Book returned successfully. An overdue fine of $${newFine.amount.toFixed(2)} was generated.`);
                    } else {
                      Alert.alert('Book Returned', 'Book returned successfully with zero fines.');
                    }
                  }}
                  onRenewSuccess={(loanId: string, newDueDate: string) => {
                    setLoans((prev) => prev.map((l) => l.id === loanId ? { ...l, dueDate: newDueDate, renewalCount: (l.renewalCount || 0) + 1 } : l));
                    Alert.alert('Loan Renewed', `Loan extended until ${newDueDate}.`);
                  }}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesView categories={categories} books={books} />
              )}

              {activeTab === 'pyqs' && (
                <PYQsView
                  questionPapers={questionPapers}
                  onUploadPYQ={() => setPyqModalOpen(true)}
                  onPreviewPYQ={(paper) => setPreviewPyq(paper)}
                  onDeletePYQ={handleDeletePYQ}
                />
              )}

              {activeTab === 'fines' && (
                <FinesView
                  fines={fines}
                  students={students}
                  copies={copies}
                  books={books}
                  onPayFine={(fine) => {
                    setSelectedFine(fine);
                    setPayFineModalOpen(true);
                  }}
                  onWaiveFine={(fine) => {
                    setSelectedFine(fine);
                    setWaiveFineModalOpen(true);
                  }}
                  onAssessDamage={() => setDamageFineModalOpen(true)}
                />
              )}

              {activeTab === 'students' && (
                <LibraryStudentsView
                  students={students}
                  loans={loans}
                  copies={copies}
                  books={books}
                  fines={fines}
                  reservations={reservations}
                  onAddStudent={() => {
                    setEditingStudent(null);
                    setStudentModalOpen(true);
                  }}
                  onEditStudent={(student) => {
                    setEditingStudent(student);
                    setStudentModalOpen(true);
                  }}
                  onDeleteStudent={handleDeleteStudent}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  books={books}
                  copies={copies}
                  loans={loans}
                  fines={fines}
                  students={students}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onSaveSettings={(newSettings) => {
                    setSettings(newSettings);
                    Alert.alert('Settings Updated', 'Library configuration saved successfully.');
                  }}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView userName={userName} onLogout={handleLogout} />
              )}
            </View>
          </View>
        </View>

        {/* Mobile Slide-out Modal Drawer */}
        {!isDesktop && (
          <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row' }}>
              <SidebarContent
                activeTab={activeTab}
                onNavigate={(tab) => {
                  setDrawerOpen(false);
                  if (tab === 'notifications') setNotificationsModalOpen(true);
                  else setActiveTab(tab);
                }}
                onLogout={() => {
                  setDrawerOpen(false);
                  handleLogout();
                }}
              />
              <Pressable style={{ flex: 1 }} onPress={() => setDrawerOpen(false)} />
            </View>
          </Modal>
        )}

        {/* Book Form Modal */}
        <BookFormModal
          visible={bookModalOpen}
          editingBook={editingBook}
          categories={categories}
          authors={authors}
          onClose={() => setBookModalOpen(false)}
          onSave={(bookData) => {
            if (editingBook) {
              setBooks((prev) => prev.map((b) => b.id === editingBook.id ? { ...b, ...bookData } : b));
            } else {
              const newBookId = `book-${Date.now()}`;
              const { totalCopies, ...bData } = bookData;
              const newB: Book = {
                ...bData,
                id: newBookId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as Book;
              setBooks((prev) => [newB, ...prev]);

              const copyCount = totalCopies && totalCopies > 0 ? totalCopies : 1;
              const newCopiesList: BookCopy[] = [];
              for (let i = 1; i <= copyCount; i++) {
                const accNum = `ACC-${String(Math.floor(100000 + Math.random() * 900000))}`;
                const barCode = `BAR-${String(Math.floor(100000 + Math.random() * 900000))}`;
                newCopiesList.push({
                  id: `copy-${Date.now()}-${i}`,
                  bookId: newBookId,
                  accessionNumber: accNum,
                  barcode: barCode,
                  rack: 'Rack A',
                  shelf: 'Shelf 1',
                  status: 'AVAILABLE',
                  condition: 'GOOD',
                  addedAt: new Date().toISOString().split('T')[0],
                  updatedAt: new Date().toISOString().split('T')[0],
                });
              }
              setCopies((prev) => [...newCopiesList, ...prev]);
            }
            setBookModalOpen(false);
          }}
        />

        {/* Copy Form Modal */}
        <CopyFormModal
          visible={copyModalOpen}
          editingCopy={editingCopy}
          bookId={selectedBook?.id || ''}
          onClose={() => setCopyModalOpen(false)}
          onSave={(copyData) => {
            if (editingCopy) {
              setCopies((prev) => prev.map((c) => c.id === editingCopy.id ? { ...c, ...copyData } : c));
            } else {
              const newC: BookCopy = {
                ...copyData,
                id: `copy-${Date.now()}`,
                bookId: selectedBook?.id || '',
                addedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as BookCopy;
              setCopies((prev) => [newC, ...prev]);
            }
            setCopyModalOpen(false);
          }}
        />

        {/* Student / Member Form Modal */}
        <StudentFormModal
          visible={studentModalOpen}
          editingStudent={editingStudent}
          onClose={() => setStudentModalOpen(false)}
          onSave={(studentData) => {
            if (editingStudent) {
              setStudents((prev) => prev.map((s) => s.id === editingStudent.id ? { ...s, ...studentData } : s));
            } else {
              const newS: StudentProfile = {
                ...studentData,
                id: `std-${Date.now()}`,
              } as StudentProfile;
              setStudents((prev) => [newS, ...prev]);
            }
            setStudentModalOpen(false);
          }}
        />
        {/* Pay Fine Modal */}
        <PayFineModal
          visible={payFineModalOpen}
          fine={selectedFine}
          students={students}
          onClose={() => {
            setPayFineModalOpen(false);
            setSelectedFine(null);
          }}
          onPaymentSuccess={(updatedFine: Fine) => {
            setFines((prev) => prev.map((f) => f.id === updatedFine.id ? updatedFine : f));
            setPayFineModalOpen(false);
            setSelectedFine(null);
          }}
        />

        {/* Waive Fine Modal */}
        <WaiveFineModal
          visible={waiveFineModalOpen}
          fine={selectedFine}
          students={students}
          onClose={() => {
            setWaiveFineModalOpen(false);
            setSelectedFine(null);
          }}
          onWaiveSuccess={(waivedFine: Fine) => {
            setFines((prev) => prev.map((f) => f.id === waivedFine.id ? waivedFine : f));
            setWaiveFineModalOpen(false);
            setSelectedFine(null);
          }}
        />

        {/* Damage Fine Assessment Modal */}
        <DamageFineModal
          visible={damageFineModalOpen}
          students={students}
          copies={copies}
          books={books}
          defaultPenalty={settings.damagedBookPenalty || 25.0}
          onClose={() => setDamageFineModalOpen(false)}
          onSaveDamageFine={(newFine: Fine, updatedCopy?: BookCopy) => {
            setFines((prev) => [newFine, ...prev]);
            if (updatedCopy) {
              setCopies((prev) => prev.map((c) => (c.id === updatedCopy.id ? updatedCopy : c)));
            }
            setDamageFineModalOpen(false);
          }}
        />

        {/* Notifications Modal */}
        <Modal visible={notificationsModalOpen} animationType="slide" transparent onRequestClose={() => setNotificationsModalOpen(false)}>
          <View style={modalStyles.backdrop}>
            <View style={modalStyles.modalContainer}>
              <View style={modalStyles.header}>
                <Text style={modalStyles.headerTitle}>System Notifications</Text>
                <TouchableOpacity onPress={() => setNotificationsModalOpen(false)}>
                  <Feather name="x" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView style={{ padding: 16 }}>
                <View style={styles.notifCard}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#EF4444" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.notifTitle}>3 books are overdue for more than 7 days</Text>
                    <Text style={styles.notifTime}>10 minutes ago</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Upload PYQ Modal */}
        <UploadPYQModal
          visible={pyqModalOpen}
          userName={userName}
          onClose={() => setPyqModalOpen(false)}
          onSave={(newPaperData) => {
            const newPaperObj: QuestionPaper = {
              ...newPaperData,
              id: `qp-${Date.now()}`,
              downloadsCount: 0,
              uploadedAt: new Date().toISOString(),
              uploadedBy: userName,
            };
            setQuestionPapers((prev) => [newPaperObj, ...prev]);
            setPyqModalOpen(false);
            Alert.alert('Paper Uploaded', 'Past year question paper archive entry created successfully.');
          }}
        />

        {/* PDF Preview Modal */}
        <PDFPreviewModal
          visible={!!previewPyq}
          paper={previewPyq}
          onClose={() => setPreviewPyq(null)}
          onDownload={(paperId) => {
            setQuestionPapers((prev) =>
              prev.map((p) => (p.id === paperId ? { ...p, downloadsCount: p.downloadsCount + 1 } : p))
            );
          }}
        />
      </SafeAreaView>
    </View>
  );
}

// ============================================================================
// SUB-VIEW 1: REDESIGNED DASHBOARD VIEW (MATCHING THE ATTACHED IMAGE)
// ============================================================================

const LibrarianDashboardView = ({
  books,
  copies,
  loans,
  students,
  fines,
  onNavigate,
  onAddBook,
}: {
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  students: StudentProfile[];
  fines: Fine[];
  onNavigate: (tab: string) => void;
  onAddBook: () => void;
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView style={[dashStyles.container, isMobile && { padding: 12 }]} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 1. Header & Title Bar */}
      <View style={dashStyles.headerRow}>
        <View>
          <Text style={dashStyles.titleText}>Librarian Dashboard</Text>
          <Text style={dashStyles.subtitleText}>Manage books, members and library operations with ease.</Text>
        </View>
        <View style={dashStyles.dateBox}>
          <Feather name="calendar" size={16} color="#374151" />
          <View>
            <Text style={dashStyles.dateTitle}>Monday, 19 Sep 2026</Text>
            <Text style={dashStyles.dateSub}>Have a productive day!</Text>
          </View>
        </View>
      </View>

      {/* 2. Hero Banner */}
      <View style={[dashStyles.heroBanner, isMobile && { flexDirection: 'column', gap: 14, padding: 16 }]}>
        <View style={[dashStyles.heroLeft, isMobile && { width: '100%' }]}>
          <Text style={[dashStyles.heroTitle, isMobile && { fontSize: 20 }]}>Knowledge Empowers <Text style={{ color: '#EAB308' }}>Futures</Text></Text>
          <Text style={dashStyles.heroTagline}>Organize. Share. Inspire.</Text>
          <View style={dashStyles.quotePill}>
            <Text style={dashStyles.quoteText}>“A library is a universe of possibilities.”</Text>
          </View>
        </View>
        <View style={[dashStyles.heroRight, isMobile && { width: '100%', height: 130 }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600' }}
            style={dashStyles.heroImg}
          />
          <View style={dashStyles.badgeOverlay}>
            <Text style={dashStyles.badgeText}>Read. Learn. Grow.</Text>
          </View>
        </View>
      </View>

      {/* 3. Stat Cards Row */}
      <View style={dashStyles.statsGrid}>
        {/* Total Books */}
        <View style={[dashStyles.statCard, isMobile && { minWidth: '47%', padding: 12 }]}>
          <View style={dashStyles.statHeader}>
            <View style={[dashStyles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="bookshelf" size={18} color="#D97706" />
            </View>
            <Text style={dashStyles.statLabel} numberOfLines={1}>Total Books</Text>
          </View>
          <Text style={dashStyles.statVal}>12,460</Text>
          <Text style={dashStyles.statGrowthPositive}>▲ +2.5% <Text style={{ color: '#6B7280', fontWeight: '400' }}>from last month</Text></Text>
        </View>

        {/* Registered Members */}
        <View style={[dashStyles.statCard, isMobile && { minWidth: '47%', padding: 12 }]}>
          <View style={dashStyles.statHeader}>
            <View style={[dashStyles.statIconBg, { backgroundColor: '#F3F4F6' }]}>
              <MaterialCommunityIcons name="account-group" size={18} color="#374151" />
            </View>
            <Text style={dashStyles.statLabel} numberOfLines={1}>Reg. Members</Text>
          </View>
          <Text style={dashStyles.statVal}>1,238</Text>
          <Text style={dashStyles.statGrowthPositive}>▲ +4.1% <Text style={{ color: '#6B7280', fontWeight: '400' }}>from last month</Text></Text>
        </View>

        {/* Books Issued */}
        <View style={[dashStyles.statCard, isMobile && { minWidth: '47%', padding: 12 }]}>
          <View style={dashStyles.statHeader}>
            <View style={[dashStyles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color="#D97706" />
            </View>
            <Text style={dashStyles.statLabel} numberOfLines={1}>Books Issued</Text>
          </View>
          <Text style={dashStyles.statVal}>386</Text>
          <Text style={dashStyles.statGrowthPositive}>▲ +12% <Text style={{ color: '#6B7280', fontWeight: '400' }}>this month</Text></Text>
        </View>

        {/* Books Overdue */}
        <View style={[dashStyles.statCard, isMobile && { minWidth: '47%', padding: 12 }]}>
          <View style={dashStyles.statHeader}>
            <View style={[dashStyles.statIconBg, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="keyboard-return" size={18} color="#DC2626" />
            </View>
            <Text style={dashStyles.statLabel} numberOfLines={1}>Books Overdue</Text>
          </View>
          <Text style={dashStyles.statVal}>28</Text>
          <Text style={dashStyles.statGrowthNegative}>▲ +3 <Text style={{ color: '#DC2626', fontStyle: 'italic' }}>attention</Text></Text>
        </View>
      </View>

      {/* 4. Section 1: Book Circulation & Recent Activity */}
      <View style={dashStyles.middleSectionRow}>
        {/* Circulation Bar Chart */}
        <View style={dashStyles.cardBoxFlex}>
          <View style={dashStyles.cardBoxHeader}>
            <Text style={dashStyles.cardBoxTitle}>Book Circulation</Text>
            <View style={dashStyles.dropdownChip}>
              <Text style={dashStyles.dropdownText}>This Week</Text>
              <Feather name="chevron-down" size={14} color="#6B7280" />
            </View>
          </View>
          {/* Custom Dual Bar Chart */}
          <View style={dashStyles.chartContainer}>
            {[
              { day: 'Mon', issued: 40, returned: 20 },
              { day: 'Tue', issued: 75, returned: 52 },
              { day: 'Wed', issued: 52, returned: 30 },
              { day: 'Thu', issued: 62, returned: 33 },
              { day: 'Fri', issued: 64, returned: 40 },
              { day: 'Sat', issued: 82, returned: 48 },
              { day: 'Sun', issued: 60, returned: 34 },
            ].map((bar, i) => (
              <View key={i} style={dashStyles.chartCol}>
                <View style={dashStyles.barPair}>
                  <View style={[dashStyles.barIssued, { height: bar.issued * 1.3 }]} />
                  <View style={[dashStyles.barReturned, { height: bar.returned * 1.3 }]} />
                </View>
                <Text style={dashStyles.chartDayLabel}>{bar.day}</Text>
              </View>
            ))}
          </View>
          <View style={dashStyles.chartLegendRow}>
            <View style={dashStyles.legendItem}>
              <View style={[dashStyles.legendDot, { backgroundColor: '#EAB308' }]} />
              <Text style={dashStyles.legendText}>Issued</Text>
            </View>
            <View style={dashStyles.legendItem}>
              <View style={[dashStyles.legendDot, { backgroundColor: '#1F2937' }]} />
              <Text style={dashStyles.legendText}>Returned</Text>
            </View>
          </View>
        </View>

        {/* Recent Book Activity */}
        <View style={dashStyles.cardBoxFlex}>
          <View style={dashStyles.cardBoxHeader}>
            <Text style={dashStyles.cardBoxTitle}>Recent Book Activity</Text>
            <TouchableOpacity onPress={() => onNavigate('issue')}>
              <Text style={dashStyles.viewAllBtn}>View All ›</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ minWidth: isMobile ? 380 : '100%' }}>
              <View style={dashStyles.tableHeader}>
                <Text style={[dashStyles.thCell, { flex: 2.2 }]}>Book Title</Text>
                <Text style={[dashStyles.thCell, { flex: 1.5 }]}>Member</Text>
                <Text style={[dashStyles.thCell, { flex: 1 }]}>Action</Text>
                <Text style={[dashStyles.thCell, { flex: 1.1, textAlign: 'right' }]}>Date</Text>
              </View>
              {[
                { title: 'The Alchemist', member: 'Rahul Mehta', action: 'Issued', date: '19 Sep 2026', img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100' },
                { title: 'Atomic Habits', member: 'Sneha Nair', action: 'Returned', date: '19 Sep 2026', img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100' },
                { title: 'Clean Code', member: 'Aman Shah', action: 'Issued', date: '18 Sep 2026', img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100' },
                { title: 'The Psychology of Money', member: 'Fatima Ali', action: 'Returned', date: '18 Sep 2026', img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=100' },
                { title: 'Digital Minimalism', member: 'Vishnu R', action: 'Issued', date: '17 Sep 2026', img: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=100' },
              ].map((row, idx) => (
                <View key={idx} style={dashStyles.tableRow}>
                  <View style={{ flex: 2.2, flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 }}>
                    <Image source={{ uri: row.img }} style={dashStyles.bookThumb} />
                    <Text style={[dashStyles.bookName, { flex: 1 }]} numberOfLines={1}>{row.title}</Text>
                  </View>
                  <Text style={[dashStyles.tdText, { flex: 1.5, paddingRight: 4 }]} numberOfLines={1}>{row.member}</Text>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[dashStyles.actionPill, row.action === 'Issued' ? dashStyles.pillIssued : dashStyles.pillReturned]}>
                      <Text style={[dashStyles.pillText, row.action === 'Issued' ? dashStyles.pillTextIssued : dashStyles.pillTextReturned]}>
                        {row.action}
                      </Text>
                    </View>
                  </View>
                  <Text style={[dashStyles.tdText, { flex: 1.1, textAlign: 'right', fontSize: 11, color: '#6B7280' }]} numberOfLines={1}>{row.date}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* 5. Section 2: Top Borrowed Books & Books by Category */}
      <View style={dashStyles.middleSectionRow}>
        {/* Top Borrowed Books */}
        <View style={dashStyles.cardBoxFlex}>
          <View style={dashStyles.cardBoxHeader}>
            <Text style={dashStyles.cardBoxTitle}>Top Borrowed Books</Text>
            <View style={dashStyles.dropdownChip}>
              <Text style={dashStyles.dropdownText}>This Month</Text>
              <Feather name="chevron-down" size={14} color="#6B7280" />
            </View>
          </View>
          {[
            { rank: 1, title: 'Atomic Habits', author: 'James Clear', count: 42, img: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100' },
            { rank: 2, title: 'The Alchemist', author: 'Paulo Coelho', count: 38, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100' },
            { rank: 3, title: 'Clean Code', author: 'Robert C. Martin', count: 31, img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100' },
            { rank: 4, title: 'The Psychology of Money', author: 'Morgan Housel', count: 27, img: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=100' },
            { rank: 5, title: 'Deep Work', author: 'Cal Newport', count: 24, img: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=100' },
          ].map((item) => (
            <View key={item.rank} style={dashStyles.rankRow}>
              <View style={dashStyles.rankCircle}>
                <Text style={dashStyles.rankNum}>{item.rank}</Text>
              </View>
              <Image source={{ uri: item.img }} style={dashStyles.bookThumb} />
              <View style={{ flex: 1 }}>
                <Text style={dashStyles.bookName}>{item.title}</Text>
                <Text style={dashStyles.authorName}>{item.author}</Text>
              </View>
              <Text style={dashStyles.borrowCount}>{item.count}</Text>
            </View>
          ))}
        </View>

        {/* Books by Category */}
        <View style={dashStyles.cardBoxFlex}>
          <View style={dashStyles.cardBoxHeader}>
            <Text style={dashStyles.cardBoxTitle}>Books by Category</Text>
            <TouchableOpacity onPress={() => onNavigate('categories')}>
              <Text style={dashStyles.viewAllBtn}>View All ›</Text>
            </TouchableOpacity>
          </View>
          {/* Donut graphic visual */}
          <View style={dashStyles.donutWrap}>
            <View style={dashStyles.donutRing}>
              <Text style={dashStyles.donutVal}>12,460</Text>
              <Text style={dashStyles.donutSub}>Books</Text>
            </View>
          </View>
          {/* Category Breakdown Grid */}
          <View style={dashStyles.catLegendGrid}>
            <View style={dashStyles.catItem}>
              <View style={[dashStyles.legendDot, { backgroundColor: '#EAB308' }]} />
              <Text style={dashStyles.catName}>Fiction</Text>
              <Text style={dashStyles.catPct}>28%</Text>
            </View>
            <View style={dashStyles.catItem}>
              <View style={[dashStyles.legendDot, { backgroundColor: '#CA8A04' }]} />
              <Text style={dashStyles.catName}>Academic</Text>
              <Text style={dashStyles.catPct}>24%</Text>
            </View>
            <View style={dashStyles.catItem}>
              <View style={[dashStyles.legendDot, { backgroundColor: '#9CA3AF' }]} />
              <Text style={dashStyles.catName}>Reference</Text>
              <Text style={dashStyles.catPct}>18%</Text>
            </View>
            <View style={dashStyles.catItem}>
              <View style={[dashStyles.legendDot, { backgroundColor: '#FDE047' }]} />
              <Text style={dashStyles.catName}>Children</Text>
              <Text style={dashStyles.catPct}>14%</Text>
            </View>
            <View style={dashStyles.catItem}>
              <View style={[dashStyles.legendDot, { backgroundColor: '#374151' }]} />
              <Text style={dashStyles.catName}>Non-Fiction</Text>
              <Text style={dashStyles.catPct}>10%</Text>
            </View>
            <View style={dashStyles.catItem}>
              <View style={[dashStyles.legendDot, { backgroundColor: '#FEF08A' }]} />
              <Text style={dashStyles.catName}>Others</Text>
              <Text style={dashStyles.catPct}>6%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 6. Quick Actions Section */}
      <Text style={[dashStyles.cardBoxTitle, { marginTop: 10, marginBottom: 10 }]}>Quick Actions</Text>
      <View style={dashStyles.quickGrid}>
        <TouchableOpacity style={[dashStyles.qaBtn, dashStyles.qaGold]} onPress={onAddBook}>
          <MaterialCommunityIcons name="book-plus-outline" size={20} color="#121316" />
          <Text style={[dashStyles.qaText, { color: '#121316' }]}>Add New Book</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dashStyles.qaBtn} onPress={() => onNavigate('students')}>
          <MaterialCommunityIcons name="account-plus-outline" size={20} color="#374151" />
          <Text style={dashStyles.qaText}>Register Member</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dashStyles.qaBtn} onPress={() => onNavigate('issue')}>
          <MaterialCommunityIcons name="book-arrow-up-outline" size={20} color="#374151" />
          <Text style={dashStyles.qaText}>Issue Book</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[dashStyles.qaBtn, dashStyles.qaGold]} onPress={() => onNavigate('fines')}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color="#121316" />
          <Text style={[dashStyles.qaText, { color: '#121316' }]}>Collect Fine</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[dashStyles.qaBtn, dashStyles.qaGold]} onPress={() => onNavigate('issue')}>
          <MaterialCommunityIcons name="book-arrow-down-outline" size={20} color="#121316" />
          <Text style={[dashStyles.qaText, { color: '#121316' }]}>Return Book</Text>
        </TouchableOpacity>
        <TouchableOpacity style={dashStyles.qaBtn} onPress={() => onNavigate('reports')}>
          <MaterialCommunityIcons name="file-chart-outline" size={20} color="#374151" />
          <Text style={dashStyles.qaText}>Generate Report</Text>
        </TouchableOpacity>
      </View>

      {/* 7. Today's Reminders Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
        <Text style={dashStyles.cardBoxTitle}>Today's Reminders</Text>
        <TouchableOpacity>
          <Text style={dashStyles.viewAllBtn}>View All ›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ gap: 10 }}>
        <View style={dashStyles.reminderCard}>
          <View style={[dashStyles.dot, { backgroundColor: '#EF4444' }]} />
          <Text style={dashStyles.reminderText}>3 books are overdue for more than 7 days.</Text>
          <TouchableOpacity style={[dashStyles.remActionBtn, { backgroundColor: '#FEE2E2' }]} onPress={() => onNavigate('issue')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>Take Action</Text>
          </TouchableOpacity>
        </View>

        <View style={dashStyles.reminderCard}>
          <View style={[dashStyles.dot, { backgroundColor: '#EAB308' }]} />
          <Text style={dashStyles.reminderText}>Library inventory audit scheduled tomorrow.</Text>
          <TouchableOpacity style={[dashStyles.remActionBtn, { backgroundColor: '#FEF3C7' }]} onPress={() => onNavigate('books')}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#D97706' }}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 8. Footer */}
      <View style={dashStyles.footer}>
        <Text style={dashStyles.footerText}>© 2026 KIVQUO. All rights reserved.</Text>
        <Text style={dashStyles.footerText}>— Knowledge Today. A Brighter Tomorrow.</Text>
      </View>
    </ScrollView>
  );
};

const dashStyles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 },
  titleText: { fontSize: 24, fontWeight: '900', color: '#111827' },
  subtitleText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  dateTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  dateSub: { fontSize: 11, color: '#6B7280' },
  heroBanner: { flexDirection: 'row', backgroundColor: '#FFFBEB', borderRadius: 16, borderWidth: 1, borderColor: '#FEF3C7', padding: 20, marginBottom: 20, overflow: 'hidden' },
  heroLeft: { flex: 1, justifyContent: 'center', gap: 8 },
  heroTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  heroTagline: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  quotePill: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start', borderLeftWidth: 3, borderLeftColor: '#EAB308', marginTop: 4 },
  quoteText: { fontSize: 12, fontStyle: 'italic', color: '#374151' },
  heroRight: { width: 220, height: 120, position: 'relative', borderRadius: 12, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%', borderRadius: 12 },
  badgeOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(18, 19, 22, 0.4)', justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 20 },
  statCard: { flex: 1, minWidth: 200, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  statIconBg: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  statVal: { fontSize: 24, fontWeight: '900', color: '#111827', marginBottom: 4 },
  statGrowthPositive: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  statGrowthNegative: { fontSize: 12, fontWeight: '700', color: '#DC2626' },
  middleSectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  cardBoxFlex: { flex: 1, minWidth: 320, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
  cardBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardBoxTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  dropdownChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  dropdownText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  viewAllBtn: { fontSize: 12, fontWeight: '700', color: '#EAB308' },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  chartCol: { alignItems: 'center', gap: 6 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barIssued: { width: 8, backgroundColor: '#EAB308', borderRadius: 4 },
  barReturned: { width: 8, backgroundColor: '#1F2937', borderRadius: 4 },
  chartDayLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
  chartLegendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 6 },
  thCell: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  bookThumb: { width: 28, height: 38, borderRadius: 4, backgroundColor: '#E5E7EB' },
  bookName: { fontSize: 13, fontWeight: '700', color: '#111827' },
  tdText: { fontSize: 12, color: '#4B5563' },
  actionPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  pillIssued: { backgroundColor: '#D1FAE5' },
  pillReturned: { backgroundColor: '#DBEAFE' },
  pillText: { fontSize: 10, fontWeight: '800' },
  pillTextIssued: { color: '#059669' },
  pillTextReturned: { color: '#2563EB' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  rankCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: 12, fontWeight: '800', color: '#D97706' },
  authorName: { fontSize: 11, color: '#6B7280' },
  borrowCount: { fontSize: 14, fontWeight: '800', color: '#111827' },
  donutWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  donutRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 14, borderColor: '#EAB308', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  donutVal: { fontSize: 18, fontWeight: '900', color: '#111827' },
  donutSub: { fontSize: 11, color: '#6B7280' },
  catLegendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  catItem: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  catName: { flex: 1, fontSize: 12, color: '#4B5563' },
  catPct: { fontSize: 12, fontWeight: '700', color: '#111827' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  qaBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 8, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  qaGold: { backgroundColor: '#FEF08A', borderColor: '#FDE047' },
  qaText: { fontSize: 13, fontWeight: '700', color: '#374151', textAlign: 'center' },
  reminderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  reminderText: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
  remActionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexWrap: 'wrap', gap: 10 },
  footerText: { fontSize: 12, color: '#9CA3AF' },
});

// ============================================================================
// SUB-VIEW 2: BOOKS CATALOG VIEW
// ============================================================================

const BooksView = ({
  books,
  copies,
  categories,
  authors,
  onSelectBook,
  onAddBook,
  onDeleteBook,
}: {
  books: Book[];
  copies: BookCopy[];
  categories: Category[];
  authors: Author[];
  onSelectBook: (b: Book) => void;
  onAddBook: () => void;
  onDeleteBook: (bookId: string) => void;
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.isbn.toLowerCase().includes(search.toLowerCase()) ||
        (b.subject && b.subject.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCat === 'ALL' || b.categoryId === selectedCat;
      return matchSearch && matchCat;
    });
  }, [books, search, selectedCat]);

  return (
    <View style={styles.viewBodyContainer}>
      <View style={{ gap: 10, marginBottom: 12 }}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search catalog by title, ISBN, or subject..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity
            style={[styles.chip, selectedCat === 'ALL' && styles.chipActive]}
            onPress={() => setSelectedCat('ALL')}
          >
            <Text style={[styles.chipText, selectedCat === 'ALL' && styles.chipTextActive]}>All Categories ({books.length})</Text>
          </TouchableOpacity>
          {categories.map((c) => {
            const count = books.filter((b) => b.categoryId === c.id).length;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selectedCat === c.id && styles.chipActive]}
                onPress={() => setSelectedCat(c.id)}
              >
                <Text style={[styles.chipText, selectedCat === c.id && styles.chipTextActive]}>{c.name} ({count})</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
        renderItem={({ item }) => {
          const bookCopies = copies.filter((c) => c.bookId === item.id);
          const availCopies = bookCopies.filter((c) => c.status === 'AVAILABLE').length;
          const cat = categories.find((c) => c.id === item.categoryId);

          return (
            <TouchableOpacity style={bookStyles.card} onPress={() => onSelectBook(item)}>
              <Image
                source={{ uri: item.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400' }}
                style={bookStyles.cover}
              />
              <View style={bookStyles.info}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={bookStyles.title} numberOfLines={2}>{item.title}</Text>
                  <TouchableOpacity
                    style={{ padding: 4 }}
                    onPress={(e) => {
                      e.stopPropagation();
                      onDeleteBook(item.id);
                    }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                <Text style={bookStyles.isbn}>ISBN: {item.isbn} {cat ? `• ${cat.name}` : ''}</Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <View style={[styles.statusBadge, availCopies > 0 ? styles.badgeGreen : styles.badgeRed]}>
                    <Text style={[styles.badgeText, availCopies > 0 ? styles.badgeTextGreen : styles.badgeTextRed]}>
                      {availCopies} / {bookCopies.length} Available
                    </Text>
                  </View>

                  {item.bookType && (
                    <View style={[styles.chip, { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#F3F4F6' }]}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#4B5563' }}>{item.bookType}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={onAddBook}>
        <MaterialCommunityIcons name="plus" size={26} color="#121316" />
      </TouchableOpacity>
    </View>
  );
};

const bookStyles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 12 },
  cover: { width: 60, height: 90, borderRadius: 6, backgroundColor: '#E5E7EB' },
  info: { flex: 1, justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827', marginRight: 6 },
  isbn: { fontSize: 11, color: '#6B7280' },
});

// ============================================================================
// OTHER SUB-VIEWS (BOOK DETAIL, ISSUE, CATEGORIES, FINES, MEMBERS, REPORTS, SETTINGS, PROFILE)
// ============================================================================

const CategoriesView = ({ categories, books }: { categories: Category[]; books: Book[] }) => (
  <ScrollView style={styles.viewBody}>
    <Text style={styles.sectionHeader}>Book Categories ({categories.length})</Text>
    <View style={{ gap: 10 }}>
      {categories.map((c) => {
        const count = books.filter((b) => b.categoryId === c.id).length;
        return (
          <View key={c.id} style={styles.listItemCard}>
            <MaterialCommunityIcons name="tag-outline" size={24} color="#EAB308" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Text style={styles.cardSub}>{c.description || 'Category'}</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{count} Books</Text>
          </View>
        );
      })}
    </View>
  </ScrollView>
);

const BookDetailView = ({
  book,
  copies,
  authors,
  categories,
  onBack,
  onEditBook,
  onDeleteBook,
  onAddCopy,
  onEditCopy,
  onDeleteCopy,
}: any) => {
  const category = categories.find((c: any) => c.id === book.categoryId);
  const availCopies = copies.filter((c: any) => c.status === 'AVAILABLE').length;

  return (
    <ScrollView style={styles.viewBody} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Feather name="arrow-left" size={18} color="#111827" />
        <Text style={styles.backBtnText}>Back to Catalog</Text>
      </TouchableOpacity>

      {/* Book Detail Header Card */}
      <View style={detailStyles.headerCard}>
        <Image source={{ uri: book.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400' }} style={detailStyles.cover} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={detailStyles.title}>{book.title}</Text>
          <Text style={detailStyles.isbn}>ISBN: {book.isbn}</Text>
          {category && <Text style={{ fontSize: 12, color: '#EAB308', fontWeight: '700' }}>📁 {category.name}</Text>}
          {book.publisher && <Text style={{ fontSize: 12, color: '#4B5563' }}>Publisher: {book.publisher}</Text>}
          {book.edition && <Text style={{ fontSize: 11, color: '#6B7280' }}>Edition: {book.edition} ({book.publicationYear || 'N/A'})</Text>}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={detailStyles.btnEdit} onPress={onEditBook}>
              <MaterialCommunityIcons name="pencil-outline" size={14} color="#121316" />
              <Text style={detailStyles.btnEditText}>Edit Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity style={detailStyles.btnDelete} onPress={() => onDeleteBook(book.id)}>
              <MaterialCommunityIcons name="trash-can-outline" size={14} color="#DC2626" />
              <Text style={detailStyles.btnDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Description & Metadata */}
      {book.description ? (
        <View style={detailStyles.sectionCard}>
          <Text style={detailStyles.sectionTitle}>Synopsis / Description</Text>
          <Text style={{ fontSize: 13, color: '#374151', lineHeight: 18 }}>{book.description}</Text>
        </View>
      ) : null}

      {/* Physical Copies Section */}
      <View style={detailStyles.sectionCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={detailStyles.sectionTitle}>Physical Copies ({copies.length} Total • {availCopies} Available)</Text>
          <TouchableOpacity style={detailStyles.btnAddCopy} onPress={onAddCopy}>
            <Feather name="plus" size={14} color="#121316" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#121316' }}>Add Copy</Text>
          </TouchableOpacity>
        </View>

        {copies.length === 0 ? (
          <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>No physical copies cataloged for this item.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {copies.map((copy: BookCopy) => (
              <View key={copy.id} style={detailStyles.copyCard}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{copy.accessionNumber}</Text>
                    <View style={detailStyles.barcodeTag}>
                      <MaterialCommunityIcons name="barcode" size={14} color="#374151" />
                      <Text style={detailStyles.barcodeTagText}>{copy.barcode}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                    <View style={detailStyles.locationPill}>
                      <Feather name="map-pin" size={11} color="#D97706" />
                      <Text style={detailStyles.locationText}>{copy.rack} • {copy.shelf}</Text>
                    </View>

                    {copy.condition && (
                      <View style={[styles.chip, { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#F9FAFB' }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280' }}>Cond: {copy.condition}</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <View style={[styles.statusBadge, copy.status === 'AVAILABLE' ? styles.badgeGreen : styles.badgeRed]}>
                    <Text style={[styles.badgeText, copy.status === 'AVAILABLE' ? styles.badgeTextGreen : styles.badgeTextRed]}>
                      {copy.status}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={() => onEditCopy(copy)} style={{ padding: 4 }}>
                      <Feather name="edit-2" size={15} color="#374151" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Remove Inventory Copy',
                          `Are you sure you want to remove copy ${copy.accessionNumber} from inventory?`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => onDeleteCopy(copy.id) },
                          ]
                        );
                      }}
                      style={{ padding: 4 }}
                    >
                      <Feather name="trash-2" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const detailStyles = StyleSheet.create({
  headerCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 14, marginTop: 12 },
  cover: { width: 85, height: 125, borderRadius: 8, backgroundColor: '#E5E7EB' },
  title: { fontSize: 15, fontWeight: '800', color: '#111827' },
  isbn: { fontSize: 12, color: '#6B7280' },
  btnEdit: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF08A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  btnEditText: { fontSize: 11, fontWeight: '800', color: '#121316' },
  btnDelete: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  btnDeleteText: { fontSize: 11, fontWeight: '800', color: '#DC2626' },
  sectionCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', marginTop: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 6 },
  btnAddCopy: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF08A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  copyCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  barcodeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  barcodeTagText: { fontSize: 10, fontWeight: '700', color: '#374151' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  locationText: { fontSize: 11, fontWeight: '700', color: '#D97706' },
});

const IssueBookView = ({
  students,
  books,
  copies,
  loans,
  fines,
  settings,
  onIssueSuccess,
  onReturnSuccess,
  onRenewSuccess,
}: {
  students: StudentProfile[];
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  fines: Fine[];
  settings: LibrarySettings;
  onIssueSuccess: (newLoan: Loan, copyId: string) => void;
  onReturnSuccess: (loanId: string, copyId: string, newFine?: Fine) => void;
  onRenewSuccess: (loanId: string, newDueDate: string) => void;
}) => {
  const [activeSubMode, setActiveSubMode] = useState<'ISSUE' | 'RETURN'>('ISSUE');

  // Issue Mode State
  const [memberQuery, setMemberQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [bookQuery, setBookQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedCopy, setSelectedCopy] = useState<BookCopy | null>(null);
  const [customDays, setCustomDays] = useState(String(settings.loanPeriodDays || 14));
  const [submitting, setSubmitting] = useState(false);

  // Return Mode State
  const [loanSearch, setLoanSearch] = useState('');

  // Active Loans calculation
  const activeLoansList = useMemo(() => {
    return loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE');
  }, [loans]);

  const filteredActiveLoans = useMemo(() => {
    if (!loanSearch.trim()) return activeLoansList;
    return activeLoansList.filter((l) => {
      const std = students.find((s) => s.id === l.studentId);
      const bk = books.find((b) => b.id === l.bookId);
      const cpy = copies.find((c) => c.id === l.copyId);
      const q = loanSearch.toLowerCase();
      return (
        (std && (std.fullName.toLowerCase().includes(q) || std.admissionNo.toLowerCase().includes(q))) ||
        (bk && bk.title.toLowerCase().includes(q)) ||
        (cpy && (cpy.accessionNumber.toLowerCase().includes(q) || cpy.barcode.toLowerCase().includes(q)))
      );
    });
  }, [activeLoansList, loanSearch, students, books, copies]);

  // Filtered Member Options
  const filteredStudents = useMemo(() => {
    if (!memberQuery.trim()) return students.slice(0, 5);
    const q = memberQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.classSection.toLowerCase().includes(q)
    );
  }, [students, memberQuery]);

  // Filtered Book Options
  const filteredBooks = useMemo(() => {
    if (!bookQuery.trim()) return books.slice(0, 5);
    const q = bookQuery.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        (b.subject && b.subject.toLowerCase().includes(q))
    );
  }, [books, bookQuery]);

  // Copies for selected book
  const availableCopies = useMemo(() => {
    if (!selectedBook) return [];
    return copies.filter((c) => c.bookId === selectedBook.id && c.status === 'AVAILABLE');
  }, [selectedBook, copies]);

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

  // Calculate Due Date string
  const calculatedDueDate = useMemo(() => {
    const days = parseInt(customDays, 10) || settings.loanPeriodDays || 14;
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  }, [customDays, settings]);

  const handleIssueBook = () => {
    if (!selectedStudent) {
      Alert.alert('Required Selection', 'Please select a registered library member.');
      return;
    }
    if (!selectedBook) {
      Alert.alert('Required Selection', 'Please select a book from the catalog.');
      return;
    }
    if (!selectedCopy) {
      Alert.alert('Required Selection', 'Please select an available physical copy.');
      return;
    }

    if (studentActiveLoansCount >= settings.borrowingLimit) {
      Alert.alert(
        'Borrowing Limit Reached',
        `Member ${selectedStudent.fullName} has already reached maximum limit of ${settings.borrowingLimit} active loans.`
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

      onIssueSuccess(newLoan, selectedCopy.id);

      setSelectedStudent(null);
      setSelectedBook(null);
      setSelectedCopy(null);
      setMemberQuery('');
      setBookQuery('');
    } catch {
      Alert.alert('Error', 'Failed to issue book.');
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
      const fineAmount = Math.min(overdueDays * (settings.finePerDay || 1.0), settings.maxFine || 100.0);

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
      `Mark book as returned? ${createdFine ? `\n\nNotice: An overdue fine of $${createdFine.amount.toFixed(2)} will be generated.` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Return',
          onPress: () => onReturnSuccess(loan.id, loan.copyId, createdFine),
        },
      ]
    );
  };

  const handleRenewLoan = (loan: Loan) => {
    const currentRenewals = loan.renewalCount || 0;
    if (currentRenewals >= (settings.renewalLimit || 2)) {
      Alert.alert('Renewal Limit Reached', `This loan has reached maximum limit of ${settings.renewalLimit} renewals.`);
      return;
    }

    const currentDue = new Date(loan.dueDate);
    currentDue.setDate(currentDue.getDate() + (settings.loanPeriodDays || 14));
    const newDueDateStr = currentDue.toISOString().split('T')[0];

    Alert.alert(
      'Confirm Renewal',
      `Extend loan due date to ${newDueDateStr}? (Renewal ${currentRenewals + 1} of ${settings.renewalLimit})`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Renew Loan', onPress: () => onRenewSuccess(loan.id, newDueDateStr) },
      ]
    );
  };

  return (
    <ScrollView style={styles.viewBody} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionHeader}>Circulation & Loan Operations</Text>

      {/* Mode Switcher Tabs */}
      <View style={circStyles.tabRow}>
        <TouchableOpacity
          style={[circStyles.tabBtn, activeSubMode === 'ISSUE' && circStyles.tabBtnActive]}
          onPress={() => setActiveSubMode('ISSUE')}
        >
          <MaterialCommunityIcons name="book-arrow-up-outline" size={18} color={activeSubMode === 'ISSUE' ? '#121316' : '#6B7280'} />
          <Text style={[circStyles.tabText, activeSubMode === 'ISSUE' && circStyles.tabTextActive]} numberOfLines={1}>
            Issue Book (Outward Loan)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[circStyles.tabBtn, activeSubMode === 'RETURN' && circStyles.tabBtnActive]}
          onPress={() => setActiveSubMode('RETURN')}
        >
          <MaterialCommunityIcons name="book-arrow-down-outline" size={18} color={activeSubMode === 'RETURN' ? '#121316' : '#6B7280'} />
          <Text style={[circStyles.tabText, activeSubMode === 'RETURN' && circStyles.tabTextActive]} numberOfLines={1}>
            Active Loans & Returns ({activeLoansList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ISSUE BOOK MODE */}
      {activeSubMode === 'ISSUE' && (
        <View style={{ gap: 16, marginTop: 12 }}>
          {/* STEP 1: MEMBER SELECTION */}
          <View style={circStyles.cardBox}>
            <Text style={circStyles.cardTitle}>1. Select Library Member</Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search student by name, admission no, or class..."
                value={memberQuery}
                onChangeText={setMemberQuery}
              />
            </View>

            {selectedStudent ? (
              <View style={circStyles.selectedMemberCard}>
                <View style={{ flex: 1 }}>
                  <Text style={circStyles.memberTitle}>{selectedStudent.fullName}</Text>
                  <Text style={circStyles.memberSub}>{selectedStudent.admissionNo} • {selectedStudent.classSection}</Text>
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: studentActiveLoansCount >= settings.borrowingLimit ? '#DC2626' : '#059669' }}>
                      Active Borrowed: {studentActiveLoansCount} / {settings.borrowingLimit} Max
                    </Text>
                    {studentUnpaidFines > 0 && (
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#DC2626' }}>
                        ⚠️ Unpaid Fine: ${studentUnpaidFines.toFixed(2)}
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedStudent(null)} style={{ padding: 4 }}>
                  <Feather name="x-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 6, marginTop: 8 }}>
                {filteredStudents.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={circStyles.optionRow}
                    onPress={() => setSelectedStudent(s)}
                  >
                    <MaterialCommunityIcons name="account-outline" size={20} color="#EAB308" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{s.fullName}</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280' }}>{s.admissionNo} • {s.classSection}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* STEP 2: BOOK & PHYSICAL COPY SELECTION */}
          <View style={circStyles.cardBox}>
            <Text style={circStyles.cardTitle}>2. Select Book & Physical Copy</Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search catalog by title, ISBN, or subject..."
                value={bookQuery}
                onChangeText={setBookQuery}
              />
            </View>

            {selectedBook ? (
              <View style={{ gap: 10, marginTop: 10 }}>
                <View style={circStyles.selectedMemberCard}>
                  <Image source={{ uri: selectedBook.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200' }} style={circStyles.bookThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={circStyles.memberTitle}>{selectedBook.title}</Text>
                    <Text style={circStyles.memberSub}>ISBN: {selectedBook.isbn} • {selectedBook.language}</Text>
                    <Text style={{ fontSize: 11, color: '#EAB308', fontWeight: '700', marginTop: 2 }}>
                      {availableCopies.length} Available Physical Copies
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { setSelectedBook(null); setSelectedCopy(null); }} style={{ padding: 4 }}>
                    <Feather name="x-circle" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                {/* Copy Selection */}
                <Text style={styles.formLabel}>Select Physical Copy Tag:</Text>
                {availableCopies.length === 0 ? (
                  <Text style={{ fontSize: 12, color: '#DC2626', fontStyle: 'italic' }}>No physical copy currently available for loan.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {availableCopies.map((c) => {
                      const isSelected = selectedCopy?.id === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          style={[circStyles.copyChip, isSelected && circStyles.copyChipActive]}
                          onPress={() => setSelectedCopy(c)}
                        >
                          <Text style={[circStyles.copyChipAcc, isSelected && circStyles.copyChipAccActive]}>{c.accessionNumber}</Text>
                          <Text style={[circStyles.copyChipLoc, isSelected && circStyles.copyChipLocActive]}>{c.rack}, {c.shelf}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            ) : (
              <View style={{ gap: 6, marginTop: 8 }}>
                {filteredBooks.map((b) => {
                  const availCount = copies.filter((c) => c.bookId === b.id && c.status === 'AVAILABLE').length;
                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={circStyles.optionRow}
                      onPress={() => { setSelectedBook(b); setSelectedCopy(null); }}
                    >
                      <Image source={{ uri: b.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100' }} style={circStyles.bookThumb} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>{b.title}</Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>ISBN: {b.isbn} • {availCount} Available</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* STEP 3: LOAN TERMS & CONFIRMATION */}
          <View style={circStyles.cardBox}>
            <Text style={circStyles.cardTitle}>3. Loan Terms & Schedule</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Loan Duration (Days)</Text>
                <TextInput
                  style={styles.formInput}
                  value={customDays}
                  onChangeText={setCustomDays}
                  keyboardType="numeric"
                  placeholder="14"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Calculated Due Date</Text>
                <View style={[styles.formInput, { backgroundColor: '#F3F4F6', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{calculatedDueDate}</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryBtn} onPress={handleIssueBook} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>Issue Book Now</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* RETURN & RENEWAL MODE */}
      {activeSubMode === 'RETURN' && (
        <View style={{ gap: 12, marginTop: 12 }}>
          <View style={styles.searchBox}>
            <Feather name="search" size={16} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search active loan by student name, book title, or barcode..."
              value={loanSearch}
              onChangeText={setLoanSearch}
            />
          </View>

          {filteredActiveLoans.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6' }}>
              <MaterialCommunityIcons name="book-check-outline" size={32} color="#9CA3AF" />
              <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 6, fontWeight: '600' }}>No active loans match your search criteria.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {filteredActiveLoans.map((loan) => {
                const std = students.find((s) => s.id === loan.studentId);
                const bk = books.find((b) => b.id === loan.bookId);
                const cpy = copies.find((c) => c.id === loan.copyId);

                const dueDateObj = new Date(loan.dueDate);
                const todayObj = new Date();
                const diffTime = todayObj.getTime() - dueDateObj.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays > 0;
                const overdueChargeDays = Math.max(0, diffDays - (settings.gracePeriodDays || 2));
                const estFine = Math.min(overdueChargeDays * (settings.finePerDay || 1.0), settings.maxFine || 100.0);

                return (
                  <View key={loan.id} style={circStyles.loanCard}>
                    <View style={{ flexDirection: 'row', gap: 10, flex: 1 }}>
                      <Image source={{ uri: bk?.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=100' }} style={circStyles.bookThumb} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: '#111827' }} numberOfLines={1}>
                          {bk?.title || 'Unknown Title'}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#4B5563', fontWeight: '600' }}>
                          Member: {std?.fullName} ({std?.admissionNo})
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>
                          Accession: {cpy?.accessionNumber || loan.copyId} • Barcode: {cpy?.barcode || 'N/A'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6B7280' }}>
                          Issued: {loan.issueDate} • <Text style={{ fontWeight: '800', color: isOverdue ? '#DC2626' : '#111827' }}>Due: {loan.dueDate}</Text>
                        </Text>

                        {isOverdue && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <View style={circStyles.overdueBadge}>
                              <Text style={circStyles.overdueBadgeText}>⚠️ Overdue by {diffDays} days</Text>
                            </View>
                            {estFine > 0 && (
                              <Text style={{ fontSize: 11, fontWeight: '800', color: '#DC2626' }}>
                                Est. Fine: ${estFine.toFixed(2)}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Return / Renew Action Buttons */}
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 }}>
                      <TouchableOpacity style={circStyles.btnRenew} onPress={() => handleRenewLoan(loan)}>
                        <Feather name="refresh-cw" size={13} color="#121316" />
                        <Text style={circStyles.btnRenewText}>Renew Loan ({loan.renewalCount || 0}/{settings.renewalLimit || 2})</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={circStyles.btnReturn} onPress={() => handleReturnBook(loan)}>
                        <MaterialCommunityIcons name="keyboard-return" size={15} color="#121316" />
                        <Text style={circStyles.btnReturnText}>Return Book</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const circStyles = StyleSheet.create({
  tabRow: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 12, padding: 4, gap: 4, marginTop: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  tabBtn: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#FEF08A' },
  tabText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  tabTextActive: { color: '#121316', fontWeight: '800' },
  cardBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F3F4F6', gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 2 },
  selectedMemberCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFDF7', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FEF08A' },
  memberTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  memberSub: { fontSize: 11, color: '#6B7280' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#F3F4F6' },
  bookThumb: { width: 30, height: 42, borderRadius: 4, backgroundColor: '#E5E7EB' },
  copyChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  copyChipActive: { backgroundColor: '#FEF08A', borderColor: '#FDE047' },
  copyChipAcc: { fontSize: 12, fontWeight: '800', color: '#374151' },
  copyChipAccActive: { color: '#121316' },
  copyChipLoc: { fontSize: 10, color: '#6B7280' },
  copyChipLocActive: { color: '#4B5563' },
  loanCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 4 },
  overdueBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  overdueBadgeText: { fontSize: 10, fontWeight: '800', color: '#DC2626' },
  btnRenew: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingVertical: 8, borderRadius: 8 },
  btnRenewText: { fontSize: 12, fontWeight: '700', color: '#374151' },
  btnReturn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF08A', paddingVertical: 8, borderRadius: 8 },
  btnReturnText: { fontSize: 12, fontWeight: '800', color: '#121316' },
});

const FinesView = ({
  fines,
  students,
  copies,
  books,
  onPayFine,
  onWaiveFine,
  onAssessDamage,
}: {
  fines: Fine[];
  students: StudentProfile[];
  copies: BookCopy[];
  books: Book[];
  onPayFine: (fine: Fine) => void;
  onWaiveFine: (fine: Fine) => void;
  onAssessDamage: () => void;
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'WAIVED'>('ALL');

  // Calculated KPIs
  const unpaidTotal = useMemo(
    () => fines.filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID').reduce((sum, f) => sum + (f.amount - f.paidAmount), 0),
    [fines]
  );
  const collectedTotal = useMemo(
    () => fines.reduce((sum, f) => sum + (f.paidAmount || 0), 0),
    [fines]
  );
  const waivedTotal = useMemo(
    () => fines.filter((f) => f.status === 'WAIVED').reduce((sum, f) => sum + f.amount, 0),
    [fines]
  );

  const filteredFines = useMemo(() => {
    return fines.filter((f) => {
      if (statusFilter === 'UNPAID' && f.status !== 'UNPAID' && f.status !== 'PARTIALLY_PAID') return false;
      if (statusFilter === 'PAID' && f.status !== 'PAID') return false;
      if (statusFilter === 'WAIVED' && f.status !== 'WAIVED') return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const std = students.find((s) => s.id === f.studentId);
      const studentName = std ? std.fullName.toLowerCase() : '';
      const admissionNo = std ? std.admissionNo.toLowerCase() : '';
      return (
        f.id.toLowerCase().includes(q) ||
        f.fineType.toLowerCase().includes(q) ||
        (f.damageType && f.damageType.toLowerCase().includes(q)) ||
        studentName.includes(q) ||
        admissionNo.includes(q)
      );
    });
  }, [fines, students, search, statusFilter]);

  return (
    <View style={styles.viewBodyContainer}>
      {/* Header & KPI Summary Cards */}
      <View style={{ gap: 12, marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={styles.sectionHeader}>Fine Management & Receipts</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: -8 }}>
              Track overdue fines, damage penalties, waivers & receipts
            </Text>
          </View>
          <TouchableOpacity style={fineStyles.damageBtnHeader} onPress={onAssessDamage}>
            <MaterialCommunityIcons name="book-alert-outline" size={15} color="#FFFFFF" />
            <Text style={fineStyles.damageBtnHeaderText}>Record Book Damage Fine</Text>
          </TouchableOpacity>
        </View>

        <View style={fineStyles.kpiGrid}>
          <View style={[fineStyles.kpiCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[fineStyles.kpiLabel, { color: '#991B1B' }]}>Unpaid Balance</Text>
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
            </View>
            <Text style={[fineStyles.kpiValue, { color: '#DC2626' }]}>${unpaidTotal.toFixed(2)}</Text>
            <Text style={fineStyles.kpiSub}>Pending member fines</Text>
          </View>

          <View style={[fineStyles.kpiCard, { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[fineStyles.kpiLabel, { color: '#065F46' }]}>Collected Total</Text>
              <MaterialCommunityIcons name="cash-check" size={18} color="#059669" />
            </View>
            <Text style={[fineStyles.kpiValue, { color: '#059669' }]}>${collectedTotal.toFixed(2)}</Text>
            <Text style={fineStyles.kpiSub}>Paid fine revenue</Text>
          </View>

          <View style={[fineStyles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={[fineStyles.kpiLabel, { color: '#1E40AF' }]}>Waived Fines</Text>
              <MaterialCommunityIcons name="hand-heart-outline" size={18} color="#2563EB" />
            </View>
            <Text style={[fineStyles.kpiValue, { color: '#2563EB' }]}>${waivedTotal.toFixed(2)}</Text>
            <Text style={fineStyles.kpiSub}>Approved exemptions</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fine record by student name, fine ID, damage type..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {(['ALL', 'UNPAID', 'PAID', 'WAIVED'] as const).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.chip, statusFilter === st && styles.chipActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.chipText, statusFilter === st && styles.chipTextActive]}>
                {st === 'ALL' ? `All Fines (${fines.length})` : st}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Fine List */}
      <FlatList
        data={filteredFines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
        renderItem={({ item }) => {
          const std = students.find((s) => s.id === item.studentId);
          const cpy = copies.find((c) => c.id === item.bookCopyId);
          const bk = cpy ? books.find((b) => b.id === cpy.bookId) : null;
          const remaining = Math.max(0, item.amount - item.paidAmount);
          const isPending = item.status === 'UNPAID' || item.status === 'PARTIALLY_PAID';

          return (
            <View style={fineStyles.fineCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={fineStyles.fineIdText}>#{item.id}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'PAID'
                          ? styles.badgeGreen
                          : item.status === 'WAIVED'
                          ? { backgroundColor: '#E0F2FE' }
                          : item.status === 'PARTIALLY_PAID'
                          ? { backgroundColor: '#FEF3C7' }
                          : styles.badgeRed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.status === 'PAID'
                            ? styles.badgeTextGreen
                            : item.status === 'WAIVED'
                            ? { color: '#0284C7' }
                            : item.status === 'PARTIALLY_PAID'
                            ? { color: '#D97706' }
                            : styles.badgeTextRed,
                        ]}
                      >
                        {item.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>
                  <Text style={fineStyles.studentName}>{std?.fullName || 'Unknown Student'}</Text>
                  <Text style={fineStyles.studentSub}>{std?.admissionNo || 'No ID'} • {std?.classSection || 'N/A'}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={fineStyles.fineAmount}>${item.amount.toFixed(2)}</Text>
                  {item.paidAmount > 0 && item.status !== 'PAID' && (
                    <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>Paid: ${item.paidAmount.toFixed(2)}</Text>
                  )}
                  {isPending && (
                    <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '800', marginTop: 2 }}>
                      Bal: ${remaining.toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Specific Damage Details Card if Damaged Book */}
              {item.fineType === 'DAMAGED_BOOK' && (
                <View style={fineStyles.damageDetailBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="book-alert-outline" size={16} color="#DC2626" />
                    <Text style={fineStyles.damageTypeTitle}>
                      Damage: {item.damageType ? item.damageType.replace('_', ' ') : 'General Damage'}
                    </Text>
                  </View>
                  {item.damageNotes ? (
                    <Text style={fineStyles.damageNotesText}>“{item.damageNotes}”</Text>
                  ) : null}
                  {cpy && (
                    <Text style={fineStyles.damageCopyMeta}>
                      Item Tag: {cpy.accessionNumber} ({cpy.barcode}) {bk ? `• ${bk.title}` : ''}
                    </Text>
                  )}
                </View>
              )}

              <View style={fineStyles.metaRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="tag-outline" size={14} color="#6B7280" />
                  <Text style={fineStyles.metaText}>Type: {item.fineType.replace('_', ' ')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Feather name="calendar" size={13} color="#6B7280" />
                  <Text style={fineStyles.metaText}>Created: {item.createdAt}</Text>
                </View>
                {item.paymentTransactions && item.paymentTransactions.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialCommunityIcons name="receipt" size={13} color="#059669" />
                    <Text style={[fineStyles.metaText, { color: '#059669', fontWeight: '700' }]}>
                      {item.paymentTransactions.length} Txn(s) Recorded
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Buttons for Pending Fines */}
              {isPending && (
                <View style={fineStyles.actionRow}>
                  <TouchableOpacity style={fineStyles.payBtn} onPress={() => onPayFine(item)}>
                    <MaterialCommunityIcons name="cash-register" size={15} color="#121316" />
                    <Text style={fineStyles.payBtnText}>Pay Fine (${remaining.toFixed(2)})</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={fineStyles.waiveBtn} onPress={() => onWaiveFine(item)}>
                    <MaterialCommunityIcons name="hand-heart" size={15} color="#2563EB" />
                    <Text style={fineStyles.waiveBtnText}>Waive Fine</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
};

const LibraryStudentsView = ({
  students,
  loans,
  copies,
  books,
  fines,
  reservations,
  onAddStudent,
  onEditStudent,
  onDeleteStudent,
}: {
  students: StudentProfile[];
  loans: Loan[];
  copies: BookCopy[];
  books: Book[];
  fines: Fine[];
  reservations: Reservation[];
  onAddStudent: () => void;
  onEditStudent: (s: StudentProfile) => void;
  onDeleteStudent: (id: string) => void;
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.classSection.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q))
    );
  }, [students, search]);

  return (
    <View style={styles.viewBodyContainer}>
      {/* Header & Search Bar */}
      <View style={{ gap: 10, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 180 }}>
            <Text style={styles.sectionHeader}>Members Directory ({students.length})</Text>
            <Text style={{ fontSize: 11, color: '#6B7280', marginTop: -8 }}>
              Manage registered student profiles, borrowing history & fines
            </Text>
          </View>
          <TouchableOpacity style={memStyles.addBtnHeader} onPress={onAddStudent}>
            <Feather name="user-plus" size={14} color="#121316" />
            <Text style={memStyles.addBtnHeaderText}>Register Member</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members by name, admission no, or class..."
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
        renderItem={({ item }) => {
          const activeLoans = loans.filter((l) => l.studentId === item.id && (l.status === 'ACTIVE' || l.status === 'OVERDUE'));
          const unpaidFines = fines.filter((f) => f.studentId === item.id && f.status === 'UNPAID');
          const unpaidTotal = unpaidFines.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0);

          return (
            <View style={memStyles.card}>
              <View style={memStyles.avatarCircle}>
                <Text style={memStyles.avatarLetter}>{item.fullName.charAt(0).toUpperCase()}</Text>
              </View>

              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={memStyles.name}>{item.fullName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity onPress={() => onEditStudent(item)} style={{ padding: 4 }}>
                      <Feather name="edit-2" size={15} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onDeleteStudent(item.id)} style={{ padding: 4 }}>
                      <Feather name="trash-2" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={memStyles.subText}>{item.admissionNo} • {item.classSection}</Text>
                {item.email ? <Text style={memStyles.contactText}>✉️ {item.email}</Text> : null}
                {item.phone ? <Text style={memStyles.contactText}>📞 {item.phone}</Text> : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <View style={[styles.statusBadge, activeLoans.length > 0 ? styles.badgeGreen : { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.badgeText, activeLoans.length > 0 ? styles.badgeTextGreen : { color: '#6B7280' }]}>
                      {activeLoans.length} Active Loans
                    </Text>
                  </View>

                  {unpaidTotal > 0 && (
                    <View style={[styles.statusBadge, styles.badgeRed]}>
                      <Text style={[styles.badgeText, styles.badgeTextRed]}>
                        Fine: ${unpaidTotal.toFixed(2)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={onAddStudent}>
        <Feather name="user-plus" size={24} color="#121316" />
      </TouchableOpacity>
    </View>
  );
};

const memStyles = StyleSheet.create({
  addBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF08A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addBtnHeaderText: { fontSize: 12, fontWeight: '800', color: '#121316' },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 18, fontWeight: '900', color: '#D97706' },
  name: { fontSize: 14, fontWeight: '800', color: '#111827' },
  subText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  contactText: { fontSize: 11, color: '#6B7280' },
});


const SettingsView = ({
  settings,
  onSaveSettings,
}: {
  settings: LibrarySettings;
  onSaveSettings: (newSettings: LibrarySettings) => void;
}) => {
  const [borrowingLimit, setBorrowingLimit] = useState(String(settings.borrowingLimit || 3));
  const [loanPeriodDays, setLoanPeriodDays] = useState(String(settings.loanPeriodDays || 14));
  const [gracePeriodDays, setGracePeriodDays] = useState(String(settings.gracePeriodDays || 2));
  const [finePerDay, setFinePerDay] = useState(String(settings.finePerDay || 1.0));
  const [maxFine, setMaxFine] = useState(String(settings.maxFine || 100.0));
  const [renewalLimit, setRenewalLimit] = useState(String(settings.renewalLimit || 2));
  const [lostBookPenalty, setLostBookPenalty] = useState(String(settings.lostBookPenalty || 50.0));
  const [damagedBookPenalty, setDamagedBookPenalty] = useState(String(settings.damagedBookPenalty || 25.0));
  const [reservationExpiryDays, setReservationExpiryDays] = useState(String(settings.reservationExpiryDays || 7));
  const [unpaidFineLockThreshold, setUnpaidFineLockThreshold] = useState(String(settings.unpaidFineLockThreshold || 20.0));

  const [allowReservation, setAllowReservation] = useState(settings.allowReservation ?? true);
  const [openOnWeekends, setOpenOnWeekends] = useState(settings.openOnWeekends ?? true);
  const [openingHours, setOpeningHours] = useState(settings.openingHours || '08:00 AM');
  const [closingHours, setClosingHours] = useState(settings.closingHours || '06:00 PM');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBorrowingLimit(String(settings.borrowingLimit || 3));
    setLoanPeriodDays(String(settings.loanPeriodDays || 14));
    setGracePeriodDays(String(settings.gracePeriodDays || 2));
    setFinePerDay(String(settings.finePerDay || 1.0));
    setMaxFine(String(settings.maxFine || 100.0));
    setRenewalLimit(String(settings.renewalLimit || 2));
    setLostBookPenalty(String(settings.lostBookPenalty || 50.0));
    setDamagedBookPenalty(String(settings.damagedBookPenalty || 25.0));
    setReservationExpiryDays(String(settings.reservationExpiryDays || 7));
    setUnpaidFineLockThreshold(String(settings.unpaidFineLockThreshold || 20.0));
    setAllowReservation(settings.allowReservation ?? true);
    setOpenOnWeekends(settings.openOnWeekends ?? true);
    setOpeningHours(settings.openingHours || '08:00 AM');
    setClosingHours(settings.closingHours || '06:00 PM');
  }, [settings]);

  const handleSave = async () => {
    const bLimit = parseInt(borrowingLimit, 10);
    const lPeriod = parseInt(loanPeriodDays, 10);
    const gPeriod = parseInt(gracePeriodDays, 10);
    const fRate = parseFloat(finePerDay);
    const mFine = parseFloat(maxFine);
    const rLimit = parseInt(renewalLimit, 10);
    const lostPen = parseFloat(lostBookPenalty);
    const dmgPen = parseFloat(damagedBookPenalty);

    if (isNaN(bLimit) || bLimit <= 0) {
      Alert.alert('Invalid Input', 'Borrowing limit must be a positive integer.');
      return;
    }
    if (isNaN(lPeriod) || lPeriod <= 0) {
      Alert.alert('Invalid Input', 'Loan period days must be a positive integer.');
      return;
    }
    if (isNaN(fRate) || fRate < 0) {
      Alert.alert('Invalid Input', 'Fine per day rate must be 0 or greater.');
      return;
    }

    setSaving(true);

    const updated: LibrarySettings = {
      ...settings,
      borrowingLimit: bLimit,
      loanPeriodDays: lPeriod,
      gracePeriodDays: isNaN(gPeriod) ? 0 : gPeriod,
      finePerDay: fRate,
      maxFine: isNaN(mFine) ? 100 : mFine,
      renewalLimit: isNaN(rLimit) ? 2 : rLimit,
      allowReservation,
      lostBookPenalty: isNaN(lostPen) ? 50 : lostPen,
      damagedBookPenalty: isNaN(dmgPen) ? 25 : dmgPen,
      reservationExpiryDays: parseInt(reservationExpiryDays, 10) || 7,
      unpaidFineLockThreshold: parseFloat(unpaidFineLockThreshold) || 20.0,
      openingHours,
      closingHours,
      openOnWeekends,
    };

    try {
      await apiClient('/library/settings', {
        method: 'POST',
        body: JSON.stringify(updated),
      });
    } catch {
      // Silent catch for offline fallback
    }

    setSaving(false);
    onSaveSettings(updated);
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to restore default library operational settings?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Defaults',
          style: 'destructive',
          onPress: () => {
            const defaults: LibrarySettings = {
              id: settings.id || 'set-1',
              borrowingLimit: 3,
              loanPeriodDays: 14,
              gracePeriodDays: 2,
              finePerDay: 1.0,
              maxFine: 100.0,
              renewalLimit: 2,
              allowReservation: true,
              lostBookPenalty: 50.0,
              damagedBookPenalty: 25.0,
              reservationExpiryDays: 7,
              unpaidFineLockThreshold: 20.0,
              openingHours: '08:00 AM',
              closingHours: '06:00 PM',
              openOnWeekends: true,
            };
            onSaveSettings(defaults);
            Alert.alert('Settings Reset', 'Restored default system settings.');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.viewBody} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={{ marginBottom: 16 }}>
        <Text style={styles.sectionHeader}>Library System Settings</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>
          Configure borrowing limits, loan rules, fine rates, and operational parameters.
        </Text>
      </View>

      {/* SECTION 1: Circulation & Borrowing Rules */}
      <View style={settStyles.cardBox}>
        <View style={settStyles.cardHeader}>
          <MaterialCommunityIcons name="book-clock-outline" size={20} color="#EAB308" />
          <Text style={settStyles.cardTitle}>Circulation & Loan Rules</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Borrowing Limit / Member</Text>
            <TextInput
              style={styles.formInput}
              value={borrowingLimit}
              onChangeText={setBorrowingLimit}
              keyboardType="numeric"
              placeholder="3"
            />
            <Text style={settStyles.helpText}>Max books out concurrently</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Loan Duration (Days)</Text>
            <TextInput
              style={styles.formInput}
              value={loanPeriodDays}
              onChangeText={setLoanPeriodDays}
              keyboardType="numeric"
              placeholder="14"
            />
            <Text style={settStyles.helpText}>Standard checkout period</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Grace Period (Days)</Text>
            <TextInput
              style={styles.formInput}
              value={gracePeriodDays}
              onChangeText={setGracePeriodDays}
              keyboardType="numeric"
              placeholder="2"
            />
            <Text style={settStyles.helpText}>Days before fine starts</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Renewal Limit</Text>
            <TextInput
              style={styles.formInput}
              value={renewalLimit}
              onChangeText={setRenewalLimit}
              keyboardType="numeric"
              placeholder="2"
            />
            <Text style={settStyles.helpText}>Max extensions allowed</Text>
          </View>
        </View>
      </View>

      {/* SECTION 2: Fine & Penalty Configurations */}
      <View style={settStyles.cardBox}>
        <View style={settStyles.cardHeader}>
          <MaterialCommunityIcons name="cash-fast" size={20} color="#DC2626" />
          <Text style={settStyles.cardTitle}>Fine Rates & Financial Penalties</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Daily Overdue Rate ($/Day)</Text>
            <TextInput
              style={[styles.formInput, { fontWeight: '800', color: '#DC2626' }]}
              value={finePerDay}
              onChangeText={setFinePerDay}
              keyboardType="numeric"
              placeholder="1.00"
            />
            <Text style={settStyles.helpText}>Charged per overdue day</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Max Overdue Fine Cap ($)</Text>
            <TextInput
              style={styles.formInput}
              value={maxFine}
              onChangeText={setMaxFine}
              keyboardType="numeric"
              placeholder="100.00"
            />
            <Text style={settStyles.helpText}>Maximum fine ceiling</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Lost Book Default Fee ($)</Text>
            <TextInput
              style={styles.formInput}
              value={lostBookPenalty}
              onChangeText={setLostBookPenalty}
              keyboardType="numeric"
              placeholder="50.00"
            />
            <Text style={settStyles.helpText}>Replacement default charge</Text>
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Damaged Book Base Fee ($)</Text>
            <TextInput
              style={styles.formInput}
              value={damagedBookPenalty}
              onChangeText={setDamagedBookPenalty}
              keyboardType="numeric"
              placeholder="25.00"
            />
            <Text style={settStyles.helpText}>Base repair fee</Text>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Unpaid Fine Member Lock Threshold ($)</Text>
          <TextInput
            style={styles.formInput}
            value={unpaidFineLockThreshold}
            onChangeText={setUnpaidFineLockThreshold}
            keyboardType="numeric"
            placeholder="20.00"
          />
          <Text style={settStyles.helpText}>Member borrowing is suspended if unpaid balance exceeds this amount</Text>
        </View>
      </View>

      {/* SECTION 3: Reservation & Operating Controls */}
      <View style={settStyles.cardBox}>
        <View style={settStyles.cardHeader}>
          <MaterialCommunityIcons name="cog-outline" size={20} color="#2563EB" />
          <Text style={settStyles.cardTitle}>Reservation & Access Settings</Text>
        </View>

        <View style={settStyles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={settStyles.switchTitle}>Allow Online Book Reservation</Text>
            <Text style={settStyles.switchSub}>Permit students to hold/reserve available catalog items</Text>
          </View>
          <Switch
            value={allowReservation}
            onValueChange={setAllowReservation}
            trackColor={{ false: '#D1D5DB', true: '#FEF08A' }}
            thumbColor={allowReservation ? '#EAB308' : '#9CA3AF'}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Reservation Expiry (Days)</Text>
            <TextInput
              style={styles.formInput}
              value={reservationExpiryDays}
              onChangeText={setReservationExpiryDays}
              keyboardType="numeric"
              placeholder="7"
            />
          </View>

          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Weekend Operations</Text>
            <TouchableOpacity
              style={[styles.chip, openOnWeekends && styles.chipActive, { height: 38, justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => setOpenOnWeekends(!openOnWeekends)}
            >
              <Text style={[styles.chipText, openOnWeekends && styles.chipTextActive]}>
                {openOnWeekends ? 'Open Saturdays' : 'Closed Weekends'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Library Opening Hours</Text>
            <TextInput
              style={styles.formInput}
              value={openingHours}
              onChangeText={setOpeningHours}
              placeholder="08:00 AM"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.formLabel}>Library Closing Hours</Text>
            <TextInput
              style={styles.formInput}
              value={closingHours}
              onChangeText={setClosingHours}
              placeholder="06:00 PM"
            />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={{ gap: 10, marginTop: 16 }}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#121316" />
          ) : (
            <Text style={styles.primaryBtnText}>Save System Configuration</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={settStyles.resetBtn} onPress={handleResetDefaults}>
          <Feather name="rotate-ccw" size={14} color="#6B7280" />
          <Text style={settStyles.resetBtnText}>Restore System Defaults</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const settStyles = StyleSheet.create({
  cardBox: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 12, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  helpText: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  switchTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  switchSub: { fontSize: 11, color: '#6B7280' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F3F4F6', paddingVertical: 10, borderRadius: 10 },
  resetBtnText: { fontSize: 12, fontWeight: '700', color: '#4B5563' },
});

const ProfileView = ({ userName, onLogout }: any) => {
  const [profileLoading, setProfileLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Profile fields state
  const [name, setName] = useState(userName || 'Amina Rahman');
  const [email, setEmail] = useState('amina.rahman@kivquo.edu.org');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [employeeId, setEmployeeId] = useState('LIB-2024-8891');
  const [libraryBadgeId, setLibraryBadgeId] = useState('BADGE-LIB-001');
  const [designation, setDesignation] = useState('Head of Library Operations');
  const [qualification, setQualification] = useState('Master of Library & Info Science (MLIS)');
  const [officeLocation, setOfficeLocation] = useState('Central Library, Block B, Room 204');
  const [profilePicUrl, setProfilePicUrl] = useState('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400');

  // Fetch live profile from backend on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      setProfileLoading(true);
      try {
        const res = await apiClient('/users/me');
        if (res && isMounted) {
          if (res.name || res.fullName) setName(res.name || res.fullName);
          if (res.email) setEmail(res.email);
          if (res.phone) setPhone(res.phone);
          if (res.employeeId) setEmployeeId(res.employeeId);
          if (res.libraryBadgeId) setLibraryBadgeId(res.libraryBadgeId);
          if (res.designation) setDesignation(res.designation);
          if (res.qualification) setQualification(res.qualification);
          if (res.profilePicUrl) setProfilePicUrl(res.profilePicUrl);
        }
      } catch (err) {
        // Retain fallback profile state if offline/unreachable
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, []);

  const pickProfileImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required to select a profile photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfilePicUrl(result.assets[0].uri);
      }
    } catch (err: any) {
      Alert.alert('Image Selection Error', 'Could not select photo from media library.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      let finalPicUrl = profilePicUrl;
      if (profilePicUrl && (profilePicUrl.startsWith('file:') || profilePicUrl.startsWith('content:') || profilePicUrl.startsWith('ph:'))) {
        if (auth.currentUser) {
          try {
            finalPicUrl = await uploadProfilePictureApi(profilePicUrl);
            setProfilePicUrl(finalPicUrl);
          } catch {
            finalPicUrl = profilePicUrl;
          }
        } else {
          finalPicUrl = profilePicUrl;
        }
      }

      await apiClient('/users/complete-profile', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          employeeId,
          libraryBadgeId,
          designation,
          qualification,
          profilePicUrl: finalPicUrl,
        }),
      });

      setIsEditing(false);
      Alert.alert('Profile Updated', 'Your librarian profile details have been saved to the server.');
    } catch (err: any) {
      Alert.alert('Update Notice', err?.message || 'Profile saved locally.');
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.viewBody} showsVerticalScrollIndicator={false}>
      {profileLoading && (
        <View style={{ paddingVertical: 10, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#EAB308" />
        </View>
      )}

      {/* Profile Header Card with Profile Image */}
      <View style={profileStyles.card}>
        <View style={profileStyles.avatarContainer}>
          <Image
            source={{ uri: profilePicUrl }}
            style={profileStyles.avatar}
          />
          <View style={profileStyles.badge}>
            <MaterialCommunityIcons name="check-decagram" size={20} color="#EAB308" />
          </View>
        </View>

        <Text style={profileStyles.name}>{name}</Text>
        <Text style={profileStyles.title}>{designation}</Text>

        <View style={profileStyles.tagRow}>
          <View style={profileStyles.activeTag}>
            <View style={profileStyles.activeDot} />
            <Text style={profileStyles.activeTagText}>Active Staff</Text>
          </View>
          <View style={profileStyles.empTag}>
            <Text style={profileStyles.empTagText}>ID: {employeeId}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={profileStyles.editToggleBtn}
          onPress={() => setIsEditing(!isEditing)}
        >
          <MaterialCommunityIcons name={isEditing ? "close" : "pencil-outline"} size={16} color="#111827" />
          <Text style={profileStyles.editToggleText}>{isEditing ? "Cancel Editing" : "Edit Profile Info"}</Text>
        </TouchableOpacity>
      </View>

      {/* View Mode vs Edit Mode */}
      {isEditing ? (
        <View style={profileStyles.editCard}>
          <Text style={profileStyles.editCardTitle}>Edit Librarian Profile</Text>

          {/* Profile Picture Upload Box */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Profile Photo</Text>
            <TouchableOpacity style={profileStyles.photoUploadBtn} onPress={pickProfileImage}>
              <Image source={{ uri: profilePicUrl }} style={profileStyles.uploadThumb} />
              <View style={profileStyles.uploadTextWrap}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="camera-plus-outline" size={18} color="#EAB308" />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>Upload New Photo</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>Tap to select an image file from your device</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Phone Number</Text>
            <TextInput
              style={styles.formInput}
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +1 (555) 234-5678"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Employee ID</Text>
            <TextInput
              style={styles.formInput}
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="e.g. LIB-2024-8891"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Library Badge ID</Text>
            <TextInput
              style={styles.formInput}
              value={libraryBadgeId}
              onChangeText={setLibraryBadgeId}
              placeholder="e.g. BADGE-LIB-001"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Designation / Role Title</Text>
            <TextInput
              style={styles.formInput}
              value={designation}
              onChangeText={setDesignation}
              placeholder="Designation"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Qualifications</Text>
            <TextInput
              style={styles.formInput}
              value={qualification}
              onChangeText={setQualification}
              placeholder="Academic Qualification"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Office Location</Text>
            <TextInput
              style={styles.formInput}
              value={officeLocation}
              onChangeText={setOfficeLocation}
              placeholder="Office Location"
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>Save Profile Updates</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Details Grid Section */}
          <Text style={[styles.sectionHeader, { marginBottom: 12 }]}>Library Head Profile & Details</Text>

          <View style={profileStyles.infoSection}>
            {/* Contact Information */}
            <View style={profileStyles.infoCard}>
              <View style={profileStyles.infoCardHeader}>
                <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#EAB308" />
                <Text style={profileStyles.infoCardTitle}>Contact & Designation</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Official Email:</Text>
                <Text style={profileStyles.infoValue}>{email}</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Contact Phone:</Text>
                <Text style={profileStyles.infoValue}>{phone}</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Office Location:</Text>
                <Text style={profileStyles.infoValue}>{officeLocation}</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Library Badge ID:</Text>
                <Text style={profileStyles.infoValue}>{libraryBadgeId}</Text>
              </View>
            </View>

            {/* Qualifications */}
            <View style={profileStyles.infoCard}>
              <View style={profileStyles.infoCardHeader}>
                <MaterialCommunityIcons name="school-outline" size={20} color="#EAB308" />
                <Text style={profileStyles.infoCardTitle}>Qualifications & Credentials</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Degree / Credential:</Text>
                <Text style={profileStyles.infoValue}>{qualification}</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Specialization:</Text>
                <Text style={profileStyles.infoValue}>Digital Archiving & Academic Systems</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Certifications:</Text>
                <Text style={profileStyles.infoValue}>Certified Library Specialist (CSLMS)</Text>
              </View>
            </View>

            {/* Administrative Scope */}
            <View style={profileStyles.infoCard}>
              <View style={profileStyles.infoCardHeader}>
                <MaterialCommunityIcons name="shield-check-outline" size={20} color="#EAB308" />
                <Text style={profileStyles.infoCardTitle}>Administrative Scope</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>System Role:</Text>
                <Text style={profileStyles.infoValue}>Head Librarian / Administrator</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Catalog Managed:</Text>
                <Text style={profileStyles.infoValue}>12,460 Volumes & Serials</Text>
              </View>
              <View style={profileStyles.infoRow}>
                <Text style={profileStyles.infoLabel}>Registered Members:</Text>
                <Text style={profileStyles.infoValue}>1,238 Active Members</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Action Buttons */}
      <View style={{ gap: 12, marginTop: 24, marginBottom: 40 }}>
        <TouchableOpacity style={styles.logoutBtnLarge} onPress={onLogout}>
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const profileStyles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: '#FFFFFF', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E5E7EB' },
  badge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 2 },
  name: { fontSize: 20, fontWeight: '800', color: '#111827' },
  title: { fontSize: 13, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  activeTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activeTagText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  empTag: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  empTagText: { fontSize: 11, fontWeight: '700', color: '#4B5563' },
  editToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, backgroundColor: '#FEF08A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FDE047' },
  editToggleText: { fontSize: 12, fontWeight: '700', color: '#111827' },
  photoUploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFDF7', borderWidth: 1.5, borderColor: '#FEF08A', borderStyle: 'dashed', borderRadius: 12, padding: 10 },
  uploadThumb: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB' },
  uploadTextWrap: { flex: 1, gap: 2 },
  infoSection: { gap: 14 },
  infoCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#F3F4F6', gap: 10 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  infoLabel: { fontSize: 12, color: '#6B7280' },
  infoValue: { fontSize: 12, fontWeight: '700', color: '#111827' },
});

// ============================================================================
// MODALS
// ============================================================================

function BookFormModal({
  visible,
  editingBook,
  categories,
  authors,
  onClose,
  onSave,
}: {
  visible: boolean;
  editingBook: Book | null;
  categories: Category[];
  authors: Author[];
  onClose: () => void;
  onSave: (bookData: Partial<Book> & { totalCopies?: number }) => void;
}) {
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [edition, setEdition] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [language, setLanguage] = useState('English');
  const [categoryId, setCategoryId] = useState('');
  const [subject, setSubject] = useState('');
  const [bookType, setBookType] = useState<BookType>('TEXTBOOK');
  const [coverImage, setCoverImage] = useState('');
  const [coverResizeMode, setCoverResizeMode] = useState<'cover' | 'contain' | 'stretch'>('cover');
  const [totalCopies, setTotalCopies] = useState('1');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title || '');
      setIsbn(editingBook.isbn || '');
      setPublisher(editingBook.publisher || '');
      setEdition(editingBook.edition || '');
      setPublicationYear(editingBook.publicationYear ? String(editingBook.publicationYear) : '');
      setLanguage(editingBook.language || 'English');
      setCategoryId(editingBook.categoryId || (categories[0]?.id || ''));
      setSubject(editingBook.subject || '');
      setBookType(editingBook.bookType || 'TEXTBOOK');
      setCoverImage(editingBook.coverImage || '');
      setKeywords(Array.isArray(editingBook.keywords) ? editingBook.keywords.join(', ') : '');
      setDescription(editingBook.description || '');
      setTotalCopies('1');
    } else {
      setTitle('');
      setIsbn('');
      setPublisher('');
      setEdition('');
      setPublicationYear('');
      setLanguage('English');
      setCategoryId(categories[0]?.id || '');
      setSubject('');
      setBookType('TEXTBOOK');
      setCoverImage('');
      setKeywords('');
      setDescription('');
      setTotalCopies('1');
    }
  }, [editingBook, visible, categories]);

  const filteredCatOptions = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(categorySearch.toLowerCase()))
    );
  }, [categories, categorySearch]);

  const pickCoverImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required to select cover photo.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setCoverImage(res.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick cover image.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Book title is required.');
      return;
    }
    if (!isbn.trim()) {
      Alert.alert('Required Field', 'Book ISBN number is required.');
      return;
    }

    setSubmitting(true);
    try {
      let finalCover = coverImage;
      if (coverImage && (coverImage.startsWith('file:') || coverImage.startsWith('content:') || coverImage.startsWith('ph:'))) {
        if (auth.currentUser) {
          try {
            finalCover = await uploadProfilePictureApi(coverImage);
          } catch {
            finalCover = coverImage;
          }
        } else {
          finalCover = coverImage;
        }
      }

      const copyCountParsed = parseInt(totalCopies, 10);
      const initialCopyCount = isNaN(copyCountParsed) || copyCountParsed < 1 ? 1 : copyCountParsed;

      const payload: Partial<Book> & { totalCopies?: number } = {
        title: title.trim(),
        isbn: isbn.trim(),
        publisher: publisher.trim() || undefined,
        edition: edition.trim() || undefined,
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
        language: language.trim() || 'English',
        categoryId: categoryId || categories[0]?.id || 'cat-1',
        subject: subject.trim() || undefined,
        bookType,
        coverImage: finalCover || undefined,
        keywords: keywords ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        description: description.trim() || undefined,
        totalCopies: initialCopyCount,
      };

      onSave(payload);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save book.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{editingBook ? 'Edit Book Record' : 'Add New Book to Catalog'}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color="#6B7280" /></TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* Resizable Cover Image Upload & Fitting Controls */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Book Cover Photo & Resize</Text>
              <TouchableOpacity style={bookFormStyles.coverUploadBtn} onPress={pickCoverImage}>
                {coverImage ? (
                  <Image source={{ uri: coverImage }} style={[bookFormStyles.coverPreview, { resizeMode: coverResizeMode }]} />
                ) : (
                  <View style={bookFormStyles.coverPlaceholder}>
                    <MaterialCommunityIcons name="image-plus" size={28} color="#EAB308" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#EAB308', marginTop: 4 }}>Select Cover Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {coverImage ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Fit Mode:</Text>
                  {(['cover', 'contain', 'stretch'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.chip, coverResizeMode === mode && styles.chipActive, { paddingHorizontal: 8, paddingVertical: 2 }]}
                      onPress={() => setCoverResizeMode(mode)}
                    >
                      <Text style={[styles.chipText, coverResizeMode === mode && styles.chipTextActive, { fontSize: 10 }]}>{mode.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Book Title *</Text>
              <TextInput style={styles.formInput} value={title} onChangeText={setTitle} placeholder="e.g. Clean Architecture" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1.5 }]}>
                <Text style={styles.formLabel}>ISBN Number *</Text>
                <TextInput style={styles.formInput} value={isbn} onChangeText={setIsbn} placeholder="e.g. 978-0134494166" />
              </View>

              {!editingBook && (
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Initial Copies *</Text>
                  <TextInput style={styles.formInput} value={totalCopies} onChangeText={setTotalCopies} keyboardType="numeric" placeholder="e.g. 5" />
                </View>
              )}
            </View>

            {/* Comprehensive Searchable Category Selection */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.formLabel}>Category Selection ({categories.length} Categories)</Text>
              </View>
              <TextInput
                style={[styles.formInput, { paddingVertical: 5, fontSize: 12, marginBottom: 6 }]}
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="🔍 Search category by name..."
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {filteredCatOptions.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, categoryId === c.id && styles.chipActive]}
                    onPress={() => setCategoryId(c.id)}
                  >
                    <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Book Type Chips */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Book Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {(['TEXTBOOK', 'REFERENCE', 'FICTION', 'NON_FICTION', 'COMPETITIVE', 'GENERAL'] as BookType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, bookType === t && styles.chipActive]}
                    onPress={() => setBookType(t)}
                  >
                    <Text style={[styles.chipText, bookType === t && styles.chipTextActive]}>{t.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Publisher</Text>
                <TextInput style={styles.formInput} value={publisher} onChangeText={setPublisher} placeholder="e.g. Pearson" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Edition</Text>
                <TextInput style={styles.formInput} value={edition} onChangeText={setEdition} placeholder="e.g. 1st Edition" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Publication Year</Text>
                <TextInput style={styles.formInput} value={publicationYear} onChangeText={setPublicationYear} keyboardType="numeric" placeholder="2023" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Language</Text>
                <TextInput style={styles.formInput} value={language} onChangeText={setLanguage} placeholder="English" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject</Text>
              <TextInput style={styles.formInput} value={subject} onChangeText={setSubject} placeholder="e.g. Computer Science" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Keywords (comma separated)</Text>
              <TextInput style={styles.formInput} value={keywords} onChangeText={setKeywords} placeholder="e.g. software, programming, code" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={[styles.formInput, { height: 75 }]} value={description} onChangeText={setDescription} multiline placeholder="Enter book synopsis or summary..." />
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginVertical: 16 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>{editingBook ? 'Save Catalog Updates' : 'Create Catalog Entry'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function CopyFormModal({
  visible,
  editingCopy,
  bookId,
  onClose,
  onSave,
}: {
  visible: boolean;
  editingCopy: BookCopy | null;
  bookId: string;
  onClose: () => void;
  onSave: (copyData: Partial<BookCopy>) => void;
}) {
  const [accessionNumber, setAccessionNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [rack, setRack] = useState('Rack A');
  const [shelf, setShelf] = useState('Shelf 1');
  const [status, setStatus] = useState<CopyStatus>('AVAILABLE');
  const [condition, setCondition] = useState<CopyCondition>('GOOD');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingCopy) {
      setAccessionNumber(editingCopy.accessionNumber || '');
      setBarcode(editingCopy.barcode || '');
      setRack(editingCopy.rack || 'Rack A');
      setShelf(editingCopy.shelf || 'Shelf 1');
      setStatus(editingCopy.status || 'AVAILABLE');
      setCondition(editingCopy.condition || 'GOOD');
    } else {
      const randNum = String(Math.floor(100000 + Math.random() * 900000));
      setAccessionNumber(`ACC-${randNum}`);
      setBarcode(`BAR-${randNum}`);
      setRack('Rack A');
      setShelf('Shelf 1');
      setStatus('AVAILABLE');
      setCondition('GOOD');
    }
  }, [editingCopy, visible]);

  const generateNewBarcode = () => {
    const randNum = String(Math.floor(100000 + Math.random() * 900000));
    setAccessionNumber(`ACC-${randNum}`);
    setBarcode(`BAR-${randNum}`);
  };

  const handleSave = () => {
    if (!accessionNumber.trim()) {
      Alert.alert('Required Field', 'Accession Number is required.');
      return;
    }
    if (!barcode.trim()) {
      Alert.alert('Required Field', 'Barcode is required.');
      return;
    }

    setSubmitting(true);
    onSave({
      accessionNumber: accessionNumber.trim(),
      barcode: barcode.trim(),
      rack: rack.trim() || 'Rack A',
      shelf: shelf.trim() || 'Shelf 1',
      status,
      condition,
    });
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{editingCopy ? 'Edit Inventory Copy' : 'Add Physical Inventory Copy'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* Auto-generate Barcode / Accession Card */}
            <View style={copyFormStyles.barcodeCard}>
              <View style={{ flex: 1 }}>
                <Text style={copyFormStyles.barcodeTitle}>Inventory Tag Generator</Text>
                <Text style={copyFormStyles.barcodeSub}>Auto-assign unique barcode & accession number</Text>
              </View>
              <TouchableOpacity style={copyFormStyles.genBtn} onPress={generateNewBarcode}>
                <Feather name="refresh-cw" size={14} color="#121316" />
                <Text style={copyFormStyles.genBtnText}>Generate</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Accession Number *</Text>
                <TextInput
                  style={styles.formInput}
                  value={accessionNumber}
                  onChangeText={setAccessionNumber}
                  placeholder="e.g. ACC-000101"
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Barcode Tag *</Text>
                <TextInput
                  style={styles.formInput}
                  value={barcode}
                  onChangeText={setBarcode}
                  placeholder="e.g. BAR-100101"
                />
              </View>
            </View>

            {/* Rack Location Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Rack Location (Storage Wing)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {['Rack A', 'Rack B', 'Rack C', 'Rack D', 'Rack E', 'Special Reserve', 'Archive Storage'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.chip, rack === r && styles.chipActive]}
                    onPress={() => setRack(r)}
                  >
                    <Text style={[styles.chipText, rack === r && styles.chipTextActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.formInput, { marginTop: 4 }]}
                value={rack}
                onChangeText={setRack}
                placeholder="Or enter custom rack location..."
              />
            </View>

            {/* Shelf Location Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Shelf Location (Tier Level)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {['Shelf 1', 'Shelf 2', 'Shelf 3', 'Shelf 4', 'Shelf 5', 'Top Tier', 'Display Shelf'].map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, shelf === s && styles.chipActive]}
                    onPress={() => setShelf(s)}
                  >
                    <Text style={[styles.chipText, shelf === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TextInput
                style={[styles.formInput, { marginTop: 4 }]}
                value={shelf}
                onChangeText={setShelf}
                placeholder="Or enter custom shelf level..."
              />
            </View>

            {/* Status Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Copy Availability Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {(['AVAILABLE', 'ISSUED', 'RESERVED', 'OVERDUE', 'LOST', 'DAMAGED', 'UNDER_REPAIR', 'WITHDRAWN'] as CopyStatus[]).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, status === st && styles.chipActive]}
                    onPress={() => setStatus(st)}
                  >
                    <Text style={[styles.chipText, status === st && styles.chipTextActive]}>{st.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Condition Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Physical Condition Assessment</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                {(['GOOD', 'FAIR', 'DAMAGED', 'BAD'] as CopyCondition[]).map((cond) => (
                  <TouchableOpacity
                    key={cond}
                    style={[
                      styles.chip,
                      { flex: 1, alignItems: 'center', justifyContent: 'center' },
                      condition === cond && styles.chipActive,
                    ]}
                    onPress={() => setCondition(cond)}
                  >
                    <Text style={[styles.chipText, condition === cond && styles.chipTextActive]}>{cond}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginVertical: 16 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>{editingCopy ? 'Save Copy Details' : 'Add Inventory Copy'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function StudentFormModal({
  visible,
  editingStudent,
  onClose,
  onSave,
}: {
  visible: boolean;
  editingStudent: StudentProfile | null;
  onClose: () => void;
  onSave: (studentData: Partial<StudentProfile>) => void;
}) {
  const [fullName, setFullName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [classSection, setClassSection] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingStudent) {
      setFullName(editingStudent.fullName || '');
      setAdmissionNo(editingStudent.admissionNo || '');
      setClassSection(editingStudent.classSection || '');
      setEmail(editingStudent.email || '');
      setPhone(editingStudent.phone || '');
    } else {
      setFullName('');
      const randNo = String(Math.floor(100 + Math.random() * 900));
      setAdmissionNo(`ADM-2026-${randNo}`);
      setClassSection('Class 10-A');
      setEmail('');
      setPhone('');
    }
  }, [editingStudent, visible]);

  const handleSave = () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Member full name is required.');
      return;
    }
    if (!admissionNo.trim()) {
      Alert.alert('Required Field', 'Admission / Member ID is required.');
      return;
    }

    setSubmitting(true);
    onSave({
      fullName: fullName.trim(),
      admissionNo: admissionNo.trim(),
      classSection: classSection.trim() || 'General',
      email: email.trim() || `${fullName.toLowerCase().replace(/\s+/g, '.')}@school.com`,
      phone: phone.trim() || undefined,
    });
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{editingStudent ? 'Edit Member Details' : 'Register New Member'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name *</Text>
              <TextInput
                style={styles.formInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Rahul Mehta"
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Admission No / Member ID *</Text>
                <TextInput
                  style={styles.formInput}
                  value={admissionNo}
                  onChangeText={setAdmissionNo}
                  placeholder="e.g. ADM-2026-001"
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Class & Section</Text>
                <TextInput
                  style={styles.formInput}
                  value={classSection}
                  onChangeText={setClassSection}
                  placeholder="e.g. Class 10-A"
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email Address</Text>
              <TextInput
                style={styles.formInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="e.g. student@school.com"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contact Phone</Text>
              <TextInput
                style={styles.formInput}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="e.g. +1 555-0192"
              />
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginVertical: 16 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>{editingStudent ? 'Save Member Updates' : 'Register Member'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

function PayFineModal({
  visible,
  fine,
  students,
  onClose,
  onPaymentSuccess,
}: {
  visible: boolean;
  fine: Fine | null;
  students: StudentProfile[];
  onClose: () => void;
  onPaymentSuccess: (updatedFine: Fine) => void;
}) {
  const [payAmount, setPayAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI_ONLINE' | 'DIGITAL_WALLET' | 'SCANNER_QR'>('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [refNotes, setRefNotes] = useState('');
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const student = useMemo(() => {
    if (!fine) return null;
    return students.find((s) => s.id === fine.studentId) || null;
  }, [fine, students]);

  const remainingBalance = useMemo(() => {
    if (!fine) return 0;
    return Math.max(0, fine.amount - fine.paidAmount);
  }, [fine]);

  const changeReturned = useMemo(() => {
    const payVal = parseFloat(payAmount || '0') || 0;
    const cashVal = parseFloat(cashTendered || '0') || 0;
    return Math.max(0, cashVal - payVal);
  }, [payAmount, cashTendered]);

  useEffect(() => {
    if (fine) {
      const rem = Math.max(0, fine.amount - fine.paidAmount);
      setPayAmount(rem.toFixed(2));
      setCashTendered(rem.toFixed(2));
      setPaymentMethod('CASH');
      setRefNotes('');
      setScannedPayload(null);
      setReceiptData(null);
    }
  }, [fine, visible]);

  if (!fine) return null;

  const handleTriggerScanner = () => {
    const mockPayload = `PAY-UPI-${Math.floor(100000 + Math.random() * 900000)}-KIVQUO`;
    setScannedPayload(mockPayload);
    setRefNotes(`Ref: ${mockPayload}`);
    Alert.alert('Scanner Active', `QR code scanned successfully!\nCaptured Payload: ${mockPayload}`);
  };

  const handleProcessPayment = () => {
    const amt = parseFloat(payAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount greater than $0.');
      return;
    }
    if (amt > remainingBalance + 0.01) {
      Alert.alert('Amount Exceeded', `Payment amount cannot exceed the remaining balance of $${remainingBalance.toFixed(2)}.`);
      return;
    }

    if (paymentMethod === 'CASH') {
      const cashVal = parseFloat(cashTendered || '0');
      if (isNaN(cashVal) || cashVal < amt - 0.01) {
        Alert.alert('Insufficient Cash', `Cash tendered ($${cashVal.toFixed(2)}) is less than payment amount ($${amt.toFixed(2)}).`);
        return;
      }
    }

    setSubmitting(true);
    const newPaidTotal = fine.paidAmount + amt;
    const isFullyPaid = newPaidTotal >= fine.amount - 0.01;
    const updatedStatus: FineStatus = isFullyPaid ? 'PAID' : 'PARTIALLY_PAID';

    const receiptNo = `REC-${Math.floor(100000 + Math.random() * 900000)}`;

    const newTxn: PaymentTransaction = {
      id: `txn-${Date.now()}`,
      fineId: fine.id,
      receiptNo,
      amount: amt,
      paymentMethod,
      cashTendered: paymentMethod === 'CASH' ? parseFloat(cashTendered || '0') : undefined,
      changeReturned: paymentMethod === 'CASH' ? changeReturned : undefined,
      transactionRef: refNotes.trim() || undefined,
      scannedQrPayload: paymentMethod === 'SCANNER_QR' ? scannedPayload || undefined : undefined,
      paidAt: new Date().toISOString(),
      cashier: 'Amina Rahman (Librarian)',
    };

    const updatedTransactions = [...(fine.paymentTransactions || []), newTxn];

    const updatedFine: Fine = {
      ...fine,
      paidAmount: newPaidTotal,
      status: updatedStatus,
      updatedAt: new Date().toISOString().split('T')[0],
      paymentTransactions: updatedTransactions,
    };

    // Save transaction record to backend DB API (with offline fallback)
    apiClient('/fines/payment', {
      method: 'POST',
      body: JSON.stringify(newTxn),
    }).catch(() => {});

    const newReceipt = {
      receiptNo,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      studentName: student?.fullName || 'Student Member',
      admissionNo: student?.admissionNo || 'N/A',
      classSection: student?.classSection || 'N/A',
      fineId: fine.id,
      fineType: fine.fineType.replace('_', ' '),
      amountPaid: amt,
      paymentMethod: paymentMethod.replace('_', ' '),
      cashTendered: paymentMethod === 'CASH' ? parseFloat(cashTendered || '0') : undefined,
      changeReturned: paymentMethod === 'CASH' ? changeReturned : undefined,
      remainingBalance: Math.max(0, fine.amount - newPaidTotal),
      refNotes: refNotes.trim() || 'N/A',
      scannedPayload,
      cashier: 'Amina Rahman (Librarian)',
    };

    setSubmitting(false);
    setReceiptData(newReceipt);
    onPaymentSuccess(updatedFine);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '94%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>
              {receiptData ? 'Digital Receipt Issued' : `Collect Fine Payment (#${fine.id})`}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {receiptData ? (
              /* DIGITAL RECEIPT VIEW */
              <View style={fineStyles.receiptContainer}>
                <View style={fineStyles.receiptHeader}>
                  <MaterialCommunityIcons name="check-circle" size={40} color="#059669" />
                  <Text style={fineStyles.receiptTitle}>KIVQUO SCHOOL LIBRARY</Text>
                  <Text style={fineStyles.receiptSub}>Official Payment Receipt</Text>
                  <Text style={fineStyles.receiptNo}>Receipt No: {receiptData.receiptNo}</Text>
                </View>

                <View style={fineStyles.receiptDivider} />

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Date & Time:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.date}</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Member Name:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.studentName}</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Admission / Class:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.admissionNo} ({receiptData.classSection})</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Fine Type:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.fineType}</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Payment Method:</Text>
                  <Text style={fineStyles.receiptVal}>{receiptData.paymentMethod}</Text>
                </View>

                {receiptData.cashTendered !== undefined && (
                  <>
                    <View style={fineStyles.receiptRow}>
                      <Text style={fineStyles.receiptLabel}>Cash Tendered:</Text>
                      <Text style={fineStyles.receiptVal}>${receiptData.cashTendered.toFixed(2)}</Text>
                    </View>
                    <View style={fineStyles.receiptRow}>
                      <Text style={fineStyles.receiptLabel}>Change Returned:</Text>
                      <Text style={[fineStyles.receiptVal, { color: '#059669' }]}>${receiptData.changeReturned.toFixed(2)}</Text>
                    </View>
                  </>
                )}

                {receiptData.scannedPayload && (
                  <View style={fineStyles.receiptRow}>
                    <Text style={fineStyles.receiptLabel}>QR Scanner Ref:</Text>
                    <Text style={fineStyles.receiptVal}>{receiptData.scannedPayload}</Text>
                  </View>
                )}

                {receiptData.refNotes !== 'N/A' && (
                  <View style={fineStyles.receiptRow}>
                    <Text style={fineStyles.receiptLabel}>Ref / Notes:</Text>
                    <Text style={fineStyles.receiptVal}>{receiptData.refNotes}</Text>
                  </View>
                )}

                <View style={fineStyles.receiptDivider} />

                <View style={fineStyles.receiptRowLarge}>
                  <Text style={fineStyles.receiptLabelLarge}>Amount Paid:</Text>
                  <Text style={fineStyles.receiptValLarge}>${receiptData.amountPaid.toFixed(2)}</Text>
                </View>

                <View style={fineStyles.receiptRow}>
                  <Text style={fineStyles.receiptLabel}>Remaining Balance:</Text>
                  <Text style={fineStyles.receiptVal}>${receiptData.remainingBalance.toFixed(2)}</Text>
                </View>

                <View style={fineStyles.receiptFooter}>
                  <Text style={fineStyles.receiptFooterText}>Issued by: {receiptData.cashier}</Text>
                  <Text style={fineStyles.receiptFooterSub}>Payment logged into database. Thank you.</Text>
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={onClose}>
                  <Text style={styles.primaryBtnText}>Done & Close Receipt</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* PAYMENT INPUT FORM */
              <View style={{ gap: 12 }}>
                {/* Member Summary Card */}
                <View style={fineStyles.modalMemberCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={fineStyles.modalMemberName}>{student?.fullName || 'Student Member'}</Text>
                    <Text style={fineStyles.modalMemberSub}>{student?.admissionNo} • {student?.classSection}</Text>
                    <Text style={{ fontSize: 11, color: '#DC2626', fontWeight: '800', marginTop: 4 }}>
                      Fine Total: ${fine.amount.toFixed(2)} | Balance Due: ${remainingBalance.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Amount to Pay */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Payment Amount ($) *</Text>
                  <TextInput
                    style={[styles.formInput, { fontSize: 16, fontWeight: '800' }]}
                    value={payAmount}
                    onChangeText={(v) => {
                      setPayAmount(v);
                      setCashTendered(v);
                    }}
                    keyboardType="numeric"
                    placeholder="0.00"
                  />
                </View>

                {/* Payment Method Selector */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Payment System & Gateway</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {[
                      { id: 'CASH', label: '💵 Cash' },
                      { id: 'SCANNER_QR', label: '📷 QR Scanner' },
                      { id: 'CARD', label: '💳 Card POS' },
                      { id: 'UPI_ONLINE', label: '📲 Online Transfer' },
                      { id: 'DIGITAL_WALLET', label: '👛 Wallet' },
                    ].map((m) => (
                      <TouchableOpacity
                        key={m.id}
                        style={[
                          styles.chip,
                          paymentMethod === m.id && styles.chipActive,
                          { minWidth: '45%', alignItems: 'center' },
                        ]}
                        onPress={() => setPaymentMethod(m.id as any)}
                      >
                        <Text style={[styles.chipText, paymentMethod === m.id && styles.chipTextActive]}>{m.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* CASH OPTION: TENDERED & CHANGE CALCULATOR */}
                {paymentMethod === 'CASH' && (
                  <View style={fineStyles.cashBox}>
                    <Text style={fineStyles.cashBoxTitle}>💵 Cash Payment & Change Calculator</Text>

                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>Cash Amount Tendered ($) *</Text>
                        <TextInput
                          style={[styles.formInput, { fontSize: 16, fontWeight: '800', color: '#059669' }]}
                          value={cashTendered}
                          onChangeText={setCashTendered}
                          keyboardType="numeric"
                          placeholder="0.00"
                        />
                      </View>

                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.formLabel}>Change to Return</Text>
                        <View style={[styles.formInput, { backgroundColor: changeReturned >= 0 ? '#ECFDF5' : '#FEF2F2', justifyContent: 'center' }]}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: changeReturned >= 0 ? '#059669' : '#DC2626' }}>
                            ${changeReturned.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Quick Tender Presets */}
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                      {[
                        { label: `Exact ($${parseFloat(payAmount || '0').toFixed(2)})`, val: parseFloat(payAmount || '0') },
                        { label: '+$5.00', val: (parseFloat(payAmount || '0') || 0) + 5 },
                        { label: '+$10.00', val: (parseFloat(payAmount || '0') || 0) + 10 },
                        { label: '$20.00', val: 20 },
                        { label: '$50.00', val: 50 },
                        { label: '$100.00', val: 100 },
                      ].map((p, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={fineStyles.tenderPill}
                          onPress={() => setCashTendered(p.val.toFixed(2))}
                        >
                          <Text style={fineStyles.tenderPillText}>{p.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* SCANNER INTERFACE */}
                {paymentMethod === 'SCANNER_QR' && (
                  <View style={fineStyles.scannerContainer}>
                    <View style={fineStyles.scannerHeader}>
                      <MaterialCommunityIcons name="qrcode-scan" size={24} color="#EAB308" />
                      <View style={{ flex: 1 }}>
                        <Text style={fineStyles.scannerTitle}>Digital QR Payment Scanner</Text>
                        <Text style={fineStyles.scannerSub}>Scan member UPI or Digital Wallet QR code</Text>
                      </View>
                    </View>

                    <View style={fineStyles.scannerViewport}>
                      <View style={fineStyles.scannerCornerTL} />
                      <View style={fineStyles.scannerCornerTR} />
                      <View style={fineStyles.scannerCornerBL} />
                      <View style={fineStyles.scannerCornerBR} />

                      <MaterialCommunityIcons name="camera-outline" size={44} color={scannedPayload ? '#059669' : '#EAB308'} />
                      <Text style={fineStyles.scannerStatusText}>
                        {scannedPayload ? '✅ Payment QR Code Verified!' : 'Position member payment QR code inside frame'}
                      </Text>
                      {scannedPayload ? (
                        <Text style={fineStyles.scannerPayloadText}>{scannedPayload}</Text>
                      ) : null}
                    </View>

                    <TouchableOpacity style={fineStyles.scanTriggerBtn} onPress={handleTriggerScanner}>
                      <MaterialCommunityIcons name="line-scan" size={18} color="#121316" />
                      <Text style={fineStyles.scanTriggerBtnText}>
                        {scannedPayload ? 'Re-scan Member QR Code' : '📷 Trigger Camera QR Scanner'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Reference Notes */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Transaction Reference / Remarks</Text>
                  <TextInput
                    style={styles.formInput}
                    value={refNotes}
                    onChangeText={setRefNotes}
                    placeholder="e.g. Receipt #, POS Auth Code, UPI transaction ID..."
                  />
                </View>

                <TouchableOpacity style={[styles.primaryBtn, { marginTop: 10 }]} onPress={handleProcessPayment} disabled={submitting}>
                  {submitting ? (
                    <ActivityIndicator size="small" color="#121316" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Collect Payment & Log Transaction</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DamageFineModal({
  visible,
  students,
  copies,
  books,
  defaultPenalty,
  onClose,
  onSaveDamageFine,
}: {
  visible: boolean;
  students: StudentProfile[];
  copies: BookCopy[];
  books: Book[];
  defaultPenalty: number;
  onClose: () => void;
  onSaveDamageFine: (newFine: Fine, updatedCopy?: BookCopy) => void;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCopyId, setSelectedCopyId] = useState('');
  const [damageType, setDamageType] = useState<DamageType>('TORN_PAGES');
  const [fineAmount, setFineAmount] = useState('10.00');
  const [damageNotes, setDamageNotes] = useState('');
  const [copyCondition, setCopyCondition] = useState<CopyCondition>('DAMAGED');
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('UNDER_REPAIR');
  const [submitting, setSubmitting] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [copySearch, setCopySearch] = useState('');

  const DAMAGE_PRESETS: { type: DamageType; label: string; icon: string; defaultFee: number }[] = [
    { type: 'TORN_PAGES', label: 'Torn / Ripped Pages', icon: 'file-document-outline', defaultFee: 10.0 },
    { type: 'WATER_DAMAGE', label: 'Water / Liquid Damage', icon: 'water-alert-outline', defaultFee: 20.0 },
    { type: 'BINDING_BROKEN', label: 'Broken Spine & Binding', icon: 'book-open-outline', defaultFee: 25.0 },
    { type: 'COVER_DAMAGED', label: 'Cover Damage / Detached', icon: 'book-variant-remove', defaultFee: 15.0 },
    { type: 'WRITING_ANNOTATIONS', label: 'Scribbling & Highlights', icon: 'pencil-off-outline', defaultFee: 8.0 },
    { type: 'MISSING_PAGES', label: 'Missing Pages / Chapters', icon: 'file-remove-outline', defaultFee: 30.0 },
    { type: 'SEVERE_MOLD', label: 'Severe Mold / Stains', icon: 'biohazard', defaultFee: 35.0 },
    { type: 'TOTAL_DESTRUCTION', label: 'Total Destruction / Unusable', icon: 'alert-decagram', defaultFee: 50.0 },
    { type: 'GENERAL_WEAR', label: 'Excessive Wear & Tear', icon: 'alert-circle-outline', defaultFee: 5.0 },
  ];

  useEffect(() => {
    if (visible) {
      setSelectedStudentId(students[0]?.id || '');
      setSelectedCopyId('');
      setDamageType('TORN_PAGES');
      setFineAmount('10.00');
      setDamageNotes('');
      setCopyCondition('DAMAGED');
      setCopyStatus('UNDER_REPAIR');
      setMemberSearch('');
      setCopySearch('');
    }
  }, [visible, students]);

  const handleSelectDamageType = (type: DamageType) => {
    setDamageType(type);
    const preset = DAMAGE_PRESETS.find((p) => p.type === type);
    if (preset) {
      setFineAmount(preset.defaultFee.toFixed(2));
    }
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return students;
    const q = memberSearch.toLowerCase();
    return students.filter(
      (s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q) || s.classSection.toLowerCase().includes(q)
    );
  }, [students, memberSearch]);

  const filteredCopies = useMemo(() => {
    return copies.filter((c) => {
      const bk = books.find((b) => b.id === c.bookId);
      if (!copySearch.trim()) return true;
      const q = copySearch.toLowerCase();
      return (
        c.accessionNumber.toLowerCase().includes(q) ||
        c.barcode.toLowerCase().includes(q) ||
        (bk && bk.title.toLowerCase().includes(q))
      );
    });
  }, [copies, books, copySearch]);

  const selectedCopy = useMemo(() => copies.find((c) => c.id === selectedCopyId), [copies, selectedCopyId]);

  const handleSave = () => {
    if (!selectedStudentId) {
      Alert.alert('Required Field', 'Please select a library member.');
      return;
    }
    const amt = parseFloat(fineAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Fine Amount', 'Please enter a valid fine penalty amount greater than $0.');
      return;
    }
    if (!damageNotes.trim()) {
      Alert.alert('Required Field', 'Please enter a brief description of the damage sustained.');
      return;
    }

    setSubmitting(true);
    const newFine: Fine = {
      id: `fine-dmg-${Math.floor(100000 + Math.random() * 900000)}`,
      studentId: selectedStudentId,
      bookCopyId: selectedCopyId || undefined,
      fineType: 'DAMAGED_BOOK',
      damageType,
      damageNotes: damageNotes.trim(),
      amount: amt,
      paidAmount: 0,
      status: 'UNPAID',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      paymentTransactions: [],
    };

    let updatedCopy: BookCopy | undefined;
    if (selectedCopy) {
      updatedCopy = {
        ...selectedCopy,
        condition: copyCondition,
        status: copyStatus,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    }

    // Save to backend database API (silent offline fallback)
    apiClient('/library/fines/damage', {
      method: 'POST',
      body: JSON.stringify({ fine: newFine, copy: updatedCopy }),
    }).catch(() => {});

    setSubmitting(false);
    onSaveDamageFine(newFine, updatedCopy);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '94%' }]}>
          <View style={modalStyles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="book-alert-outline" size={22} color="#DC2626" />
              <Text style={modalStyles.headerTitle}>Assess & Issue Book Damage Fine</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* Step 1: Member Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>1. Select Member Responsible *</Text>
              <TextInput
                style={[styles.formInput, { fontSize: 12, marginBottom: 6 }]}
                placeholder="🔍 Filter student by name or admission no..."
                value={memberSearch}
                onChangeText={setMemberSearch}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {filteredMembers.map((s) => {
                  const isSelected = selectedStudentId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedStudentId(s.id)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {s.fullName} ({s.admissionNo})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Step 2: Book Copy Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>2. Select Damaged Physical Copy (Optional)</Text>
              <TextInput
                style={[styles.formInput, { fontSize: 12, marginBottom: 6 }]}
                placeholder="🔍 Search copy by barcode, accession, or book title..."
                value={copySearch}
                onChangeText={setCopySearch}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                <TouchableOpacity
                  style={[styles.chip, !selectedCopyId && styles.chipActive]}
                  onPress={() => setSelectedCopyId('')}
                >
                  <Text style={[styles.chipText, !selectedCopyId && styles.chipTextActive]}>None / General Book</Text>
                </TouchableOpacity>
                {filteredCopies.map((c) => {
                  const bk = books.find((b) => b.id === c.bookId);
                  const isSelected = selectedCopyId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.chip, isSelected && styles.chipActive]}
                      onPress={() => setSelectedCopyId(c.id)}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                        {c.accessionNumber} • {bk?.title || 'Book'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Step 3: Specific Damage Type Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>3. Specific Damage Classification *</Text>
              <View style={fineStyles.damageGrid}>
                {DAMAGE_PRESETS.map((preset) => {
                  const isSelected = damageType === preset.type;
                  return (
                    <TouchableOpacity
                      key={preset.type}
                      style={[fineStyles.damagePresetCard, isSelected && fineStyles.damagePresetCardActive]}
                      onPress={() => handleSelectDamageType(preset.type)}
                    >
                      <MaterialCommunityIcons
                        name={preset.icon as any}
                        size={20}
                        color={isSelected ? '#121316' : '#6B7280'}
                      />
                      <Text style={[fineStyles.damagePresetText, isSelected && fineStyles.damagePresetTextActive]}>
                        {preset.label}
                      </Text>
                      <Text style={[fineStyles.damagePresetFee, isSelected && { color: '#121316' }]}>
                        ${preset.defaultFee.toFixed(2)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Step 4: Penalty Fine Amount */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Assess Fine Penalty ($) *</Text>
                <TextInput
                  style={[styles.formInput, { fontSize: 16, fontWeight: '900', color: '#DC2626' }]}
                  value={fineAmount}
                  onChangeText={setFineAmount}
                  keyboardType="numeric"
                />
              </View>

              {selectedCopy && (
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Update Copy Condition</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['DAMAGED', 'BAD'] as CopyCondition[]).map((cond) => (
                      <TouchableOpacity
                        key={cond}
                        style={[styles.chip, { flex: 1, alignItems: 'center' }, copyCondition === cond && styles.chipActive]}
                        onPress={() => setCopyCondition(cond)}
                      >
                        <Text style={[styles.chipText, copyCondition === cond && styles.chipTextActive]}>{cond}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Step 5: Damage Description & Remarks */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>4. Damage Inspection Description & Remarks *</Text>
              <TextInput
                style={[styles.formInput, { height: 75 }]}
                value={damageNotes}
                onChangeText={setDamageNotes}
                multiline
                placeholder="Describe exact condition, page numbers affected, torn cover, water spill, etc..."
              />
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#DC2626', marginTop: 10 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>Issue Damage Fine & Save Record</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function WaiveFineModal({
  visible,
  fine,
  students,
  onClose,
  onWaiveSuccess,
}: {
  visible: boolean;
  fine: Fine | null;
  students: StudentProfile[];
  onClose: () => void;
  onWaiveSuccess: (waivedFine: Fine) => void;
}) {
  const [reason, setReason] = useState('Discretionary Waiver');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const student = useMemo(() => {
    if (!fine) return null;
    return students.find((s) => s.id === fine.studentId) || null;
  }, [fine, students]);

  useEffect(() => {
    if (fine) {
      setReason('Discretionary Waiver');
      setRemarks('');
    }
  }, [fine, visible]);

  if (!fine) return null;

  const handleConfirmWaiver = () => {
    if (!remarks.trim()) {
      Alert.alert('Required Field', 'Please provide notes/remarks justifying this fine waiver.');
      return;
    }

    setSubmitting(true);
    const waivedFine: Fine = {
      ...fine,
      status: 'WAIVED',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setSubmitting(false);
    onWaiveSuccess(waivedFine);
    Alert.alert('Fine Waived', `Fine #${fine.id} of $${fine.amount.toFixed(2)} has been waived under ${reason}.`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>Waive Member Fine (#{fine.id})</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 12 }}>
              <View style={[fineStyles.modalMemberCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={fineStyles.modalMemberName}>{student?.fullName || 'Student Member'}</Text>
                  <Text style={fineStyles.modalMemberSub}>{student?.admissionNo} • {student?.classSection}</Text>
                  <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '800', marginTop: 4 }}>
                    Waiving Amount: ${fine.amount.toFixed(2)} ({fine.fineType.replace('_', ' ')})
                  </Text>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Exemption Category Reason *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {[
                    'Discretionary Waiver',
                    'Academic Exemption',
                    'Lost & Found Located',
                    'Financial Hardship',
                    'Admin Exemption',
                  ].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.chip, reason === r && styles.chipActive]}
                      onPress={() => setReason(r)}
                    >
                      <Text style={[styles.chipText, reason === r && styles.chipTextActive]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Exemption Justification / Remarks *</Text>
                <TextInput
                  style={[styles.formInput, { height: 80 }]}
                  value={remarks}
                  onChangeText={setRemarks}
                  multiline
                  placeholder="Enter official reason and notes for approving fine waiver..."
                />
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#2563EB', marginTop: 10 }]} onPress={handleConfirmWaiver} disabled={submitting}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: '#FFFFFF' }]}>Approve & Waive Fine</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// SUB-VIEW: PAST YEAR QUESTION PAPERS (PYQs)
// ============================================================================

interface PYQsViewProps {
  questionPapers: QuestionPaper[];
  onUploadPYQ: () => void;
  onPreviewPYQ: (paper: QuestionPaper) => void;
  onDeletePYQ: (pyqId: string) => void;
}

function PYQsView({ questionPapers, onUploadPYQ, onPreviewPYQ, onDeletePYQ }: PYQsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedExam, setSelectedExam] = useState('ALL');

  const yearOptions = ['ALL', '2024-2025', '2023-2024', '2022-2023'];
  const classOptions = ['ALL', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];
  const examOptions = ['ALL', 'FINAL', 'MIDTERM', 'ANNUAL', 'UNIT_TEST', 'SUPPLEMENTARY'];

  const totalDownloads = useMemo(() => {
    return questionPapers.reduce((sum, p) => sum + (p.downloadsCount || 0), 0);
  }, [questionPapers]);

  const uniqueSubjects = useMemo(() => {
    return new Set(questionPapers.map((p) => p.subject)).size;
  }, [questionPapers]);

  const filteredPapers = useMemo(() => {
    return questionPapers.filter((paper) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        paper.title.toLowerCase().includes(q) ||
        paper.subject.toLowerCase().includes(q) ||
        paper.uploadedBy.toLowerCase().includes(q);

      const matchesYear = selectedYear === 'ALL' || paper.academicYear === selectedYear;
      const matchesClass = selectedClass === 'ALL' || paper.classGrade === selectedClass;
      const matchesExam = selectedExam === 'ALL' || paper.examType === selectedExam;

      return matchesSearch && matchesYear && matchesClass && matchesExam;
    });
  }, [questionPapers, search, selectedYear, selectedClass, selectedExam]);

  return (
    <ScrollView style={styles.viewBodyContainer} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Past Year Question Papers Archive</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>
            Store, categorize, preview and manage examination papers across all subjects and grades
          </Text>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 }]} onPress={onUploadPYQ}>
          <Feather name="upload" size={16} color="#121316" />
          <Text style={styles.primaryBtnText}>Upload New PYQ</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={[fineStyles.kpiGrid, { marginBottom: 18 }]}>
        <View style={[fineStyles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <MaterialCommunityIcons name="file-document-multiple" size={24} color="#2563EB" />
          <Text style={[fineStyles.kpiLabel, { color: '#1E40AF' }]}>Archived Papers</Text>
          <Text style={[fineStyles.kpiValue, { color: '#1E3A8A' }]}>{questionPapers.length}</Text>
          <Text style={fineStyles.kpiSub}>Question paper records</Text>
        </View>

        <View style={[fineStyles.kpiCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Feather name="download" size={24} color="#166534" />
          <Text style={[fineStyles.kpiLabel, { color: '#166534' }]}>Total Downloads</Text>
          <Text style={[fineStyles.kpiValue, { color: '#14532D' }]}>{totalDownloads}</Text>
          <Text style={fineStyles.kpiSub}>Student & teacher downloads</Text>
        </View>

        <View style={[fineStyles.kpiCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#D97706" />
          <Text style={[fineStyles.kpiLabel, { color: '#B45309' }]}>Subjects Covered</Text>
          <Text style={[fineStyles.kpiValue, { color: '#78350F' }]}>{uniqueSubjects}</Text>
          <Text style={fineStyles.kpiSub}>Across all grade levels</Text>
        </View>
      </View>

      {/* Search and Filters Box */}
      <View style={{ backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, gap: 12 }}>
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, subject or uploader..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#9CA3AF"
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Rows */}
        <View style={{ gap: 10 }}>
          {/* Year Chips */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', width: 90 }}>Academic Year:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {yearOptions.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.chip, selectedYear === yr && styles.chipActive]}
                  onPress={() => setSelectedYear(yr)}
                >
                  <Text style={[styles.chipText, selectedYear === yr && styles.chipTextActive]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Class Chips */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', width: 90 }}>Grade / Class:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {classOptions.map((cls) => (
                <TouchableOpacity
                  key={cls}
                  style={[styles.chip, selectedClass === cls && styles.chipActive]}
                  onPress={() => setSelectedClass(cls)}
                >
                  <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>{cls}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Exam Type Chips */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', width: 90 }}>Exam Type:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {examOptions.map((ex) => (
                <TouchableOpacity
                  key={ex}
                  style={[styles.chip, selectedExam === ex && styles.chipActive]}
                  onPress={() => setSelectedExam(ex)}
                >
                  <Text style={[styles.chipText, selectedExam === ex && styles.chipTextActive]}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* List / Cards */}
      {filteredPapers.length === 0 ? (
        <View style={{ backgroundColor: '#FFFFFF', padding: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB', gap: 8 }}>
          <MaterialCommunityIcons name="file-document-alert-outline" size={48} color="#9CA3AF" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#374151' }}>No Question Papers Found</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
            Try adjusting your search keywords or filter criteria above.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12, paddingBottom: 40 }}>
          {filteredPapers.map((paper) => (
            <View key={paper.id} style={pyqStyles.pyqCard}>
              {/* Header Badges & Uploader */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                  <View style={pyqStyles.subjectBadge}>
                    <Text style={pyqStyles.subjectBadgeText}>{paper.subject}</Text>
                  </View>
                  <View style={pyqStyles.examBadge}>
                    <Text style={pyqStyles.examBadgeText}>{paper.examType}</Text>
                  </View>
                  <View style={pyqStyles.classBadge}>
                    <Text style={pyqStyles.classBadgeText}>{paper.classGrade}</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' }}>
                  Uploaded by {paper.uploadedBy}
                </Text>
              </View>

              {/* Title */}
              <Text style={pyqStyles.pyqTitle}>{paper.title}</Text>

              {/* Meta Info List with Icons */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginTop: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={pyqStyles.metaText}>Year: <Text style={{ fontWeight: '700', color: '#111827' }}>{paper.academicYear}</Text></Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="clipboard-check-outline" size={14} color="#6B7280" />
                  <Text style={pyqStyles.metaText}>Marks: <Text style={{ fontWeight: '700', color: '#111827' }}>{paper.totalMarks} Marks</Text></Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                  <Text style={pyqStyles.metaText}>Duration: <Text style={{ fontWeight: '700', color: '#111827' }}>{paper.durationMinutes} mins</Text></Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialCommunityIcons name="tray-arrow-down" size={14} color="#2563EB" />
                  <Text style={pyqStyles.metaText}>Downloads: <Text style={{ fontWeight: '800', color: '#2563EB' }}>{paper.downloadsCount}</Text></Text>
                </View>
              </View>

              {/* Action Buttons Footer - Styled after Image 2 */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12, marginTop: 4 }}>
                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', flex: 1, justifyContent: 'center' }]}
                  onPress={() => onPreviewPYQ(paper)}
                >
                  <MaterialCommunityIcons name="eye-outline" size={16} color="#2563EB" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#2563EB' }]}>Preview PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#FDE047', backgroundColor: '#FEF08A', flex: 1, justifyContent: 'center' }]}
                  onPress={() => onPreviewPYQ(paper)}
                >
                  <MaterialCommunityIcons name="download-outline" size={16} color="#121316" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#121316' }]}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[pyqStyles.btnOutline, { borderColor: '#FECACA', backgroundColor: '#FEF2F2', paddingHorizontal: 12 }]}
                  onPress={() => onDeletePYQ(paper.id)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                  <Text style={[pyqStyles.btnOutlineText, { color: '#DC2626' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

interface UploadPYQModalProps {
  visible: boolean;
  userName: string;
  onClose: () => void;
  onSave: (paperData: Omit<QuestionPaper, 'id' | 'downloadsCount' | 'uploadedAt' | 'uploadedBy'>) => void;
}

function UploadPYQModal({ visible, userName, onClose, onSave }: UploadPYQModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [classGrade, setClassGrade] = useState('Class 10');
  const [examType, setExamType] = useState<ExamType>('FINAL');
  const [totalMarks, setTotalMarks] = useState('80');
  const [durationMinutes, setDurationMinutes] = useState('180');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setSubject('');
      setAcademicYear('2024-2025');
      setClassGrade('Class 10');
      setExamType('FINAL');
      setTotalMarks('80');
      setDurationMinutes('180');
      setAttachedFileName(null);
    }
  }, [visible]);

  const handlePickPDF = () => {
    setAttachedFileName(`${subject ? subject.toLowerCase().replace(/\s+/g, '_') : 'question_paper'}_${academicYear}_${examType.toLowerCase()}.pdf`);
    Alert.alert('File Attached', 'PDF document selected successfully for PYQ archive upload.');
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter paper title.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Validation Error', 'Please enter subject name.');
      return;
    }

    onSave({
      title: title.trim(),
      subject: subject.trim(),
      academicYear: academicYear.trim(),
      classGrade: classGrade.trim(),
      examType: examType,
      totalMarks: parseInt(totalMarks, 10) || 100,
      durationMinutes: parseInt(durationMinutes, 10) || 180,
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <View>
              <Text style={modalStyles.headerTitle}>Upload Past Year Question Paper</Text>
              <Text style={{ fontSize: 11, color: '#6B7280' }}>Add new PYQ entry to the digital library repository</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Paper Title *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Mathematics Final Term Examination Paper 2024-2025"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Subject *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Mathematics, Physics, English"
                  value={subject}
                  onChangeText={setSubject}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Academic Year *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. 2024-2025"
                  value={academicYear}
                  onChangeText={setAcademicYear}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Class / Grade *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Class 10"
                  value={classGrade}
                  onChangeText={setClassGrade}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Exam Type</Text>
                <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                  {(['FINAL', 'MIDTERM', 'ANNUAL', 'UNIT_TEST'] as ExamType[]).map((ex) => (
                    <TouchableOpacity
                      key={ex}
                      style={[
                        styles.chip,
                        { paddingHorizontal: 8, paddingVertical: 4 },
                        examType === ex && styles.chipActive,
                      ]}
                      onPress={() => setExamType(ex)}
                    >
                      <Text style={[styles.chipText, { fontSize: 10 }, examType === ex && styles.chipTextActive]}>
                        {ex}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Total Marks</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={totalMarks}
                  onChangeText={setTotalMarks}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Duration (Minutes)</Text>
                <TextInput
                  style={styles.formInput}
                  keyboardType="numeric"
                  value={durationMinutes}
                  onChangeText={setDurationMinutes}
                />
              </View>
            </View>

            {/* Attachment Box */}
            <View style={{ marginTop: 6, marginBottom: 16 }}>
              <Text style={styles.formLabel}>PDF Document Attachment</Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFFDF7',
                  borderWidth: 1.5,
                  borderColor: attachedFileName ? '#86EFAC' : '#FEF08A',
                  borderStyle: 'dashed',
                  borderRadius: 10,
                  padding: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: 6,
                  gap: 6,
                }}
                onPress={handlePickPDF}
              >
                <MaterialCommunityIcons
                  name={attachedFileName ? 'file-pdf-box' : 'cloud-upload-outline'}
                  size={32}
                  color={attachedFileName ? '#059669' : '#EAB308'}
                />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>
                  {attachedFileName ? attachedFileName : 'Tap to Upload PDF Document'}
                </Text>
                <Text style={{ fontSize: 11, color: '#6B7280' }}>
                  {attachedFileName ? 'File ready for archival' : 'Supports .pdf files up to 25MB'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginBottom: 20 }]} onPress={handleSubmit}>
              <Text style={styles.primaryBtnText}>Save to PYQ Archive</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

interface PDFPreviewModalProps {
  visible: boolean;
  paper: QuestionPaper | null;
  onClose: () => void;
  onDownload: (paperId: string) => void;
}

function PDFPreviewModal({ visible, paper, onClose, onDownload }: PDFPreviewModalProps) {
  const [page, setPage] = useState(1);
  const totalPages = 4;

  if (!paper) return null;

  const handleDownload = () => {
    onDownload(paper.id);
    Alert.alert('Downloading Document', `Downloading "${paper.title}.pdf" to your device storage.`);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 12 }}>
        <View style={{ width: '100%', maxWidth: 850, height: '92%', backgroundColor: '#1E293B', borderRadius: 12, overflow: 'hidden' }}>
          {/* PDF Toolbar Header */}
          <View style={{ height: 54, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#334155' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 10 }}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#F8FAFC' }} numberOfLines={1}>
                  {paper.title}
                </Text>
                <Text style={{ fontSize: 10, color: '#94A3B8' }}>
                  {paper.subject} • {paper.academicYear} • {paper.examType}
                </Text>
              </View>
            </View>

            {/* Controls */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Page Nav */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1E293B', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <TouchableOpacity onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <Feather name="chevron-left" size={16} color={page === 1 ? '#475569' : '#F8FAFC'} />
                </TouchableOpacity>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#F8FAFC' }}>
                  {page} / {totalPages}
                </Text>
                <TouchableOpacity onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                  <Feather name="chevron-right" size={16} color={page === totalPages ? '#475569' : '#F8FAFC'} />
                </TouchableOpacity>
              </View>

              {/* Download button */}
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
                onPress={handleDownload}
              >
                <Feather name="download" size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>Download</Text>
              </TouchableOpacity>

              {/* Close button */}
              <TouchableOpacity style={{ padding: 4 }} onPress={onClose}>
                <Feather name="x" size={20} color="#F8FAFC" />
              </TouchableOpacity>
            </View>
          </View>

          {/* PDF Viewport */}
          <ScrollView style={{ flex: 1, backgroundColor: '#334155', padding: 20 }} contentContainerStyle={{ alignItems: 'center' }}>
            <View style={{ width: '100%', maxWidth: 650, backgroundColor: '#FFFFFF', borderRadius: 4, padding: 32, elevation: 5, gap: 16 }}>
              {/* Simulated Exam Header */}
              <View style={{ alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#1E293B', paddingBottom: 16, gap: 4 }}>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: 1 }}>
                  KIVQUO ACADEMIC SYSTEM
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#334155' }}>
                  {paper.examType} EXAMINATION — {paper.academicYear}
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563EB' }}>
                  SUBJECT: {paper.subject.toUpperCase()} ({paper.classGrade.toUpperCase()})
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Time Allowed: {paper.durationMinutes} Minutes</Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Maximum Marks: {paper.totalMarks}</Text>
                </View>
              </View>

              {/* Simulated Questions Body */}
              <View style={{ gap: 14 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>General Instructions:</Text>
                <Text style={{ fontSize: 11, color: '#334155', lineHeight: 16 }}>
                  1. All questions are compulsory unless internal choice is provided.{'\n'}
                  2. Section A consists of 10 Multiple Choice Questions carrying 1 mark each.{'\n'}
                  3. Use of electronic calculators or smart watches is strictly prohibited.{'\n'}
                  4. Write your admission number clearly on the top right corner of the answer script.
                </Text>

                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 }} />

                <Text style={{ fontSize: 13, fontWeight: '900', color: '#2563EB', marginTop: 4 }}>
                  SECTION A (20 MARKS)
                </Text>

                <View style={{ gap: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A', lineHeight: 16 }}>
                    Q1. Solve the quadratic equation x² - 5x + 6 = 0 and determine the sum and product of its roots.
                  </Text>
                  <Text style={{ fontSize: 10, color: '#475569', paddingLeft: 16 }}>
                    (a) roots: (2, 3), sum = 5, product = 6{'\n'}
                    (b) roots: (-2, -3), sum = -5, product = 6{'\n'}
                    (c) roots: (1, 6), sum = 7, product = 6{'\n'}
                    (d) roots: (0, 6), sum = 6, product = 0
                  </Text>
                </View>

                <View style={{ gap: 10, marginTop: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0F172A', lineHeight: 16 }}>
                    Q2. Explain the fundamental theorem of arithmetic and illustrate with prime factorization of 5040.
                  </Text>
                </View>

                {/* Page Footer */}
                <View style={{ marginTop: 30, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 9, color: '#94A3B8' }}>Archived in KIVQUO ERP PYQ Vault • Document Ref: {paper.id}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '700', color: '#475569' }}>Page {page} of {totalPages}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const pyqStyles = StyleSheet.create({
  pyqCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 10,
  },
  pyqTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#111827',
    lineHeight: 22,
    marginTop: 2,
  },
  subjectBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  subjectBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  examBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE047',
  },
  examBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#121316',
  },
  classBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  classBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  btnOutlineText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

// ============================================================================
// SUB-VIEW: REPORTS & ANALYTICS
// ============================================================================

interface ReportsViewProps {
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  fines: Fine[];
  students: StudentProfile[];
}

function ReportsView({ books, copies, loans, fines, students }: ReportsViewProps) {
  const [reportTab, setReportTab] = useState<'OVERVIEW' | 'CIRCULATION' | 'INVENTORY' | 'FINANCIAL' | 'MEMBERS'>('OVERVIEW');
  const [timeRange, setTimeRange] = useState<'MONTH' | 'QUARTER' | 'YEAR' | 'ALL'>('MONTH');

  // Calculated Metrics
  const totalBooksCount = books.length;
  const totalCopiesCount = copies.length;
  const availableCopiesCount = copies.filter((c) => c.status === 'AVAILABLE').length;
  const issuedCopiesCount = copies.filter((c) => c.status === 'ISSUED').length;
  const overdueCopiesCount = copies.filter((c) => c.status === 'OVERDUE').length;
  const damagedCopiesCount = copies.filter((c) => c.status === 'DAMAGED' || c.status === 'UNDER_REPAIR').length;

  const totalLoansCount = loans.length;
  const activeLoansCount = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;
  const overdueLoansCount = loans.filter((l) => l.status === 'OVERDUE').length;

  const totalFinesCollected = fines.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
  const totalFinesOutstanding = fines
    .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
    .reduce((acc, f) => acc + (f.amount - (f.paidAmount || 0)), 0);
  const totalFinesWaived = fines
    .filter((f) => f.status === 'WAIVED')
    .reduce((acc, f) => acc + f.amount, 0);

  // Top Borrowed Books Analytics
  const topBorrowedBooks = useMemo(() => {
    const counts: { [bookId: string]: number } = {};
    loans.forEach((l) => {
      counts[l.bookId] = (counts[l.bookId] || 0) + 1;
    });

    return Object.keys(counts)
      .map((bId) => {
        const bk = books.find((b) => b.id === bId);
        return {
          id: bId,
          title: bk?.title || 'Unknown Title',
          subject: bk?.subject || 'General',
          count: counts[bId],
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [loans, books]);

  // Export handlers
  const handleExportReport = (reportType: string) => {
    Alert.alert(
      'Exporting Analytics Report',
      `Generating ${reportType} report in CSV & PDF format. Download will start automatically.`,
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.viewBodyContainer} showsVerticalScrollIndicator={false}>
      {/* Header Bar */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827' }}>Library Reports & Analytics</Text>
          <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>
            Comprehensive performance metrics, circulation stats, audit logs, and financial collection summaries
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#10B981', flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 8 }]}
            onPress={() => handleExportReport('Library Executive Performance')}
          >
            <Feather name="download" size={14} color="#FFFFFF" />
            <Text style={[styles.primaryBtnText, { color: '#FFFFFF', fontSize: 12 }]}>Export Full Report (CSV)</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Time Period Filter */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Analytics Period:</Text>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'MONTH', label: 'This Month' },
            { key: 'QUARTER', label: 'This Quarter' },
            { key: 'YEAR', label: 'Academic Year' },
            { key: 'ALL', label: 'All Time' },
          ].map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.chip, timeRange === t.key && styles.chipActive]}
              onPress={() => setTimeRange(t.key as any)}
            >
              <Text style={[styles.chipText, timeRange === t.key && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Primary KPI Grid */}
      <View style={[fineStyles.kpiGrid, { marginBottom: 18 }]}>
        <View style={[fineStyles.kpiCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <MaterialCommunityIcons name="book-multiple" size={24} color="#2563EB" />
          <Text style={[fineStyles.kpiLabel, { color: '#1E40AF' }]}>Total Inventory</Text>
          <Text style={[fineStyles.kpiValue, { color: '#1E3A8A' }]}>{totalCopiesCount} Copies</Text>
          <Text style={fineStyles.kpiSub}>{totalBooksCount} Unique Titles</Text>
        </View>

        <View style={[fineStyles.kpiCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <MaterialCommunityIcons name="swap-horizontal" size={24} color="#D97706" />
          <Text style={[fineStyles.kpiLabel, { color: '#B45309' }]}>Active Loans</Text>
          <Text style={[fineStyles.kpiValue, { color: '#78350F' }]}>{activeLoansCount}</Text>
          <Text style={fineStyles.kpiSub}>{overdueLoansCount} Currently Overdue</Text>
        </View>

        <View style={[fineStyles.kpiCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Feather name="dollar-sign" size={24} color="#166534" />
          <Text style={[fineStyles.kpiLabel, { color: '#166534' }]}>Collected Fines</Text>
          <Text style={[fineStyles.kpiValue, { color: '#14532D' }]}>${totalFinesCollected.toFixed(2)}</Text>
          <Text style={fineStyles.kpiSub}>Revenue logged to system</Text>
        </View>

        <View style={[fineStyles.kpiCard, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#DC2626" />
          <Text style={[fineStyles.kpiLabel, { color: '#991B1B' }]}>Outstanding Fines</Text>
          <Text style={[fineStyles.kpiValue, { color: '#7F1D1D' }]}>${totalFinesOutstanding.toFixed(2)}</Text>
          <Text style={fineStyles.kpiSub}>Pending member dues</Text>
        </View>
      </View>

      {/* Sub-Tab Navigation Bar */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 8, flexWrap: 'wrap' }}>
        {[
          { key: 'OVERVIEW', label: '📊 Summary' },
          { key: 'CIRCULATION', label: '🔄 Circulation & Loans' },
          { key: 'INVENTORY', label: '📚 Inventory & Health' },
          { key: 'FINANCIAL', label: '💵 Financial Dues' },
          { key: 'MEMBERS', label: '👥 Member Analytics' },
        ].map((tab) => {
          const isActive = reportTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                { paddingHorizontal: 12, paddingVertical: 6 },
              ]}
              onPress={() => setReportTab(tab.key as any)}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TAB 1: OVERVIEW */}
      {reportTab === 'OVERVIEW' && (
        <View style={{ gap: 16, paddingBottom: 40 }}>
          {/* Top Borrowed Books Ranking */}
          <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827', flex: 1, minWidth: 180 }}>🔥 Most Frequently Borrowed Books</Text>
              <TouchableOpacity onPress={() => handleExportReport('Top Borrowed Books')} style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>Export CSV</Text>
              </TouchableOpacity>
            </View>

            {topBorrowedBooks.map((item, idx) => (
              <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: idx < topBorrowedBooks.length - 1 ? 1 : 0, borderBottomColor: '#F3F4F6' }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: idx === 0 ? '#FEF08A' : idx === 1 ? '#E5E7EB' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: idx === 0 ? '#121316' : '#4B5563' }}>#{idx + 1}</Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827', lineHeight: 18 }}>{item.title}</Text>
                  <Text style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>Subject: {item.subject}</Text>
                </View>
                <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#2563EB' }}>{item.count} borrows</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Quick Action Export Center / Instant Report Generator */}
          <View style={{ backgroundColor: '#FFFDF5', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FDE68A', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#D97706" />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Instant Report Generator</Text>
            </View>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justify: 'space-between',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#FCA5A5',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={() => handleExportReport('Overdue Loans Audit')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="file-chart-outline" size={18} color="#DC2626" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#991B1B' }}>Overdue Loans Report</Text>
                </View>
                <MaterialCommunityIcons name="download" size={16} color="#DC2626" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justify: 'space-between',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#6EE7B7',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={() => handleExportReport('Fine Receipts Ledger')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="cash-register" size={18} color="#059669" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#065F46' }}>Fine Receipts Ledger</Text>
                </View>
                <MaterialCommunityIcons name="download" size={16} color="#059669" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justify: 'space-between',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#93C5FD',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 2,
                  elevation: 1,
                }}
                onPress={() => handleExportReport('Inventory Audit')}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="package-variant-closed" size={18} color="#2563EB" />
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E40AF' }}>Inventory Audit Logs</Text>
                </View>
                <MaterialCommunityIcons name="download" size={16} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* TAB 2: CIRCULATION ANALYTICS */}
      {reportTab === 'CIRCULATION' && (
        <View style={{ gap: 16, paddingBottom: 40 }}>
          <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Circulation Status Breakdown</Text>

            <View style={{ gap: 10 }}>
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Available in Racks</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#059669' }}>
                    {availableCopiesCount} copies ({totalCopiesCount ? Math.round((availableCopiesCount / totalCopiesCount) * 100) : 0}%)
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${totalCopiesCount ? (availableCopiesCount / totalCopiesCount) * 100 : 0}%`, height: '100%', backgroundColor: '#10B981' }} />
                </View>
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Currently Issued to Members</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#2563EB' }}>
                    {issuedCopiesCount} copies ({totalCopiesCount ? Math.round((issuedCopiesCount / totalCopiesCount) * 100) : 0}%)
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${totalCopiesCount ? (issuedCopiesCount / totalCopiesCount) * 100 : 0}%`, height: '100%', backgroundColor: '#3B82F6' }} />
                </View>
              </View>

              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#374151' }}>Overdue Loans</Text>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#DC2626' }}>
                    {overdueCopiesCount} copies ({totalCopiesCount ? Math.round((overdueCopiesCount / totalCopiesCount) * 100) : 0}%)
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' }}>
                  <View style={{ width: `${totalCopiesCount ? (overdueCopiesCount / totalCopiesCount) * 100 : 0}%`, height: '100%', backgroundColor: '#EF4444' }} />
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* TAB 3: INVENTORY HEALTH */}
      {reportTab === 'INVENTORY' && (
        <View style={{ gap: 16, paddingBottom: 40 }}>
          <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Physical Book Condition Audit</Text>

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <View style={{ flex: 1, minWidth: 130, backgroundColor: '#F0FDF4', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>Good Condition</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#14532D' }}>
                  {copies.filter((c) => c.condition === 'GOOD').length}
                </Text>
                <Text style={{ fontSize: 10, color: '#166534' }}>Ready for loan</Text>
              </View>

              <View style={{ flex: 1, minWidth: 130, backgroundColor: '#FEFCE8', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#FEF08A' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#854D0E' }}>Fair Condition</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#713F12' }}>
                  {copies.filter((c) => c.condition === 'FAIR').length}
                </Text>
                <Text style={{ fontSize: 10, color: '#854D0E' }}>Minor wear</Text>
              </View>

              <View style={{ flex: 1, minWidth: 130, backgroundColor: '#FEF2F2', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#991B1B' }}>Damaged / Repair</Text>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#7F1D1D' }}>
                  {damagedCopiesCount}
                </Text>
                <Text style={{ fontSize: 10, color: '#991B1B' }}>Assessed for repair</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* TAB 4: FINANCIAL DUES */}
      {reportTab === 'FINANCIAL' && (
        <View style={{ gap: 16, paddingBottom: 40 }}>
          <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Financial Fine Recovery Ledger</Text>

            <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
              <View style={{ flex: 1, minWidth: 140, backgroundColor: '#ECFDF5', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#A7F3D0' }}>
                <Text style={{ fontSize: 12, color: '#065F46', fontWeight: '700' }}>Paid Revenue</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#047857' }}>${totalFinesCollected.toFixed(2)}</Text>
              </View>

              <View style={{ flex: 1, minWidth: 140, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FECACA' }}>
                <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '700' }}>Pending Unpaid</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#B91C1C' }}>${totalFinesOutstanding.toFixed(2)}</Text>
              </View>

              <View style={{ flex: 1, minWidth: 140, backgroundColor: '#EFF6FF', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BFDBFE' }}>
                <Text style={{ fontSize: 12, color: '#1E40AF', fontWeight: '700' }}>Waived Amount</Text>
                <Text style={{ fontSize: 22, fontWeight: '900', color: '#1D4ED8' }}>${totalFinesWaived.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* TAB 5: MEMBERS */}
      {reportTab === 'MEMBERS' && (
        <View style={{ gap: 16, paddingBottom: 40 }}>
          <View style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 14 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#111827' }}>Registered Member Participation</Text>
            <Text style={{ fontSize: 12, color: '#6B7280' }}>
              Total Members: <Text style={{ fontWeight: '800', color: '#111827' }}>{students.length} Registered Students</Text>
            </Text>

            <View style={{ gap: 8 }}>
              {students.map((student) => {
                const studentLoans = loans.filter((l) => l.studentId === student.id);
                const activeCount = studentLoans.filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE').length;
                return (
                  <View key={student.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, backgroundColor: '#F9FAFB', borderRadius: 8 }}>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{student.fullName}</Text>
                      <Text style={{ fontSize: 11, color: '#6B7280' }}>{student.admissionNo} • {student.classSection}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: activeCount > 0 ? '#2563EB' : '#9CA3AF' }}>
                        {activeCount} Active Borrowed
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const fineStyles = StyleSheet.create({
  damageBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  damageBtnHeaderText: { fontSize: 12, fontWeight: '800', color: '#FFFFFF' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flex: 1, minWidth: 145, padding: 14, borderRadius: 12, borderWidth: 1, gap: 5 },
  kpiLabel: { fontSize: 12, fontWeight: '700' },
  kpiValue: { fontSize: 22, fontWeight: '900' },
  kpiSub: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  fineCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  fineIdText: { fontSize: 12, fontWeight: '800', color: '#6B7280' },
  studentName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  studentSub: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  fineAmount: { fontSize: 16, fontWeight: '900', color: '#111827' },
  damageDetailBox: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#FECACA', gap: 4 },
  damageTypeTitle: { fontSize: 12, fontWeight: '800', color: '#991B1B' },
  damageNotesText: { fontSize: 11, color: '#7F1D1D', fontStyle: 'italic' },
  damageCopyMeta: { fontSize: 10, color: '#991B1B', fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: '#6B7280' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  payBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF08A', paddingVertical: 8, borderRadius: 8 },
  payBtnText: { fontSize: 12, fontWeight: '800', color: '#121316' },
  waiveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  waiveBtnText: { fontSize: 12, fontWeight: '800', color: '#2563EB' },
  modalMemberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF7', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FEF08A' },
  modalMemberName: { fontSize: 14, fontWeight: '800', color: '#111827' },
  modalMemberSub: { fontSize: 12, color: '#4B5563' },
  cashBox: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0', gap: 6 },
  cashBoxTitle: { fontSize: 13, fontWeight: '800', color: '#166534' },
  tenderPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC' },
  tenderPillText: { fontSize: 11, fontWeight: '800', color: '#14532D' },
  scannerContainer: { backgroundColor: '#FFFDF7', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FEF08A', gap: 10 },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scannerTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  scannerSub: { fontSize: 11, color: '#6B7280' },
  scannerViewport: { height: 140, backgroundColor: '#181A1F', borderRadius: 10, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: 10 },
  scannerCornerTL: { position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#EAB308' },
  scannerCornerTR: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#EAB308' },
  scannerCornerBL: { position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#EAB308' },
  scannerCornerBR: { position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#EAB308' },
  scannerStatusText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', marginTop: 8 },
  scannerPayloadText: { fontSize: 11, fontWeight: '800', color: '#EAB308', marginTop: 2 },
  scanTriggerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF08A', paddingVertical: 10, borderRadius: 8 },
  scanTriggerBtnText: { fontSize: 12, fontWeight: '800', color: '#121316' },
  damageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  damagePresetCard: { width: '31%', minWidth: 100, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', gap: 4 },
  damagePresetCardActive: { backgroundColor: '#FEF08A', borderColor: '#EAB308' },
  damagePresetText: { fontSize: 10, fontWeight: '700', color: '#4B5563', textAlign: 'center' },
  damagePresetTextActive: { color: '#121316', fontWeight: '800' },
  damagePresetFee: { fontSize: 11, fontWeight: '900', color: '#DC2626' },
  receiptContainer: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  receiptHeader: { alignItems: 'center', gap: 4, paddingBottom: 10 },
  receiptTitle: { fontSize: 16, fontWeight: '900', color: '#111827', letterSpacing: 0.5 },
  receiptSub: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  receiptNo: { fontSize: 13, fontWeight: '800', color: '#EAB308', marginTop: 4 },
  receiptDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 6 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  receiptLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  receiptVal: { fontSize: 12, color: '#111827', fontWeight: '700' },
  receiptRowLarge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  receiptLabelLarge: { fontSize: 14, color: '#111827', fontWeight: '800' },
  receiptValLarge: { fontSize: 18, color: '#059669', fontWeight: '900' },
  receiptFooter: { alignItems: 'center', marginTop: 10, gap: 2 },
  receiptFooterText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  receiptFooterSub: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' },
});

// ============================================================================
// GLOBAL STYLES
// ============================================================================

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
});

const bookFormStyles = StyleSheet.create({
  coverUploadBtn: { width: 110, height: 155, borderRadius: 10, backgroundColor: '#FFFDF7', borderWidth: 1.5, borderColor: '#FEF08A', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', alignSelf: 'center', marginVertical: 6 },
  coverPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 8 },
});

const copyFormStyles = StyleSheet.create({
  barcodeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFDF7', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#FEF08A', marginBottom: 6 },
  barcodeTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  barcodeSub: { fontSize: 11, color: '#6B7280' },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF08A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  genBtnText: { fontSize: 11, fontWeight: '800', color: '#121316' },
});

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  safeArea: { flex: 1 },
  appBody: { flex: 1, flexDirection: 'row' },
  mainWorkspace: { flex: 1, backgroundColor: '#F9FAFB' },
  tabContentArea: { flex: 1 },
  viewBody: { flex: 1, padding: 20 },
  viewBodyContainer: { flex: 1, padding: 20 },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 14, letterSpacing: 0.2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, height: 42, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500', color: '#111827', paddingVertical: 0 },
  formGroup: { marginBottom: 14, gap: 5 },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
  formInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#111827' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#FEF08A', borderColor: '#EAB308' },
  chipText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },
  chipTextActive: { color: '#121316', fontWeight: '800' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6 },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  badgeTextGreen: { color: '#059669' },
  badgeTextRed: { color: '#DC2626' },
  listItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 12, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  primaryBtn: { backgroundColor: '#EAB308', paddingVertical: 11, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#121316', fontSize: 13, fontWeight: '900' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#EAB308', alignItems: 'center', justifyContent: 'center', elevation: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8, marginBottom: 8 },
  notifTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  notifTime: { fontSize: 11, color: '#9CA3AF' },
  logoutBtnLarge: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 10 },
  logoutBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '800' },
});
