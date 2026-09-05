import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { useLibraryStore } from '../store/useLibraryStore';
import { Book, BookCategory } from '../types/library';

const CATEGORIES: { label: string; value: 'all' | BookCategory; icon: string }[] = [
  { label: 'All Books', value: 'all', icon: 'bookshelf' },
  { label: 'Science', value: 'science', icon: 'atom' },
  { label: 'Mathematics', value: 'mathematics', icon: 'calculator-variant' },
  { label: 'Literature', value: 'literature', icon: 'feather' },
  { label: 'Computer Sci', value: 'computer_science', icon: 'laptop' },
  { label: 'History', value: 'history', icon: 'pillar' },
  { label: 'Reference', value: 'reference', icon: 'book-search' },
];

export const BookCatalogView: React.FC = () => {
  const books = useLibraryStore((s) => s.books);
  const addBook = useLibraryStore((s) => s.addBook);
  const updateBook = useLibraryStore((s) => s.updateBook);
  const deleteBook = useLibraryStore((s) => s.deleteBook);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | BookCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<BookCategory>('science');
  const [totalCopies, setTotalCopies] = useState('5');
  const [rackLocation, setRackLocation] = useState('Rack A-01, Shelf 1');
  const [publisher, setPublisher] = useState('');
  const [editionYear, setEditionYear] = useState('2024');
  const [summary, setSummary] = useState('');

  const filteredBooks = books.filter((b) => {
    const matchesCategory =
      selectedCategory === 'all' || b.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q) ||
      b.rackLocation.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingBook(null);
    setTitle('');
    setAuthor('');
    setIsbn(`978-81${Math.floor(1000000 + Math.random() * 9000000)}`);
    setCategory('science');
    setTotalCopies('5');
    setRackLocation('Rack S-01, Shelf 2');
    setPublisher('NCERT / National Book Trust');
    setEditionYear('2025');
    setSummary('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (b: Book) => {
    setEditingBook(b);
    setTitle(b.title);
    setAuthor(b.author);
    setIsbn(b.isbn);
    setCategory(b.category);
    setTotalCopies(String(b.totalCopies));
    setRackLocation(b.rackLocation);
    setPublisher(b.publisher);
    setEditionYear(b.editionYear);
    setSummary(b.summary || '');
    setShowAddModal(true);
  };

  const handleSaveBook = () => {
    if (!title.trim() || !author.trim()) {
      Alert.alert('Missing Info', 'Please provide Book Title and Author name.');
      return;
    }

    const copies = parseInt(totalCopies, 10) || 1;

    if (editingBook) {
      updateBook(editingBook.id, {
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category,
        totalCopies: copies,
        rackLocation: rackLocation.trim(),
        publisher: publisher.trim(),
        editionYear: editionYear.trim(),
        summary: summary.trim(),
      });
      Alert.alert('Book Updated', `"${title}" has been updated.`);
    } else {
      addBook({
        title: title.trim(),
        author: author.trim(),
        isbn: isbn.trim(),
        category,
        totalCopies: copies,
        availableCopies: copies,
        rackLocation: rackLocation.trim(),
        publisher: publisher.trim(),
        editionYear: editionYear.trim(),
        coverColor: '#4F46E5',
        summary: summary.trim(),
      });
      Alert.alert('Book Added', `"${title}" added to library inventory.`);
    }

    setShowAddModal(false);
  };

  const handleDelete = (b: Book) => {
    Alert.alert('Delete Book', `Are you sure you want to remove "${b.title}" from library inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBook(b.id) },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar & Add Button */}
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <MaterialCommunityIcons name="magnify" size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, ISBN, rack..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add Book</Text>
        </TouchableOpacity>
      </View>

      {/* Category Filter Horizontal Scroll */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.value)}
              >
                <MaterialCommunityIcons
                  name={cat.icon as any}
                  size={14}
                  color={isSelected ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Book List */}
      <ScrollView contentContainerStyle={styles.bookList} showsVerticalScrollIndicator={false}>
        <Text style={styles.countText}>
          Showing {filteredBooks.length} of {books.length} Catalogue Books
        </Text>

        {filteredBooks.map((book) => {
          const isLowStock = book.availableCopies <= 1;
          return (
            <View key={book.id} style={styles.bookCard}>
              <View style={styles.bookTopRow}>
                <View style={styles.bookIconWrap}>
                  <MaterialCommunityIcons
                    name="book"
                    size={22}
                    color={book.coverColor || '#4F46E5'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookAuthor}>by {book.author}</Text>
                </View>
                <View style={styles.actionIcons}>
                  <TouchableOpacity
                    style={styles.iconAction}
                    onPress={() => handleOpenEdit(book)}
                  >
                    <MaterialCommunityIcons name="pencil-outline" size={18} color="#4F46E5" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconAction}
                    onPress={() => handleDelete(book)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.bookLocationRow}>
                <View style={styles.rackPill}>
                  <MaterialCommunityIcons name="map-marker-radius" size={12} color="#D97706" />
                  <Text style={styles.rackText}>{book.rackLocation}</Text>
                </View>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>
                    {book.category.toUpperCase().replace('_', ' ')}
                  </Text>
                </View>
                <Text style={styles.isbnText}>ISBN: {book.isbn}</Text>
              </View>

              {book.summary ? (
                <Text style={styles.summaryText} numberOfLines={2}>
                  {book.summary}
                </Text>
              ) : null}

              {/* Stock Bar */}
              <View style={styles.stockFooter}>
                <View style={{ flex: 1 }}>
                  <View style={styles.stockLabels}>
                    <Text style={styles.stockText}>
                      Available: <Text style={{ fontWeight: '800', color: isLowStock ? '#DC2626' : '#059669' }}>{book.availableCopies}</Text> / {book.totalCopies} copies
                    </Text>
                    <Text style={styles.editionText}>{book.publisher} • {book.editionYear}</Text>
                  </View>
                  <View style={styles.stockTrack}>
                    <View
                      style={[
                        styles.stockFill,
                        {
                          width: `${Math.min(100, Math.round((book.availableCopies / book.totalCopies) * 100))}%`,
                          backgroundColor: isLowStock ? '#EF4444' : '#10B981',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add / Edit Book Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingBook ? 'Edit Book Details' : 'Add New Book to Inventory'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Book Title *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Higher Engineering Mathematics"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Author Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Dr. B. S. Grewal"
                placeholderTextColor="#94A3B8"
                value={author}
                onChangeText={setAuthor}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>ISBN Number</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="978-..."
                    placeholderTextColor="#94A3B8"
                    value={isbn}
                    onChangeText={setIsbn}
                  />
                </View>
                <View style={{ width: 100, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Total Copies</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="5"
                    keyboardType="numeric"
                    placeholderTextColor="#94A3B8"
                    value={totalCopies}
                    onChangeText={setTotalCopies}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Rack / Shelf Location</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Rack M-02, Shelf 3"
                placeholderTextColor="#94A3B8"
                value={rackLocation}
                onChangeText={setRackLocation}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Publisher</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Khanna Publishers"
                    placeholderTextColor="#94A3B8"
                    value={publisher}
                    onChangeText={setPublisher}
                  />
                </View>
                <View style={{ width: 90, marginLeft: 10 }}>
                  <Text style={styles.inputLabel}>Edition</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2024"
                    placeholderTextColor="#94A3B8"
                    value={editionYear}
                    onChangeText={setEditionYear}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Summary / Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                placeholder="Brief summary of book topics..."
                placeholderTextColor="#94A3B8"
                value={summary}
                onChangeText={setSummary}
                multiline
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveBook} activeOpacity={0.8}>
              <MaterialCommunityIcons name="content-save-check" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>{editingBook ? 'Update Book' : 'Save to Inventory'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    gap: 4,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  categoryScrollWrap: { paddingVertical: 10 },
  categoryRow: { paddingHorizontal: 16, gap: 8 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  categoryChipActive: { backgroundColor: '#D97706', borderColor: '#D97706' },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  categoryChipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  bookList: { paddingHorizontal: 16, paddingBottom: 40 },
  countText: { fontSize: 11, color: '#64748B', fontWeight: '600', marginBottom: 10 },
  bookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
  },
  bookTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bookIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookTitle: { fontSize: 14, fontWeight: '800', color: '#1E293B' },
  bookAuthor: { fontSize: 12, color: '#64748B', marginTop: 2 },
  actionIcons: { flexDirection: 'row', gap: 6 },
  iconAction: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  rackPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  rackText: { fontSize: 10, fontWeight: '700', color: '#92400E' },
  categoryPill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryPillText: { fontSize: 9, fontWeight: '800', color: '#4338CA' },
  isbnText: { fontSize: 10, color: '#94A3B8' },
  summaryText: { fontSize: 11, color: '#64748B', marginTop: 8, lineHeight: 16 },
  stockFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginTop: 10,
    paddingTop: 8,
  },
  stockLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockText: { fontSize: 11, color: '#64748B' },
  editionText: { fontSize: 10, color: '#94A3B8' },
  stockTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  stockFill: { height: '100%', borderRadius: 3 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalForm: { maxHeight: 420 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#475569', marginTop: 10, marginBottom: 4 },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  formRow: { flexDirection: 'row' },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D97706',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
    gap: 6,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
