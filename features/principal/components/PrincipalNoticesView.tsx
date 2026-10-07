import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
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
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'teachers' | 'parents' | 'students' | 'urgent'>('all');

  const filteredNotices = notices.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.author.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (audienceFilter === 'all') return true;
    if (audienceFilter === 'urgent') return n.priority === 'urgent';
    return n.targetAudience === audienceFilter || n.targetAudience === 'all';
  });

  return (
    <View style={styles.container}>
      {/* Top Header & Search */}
      <View style={styles.headerBlock}>
        <View style={styles.topActionRow}>
          <View>
            <Text style={styles.sectionTitle}>Campus Circulars & Broadcasts</Text>
            <Text style={styles.sectionSub}>Official announcements to faculty, parents & students</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={onOpenCreateModal} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Publish Circular</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search circulars by subject, keyword..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(
            [
              { key: 'all', label: `All Circulars (${notices.length})` },
              { key: 'urgent', label: '🚨 Urgent Priority' },
              { key: 'teachers', label: '👨‍🏫 Teachers Only' },
              { key: 'parents', label: '👨‍👩‍👧 Parents' },
              { key: 'students', label: '🎒 Students' },
            ] as const
          ).map((item) => {
            const active = audienceFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setAudienceFilter(item.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Notices List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#D97706']} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredNotices.map((notice) => {
          const isUrgent = notice.priority === 'urgent';
          const isImportant = notice.priority === 'important';

          return (
            <View key={notice.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.badgeRow}>
                  {/* Audience Badge */}
                  <View style={styles.audienceBadge}>
                    <Text style={styles.audienceText}>
                      {notice.targetAudience === 'all'
                        ? '📢 CAMPUS WIDE'
                        : notice.targetAudience === 'teachers'
                        ? '👨‍🏫 FACULTY ONLY'
                        : notice.targetAudience === 'parents'
                        ? '👨‍👩‍👧 PARENTS'
                        : '🎒 STUDENTS'}
                    </Text>
                  </View>

                  {/* Priority Badge */}
                  {isUrgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentBadgeText}>URGENT</Text>
                    </View>
                  )}
                  {isImportant && (
                    <View style={styles.importantBadge}>
                      <Text style={styles.importantBadgeText}>IMPORTANT</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.dateText}>{notice.publishedDate}</Text>
              </View>

              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeBody}>{notice.content}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.authorRow}>
                  <MaterialCommunityIcons name="shield-check" size={14} color="#D97706" />
                  <Text style={styles.authorText}>Issued by: {notice.author}</Text>
                </View>

                {notice.acknowledgedCount !== undefined && notice.acknowledgedCount > 0 && (
                  <View style={styles.ackRow}>
                    <MaterialCommunityIcons name="check-all" size={14} color="#16A34A" />
                    <Text style={styles.ackText}>{notice.acknowledgedCount} Acknowledged</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {filteredNotices.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="bullhorn-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No matching circulars</Text>
            <Text style={styles.emptySub}>All campus notices have been cleared or filter is empty</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.extrabold,
  },
  sectionSub: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D97706',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.button,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.regular,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: FontFamily.semibold,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audienceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: FontFamily.extrabold,
  },
  importantBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  importantBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    fontFamily: FontFamily.extrabold,
  },
  dateText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
    marginTop: 2,
  },
  noticeBody: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    fontFamily: FontFamily.regular,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    marginTop: 4,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.medium,
  },
  ackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ackText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#166534',
    fontFamily: FontFamily.semibold,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  emptySub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
});
