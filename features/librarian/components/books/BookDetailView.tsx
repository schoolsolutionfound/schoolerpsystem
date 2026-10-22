import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { Book, BookCopy, Author, Category } from '../../types';
import { FontFamily } from '../../../../constants/fonts';

export interface BookDetailViewProps {
  book: Book;
  copies: BookCopy[];
  authors: Author[];
  categories: Category[];
  onBack: () => void;
  onEditBook: () => void;
  onDeleteBook: (bookId: string) => void;
  onAddCopy: () => void;
  onEditCopy: (copy: BookCopy) => void;
  onDeleteCopy: (copyId: string) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  commonStyles?: any;
}

export const BookDetailView: React.FC<BookDetailViewProps> = ({
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
  onRefresh,
  isRefreshing,
}) => {
  const category = categories.find((c) => c.id === book.categoryId);
  const availCopies = copies.filter((c) => c.status === 'AVAILABLE').length;

  return (
    <ScrollView
      style={styles.viewBody}
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
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Feather name="chevron-left" size={18} color="#111827" />
        <Text style={styles.backBtnText}>Back to Catalog</Text>
      </TouchableOpacity>

      {/* Book Detail Header Card */}
      <View style={detailStyles.headerCard}>
        {book.coverImage ? (
          <Image
            source={{ uri: book.coverImage }}
            style={detailStyles.cover}
          />
        ) : (
          <View style={[detailStyles.cover, { backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#E8E5DC', borderLeftWidth: 4, borderLeftColor: '#F4C430', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 4 }]}>
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#FFF4C7', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="book" size={18} color="#171717" />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#171717', textAlign: 'center', marginTop: 2, lineHeight: 14 }} numberOfLines={3}>
              {book.title}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={detailStyles.title}>{book.title}</Text>
          <Text style={detailStyles.isbn}>Book Number: {book.isbn}</Text>
          {category && <Text style={{ fontSize: 12, color: '#EAB308', fontWeight: '700' }}>📁 {category.name}</Text>}
          {book.publisher && <Text style={{ fontSize: 12, color: '#4B5563' }}>Publisher: {book.publisher}</Text>}
          {book.edition && (
            <Text style={{ fontSize: 11, color: '#6B7280' }}>
              Edition: {book.edition} ({book.publicationYear || 'N/A'})
            </Text>
          )}

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
        <View style={detailStyles.copiesHeaderRow}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={detailStyles.sectionTitle}>Physical Copies</Text>
            <Text style={detailStyles.copiesSubtitle}>
              {copies.length} Total • {availCopies} Available
            </Text>
          </View>
          <TouchableOpacity style={detailStyles.btnAddCopy} onPress={onAddCopy} activeOpacity={0.8}>
            <Feather name="plus" size={15} color="#171717" />
            <Text style={detailStyles.btnAddCopyText}>Add Copy</Text>
          </TouchableOpacity>
        </View>

        {copies.length === 0 ? (
          <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
            No physical copies cataloged for this item.
          </Text>
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
                      <Text style={detailStyles.locationText}>
                        {copy.rack} • {copy.shelf}
                      </Text>
                    </View>

                    {copy.condition && (
                      <View style={[styles.chip, { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#F9FAFB' }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280' }}>
                          Cond: {copy.condition}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  {copy.status === 'AVAILABLE' ? (
                    <View style={[styles.statusBadge, styles.badgeGreen]}>
                      <Text style={[styles.badgeText, styles.badgeTextGreen]}>
                        {copy.status}
                      </Text>
                    </View>
                  ) : (
                    <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: '#DC2626', paddingVertical: 2 }}>
                      {copy.status}
                    </Text>
                  )}

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

const styles = StyleSheet.create({
  viewBody: { flex: 1, padding: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  backBtnText: { fontSize: 13, fontFamily: FontFamily.bold, color: '#111827' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, alignSelf: 'flex-start' },
  badgeGreen: { backgroundColor: '#D1FAE5', borderWidth: 1, borderColor: '#026440' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontFamily: FontFamily.bold },
  badgeTextGreen: { color: '#026440' },
  badgeTextRed: { color: '#DC2626' },
});

const detailStyles = StyleSheet.create({
  headerCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 14, borderRadius: 5, borderWidth: 1, borderColor: '#E8E5DC', gap: 14, marginTop: 12 },
  cover: { width: 72, height: 104, borderRadius: 5, backgroundColor: '#E5E7EB' },
  title: { fontSize: 15, fontFamily: FontFamily.extrabold, color: '#171717' },
  isbn: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280' },
  btnEdit: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F4C430', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  btnEditText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#171717' },
  btnDelete: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FECACA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  btnDeleteText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#DC2626' },
  sectionCard: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E8E5DC', marginTop: 12 },
  copiesHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontFamily: FontFamily.bold, color: '#171717' },
  copiesSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2, fontFamily: FontFamily.medium },
  btnAddCopy: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F4C430', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 5, shadowColor: '#171717', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },
  btnAddCopyText: { fontSize: 12.5, fontFamily: FontFamily.bold, color: '#171717' },
  copyCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, backgroundColor: '#FFFDF7', borderRadius: 6, borderWidth: 1, borderColor: '#E8E5DC' },
  barcodeTag: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F3F4F6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  barcodeTagText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#374151' },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 },
  locationText: { fontSize: 11, fontFamily: FontFamily.bold, color: '#D97706' },
});
