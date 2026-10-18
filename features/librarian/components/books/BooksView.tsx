import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { Book, BookCopy, Category, Author } from '../../types';
import { FontFamily } from '../../../../constants/fonts';

export interface BooksViewProps {
  books: Book[];
  copies: BookCopy[];
  categories: Category[];
  authors: Author[];
  onSelectBook: (b: Book) => void;
  onAddBook: () => void;
  onDeleteBook: (bookId: string) => void;
  commonStyles?: any;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BooksView: React.FC<BooksViewProps> = ({
  books,
  copies,
  categories,
  onSelectBook,
  onAddBook,
  onDeleteBook,
  onRefresh,
  isRefreshing = false,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        !search.trim() ||
        (b.title ? b.title.toLowerCase().includes(search.toLowerCase()) : false) ||
        (b.isbn ? b.isbn.toLowerCase().includes(search.toLowerCase()) : false);
      const matchCat = selectedCat === 'ALL' || b.categoryId === selectedCat;
      return matchSearch && matchCat;
    });
  }, [books, search, selectedCat]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCat]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const startRange = filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRange = Math.min(currentPage * ITEMS_PER_PAGE, filtered.length);

  return (
    <View style={styles.viewBodyContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={{ paddingBottom: 110 }}
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
          {/* Header Bar */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Book Entry</Text>
            </View>

            {/* Clean Add Book Button with standard Plus symbol */}
            <TouchableOpacity style={styles.addBookBtn} onPress={onAddBook} activeOpacity={0.8}>
         
              <Text style={styles.addBookBtnText}>Add Book</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{ gap: 10, marginBottom: 14 }}>
            <View style={styles.searchBox}>
              <Feather name="search" size={17} color="#6B7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by title or Book Number..."
                placeholderTextColor="#475569"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Feather name="x" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Chips - Full Width Dedicated Scroll Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
            >
              <TouchableOpacity
                style={[styles.chip, selectedCat === 'ALL' && styles.chipActive]}
                onPress={() => setSelectedCat('ALL')}
              >
                <Text style={[styles.chipText, selectedCat === 'ALL' && styles.chipTextActive]}>
                  All ({books.length})
                </Text>
              </TouchableOpacity>
              {categories.map((c) => {
                const count = books.filter((b) => b.categoryId === c.id).length;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, selectedCat === c.id && styles.chipActive]}
                    onPress={() => setSelectedCat(c.id)}
                  >
                    <Text style={[styles.chipText, selectedCat === c.id && styles.chipTextActive]}>
                      {c.name} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

          </View>

          {/* Book Catalog List */}
          {filtered.length === 0 ? (
            <View style={bookStyles.emptyBox}>
              <MaterialCommunityIcons name="book-search-outline" size={44} color="#9CA3AF" />
              <Text style={bookStyles.emptyTitle}>No books found</Text>
              <Text style={bookStyles.emptySub}>
                {search.length > 0 || selectedCat !== 'ALL'
                  ? 'Try adjusting your search or category filter.'
                  : 'Start by adding your first book to the catalog.'}
              </Text>
              <TouchableOpacity style={styles.addBookBtn} onPress={onAddBook} activeOpacity={0.8}>
                <Feather name="plus" size={17} color="#171717" />
                <Text style={styles.addBookBtnText}>Add Book</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={bookStyles.listContainer}>
              {paginatedBooks.map((item) => {
                const bookCopies = copies.filter((c) => c.bookId === item.id);
                const availCopies =
                  item.availableCopies !== undefined
                    ? item.availableCopies
                    : bookCopies.filter((c) => c.status === 'AVAILABLE').length;
                const totalCopiesCount =
                  item.totalCopies !== undefined && item.totalCopies > 0
                    ? item.totalCopies
                    : bookCopies.length > 0
                    ? bookCopies.length
                    : 1;
                const cat = categories.find((c) => c.id === item.categoryId);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={bookStyles.listItemCard}
                    onPress={() => onSelectBook(item)}
                    activeOpacity={0.75}
                  >
                    {/* Thumbnail */}
                    <View style={bookStyles.listThumbWrap}>
                      {item.coverImage ? (
                        <Image source={{ uri: item.coverImage }} style={bookStyles.listThumb} resizeMode="cover" />
                      ) : (
                        <View style={bookStyles.listThumbFallback}>
                          <Feather name="book" size={17} color="#171717" />
                        </View>
                      )}
                    </View>

                    {/* Book Info */}
                    <View style={bookStyles.listInfoWrap}>
                      <Text style={bookStyles.listTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={bookStyles.listBookNo} numberOfLines={1}>
                        Book No: <Text style={{ fontWeight: '700', color: '#171717' }}>{item.isbn || 'N/A'}</Text>
                      </Text>
                      <View style={bookStyles.listMetaRow}>
                        {cat ? (
                          <>
                            <Text style={bookStyles.catText}>{cat.name}</Text>
                            <Text style={bookStyles.metaDot}>•</Text>
                          </>
                        ) : null}
                        <Text style={bookStyles.listCopiesText}>
                          {totalCopiesCount} {totalCopiesCount === 1 ? 'copy' : 'copies'}
                        </Text>
                      </View>
                    </View>

                    {/* Right: Availability & Actions (No background boxes or circles) */}
                    <View style={bookStyles.listRightCol}>
                      <Text
                        style={[
                          bookStyles.availText,
                          availCopies > 0 ? bookStyles.textGreen : bookStyles.textRed,
                        ]}
                      >
                        {availCopies > 0 ? `${availCopies} Avail` : 'Issued'}
                      </Text>

                      <View style={bookStyles.listActionsRow}>
                        <TouchableOpacity
                          style={bookStyles.listDeleteBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            onDeleteBook(item.id);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={17} color="#DC2626" />
                        </TouchableOpacity>
                        <Feather name="chevron-right" size={18} color="#9CA3AF" />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Pagination Controls */}
              {filtered.length > 0 && (
                <View style={styles.paginationContainer}>
                  <Text style={styles.paginationInfo}>
                    Showing {startRange}-{endRange} of {filtered.length} books
                  </Text>
                  <View style={styles.paginationBtnRow}>
                    <TouchableOpacity
                      style={[
                        styles.paginationBtn,
                        currentPage === 1 && styles.paginationBtnDisabled,
                      ]}
                      disabled={currentPage === 1}
                      onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      activeOpacity={0.8}
                    >
                      <Feather name="chevron-left" size={16} color={currentPage === 1 ? '#9CA3AF' : '#171717'} />
                      <Text
                        style={[
                          styles.paginationBtnText,
                          currentPage === 1 && styles.paginationBtnTextDisabled,
                        ]}
                      >
                        Prev
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.paginationIndicator}>
                      <Text style={styles.paginationIndicatorText}>
                        {currentPage} / {totalPages}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.paginationBtn,
                        currentPage === totalPages && styles.paginationBtnDisabled,
                      ]}
                      disabled={currentPage === totalPages}
                      onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.paginationBtnText,
                          currentPage === totalPages && styles.paginationBtnTextDisabled,
                        ]}
                      >
                        Next
                      </Text>
                      <Feather name="chevron-right" size={16} color={currentPage === totalPages ? '#9CA3AF' : '#171717'} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const bookStyles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  listContainer: {
    gap: 10,
  },
  smallCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 4,
  },
  coverWrap: {
    height: 110,
    backgroundColor: '#FFFDF7',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    borderLeftWidth: 3,
    borderLeftColor: '#F4C430',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallCover: {
    width: '100%',
    height: '100%',
  },
  smallCoverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  coverIconEmblem: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#171717',
    textAlign: 'center',
    lineHeight: 12,
  },
  availBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  availBadgeList: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreen: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#026440',
  },
  badgeRed: {
    backgroundColor: '#FEE2E2',
  },
  availBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  textGreen: {
    color: '#026440',
  },
  textRed: {
    color: '#DC2626',
  },
  deleteBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  infoBox: {
    padding: 10,
    gap: 4,
  },
  smallTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171717',
    lineHeight: 16,
  },
  smallBookNo: {
    fontSize: 10.5,
    color: '#6B7280',
  },
  catPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  catPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#92400E',
  },
  copyCountText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },

  /* List View Styles */
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  listThumbWrap: {
    width: 44,
    height: 58,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#F9FAFB',
  },
  listThumb: {
    width: '100%',
    height: '100%',
  },
  listThumbFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listInfoWrap: {
    flex: 1,
    gap: 3,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171717',
  },
  listBookNo: {
    fontSize: 12,
    color: '#6B7280',
  },
  listMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  catText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#D97706',
  },
  metaDot: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  listCopiesText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.medium,
  },
  listRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
  },
  availText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bold,
  },
  listActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listDeleteBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
  },
  emptySub: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
});

const styles = StyleSheet.create({
  viewBodyContainer: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: '#171717',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#6B7280',
    marginTop: 2,
  },
  addBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addBookBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium, color: '#171717', paddingVertical: 0 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  chipActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  chipText: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: FontFamily.semibold,
  },
  chipTextActive: {
    color: '#171717',
    fontFamily: FontFamily.bold,
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
