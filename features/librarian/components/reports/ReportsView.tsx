import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { Book, BookCopy, Loan, Fine, StudentProfile } from '../../types';

interface ReportsViewProps {
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  fines: Fine[];
  students: StudentProfile[];
  commonStyles: any;
  fineStyles: any;
}

export function ReportsView({ books, copies, loans, fines, students, commonStyles, fineStyles }: ReportsViewProps) {
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

  const styles = commonStyles;

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
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#FCA5A5',
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
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#6EE7B7',
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
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: '#93C5FD',
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
