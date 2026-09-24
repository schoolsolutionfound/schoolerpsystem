import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '../common/Icons';
import { Book, BookCopy, Category, Author } from '../../types';

export interface BooksViewProps {
  books: Book[];
  copies: BookCopy[];
  categories: Category[];
  authors: Author[];
  onSelectBook: (b: Book) => void;
  onAddBook: () => void;
  onDeleteBook: (bookId: string) => void;
  commonStyles?: any;
}

export const BooksView: React.FC<BooksViewProps> = ({
  books,
  copies,
  categories,
  authors,
  onSelectBook,
  onAddBook,
  onDeleteBook,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('ALL');

  const filtered = useMemo(() => {
    return books.filter((b) => {
      const matchSearch =
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.isbn.toLowerCase().includes(search.toLowerCase()) ||
        (b.subject && b.subject.toLowerCase().includes(search.toLowerCase()));
      const matchCat = selectedCat === 'ALL' || b.categoryId === selectedCat;
      return matchSearch && matchCat;
    });
  }, [books, search, selectedCat]);

  return (
    <View style={styles.viewBodyContainer}>
      <View style={{ gap: 10, marginBottom: 12 }}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search catalog by title, ISBN, or subject..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <TouchableOpacity
            style={[styles.chip, selectedCat === 'ALL' && styles.chipActive]}
            onPress={() => setSelectedCat('ALL')}
          >
            <Text style={[styles.chipText, selectedCat === 'ALL' && styles.chipTextActive]}>
              All Categories ({books.length})
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 80, gap: 10 }}
        renderItem={({ item }) => {
          const bookCopies = copies.filter((c) => c.bookId === item.id);
          const availCopies = bookCopies.filter((c) => c.status === 'AVAILABLE').length;
          const cat = categories.find((c) => c.id === item.categoryId);

          return (
            <TouchableOpacity style={bookStyles.card} onPress={() => onSelectBook(item)}>
              <Image
                source={{
                  uri: item.coverImage || 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400',
                }}
                style={bookStyles.cover}
              />
              <View style={bookStyles.info}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={bookStyles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    style={{ padding: 4 }}
                    onPress={(e) => {
                      e.stopPropagation();
                      onDeleteBook(item.id);
                    }}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
                <Text style={bookStyles.isbn}>
                  ISBN: {item.isbn} {cat ? `• ${cat.name}` : ''}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                  <View style={[styles.statusBadge, availCopies > 0 ? styles.badgeGreen : styles.badgeRed]}>
                    <Text style={[styles.badgeText, availCopies > 0 ? styles.badgeTextGreen : styles.badgeTextRed]}>
                      {availCopies} / {bookCopies.length} Available
                    </Text>
                  </View>

                  {item.bookType && (
                    <View style={[styles.chip, { paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#F3F4F6' }]}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#4B5563' }}>{item.bookType}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={onAddBook}>
        <MaterialCommunityIcons name="plus" size={26} color="#121316" />
      </TouchableOpacity>
    </View>
  );
};

const bookStyles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', gap: 12 },
  cover: { width: 60, height: 90, borderRadius: 6, backgroundColor: '#E5E7EB' },
  info: { flex: 1, justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111827', marginRight: 6 },
  isbn: { fontSize: 11, color: '#6B7280' },
});

const styles = StyleSheet.create({
  viewBodyContainer: { flex: 1, padding: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#E5E7EB', gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#111827', paddingVertical: 0 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#FEF08A', borderColor: '#EAB308' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
  chipTextActive: { color: '#121316', fontWeight: '800' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, alignSelf: 'flex-start' },
  badgeGreen: { backgroundColor: '#D1FAE5' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '800' },
  badgeTextGreen: { color: '#059669' },
  badgeTextRed: { color: '#DC2626' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#EAB308', alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
});
