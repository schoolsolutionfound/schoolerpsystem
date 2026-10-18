import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { DepartmentNotice } from '../types/hod.types';

interface HODNoticesViewProps {
  notices: DepartmentNotice[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
}

export const HODNoticesView: React.FC<HODNoticesViewProps> = ({
  notices,
  refreshing,
  onRefresh,
  onOpenCreateModal,
}) => {
  const { width: windowWidth } = useWindowDimensions();
  const maxContentWidth = Math.min(windowWidth, 1200);
  const isDesktop = windowWidth >= 768;
  const cardGap = 12;
  const cardWidth = isDesktop ? Math.floor((maxContentWidth - 32 - cardGap) / 2) : '100%';

  const [search, setSearch] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<DepartmentNotice['targetAudience'] | 'all'>('all');

  const filteredNotices = notices.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch =
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.department.toLowerCase().includes(q);

    const matchesAudience = selectedAudience === 'all' || n.targetAudience === selectedAudience;

    return matchesSearch && matchesAudience;
  });

  const getPriorityStyle = (priority: DepartmentNotice['priority']) => {
    switch (priority) {
      case 'urgent':
        return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
      case 'important':
        return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
      case 'normal':
        return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
    }
  };

  const getAudienceLabel = (aud: DepartmentNotice['targetAudience']) => {
    switch (aud) {
      case 'all':
        return 'All Department';
      case 'faculty':
        return 'Faculty Members';
      case 'students':
        return 'Students';
      case 'lab_assistants':
        return 'Lab Instructors';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Action Bar */}
      <View style={styles.headerBar}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search department memos & circulars..."
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9E9E9E" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.createBtn} onPress={onOpenCreateModal} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={18} color="#1A1B1C" />
          <Text style={styles.createBtnText}>New Memo</Text>
        </TouchableOpacity>
      </View>

      {/* Target Audience Filters */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'faculty', 'students', 'lab_assistants'] as const).map((aud) => {
            const isSelected = selectedAudience === aud;
            return (
              <TouchableOpacity
                key={aud}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedAudience(aud)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {aud === 'all' ? 'All Audiences' : getAudienceLabel(aud)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Memo List */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Showing <Text style={{ fontWeight: '800', color: '#171717' }}>{filteredNotices.length}</Text> Departmental Circulars
          </Text>
        </View>

        <View style={styles.memosGrid}>
          {filteredNotices.map((n) => {
            const pStyle = getPriorityStyle(n.priority);

            return (
              <View key={n.id} style={[styles.memoCard, { width: cardWidth }]}>
                <View style={styles.cardHeader}>
                <View style={[styles.priorityBadge, { backgroundColor: pStyle.bg, borderColor: pStyle.border }]}>
                  <Text style={[styles.priorityBadgeText, { color: pStyle.text }]}>
                    {n.priority.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.audienceBadge}>
                  <MaterialCommunityIcons name="account-group-outline" size={12} color="#6B6B6B" />
                  <Text style={styles.audienceBadgeText}>{getAudienceLabel(n.targetAudience)}</Text>
                </View>

                <Text style={styles.dateText}>{n.publishedDate}</Text>
              </View>

              <Text style={styles.memoTitle}>{n.title}</Text>
              <Text style={styles.memoContent}>{n.content}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.authorRow}>
                  <MaterialCommunityIcons name="shield-account" size={14} color="#EA580C" />
                  <Text style={styles.authorText}>
                    {n.authorName} • <Text style={{ color: '#6B6B6B' }}>{n.authorRole}</Text>
                  </Text>
                </View>
                </View>
              </View>
            );
          })}
        </View>

        {filteredNotices.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bullhorn-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No notices found</Text>
            <Text style={styles.emptyStateSub}>No circulars match your current filter or search criteria.</Text>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    gap: 10,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 12,
    height: 40,
    gap: 4,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
    fontFamily: FontFamily.poppins,
  },
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    paddingVertical: 8,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  filterScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.chip,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  filterChipSelected: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  filterChipTextSelected: {
    color: '#F4C430',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  memosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryBar: {
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  memoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: FontFamily.poppins,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  audienceBadgeText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '600',
    fontFamily: FontFamily.poppins,
  },
  dateText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 'auto',
    fontFamily: FontFamily.poppins,
    marginTop: 2,
  },
  memoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  memoContent: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 18,
    fontFamily: FontFamily.poppins,
  },
  cardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    minWidth: 140,
  },
  authorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  deptSub: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
});
