import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { Book, BookCopy, Author, Category } from '../../types';

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
}) => {
  const category = categories.find((c) => c.id === book.categoryId);
  const availCopies = copies.filter((c) => c.status === 'AVAILABLE').length;

  return (
    <ScrollView style={styles.viewBody} showsVerticalScrollIndicator={false}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Feather name="chevron-left" size={18} color="#111827" />
        <Text style={styles.backBtnText}>Back to Catalog</Text>
      </TouchableOpacity>

      {/* Book Detail Header Card */}
      <View style={detailStyles.headerCard}>
        <Image
          source={{ uri: book.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400' }}
          style={detailStyles.cover}
        />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={detailStyles.title}>{book.title}</Text>
          <Text style={detailStyles.isbn}>ISBN: {book.isbn}</Text>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={detailStyles.sectionTitle}>
            Physical Copies ({copies.length} Total • {availCopies} Available)
          </Text>
          <TouchableOpacity style={detailStyles.btnAddCopy} onPress={onAddCopy}>
            <Feather name="plus" size={14} color="#121316" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#121316' }}>Add Copy</Text>
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

const styles = StyleSheet.create({
  viewBody: { flex: 1, padding: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  backBtnText: { fontSize: 13, fontWeight: '700', color: '#111827' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextGreen: { color: '#059669' },
  badgeTextRed: { color: '#DC2626' },
});

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
