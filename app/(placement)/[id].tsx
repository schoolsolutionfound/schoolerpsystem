import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  Alert,
  RefreshControl,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import {
  listDrives,
  getDriveApplicationsForStaff,
  updateApplicationStatusForStaff,
  updateDrive,
  DriveApplication,
  PlacementDrive,
} from '../../api/placement';
import { useUserStore } from '../../store/useUserStore';
import { PlacementHomeHeader } from '../../features/placement/components/PlacementHomeHeader';
import { FontFamily } from '../../constants/fonts';
import { BorderRadius } from '../../constants/theme';
import { ShimmerProvider } from '../../features/student/components/ShimmerSkeleton';
import { PlacementStudentsSkeleton } from '../../features/placement/components/PlacementSkeleton';
import { safeGoBack } from '../../features/shared/utils/safeNavigation';

export default function PlacementAdminApplicantsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const fullName = useUserStore((state) => state.fullName) || 'Placement Officer';
  const profilePic = useUserStore((state) => state.profilePic);
  const institutionName = useUserStore((state) => state.institutionName) || '';
  const placementAccess = useUserStore((state) => state.placementAccess);

  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [applications, setApplications] = useState<DriveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Candidate Details Modal
  const [selectedCandidate, setSelectedCandidate] = useState<DriveApplication | null>(null);

  // Close Drive Modal
  const [showCloseDriveModal, setShowCloseDriveModal] = useState(false);
  const [driveClosing, setDriveClosing] = useState(false);

  const fetchData = async () => {
    try {
      if (!id) return;
      const [appsData, drivesData] = await Promise.all([
        getDriveApplicationsForStaff(id as string),
        listDrives(),
      ]);
      setApplications(appsData || []);
      const found = drivesData?.find((d) => d.id === id);
      setDrive(found || null);
    } catch (err) {
      console.warn('Failed to load applicants:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const handleUpdateStatus = async (appId: string, newStatus: string, currentRoundIndex?: number) => {
    try {
      await updateApplicationStatusForStaff(id as string, appId, newStatus, currentRoundIndex);
      // Optimistically update
      setApplications((prev) =>
        prev.map((a) => {
          if (a.id === appId) {
            const updated = {
              ...a,
              status: newStatus as any,
              currentRoundIndex: currentRoundIndex ?? a.currentRoundIndex,
            };
            setSelectedCandidate((curr) => (curr?.id === appId ? updated : curr));
            return updated;
          }
          return a;
        })
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update status.');
    }
  };

  const handleConfirmCloseDrive = async () => {
    if (!drive) return;
    try {
      setDriveClosing(true);
      await updateDrive(drive.id, { status: 'closed' });
      setDrive((prev) => (prev ? { ...prev, status: 'closed' } : null));
      setShowCloseDriveModal(false);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to close placement drive.');
    } finally {
      setDriveClosing(false);
    }
  };

  const [confirmState, setConfirmState] = useState<{
    appId: string;
    studentName: string;
    action: string;
    actionLabel: string;
    roundIndex?: number;
  } | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const handleInitiateStatusUpdate = (
    app: DriveApplication,
    opt: { label: string; action: string; roundIndex?: number }
  ) => {
    setConfirmState({
      appId: app.id,
      studentName: app.student?.fullName || 'Candidate',
      action: opt.action,
      actionLabel: opt.label,
      roundIndex: opt.roundIndex,
    });
  };

  const handleConfirmStatusUpdate = async () => {
    if (!confirmState) return;
    const { appId, action, roundIndex } = confirmState;
    try {
      setStatusUpdating(true);
      await handleUpdateStatus(appId, action, roundIndex);
      setConfirmState(null);
    } finally {
      setStatusUpdating(false);
    }
  };

  const getConfirmDetails = () => {
    if (!confirmState) return null;
    const { action, studentName, roundIndex } = confirmState;

    if (action === 'hired') {
      return {
        title: 'Confirm Hire',
        message: `Are you sure you want to mark ${studentName} as HIRED for ${drive?.title || 'this role'}?`,
        iconName: 'check-decagram',
        iconColor: '#16A34A',
        iconBg: '#DCFCE7',
        confirmBtnBg: '#16A34A',
        confirmBtnTextColor: '#FFFFFF',
        confirmBtnText: 'Yes, Hire Candidate',
      };
    }

    if (action === 'rejected') {
      return {
        title: 'Confirm Rejection',
        message: `Are you sure you want to REJECT ${studentName}'s application for ${drive?.title || 'this drive'}?`,
        iconName: 'close-circle-outline',
        iconColor: '#DC2626',
        iconBg: '#FEE2E2',
        confirmBtnBg: '#DC2626',
        confirmBtnTextColor: '#FFFFFF',
        confirmBtnText: 'Yes, Reject',
      };
    }

    if (action === 'shortlisted') {
      const roundName =
        roundIndex && drive?.rounds?.[roundIndex - 1]?.name
          ? ` (${drive.rounds[roundIndex - 1].name})`
          : '';
      return {
        title: 'Confirm Shortlist',
        message: `Advance ${studentName} to Round ${roundIndex || 1}${roundName}?`,
        iconName: 'account-arrow-right',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        confirmBtnBg: '#F4C430',
        confirmBtnTextColor: '#1A1B1C',
        confirmBtnText: 'Yes, Shortlist',
      };
    }

    return {
      title: 'Reset Application',
      message: `Reset ${studentName}'s status back to Applied?`,
      iconName: 'backup-restore',
      iconColor: '#6B7280',
      iconBg: '#F3F4F6',
      confirmBtnBg: '#1A1B1C',
      confirmBtnTextColor: '#FFFFFF',
      confirmBtnText: 'Reset Status',
    };
  };

  const confirmDetails = getConfirmDetails();

  const totalRounds = drive?.rounds?.length || 0;

  const getStatusOptions = (app: DriveApplication) => {
    if (app.status === 'withdrawn') return [];

    const options: { label: string; action: string; roundIndex?: number; color: string }[] = [];

    // Shortlisting logic
    if (
      app.status === 'applied' ||
      (app.status === 'shortlisted' && (app.currentRoundIndex || 0) < totalRounds)
    ) {
      const nextRound = app.status === 'applied' ? 1 : (app.currentRoundIndex || 0) + 1;
      const roundName = drive?.rounds?.[nextRound - 1]?.name;
      options.push({
        label: roundName ? `Shortlist R${nextRound} (${roundName})` : `Shortlist R${nextRound}`,
        action: 'shortlisted',
        roundIndex: nextRound,
        color: '#F4C430',
      });
    }

    if (app.status !== 'hired') {
      options.push({ label: 'Hire Candidate', action: 'hired', color: '#16A34A' });
    }
    if (app.status !== 'rejected') {
      options.push({ label: 'Reject', action: 'rejected', color: '#DC2626' });
    }
    if (app.status === 'hired' || app.status === 'rejected') {
      options.push({ label: 'Reset to Applied', action: 'applied', color: '#6B6B6B' });
    }

    return options;
  };

  const branches = useMemo(() => {
    const b = new Set<string>();
    applications.forEach((a) => {
      if (a.student?.branch) b.add(a.student.branch);
    });
    return Array.from(b);
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (branchFilter !== 'all' && a.student?.branch !== branchFilter) return false;
      return true;
    });
  }, [applications, statusFilter, branchFilter]);

  const stats = useMemo(() => {
    const s = { total: applications.length, applied: 0, shortlisted: 0, hired: 0, rejected: 0 };
    applications.forEach((a) => {
      if (a.status === 'applied') s.applied++;
      if (a.status === 'shortlisted') s.shortlisted++;
      if (a.status === 'hired') s.hired++;
      if (a.status === 'rejected') s.rejected++;
    });
    return s;
  }, [applications]);

  const handleBack = () => {
    safeGoBack(navigation, '/home');
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <PlacementHomeHeader
          fullName={fullName}
          profilePic={profilePic}
          institutionName={institutionName}
          accessLevel={placementAccess}
          onBackPress={handleBack}
          onNotificationsPress={() => router.push('/notifications')}
          onProfilePress={() => router.push({ pathname: '/(placement)/home', params: { tab: 'profile' } } as any)}
          showGreeting={true}
        />
        <ScrollView contentContainerStyle={styles.scroll}>
          <ShimmerProvider>
            <PlacementStudentsSkeleton />
          </ShimmerProvider>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Unified Kivquo Header */}
      <PlacementHomeHeader
        fullName={fullName}
        profilePic={profilePic}
        institutionName={institutionName}
        accessLevel={placementAccess}
        onBackPress={handleBack}
        onNotificationsPress={() => router.push('/notifications')}
        onProfilePress={() => router.push({ pathname: '/(placement)/home', params: { tab: 'profile' } } as any)}
        showGreeting={true}
      />

      {/* Drive Details Bar */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {drive?.title || 'Drive Applicants'}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {drive?.companyName || 'Placement Drive'}
          </Text>
        </View>
        <View style={styles.headerRightActions}>
          {drive?.status && (
            <Text
              style={[
                styles.statusCleanText,
                drive.status === 'published'
                  ? styles.textPublished
                  : drive.status === 'draft'
                  ? styles.textDraft
                  : styles.textClosed,
              ]}
            >
              {drive.status === 'published' ? 'Published' : drive.status === 'draft' ? 'Draft' : 'Closed'}
            </Text>
          )}

          {drive?.status === 'published' && (
            <TouchableOpacity
              style={styles.headerCloseLink}
              onPress={() => setShowCloseDriveModal(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.headerCloseLinkText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
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
        {/* Status Filter Tabs (White background unselected, yellow active, 5px border radius) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusTabsScroll}
        >
          {[
            { key: 'all', label: 'All', count: applications.length },
            { key: 'shortlisted', label: 'Shortlisted', count: stats.shortlisted },
            { key: 'hired', label: 'Hired', count: stats.hired },
            { key: 'applied', label: 'Applied', count: stats.applied },
            { key: 'rejected', label: 'Rejected', count: stats.rejected },
          ].map((tab) => {
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

        {/* Branch Filter Pills */}
        {branches.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.branchFilterScroll}
          >
            <TouchableOpacity
              style={[styles.branchPill, branchFilter === 'all' && styles.branchPillActive]}
              onPress={() => setBranchFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.branchText, branchFilter === 'all' && styles.branchTextActive]}>
                All Branches
              </Text>
            </TouchableOpacity>
            {branches.map((b) => (
              <TouchableOpacity
                key={b}
                style={[styles.branchPill, branchFilter === b && styles.branchPillActive]}
                onPress={() => setBranchFilter(b)}
                activeOpacity={0.7}
              >
                <Text style={[styles.branchText, branchFilter === b && styles.branchTextActive]}>
                  {b}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Applicant Count */}
        <View style={styles.applicantCountRow}>
          <Text style={styles.applicantCountText}>
            {filteredApps.length} candidate{filteredApps.length === 1 ? '' : 's'}
          </Text>
        </View>

        {/* Applicants List */}
        {filteredApps.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="account-search-outline" size={40} color="#6B6B6B" />
            <Text style={styles.emptyTitle}>No Applicants Found</Text>
            <Text style={styles.emptySub}>
              No candidates match your current filter settings for this drive.
            </Text>
          </View>
        ) : (
          filteredApps.map((app) => {
            const isHired = app.status === 'hired';
            const isShortlisted = app.status === 'shortlisted';
            const isRejected = app.status === 'rejected';

            const statusTextColor = isHired
              ? '#16A34A'
              : isShortlisted
              ? '#D97706'
              : isRejected
              ? '#DC2626'
              : '#6B6B6B';
            const statusLabel = isShortlisted
              ? `Round ${app.currentRoundIndex || 1}`
              : app.status.toUpperCase();

            const options = getStatusOptions(app);

            return (
              <TouchableOpacity
                key={app.id}
                style={styles.appCard}
                activeOpacity={0.85}
                onPress={() => setSelectedCandidate(app)}
              >
                {/* Top row */}
                <View style={styles.appCardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {app.student?.fullName
                        ? app.student.fullName.substring(0, 2).toUpperCase()
                        : 'ST'}
                    </Text>
                  </View>

                  <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <Text style={styles.studentName} numberOfLines={1}>
                      {app.student?.fullName || 'Student'}
                    </Text>
                    <Text style={styles.studentMeta} numberOfLines={1}>
                      {app.student?.branch || 'General'}{app.student?.year ? ` • ${app.student.year}` : ''}
                    </Text>
                  </View>

                  <Text style={[styles.statusCleanText, { color: statusTextColor }]}>
                    {statusLabel}
                  </Text>
                </View>

                {/* Academic & contact info */}
                <View style={styles.academicRow}>
                  <View style={styles.academicCol}>
                    <Text style={styles.academicLabel}>10th Score</Text>
                    <Text style={styles.academicVal}>{app.student?.tenthPercentage ? `${app.student.tenthPercentage}%` : 'N/A'}</Text>
                  </View>
                  <View style={styles.academicCol}>
                    <Text style={styles.academicLabel}>12th / Diploma</Text>
                    <Text style={styles.academicVal}>{app.student?.twelfthPercentage ? `${app.student.twelfthPercentage}%` : 'N/A'}</Text>
                  </View>
                  {app.resumeUrl ? (
                    <TouchableOpacity
                      style={styles.resumeBtn}
                      onPress={(e) => {
                        e.stopPropagation?.();
                        Linking.openURL(app.resumeUrl);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color="#DC2626" />
                      <Text style={styles.resumeBtnText}>Resume</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.noResumeBadge}>
                      <Text style={styles.noResumeText}>No Resume</Text>
                    </View>
                  )}
                </View>

                <View style={styles.divider} />

                {/* Pipeline Actions */}
                <View style={styles.pipelineActions}>
                  <Text style={styles.actionPrompt}>Advance Candidate:</Text>
                  <View style={styles.actionsWrap}>
                    {options.map((opt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.actionLink}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          handleInitiateStatusUpdate(app, opt);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.actionLinkText,
                            opt.action === 'hired' && styles.actionTextHired,
                            opt.action === 'rejected' && styles.actionTextRejected,
                            opt.action === 'shortlisted' && styles.actionTextShortlisted,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Confirmation Modal for Hire / Reject / Shortlist */}
      <Modal
        visible={!!confirmState}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!statusUpdating) setConfirmState(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            {confirmDetails && (
              <>
                <View style={[styles.confirmIconWrap, { backgroundColor: confirmDetails.iconBg }]}>
                  <MaterialCommunityIcons
                    name={confirmDetails.iconName as any}
                    size={28}
                    color={confirmDetails.iconColor}
                  />
                </View>

                <Text style={styles.confirmTitle}>{confirmDetails.title}</Text>
                <Text style={styles.confirmMessage}>{confirmDetails.message}</Text>

                <View style={styles.confirmFooter}>
                  <TouchableOpacity
                    style={styles.confirmCancelBtn}
                    onPress={() => setConfirmState(null)}
                    disabled={statusUpdating}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.confirmCancelText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confirmActionBtn, { backgroundColor: confirmDetails.confirmBtnBg }]}
                    onPress={handleConfirmStatusUpdate}
                    disabled={statusUpdating}
                    activeOpacity={0.8}
                  >
                    {statusUpdating ? (
                      <ActivityIndicator size="small" color={confirmDetails.confirmBtnTextColor} />
                    ) : (
                      <Text style={[styles.confirmActionBtnText, { color: confirmDetails.confirmBtnTextColor }]}>
                        {confirmDetails.confirmBtnText}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Candidate Application Details Modal */}
      <Modal
        visible={!!selectedCandidate}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCandidate(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsModalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Application Details</Text>
                <Text style={styles.modalHeaderSub}>Submitted candidate profile & documents</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedCandidate(null)}
                hitSlop={8}
              >
                <Feather name="x" size={20} color="#6B6B6B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {selectedCandidate && (
                <>
                  {/* Student Header */}
                  <View style={styles.candidateProfileHeader}>
                    <View style={styles.avatarCircleLarge}>
                      <Text style={styles.avatarLargeText}>
                        {selectedCandidate.student?.fullName
                          ? selectedCandidate.student.fullName.substring(0, 2).toUpperCase()
                          : 'ST'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.candidateName}>{selectedCandidate.student?.fullName || 'Student'}</Text>
                      <Text style={styles.candidateMeta}>
                        {selectedCandidate.student?.branch || 'General'} • {selectedCandidate.student?.year || 'Candidate'}
                      </Text>
                      <View style={styles.candidateStatusRow}>
                        <Text style={styles.candidateStatusText}>
                          Status:{' '}
                          {selectedCandidate.status === 'shortlisted'
                            ? `Round ${selectedCandidate.currentRoundIndex || 1}`
                            : selectedCandidate.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Academic Scores Grid */}
                  <Text style={styles.modalSectionHeading}>ACADEMIC QUALIFICATIONS</Text>
                  <View style={styles.academicGrid}>
                    <View style={styles.academicGridCard}>
                      <Text style={styles.academicGridLabel}>CGPA</Text>
                      <Text style={styles.academicGridVal}>
                        {selectedCandidate.student?.cgpa != null
                          ? `${selectedCandidate.student.cgpa}`
                          : 'N/A'}
                      </Text>
                      <Text style={styles.academicGridSub}>Scale 10.0</Text>
                    </View>

                    <View style={styles.academicGridCard}>
                      <Text style={styles.academicGridLabel}>Backlogs</Text>
                      <Text
                        style={[
                          styles.academicGridVal,
                          {
                            color:
                              (selectedCandidate.student?.activeBacklogs || 0) > 0
                                ? '#DC2626'
                                : '#16A34A',
                          },
                        ]}
                      >
                        {selectedCandidate.student?.activeBacklogs != null
                          ? selectedCandidate.student.activeBacklogs
                          : '0'}
                      </Text>
                      <Text style={styles.academicGridSub}>Active Backlogs</Text>
                    </View>

                    <View style={styles.academicGridCard}>
                      <Text style={styles.academicGridLabel}>10th Score</Text>
                      <Text style={styles.academicGridVal}>
                        {selectedCandidate.student?.tenthPercentage
                          ? `${selectedCandidate.student.tenthPercentage}%`
                          : 'N/A'}
                      </Text>
                      <Text style={styles.academicGridSub}>Secondary</Text>
                    </View>

                    <View style={styles.academicGridCard}>
                      <Text style={styles.academicGridLabel}>12th / Diploma</Text>
                      <Text style={styles.academicGridVal}>
                        {selectedCandidate.student?.twelfthPercentage
                          ? `${selectedCandidate.student.twelfthPercentage}%`
                          : 'N/A'}
                      </Text>
                      <Text style={styles.academicGridSub}>Higher Secondary</Text>
                    </View>
                  </View>

                  {/* Contact Info */}
                  <Text style={styles.modalSectionHeading}>CONTACT DETAILS</Text>
                  <View style={styles.infoBoxCard}>
                    {selectedCandidate.student?.email ? (
                      <TouchableOpacity
                        style={styles.infoBoxRow}
                        onPress={() => Linking.openURL(`mailto:${selectedCandidate.student?.email}`)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="email-outline" size={18} color="#6B6B6B" />
                        <Text style={styles.infoBoxText}>{selectedCandidate.student.email}</Text>
                        <Feather name="external-link" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    ) : null}

                    {selectedCandidate.student?.phone ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(`tel:${selectedCandidate.student?.phone}`)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="phone-outline" size={18} color="#6B6B6B" />
                        <Text style={styles.infoBoxText}>{selectedCandidate.student.phone}</Text>
                        <Feather name="external-link" size={14} color="#9CA3AF" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Resume & Professional Links */}
                  <Text style={styles.modalSectionHeading}>DOCUMENTS & PROFILES</Text>
                  <View style={styles.infoBoxCard}>
                    {selectedCandidate.resumeUrl ? (
                      <TouchableOpacity
                        style={styles.infoBoxRow}
                        onPress={() => Linking.openURL(selectedCandidate.resumeUrl)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="file-pdf-box" size={20} color="#DC2626" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>Resume (PDF)</Text>
                          <Text style={styles.linkSubText}>Tap to view uploaded resume</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.infoBoxRow}>
                        <MaterialCommunityIcons name="file-document-outline" size={20} color="#9CA3AF" />
                        <Text style={[styles.linkMainText, { color: '#9CA3AF', marginLeft: 8 }]}>No resume attached</Text>
                      </View>
                    )}

                    {selectedCandidate.student?.portfolioUrl ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(selectedCandidate.student!.portfolioUrl!)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="web" size={20} color="#2563EB" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>Portfolio Website</Text>
                          <Text style={styles.linkSubText} numberOfLines={1}>{selectedCandidate.student.portfolioUrl}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : null}

                    {selectedCandidate.student?.linkedinUrl ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(selectedCandidate.student!.linkedinUrl!)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="linkedin" size={20} color="#0A66C2" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>LinkedIn</Text>
                          <Text style={styles.linkSubText} numberOfLines={1}>{selectedCandidate.student.linkedinUrl}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : null}

                    {selectedCandidate.student?.githubUrl ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(selectedCandidate.student!.githubUrl!)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="github" size={20} color="#171717" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>GitHub</Text>
                          <Text style={styles.linkSubText} numberOfLines={1}>{selectedCandidate.student.githubUrl}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : null}

                    {selectedCandidate.student?.leetcodeUrl ? (
                      <TouchableOpacity
                        style={[styles.infoBoxRow, { borderTopWidth: 1, borderTopColor: '#F3F1EA' }]}
                        onPress={() => Linking.openURL(selectedCandidate.student!.leetcodeUrl!)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="code-tags" size={20} color="#F59E0B" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.linkMainText}>LeetCode</Text>
                          <Text style={styles.linkSubText} numberOfLines={1}>{selectedCandidate.student.leetcodeUrl}</Text>
                        </View>
                        <Feather name="arrow-up-right" size={16} color="#1A1B1C" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Application Timeline */}
                  <Text style={styles.modalSectionHeading}>APPLICATION TIMELINE</Text>
                  <View style={styles.infoBoxCard}>
                    <View style={styles.infoBoxRow}>
                      <MaterialCommunityIcons name="clock-check-outline" size={16} color="#6B6B6B" />
                      <Text style={[styles.infoBoxText, { marginLeft: 8 }]}>
                        Applied On:{' '}
                        {new Date(selectedCandidate.appliedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Advance Candidate Actions inside modal */}
                  <Text style={styles.modalSectionHeading}>UPDATE APPLICATION STATUS</Text>
                  <View style={styles.modalActionsWrap}>
                    {getStatusOptions(selectedCandidate).map((opt, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.actionLink}
                        onPress={() => handleInitiateStatusUpdate(selectedCandidate, opt)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.actionLinkText,
                            opt.action === 'hired' && styles.actionTextHired,
                            opt.action === 'rejected' && styles.actionTextRejected,
                            opt.action === 'shortlisted' && styles.actionTextShortlisted,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Close Drive Confirmation Modal */}
      <Modal
        visible={showCloseDriveModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!driveClosing) setShowCloseDriveModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={[styles.confirmIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <MaterialCommunityIcons name="lock-alert-outline" size={28} color="#DC2626" />
            </View>

            <Text style={styles.confirmTitle}>Close Placement Drive?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to close this placement drive for{' '}
              <Text style={{ fontWeight: '800', color: '#171717' }}>
                {drive?.companyName} ({drive?.title})
              </Text>
              ? Students will no longer be able to submit applications and the recruitment pipeline will be finalized.
            </Text>

            <View style={styles.confirmFooter}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setShowCloseDriveModal(false)}
                disabled={driveClosing}
                activeOpacity={0.7}
              >
                <Text style={styles.confirmCancelText}>Keep Open</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmActionBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleConfirmCloseDrive}
                disabled={driveClosing}
                activeOpacity={0.8}
              >
                {driveClosing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.confirmActionBtnText, { color: '#FFFFFF' }]}>
                    Yes, Close Drive
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#171717', fontFamily: FontFamily.bold },
  headerSub: { fontSize: 11, color: '#6B6B6B', marginTop: 1, fontFamily: FontFamily.regular },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCleanText: {
    fontSize: 12,
    fontWeight: '700',
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
  headerCloseLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  headerCloseLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textDecorationLine: 'underline',
  },

  scroll: { padding: 14, paddingBottom: 60, gap: 12 },

  // Status Filter Tabs
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

  branchFilterScroll: { gap: 6, paddingVertical: 2 },
  branchPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' as any } : {}),
  },
  branchPillActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  branchText: { fontSize: 11, fontWeight: '700', color: '#6B6B6B' },
  branchTextActive: { color: '#1A1B1C', fontWeight: '800' },

  // Candidate Count
  applicantCountRow: {
    paddingHorizontal: 2,
    marginTop: 2,
    marginBottom: 2,
  },
  applicantCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  },

  // Applicant Card
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  appCardHeader: {
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
  },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#1A1B1C' },
  studentName: { fontSize: 14, fontWeight: '800', color: '#171717' },
  studentMeta: { fontSize: 11, color: '#6B6B6B', marginTop: 2 },

  academicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  academicCol: { minWidth: 70 },
  academicLabel: { fontSize: 10, color: '#8A8A8A', fontWeight: '700' },
  academicVal: { fontSize: 13, fontWeight: '800', color: '#171717', marginTop: 2 },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  resumeBtnText: { fontSize: 12, fontWeight: '800', color: '#1A1B1C' },
  noResumeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  noResumeText: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic' },

  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 12 },

  // Actions
  pipelineActions: { gap: 6 },
  actionPrompt: { fontSize: 10, color: '#8A8A8A', fontWeight: '800', textTransform: 'uppercase' },
  actionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'center' },
  actionLink: {
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  actionLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1B1C',
    textDecorationLine: 'underline',
  },
  actionTextHired: { color: '#16A34A', textDecorationLine: 'underline' },
  actionTextRejected: { color: '#DC2626', textDecorationLine: 'underline' },
  actionTextShortlisted: { color: '#D97706', textDecorationLine: 'underline' },

  // Empty
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#171717', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#6B6B6B', textAlign: 'center', marginTop: 4 },

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Details Modal
  detailsModalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F1EA',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171717',
    fontFamily: FontFamily.bold,
  },
  modalHeaderSub: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollContent: {
    paddingVertical: 14,
    gap: 14,
  },
  candidateProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFDF7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F1EA',
  },
  avatarCircleLarge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
  },
  candidateMeta: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
  },
  candidateStatusRow: {
    marginTop: 4,
  },
  candidateStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  modalSectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  academicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  academicGridCard: {
    width: '48%',
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  academicGridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A8A8A',
    textTransform: 'uppercase',
  },
  academicGridVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171717',
    marginTop: 4,
  },
  academicGridSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  infoBoxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    overflow: 'hidden',
  },
  infoBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 13,
    color: '#171717',
    fontWeight: '600',
  },
  linkMainText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171717',
  },
  linkSubText: {
    fontSize: 11,
    color: '#6B6B6B',
    marginTop: 1,
  },
  modalActionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'center',
    marginTop: 6,
  },
});
