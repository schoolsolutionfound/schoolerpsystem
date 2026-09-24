import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { Book, BookCopy, Loan, StudentProfile, Fine } from '../../types';

export interface LibrarianDashboardViewProps {
  books: Book[];
  copies: BookCopy[];
  loans: Loan[];
  students: StudentProfile[];
  fines: Fine[];
  onNavigate: (tab: string) => void;
  onAddBook: () => void;
}

export const LibrarianDashboardView: React.FC<LibrarianDashboardViewProps> = ({
  books,
  copies,
  loans,
  students,
  fines,
  onNavigate,
  onAddBook,
}) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  return (
    <ScrollView
      style={[dashStyles.container, isMobile && { padding: 12 }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
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
          <Text style={[dashStyles.heroTitle, isMobile && { fontSize: 20 }]}>
            Knowledge Empowers <Text style={{ color: '#EAB308' }}>Futures</Text>
          </Text>
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
            <Text style={dashStyles.statLabel} numberOfLines={1}>
              Total Books
            </Text>
          </View>
          <Text style={dashStyles.statVal}>12,460</Text>
          <Text style={dashStyles.statGrowthPositive}>
            ▲ +2.5% <Text style={{ color: '#6B7280', fontWeight: '400' }}>from last month</Text>
          </Text>
        </View>

        {/* Registered Members */}
        <View style={[dashStyles.statCard, isMobile && { minWidth: '47%', padding: 12 }]}>
          <View style={dashStyles.statHeader}>
            <View style={[dashStyles.statIconBg, { backgroundColor: '#F3F4F6' }]}>
              <MaterialCommunityIcons name="account-group" size={18} color="#374151" />
            </View>
            <Text style={dashStyles.statLabel} numberOfLines={1}>
              Reg. Members
            </Text>
          </View>
          <Text style={dashStyles.statVal}>1,238</Text>
          <Text style={dashStyles.statGrowthPositive}>
            ▲ +4.1% <Text style={{ color: '#6B7280', fontWeight: '400' }}>from last month</Text>
          </Text>
        </View>

        {/* Books Issued */}
        <View style={[dashStyles.statCard, isMobile && { minWidth: '47%', padding: 12 }]}>
          <View style={dashStyles.statHeader}>
            <View style={[dashStyles.statIconBg, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color="#D97706" />
            </View>
            <Text style={dashStyles.statLabel} numberOfLines={1}>
              Books Issued
            </Text>
          </View>
          <Text style={dashStyles.statVal}>386</Text>
          <Text style={dashStyles.statGrowthPositive}>
            ▲ +12% <Text style={{ color: '#6B7280', fontWeight: '400' }}>this month</Text>
          </Text>
        </View>

        {/* Books Overdue */}
        <View style={[dashStyles.statCard, isMobile && { minWidth: '47%', padding: 12 }]}>
          <View style={dashStyles.statHeader}>
            <View style={[dashStyles.statIconBg, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="keyboard-return" size={18} color="#DC2626" />
            </View>
            <Text style={dashStyles.statLabel} numberOfLines={1}>
              Books Overdue
            </Text>
          </View>
          <Text style={dashStyles.statVal}>28</Text>
          <Text style={dashStyles.statGrowthNegative}>
            ▲ +3 <Text style={{ color: '#DC2626', fontStyle: 'italic' }}>attention</Text>
          </Text>
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
                    <Text style={[dashStyles.bookName, { flex: 1 }]} numberOfLines={1}>
                      {row.title}
                    </Text>
                  </View>
                  <Text style={[dashStyles.tdText, { flex: 1.5, paddingRight: 4 }]} numberOfLines={1}>
                    {row.member}
                  </Text>
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[dashStyles.actionPill, row.action === 'Issued' ? dashStyles.pillIssued : dashStyles.pillReturned]}>
                      <Text style={[dashStyles.pillText, row.action === 'Issued' ? dashStyles.pillTextIssued : dashStyles.pillTextReturned]}>
                        {row.action}
                      </Text>
                    </View>
                  </View>
                  <Text style={[dashStyles.tdText, { flex: 1.1, textAlign: 'right', fontSize: 11, color: '#6B7280' }]} numberOfLines={1}>
                    {row.date}
                  </Text>
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
