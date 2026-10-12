import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '../common/Icons';
import { Category, Book } from '../../types';

export interface CategoriesViewProps {
  categories: Category[];
  books: Book[];
  commonStyles?: any;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ categories, books }) => (
  <ScrollView style={styles.viewBody}>
    <Text style={styles.sectionHeader}>Book Categories ({categories.length})</Text>
    <View style={{ gap: 10 }}>
      {categories.map((c) => {
        const count = books.filter((b) => b.categoryId === c.id).length;
        return (
          <View key={c.id} style={styles.listItemCard}>
            <MaterialCommunityIcons name="tag-outline" size={24} color="#EAB308" />
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{c.name}</Text>
              <Text style={styles.cardSub}>{c.description || 'Category'}</Text>
            </View>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#111827' }}>{count} Books</Text>
          </View>
        );
      })}
    </View>
  </ScrollView>
);

const styles = StyleSheet.create({
  viewBody: { flex: 1, padding: 16 },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#111827', marginBottom: 12 },
  listItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardSub: { fontSize: 12, color: '#6B7280' },
});
