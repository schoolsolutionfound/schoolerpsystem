import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  RefreshControl,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import {
  PrincipalStaffMember,
  StaffDesignation,
  DESIGNATION_LABELS,
  DESIGNATION_BADGE_COLORS,
} from '../types/principal.types';

interface PrincipalStaffDirectoryViewProps {
  staffList: PrincipalStaffMember[];
  refreshing: boolean;
  onRefresh: () => void;
}

export const PrincipalStaffDirectoryView: React.FC<PrincipalStaffDirectoryViewProps> = ({
  staffList,
  refreshing,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [designationFilter, setDesignationFilter] = useState<'all' | StaffDesignation | 'pastoral'>('all');

  const filteredStaff = staffList.filter((m) => {
    const q = search.toLowerCase();
    const matchesSearch =
      m.fullName.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.department && m.department.toLowerCase().includes(q)) ||
      (m.assignedClass && m.assignedClass.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (designationFilter === 'all') return true;
    if (designationFilter === 'pastoral') {
      return m.designation === 'counselor' || m.designation === 'special_educator';
    }
    return m.designation === designationFilter;
  });

  const presentCount = staffList.filter((s) => s.attendanceToday === 'present').length;
  const absentCount = staffList.filter((s) => s.attendanceToday !== 'present').length;

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone.replace(/\s+/g, '')}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Filter Bar */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search faculty by name, department, or grade..."
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

        {/* Filter Scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(
            [
              { key: 'all', label: `All Staff (${staffList.length})` },
              { key: 'homeroom_teacher', label: 'Homeroom Teachers' },
              { key: 'subject_teacher', label: 'Subject Teachers' },
              { key: 'pastoral', label: 'Counseling & Inclusion' },
              { key: 'academic_coordinator', label: 'Coordinators' },
              { key: 'sports_director', label: 'Sports & PE' },
            ] as const
          ).map((item) => {
            const active = designationFilter === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setDesignationFilter(item.key)}
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

      {/* Faculty Attendance Quick Glance */}
      <View style={styles.glanceStrip}>
        <View style={styles.glanceItem}>
          <View style={[styles.glanceDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.glanceText}>
            <Text style={styles.glanceBold}>{presentCount}</Text> Present on Campus
          </Text>
        </View>
        <View style={styles.glanceDivider} />
        <View style={styles.glanceItem}>
          <View style={[styles.glanceDot, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.glanceText}>
            <Text style={styles.glanceBold}>{absentCount}</Text> Absent / On Leave
          </Text>
        </View>
      </View>

      {/* Staff Roster List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />}
        showsVerticalScrollIndicator={false}
      >
        {filteredStaff.map((staff) => {
          const badgeColor =
            DESIGNATION_BADGE_COLORS[staff.designation] || {
              bg: '#F3F4F6',
              text: '#374151',
              border: '#E5E7EB',
            };
          const isPresent = staff.attendanceToday === 'present';
          const isLeave = staff.attendanceToday === 'on_leave';

          return (
            <View key={staff.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatarWrap}>
                  <Text style={styles.avatarText}>{staff.fullName.slice(0, 2).toUpperCase()}</Text>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: isPresent
                          ? '#10B981'
                          : isLeave
                          ? '#F59E0B'
                          : '#EF4444',
                      },
                    ]}
                  />
                </View>

                <View style={styles.staffMainInfo}>
                  <Text style={styles.staffName}>{staff.fullName}</Text>
                  <View
                    style={[
                      styles.designationBadge,
                      {
                        backgroundColor: badgeColor.bg,
                        borderColor: badgeColor.border,
                      },
                    ]}
                  >
                    <Text style={[styles.designationText, { color: badgeColor.text }]}>
                      {DESIGNATION_LABELS[staff.designation] || staff.designation}
                    </Text>
                  </View>
                </View>

                {/* Quick Phone & Email Actions */}
                <View style={styles.quickContactRow}>
                  {staff.phone && (
                    <TouchableOpacity
                      style={styles.iconBtn}
                      onPress={() => handleCall(staff.phone)}
                      activeOpacity={0.7}
                    >
                      <Feather name="phone" size={15} color="#16A34A" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleEmail(staff.email)}
                    activeOpacity={0.7}
                  >
                    <Feather name="mail" size={15} color="#0284C7" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Assignment & Department Meta */}
              <View style={styles.metaRow}>
                {staff.assignedClass ? (
                  <View style={styles.homeroomPill}>
                    <MaterialCommunityIcons name="google-classroom" size={13} color="#166534" />
                    <Text style={styles.homeroomPillText}>Class Teacher: {staff.assignedClass}</Text>
                  </View>
                ) : (
                  <View style={styles.deptPill}>
                    <MaterialCommunityIcons name="domain" size={13} color="#4B5563" />
                    <Text style={styles.deptPillText}>{staff.department || 'Faculty'}</Text>
                  </View>
                )}

                <Text style={styles.expText}>
                  {staff.experienceYears || 5} yrs exp • {staff.qualification || 'B.Ed'}
                </Text>
              </View>
            </View>
          );
        })}

        {filteredStaff.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="account-search" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No faculty members found</Text>
            <Text style={styles.emptySub}>Try searching a different name or designation filter</Text>
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
  searchBarWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 10,
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
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
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
  glanceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  glanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  glanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  glanceText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: FontFamily.regular,
  },
  glanceBold: {
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  glanceDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#374151',
    fontFamily: FontFamily.extrabold,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  staffMainInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  designationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 3,
  },
  designationText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FontFamily.bold,
  },
  quickContactRow: {
    flexDirection: 'row',
    gap: 6,
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
    paddingTop: 8,
  },
  homeroomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  homeroomPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    fontFamily: FontFamily.bold,
  },
  deptPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  deptPillText: {
    fontSize: 11,
    color: '#4B5563',
    fontFamily: FontFamily.medium,
  },
  expText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
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
