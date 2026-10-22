import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useUserStore } from '../../store/useUserStore';
import { FontFamily } from '../../constants/fonts';

// Types
import {
  Book,
  BookCopy,
  Category,
  Author,
  QuestionPaper,
  Loan,
  Fine,
  LibrarySettings,
  StudentProfile,
} from '../../features/librarian/types';

// Hooks
import {
  useLibraryBooks,
  useLibraryBookCopies,
  useLibraryCategories,
  useLibraryAuthors,
  useLibraryLoans,
  useLibraryFines,
  useLibraryMembers,
  useLibraryPYQs,
  useLibrarySettings,
  useLibraryDashboard,
} from '../../features/librarian/hooks';

// Icons
import { Feather, MaterialCommunityIcons } from '../../features/librarian/components/common/Icons';

// Components
import { LibrarianSidebar, SidebarContent } from '../../features/librarian/components/layout/LibrarianSidebar';
import { LibrarianDrawer } from '../../features/librarian/components/layout/LibrarianDrawer';
import { LibrarianHeader } from '../../features/librarian/components/layout/LibrarianHeader';
import { LibrarianDashboardView } from '../../features/librarian/components/dashboard/LibrarianDashboardView';
import { CategoriesView } from '../../features/librarian/components/categories/CategoriesView';
import { BooksView } from '../../features/librarian/components/books/BooksView';
import { BookDetailView } from '../../features/librarian/components/books/BookDetailView';
import { BookFormModal } from '../../features/librarian/components/books/BookFormModal';
import { CopyFormModal } from '../../features/librarian/components/books/CopyFormModal';
import { IssueBookView } from '../../features/librarian/components/circulation/IssueBookView';
import { FinesView } from '../../features/librarian/components/fines/FinesView';
import { PayFineModal } from '../../features/librarian/components/fines/PayFineModal';
import { DamageFineModal } from '../../features/librarian/components/fines/DamageFineModal';
import { WaiveFineModal } from '../../features/librarian/components/fines/WaiveFineModal';
import { LibraryStudentsView } from '../../features/librarian/components/members/LibraryStudentsView';
import { MemberFormModal as StudentFormModal } from '../../features/librarian/components/members/MemberFormModal';
import { PYQsView, UploadPYQModal, PDFPreviewModal } from '../../features/librarian/components/pyqs/PYQsView';
import { ReportsView } from '../../features/librarian/components/reports/ReportsView';
import { SettingsView } from '../../features/librarian/components/settings/SettingsView';
import { LibrarianProfileView as ProfileView } from '../../features/librarian/components/profile/LibrarianProfileView';
import { NotificationsView } from '../../features/librarian/components/notifications/NotificationsView';
import { AdminAnnouncementsView } from '../../features/announcements';
import { LibraryPageSkeleton } from '../../features/librarian/components/common/LibrarySkeletons';

const BOTTOM_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home-outline', iconFilled: 'home', isAccount: false },
  { key: 'books', label: 'Books', icon: 'book-open-outline', iconFilled: 'book-open-page-variant', isAccount: false },
  { key: 'issue', label: 'Circulation', icon: 'swap-horizontal', iconFilled: 'swap-horizontal-bold', isAccount: false },
  { key: 'announcements', label: 'Notices', icon: 'bullhorn-outline', iconFilled: 'bullhorn', isAccount: false },
  { key: 'profile', label: 'Account', icon: 'account-circle-outline', iconFilled: 'account-circle', isAccount: true },
] as const;

export default function LibrarianHomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const userName = useUserStore((state) => state.fullName) || 'Amina Rahman';
  const resetUser = useUserStore((state) => state.resetUser);

  // Navigation & Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [circulationSubMode, setCirculationSubMode] = useState<'ISSUE' | 'RETURN' | 'ALL_LOANS' | 'OVERDUE'>('ISSUE');
  const [finesSubMode, setFinesSubMode] = useState<'OVERDUE' | 'FINES'>('OVERDUE');
  const [searchQuery, setSearchQuery] = useState('');

  // API Hooks (PostgreSQL persistent source of truth)
  const { stats: dashboardStats, loading: dashboardLoading, refetch: refetchDashboard } = useLibraryDashboard();
  const { books, loading: booksLoading, createBook, updateBook, deleteBook: deleteBookApi, refetch: refetchBooks } = useLibraryBooks();
  const { copies, loading: copiesLoading, fetchCopies, createCopy, updateCopy, deleteCopy: deleteCopyApi } = useLibraryBookCopies();
  const { categories, loading: categoriesLoading, createCategory } = useLibraryCategories();
  const { authors, loading: authorsLoading } = useLibraryAuthors();
  const { loans, loading: loansLoading, issueBook, returnBook, renewLoan, refetch: refetchLoans } = useLibraryLoans();
  const { fines, loading: finesLoading, payFine, waiveFine, createDamageFine, refetch: refetchFines } = useLibraryFines();
  const { members: students, loading: membersLoading, refetch: refetchMembers } = useLibraryMembers();
  const { pyqs: questionPapers, loading: pyqsLoading, createPYQ, deletePYQ: deletePYQApi, trackDownload, refetch: refetchPYQs } = useLibraryPYQs();
  const { settings: apiSettings, loading: settingsLoading, updateSettings, refetch: refetchSettings } = useLibrarySettings();

  // Tab Switching & Page Skeleton Transition
  const [isSwitchingTab, setIsSwitchingTab] = useState(false);
  const tabSwitchTimerRef = useRef<any>(null);

  const handleSwitchTab = useCallback((tab: string, subMode?: string) => {
    if (tab === 'issue' && subMode) {
      setCirculationSubMode(subMode as any);
    }
    if (tab === 'fines' && subMode) {
      setFinesSubMode(subMode as any);
    }
    if (tab !== activeTab) {
      if (tabSwitchTimerRef.current) {
        clearTimeout(tabSwitchTimerRef.current);
      }
      setIsSwitchingTab(true);
      setActiveTab(tab);
      tabSwitchTimerRef.current = setTimeout(() => {
        setIsSwitchingTab(false);
      }, 250);
    }
  }, [activeTab]);

  const isCurrentTabLoading = useMemo(() => {
    if (isSwitchingTab) return true;
    switch (activeTab) {
      case 'dashboard':
        return dashboardLoading;
      case 'books':
        return booksLoading;
      case 'issue':
        return loansLoading;
      case 'fines':
        return finesLoading;
      case 'students':
        return membersLoading;
      case 'reports':
        return booksLoading || loansLoading || finesLoading;
      case 'settings':
        return settingsLoading;
      case 'pyqs':
        return pyqsLoading;
      case 'notifications':
        return loansLoading || finesLoading;
      default:
        return false;
    }
  }, [
    isSwitchingTab,
    activeTab,
    dashboardLoading,
    booksLoading,
    loansLoading,
    finesLoading,
    membersLoading,
    settingsLoading,
    pyqsLoading,
  ]);

  // Settings fallback
  const settings: LibrarySettings = apiSettings || {
    borrowingLimit: 3,
    loanPeriodDays: 14,
    gracePeriodDays: 2,
    finePerDay: 1.0,
    maxFine: 100.0,
    renewalLimit: 2,
    allowReservation: true,
    lostBookPenalty: 50.0,
    damagedBookPenalty: 25.0,
  };

  // UI Modal State
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

  // Live Notifications Data
  const overdueLoansList = useMemo(() => loans.filter((l) => l.status === 'OVERDUE'), [loans]);
  const unpaidFinesList = useMemo(() => fines.filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID'), [fines]);
  const unpaidFinesTotal = useMemo(() => unpaidFinesList.reduce((acc: number, f: Fine) => acc + (f.amount - (f.paidAmount || 0)), 0), [unpaidFinesList]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.allSettled([
        refetchDashboard?.(),
        refetchBooks?.(),
        selectedBook?.id ? fetchCopies(selectedBook.id) : Promise.resolve(),
        refetchLoans?.(),
        refetchFines?.(),
        refetchMembers?.(),
        refetchPYQs?.(),
        refetchSettings?.(),
      ]);
    } catch (e) {
      console.warn('Refresh error:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of Librarian Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try { await signOut(auth); } catch { }
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
              await deleteBookApi(bookId);
              if (selectedBook?.id === bookId) {
                setSelectedBook(null);
              }
              refetchDashboard();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete book.');
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
            refetchMembers();
            Alert.alert('Member Removed', 'The member record has been updated.');
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
              await deletePYQApi(pyqId);
              Alert.alert('Paper Deleted', 'The question paper has been permanently removed.');
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to delete PYQ.');
            }
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
              onNavigate={(tab) => handleSwitchTab(tab)}
              onLogout={handleLogout}
            />
          )}

          {/* Main Dashboard Content Area */}
          <View style={styles.mainWorkspace}>
            <LibrarianHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onMenuPress={() => setDrawerOpen(true)}
              onNotificationsPress={() => handleSwitchTab('notifications')}
              onProfilePress={() => handleSwitchTab('profile')}
              userName={userName}
            />

            <View style={styles.tabContentArea}>
              {isCurrentTabLoading ? (
                <LibraryPageSkeleton tab={activeTab} isBookDetail={activeTab === 'books' && !!selectedBook} />
              ) : (
                <>
                  {activeTab === 'announcements' && (
                    <AdminAnnouncementsView />
                  )}

                  {activeTab === 'dashboard' && (
                    <LibrarianDashboardView
                      books={books}
                      copies={copies}
                      loans={loans}
                      students={students}
                      fines={fines}
                      categories={categories}
                      librarianName={userName}
                      onRefresh={handleRefresh}
                      isRefreshing={isRefreshing}
                      onNavigate={handleSwitchTab}
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
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
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
                    onDeleteCopy={async (copyId: string) => {
                      try {
                        await deleteCopyApi(copyId, selectedBook.id);
                        refetchBooks();
                      } catch (err: any) {
                        Alert.alert('Error', err?.message || 'Failed to delete copy.');
                      }
                    }}
                    commonStyles={styles}
                  />
                ) : (
                  <BooksView
                    books={books}
                    copies={copies}
                    categories={categories}
                    authors={authors}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    onSelectBook={(book) => {
                      setSelectedBook(book);
                      fetchCopies(book.id);
                    }}
                    onAddBook={() => {
                      setEditingBook(null);
                      setBookModalOpen(true);
                    }}
                    onDeleteBook={handleDeleteBook}
                    commonStyles={styles}
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
                  initialSubMode={circulationSubMode}
                  onSubModeChange={setCirculationSubMode}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  onIssueSuccess={async (newLoan: Loan, copyId: string) => {
                    try {
                      await issueBook({
                        bookId: newLoan.bookId,
                        copyId: copyId,
                        bookCopyId: copyId,
                        studentId: newLoan.studentId,
                        dueDate: newLoan.dueDate,
                      });
                      await refetchBooks();
                      await refetchLoans();
                      await refetchDashboard();
                      Alert.alert('Book Issued', 'Successfully issued book to member.');
                    } catch (err: any) {
                      Alert.alert('Error', err?.message || 'Failed to issue book.');
                      throw err;
                    }
                  }}
                  onReturnSuccess={async (loanId: string, copyId: string, newFine?: Fine) => {
                    try {
                      const res = await returnBook(loanId);
                      refetchBooks();
                      refetchFines();
                      refetchDashboard();
                      if (res.fineCreated) {
                        Alert.alert('Book Returned', `Book returned successfully. An overdue fine of ₹${res.fineAmount.toFixed(2)} was generated.`);
                      } else {
                        Alert.alert('Book Returned', 'Book returned successfully with zero fines.');
                      }
                    } catch (err: any) {
                      Alert.alert('Error', err?.message || 'Failed to return book.');
                    }
                  }}
                  onRenewSuccess={async (loanId: string, newDueDate: string) => {
                    try {
                      await renewLoan(loanId);
                      Alert.alert('Loan Renewed', `Loan extended until ${newDueDate}.`);
                    } catch (err: any) {
                      Alert.alert('Error', err?.message || 'Failed to renew loan.');
                    }
                  }}
                  commonStyles={styles}
                />
              )}

              {activeTab === 'pyqs' && (
                <PYQsView
                  questionPapers={questionPapers}
                  onUploadPYQ={() => setPyqModalOpen(true)}
                  onPreviewPYQ={(paper) => setPreviewPyq(paper)}
                  onDeletePYQ={handleDeletePYQ}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  commonStyles={styles}
                  fineStyles={fineStyles}
                />
              )}

              {activeTab === 'fines' && (
                <FinesView
                  fines={fines}
                  loans={loans}
                  initialTab={finesSubMode}
                  students={students}
                  copies={copies}
                  books={books}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  onPayFine={(fine) => {
                    setSelectedFine(fine);
                    setPayFineModalOpen(true);
                  }}
                  onWaiveFine={(fine) => {
                    setSelectedFine(fine);
                    setWaiveFineModalOpen(true);
                  }}
                  onAssessDamage={() => setDamageFineModalOpen(true)}
                  commonStyles={styles}
                  fineStyles={fineStyles}
                />
              )}

              {activeTab === 'students' && (
                <LibraryStudentsView
                  students={students}
                  loans={loans}
                  copies={copies}
                  books={books}
                  fines={fines}
                  reservations={[]}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  onAddStudent={() => {
                    setEditingStudent(null);
                    setStudentModalOpen(true);
                  }}
                  onEditStudent={(student) => {
                    setEditingStudent(student);
                    setStudentModalOpen(true);
                  }}
                  onDeleteStudent={handleDeleteStudent}
                  commonStyles={styles}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsView
                  books={books}
                  copies={copies}
                  loans={loans}
                  fines={fines}
                  students={students}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  commonStyles={styles}
                  fineStyles={fineStyles}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  settings={settings}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  onSaveSettings={async (newSettings) => {
                    try {
                      await updateSettings({
                        borrowingLimit: newSettings.borrowingLimit,
                        loanPeriodDays: newSettings.loanPeriodDays,
                        gracePeriodDays: newSettings.gracePeriodDays,
                        finePerDay: String(newSettings.finePerDay),
                        maxFine: String(newSettings.maxFine),
                        renewalLimit: newSettings.renewalLimit,
                        allowReservation: newSettings.allowReservation,
                        lostBookPenalty: String(newSettings.lostBookPenalty),
                        damagedBookPenalty: String(newSettings.damagedBookPenalty),
                      });
                      Alert.alert('Settings Updated', 'Library configuration saved successfully.');
                    } catch (err: any) {
                      Alert.alert('Error', err?.message || 'Failed to update settings.');
                    }
                  }}
                  commonStyles={styles}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileView
                  userName={userName}
                  onLogout={handleLogout}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  commonStyles={styles}
                />
              )}

              {activeTab === 'notifications' && (
                <NotificationsView
                  loans={loans}
                  fines={fines}
                  books={books}
                  copies={copies}
                  students={students}
                  onRefresh={handleRefresh}
                  isRefreshing={isRefreshing}
                  commonStyles={styles}
                  onNavigate={handleSwitchTab}
                />
              )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* Floating Bottom Navigation Bar on Mobile */}
        {!isDesktop && (
          <View style={styles.tabBarBg}>
            <View style={styles.tabBar}>
              {BOTTOM_TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={styles.tabItem}
                    onPress={() => handleSwitchTab(tab.key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.tabIconBg, isActive && styles.tabIconBgActive]}>
                      {'isAccount' in tab && tab.isAccount ? (
                        <View style={[styles.accountAvatar, isActive && styles.accountAvatarActive]}>
                          <Text style={[styles.accountAvatarText, isActive && styles.accountAvatarTextActive]}>K</Text>
                        </View>
                      ) : (
                        <MaterialCommunityIcons
                          name={isActive ? (tab.iconFilled as any) : (tab.icon as any)}
                          size={22}
                          color={isActive ? '#1A1B1C' : '#9CA3AF'}
                        />
                      )}
                    </View>
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Mobile Slide-out Animated Drawer matching attendance flow */}
        {!isDesktop && (
          <LibrarianDrawer
            visible={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            fullName={userName}
            email={useUserStore.getState().email || ''}
            institutionName={useUserStore.getState().institutionName || 'Library Management'}
            activeTab={activeTab}
            onTabSwitch={(tab) => {
              setDrawerOpen(false);
              handleSwitchTab(tab);
            }}
            onLogout={handleLogout}
          />
        )}

        {/* Book Form Modal */}
        <BookFormModal
          visible={bookModalOpen}
          editingBook={editingBook}
          categories={categories}
          authors={authors}
          onCreateCategory={createCategory}
          onClose={() => setBookModalOpen(false)}
          onSave={async (bookData) => {
            try {
              if (editingBook) {
                await updateBook(editingBook.id, {
                  title: bookData.title,
                  isbn: bookData.isbn,
                  price: bookData.price ? String(bookData.price) : undefined,
                  publisher: bookData.publisher || undefined,
                  publicationYear: bookData.publicationYear || undefined,
                  categoryId: bookData.categoryId || undefined,
                  description: bookData.description || undefined,
                  coverImage: bookData.coverImage || undefined,
                  language: bookData.language || undefined,
                  subject: bookData.subject || undefined,
                  edition: bookData.edition || undefined,
                  bookType: bookData.bookType || undefined,
                });
              } else {
                const { totalCopies, ...bData } = bookData;
                await createBook({
                  title: bData.title || '',
                  isbn: bData.isbn || '',
                  price: bData.price ? String(bData.price) : undefined,
                  publisher: bData.publisher || undefined,
                  publicationYear: bData.publicationYear || undefined,
                  categoryId: bData.categoryId || undefined,
                  description: bData.description || undefined,
                  coverImage: bData.coverImage || undefined,
                  language: bData.language || undefined,
                  subject: bData.subject || undefined,
                  edition: bData.edition || undefined,
                  bookType: bData.bookType || undefined,
                  totalCopies: totalCopies && totalCopies > 0 ? totalCopies : 1,
                });
              }
              await refetchBooks();
              await refetchDashboard();
              setBookModalOpen(false);
              handleSwitchTab('books');
              setSelectedBook(null);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to save book.');
            }
          }}
          modalStyles={modalStyles}
          commonStyles={styles}
          bookFormStyles={bookFormStyles}
        />

        {/* Copy Form Modal */}
        <CopyFormModal
          visible={copyModalOpen}
          editingCopy={editingCopy}
          bookId={selectedBook?.id || ''}
          onClose={() => setCopyModalOpen(false)}
          onSave={async (copyData) => {
            if (!selectedBook) return;
            try {
              if (editingCopy) {
                await updateCopy(editingCopy.id, selectedBook.id, {
                  accessionNumber: copyData.accessionNumber,
                  barcode: copyData.barcode || undefined,
                  condition: copyData.condition || undefined,
                  status: copyData.status || undefined,
                });
              } else {
                await createCopy(selectedBook.id, {
                  accessionNumber: copyData.accessionNumber || '',
                  barcode: copyData.barcode || undefined,
                  condition: copyData.condition || 'GOOD',
                  status: copyData.status || 'AVAILABLE',
                });
              }
              refetchBooks();
              setCopyModalOpen(false);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to save copy.');
            }
          }}
          modalStyles={modalStyles}
          commonStyles={styles}
        />

        {/* Student / Member Form Modal */}
        <StudentFormModal
          visible={studentModalOpen}
          editingStudent={editingStudent}
          onClose={() => setStudentModalOpen(false)}
          onSave={async () => {
            refetchMembers();
            setStudentModalOpen(false);
          }}
          modalStyles={modalStyles}
          commonStyles={styles}
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
          onPaymentSuccess={async () => {
            await refetchFines();
            await refetchDashboard();
            setPayFineModalOpen(false);
            setSelectedFine(null);
          }}
          modalStyles={modalStyles}
          commonStyles={styles}
          fineStyles={fineStyles}
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
          onWaiveSuccess={async (waivedFine: Fine, reason: string, remarks: string) => {
            try {
              await waiveFine(waivedFine.id, {
                reason: reason || 'Discretionary Waiver',
                remarks: remarks || 'Discretionary waiver approved by librarian',
              });
              await refetchFines();
              await refetchDashboard();
              setWaiveFineModalOpen(false);
              setSelectedFine(null);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to waive fine.');
            }
          }}
          modalStyles={modalStyles}
          commonStyles={styles}
          fineStyles={fineStyles}
        />

        {/* Damage Fine Assessment Modal */}
        <DamageFineModal
          visible={damageFineModalOpen}
          students={students}
          copies={copies}
          books={books}
          loans={loans}
          defaultPenalty={typeof settings.damagedBookPenalty === 'number' ? settings.damagedBookPenalty : parseFloat(String(settings.damagedBookPenalty || '25'))}
          defaultDueRate={typeof settings.finePerDay === 'number' ? settings.finePerDay : parseFloat(String(settings.finePerDay || '10'))}
          onClose={() => setDamageFineModalOpen(false)}
          onSaveDamageFine={async (newFine: Fine, updatedCopy?: BookCopy, paymentMode?: 'CASH' | 'ONLINE') => {
            try {
              await createDamageFine({
                studentId: newFine.studentId,
                bookCopyId: newFine.bookCopyId || undefined,
                loanId: newFine.loanId || undefined,
                damageType: (newFine.damageType as any) || 'GENERAL_WEAR',
                fineType: newFine.fineType,
                amount: newFine.amount,
                damageNotes: newFine.damageNotes || 'Fine Collected',
                reason: newFine.damageNotes || 'Fine Collected',
                copyCondition: updatedCopy?.condition || 'DAMAGED',
                copyStatus: updatedCopy?.status || 'UNDER_REPAIR',
                paymentMethod: paymentMode === 'ONLINE' ? 'UPI_ONLINE' : 'CASH',
                isPaid: true,
              });
              await refetchFines();
              await refetchBooks();
              await refetchDashboard();
              setDamageFineModalOpen(false);
              Alert.alert('Fine Collected', `Successfully collected fine of ₹${newFine.amount.toFixed(2)} via ${paymentMode === 'ONLINE' ? 'Online Pay' : 'Cash'}.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to collect fine.');
            }
          }}
          modalStyles={modalStyles}
          commonStyles={styles}
          fineStyles={fineStyles}
        />

        {/* Upload PYQ Modal */}
        <UploadPYQModal
          visible={pyqModalOpen}
          userName={userName}
          onClose={() => setPyqModalOpen(false)}
          onSave={async (paperData) => {
            try {
              await createPYQ({
                title: paperData.title,
                subject: paperData.subject,
                academicYear: paperData.academicYear,
                classGrade: paperData.classGrade || undefined,
                examType: paperData.examType || undefined,
                fileUrl: paperData.fileUrl || 'https://example.com/sample.pdf',
                fileSize: paperData.fileSize || undefined,
              });
              await refetchPYQs();
              setPyqModalOpen(false);
              Alert.alert('PYQ Uploaded', `Successfully added "${paperData.title}" to the past paper repository.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to upload PYQ.');
            }
          }}
          modalStyles={modalStyles}
          commonStyles={styles}
        />

        {/* PDF Preview Modal */}
        <PDFPreviewModal
          visible={!!previewPyq}
          paper={previewPyq}
          onClose={() => setPreviewPyq(null)}
          onDownload={async (paperId) => {
            try {
              await trackDownload(paperId);
            } catch { }
          }}
        />

      </SafeAreaView>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E8E5DC' },
  headerTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#171717' },
});

const notifStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '82%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFDF7',
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 5,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  headerSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  notifCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 12,
    padding: 12,
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  notifSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 15,
  },
  notifActionBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    marginTop: 8,
  },
  notifActionText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  dismissBtn: {
    backgroundColor: '#F4C430',
    borderRadius: 5,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  dismissBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
});

const bookFormStyles = StyleSheet.create({
  coverUploadBtn: { width: 110, height: 155, borderRadius: 10, backgroundColor: '#FFFDF7', borderWidth: 1.5, borderColor: '#FEF08A', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', alignSelf: 'center', marginVertical: 6 },
  coverPreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center', padding: 8 },
});

const fineStyles = StyleSheet.create({
  damageBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5 },
  damageBtnHeaderText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#FFFFFF' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { flex: 1, minWidth: 145, padding: 14, borderRadius: 12, borderWidth: 1, gap: 5 },
  kpiLabel: { fontSize: 12, fontFamily: FontFamily.bold },
  kpiValue: { fontSize: 22, fontFamily: FontFamily.extrabold },
  kpiSub: { fontSize: 11, color: '#6B7280', fontFamily: FontFamily.medium },
  fineCard: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  fineIdText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#6B7280' },
  studentName: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  studentSub: { fontSize: 12, color: '#4B5563', fontFamily: FontFamily.semibold },
  fineAmount: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#111827' },
  damageDetailBox: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#FECACA', gap: 4 },
  damageTypeTitle: { fontSize: 12, fontFamily: FontFamily.bold, color: '#991B1B' },
  damageNotesText: { fontSize: 11, color: '#7F1D1D', fontStyle: 'italic', fontFamily: FontFamily.regular },
  damageCopyMeta: { fontSize: 10, color: '#991B1B', fontFamily: FontFamily.semibold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8, flexWrap: 'wrap' },
  metaText: { fontSize: 11, color: '#6B7280', fontFamily: FontFamily.regular },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  payBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF08A', paddingVertical: 8, borderRadius: 5 },
  payBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#121316' },
  waiveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#EFF6FF', paddingVertical: 8, borderRadius: 5, borderWidth: 1, borderColor: '#BFDBFE' },
  waiveBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#2563EB' },
  modalMemberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFDF7', padding: 12, borderRadius: 5, borderWidth: 1, borderColor: '#FEF08A' },
  modalMemberName: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  modalMemberSub: { fontSize: 12, color: '#4B5563', fontFamily: FontFamily.regular },
  cashBox: { backgroundColor: '#F0FDF4', padding: 12, borderRadius: 5, borderWidth: 1, borderColor: '#BBF7D0', gap: 6 },
  cashBoxTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#166534' },
  tenderPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5, borderWidth: 1, borderColor: '#86EFAC' },
  tenderPillText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#14532D' },
  scannerContainer: { backgroundColor: '#FFFDF7', padding: 12, borderRadius: 5, borderWidth: 1, borderColor: '#FEF08A', gap: 10 },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scannerTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  scannerSub: { fontSize: 11, color: '#6B7280', fontFamily: FontFamily.regular },
  scannerViewport: { height: 140, backgroundColor: '#181A1F', borderRadius: 5, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: 10 },
  scannerCornerTL: { position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#EAB308' },
  scannerCornerTR: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#EAB308' },
  scannerCornerBL: { position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#EAB308' },
  scannerCornerBR: { position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#EAB308' },
  scannerStatusText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#FFFFFF', marginTop: 8 },
  scannerPayloadText: { fontSize: 11, fontFamily: FontFamily.extrabold, color: '#EAB308', marginTop: 2 },
  scanTriggerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF08A', paddingVertical: 10, borderRadius: 5 },
  scanTriggerBtnText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#121316' },
  damageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  damagePresetCard: { width: '31%', minWidth: 100, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 5, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', gap: 4 },
  damagePresetCardActive: { backgroundColor: '#FEF08A', borderColor: '#EAB308' },
  damagePresetText: { fontSize: 10, fontFamily: FontFamily.semibold, color: '#4B5563', textAlign: 'center' },
  damagePresetTextActive: { color: '#121316', fontFamily: FontFamily.bold },
  damagePresetFee: { fontSize: 11, fontFamily: FontFamily.extrabold, color: '#DC2626' },
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
  receiptValLarge: { fontSize: 18, color: '#026440', fontWeight: '900' },
  receiptFooter: { alignItems: 'center', marginTop: 10, gap: 2 },
  receiptFooterText: { fontSize: 11, fontWeight: '700', color: '#374151' },
  receiptFooterSub: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' },
});

const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: '#F9FAFB' },
  safeArea: { flex: 1 },
  appBody: { flex: 1, flexDirection: 'row' },
  mainWorkspace: { flex: 1, backgroundColor: '#F9FAFB' },
  tabContentArea: { flex: 1 },
  viewBody: { flex: 1, padding: 20 },
  viewBodyContainer: { flex: 1, padding: 20 },
  sectionHeader: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#111827', marginBottom: 14, letterSpacing: 0.2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 14, height: 42, borderRadius: 5, borderWidth: 1, borderColor: '#E5E7EB', gap: 10 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium, color: '#111827', paddingVertical: 0 },
  formGroup: { marginBottom: 14, gap: 5 },
  formLabel: { fontSize: 12, fontFamily: FontFamily.bold, color: '#374151' },
  formInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 5, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: FontFamily.regular, color: '#111827' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 5, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#FEF08A', borderColor: '#EAB308' },
  chipText: { fontSize: 12, color: '#4B5563', fontFamily: FontFamily.semibold },
  chipTextActive: { color: '#121316', fontFamily: FontFamily.bold },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 5 },
  badgeGreen: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#026440' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 10, fontFamily: FontFamily.bold },
  badgeTextGreen: { color: '#026440' },
  badgeTextRed: { color: '#DC2626' },
  listItemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', gap: 12, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  cardSub: { fontSize: 12, color: '#6B7280', fontFamily: FontFamily.regular },
  primaryBtn: { backgroundColor: '#F4C430', paddingVertical: 11, paddingHorizontal: 16, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#171717', fontSize: 13, fontFamily: FontFamily.bold },
  fab: { position: 'absolute', bottom: 85, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#F4C430', alignItems: 'center', justifyContent: 'center', elevation: 4, zIndex: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  backBtnText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  notifCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 5, marginBottom: 8 },
  notifTitle: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  notifTime: { fontSize: 11, color: '#9CA3AF', fontFamily: FontFamily.regular },
  logoutBtnLarge: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEE2E2', paddingVertical: 14, borderRadius: 5 },
  logoutBtnText: { color: '#EF4444', fontSize: 15, fontFamily: FontFamily.bold },
  tabBarBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 14 : 8,
    paddingTop: 4,
    backgroundColor: 'transparent',
    zIndex: 99,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 16,
    width: '94%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    justifyContent: 'space-around',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    minWidth: 54,
  },
  tabIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconBgActive: {
    backgroundColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  accountAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1.2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarActive: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
  },
  accountAvatarText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#9CA3AF',
  },
  accountAvatarTextActive: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: '#F4C430',
  },
});
