import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { Book, BookCopy, Loan, StudentProfile, Fine, Category } from '../../types';
import { FontFamily } from '../../../../constants/fonts';

export interface LibrarianDashboardViewProps {
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  students: StudentProfile[];
  fines: Fine[];
  categories?: Category[];
  librarianName?: string;
  onNavigate: (tab: string, subMode?: string) => void;
  onAddBook: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const LibrarianDashboardView: React.FC<LibrarianDashboardViewProps> = ({
  books,
  copies,
  loans,
  students,
  fines,
  categories = [],
  librarianName,
  onNavigate,
  onAddBook,
  onRefresh,
  isRefreshing = false,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [activeCircTab, setActiveCircTab] = useState<'DELAYED' | 'ISSUED'>('DELAYED');
  const scrollViewRef = useRef<ScrollView>(null);
  const circContainerYRef = useRef<number>(0);

  const handleTabPress = (tab: 'DELAYED' | 'ISSUED') => {
    setActiveCircTab(tab);
    if (circContainerYRef.current > 0) {
      scrollViewRef.current?.scrollTo({ y: Math.max(0, circContainerYRef.current - 12), animated: true });
    }
  };

  // Fast entity lookups
  const studentMap = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const copyMap = useMemo(() => new Map(copies.map((c) => [c.id, c])), [copies]);

  // Real data calculations
  const { realDelayed, realIssued } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const delayed: any[] = [];
    const issued: any[] = [];

    loans.forEach((loan) => {
      if (loan.status === 'RETURNED') return;

      const std = studentMap.get(loan.studentId) || students.find((s) => s.id === loan.studentId);
      const cpy = copyMap.get(loan.copyId) || copies.find((c) => c.id === loan.copyId);
      const bk =
        bookMap.get(loan.bookId) ||
        (cpy?.bookId ? bookMap.get(cpy.bookId) : undefined) ||
        books.find((b) => b.id === loan.bookId || b.id === cpy?.bookId);

      const dueDateObj = loan.dueDate ? new Date(loan.dueDate) : null;
      if (dueDateObj) dueDateObj.setHours(0, 0, 0, 0);

      const diffTime = dueDateObj ? today.getTime() - dueDateObj.getTime() : 0;
      const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isOverdue = loan.status === 'OVERDUE' || (dueDateObj && daysOverdue > 0);

      const item = {
        id: loan.id,
        loanId: loan.id,
        studentName: std?.fullName || 'Student Member',
        studentUsn: std?.admissionNo || 'N/A',
        studentClass: std?.classSection || 'General',
        studentPic: std?.profilePicUrl,
        bookTitle: bk?.title || 'Library Book',
        bookNumber: bk?.isbn || 'N/A',
        accessionNo: cpy?.accessionNumber || 'ACC-N/A',
        coverImage: bk?.coverImage,
        issueDate: loan.issueDate || (loan.issuedAt ? String(loan.issuedAt).split('T')[0] : 'Recent'),
        dueDate: loan.dueDate || 'N/A',
        daysOverdue: Math.max(1, daysOverdue),
        daysRemaining: Math.max(0, -daysOverdue),
        isDueToday: daysOverdue === 0,
      };

      if (isOverdue) {
        delayed.push(item);
      } else {
        issued.push(item);
      }
    });

    return { realDelayed: delayed, realIssued: issued };
  }, [loans, students, books, copies, studentMap, bookMap, copyMap]);

  // Demo fallback items for rich visual experience if database has no active loans yet
  const fallbackDelayed = useMemo(
    () => [
      {
        id: 'fb-del-1',
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
        isDueToday: false,
      },
      {
        id: 'fb-del-2',
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
        isDueToday: false,
      },
      {
        id: 'fb-del-3',
        studentName: 'Karthik Nair',
        studentUsn: '2024ME035',
        studentClass: 'Class 9-C',
        studentPic: undefined,
        bookTitle: 'Concepts of Physics - Part 1',
        bookNumber: 'BK-97844',
        accessionNo: 'ACC-3110',
        coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=120',
        issueDate: '25 Sep 2026',
        dueDate: '09 Oct 2026',
        daysOverdue: 9,
        daysRemaining: 0,
        isDueToday: false,
      },
    ],
    []
  );

  const fallbackIssued = useMemo(
    () => [
      {
        id: 'fb-iss-1',
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
        isDueToday: false,
      },
      {
        id: 'fb-iss-2',
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
        isDueToday: false,
      },
      {
        id: 'fb-iss-3',
        studentName: 'Divya Krishnan',
        studentUsn: '2024EE041',
        studentClass: 'Class 11-A',
        studentPic: undefined,
        bookTitle: 'The Psychology of Money',
        bookNumber: 'BK-97890',
        accessionNo: 'ACC-6014',
        coverImage: undefined,
        issueDate: '12 Oct 2026',
        dueDate: '26 Oct 2026',
        daysOverdue: 0,
        daysRemaining: 8,
        isDueToday: false,
      },
    ],
    []
  );

  const displayDelayed = loans.length > 0 ? realDelayed : fallbackDelayed;
  const displayIssued = loans.length > 0 ? realIssued : fallbackIssued;

  // Sort delayed by highest overdue delay descending
  const sortedDelayed = useMemo(() => {
    return [...displayDelayed].sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0));
  }, [displayDelayed]);

  // Sort issued by nearest due date first
  const sortedIssued = useMemo(() => {
    return [...displayIssued].sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));
  }, [displayIssued]);

  // Dynamic Available Books Count
  const availableBooksCount = useMemo(() => {
    const availableFromCopies = copies.filter((c) => c.status === 'AVAILABLE').length;
    if (availableFromCopies > 0) return availableFromCopies;

    const fromBooks = books.reduce((sum, b) => sum + (typeof b.availableCopies === 'number' ? b.availableCopies : 0), 0);
    if (fromBooks > 0) return fromBooks;

    const totalCopies = books.reduce((sum, b) => sum + (b.totalCopies && b.totalCopies > 0 ? b.totalCopies : 1), 0);
    const activeLoanCount = realIssued.length + realDelayed.length;
    if (totalCopies > 0) return Math.max(0, totalCopies - activeLoanCount);

    return 11840;
  }, [copies, books, realIssued.length, realDelayed.length]);

  // Dynamic Book Circulation stats for the week
  const circulationWeekData = useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const past7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return {
        day: dayNames[d.getDay()],
        dateStr: `${yyyy}-${mm}-${dd}`,
        issued: 0,
        returned: 0,
      };
    });

    loans.forEach((loan) => {
      const issueRaw = loan.issueDate || (loan.issuedAt ? String(loan.issuedAt).split('T')[0] : '');
      const returnRaw = loan.returnedAt ? String(loan.returnedAt).split('T')[0] : '';

      past7Days.forEach((slot) => {
        if (issueRaw && (issueRaw.startsWith(slot.dateStr) || issueRaw.includes(slot.day))) {
          slot.issued++;
        }
        if (returnRaw && returnRaw.startsWith(slot.dateStr)) {
          slot.returned++;
        }
      });
    });

    const totalIssuedFound = past7Days.reduce((sum, d) => sum + d.issued, 0);
    if (totalIssuedFound === 0 && loans.length > 0) {
      loans.forEach((loan) => {
        const rawDate = loan.issueDate ? new Date(loan.issueDate) : loan.issuedAt ? new Date(loan.issuedAt) : null;
        if (rawDate && !isNaN(rawDate.getTime())) {
          const dayName = dayNames[rawDate.getDay()];
          const slot = past7Days.find((s) => s.day === dayName);
          if (slot) {
            slot.issued++;
            if (loan.status === 'RETURNED') slot.returned++;
          }
        } else {
          past7Days[past7Days.length - 1].issued++;
          if (loan.status === 'RETURNED') past7Days[past7Days.length - 1].returned++;
        }
      });
    }

    const maxCount = Math.max(1, ...past7Days.map((d) => Math.max(d.issued, d.returned)));
    const scale = 72 / maxCount;

    return past7Days.map((d) => ({
      day: d.day,
      issued: d.issued,
      returned: d.returned,
      issuedHeight: Math.max(4, Math.round(d.issued * scale)),
      returnedHeight: Math.max(4, Math.round(d.returned * scale)),
    }));
  }, [loans]);

  // Dynamic Books by Category Breakdown
  const categoryBreakdown = useMemo(() => {
    const catMap = new Map<string, { name: string; count: number }>();

    (categories || []).forEach((c) => {
      catMap.set(c.id, { name: c.name, count: 0 });
    });

    let otherCount = 0;
    books.forEach((b) => {
      if (b.categoryId && catMap.has(b.categoryId)) {
        catMap.get(b.categoryId)!.count++;
      } else {
        const found = Array.from(catMap.values()).find(
          (c) => c.name.toLowerCase() === (b.subject || b.bookType || '').toLowerCase()
        );
        if (found) {
          found.count++;
        } else {
          otherCount++;
        }
      }
    });

    const activeList = Array.from(catMap.values()).filter((c) => c.count > 0);
    if (otherCount > 0) {
      activeList.push({ name: 'General', count: otherCount });
    }

    const total = books.length;
    const colors = ['#F4C430', '#CA8A04', '#0284C7', '#026440', '#8B5CF6', '#EC4899', '#64748B'];

    if (activeList.length === 0) {
      const defaultCats = (categories && categories.length > 0 ? categories : [
        { name: 'General' },
        { name: 'Fiction' },
        { name: 'Academic' },
        { name: 'Reference' },
      ]).slice(0, 6);

      return defaultCats.map((c, idx) => ({
        name: c.name,
        count: 0,
        pct: 0,
        color: colors[idx % colors.length],
      }));
    }

    activeList.sort((a, b) => b.count - a.count);
    return activeList.slice(0, 6).map((item, idx) => ({
      ...item,
      pct: total > 0 ? Math.round((item.count / total) * 100) : 0,
      color: colors[idx % colors.length],
    }));
  }, [books, categories]);

  // Dynamic Today's Reminders generated from live data
  const dynamicReminders = useMemo(() => {
    const list: {
      id: string;
      text: string;
      actionText: string;
      onAction: () => void;
      color: string;
    }[] = [];

    // 1. Overdue Books
    if (displayDelayed.length > 0) {
      list.push({
        id: 'rem-overdue',
        text: `${displayDelayed.length} ${displayDelayed.length === 1 ? 'book is' : 'books are'} overdue for attention.`,
        actionText: 'Take Action',
        onAction: () => onNavigate('issue', 'OVERDUE'),
        color: '#DC2626',
      });
    }

    // 2. Books Due Today
    const dueTodayCount = displayIssued.filter((item) => item.isDueToday).length;
    if (dueTodayCount > 0) {
      list.push({
        id: 'rem-due-today',
        text: `${dueTodayCount} ${dueTodayCount === 1 ? 'book is' : 'books are'} scheduled for return today.`,
        actionText: 'View Due',
        onAction: () => onNavigate('issue', 'ALL_LOANS'),
        color: '#D97706',
      });
    }

    // 3. Unpaid Fines
    const unpaidFinesList = fines.filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID');
    const unpaidFinesTotal = unpaidFinesList.reduce((acc, f) => acc + (f.amount - (f.paidAmount || 0)), 0);
    if (unpaidFinesList.length > 0) {
      list.push({
        id: 'rem-fines',
        text: `₹${unpaidFinesTotal.toFixed(0)} in unpaid library fines pending collection (${unpaidFinesList.length} ${unpaidFinesList.length === 1 ? 'record' : 'records'}).`,
        actionText: 'Fine Records',
        onAction: () => onNavigate('fines', 'FINES'),
        color: '#DC2626',
      });
    }

    // 4. Damaged / Under Repair Copies
    const damagedCopiesCount = copies.filter((c) => c.status === 'DAMAGED' || c.status === 'UNDER_REPAIR').length;
    if (damagedCopiesCount > 0) {
      list.push({
        id: 'rem-damaged',
        text: `${damagedCopiesCount} ${damagedCopiesCount === 1 ? 'copy is' : 'copies are'} flagged as damaged or under repair.`,
        actionText: 'Book Fine',
        onAction: () => onNavigate('fines'),
        color: '#D97706',
      });
    }

    // 5. Fallback if no pending items
    if (list.length === 0) {
      list.push({
        id: 'rem-clear',
        text: 'All clear! No overdue books or pending fines require attention today.',
        actionText: 'Issue Book',
        onAction: () => onNavigate('issue', 'ISSUE'),
        color: '#026440',
      });
    }

    return list;
  }, [displayDelayed, displayIssued, fines, copies, onNavigate]);

  const currentList = activeCircTab === 'DELAYED' ? sortedDelayed : sortedIssued;
  const top5List = currentList.slice(0, 5);
  const remainingCount = currentList.length - top5List.length;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={[dashStyles.container, isMobile && { padding: 12 }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: isMobile ? 95 : 40 }}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!isRefreshing}
            onRefresh={onRefresh}
            colors={['#D97706']}
            tintColor="#D97706"
          />
        ) : undefined
      }
    >
      {/* 1. Header & Greeting Bar with Librarian Name */}
      <View style={dashStyles.headerRow}>
        <View>
          <Text style={dashStyles.titleText}>Hello, {librarianName || 'Librarian'} </Text>
        </View>
      </View>

      {/* 2. Circulation & Book Delay Monitor (Issues & Overdue) */}
      <View
        style={dashStyles.circContainer}
        onLayout={(e) => {
          circContainerYRef.current = e.nativeEvent.layout.y;
        }}
      >
        {/* Container Header: Text with underline only, no icon box or view more button */}
        <View style={dashStyles.circHeader}>
          <View style={dashStyles.circTitleWrap}>
            <Text style={dashStyles.circTitle}>Issues & Overdue</Text>
            <View style={dashStyles.circTitleUnderline} />
          </View>
        </View>

        {/* Feature Nav Switcher: Properly aligned 50/50 buttons without icons */}
        <View style={dashStyles.tabSwitchRow}>
          <TouchableOpacity
            style={[
              dashStyles.tabBtn,
              activeCircTab === 'DELAYED' && dashStyles.tabBtnActive,
            ]}
            onPress={() => handleTabPress('DELAYED')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                dashStyles.tabBtnText,
                activeCircTab === 'DELAYED' && dashStyles.tabBtnTextActive,
              ]}
              numberOfLines={1}
            >
              Overdue Delays
            </Text>
            <View
              style={[
                dashStyles.countBadge,
                activeCircTab === 'DELAYED'
                  ? { backgroundColor: '#1A1B1C' }
                  : { backgroundColor: '#F3F4F6' },
              ]}
            >
              <Text
                style={[
                  dashStyles.countBadgeText,
                  activeCircTab === 'DELAYED' ? { color: '#F4C430', fontWeight: '900' } : null,
                ]}
              >
                {sortedDelayed.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              dashStyles.tabBtn,
              activeCircTab === 'ISSUED' && dashStyles.tabBtnActive,
            ]}
            onPress={() => handleTabPress('ISSUED')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                dashStyles.tabBtnText,
                activeCircTab === 'ISSUED' && dashStyles.tabBtnTextActive,
              ]}
              numberOfLines={1}
            >
              Active Issues
            </Text>
            <View
              style={[
                dashStyles.countBadge,
                activeCircTab === 'ISSUED'
                  ? { backgroundColor: '#1A1B1C' }
                  : { backgroundColor: '#F3F4F6' },
              ]}
            >
              <Text
                style={[
                  dashStyles.countBadgeText,
                  activeCircTab === 'ISSUED' ? { color: '#F4C430', fontWeight: '900' } : null,
                ]}
              >
                {sortedIssued.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Top 5 Simple Items: USN, Student Name, Book Name, Overdue Delay */}
        <View style={{ gap: 8, marginTop: 12 }}>
          {top5List.length === 0 ? (
            <View style={dashStyles.emptyStateBox}>
              <MaterialCommunityIcons
                name={activeCircTab === 'DELAYED' ? 'check-decagram-outline' : 'bookshelf'}
                size={36}
                color={activeCircTab === 'DELAYED' ? '#026440' : '#9CA3AF'}
              />
              <Text style={dashStyles.emptyStateText}>
                {activeCircTab === 'DELAYED'
                  ? 'No overdue delays right now! All books returned on time.'
                  : 'No active book borrowings currently issued.'}
              </Text>
            </View>
          ) : (
            top5List.map((item, index) => (
              <TouchableOpacity
                key={item.id || index}
                style={[
                  dashStyles.simpleRowCard,
                  activeCircTab === 'DELAYED' && dashStyles.simpleRowCardDelayed,
                ]}
                onPress={() => onNavigate('issue', activeCircTab === 'DELAYED' ? 'OVERDUE' : 'ALL_LOANS')}
                activeOpacity={0.7}
              >
                {/* Left: USN Pill + Student Name */}
                <View style={dashStyles.simpleRowLeft}>
                  <View style={dashStyles.usnPill}>
                    <Text style={dashStyles.usnPillText}>{item.studentUsn}</Text>
                  </View>
                  <Text style={dashStyles.simpleStudentName} numberOfLines={1}>
                    {item.studentName}
                  </Text>
                </View>

                {/* Center / Book Name */}
                <View style={dashStyles.simpleRowCenter}>
                  <MaterialCommunityIcons name="book-open-outline" size={14} color="#6B7280" />
                  <Text style={dashStyles.simpleBookTitle} numberOfLines={1}>
                    {item.bookTitle}
                  </Text>
                </View>

                {/* Right: Delay / Due Status Badge */}
                <View style={dashStyles.simpleRowRight}>
                  {activeCircTab === 'DELAYED' ? (
                    <View style={dashStyles.simpleDelayBadge}>
                      <MaterialCommunityIcons name="alert-circle" size={12} color="#DC2626" />
                      <Text style={dashStyles.simpleDelayBadgeText}>{item.daysOverdue}d Delay</Text>
                    </View>
                  ) : item.isDueToday ? (
                    <View style={[dashStyles.simpleDelayBadge, { backgroundColor: '#FFF4C7' }]}>
                      <Text style={[dashStyles.simpleDelayBadgeText, { color: '#B45309' }]}>Due Today</Text>
                    </View>
                  ) : (
                    <Text style={dashStyles.simpleDaysLeftText}>{item.daysRemaining}d Left</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}

          {/* View More Button: only shown if there are remaining records */}
          {remainingCount > 0 && (
            <TouchableOpacity
              style={dashStyles.viewMoreButton}
              onPress={() => onNavigate('issue', activeCircTab === 'DELAYED' ? 'OVERDUE' : 'ALL_LOANS')}
              activeOpacity={0.8}
            >
              <Text style={dashStyles.viewMoreButtonText}>
                View More ({remainingCount} more)
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color="#171717" />
            </TouchableOpacity>
          )}
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
            </View>
          </View>
          {/* Custom Dual Bar Chart */}
          <View style={dashStyles.chartContainer}>
            {circulationWeekData.map((bar, i) => (
              <View key={i} style={dashStyles.chartCol}>
                <View style={dashStyles.barPair}>
                  <View style={[dashStyles.barIssued, { height: bar.issuedHeight }]} />
                  <View style={[dashStyles.barReturned, { height: bar.returnedHeight }]} />
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

        {/* Quick Actions (Replacing Recent Book Activity) */}
        <View style={dashStyles.cardBoxFlex}>
          <View style={dashStyles.cardBoxHeader}>
            <View>
              <Text style={dashStyles.cardBoxTitle}>Quick Actions</Text>
        
            </View>
          </View>

          <View style={dashStyles.quickGrid}>
            <TouchableOpacity
              style={[dashStyles.qaBtn, dashStyles.qaGold]}
              onPress={() => onNavigate('issue', 'ISSUE')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="book-arrow-up-outline" size={17} color="#171717" />
              <Text style={dashStyles.qaText}>Issue Book</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dashStyles.qaBtn, dashStyles.qaGold]}
              onPress={onAddBook}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="book-plus-outline" size={17} color="#171717" />
              <Text style={dashStyles.qaText}>Add Book</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dashStyles.qaBtn, dashStyles.qaGold]}
              onPress={() => onNavigate('issue', 'RETURN')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="book-arrow-down-outline" size={17} color="#171717" />
              <Text style={dashStyles.qaText}>Return / Renew</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dashStyles.qaBtn, dashStyles.qaGold]}
              onPress={() => onNavigate('fines')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cash-multiple" size={17} color="#171717" />
              <Text style={dashStyles.qaText}>Fine Records</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dashStyles.qaBtn, dashStyles.qaGold]}
              onPress={() => onNavigate('pyqs')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="file-document-multiple-outline" size={17} color="#171717" />
              <Text style={dashStyles.qaText}>Question Papers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[dashStyles.qaBtn, dashStyles.qaGold]}
              onPress={() => onNavigate('students')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="account-group-outline" size={17} color="#171717" />
              <Text style={dashStyles.qaText}>Members</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 5. Section 2: Books by Category */}
      <View style={dashStyles.middleSectionRow}>
        {/* Books by Category */}
        <View style={dashStyles.cardBoxFlex}>
          <View style={dashStyles.cardBoxHeader}>
            <Text style={dashStyles.cardBoxTitle}>Books by Category</Text>
            <TouchableOpacity onPress={() => onNavigate('books')}>
              <Text style={dashStyles.viewAllBtn}>View All ›</Text>
            </TouchableOpacity>
          </View>
          {/* Donut graphic visual */}
          <View style={dashStyles.donutWrap}>
            <View style={dashStyles.donutRing}>
              <Text style={dashStyles.donutVal}>{books.length.toLocaleString()}</Text>
              <Text style={dashStyles.donutSub}>Total Books</Text>
            </View>
          </View>
          {/* Category Breakdown Grid */}
          <View style={dashStyles.catLegendGrid}>
            {categoryBreakdown.map((cat, idx) => (
              <View key={idx} style={dashStyles.catItem}>
                <View style={[dashStyles.legendDot, { backgroundColor: cat.color }]} />
                <Text style={dashStyles.catName} numberOfLines={1}>{cat.name}</Text>
                <Text style={dashStyles.catPct}>{cat.pct}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 7. Today's Reminders Section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
        <Text style={dashStyles.cardBoxTitle}>Today's Reminders</Text>
      </View>

      <View style={{ gap: 10 }}>
        {dynamicReminders.map((rem) => (
          <View key={rem.id} style={dashStyles.reminderCard}>
            <Text style={dashStyles.reminderText}>{rem.text}</Text>
            <TouchableOpacity onPress={rem.onAction} activeOpacity={0.7}>
              <Text style={{ fontSize: 12, fontFamily: FontFamily.bold, color: rem.color, textDecorationLine: 'underline' }}>
                {rem.actionText}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* 8. Footer */}
      <View style={dashStyles.footer}>
            
      </View>
    </ScrollView>
  );
};

const dashStyles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 },
  titleText: { fontSize: 24, fontFamily: FontFamily.extrabold, color: '#111827' },
  subtitleText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 2 },

  // Circulation Container Styles
  circContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  circHeader: {
    marginBottom: 16,
  },
  circTitleWrap: {
    alignSelf: 'flex-start',
  },
  circTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  circTitleUnderline: {
    height: 3,
    backgroundColor: '#F4C430',
    borderRadius: 2,
    marginTop: 4,
    width: '100%',
  },
  circHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  circActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  circActionBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#D97706',
  },
  tabSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    paddingBottom: 10,
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  tabBtnActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnActiveDelayed: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FECACA',
  },
  tabBtnActiveIssued: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#4B5563',
  },
  tabBtnTextActive: {
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  tabBtnTextActiveDelayed: {
    color: '#DC2626',
    fontFamily: FontFamily.bold,
  },
  tabBtnTextActiveIssued: {
    color: '#B45309',
    fontFamily: FontFamily.bold,
  },
  countBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 14,
  },

  // Simplified row card styles (USN, Student, Book, Due)
  simpleRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  simpleRowCardDelayed: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFCFA',
  },
  simpleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
    maxWidth: '35%',
  },
  usnPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  usnPillText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#1F2937',
  },
  simpleStudentName: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
    flex: 1,
  },
  simpleRowCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  simpleBookTitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.medium,
    color: '#374151',
    flex: 1,
  },
  simpleRowRight: {
    alignItems: 'flex-end',
  },
  simpleDelayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  simpleDelayBadgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },
  simpleDaysLeftText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#026440',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 5,
    backgroundColor: '#FFFBEA',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 6,
  },
  viewMoreButtonText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },

  // Item Card Styles
  circCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  circCardDelayed: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFCFA',
  },
  circCardIssued: {
    borderColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  cardLeftSec: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardBookCover: {
    width: 44,
    height: 58,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  cardBookFallback: {
    width: 44,
    height: 58,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  cardFallbackTitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 2,
  },
  cardBookTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  cardBookMeta: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  studentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  studentAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  studentMeta: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  cardRightSec: {
    alignItems: 'flex-end',
    gap: 6,
  },
  dateMetaText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  delayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  delayBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#026440',
  },
  dueBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#026440',
  },
  circItemBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FEF3C7',
    borderRadius: 5,
  },
  circItemBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#92400E',
  },
  emptyStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Stats Grid Styles
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 20 },
  statCard: { flex: 1, minWidth: 200, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#F3F4F6', elevation: 1 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  statIconBg: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#4B5563' },
  statVal: { fontSize: 24, fontFamily: FontFamily.extrabold, color: '#111827', marginBottom: 4 },
  statGrowthPositive: { fontSize: 12, fontFamily: FontFamily.bold, color: '#026440' },
  statGrowthNegative: { fontSize: 12, fontFamily: FontFamily.bold, color: '#DC2626' },

  // Middle Section Row
  middleSectionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 20 },
  cardBoxFlex: { flex: 1, minWidth: 320, backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, borderWidth: 1, borderColor: '#E8E5DC', elevation: 1 },
  cardBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardBoxTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827' },
  dropdownChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F9FAFB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC' },
  dropdownText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#374151' },
  viewAllBtn: { fontSize: 12, fontFamily: FontFamily.bold, color: '#171717' },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 130, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  chartCol: { alignItems: 'center', gap: 6 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barIssued: { width: 8, backgroundColor: '#F4C430', borderRadius: 4 },
  barReturned: { width: 8, backgroundColor: '#171717', borderRadius: 4 },
  chartDayLabel: { fontSize: 11, color: '#6B7280', fontFamily: FontFamily.medium },
  chartLegendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: '#4B5563', fontFamily: FontFamily.medium },
  tableHeader: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 6 },
  thCell: { fontSize: 11, fontFamily: FontFamily.bold, color: '#9CA3AF' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  bookThumb: { width: 28, height: 38, borderRadius: 4, backgroundColor: '#E5E7EB' },
  bookName: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  tdText: { fontSize: 12, color: '#4B5563', fontFamily: FontFamily.regular },
  actionPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start' },
  pillIssued: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#026440' },
  pillReturned: { backgroundColor: '#DBEAFE' },
  pillText: { fontSize: 10, fontFamily: FontFamily.bold },
  pillTextIssued: { color: '#026440' },
  pillTextReturned: { color: '#2563EB' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  rankCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: 12, fontFamily: FontFamily.bold, color: '#D97706' },
  authorName: { fontSize: 11, color: '#6B7280', fontFamily: FontFamily.regular },
  borrowCount: { fontSize: 14, fontFamily: FontFamily.bold, color: '#111827' },
  donutWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  donutRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 14, borderColor: '#F4C430', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  donutVal: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#111827' },
  donutSub: { fontSize: 11, color: '#6B7280', fontFamily: FontFamily.regular },
  catLegendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  catItem: { width: '47%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  catName: { flex: 1, fontSize: 12, color: '#4B5563', fontFamily: FontFamily.medium },
  catPct: { fontSize: 12, fontFamily: FontFamily.bold, color: '#111827' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  qaBtn: { width: '48%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FFFFFF', borderRadius: 5, paddingVertical: 9, paddingHorizontal: 6, borderWidth: 1, borderColor: '#E8E5DC', shadowColor: '#171717', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  qaGold: { backgroundColor: '#FFF4C7', borderColor: '#F4C430' },
  qaText: { fontSize: 12, fontFamily: FontFamily.bold, color: '#171717', textAlign: 'center' },
  reminderCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: '#FFFFFF', padding: 14, borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC' },
  reminderText: { flex: 1, fontSize: 13, color: '#374151', fontFamily: FontFamily.medium },
  remActionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 30, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB', flexWrap: 'wrap', gap: 10 },
  footerText: { fontSize: 12, color: '#9CA3AF', fontFamily: FontFamily.regular },
});
