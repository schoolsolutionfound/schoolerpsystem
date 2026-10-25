import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { listDrives, updateDrive, PlacementDrive } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import { ShimmerProvider } from '../../student/components/ShimmerSkeleton';
import { PlacementDriveCardSkeleton } from './PlacementSkeleton';

export const getCompanyInitials = (name?: string): string => {
  if (!name) return 'CO';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0].substring(0, 2).toUpperCase();
};

type FilterTab = 'all' | 'published' | 'closed';

export function PlacementDrivesView() {
  const router = useRouter();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Close drive modal state
  const [driveToClose, setDriveToClose] = useState<PlacementDrive | null>(null);
  const [closingDrive, setClosingDrive] = useState(false);

  const fetchFeed = async () => {
    try {
      const drivesData = await listDrives().catch(() => []);
      setDrives(drivesData || []);
    } catch (err) {
      console.warn('Failed to load placement drives:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
  };

  const handleConfirmCloseDrive = async () => {
    if (!driveToClose) return;
    try {
      setClosingDrive(true);
      await updateDrive(driveToClose.id, { status: 'closed' });
      setDrives((prev) =>
        prev.map((d) => (d.id === driveToClose.id ? { ...d, status: 'closed' } : d))
      );
      setDriveToClose(null);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to close placement drive.');
    } finally {
      setClosingDrive(false);
    }
  };

  const filteredDrives = useMemo(() => {
    return drives.filter((d) => {
      const matchesFilter = selectedFilter === 'all' || d.status === selectedFilter;
      const matchesSearch =
        d.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [drives, selectedFilter, searchQuery]);

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ShimmerProvider>
          <PlacementDriveCardSkeleton />
          <PlacementDriveCardSkeleton />
        </ShimmerProvider>
      </ScrollView>
    );
  }

  const publishedCount = drives.filter((d) => d.status === 'published').length;
  const closedCount = drives.filter((d) => d.status === 'closed').length;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1A1B1C"
            colors={['#1A1B1C']}
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search company, job role, location..."
            placeholderTextColor="#9A9A9A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={8}>
              <Feather name="x" size={16} color="#6B6B6B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Responsive Horizontal Filter Tabs (White unselected, Yellow active, 5px radius) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabsScroll}
        >
          {(['all', 'published', 'closed'] as FilterTab[]).map((tab) => {
            const isActive = selectedFilter === tab;
            const labels: Record<FilterTab, string> = {
              all: 'All',
              published: 'Published',
              closed: 'Closed',
            };
            const counts: Record<FilterTab, number> = {
              all: drives.length,
              published: publishedCount,
              closed: closedCount,
            };
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.statusTabItem, isActive && styles.statusTabItemActive]}
                onPress={() => setSelectedFilter(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusTabText, isActive && styles.statusTabTextActive]}>
                  {labels[tab]} ({counts[tab]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Drives List */}
        {filteredDrives.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="briefcase-off-outline" size={44} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Placement Drives Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery
                ? 'No drives match your search query. Try clearing filters.'
                : 'Create a new placement drive to begin campus recruitment.'}
            </Text>
            <TouchableOpacity
              style={styles.createEmptyBtn}
              onPress={() => router.push('/(placement)/create')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="plus" size={18} color="#1A1B1C" />
              <Text style={styles.createEmptyText}>Create Drive</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredDrives.map((drive) => {
            const isPublished = drive.status === 'published';
            const isDraft = drive.status === 'draft';
            const statusLabel = isPublished ? 'Published' : isDraft ? 'Draft' : 'Closed';

            return (
              <TouchableOpacity
                key={drive.id}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/(placement)/${drive.id}` as any)}
              >
                {/* Header row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.companyInfoRow}>
                    {drive.logoUrl ? (
                      <Image source={{ uri: drive.logoUrl }} style={styles.logoImage} />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <Text style={styles.logoInitial}>
                          {getCompanyInitials(drive.companyName)}
                        </Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.companyName} numberOfLines={1}>{drive.companyName}</Text>
                      <Text style={styles.driveTitle} numberOfLines={1}>{drive.title}</Text>
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.statusCleanText,
                      isPublished ? styles.textPublished : isDraft ? styles.textDraft : styles.textClosed,
                    ]}
                  >
                    {statusLabel}
                  </Text>
                </View>

                {/* Details row */}
                <View style={styles.metaWrap}>
                  {drive.location ? (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText} numberOfLines={1}>{drive.location}</Text>
                    </View>
                  ) : null}
                  {drive.ctcOrStipend ? (
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText} numberOfLines={1}>{drive.ctcOrStipend}</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaItem}>
                    <Text style={styles.metaText}>
                      Deadline: {new Date(drive.applyDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Card footer */}
                <View style={styles.cardFooter}>
                  <View style={styles.roundsClean}>
                    <Text style={styles.roundsCleanText}>
                      {drive.rounds?.length || 0} Rounds
                    </Text>
                  </View>

                  <View style={styles.footerRightRow}>
                    {isPublished && (
                      <TouchableOpacity
                        style={styles.closeDriveLink}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          setDriveToClose(drive);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.closeDriveLinkText}>Close</Text>
                      </TouchableOpacity>
                    )}

                    <View style={styles.viewApplicantsBtn}>
                      <Text style={styles.viewApplicantsText}>View Applicants</Text>
                      <Feather name="arrow-right" size={13} color="#1A1B1C" />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(placement)/create')}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#1A1B1C" />
      </TouchableOpacity>

      {/* Close Drive Confirmation Modal */}
      <Modal
        visible={!!driveToClose}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!closingDrive) setDriveToClose(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <MaterialCommunityIcons name="lock-alert-outline" size={28} color="#DC2626" />
            </View>

            <Text style={styles.confirmTitle}>Close Placement Drive?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to close the recruitment drive for{' '}
              <Text style={{ fontWeight: '800', color: '#171717' }}>
                {driveToClose?.companyName} ({driveToClose?.title})
              </Text>
              ? Students will no longer be able to submit applications and the recruitment process will be finalized.
            </Text>

            <View style={styles.confirmFooter}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setDriveToClose(null)}
                disabled={closingDrive}
                activeOpacity={0.75}
              >
                <Text style={styles.confirmCancelText}>Keep Open</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmActionBtn}
                onPress={handleConfirmCloseDrive}
                disabled={closingDrive}
                activeOpacity={0.85}
              >
                {closingDrive ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmActionBtnText}>Yes, Close Drive</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF7' },
  container: { padding: 14, paddingBottom: 90, gap: 12 },

  // Dark Overview Card
  overallCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: 4,
  },
  heroValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F4C430',
    lineHeight: 32,
  },
  heroLabel: {
    fontSize: 9.5,
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#2D2E30',
    marginHorizontal: 4,
  },
  statsSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
    minWidth: 0,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  statLabel: {
    fontSize: 9,
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Search Box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontFamily: FontFamily.regular,
  },

  // Responsive Horizontal Filter Tabs
  statusTabsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  statusTabItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  statusTabItemActive: {
    backgroundColor: '#F4C430',
    borderColor: '#F4C430',
  },
  statusTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  statusTabTextActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },

  // Drive Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  logoImage: { width: 44, height: 44, borderRadius: 8, resizeMode: 'contain' },
  logoPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  companyName: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '600',
  },
  driveTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    marginTop: 2,
  },

  // Status text clean (no pill bg)
  statusCleanText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
  textPublished: {
    color: '#16A34A',
  },
  textDraft: {
    color: '#D97706',
  },
  textClosed: {
    color: '#6B6B6B',
  },

  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '600',
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F1EA',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roundsClean: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  roundsCleanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  footerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeDriveLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  closeDriveLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textDecorationLine: 'underline',
  },
  viewApplicantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewApplicantsText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 260,
  },
  createEmptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 16,
  },
  createEmptyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },

  // Confirmation Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  confirmIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 13,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 19,
    fontFamily: FontFamily.regular,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  confirmFooter: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  confirmActionBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
