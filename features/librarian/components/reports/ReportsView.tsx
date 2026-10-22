import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
  RefreshControl,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { Book, BookCopy, Loan, Fine, StudentProfile } from '../../types';
import { generateLibraryPdfReport } from '../../utils/pdfGenerator';
import { FontFamily } from '../../../../constants/fonts';

const TIME_RANGES = [
  { key: 'MONTH', label: 'This Month', sub: 'Past 30 days', icon: 'calendar' },
  { key: 'YEAR', label: 'Academic Year', sub: 'Current academic cycle', icon: 'calendar' },
  { key: 'ALL', label: 'All Time', sub: 'Lifetime library metrics', icon: 'clock' },
] as const;

interface ReportsViewProps {
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  fines: Fine[];
  students: StudentProfile[];
  commonStyles: any;
  fineStyles: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const reportStyles = StyleSheet.create({
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    height: 38,
    minWidth: 125,
    borderRadius: 5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  exportBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  dropdownRow: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#6B7280',
    marginBottom: 5,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownBtnVal: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFDF7',
  },
  modalTitle: {
    fontSize: 14.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  optionItemSelected: {
    backgroundColor: '#FFFDF0',
    borderColor: '#F4C430',
  },
  optionIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: '#171717',
  },
  optionLabelSelected: {
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  optionSub: {
    fontSize: 10.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
    gap: 2,
    overflow: 'hidden',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    gap: 4,
  },
  kpiLabel: {
    flex: 1,
    flexShrink: 1,
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#6B6B6B',
    lineHeight: 14,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
    marginVertical: 2,
  },
  kpiSub: {
    fontSize: 9.5,
    fontFamily: FontFamily.medium,
    color: '#8A8A8E',
    lineHeight: 12,
  },
});

export function ReportsView({
  books,
  copies,
  loans,
  fines,
  students,
  commonStyles,
  onRefresh,
  isRefreshing,
}: ReportsViewProps) {
  const [timeRange, setTimeRange] = useState<'MONTH' | 'YEAR' | 'ALL'>('MONTH');
  const [isExporting, setIsExporting] = useState(false);
  const [periodModalOpen, setPeriodModalOpen] = useState(false);

  // Dynamic filter for loans by selected time range
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      if (timeRange === 'ALL') return true;
      const dateStr = l.issueDate || l.issuedAt || l.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      if (timeRange === 'MONTH') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= startOfMonth;
      }
      if (timeRange === 'YEAR') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return d >= startOfYear;
      }
      return true;
    });
  }, [loans, timeRange]);

  // Dynamic filter for fines by selected time range
  const filteredFines = useMemo(() => {
    return fines.filter((f) => {
      if (timeRange === 'ALL') return true;
      const dateStr = f.createdAt;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      const now = new Date();
      if (timeRange === 'MONTH') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return d >= startOfMonth;
      }
      if (timeRange === 'YEAR') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return d >= startOfYear;
      }
      return true;
    });
  }, [fines, timeRange]);

  // Dynamic Financial Metrics based on selected time range
  const totalFinesCollected = useMemo(() => {
    return filteredFines.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
  }, [filteredFines]);

  const totalFinesOutstanding = useMemo(() => {
    return filteredFines
      .filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID')
      .reduce((acc, f) => acc + (f.amount - (f.paidAmount || 0)), 0);
  }, [filteredFines]);

  // Dynamic Top Borrowed / Popular Books
  const topBorrowedBooks = useMemo(() => {
    const counts: { [bookId: string]: number } = {};
    filteredLoans.forEach((l) => {
      if (l.bookId) counts[l.bookId] = (counts[l.bookId] || 0) + 1;
    });

    const rankedIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

    if (rankedIds.length > 0) {
      return rankedIds.map((bId) => {
        const bk = books.find((b) => b.id === bId);
        return {
          id: bId,
          title: bk?.title || 'Unknown Title',
          subject: bk?.subject || 'General',
          count: counts[bId],
        };
      }).slice(0, 5);
    }

    // Fallback: Check all-time loans if current period has 0
    const allCounts: { [bookId: string]: number } = {};
    loans.forEach((l) => {
      if (l.bookId) allCounts[l.bookId] = (allCounts[l.bookId] || 0) + 1;
    });

    const allRankedIds = Object.keys(allCounts).sort((a, b) => allCounts[b] - allCounts[a]);
    if (allRankedIds.length > 0) {
      return allRankedIds.map((bId) => {
        const bk = books.find((b) => b.id === bId);
        return {
          id: bId,
          title: bk?.title || 'Unknown Title',
          subject: bk?.subject || 'General',
          count: allCounts[bId],
        };
      }).slice(0, 5);
    }

    // Fallback to initial catalog books
    return books.slice(0, 5).map((bk) => ({
      id: bk.id,
      title: bk.title,
      subject: bk.subject || 'General',
      count: 0,
    }));
  }, [filteredLoans, loans, books]);

  // Export PDF Handler
  const handleExportReport = async (reportType: string) => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await generateLibraryPdfReport({
        reportType,
        timeRange,
        books,
        copies,
        loans,
        fines,
        students,
      });
    } catch (err: any) {
      Alert.alert('PDF Export Failed', err?.message || 'Could not generate PDF report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Export Popular Books as CSV
  const handleExportPopularCsv = () => {
    if (topBorrowedBooks.length === 0) {
      Alert.alert('No Data', 'No popular book records available to export.');
      return;
    }

    const headers = 'Rank,Book Title,Subject,Total Borrows\n';
    const rows = topBorrowedBooks
      .map(
        (item, idx) =>
          `"${idx + 1}","${item.title.replace(/"/g, '""')}","${item.subject.replace(/"/g, '""')}","${item.count}"`
      )
      .join('\n');
    const csvContent = headers + rows;

    if (Platform.OS === 'web') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `popular_books_${timeRange.toLowerCase()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      Alert.alert('CSV Exported', `Prepared CSV for ${topBorrowedBooks.length} books.`);
    }
  };

  const styles = commonStyles;

  return (
    <ScrollView
      style={styles.viewBodyContainer}
      contentContainerStyle={{ paddingBottom: 140 }}
      showsVerticalScrollIndicator={false}
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
      {/* Header Bar — Fixed Layout with non-jumping Export button */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 18, fontFamily: FontFamily.extrabold, color: '#171717' }}>
          Reports & Analytics
        </Text>

        <TouchableOpacity
          style={reportStyles.exportBtn}
          onPress={() => handleExportReport('Comprehensive Library Performance Report')}
          disabled={isExporting}
          activeOpacity={0.85}
        >
          
          <Text style={reportStyles.exportBtnText}>
            {isExporting ? 'Generating...' : 'Export Report'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Time Period Filter Dropdown (Report type fixed to Summary) */}
      <View style={reportStyles.dropdownRow}>
        <Text style={reportStyles.dropdownLabel}>Time Period</Text>
        <TouchableOpacity
          style={reportStyles.dropdownBtn}
          onPress={() => setPeriodModalOpen(true)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
            <Feather name="calendar" size={15} color="#D97706" />
            <Text style={reportStyles.dropdownBtnVal} numberOfLines={1}>
              {TIME_RANGES.find((r) => r.key === timeRange)?.label || 'This Month'}
            </Text>
            <Text style={{ fontSize: 11, color: '#6B7280', fontFamily: FontFamily.regular }}>
              ({TIME_RANGES.find((r) => r.key === timeRange)?.sub || ''})
            </Text>
          </View>
          <Feather name="chevron-down" size={15} color="#171717" />
        </TouchableOpacity>
      </View>

      {/* Primary KPI Grid (Attendance Theme with 5px radius) */}
      <View style={[reportStyles.kpiGrid, { marginBottom: 16 }]}>
        <View style={reportStyles.kpiCard}>
          <View style={reportStyles.kpiHeaderRow}>
            <Text style={reportStyles.kpiLabel} numberOfLines={2}>
              Total Fines
            </Text>
          </View>
          <Text style={reportStyles.kpiValue}>₹{totalFinesCollected.toFixed(2)}</Text>
          <Text style={reportStyles.kpiSub} numberOfLines={2}>
            Revenue collected
          </Text>
        </View>

        <View style={reportStyles.kpiCard}>
          <View style={reportStyles.kpiHeaderRow}>
            <Text style={reportStyles.kpiLabel} numberOfLines={2}>
              Fine Due
            </Text>
          </View>
          <Text style={reportStyles.kpiValue}>₹{totalFinesOutstanding.toFixed(2)}</Text>
          <Text style={reportStyles.kpiSub} numberOfLines={2}>
            Pending dues
          </Text>
        </View>
      </View>

      {/* Summary Content Container */}
      <View style={{ gap: 16, paddingBottom: 40 }}>
        {/* Dynamic Popular Books Container (5px radius) */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#E8E5DC',
            gap: 12,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <View>
              <Text style={{ fontSize: 15, fontFamily: FontFamily.bold, color: '#171717' }}>
                Popular Books
              </Text>
              
            </View>

            <TouchableOpacity
              onPress={handleExportPopularCsv}
              style={{
                paddingVertical: 5,
                paddingHorizontal: 8,
                backgroundColor: '#FFFDF0',
                borderWidth: 1,
                borderColor: '#FDE047',
                borderRadius: 5,
              }}
              activeOpacity={0.75}
            >
              <Text style={{ fontSize: 11.5, fontFamily: FontFamily.bold, color: '#B45309' }}>
                Export CSV
              </Text>
            </TouchableOpacity>
          </View>

          {topBorrowedBooks.length === 0 ? (
            <View style={{ paddingVertical: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#6B7280', fontFamily: FontFamily.regular }}>
                No book borrowings recorded for this time period.
              </Text>
            </View>
          ) : (
            topBorrowedBooks.map((item, idx) => (
              <View
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingVertical: 8,
                  borderBottomWidth: idx < topBorrowedBooks.length - 1 ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                }}
              >
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 5,
                    backgroundColor: idx === 0 ? '#F4C430' : '#FFF4C7',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: FontFamily.extrabold, color: '#171717' }}>
                    #{idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#171717', lineHeight: 18 }}>
                    {item.title}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FontFamily.regular, color: '#6B7280', marginTop: 2 }}>
                    Subject: {item.subject}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 12, fontFamily: FontFamily.bold, color: '#171717' }}>
                    {item.count} borrow{item.count !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Instant Report Generator (5px radius) */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 5,
            borderWidth: 1,
            borderColor: '#E8E5DC',
            gap: 12,
          }}
        >
          <View>
            <Text style={{ fontSize: 15, fontFamily: FontFamily.bold, color: '#171717' }}>
              Instant Report Generator
            </Text>
           
          </View>

          <View style={{ gap: 10 }}>
            {/* Overdue Report Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFDF7',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#E8E5DC',
              }}
              onPress={() => handleExportReport('Library Overdue Loans Report')}
              activeOpacity={0.7}
              disabled={isExporting}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' }}>
                  Overdue Report
                </Text>
                
              </View>
              <Feather name="download" size={16} color="#D97706" style={{ marginLeft: 8 }} />
            </TouchableOpacity>

            {/* Fine Receipts Ledger Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#FFFDF7',
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: '#E8E5DC',
              }}
              onPress={() => handleExportReport('Fine Receipts Ledger')}
              activeOpacity={0.7}
              disabled={isExporting}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' }}>
                  Fine Receipts Ledger
                </Text>
                
              </View>
              <Feather name="download" size={16} color="#D97706" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Analytics Period Selection Modal (5px radius) */}
      <Modal
        visible={periodModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPeriodModalOpen(false)}
      >
        <TouchableOpacity
          style={reportStyles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setPeriodModalOpen(false)}
        >
          <View style={reportStyles.modalSheet}>
            <View style={reportStyles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={reportStyles.modalTitle}>Select Period</Text>
              </View>
              <TouchableOpacity onPress={() => setPeriodModalOpen(false)} hitSlop={8}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 12, gap: 8 }}>
              {TIME_RANGES.map((item) => {
                const isSelected = timeRange === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      reportStyles.optionItem,
                      isSelected && reportStyles.optionItemSelected,
                    ]}
                    onPress={() => {
                      setTimeRange(item.key as any);
                      setPeriodModalOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        reportStyles.optionIconBadge,
                        isSelected && { backgroundColor: '#F4C430' },
                      ]}
                    >
                      <Feather
                        name={item.icon as any}
                        size={16}
                        color={isSelected ? '#171717' : '#6B7280'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          reportStyles.optionLabel,
                          isSelected && reportStyles.optionLabelSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={reportStyles.optionSub}>{item.sub}</Text>
                    </View>
                    {isSelected && (
                      <Feather name="check" size={18} color="#D97706" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}
