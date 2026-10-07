import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { HODFacultyMember, FacultyRank } from '../types/hod.types';

interface HODFacultyWorkloadViewProps {
  faculty: HODFacultyMember[];
  refreshing: boolean;
  onRefresh: () => void;
}

export const HODFacultyWorkloadView: React.FC<HODFacultyWorkloadViewProps> = ({
  faculty,
  refreshing,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRank, setSelectedRank] = useState<FacultyRank | 'all'>('all');

  const filteredFaculty = faculty.filter((f) => {
    const q = search.toLowerCase();
    const matchesSearch =
      f.name.toLowerCase().includes(q) ||
      f.specialization.toLowerCase().includes(q) ||
      f.employeeId.toLowerCase().includes(q) ||
      f.assignedCourses.some((c) => c.toLowerCase().includes(q));

    const matchesRank = selectedRank === 'all' || f.rank === selectedRank;

    return matchesSearch && matchesRank;
  });

  const handleCall = async (phone: string) => {
    const url = `tel:${phone.replace(/\s+/g, '')}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Calling Unavailable', `Direct dial is not supported on this device for ${phone}`);
      }
    } catch {
      Alert.alert('Calling Failed', `Could not initiate call to ${phone}`);
    }
  };

  const handleEmail = async (email: string) => {
    const url = `mailto:${email}`;
    try {
      const can = await Linking.canOpenURL(url);
      if (can) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Email Unavailable', `Email client not configured for ${email}`);
      }
    } catch {
      Alert.alert('Email Failed', `Could not open mail client for ${email}`);
    }
  };

  const formatRank = (rank: FacultyRank) => {
    switch (rank) {
      case 'professor':
        return 'Professor';
      case 'associate_professor':
        return 'Assoc. Professor';
      case 'assistant_professor':
        return 'Asst. Professor';
      case 'adjunct_lecturer':
        return 'Adjunct Lecturer';
      case 'lab_instructor':
        return 'Lab Instructor';
    }
  };

  const getStatusBadge = (status: HODFacultyMember['status']) => {
    switch (status) {
      case 'present':
        return { label: 'On Campus', bg: '#ECFDF5', text: '#059669', dot: '#10B981' };
      case 'in_lecture':
        return { label: 'In Lecture', bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6' };
      case 'in_lab':
        return { label: 'In Lab', bg: '#FDF4FF', text: '#9333EA', dot: '#A855F7' };
      case 'on_leave':
        return { label: 'On Leave', bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' };
      case 'absent':
        return { label: 'Absent', bg: '#FEE2E2', text: '#991B1B', dot: '#DC2626' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9E9E9E" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by faculty name, specialization, or course..."
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
      </View>

      {/* Rank Filters */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(
            [
              'all',
              'professor',
              'associate_professor',
              'assistant_professor',
              'lab_instructor',
            ] as const
          ).map((r) => {
            const isSelected = selectedRank === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.filterChip, isSelected && styles.filterChipSelected]}
                onPress={() => setSelectedRank(r)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextSelected]}>
                  {r === 'all' ? 'All Faculty' : formatRank(r)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Faculty Workload Roster */}
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA580C']} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            Showing <Text style={{ fontWeight: '800', color: '#171717' }}>{filteredFaculty.length}</Text> Department Faculty & Instructors
          </Text>
        </View>

        {filteredFaculty.map((f) => {
          const status = getStatusBadge(f.status);
          const isOverloaded = f.assignedCredits >= f.maxCreditsPerWeek;
          const loadPercentage = Math.round((f.assignedCredits / (f.maxCreditsPerWeek || 1)) * 100);

          return (
            <View key={f.id} style={styles.card}>
              {/* Header */}
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{f.name.charAt(0)}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.facultyName}>{f.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
                      <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>

                  <View style={styles.rankRow}>
                    <Text style={styles.rankText}>{formatRank(f.rank)}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.empIdText}>{f.employeeId}</Text>
                  </View>
                  <Text style={styles.specializationText}>{f.specialization}</Text>
                </View>
              </View>

              {/* Workload Progress Bar */}
              <View style={styles.workloadBox}>
                <View style={styles.workloadTop}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={16} color="#4B5563" />
                    <Text style={styles.workloadTitle}>Weekly Teaching Load</Text>
                  </View>
                  <Text
                    style={[
                      styles.workloadHours,
                      isOverloaded && { color: '#DC2626', fontWeight: '800' },
                    ]}
                  >
                    {f.assignedCredits} / {f.maxCreditsPerWeek} Credits
                  </Text>
                </View>

                <View style={styles.workloadTrack}>
                  <View
                    style={[
                      styles.workloadFill,
                      {
                        width: `${Math.min(100, loadPercentage)}%`,
                        backgroundColor: isOverloaded ? '#EF4444' : loadPercentage >= 80 ? '#F59E0B' : '#10B981',
                      },
                    ]}
                  />
                </View>

                {/* Assigned Courses Chips */}
                <View style={styles.courseTagRow}>
                  <Text style={styles.assignedLabel}>Courses:</Text>
                  {f.assignedCourses.map((c) => (
                    <View key={c} style={styles.courseChip}>
                      <Text style={styles.courseChipText}>{c}</Text>
                    </View>
                  ))}
                  {f.assignedCourses.length === 0 && (
                    <Text style={styles.noCoursesText}>No courses assigned yet</Text>
                  )}
                </View>
              </View>

              {/* Office & Contact Row */}
              <View style={styles.cardFooter}>
                <View style={styles.cabinWrap}>
                  <MaterialCommunityIcons name="door" size={16} color="#6B6B6B" />
                  <Text style={styles.cabinText}>{f.cabinNumber || 'Main Dept Block'}</Text>
                </View>

                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleCall(f.phone)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="phone-outline" size={16} color="#EA580C" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => handleEmail(f.email)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="email-outline" size={16} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {filteredFaculty.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-search" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No faculty members found</Text>
            <Text style={styles.emptyStateSub}>Try adjusting your search query or rank filter.</Text>
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
  searchHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.input,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  filterBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
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
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#EA580C',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
    fontFamily: FontFamily.poppins,
  },
  filterChipTextSelected: {
    color: '#EA580C',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  summaryBar: {
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: FontFamily.poppins,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    flexWrap: 'wrap',
  },
  facultyName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FontFamily.poppins,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C2410C',
    fontFamily: FontFamily.poppins,
  },
  dotSeparator: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  empIdText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  specializationText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
    fontFamily: FontFamily.poppins,
  },
  workloadBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: BorderRadius.chip,
    padding: 10,
    gap: 6,
  },
  workloadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workloadTitle: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
    fontFamily: FontFamily.poppins,
  },
  workloadHours: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171717',
    fontFamily: FontFamily.poppins,
  },
  workloadTrack: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  workloadFill: {
    height: '100%',
    borderRadius: 3,
  },
  courseTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  assignedLabel: {
    fontSize: 11,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  courseChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  courseChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#374151',
    fontFamily: FontFamily.poppins,
  },
  noCoursesText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: FontFamily.poppins,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  cabinWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cabinText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontFamily: FontFamily.poppins,
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
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
