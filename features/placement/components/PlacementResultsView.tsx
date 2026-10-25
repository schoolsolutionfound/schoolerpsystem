import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Platform,
  Modal,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { getAllPlacementResults, PlacementResultItem } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

type StatusFilter = 'all' | 'shortlisted' | 'hired' | 'applied' | 'rejected';

export function PlacementResultsView() {
  const [results, setResults] = useState<PlacementResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [companyModalVisible, setCompanyModalVisible] = useState(false);

  const fetchResults = async () => {
    try {
      const data = await getAllPlacementResults();
      setResults(data || []);
    } catch (err) {
      console.warn('[PlacementResultsView] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchResults();
  };

  const openResume = async (url?: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        if (Platform.OS === 'web') window.open(url, '_blank');
      }
    } catch (err) {
      console.warn('Could not open resume:', err);
    }
  };

  // Deduplicate candidates per company so each student appears only once
  // with their latest / highest status (hired > shortlisted > applied > rejected > withdrawn)
  const deduplicatedResults = useMemo(() => {
    const STATUS_PRIORITY: Record<string, number> = {
      hired: 5,
      selected: 5,
      shortlisted: 4,
      applied: 3,
      rejected: 2,
      withdrawn: 1,
    };

    const map = new Map<string, PlacementResultItem>();

    results.forEach((item) => {
      const studentKey = item.studentId || item.student?.id || '';
      const companyKey = (item.drive?.companyName || item.driveId || '').toLowerCase().trim();
      const key = `${studentKey}__${companyKey}`;

      const existing = map.get(key);
      if (!existing) {
        map.set(key, item);
      } else {
        const existingPriority = STATUS_PRIORITY[existing.status] || 0;
        const currentPriority = STATUS_PRIORITY[item.status] || 0;

        if (currentPriority > existingPriority) {
          map.set(key, item);
        } else if (currentPriority === existingPriority) {
          if (item.status === 'shortlisted') {
            if ((item.currentRoundIndex || 0) > (existing.currentRoundIndex || 0)) {
              map.set(key, item);
            }
          }
        }
      }
    });

    return Array.from(map.values());
  }, [results]);

  // Extract unique companies from drives
  const companies = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => {
      const name = r.drive?.companyName?.trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [results]);

  // Filter candidates by selected company
  const companyFilteredResults = useMemo(() => {
    if (selectedCompany === 'all') return deduplicatedResults;
    return deduplicatedResults.filter((item) => {
      return (item.drive?.companyName || '').toLowerCase().trim() === selectedCompany.toLowerCase().trim();
    });
  }, [deduplicatedResults, selectedCompany]);

  // Status counts for the selected company
  const counts = useMemo(() => {
    const total = companyFilteredResults.length;
    const shortlisted = companyFilteredResults.filter((r) => r.status === 'shortlisted').length;
    const hired = companyFilteredResults.filter(
      (r) => r.status === 'hired' || (r.status as string) === 'selected'
    ).length;
    const applied = companyFilteredResults.filter((r) => r.status === 'applied').length;
    const rejected = companyFilteredResults.filter((r) => r.status === 'rejected').length;
    return { total, shortlisted, hired, applied, rejected };
  }, [companyFilteredResults]);

  // Filtered results by search and status
  const filteredResults = useMemo(() => {
    return companyFilteredResults.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'hired') {
          if (item.status !== 'hired' && (item.status as string) !== 'selected') return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      // 2. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase().trim();
        const candidateName = item.student?.fullName?.toLowerCase() || '';
        const rollNo = item.student?.rollNoOrUSN?.toLowerCase() || '';
        const branch = item.student?.branch?.toLowerCase() || '';
        const company = item.drive?.companyName?.toLowerCase() || '';
        const roleTitle = item.drive?.title?.toLowerCase() || '';
        return (
          candidateName.includes(q) ||
          rollNo.includes(q) ||
          branch.includes(q) ||
          company.includes(q) ||
          roleTitle.includes(q)
        );
      }

      return true;
    });
  }, [companyFilteredResults, statusFilter, searchQuery]);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F4C430" />
      </View>
    );
  }

  const statusTabList: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.total },
    { key: 'shortlisted', label: 'Shortlisted', count: counts.shortlisted },
    { key: 'hired', label: 'Hired', count: counts.hired },
    { key: 'applied', label: 'Applied', count: counts.applied },
    { key: 'rejected', label: 'Rejected', count: counts.rejected },
  ];

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
          <Feather name="search" size={16} color="#6B6B6B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search candidate, USN, role..."
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

        {/* Company Dropdown Trigger */}
        <TouchableOpacity
          style={styles.companySelectBtn}
          onPress={() => setCompanyModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.companySelectLeft}>
            <MaterialCommunityIcons name="domain" size={18} color="#171717" />
            <Text style={styles.companySelectText} numberOfLines={1}>
              {selectedCompany === 'all'
                ? 'All Companies'
                : selectedCompany}
            </Text>
          </View>
          <Feather name="chevron-down" size={18} color="#6B6B6B" />
        </TouchableOpacity>

        {/* Responsive Horizontal Status Tabs (No Text Wrapping in Mobile, 5px border radius) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabsScroll}
        >
          {statusTabList.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.statusTabItem, isActive && styles.statusTabItemActive]}
                onPress={() => setStatusFilter(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.statusTabText, isActive && styles.statusTabTextActive]}>
                  {tab.label} ({tab.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header with subtle candidate count (NO stat cards) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {selectedCompany === 'all' ? 'All Results' : `${selectedCompany} Results`}
          </Text>
          <Text style={styles.countText}>
            {filteredResults.length} {filteredResults.length === 1 ? 'candidate' : 'candidates'}
          </Text>
        </View>

        {/* Candidate Cards List */}
        {filteredResults.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={38} color="#8A8A8A" />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptySub}>
              There are no candidates matching your current filter or search criteria.
            </Text>
          </View>
        ) : (
          filteredResults.map((item) => {
            const student = item.student;
            const drive = item.drive;
            const initials = student?.fullName
              ? student.fullName.substring(0, 2).toUpperCase()
              : 'ST';

            return (
              <View key={`${item.id}_${item.studentId}`} style={styles.resultCard}>
                {/* Candidate & Company Header */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>

                  <View style={styles.headerInfoCol}>
                    <View style={styles.nameRow}>
                      <Text style={styles.candidateName} numberOfLines={1}>
                        {student?.fullName || 'Student'}
                      </Text>
                    </View>

                    <Text style={styles.usnBranchText} numberOfLines={1}>
                      {student?.rollNoOrUSN ? `${student.rollNoOrUSN} • ` : ''}
                      {student?.branch || 'Computer Science'}
                    </Text>
                  </View>
                </View>

                {/* Company & Role Line */}
                <View style={styles.companyRow}>
                  <Text style={styles.companyName} numberOfLines={1}>
                    {drive?.companyName || 'Company'}{' '}
                    <Text style={styles.roleTitle}>— {drive?.title || 'Open Position'}</Text>
                  </Text>
                  {drive?.ctcOrStipend ? (
                    <Text style={styles.packageText}>{drive.ctcOrStipend}</Text>
                  ) : null}
                </View>

                {/* Dynamic Status State (Clean typography, NO pill backgrounds!) */}
                <View style={styles.statusRow}>
                  {item.status === 'hired' || (item.status as string) === 'selected' ? (
                    <Text style={styles.hiredStatusText}>
                      Hired • Selected & Offer Extended
                    </Text>
                  ) : item.status === 'shortlisted' ? (
                    <Text style={styles.shortlistedStatusText}>
                      Shortlisted • {item.currentRoundName || `Round ${(item.currentRoundIndex || 0) + 1}`}
                    </Text>
                  ) : item.status === 'applied' ? (
                    <Text style={styles.appliedStatusText}>
                      Applied • Review Pending
                    </Text>
                  ) : item.status === 'rejected' ? (
                    <Text style={styles.rejectedStatusText}>Not Selected</Text>
                  ) : (
                    <Text style={styles.withdrawnStatusText}>Withdrawn</Text>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Card Footer: Academic Snapshot & Resume Action */}
                <View style={styles.cardFooterRow}>
                  <Text style={styles.academicMetaText}>
                    CGPA {student?.cgpa != null ? student.cgpa : 'N/A'} •{' '}
                    {student?.activeBacklogs ?? 0} backlogs
                  </Text>

                  {item.resumeUrl ? (
                    <TouchableOpacity
                      onPress={() => openResume(item.resumeUrl)}
                      style={styles.resumeLink}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resumeLinkText}>View Resume</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.noResumeText}>No Resume</Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Company Selector Modal (Border Radius 5px) */}
      <Modal
        visible={companyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCompanyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCompanyModalVisible(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Company</Text>
              <TouchableOpacity
                onPress={() => setCompanyModalVisible(false)}
                hitSlop={8}
                style={styles.modalCloseBtn}
              >
                <Feather name="x" size={18} color="#171717" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.companyListScroll} showsVerticalScrollIndicator={false}>
              {/* Option: All Companies */}
              <TouchableOpacity
                style={[
                  styles.companyOptionRow,
                  selectedCompany === 'all' && styles.companyOptionRowActive,
                ]}
                onPress={() => {
                  setSelectedCompany('all');
                  setCompanyModalVisible(false);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.companyOptionInfo}>
                  <Text
                    style={[
                      styles.companyOptionName,
                      selectedCompany === 'all' && styles.companyOptionNameActive,
                    ]}
                  >
                    All Companies
                  </Text>
                  <Text style={styles.companyOptionCount}>
                    {deduplicatedResults.length} candidates
                  </Text>
                </View>
                {selectedCompany === 'all' && (
                  <Feather name="check" size={18} color="#1A1B1C" />
                )}
              </TouchableOpacity>

              {/* Unique Companies from Drives */}
              {companies.map((comp) => {
                const isSelected = selectedCompany.toLowerCase() === comp.toLowerCase();
                const compCandidateCount = deduplicatedResults.filter(
                  (d) => (d.drive?.companyName || '').toLowerCase() === comp.toLowerCase()
                ).length;

                return (
                  <TouchableOpacity
                    key={comp}
                    style={[
                      styles.companyOptionRow,
                      isSelected && styles.companyOptionRowActive,
                    ]}
                    onPress={() => {
                      setSelectedCompany(comp);
                      setCompanyModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.companyOptionInfo}>
                      <Text
                        style={[
                          styles.companyOptionName,
                          isSelected && styles.companyOptionNameActive,
                        ]}
                      >
                        {comp}
                      </Text>
                      <Text style={styles.companyOptionCount}>
                        {compCandidateCount} {compCandidateCount === 1 ? 'candidate' : 'candidates'}
                      </Text>
                    </View>
                    {isSelected && (
                      <Feather name="check" size={18} color="#1A1B1C" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFDF7' },
  container: { padding: 14, paddingBottom: 60, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  // Company Selector Dropdown (borderRadius: 5)
  companySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    height: 44,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  companySelectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  companySelectText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.medium,
  },

  // Responsive Horizontal Status Tabs (borderRadius: 5, NO text wrap)
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

  // Section Header & Subtle Candidate Count
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  },

  // Result Card
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F4C430',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  headerInfoCol: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  candidateName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  usnBranchText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },

  // Company Line
  companyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
    gap: 8,
  },
  companyName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171717',
    flex: 1,
  },
  roleTitle: {
    fontWeight: '500',
    color: '#4B5563',
  },
  packageText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#16A34A',
    flexShrink: 0,
  },

  // Status Line (NO pills!)
  statusRow: {
    marginTop: 2,
  },
  hiredStatusText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  shortlistedStatusText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#D97706',
  },
  appliedStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  rejectedStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  withdrawnStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#9CA3AF',
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F1EA',
    marginVertical: 4,
  },

  // Card Footer Row
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  academicMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  resumeLink: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  resumeLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    textDecorationLine: 'underline',
  },
  noResumeText: {
    fontSize: 11.5,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },

  // Empty Card
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
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 4,
  },

  // Modal Styles (borderRadius: 5)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    width: '100%',
    maxWidth: 400,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  modalCloseBtn: {
    padding: 4,
  },
  companyListScroll: {
    padding: 8,
  },
  companyOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginBottom: 4,
  },
  companyOptionRowActive: {
    backgroundColor: '#FFF4C7',
  },
  companyOptionInfo: {
    flex: 1,
  },
  companyOptionName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#171717',
  },
  companyOptionNameActive: {
    color: '#1A1B1C',
    fontWeight: '800',
  },
  companyOptionCount: {
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
});
