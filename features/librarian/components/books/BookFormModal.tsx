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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '../common/Icons';
import { Book, BookType, Category, Author } from '../../types';
import { apiClient } from '../../../../api/client';
import { auth } from '../../../../firebaseConfig';
import { createCategoryApi } from '../../../../api/library';
import { FontFamily } from '../../../../constants/fonts';

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
  onCreateCategory,
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
  onCreateCategory?: (cat: { name: string; description?: string }) => Promise<Category>;
  modalStyles: any;
  commonStyles: any;
  bookFormStyles: any;
}) => {
  const [title, setTitle] = useState('');
  const [isbn, setIsbn] = useState('');
  const [price, setPrice] = useState('');
  const [publisher, setPublisher] = useState('');
  const [edition, setEdition] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [language, setLanguage] = useState('English');
  const [categoryId, setCategoryId] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverResizeMode, setCoverResizeMode] = useState<'cover' | 'contain' | 'stretch'>('cover');
  const [totalCopies, setTotalCopies] = useState('1');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Category Dropdown & Add Category State
  const [localCategories, setLocalCategories] = useState<Category[]>(categories || []);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  useEffect(() => {
    setLocalCategories(categories || []);
  }, [categories]);

  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title || '');
      setIsbn(editingBook.isbn || '');
      setPrice(editingBook.price !== undefined && editingBook.price !== null ? String(editingBook.price) : '');
      setPublisher(editingBook.publisher || '');
      setEdition(editingBook.edition || '');
      setPublicationYear(editingBook.publicationYear ? String(editingBook.publicationYear) : '');
      setLanguage(editingBook.language || 'English');
      setCategoryId(editingBook.categoryId || (categories[0]?.id || ''));
      setCoverImage(editingBook.coverImage || '');
      setKeywords(Array.isArray(editingBook.keywords) ? editingBook.keywords.join(', ') : '');
      setDescription(editingBook.description || '');
      setTotalCopies('1');
    } else {
      setTitle('');
      setIsbn('');
      setPrice('');
      setPublisher('');
      setEdition('');
      setPublicationYear('');
      setLanguage('English');
      setCategoryId(categories[0]?.id || '');
      setCoverImage('');
      setKeywords('');
      setDescription('');
      setTotalCopies('1');
    }
    setIsCategoryDropdownOpen(false);
    setIsAddCategoryOpen(false);
    setNewCategoryName('');
  }, [editingBook, visible, categories]);

  const selectedCat = useMemo(() => {
    return localCategories.find((c) => c.id === categoryId);
  }, [localCategories, categoryId]);

  const filteredCatOptions = useMemo(() => {
    if (!categorySearch.trim()) return localCategories;
    const q = categorySearch.toLowerCase();
    return localCategories.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  }, [localCategories, categorySearch]);

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      Alert.alert('Required Field', 'Please enter a category name.');
      return;
    }
    setAddingCategory(true);
    try {
      let created: Category;
      if (onCreateCategory) {
        created = await onCreateCategory({ name: trimmed });
      } else {
        const apiRes = await createCategoryApi({ name: trimmed });
        created = {
          id: apiRes.id,
          name: apiRes.name,
          description: apiRes.description || null,
        };
      }
      setLocalCategories((prev) => {
        if (prev.some((c) => c.id === created.id)) return prev;
        return [...prev, created];
      });
      setCategoryId(created.id);
      setNewCategoryName('');
      setIsAddCategoryOpen(false);
      Alert.alert('Success', `Category "${created.name}" created and selected!`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to create category.');
    } finally {
      setAddingCategory(false);
    }
  };

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
      Alert.alert('Required Field', 'Book number is required.');
      return;
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      Alert.alert('Required Field', 'Book price is mandatory. Please enter a valid price in rupees.');
      return;
    }

    setSubmitting(true);
    try {
      const finalCover = coverImage.trim();

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
        bookType: editingBook?.bookType || 'GENERAL',
        coverImage: finalCover || undefined,
        price: price.trim() || undefined,
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
      <KeyboardAvoidingView
        style={modalStyles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[modalStyles.modalContainer, { maxHeight: '90%' }]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.headerTitle}>{editingBook ? 'Edit Book Record' : 'Add Book'}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={20} color="#6B7280" /></TouchableOpacity>
          </View>

          <ScrollView
            style={{ padding: 16 }}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Cover Image (Optional) */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={styles.formLabel}>Book Cover Photo </Text>
                {coverImage ? (
                  <TouchableOpacity onPress={() => setCoverImage('')}>
                    <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#DC2626' }}>Remove Image</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <TouchableOpacity
                style={[
                  bookFormStyles.coverUploadBtn,
                  !coverImage && {
                    backgroundColor: '#FFFFFF',
                    borderColor: '#CBD5E1',
                    borderStyle: 'solid',
                    borderWidth: 1.5,
                  },
                ]}
                onPress={pickCoverImage}
                activeOpacity={0.8}
              >
                {coverImage ? (
                  <Image source={{ uri: coverImage }} style={[bookFormStyles.coverPreview, { resizeMode: coverResizeMode }]} />
                ) : (
                  <View style={{ width: '100%', height: '100%', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
                    <MaterialCommunityIcons name="camera-outline" size={32} color="#64748B" />
                    <Text style={{ fontSize: 11, fontFamily: FontFamily.bold, color: '#0F172A', marginTop: 6 }}>+ Add Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              {coverImage && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 6 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Fit Mode:</Text>
                  {(['cover', 'contain', 'stretch'] as const).map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[styles.chip, coverResizeMode === mode && styles.chipActive, { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5 }]}
                      onPress={() => setCoverResizeMode(mode)}
                    >
                      <Text style={[styles.chipText, coverResizeMode === mode && styles.chipTextActive, { fontSize: 10 }]}>{mode.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Book Title *</Text>
              <TextInput style={styles.formInput} value={title} onChangeText={setTitle} placeholder="e.g. Clean Architecture" placeholderTextColor="#475569" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Book Number *</Text>
                <TextInput style={styles.formInput} value={isbn} onChangeText={setIsbn} placeholder="e.g. BK-1001 / 978-0134494166" placeholderTextColor="#475569" />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Book Price (₹) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  placeholder="e.g. 450"
                  placeholderTextColor="#475569"
                />
              </View>
            </View>

            {!editingBook && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Initial Copies *</Text>
                <TextInput style={styles.formInput} value={totalCopies} onChangeText={setTotalCopies} keyboardType="numeric" placeholder="e.g. 5" placeholderTextColor="#475569" />
              </View>
            )}

            {/* Category Selection with Dropdown & Add Category */}
            <View style={styles.formGroup}>
              <View style={{ marginBottom: 6 }}>
                <Text style={styles.formLabel}>Category Selection *</Text>
              </View>

              {/* Clickable Category Selection Bar */}
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1.5,
                  borderColor: isCategoryDropdownOpen ? '#EAB308' : '#E2E8F0',
                  borderRadius: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
                onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: selectedCat ? '700' : '500',
                      color: selectedCat ? '#0F172A' : '#475569',
                    }}
                    numberOfLines={1}
                  >
                    {selectedCat ? selectedCat.name : 'Select or search category...'}
                  </Text>
                </View>
                <Feather
                  name={isCategoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>

              {/* Dropdown Menu Card */}
              {isCategoryDropdownOpen && (
                <View
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 5,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    marginTop: 6,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 8,
                    elevation: 4,
                    overflow: 'hidden',
                  }}
                >
                  {/* Dropdown Header */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      backgroundColor: '#F8FAFC',
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>
                      All Categories ({localCategories.length})
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => setIsAddCategoryOpen(!isAddCategoryOpen)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Feather name={isAddCategoryOpen ? 'minus' : 'plus'} size={13} color="#D97706" />
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#D97706' }}>
                          {isAddCategoryOpen ? 'Cancel' : 'Add Category'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setIsCategoryDropdownOpen(false)}>
                        
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Inline Add Category Input Box */}
                  {isAddCategoryOpen && (
                    <View
                      style={{
                        padding: 12,
                        backgroundColor: '#FFFDF5',
                        borderBottomWidth: 1,
                        borderBottomColor: '#FEF08A',
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#854D0E' }}>
                        Create New Category:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput
                          style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            borderWidth: 1,
                            borderColor: '#FDE047',
                            borderRadius: 5,
                            paddingHorizontal: 10,
                            paddingVertical: 7,
                            fontSize: 12.5,
                            color: '#0F172A',
                          }}
                          placeholder="e.g. Science, Fiction, History..."
                          placeholderTextColor="#475569"
                          value={newCategoryName}
                          onChangeText={setNewCategoryName}
                          autoFocus={true}
                        />
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#026440',
                            paddingHorizontal: 14,
                            borderRadius: 5,
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'row',
                            gap: 4,
                          }}
                          onPress={handleAddCategory}
                          disabled={addingCategory}
                        >
                          {addingCategory ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Feather name="plus" size={14} color="#FFFFFF" />
                              <Text style={{ fontSize: 12, fontFamily: FontFamily.bold, color: '#FFFFFF' }}>Add</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Filter Search Input */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F1F5F9',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <Feather name="search" size={15} color="#475569" style={{ marginRight: 6 }} />
                    <TextInput
                      style={{
                        flex: 1,
                        fontSize: 12,
                        color: '#0F172A',
                        padding: 0,
                      }}
                      placeholder="Search category name..."
                      placeholderTextColor="#475569"
                      value={categorySearch}
                      onChangeText={setCategorySearch}
                    />
                    {categorySearch ? (
                      <TouchableOpacity onPress={() => setCategorySearch('')}>
                        <Feather name="x" size={14} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Dropdown Category List */}
                  <ScrollView
                    style={{ maxHeight: 220 }}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                  >
                    {filteredCatOptions.length === 0 ? (
                      <View style={{ padding: 16, alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name="tag-off-outline" size={24} color="#94A3B8" />
                        <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center' }}>
                          {categorySearch ? `No category matching "${categorySearch}"` : 'No categories available.'}
                        </Text>
                        {categorySearch ? (
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                              backgroundColor: '#FEF08A',
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 5,
                              marginTop: 4,
                            }}
                            onPress={() => {
                              setNewCategoryName(categorySearch);
                              setIsAddCategoryOpen(true);
                            }}
                          >
                            <Feather name="plus" size={13} color="#854D0E" />
                            <Text style={{ fontSize: 11.5, fontFamily: FontFamily.bold, color: '#854D0E' }}>
                              Add "{categorySearch}" as Category
                            </Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    ) : (
                      filteredCatOptions.map((c) => {
                        const isSelected = categoryId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingHorizontal: 14,
                              paddingVertical: 10,
                              backgroundColor: isSelected ? '#FFFDF5' : '#FFFFFF',
                              borderBottomWidth: 1,
                              borderBottomColor: '#F8FAFC',
                            }}
                            onPress={() => {
                              setCategoryId(c.id);
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 13,
                                  fontWeight: isSelected ? '800' : '600',
                                  color: isSelected ? '#0F172A' : '#334155',
                                }}
                                numberOfLines={1}
                              >
                                {c.name}
                              </Text>
                            </View>
                            {isSelected ? (
                              <View
                                style={{
                                  backgroundColor: '#FEF08A',
                                  width: 20,
                                  height: 20,
                                  borderRadius: 10,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <MaterialCommunityIcons name="check" size={14} color="#854D0E" />
                              </View>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Publisher</Text>
                <TextInput style={styles.formInput} value={publisher} onChangeText={setPublisher} placeholder="e.g. Pearson" placeholderTextColor="#475569" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Edition</Text>
                <TextInput style={styles.formInput} value={edition} onChangeText={setEdition} placeholder="e.g. 1st Edition" placeholderTextColor="#475569" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Publication Year</Text>
                <TextInput style={styles.formInput} value={publicationYear} onChangeText={setPublicationYear} keyboardType="numeric" placeholder="2023" placeholderTextColor="#475569" />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>Language</Text>
                <TextInput style={styles.formInput} value={language} onChangeText={setLanguage} placeholder="English" placeholderTextColor="#475569" />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Keywords (comma separated)</Text>
              <TextInput style={styles.formInput} value={keywords} onChangeText={setKeywords} placeholder="e.g. software, programming, code" placeholderTextColor="#475569" />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={[styles.formInput, { height: 75 }]} value={description} onChangeText={setDescription} multiline placeholder="Enter book synopsis or summary..." placeholderTextColor="#475569" />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 16 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#FEF2F2',
                  borderWidth: 1,
                  borderColor: '#FECACA',
                  paddingVertical: 12,
                  borderRadius: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={onClose}
                disabled={submitting}
              >
                <Text style={{ color: '#DC2626', fontSize: 13, fontFamily: FontFamily.bold }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 2,
                  backgroundColor: '#026440',
                  paddingVertical: 12,
                  borderRadius: 5,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#026440',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3,
                  elevation: 3,
                }}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: FontFamily.bold }}>
                    {editingBook ? 'Save Catalog Updates' : 'Create Catalog Entry'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
