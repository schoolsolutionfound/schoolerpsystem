import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';
import {
  ReviewCycle,
  StaffEvaluationItem,
  ReviewCycleStatus,
  SubmitEvaluationPayload,
  CreateReviewCyclePayload,
} from '../types/reviewCycle.types';
import {
  fetchReviewCyclesApi,
  fetchStaffEvaluationsApi,
  createReviewCycleApi,
  submitStaffEvaluationApi,
} from '../api/reviewCycleApi';
import { StaffEvaluationModal } from './StaffEvaluationModal';
import { CreateReviewCycleModal } from './CreateReviewCycleModal';

interface ReviewCycleListViewProps {
  role?: 'principal' | 'hod' | 'admin';
  department?: string;
  reviewerName?: string;
}

export const ReviewCycleListView: React.FC<ReviewCycleListViewProps> = ({
  role = 'principal',
  department,
  reviewerName = 'Evaluator',
}) => {
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewCycleStatus>('all');
  const [search, setSearch] = useState('');

  // Selected cycle for viewing evaluations
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [evaluations, setEvaluations] = useState<StaffEvaluationItem[]>([]);
  const [evalLoading, setEvalLoading] = useState(false);

  // Modals
  const [evalModalVisible, setEvalModalVisible] = useState(false);
  const [selectedEvalItem, setSelectedEvalItem] = useState<StaffEvaluationItem | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const loadCycles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReviewCyclesApi({ role, department });
      setCycles(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role, department]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCycles();
    if (selectedCycle) {
      loadEvaluations(selectedCycle.id);
    }
  };

  const loadEvaluations = async (cycleId: string) => {
    setEvalLoading(true);
    try {
      const list = await fetchStaffEvaluationsApi(cycleId);
      setEvaluations(list);
    } finally {
      setEvalLoading(false);
    }
  };

  const handleSelectCycle = (cycle: ReviewCycle) => {
    setSelectedCycle(cycle);
    loadEvaluations(cycle.id);
  };

  const handleOpenEvaluation = (item: StaffEvaluationItem) => {
    setSelectedEvalItem(item);
    setEvalModalVisible(true);
  };

  const handleSaveEvaluation = async (payload: SubmitEvaluationPayload) => {
    await submitStaffEvaluationApi(payload, reviewerName, role);
    if (selectedCycle) {
      loadEvaluations(selectedCycle.id);
    }
    loadCycles();
  };

  const handleCreateCycle = async (payload: CreateReviewCyclePayload) => {
    await createReviewCycleApi(payload);
    loadCycles();
  };

  const filteredCycles = cycles.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch =
      c.title.toLowerCase().includes(q) ||
      c.period.toLowerCase().includes(q) ||
      (c.department && c.department.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return c.status === statusFilter;
  });

  // Calculate Overall KPIs
  const totalStaffInReview = cycles.reduce((acc, c) => acc + c.revieweesCount, 0);
  const totalCompleted = cycles.reduce((acc, c) => acc + c.completedCount, 0);
  const overallRate = totalStaffInReview > 0 ? Math.round((totalCompleted / totalStaffInReview) * 100) : 0;
  const activeCount = cycles.filter((c) => c.status === 'active' || c.status === 'in_review').length;

  return (
    <View style={styles.container}>
      {/* Top Header & Search */}
      <View style={styles.headerBlock}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.headerTitle}>Staff Review Cycles</Text>
            <Text style={styles.headerSub}>
              {role === 'hod' ? `${department || 'Department'} Appraisals` : 'Institution-Wide Faculty Evaluation'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.launchBtn}
            onPress={() => setCreateModalVisible(true)}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color="#111827" />
            <Text style={styles.launchBtnText}>New Cycle</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search appraisal cycles, academic terms..."
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

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(
            [
              { key: 'all', label: `All Cycles (${cycles.length})` },
              { key: 'active', label: '🟢 Active Evaluation' },
              { key: 'in_review', label: '🟡 In Review' },
              { key: 'completed', label: '⚪ Completed' },
            ] as const
          ).map((item) => {
            const active = statusFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setStatusFilter(item.key)}
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

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F4C430']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Attendance Standard Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroSubText}>STAFF REVIEW CYCLE PERFORMANCE</Text>
              <Text style={styles.heroMainValue}>{overallRate}%</Text>
              <Text style={styles.heroSubTitle}>Overall Appraisals Completed</Text>
            </View>
            <View style={styles.heroBadge}>
              <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#F4C430" />
              <Text style={styles.heroBadgeText}>{activeCount} Active</Text>
            </View>
          </View>

          <View style={styles.heroProgressTrack}>
            <View style={[styles.heroProgressFill, { width: `${Math.min(overallRate, 100)}%` }]} />
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: '#16A34A' }]}>{totalCompleted}</Text>
              <Text style={styles.heroStatLabel}>Evaluated</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: '#F59E0B' }]}>
                {Math.max(0, totalStaffInReview - totalCompleted)}
              </Text>
              <Text style={styles.heroStatLabel}>Pending Review</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatValue, { color: '#FFFFFF' }]}>{totalStaffInReview}</Text>
              <Text style={styles.heroStatLabel}>Total Staff</Text>
            </View>
          </View>
        </View>

        {/* Selected Cycle Detailed Evaluations View */}
        {selectedCycle && (
          <View style={styles.detailSection}>
            <View style={styles.detailHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.detailTitle}>{selectedCycle.title}</Text>
                <Text style={styles.detailSub}>Staff Evaluations & Endorsements ({evaluations.length})</Text>
              </View>
              <TouchableOpacity
                style={styles.closeDetailBtn}
                onPress={() => setSelectedCycle(null)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeDetailText}>Close Detail</Text>
              </TouchableOpacity>
            </View>

            {evalLoading ? (
              <ActivityIndicator size="small" color="#F4C430" style={{ marginVertical: 16 }} />
            ) : evaluations.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No individual reviews logged yet</Text>
                <Text style={styles.emptySub}>Staff members assigned to this cycle will appear here for evaluation.</Text>
              </View>
            ) : (
              evaluations.map((item) => (
                <View key={item.id} style={styles.evalCard}>
                  <View style={styles.evalCardHeader}>
                    <View style={styles.evalAvatar}>
                      <Text style={styles.evalAvatarText}>
                        {item.staffName.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.evalStaffName}>{item.staffName}</Text>
                      <Text style={styles.evalStaffDesignation}>{item.designation} • {item.department}</Text>
                    </View>
                    <View
                      style={[
                        styles.evalStatusPill,
                        item.status === 'approved'
                          ? { backgroundColor: '#16A34A18' }
                          : item.status === 'reviewed'
                          ? { backgroundColor: '#F59E0B18' }
                          : { backgroundColor: '#3B82F618' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.evalStatusText,
                          item.status === 'approved'
                            ? { color: '#16A34A' }
                            : item.status === 'reviewed'
                            ? { color: '#D97706' }
                            : { color: '#2563EB' },
                        ]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {item.rating && (
                    <View style={styles.evalRatingRow}>
                      <MaterialCommunityIcons name="star" size={16} color="#F4C430" />
                      <Text style={styles.evalRatingValue}>{item.rating}.0 / 5.0 Rating</Text>
                      {item.reviewerName ? (
                        <Text style={styles.evalReviewer}>By {item.reviewerName}</Text>
                      ) : null}
                    </View>
                  )}

                  {item.reviewerRemarks ? (
                    <View style={styles.remarksBox}>
                      <Text style={styles.remarksLabel}>OFFICIAL APPRAISAL REMARKS:</Text>
                      <Text style={styles.remarksText}>{item.reviewerRemarks}</Text>
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={styles.conductBtn}
                    onPress={() => handleOpenEvaluation(item)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="pencil-ruler" size={14} color="#111827" />
                    <Text style={styles.conductBtnText}>
                      {item.status === 'approved' ? 'Update Evaluation' : 'Evaluate Performance'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Cycles Cards Section */}
        <Text style={styles.sectionTitle}>
          {selectedCycle ? 'ALL REVIEW CYCLES' : 'ACTIVE & SCHEDULED REVIEW CYCLES'}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#F4C430" style={{ marginTop: 24 }} />
        ) : (
          filteredCycles.map((cycle) => {
            const isSelected = selectedCycle?.id === cycle.id;
            const pct = cycle.revieweesCount > 0 ? Math.round((cycle.completedCount / cycle.revieweesCount) * 100) : 0;

            return (
              <TouchableOpacity
                key={cycle.id}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleSelectCycle(cycle)}
                activeOpacity={0.7}
              >
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cycleTitle}>{cycle.title}</Text>
                    <Text style={styles.cyclePeriod}>{cycle.period}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      cycle.status === 'active'
                        ? { backgroundColor: '#16A34A18' }
                        : cycle.status === 'in_review'
                        ? { backgroundColor: '#F59E0B18' }
                        : { backgroundColor: '#F3F4F6' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        cycle.status === 'active'
                          ? { color: '#16A34A' }
                          : cycle.status === 'in_review'
                          ? { color: '#D97706' }
                          : { color: '#6B6B6B' },
                      ]}
                    >
                      {cycle.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {cycle.description ? (
                  <Text style={styles.cycleDesc}>{cycle.description}</Text>
                ) : null}

                {/* Progress bar */}
                <View style={styles.cycleProgressWrap}>
                  <View style={styles.cycleProgressTrack}>
                    <View style={[styles.cycleProgressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.cycleProgressPct}>{pct}%</Text>
                </View>

                {/* Card Footer Info */}
                <View style={styles.cardFooter}>
                  <View style={styles.footerItem}>
                    <MaterialCommunityIcons name="account-group" size={14} color="#6B6B6B" />
                    <Text style={styles.footerText}>
                      {cycle.completedCount}/{cycle.revieweesCount} Evaluated
                    </Text>
                  </View>

                  <View style={styles.footerItem}>
                    <MaterialCommunityIcons name="calendar-clock" size={14} color="#6B6B6B" />
                    <Text style={styles.footerText}>Due {cycle.deadline}</Text>
                  </View>

                  {cycle.averageRating ? (
                    <View style={styles.ratingBadge}>
                      <MaterialCommunityIcons name="star" size={12} color="#F4C430" />
                      <Text style={styles.ratingText}>{cycle.averageRating} Avg</Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {filteredCycles.length === 0 && !loading && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="clipboard-text-search-outline" size={44} color="#E8E5DC" />
            <Text style={styles.emptyTitle}>No review cycles found</Text>
            <Text style={styles.emptySub}>Launch a new staff appraisal cycle to start evaluations.</Text>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <StaffEvaluationModal
        visible={evalModalVisible}
        evaluation={selectedEvalItem}
        onClose={() => setEvalModalVisible(false)}
        onSubmit={handleSaveEvaluation}
      />

      <CreateReviewCycleModal
        visible={createModalVisible}
        defaultDepartment={department}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateCycle}
      />
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
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  headerSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    marginTop: 1,
  },
  launchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.button,
  },
  launchBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
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
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontFamily: FontFamily.semibold,
    color: '#6B6B6B',
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

  // Attendance Standard Hero Card
  heroCard: {
    backgroundColor: '#1A1B1C',
    borderRadius: BorderRadius.card,
    padding: 18,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    marginBottom: 6,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroSubText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#8A8A8A',
    letterSpacing: 0.8,
  },
  heroMainValue: {
    fontSize: 32,
    fontFamily: FontFamily.extrabold,
    color: '#F4C430',
    marginTop: 2,
  },
  heroSubTitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#8A8A8A',
    marginTop: 1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 196, 48, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 196, 48, 0.3)',
  },
  heroBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#F4C430',
  },
  heroProgressTrack: {
    height: 6,
    backgroundColor: '#232425',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: '#F4C430',
    borderRadius: 3,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 18,
    fontFamily: FontFamily.extrabold,
  },
  heroStatLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#8A8A8A',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2A2B2C',
  },

  // Detail Section
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    paddingBottom: 10,
  },
  detailTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  detailSub: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    marginTop: 1,
  },
  closeDetailBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  closeDetailText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: '#171717',
  },

  // Evaluation Item
  evalCard: {
    backgroundColor: '#FFFDF7',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    gap: 8,
  },
  evalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  evalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF4C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  evalAvatarText: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: '#F4C430',
  },
  evalStaffName: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  evalStaffDesignation: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
  },
  evalStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  evalStatusText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  evalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  evalRatingValue: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  evalReviewer: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#8A8A8A',
    marginLeft: 'auto',
  },
  remarksBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 8,
    gap: 2,
  },
  remarksLabel: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: '#8A8A8A',
    letterSpacing: 0.5,
  },
  remarksText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#171717',
    lineHeight: 16,
  },
  conductBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F4C430',
    paddingVertical: 7,
    borderRadius: BorderRadius.button,
    marginTop: 2,
  },
  conductBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  // Cycle Card
  sectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#8A8A8A',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
  cardSelected: {
    borderColor: '#F4C430',
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cycleTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  cyclePeriod: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
  },
  cycleDesc: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    lineHeight: 17,
  },
  cycleProgressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cycleProgressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F1EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  cycleProgressFill: {
    height: '100%',
    backgroundColor: '#F4C430',
    borderRadius: 3,
  },
  cycleProgressPct: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#171717',
    width: 32,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    paddingTop: 8,
    marginTop: 2,
    flexWrap: 'wrap',
    gap: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF4C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: '#F4C430',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 6,
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#6B6B6B',
    textAlign: 'center',
  },
});
