import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { Loan, Fine, Book, BookCopy, StudentProfile } from '../../types';
import { FontFamily } from '../../../../constants/fonts';

interface NotificationsViewProps {
  loans: Loan[];
  fines: Fine[];
  books: Book[];
  copies: BookCopy[];
  students: StudentProfile[];
  commonStyles: any;
  onNavigate: (tab: string, subMode?: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

type NotifFilter = 'ALL' | 'OVERDUE' | 'FINES' | 'SYSTEM';

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  loans,
  fines,
  books,
  copies,
  students,
  commonStyles,
  onNavigate,
  onRefresh,
  isRefreshing,
}) => {
  const [filter, setFilter] = useState<NotifFilter>('ALL');

  // Compute live data
  const overdueLoans = useMemo(
    () => loans.filter((l) => l.status === 'OVERDUE'),
    [loans]
  );

  const unpaidFines = useMemo(
    () => fines.filter((f) => f.status === 'UNPAID' || f.status === 'PARTIALLY_PAID'),
    [fines]
  );

  const unpaidFinesTotal = useMemo(
    () => unpaidFines.reduce((sum, f) => sum + (f.amount - (f.paidAmount || 0)), 0),
    [unpaidFines]
  );

  const totalAlertsCount =
    (overdueLoans.length > 0 ? 1 : 0) +
    (unpaidFinesTotal > 0 ? 1 : 0) +
    2; // catalog + system announcements

  return (
    <ScrollView
      style={commonStyles.viewBodyContainer}
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
      {/* Top Header */}
      <View style={notifPageStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={notifPageStyles.pageTitle}>Notifications</Text>
          
        </View>
      </View>

      {/* Filter Switcher Pills */}
      <View style={notifPageStyles.filterRow}>
        <TouchableOpacity
          style={[notifPageStyles.filterPill, filter === 'ALL' && notifPageStyles.filterPillActive]}
          onPress={() => setFilter('ALL')}
          activeOpacity={0.8}
        >
          <Text style={[notifPageStyles.filterPillText, filter === 'ALL' && notifPageStyles.filterPillTextActive]}>
            All Notifications
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[notifPageStyles.filterPill, filter === 'OVERDUE' && notifPageStyles.filterPillActive]}
          onPress={() => setFilter('OVERDUE')}
          activeOpacity={0.8}
        >
          <Text style={[notifPageStyles.filterPillText, filter === 'OVERDUE' && notifPageStyles.filterPillTextActive]}>
            Overdue ({overdueLoans.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[notifPageStyles.filterPill, filter === 'FINES' && notifPageStyles.filterPillActive]}
          onPress={() => setFilter('FINES')}
          activeOpacity={0.8}
        >
          <Text style={[notifPageStyles.filterPillText, filter === 'FINES' && notifPageStyles.filterPillTextActive]}>
            Fines ({unpaidFines.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[notifPageStyles.filterPill, filter === 'SYSTEM' && notifPageStyles.filterPillActive]}
          onPress={() => setFilter('SYSTEM')}
          activeOpacity={0.8}
        >
          <Text style={[notifPageStyles.filterPillText, filter === 'SYSTEM' && notifPageStyles.filterPillTextActive]}>
            System & Catalog
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <View style={notifPageStyles.listContainer}>
        {/* 1. Overdue Books Alert */}
        {(filter === 'ALL' || filter === 'OVERDUE') && (
          overdueLoans.length > 0 ? (
            <View style={[notifPageStyles.card, notifPageStyles.cardDanger]}>
              <View style={notifPageStyles.cardContent}>
                <View style={notifPageStyles.cardHeaderRow}>
                  <Text style={notifPageStyles.cardTitle}>
                    {overdueLoans.length} Overdue Book Borrowing{overdueLoans.length > 1 ? 's' : ''}
                  </Text>
                  <View style={notifPageStyles.badgeDanger}>
                    <Text style={notifPageStyles.badgeDangerText}>Urgent Action</Text>
                  </View>
                </View>
                <Text style={notifPageStyles.cardSub}>
                  {(() => {
                    const topLoan = overdueLoans[0];
                    const b = topLoan ? books.find((bk) => bk.id === topLoan.bookId) : null;
                    const s = topLoan ? students.find((st) => st.id === topLoan.studentId) : null;
                    return b
                      ? `"${b.title}" borrowed by ${s?.fullName || 'student'} has exceeded the due return window.`
                      : 'Students have exceeded the return grace period for borrowed library titles.';
                  })()}
                </Text>

                <TouchableOpacity
                  style={notifPageStyles.actionBtnDanger}
                  onPress={() => onNavigate('fines', 'OVERDUE')}
                  activeOpacity={0.8}
                >
                  <Text style={notifPageStyles.actionBtnDangerText}>View Overdue Delays ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            filter === 'OVERDUE' && (
              <View style={[notifPageStyles.card, notifPageStyles.cardSuccess]}>
                <View style={notifPageStyles.cardContent}>
                  <Text style={notifPageStyles.cardTitle}>All Borrowed Books on Schedule</Text>
                  <Text style={notifPageStyles.cardSub}>
                    Zero delayed loans pending return across all member accounts.
                  </Text>
                </View>
              </View>
            )
          )
        )}

        {/* 2. Outstanding Fines Notification */}
        {(filter === 'ALL' || filter === 'FINES') && (
          unpaidFinesTotal > 0 ? (
            <View style={[notifPageStyles.card, notifPageStyles.cardWarning]}>
              <View style={notifPageStyles.cardContent}>
                <View style={notifPageStyles.cardHeaderRow}>
                  <Text style={notifPageStyles.cardTitle}>
                    ₹{unpaidFinesTotal.toFixed(2)} Outstanding Fines
                  </Text>
                  <View style={notifPageStyles.badgeWarning}>
                    <Text style={notifPageStyles.badgeWarningText}>
                      {unpaidFines.length} Pending
                    </Text>
                  </View>
                </View>
                <Text style={notifPageStyles.cardSub}>
                  {unpaidFines.length} fine records awaiting collection or administrative waiver.
                </Text>

                <TouchableOpacity
                  style={notifPageStyles.actionBtnWarning}
                  onPress={() => onNavigate('fines', 'FINES')}
                  activeOpacity={0.8}
                >
                  <Text style={notifPageStyles.actionBtnWarningText}>Manage Fine Records ›</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            filter === 'FINES' && (
              <View style={[notifPageStyles.card, notifPageStyles.cardSuccess]}>
                <View style={notifPageStyles.cardContent}>
                  <Text style={notifPageStyles.cardTitle}>No Pending Fines</Text>
                  <Text style={notifPageStyles.cardSub}>
                    All student library dues and damage fines have been settled or waived.
                  </Text>
                </View>
              </View>
            )
          )
        )}

        {/* 3. Catalog Inventory Status */}
        {(filter === 'ALL' || filter === 'SYSTEM') && (
          <View style={notifPageStyles.card}>
            <View style={notifPageStyles.cardContent}>
              <View style={notifPageStyles.cardHeaderRow}>
                <Text style={notifPageStyles.cardTitle}>Library Catalog Status</Text>
                <View style={notifPageStyles.badgeNeutral}>
                  <Text style={notifPageStyles.badgeNeutralText}>Catalog Info</Text>
                </View>
              </View>
              <Text style={notifPageStyles.cardSub}>
                {books.length} unique book titles and {copies.length} physical copies actively indexed and available in the library repository.
              </Text>

              <TouchableOpacity
                style={notifPageStyles.actionBtnNeutral}
                onPress={() => onNavigate('books')}
                activeOpacity={0.8}
              >
                <Text style={notifPageStyles.actionBtnNeutralText}>Browse Catalog ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 4. Library Notices & Announcements */}
        {(filter === 'ALL' || filter === 'SYSTEM') && (
          <View style={notifPageStyles.card}>
            <View style={notifPageStyles.cardContent}>
              <View style={notifPageStyles.cardHeaderRow}>
                <Text style={notifPageStyles.cardTitle}>Library Announcements & Notices</Text>
                <View style={notifPageStyles.badgeNeutral}>
                  <Text style={notifPageStyles.badgeNeutralText}>Operational</Text>
                </View>
              </View>
              <Text style={notifPageStyles.cardSub}>
                Library circulation and issue desk are active. View all published notices and announcements.
              </Text>

              <TouchableOpacity
                style={notifPageStyles.actionBtnNeutral}
                onPress={() => onNavigate('announcements')}
                activeOpacity={0.8}
              >
                <Text style={notifPageStyles.actionBtnNeutralText}>Open Announcements ›</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const notifPageStyles = StyleSheet.create({
  headerRow: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
  },
  pageSub: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  filterPillActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  filterPillText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: '#6B7280',
  },
  filterPillTextActive: {
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  listContainer: {
    gap: 12,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardDanger: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF8F8',
  },
  cardWarning: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  cardSuccess: {
    borderColor: '#026440',
    backgroundColor: '#F0FDF4',
  },
  cardContent: {
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  cardSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    lineHeight: 18,
  },
  badgeDanger: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeDangerText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#DC2626',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeWarningText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#D97706',
  },
  badgeNeutral: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  badgeNeutralText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bold,
    color: '#4B5563',
  },
  actionBtnDanger: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 4,
  },
  actionBtnDangerText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  actionBtnWarning: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 4,
  },
  actionBtnWarningText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  actionBtnNeutral: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 5,
    marginTop: 4,
  },
  actionBtnNeutralText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#1F2937',
  },
});
