import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { listPlacementMembers, searchEligibleMembers, assignPlacementMember } from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

export function PlacementTeamView() {
  const [members, setMembers] = useState<any[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userToAssign, setUserToAssign] = useState<any | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      const [m, e] = await Promise.all([
        listPlacementMembers().catch(() => []),
        searchEligibleMembers().catch(() => []),
      ]);
      setMembers(m || []);
      setEligibleUsers(e || []);
    } catch (err) {
      console.warn(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const handleConfirmAssign = async () => {
    if (!userToAssign) return;
    try {
      setAssigning(true);
      await assignPlacementMember({ userId: userToAssign.id, accessLevel: 'member' });
      const assignedName = userToAssign.fullName;
      setUserToAssign(null);
      await loadData();
      setShowSearch(false);
      setSearchQuery('');
      setFeedback({ type: 'success', message: `${assignedName} is now assigned to the Placement Cell.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to assign member.' });
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setAssigning(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F4C430" />
      </View>
    );
  }

  // Filter out users already in team
  const availableUsers = eligibleUsers
    .filter((u) => !members.find((m) => m.id === u.id))
    .filter(
      (u) =>
        !searchQuery ||
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );


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
        {/* In-theme feedback toast banner */}
        {feedback && (
          <View style={[styles.feedbackBanner, feedback.type === 'error' && styles.feedbackBannerError]}>
            <MaterialCommunityIcons
              name={feedback.type === 'success' ? 'check-circle' : 'alert-circle'}
              size={16}
              color={feedback.type === 'success' ? '#16A34A' : '#DC2626'}
            />
            <Text style={[styles.feedbackText, feedback.type === 'error' && styles.feedbackTextError]}>
              {feedback.message}
            </Text>
            <TouchableOpacity onPress={() => setFeedback(null)} hitSlop={8}>
              <Feather name="x" size={14} color="#6B6B6B" />
            </TouchableOpacity>
          </View>
        )}

        {/* Action Toggle to Add Member */}
        <TouchableOpacity
          style={styles.addToggleBtn}
          onPress={() => setShowSearch(!showSearch)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={showSearch ? 'close-circle' : 'account-plus'}
            size={18}
            color="#1A1B1C"
          />
          <Text style={styles.addToggleText}>
            {showSearch ? 'Close Staff Directory' : 'Appoint New Placement Member'}
          </Text>
        </TouchableOpacity>

        {/* Expandable Staff Directory Section */}
        {showSearch && (
          <View style={styles.appointSection}>
            <Text style={styles.sectionHeader}>Select Eligible Staff to Appoint</Text>
            <View style={styles.searchBox}>
              <Feather name="search" size={16} color="#6B6B6B" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search staff by name or email..."
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

            {availableUsers.length === 0 ? (
              <View style={styles.emptySearchBox}>
                <Text style={styles.emptyText}>No available staff match your query.</Text>
              </View>
            ) : (
              availableUsers.map((user) => (
                <View key={user.id} style={styles.staffCard}>
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>
                      {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'ST'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffName}>{user.fullName}</Text>
                    <Text style={styles.staffRole}>{user.role?.toUpperCase()} • {user.email}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.assignLink}
                    onPress={() => setUserToAssign(user)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.assignLinkText}>Assign</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Current Placement Team Members & Count */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Current Placement Team & Coordinators</Text>
          <Text style={styles.memberCountText}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </Text>
        </View>
        {members.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-group-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Placement Coordinators Assigned</Text>
            <Text style={styles.emptySub}>
              Use the button above to assign staff members to the placement cell.
            </Text>
          </View>
        ) : (
          members.map((member) => {
            const isHead = member.accessLevel === 'head';
            return (
              <View key={member.id} style={styles.memberCard}>
                <View style={[styles.avatar, isHead && styles.headAvatar]}>
                  <Text style={[styles.avatarText, isHead && styles.headAvatarText]}>
                    {member.fullName ? member.fullName.substring(0, 2).toUpperCase() : 'PO'}
                  </Text>
                </View>

                <View style={styles.memberInfo}>
                  <Text style={styles.memberName} numberOfLines={1}>{member.fullName}</Text>
                  <Text style={styles.memberEmail} numberOfLines={1}>{member.email}</Text>
                </View>

                <Text style={[styles.roleCleanText, isHead && styles.headRoleCleanText]}>
                  {isHead ? 'Placement Head' : 'Placement Coordinator'}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Assign Member Confirmation Modal */}
      <Modal
        visible={!!userToAssign}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!assigning) setUserToAssign(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <MaterialCommunityIcons name="account-plus-outline" size={28} color="#1A1B1C" />
            </View>

            <Text style={styles.confirmTitle}>Assign Placement Member?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to add{' '}
              <Text style={{ fontWeight: '800', color: '#171717' }}>
                {userToAssign?.fullName}
              </Text>{' '}
              ({userToAssign?.role?.toUpperCase()} • {userToAssign?.email}) to the Placement Cell team?
            </Text>

            <View style={styles.confirmFooter}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setUserToAssign(null)}
                disabled={assigning}
                activeOpacity={0.75}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmActionBtn}
                onPress={handleConfirmAssign}
                disabled={assigning}
                activeOpacity={0.85}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="#1A1B1C" />
                ) : (
                  <Text style={styles.confirmActionBtnText}>Confirm Assign</Text>
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
  container: { padding: 14, paddingBottom: 60, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Feedback Toast Banner
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 4,
  },
  feedbackBannerError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  feedbackText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    fontFamily: FontFamily.medium,
  },
  feedbackTextError: {
    color: '#991B1B',
  },

  // Section Header & Member Count
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  memberCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  },

  // Add Toggle Button
  addToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  addToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
    fontFamily: FontFamily.bold,
  },

  // Appoint Section
  appointSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 10,
  },
  sectionHeader: { fontSize: 13, fontWeight: '800', color: '#171717' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F1EA',
    borderRadius: BorderRadius.input,
    paddingHorizontal: 10,
    height: 38,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 12, color: '#171717', fontFamily: FontFamily.regular },
  emptySearchBox: { padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 12, color: '#6B6B6B', fontStyle: 'italic' },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFEFE',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 10,
  },
  staffAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffAvatarText: { fontSize: 12, fontWeight: '800', color: '#1A1B1C' },
  staffName: { fontSize: 13, fontWeight: '700', color: '#171717' },
  staffRole: { fontSize: 10, color: '#6B6B6B', marginTop: 1 },
  assignLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  assignLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    textDecorationLine: 'underline',
  },

  // Current Members List
  sectionTitle: {
    fontSize: 11,
    color: '#8A8A8A',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '800', color: '#1A1B1C' },
  headAvatar: {
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  headAvatarText: { color: '#1A1B1C' },
  memberInfo: { flex: 1, minWidth: 0, marginRight: 8 },
  memberName: { fontSize: 14, fontWeight: '800', color: '#171717' },
  memberEmail: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },
  roleCleanText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B6B6B',
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  headRoleCleanText: {
    color: '#D97706',
    fontWeight: '800',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#171717', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4 },

  // Modal Styles
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
    backgroundColor: '#FFF4C7',
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
    borderRadius: 5,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  confirmCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B6B6B',
  },
  confirmActionBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 5,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  confirmActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1B1C',
  },
});
