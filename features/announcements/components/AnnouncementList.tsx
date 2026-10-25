import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AnnouncementCard } from './AnnouncementCard';
import { AnnouncementDetailModal } from './AnnouncementDetailModal';
import { CreateAnnouncementModal } from './CreateAnnouncementModal';
import { AnnouncementFilters } from './AnnouncementFilters';
import { Announcement, AnnouncementFilterState } from '../types';
import { LoadingView } from '../../shared/components/LoadingView';
import { EmptyState } from '../../shared/components/EmptyState';
import { ErrorState } from '../../shared/components/ErrorState';
import { Colors } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';

interface AnnouncementListProps {
  items: Announcement[];
  total: number;
  loading: boolean;
  refreshing?: boolean;
  error?: any;
  onRefresh: () => void;
  filters: AnnouncementFilterState;
  onFilterChange: (filters: Partial<AnnouncementFilterState>) => void;
  onCreate?: (payload: any) => Promise<void>;
  onUpdate?: (id: string, payload: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onPublish?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  onMarkRead?: (id: string) => Promise<void>;
  isManagement?: boolean;
  unreadCount?: number;
  actionLoading?: boolean;
  allowBroadTargets?: boolean;
  onEndReached?: () => void;
  loadingMore?: boolean;
}

export const AnnouncementList: React.FC<AnnouncementListProps> = ({
  items,
  loading,
  refreshing = false,
  error,
  onRefresh,
  filters,
  onFilterChange,
  onCreate,
  onUpdate,
  onDelete,
  onMarkRead,
  isManagement = false,
  actionLoading = false,
}) => {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const startRange = items.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endRange = Math.min(currentPage * ITEMS_PER_PAGE, items.length);

  const handleCreateSubmit = async (payload: any) => {
    if (editingAnnouncement && onUpdate) {
      await onUpdate(editingAnnouncement.id, payload);
    } else if (onCreate) {
      await onCreate(payload);
    }
    setEditingAnnouncement(null);
    setCreateModalVisible(false);
  };

  const handleCardDelete = async (ann: Announcement) => {
    if (onDelete) {
      await onDelete(ann.id);
      if (selectedAnnouncement?.id === ann.id) {
        setSelectedAnnouncement(null);
      }
    }
  };

  if (loading && items.length === 0 && !error) {
    return <LoadingView message="Loading announcements..." />;
  }

  if (error && items.length === 0) {
    return (
      <ErrorState
        message={error.message || 'Failed to load announcements'}
        onRetry={onRefresh}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header & Add Announcement Button */}
      {onCreate && (
        <View style={styles.headerRow}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">
              Announcements
            </Text>
            
          </View>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => {
              setEditingAnnouncement(null);
              setCreateModalVisible(true);
            }}
            disabled={actionLoading}
            activeOpacity={0.8}
          >
            
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Clean Search Bar */}
      <AnnouncementFilters
        filters={filters}
        onFilterChange={onFilterChange}
        isManagement={isManagement}
      />

      {/* Announcement List */}
      <FlatList
        data={paginatedItems}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <AnnouncementCard
            announcement={item}
            onPress={(ann) => setSelectedAnnouncement(ann)}
            onDelete={onDelete ? handleCardDelete : undefined}
            disabled={actionLoading}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            iconName="bullhorn-outline"
            title="No Announcements"
            description="Tap '+ Add' to post a notice with a time period."
          />
        }
        ListFooterComponent={
          items.length > 0 ? (
            <View style={styles.paginationContainer}>
              <Text style={styles.paginationInfo}>
                Showing {startRange}-{endRange} of {items.length} announcements
              </Text>
              <View style={styles.paginationBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.paginationBtn,
                    currentPage === 1 && styles.paginationBtnDisabled,
                  ]}
                  disabled={currentPage === 1}
                  onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="chevron-left" size={18} color={currentPage === 1 ? '#9CA3AF' : '#171717'} />
                  <Text
                    style={[
                      styles.paginationBtnText,
                      currentPage === 1 && styles.paginationBtnTextDisabled,
                    ]}
                  >
                    Prev
                  </Text>
                </TouchableOpacity>

                <View style={styles.paginationIndicator}>
                  <Text style={styles.paginationIndicatorText}>
                    {currentPage} / {totalPages}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.paginationBtn,
                    currentPage === totalPages && styles.paginationBtnDisabled,
                  ]}
                  disabled={currentPage === totalPages}
                  onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.paginationBtnText,
                      currentPage === totalPages && styles.paginationBtnTextDisabled,
                    ]}
                  >
                    Next
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={currentPage === totalPages ? '#9CA3AF' : '#171717'} />
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 && { flexGrow: 1, justifyContent: 'center' },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor="#000000"
            colors={['#000000']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      />

      {/* Detail Modal */}
      <AnnouncementDetailModal
        visible={Boolean(selectedAnnouncement)}
        onClose={() => setSelectedAnnouncement(null)}
        announcement={selectedAnnouncement}
        onMarkRead={onMarkRead}
        onDelete={onDelete ? handleCardDelete : undefined}
      />

      {/* Create / Edit Modal */}
      {onCreate && (
        <CreateAnnouncementModal
          visible={createModalVisible}
          onClose={() => {
            setCreateModalVisible(false);
            setEditingAnnouncement(null);
          }}
          onSubmit={handleCreateSubmit}
          initialData={editingAnnouncement}
          loading={actionLoading}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontFamily: FontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  listContent: {
    paddingBottom: 40,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    flexWrap: 'wrap',
    gap: 10,
  },
  paginationInfo: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#64748B',
  },
  paginationBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  paginationBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  paginationBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  paginationBtnTextDisabled: {
    color: '#9CA3AF',
  },
  paginationIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    backgroundColor: '#FFFDF0',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  paginationIndicatorText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
});
