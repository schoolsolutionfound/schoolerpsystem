import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { Book, BookType, Category, Author } from '../../types';
import { apiClient } from '../../../../api/client';
import { auth } from '../../../../firebaseConfig';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (_e) {
  ImagePicker = null;
}

export const BookFormModal = ({
  visible,
  editingBook,
  categories,
  authors,
  onClose,
  onSave,
  modalStyles,
  commonStyles,
  bookFormStyles,
}: {
  visible: boolean;
  editingBook: Book | null;
  categories: Category[];
  authors: Author[];
  onClose: () => void;
  onSave: (bookData: Partial<Book> & { totalCopies?: number }) => void;
  modalStyles: any;
  commonStyles: any;
  bookFormStyles: any;
}) => {
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [edition, setEdition] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [language, setLanguage] = useState('English');
  const [categoryId, setCategoryId] = useState('');
  const [subject, setSubject] = useState('');
  const [bookType, setBookType] = useState<BookType>('TEXTBOOK');
  const [coverImage, setCoverImage] = useState('');
  const [coverResizeMode, setCoverResizeMode] = useState<'cover' | 'contain' | 'stretch'>('cover');
  const [totalCopies, setTotalCopies] = useState('1');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title || '');
      setIsbn(editingBook.isbn || '');
      setPublisher(editingBook.publisher || '');
      setEdition(editingBook.edition || '');
      setPublicationYear(editingBook.publicationYear ? String(editingBook.publicationYear) : '');
      setLanguage(editingBook.language || 'English');
      setCategoryId(editingBook.categoryId || (categories[0]?.id || ''));
      setSubject(editingBook.subject || '');
      setBookType(editingBook.bookType || 'TEXTBOOK');
      setCoverImage(editingBook.coverImage || '');
      setKeywords(Array.isArray(editingBook.keywords) ? editingBook.keywords.join(', ') : '');
      setDescription(editingBook.description || '');
      setTotalCopies('1');
    } else {
      setTitle('');
      setIsbn('');
      setPublisher('');
      setEdition('');
      setPublicationYear('');
      setLanguage('English');
      setCategoryId(categories[0]?.id || '');
      setSubject('');
      setBookType('TEXTBOOK');
      setCoverImage('');
      setKeywords('');
      setDescription('');
      setTotalCopies('1');
    }
  }, [editingBook, visible, categories]);

  const filteredCatOptions = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(categorySearch.toLowerCase()))
    );
  }, [categories, categorySearch]);

  const pickCoverImage = async () => {
    if (!ImagePicker) {
      Alert.alert('Notice', 'Image picker is not supported on this platform.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Permission to access media library is required to select cover photo.');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        setCoverImage(res.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick cover image.');
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Book title is required.');
      return;
    }
    if (!isbn.trim()) {
      Alert.alert('Required Field', 'Book ISBN number is required.');
      return;
    }

    setSubmitting(true);
    try {
      let finalCover = coverImage;

      const copyCountParsed = parseInt(totalCopies, 10);
      const initialCopyCount = isNaN(copyCountParsed) || copyCountParsed < 1 ? 1 : copyCountParsed;

      const payload: Partial<Book> & { totalCopies?: number } = {
        title: title.trim(),
        isbn: isbn.trim(),
        publisher: publisher.trim() || undefined,
        edition: edition.trim() || undefined,
        publicationYear: publicationYear ? parseInt(publicationYear, 10) : undefined,
        language: language.trim() || 'English',
        categoryId: categoryId || categories[0]?.id || 'cat-1',
        subject: subject.trim() || undefined,
        bookType,
        coverImage: finalCover || undefined,
        keywords: keywords ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        description: description.trim() || undefined,
        totalCopies: initialCopyCount,
      };

      onSave(payload);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save book.');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = commonStyles;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.backdrop}>
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{editingBook ? 'Edit Book Record' : 'Add New Book to Catalog'}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color="#6B7280" /></TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {/* Resizable Cover Image Upload & Fitting Controls */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Book Cover Photo & Resize</Text>
              <TouchableOpacity style={bookFormStyles.coverUploadBtn} onPress={pickCoverImage}>
                {coverImage ? (
                  <Image source={{ uri: coverImage }} style={[bookFormStyles.coverPreview, { resizeMode: coverResizeMode }]} />
                ) : (
                  <View style={bookFormStyles.coverPlaceholder}>
                    <MaterialCommunityIcons name="image-plus" size={28} color="#EAB308" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#EAB308', marginTop: 4 }}>Select Cover Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {coverImage ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Fit Mode:</Text>
                  {(['cover', 'contain', 'stretch'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.chip, coverResizeMode === mode && styles.chipActive, { paddingHorizontal: 8, paddingVertical: 2 }]}
                      onPress={() => setCoverResizeMode(mode)}
                    >
                      <Text style={[styles.chipText, coverResizeMode === mode && styles.chipTextActive, { fontSize: 10 }]}>{mode.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Book Title *</Text>
              <TextInput style={styles.formInput} value={title} onChangeText={setTitle} placeholder="e.g. Clean Architecture" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1.5 }]}>
                <Text style={styles.formLabel}>ISBN Number *</Text>
                <TextInput style={styles.formInput} value={isbn} onChangeText={setIsbn} placeholder="e.g. 978-0134494166" />
              </View>

              {!editingBook && (
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Initial Copies *</Text>
                  <TextInput style={styles.formInput} value={totalCopies} onChangeText={setTotalCopies} keyboardType="numeric" placeholder="e.g. 5" />
                </View>
              )}
            </View>

            {/* Comprehensive Searchable Category Selection */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.formLabel}>Category Selection ({categories.length} Categories)</Text>
              </View>
              <TextInput
                style={[styles.formInput, { paddingVertical: 5, fontSize: 12, marginBottom: 6 }]}
                value={categorySearch}
                onChangeText={setCategorySearch}
                placeholder="🔍 Search category by name..."
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {filteredCatOptions.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, categoryId === c.id && styles.chipActive]}
                    onPress={() => setCategoryId(c.id)}
                  >
                    <Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Book Type Chips */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Book Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {(['TEXTBOOK', 'REFERENCE', 'FICTION', 'NON_FICTION', 'COMPETITIVE', 'GENERAL'] as BookType[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.chip, bookType === t && styles.chipActive]}
                    onPress={() => setBookType(t)}
                  >
                    <Text style={[styles.chipText, bookType === t && styles.chipTextActive]}>{t.replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Publisher</Text>
                <TextInput style={styles.formInput} value={publisher} onChangeText={setPublisher} placeholder="e.g. Pearson" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Edition</Text>
                <TextInput style={styles.formInput} value={edition} onChangeText={setEdition} placeholder="e.g. 1st Edition" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Publication Year</Text>
                <TextInput style={styles.formInput} value={publicationYear} onChangeText={setPublicationYear} keyboardType="numeric" placeholder="2023" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Language</Text>
                <TextInput style={styles.formInput} value={language} onChangeText={setLanguage} placeholder="English" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Subject</Text>
              <TextInput style={styles.formInput} value={subject} onChangeText={setSubject} placeholder="e.g. Computer Science" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Keywords (comma separated)</Text>
              <TextInput style={styles.formInput} value={keywords} onChangeText={setKeywords} placeholder="e.g. software, programming, code" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={[styles.formInput, { height: 75 }]} value={description} onChangeText={setDescription} multiline placeholder="Enter book synopsis or summary..." />
            </View>

            <TouchableOpacity style={[styles.primaryBtn, { marginVertical: 16 }]} onPress={handleSave} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#121316" /> : <Text style={styles.primaryBtnText}>{editingBook ? 'Save Catalog Updates' : 'Create Catalog Entry'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
