import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { SchoolNotice } from '../types/principal.types';

interface PrincipalNoticesViewProps {
  notices: SchoolNotice[];
  refreshing: boolean;
  onRefresh: () => void;
  onOpenCreateModal: () => void;
  onDeleteNotice?: (id: string) => void;
  onUpdateNotice?: (notice: SchoolNotice) => Promise<void> | void;
}

type AudienceFilterKey = 'all' | 'urgent' | 'teachers' | 'students' | 'parents';

const INSTITUTION_DEPARTMENTS = [
  'Computer Science',
  'AIML',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'Commerce & Mgmt',
  'Applied Sciences',
];

export const PrincipalNoticesView: React.FC<PrincipalNoticesViewProps> = ({
  notices,
  refreshing,
  onRefresh,
  onOpenCreateModal,
  onDeleteNotice,
  onUpdateNotice,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const maxContentWidth = Math.min(width, 1200);
  const cardGap = 10;
  const cardWidth = isDesktop
    ? Math.floor((maxContentWidth - 32 - cardGap) / 2)
    : '100%';

  const [localNotices, setLocalNotices] = useState<SchoolNotice[]>(notices);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<AudienceFilterKey>('all');
  const [localDeletedIds, setLocalDeletedIds] = useState<string[]>([]);

  // Edit Modal State
  const [editingNotice, setEditingNotice] = useState<SchoolNotice | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<SchoolNotice['priority']>('important');
  const [editAudience, setEditAudience] = useState<SchoolNotice['targetAudience']>('all');
  const [editDepartment, setEditDepartment] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setLocalNotices(notices);
  }, [notices]);

  const handleStartEdit = (notice: SchoolNotice) => {
    setEditingNotice(notice);
    setEditTitle(notice.title);
    setEditContent(notice.content);
    setEditPriority(notice.priority || 'important');
    setEditAudience(notice.targetAudience || 'all');
    setEditDepartment(notice.department || '');
  };

  const handleSaveEdit = async () => {
    if (!editingNotice || !editTitle.trim() || !editContent.trim()) return;

    setSavingEdit(true);
    try {
      const updatedNotice: SchoolNotice = {
        ...editingNotice,
        title: editTitle.trim(),
        content: editContent.trim(),
        priority: editPriority,
        targetAudience: editAudience,
        department: editDepartment.trim() === 'all' ? '' : editDepartment.trim(),
      };

      setLocalNotices((prev) =>
        prev.map((n) => (n.id === updatedNotice.id ? updatedNotice : n))
      );

      if (onUpdateNotice) {
        await onUpdateNotice(updatedNotice);
      }

      setEditingNotice(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setLocalDeletedIds((prev) => [...prev, id]);
            setLocalNotices((prev) => prev.filter((n) => n.id !== id));
            if (onDeleteNotice) {
              onDeleteNotice(id);
            }
          },
        },
      ]
    );
  };

  const filteredNotices = useMemo(() => {
    return localNotices
      .filter((n) => !localDeletedIds.includes(n.id))
      .filter((n) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (n.author && n.author.toLowerCase().includes(q)) ||
          (n.department && n.department.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        if (activeFilter === 'all') return true;
        if (activeFilter === 'urgent') return n.priority === 'urgent';
        return n.targetAudience === activeFilter || n.targetAudience === 'all';
      });
  }, [localNotices, localDeletedIds, search, activeFilter]);

  const urgentCount = useMemo(
    () => localNotices.filter((n) => !localDeletedIds.includes(n.id) && n.priority === 'urgent').length,
    [localNotices, localDeletedIds]
  );

  return (
    <View style={styles.container}>
      {/* 1. Header (Flush left, proper heading, clean black button) */}
      <View style={styles.headerRow}>
        <Text style={styles.pageHeading} numberOfLines={1}>
          Announcements
        </Text>
        <TouchableOpacity
          style={styles.newNoticeBtn}
          onPress={onOpenCreateModal}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={13} color="#FFFFFF" />
          <Text style={styles.newNoticeBtnText}>New Notice</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Search Bar & Audience Filters (Neutral, Zero bright colors) */}
      <View style={styles.searchSectionWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={14} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity
              onPress={() => setSearch('')}
              style={styles.clearSearchBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={13} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Audience Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { key: 'all' as const, label: `All (${localNotices.length - localDeletedIds.length})` },
            { key: 'urgent' as const, label: `Urgent (${urgentCount})` },
            { key: 'teachers' as const, label: 'Faculty' },
            { key: 'students' as const, label: 'Students' },
            { key: 'parents' as const, label: 'Parents' },
          ].map((item) => {
            const active = activeFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(item.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.filterChipText, active && styles.filterChipTextActive]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. List Meta Header (Subtle, clean, neutral) */}
      <View style={styles.listMetaRow}>
        <Text style={styles.listMetaCount}>
          {filteredNotices.length} {filteredNotices.length === 1 ? 'Notice' : 'Notices'}
        </Text>
        {(activeFilter !== 'all' || search.length > 0) && (
          <TouchableOpacity
            style={styles.resetFilterBtn}
            onPress={() => {
              setActiveFilter('all');
              setSearch('');
            }}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={11} color="#4B5563" />
            <Text style={styles.resetFilterText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Announcements List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#111827']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotices.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="bell-off" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No announcements found</Text>
            <Text style={styles.emptySub}>
              {search || activeFilter !== 'all'
                ? 'Try adjusting your search query or audience filter criteria.'
                : 'Broadcast your first circular to faculty, students, or parents.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={onOpenCreateModal}
              activeOpacity={0.8}
            >
              <Feather name="plus" size={13} color="#FFFFFF" />
              <Text style={styles.emptyActionBtnText}>Create Notice</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            {filteredNotices.map((notice) => {
              const audienceLabel =
                notice.targetAudience === 'teachers'
                  ? 'Faculty'
                  : notice.targetAudience === 'students'
                  ? 'Students'
                  : notice.targetAudience === 'parents'
                  ? 'Parents'
                  : 'Campus Wide';

              return (
                <View
                  key={notice.id}
                  style={[styles.card, { width: cardWidth }]}
                >
                  {/* Top Meta Line: Clean Neutral Badge + Date + Edit / Delete */}
                  <View style={styles.cardTopRow}>
                    <View style={styles.badgeRow}>
                      <View style={styles.priorityBadge}>
                        <Text style={styles.priorityBadgeText}>
                          {(notice.priority || 'notice').toUpperCase()}
                        </Text>
                      </View>

                      <Text style={styles.metaDivider}>·</Text>
                      <Text style={styles.audienceText}>{audienceLabel}</Text>

                      {notice.department ? (
                        <>
                          <Text style={styles.metaDivider}>·</Text>
                          <Text style={styles.deptText} numberOfLines={1}>
                            {notice.department}
                          </Text>
                        </>
                      ) : null}
                    </View>

                    {/* Top Right Actions: Date + Edit Button + Delete Button */}
                    <View style={styles.cardTopRight}>
                      <Text style={styles.publishedDateText}>
                        {notice.publishedDate || 'Today'}
                      </Text>
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => handleStartEdit(notice)}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="edit-2" size={13} color="#4B5563" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cardActionBtn}
                        onPress={() => handleDelete(notice.id, notice.title)}
                        activeOpacity={0.6}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={13} color="#9CA3AF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Card Title */}
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {notice.title}
                  </Text>

                  {/* Card Content */}
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {notice.content}
                  </Text>

                  {/* Card Footer: Clean subtle line */}
                  <View style={styles.cardFooter}>
                    <View style={styles.authorRow}>
                      <Text style={styles.authorPrefix}>By</Text>
                      <Text style={styles.authorName}>
                        {notice.author || 'School Administration'}
                      </Text>
                    </View>
                    {notice.expiresAt ? (
                      <Text style={styles.expiryText}>
                        Valid till {notice.expiresAt}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 5. EDIT ANNOUNCEMENT MODAL (Clean, neutral styling) */}
      <Modal
        visible={editingNotice !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingNotice(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalDialog}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={styles.modalIconSquare}>
                  <Feather name="edit-3" size={15} color="#111827" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Edit Announcement</Text>
                  <Text style={styles.modalSubtitle}>Update details for this circular</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setEditingNotice(null)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollArea} contentContainerStyle={styles.modalScrollContent}>
              {/* Notice Title */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Notice Title *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter notice title..."
                  placeholderTextColor="#9CA3AF"
                  value={editTitle}
                  onChangeText={setEditTitle}
                />
              </View>

              {/* Target Audience */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Target Audience *</Text>
                <View style={styles.modalChipsWrap}>
                  {(
                    [
                      { key: 'all' as const, label: 'All Campus' },
                      { key: 'teachers' as const, label: 'Faculty' },
                      { key: 'students' as const, label: 'Students' },
                      { key: 'parents' as const, label: 'Parents' },
                    ] as const
                  ).map((aud) => {
                    const active = editAudience === aud.key;
                    return (
                      <TouchableOpacity
                        key={aud.key}
                        style={[styles.modalChip, active && styles.modalChipActive]}
                        onPress={() => setEditAudience(aud.key)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                          {aud.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Target Department */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Target Department</Text>
                <View style={styles.modalChipsWrap}>
                  {[
                    { key: '', label: 'All Departments' },
                    ...INSTITUTION_DEPARTMENTS.map((d) => ({ key: d, label: d })),
                  ].map((dept) => {
                    const active = (editDepartment || '').toLowerCase() === dept.key.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={dept.key}
                        style={[styles.modalChip, active && styles.modalChipActive]}
                        onPress={() => setEditDepartment(dept.key)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                          {dept.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Priority */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Priority</Text>
                <View style={styles.modalPriorityRow}>
                  {(['normal', 'important', 'urgent'] as const).map((p) => {
                    const active = editPriority === p;
                    const label =
                      p === 'normal'
                        ? 'Routine / Info'
                        : p === 'important'
                        ? 'Important'
                        : 'Urgent';

                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.modalPriorityBtn, active && styles.modalPriorityBtnActive]}
                        onPress={() => setEditPriority(p)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.modalPriorityText,
                            active && styles.modalPriorityTextActive,
                          ]}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Content Body */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Circular Content *</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Draft announcement details, instructions, or guidelines..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={editContent}
                  onChangeText={setEditContent}
                />
              </View>
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setEditingNotice(null)}
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveEdit}
                disabled={!editTitle.trim() || !editContent.trim() || savingEdit}
                style={[
                  styles.modalSaveBtn,
                  (!editTitle.trim() || !editContent.trim() || savingEdit) && styles.modalSaveBtnDisabled,
                ]}
                activeOpacity={0.8}
              >
                {savingEdit ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Feather name="check" size={13} color="#FFFFFF" />
                    <Text style={styles.modalSaveText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // 1. Header (Flush left, proper heading, no description)
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  pageHeading: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#111827',
    letterSpacing: -0.3,
    flex: 1,
    marginRight: 12,
  },
  newNoticeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 6,
  },
  newNoticeBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },

  // 2. Search & Filter Bar
  searchSectionWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 1,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  filterChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // 3. List Meta Header
  listMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listMetaCount: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#6B7280',
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetFilterText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#4B5563',
  },

  // 4. Scroll List Container
  list: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    paddingBottom: 110,
  },
  cardsGrid: {
    gap: 8,
  },
  cardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // 5. Notice Card (Clean, Neutral, NO Colored Side Bars)
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priorityBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: '#374151',
    letterSpacing: 0.3,
  },
  metaDivider: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  audienceText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  deptText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  publishedDateText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 2,
  },
  cardActionBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F3F4F6',
  },

  // Card Typography
  cardTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 3,
  },
  cardDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    color: '#4B5563',
    lineHeight: 17,
    marginBottom: 6,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 6,
    marginTop: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  authorPrefix: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  authorName: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#4B5563',
  },
  expiryText: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#9CA3AF',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
    marginBottom: 3,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 17,
    marginBottom: 14,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  emptyActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Modal Styles (Color-Neutral, Executive)
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalHeaderTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScrollArea: {
    maxHeight: 400,
  },
  modalScrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  modalFieldGroup: {
    gap: 5,
  },
  modalLabel: {
    fontSize: 11.5,
    color: '#374151',
    fontFamily: FontFamily.bold,
  },
  modalInput: {
    height: 38,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#111827',
    fontFamily: FontFamily.regular,
  },
  modalTextArea: {
    height: 84,
    paddingVertical: 8,
  },
  modalChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modalChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  modalChipText: {
    fontSize: 11.5,
    color: '#4B5563',
    fontFamily: FontFamily.medium,
  },
  modalChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  modalPriorityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  modalPriorityBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalPriorityBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  modalPriorityText: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: FontFamily.medium,
  },
  modalPriorityTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  modalCancelText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: FontFamily.medium,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalSaveBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  modalSaveText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
});
