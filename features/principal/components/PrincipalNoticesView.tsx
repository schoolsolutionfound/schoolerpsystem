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
          <View style={styles.titleWrap}>
            <Text style={styles.sectionTitle} numberOfLines={1}>Campus Circulars</Text>
            <Text style={styles.sectionSub} numberOfLines={1}>Official announcements & broadcasts</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={onOpenCreateModal} activeOpacity={0.8}>
            <Feather name="plus" size={16} color="#1A1B1C" />
            <Text style={styles.addBtnText}>Publish</Text>
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
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(
            [
              { key: 'all' as const, label: `All Circulars (${notices.length})`, icon: 'bullhorn-outline' as const },
              { key: 'urgent' as const, label: 'Urgent Priority', icon: 'alert-decagram' as const },
              { key: 'teachers' as const, label: 'Faculty & Staff', icon: 'account-tie-outline' as const },
              { key: 'parents' as const, label: 'Parents', icon: 'account-child-outline' as const },
              { key: 'students' as const, label: 'Students', icon: 'school-outline' as const },
            ]
          ).map((item) => {
            const active = audienceFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setAudienceFilter(item.key)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={14}
                  color={active ? '#F4C430' : item.key === 'urgent' ? '#DC2626' : '#6B6B6B'}
                />
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
                    <MaterialCommunityIcons
                      name={
                        notice.targetAudience === 'all'
                          ? 'bullhorn-outline'
                          : notice.targetAudience === 'teachers'
                          ? 'account-tie-outline'
                          : notice.targetAudience === 'parents'
                          ? 'account-child-outline'
                          : 'school-outline'
                      }
                      size={12}
                      color="#1A1B1C"
                    />
                    <Text style={styles.audienceText}>
                      {notice.targetAudience === 'all'
                        ? 'CAMPUS WIDE'
                        : notice.targetAudience === 'teachers'
                        ? 'FACULTY ONLY'
                        : notice.targetAudience === 'parents'
                        ? 'PARENTS'
                        : 'STUDENTS'}
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

                  {/* Target Department Badge */}
                  {notice.department ? (
                    <View style={styles.deptBadge}>
                      <MaterialCommunityIcons name="tag-outline" size={11} color="#2563EB" />
                      <Text style={styles.deptBadgeText}>{notice.department.toUpperCase()}</Text>
                    </View>
                  ) : null}
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
    backgroundColor: '#FFFDF7',
  },
  headerBlock: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    gap: 12,
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 16,
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
    gap: 5,
    backgroundColor: '#F4C430',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.button,
    flexShrink: 0,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
    fontFamily: FontFamily.semibold,
  },
  filterChipTextActive: {
    color: '#F4C430',
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
    borderColor: '#E8E5DC',
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
    alignItems: 'flex-start',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  audienceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  urgentBadge: {
    backgroundColor: '#DC262618',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    fontFamily: FontFamily.extrabold,
  },
  importantBadge: {
    backgroundColor: '#F59E0B18',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  importantBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    fontFamily: FontFamily.extrabold,
  },
  deptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B82F618',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F630',
  },
  deptBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: FontFamily.bold,
  },
  dateText: {
    fontSize: 11,
    color: '#8A8A8A',
    fontFamily: FontFamily.regular,
    marginTop: 2,
    flexShrink: 0,
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
    borderTopColor: '#E8E5DC',
    paddingTop: 8,
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 140,
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
    color: '#16A34A',
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
