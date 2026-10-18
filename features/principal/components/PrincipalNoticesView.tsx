import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { YellowTheme, globalYellowStyles } from '../../../constants/globalYellowStyles';
import { SchoolNotice } from '../types/principal.types';

interface PrincipalNoticesViewProps {
  notices: SchoolNotice[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export const PrincipalNoticesView: React.FC<PrincipalNoticesViewProps> = ({
  notices,
  refreshing,
  onRefresh,
  onOpenCreateModal,
}) => {
  const [search, setSearch] = useState('');
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setDeletedIds((prev) => [...prev, id]),
        },
      ]
    );
  };

  const filteredNotices = notices
    .filter((n) => !deletedIds.includes(n.id))
    .filter((n) => {
      const q = search.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        (n.author && n.author.toLowerCase().includes(q))
      );
    });

  return (
    <View style={styles.container}>
      {/* Top Header & Search (Screenshot 2: Announcements + Add Announcement) */}
      <View style={styles.headerBlock}>
        <View style={styles.topActionRow}>
          <Text style={styles.pageTitle}>Announcements</Text>
          <TouchableOpacity style={styles.addBtn} onPress={onOpenCreateModal} activeOpacity={0.8}>
            <Text style={styles.addBtnText}>Add Announcement</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar with Brand Yellow Magnifying Glass */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color={YellowTheme.primaryYellow} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements..."
            placeholderTextColor={YellowTheme.placeholder}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={YellowTheme.placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Notices List (Screenshot 2 Theme Cards) */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[YellowTheme.primaryYellow]} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotices.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="bullhorn-outline" size={42} color={YellowTheme.darkSubtle} />
            <Text style={styles.emptyTitle}>No announcements found</Text>
            <Text style={styles.emptySub}>Tap "Add Announcement" above to publish your first circular.</Text>
          </View>
        ) : (
          filteredNotices.map((notice) => {
            const timePeriod = notice.expiresAt
              ? `${notice.publishedDate || 'Current'} – ${notice.expiresAt}`
              : `From ${notice.publishedDate || '30 Sep 2026'}`;

            return (
              <View key={notice.id} style={styles.card}>
                {/* Card Top: Title on left, Red Delete button on right */}
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {notice.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(notice.id, notice.title)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={17} color={YellowTheme.statusRed} />
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>

                {/* Card Content Description */}
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {notice.content}
                </Text>

                {/* Inset Time Period Pill (Screenshot 2: Calendar icon + Time Period) */}
                <View style={styles.timePill}>
                  <MaterialCommunityIcons name="calendar-clock" size={15} color={YellowTheme.dark} />
                  <Text style={styles.timePillLabel}>Time Period: </Text>
                  <Text style={styles.timePillBold}>{timePeriod}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YellowTheme.screenBg,
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: YellowTheme.cardBorder,
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  pageTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 22,
    color: YellowTheme.black,
    letterSpacing: -0.3,
  },
  addBtn: {
    backgroundColor: YellowTheme.primaryYellow,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: YellowTheme.black,
    letterSpacing: -0.1,
  },

  // Search Bar with Brand Yellow Magnifier (Screenshot 2)
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: YellowTheme.dark,
    paddingVertical: 0,
  },

  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },

  // Content Cards (Screenshot 2)
  card: {
    backgroundColor: YellowTheme.cardBg,
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: FontFamily.extrabold,
    fontSize: 16,
    color: YellowTheme.black,
    letterSpacing: -0.2,
    marginRight: 10,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  deleteText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: YellowTheme.statusRed,
  },
  cardDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: YellowTheme.darkMuted,
    lineHeight: 19,
    marginBottom: 10,
  },

  // Time Period Inset Pill (Screenshot 2)
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: YellowTheme.subtleBg,
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  timePillLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: YellowTheme.darkSubtle,
    marginLeft: 6,
  },
  timePillBold: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: YellowTheme.black,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: YellowTheme.cardBorder,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: YellowTheme.black,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: YellowTheme.darkMuted,
    textAlign: 'center',
  },
});
