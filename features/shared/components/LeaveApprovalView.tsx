import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

export type LeaveType = 'casual' | 'medical' | 'earned' | 'duty' | 'maternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  employeeCode: string;
  designation: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  substituteFaculty: string;
  contactNumber: string;
  appliedDate: string;
  leaveBalance: {
    casualTaken: number;
    casualAvailable: number;
    medicalTaken: number;
    medicalAvailable: number;
    earnedTaken: number;
    earnedAvailable: number;
  };
  status: LeaveStatus;
  reviewedBy?: string;
  reviewDate?: string;
  reviewRemarks?: string;
}

interface LeaveApprovalViewProps {
  userRole?: 'principal' | 'hod' | 'admin' | 'hr';
  userDepartment?: string;
  reviewerName?: string;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: 'Casual Leave (CL)',
  medical: 'Medical Leave (ML)',
  earned: 'Earned Leave (EL)',
  duty: 'On-Duty Leave (OD)',
  maternity: 'Maternity / Special',
};

const INSTITUTION_DEPARTMENTS = [
  'Computer Science',
  'AIML',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'Commerce & Mgmt',
  'Applied Sciences',
];

const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr-101',
    applicantId: 'fac-cse-1',
    applicantName: 'Dr. Rajesh Iyer',
    employeeCode: 'FAC-CSE-012',
    designation: 'Associate Professor',
    department: 'Computer Science',
    leaveType: 'duty',
    startDate: '2026-10-24',
    endDate: '2026-10-26',
    totalDays: 3,
    reason: 'Invited as Keynote Speaker and Technical Session Chair at the IEEE International Symposium on Neural Architectures.',
    substituteFaculty: 'Prof. Sneha Patil (CSE) arranged to cover Algorithm Analysis & Data Structures lectures.',
    contactNumber: '+91 98450 11223',
    appliedDate: '2026-10-18',
    leaveBalance: {
      casualTaken: 2,
      casualAvailable: 10,
      medicalTaken: 0,
      medicalAvailable: 10,
      earnedTaken: 1,
      earnedAvailable: 14,
    },
    status: 'pending',
  },
  {
    id: 'lr-102',
    applicantId: 'fac-ece-2',
    applicantName: 'Prof. Ananya Sharma',
    employeeCode: 'FAC-ECE-019',
    designation: 'Assistant Professor',
    department: 'Electronics & Comm',
    leaveType: 'casual',
    startDate: '2026-10-22',
    endDate: '2026-10-23',
    totalDays: 2,
    reason: 'Family urgent medical emergency requiring out-of-station travel.',
    substituteFaculty: 'Dr. Vikram Desai covering DSP Lab sessions on Tuesday and Thursday.',
    contactNumber: '+91 98451 44556',
    appliedDate: '2026-10-17',
    leaveBalance: {
      casualTaken: 3,
      casualAvailable: 9,
      medicalTaken: 1,
      medicalAvailable: 9,
      earnedTaken: 0,
      earnedAvailable: 15,
    },
    status: 'pending',
  },
  {
    id: 'lr-103',
    applicantId: 'fac-aim-3',
    applicantName: 'Dr. Sneha Deshmukh',
    employeeCode: 'FAC-AIM-004',
    designation: 'Professor',
    department: 'AIML',
    leaveType: 'casual',
    startDate: '2026-10-28',
    endDate: '2026-10-28',
    totalDays: 1,
    reason: 'Attending Directorate of Technical Education meeting for curriculum revisions.',
    substituteFaculty: 'Prof. Kavya Shetty covering Machine Learning Theory class.',
    contactNumber: '+91 98452 77889',
    appliedDate: '2026-10-18',
    leaveBalance: {
      casualTaken: 4,
      casualAvailable: 8,
      medicalTaken: 0,
      medicalAvailable: 10,
      earnedTaken: 2,
      earnedAvailable: 13,
    },
    status: 'pending',
  },
  {
    id: 'lr-104',
    applicantId: 'fac-mec-4',
    applicantName: 'Prof. Manish Hegde',
    employeeCode: 'FAC-MEC-008',
    designation: 'Assistant Professor',
    department: 'Mechanical Eng',
    leaveType: 'medical',
    startDate: '2026-10-20',
    endDate: '2026-10-25',
    totalDays: 6,
    reason: 'Post-surgical recovery following knee surgery as certified by orthopedic specialist.',
    substituteFaculty: 'Prof. Tanmay Kulkarni covering CAD Lab & Thermodynamics lectures.',
    contactNumber: '+91 98453 99001',
    appliedDate: '2026-10-15',
    leaveBalance: {
      casualTaken: 4,
      casualAvailable: 8,
      medicalTaken: 2,
      medicalAvailable: 8,
      earnedTaken: 0,
      earnedAvailable: 15,
    },
    status: 'approved',
    reviewedBy: 'Dr. V. K. Rao (Principal)',
    reviewDate: '2026-10-16',
    reviewRemarks: 'Approved with medical certificate verified. Substituted classes confirmed.',
  },
];

export const LeaveApprovalView: React.FC<LeaveApprovalViewProps> = ({
  userRole = 'principal',
  userDepartment,
  reviewerName = 'Review Authority',
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const maxContentWidth = Math.min(width, 1200);
  const cardGap = 10;
  const cardWidth = isDesktop ? Math.floor((maxContentWidth - 32 - cardGap) / 2) : '100%';

  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Expandable cards state (compact summary by default; details open on click)
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Rejection Dialog State
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Apply Leave Modal State
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [applyName, setApplyName] = useState(reviewerName || 'Faculty Member');
  const [applyDept, setApplyDept] = useState(userDepartment || 'Computer Science');
  const [applyType, setApplyType] = useState<LeaveType>('casual');
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');
  const [applyReason, setApplyReason] = useState('');
  const [applySubstitute, setApplySubstitute] = useState('');
  const [applyPhone, setApplyPhone] = useState('+91 98450 00000');

  // Metrics
  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'pending').length, [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => r.status === 'approved').length, [requests]);
  const onLeaveTodayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return requests.filter((r) => r.status === 'approved' && r.startDate <= today && r.endDate >= today).length;
  }, [requests]);

  // Filtering
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.applicantName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      if (selectedDept !== 'all' && r.department.toLowerCase() !== selectedDept.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [requests, search, statusFilter, selectedDept]);

  // Handlers
  const handleApprove = (id: string, name: string) => {
    const today = new Date().toISOString().slice(0, 10);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              reviewedBy: reviewerName,
              reviewDate: today,
              reviewRemarks: 'Leave sanctioned after schedule verification.',
            }
          : r
      )
    );
    Alert.alert('Leave Approved', `Leave request for ${name} has been approved.`);
  };

  const handleOpenReject = (id: string) => {
    setRejectTargetId(id);
    setRejectRemarks('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = () => {
    if (!rejectTargetId) return;
    const today = new Date().toISOString().slice(0, 10);
    setRequests((prev) =>
      prev.map((r) =>
        r.id === rejectTargetId
          ? {
              ...r,
              status: 'rejected',
              reviewedBy: reviewerName,
              reviewDate: today,
              reviewRemarks: rejectRemarks.trim() || 'Schedule conflicts / substitute not arranged.',
            }
          : r
      )
    );
    setRejectModalVisible(false);
    setRejectTargetId(null);
    Alert.alert('Leave Rejected', 'Leave request has been marked as rejected.');
  };

  const handleOpenApply = () => {
    setApplyName(reviewerName || 'Faculty Member');
    setApplyDept(userDepartment || 'Computer Science');
    setApplyType('casual');
    setApplyStartDate(new Date().toISOString().slice(0, 10));
    setApplyEndDate(new Date().toISOString().slice(0, 10));
    setApplyReason('');
    setApplySubstitute('');
    setApplyPhone('+91 98450 00000');
    setApplyModalVisible(true);
  };

  const handleSubmitApplication = () => {
    if (!applyStartDate.trim() || !applyReason.trim()) {
      Alert.alert('Required Fields', 'Please specify the start date and reason for leave.');
      return;
    }

    const start = new Date(applyStartDate).getTime();
    const end = new Date(applyEndDate || applyStartDate).getTime();
    const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

    const newReq: LeaveRequest = {
      id: `lr-${Date.now()}`,
      applicantId: `fac-${Date.now()}`,
      applicantName: applyName.trim(),
      employeeCode: `FAC-${applyDept.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      designation: userRole === 'hod' ? 'Head of Department' : 'Faculty Member',
      department: applyDept,
      leaveType: applyType,
      startDate: applyStartDate.trim(),
      endDate: (applyEndDate.trim() || applyStartDate.trim()),
      totalDays: isNaN(days) ? 1 : days,
      reason: applyReason.trim(),
      substituteFaculty: applySubstitute.trim() || 'Work arrangements coordinated internally',
      contactNumber: applyPhone.trim(),
      appliedDate: new Date().toISOString().slice(0, 10),
      leaveBalance: {
        casualTaken: 2,
        casualAvailable: 10,
        medicalTaken: 0,
        medicalAvailable: 10,
        earnedTaken: 0,
        earnedAvailable: 15,
      },
      status: 'pending',
    };

    setRequests((prev) => [newReq, ...prev]);
    setApplyModalVisible(false);
    Alert.alert('Leave Submitted', 'Your leave application has been logged for institutional approval.');
  };

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageHeading} numberOfLines={1}>
            Leave Approvals & Management
          </Text>
          <Text style={styles.pageSubText}>
            Review faculty leave applications, balances, and substitute coverage
          </Text>
        </View>

        <TouchableOpacity style={styles.applyBtn} onPress={handleOpenApply} activeOpacity={0.8}>
          <Feather name="plus" size={13} color="#F4C430" />
          <Text style={styles.applyBtnText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Top Metrics Bar */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNum, { color: '#D97706' }]}>{pendingCount}</Text>
          <Text style={styles.metricLabel}>Pending Review</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNum, { color: '#16A34A' }]}>{approvedCount}</Text>
          <Text style={styles.metricLabel}>Approved (Month)</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={[styles.metricNum, { color: '#111827' }]}>{onLeaveTodayCount}</Text>
          <Text style={styles.metricLabel}>On Leave Today</Text>
        </View>
      </View>

      {/* 3. Search & Filters */}
      <View style={styles.searchSectionWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={14} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by faculty name, ID, or department..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn}>
              <Feather name="x" size={13} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Status Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'pending' as const, label: `Pending Approvals (${pendingCount})` },
            { key: 'approved' as const, label: `Approved (${approvedCount})` },
            { key: 'rejected' as const, label: 'Rejected' },
            { key: 'all' as const, label: `All Requests (${requests.length})` },
          ].map((item) => {
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

        {/* Department Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptScroll}>
          {['all', ...INSTITUTION_DEPARTMENTS].map((dept) => {
            const active = selectedDept.toLowerCase() === dept.toLowerCase();
            return (
              <TouchableOpacity
                key={dept}
                style={[styles.deptChip, active && styles.deptChipActive]}
                onPress={() => setSelectedDept(dept)}
                activeOpacity={0.7}
              >
                <Text style={[styles.deptChipText, active && styles.deptChipTextActive]}>
                  {dept === 'all' ? 'All Departments' : dept}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Requests List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="check-circle" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No leave applications</Text>
            <Text style={styles.emptySub}>
              {statusFilter === 'pending'
                ? 'All pending leave applications have been reviewed.'
                : 'No leave applications matching the selected criteria.'}
            </Text>
          </View>
        ) : (
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            {filteredRequests.map((r) => {
              const isPending = r.status === 'pending';
              const isApproved = r.status === 'approved';
              const isRejected = r.status === 'rejected';
              const isExpanded = !!expandedCardIds[r.id];

              return (
                <View key={r.id} style={[styles.card, { width: cardWidth }]}>
                  {/* Tappable Card Header (Click to expand / collapse) */}
                  <TouchableOpacity
                    onPress={() => toggleExpand(r.id)}
                    activeOpacity={0.75}
                    style={styles.cardHeaderTouchable}
                  >
                    <View style={styles.cardHeaderTop}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.applicantName}>{r.applicantName}</Text>
                        <Text style={styles.applicantMeta}>
                          {r.employeeCode} · {r.designation} · {r.department}
                        </Text>
                      </View>

                      {/* Status Pill with Brand Theme Colors */}
                      <View
                        style={[
                          styles.statusPill,
                          isPending && styles.statusPillPending,
                          isApproved && styles.statusPillApproved,
                          isRejected && styles.statusPillRejected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isPending && styles.statusPillTextPending,
                            isApproved && styles.statusPillTextApproved,
                            isRejected && styles.statusPillTextRejected,
                          ]}
                        >
                          {r.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {/* Summary Row (Always visible in collapsed mode) */}
                    <View style={styles.cardSummaryRow}>
                      <View style={styles.summaryTagsWrap}>
                        <View style={styles.leaveTypeTag}>
                          <Text style={styles.leaveTypeTagText}>{LEAVE_TYPE_LABELS[r.leaveType]}</Text>
                        </View>
                        <Text style={styles.durationText}>
                          {r.startDate === r.endDate ? r.startDate : `${r.startDate} → ${r.endDate}`}
                        </Text>
                        <View style={styles.totalDaysBadge}>
                          <Text style={styles.totalDaysBadgeText}>
                            {r.totalDays} {r.totalDays === 1 ? 'Day' : 'Days'}
                          </Text>
                        </View>
                      </View>

                      {/* Expand / Collapse Indicator */}
                      <View style={styles.expandActionWrap}>
                        <Text style={styles.expandActionText}>
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </Text>
                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color="#B45309"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* EXPANDABLE SECTION: The rest opens on click */}
                  {isExpanded && (
                    <View style={styles.expandedDetailsWrap}>
                      {/* Balance & Entitlement Info */}
                      <View style={styles.balanceContainer}>
                        <View style={styles.balanceHeaderRow}>
                          <Feather name="pie-chart" size={13} color="#B45309" />
                          <Text style={styles.balanceHeaderTitle}>Leave Entitlement & Balances</Text>
                        </View>
                        <Text style={styles.balanceValueText}>
                          CL: <Text style={styles.boldText}>{r.leaveBalance.casualTaken} taken</Text> / {r.leaveBalance.casualAvailable} avail · ML: <Text style={styles.boldText}>{r.leaveBalance.medicalAvailable} avail</Text> · EL: {r.leaveBalance.earnedAvailable} avail
                        </Text>
                      </View>

                      {/* Reason for Absence */}
                      <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Reason for Absence:</Text>
                        <Text style={styles.reasonText}>{r.reason}</Text>
                      </View>

                      {/* Class / Work Substitute Arrangement */}
                      <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Class / Work Substitute Arrangement:</Text>
                        <Text style={styles.substituteText}>{r.substituteFaculty}</Text>
                      </View>

                      {/* Emergency Contact & Applied Date */}
                      <View style={styles.contactRow}>
                        <MaterialCommunityIcons name="phone-outline" size={13} color="#B45309" />
                        <Text style={styles.contactText}>Emergency: {r.contactNumber}</Text>
                        <Text style={styles.dotSeparator}>·</Text>
                        <Text style={styles.appliedDateText}>Applied on {r.appliedDate}</Text>
                      </View>

                      {/* If Reviewed, show Audit info */}
                      {r.reviewedBy && (
                        <View style={styles.auditBox}>
                          <Text style={styles.auditText}>
                            {isApproved ? 'Approved' : 'Rejected'} by {r.reviewedBy} on {r.reviewDate}
                          </Text>
                          {r.reviewRemarks ? <Text style={styles.auditRemarks}>"{r.reviewRemarks}"</Text> : null}
                        </View>
                      )}

                      {/* Decision Actions for Pending Requests */}
                      {isPending && (
                        <View style={styles.actionBtnRow}>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleOpenReject(r.id)}
                            activeOpacity={0.7}
                          >
                            <Feather name="x" size={14} color="#DC2626" />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>

                          {/* Accept / Approve Button with YELLOW FADE background and BLACK TEXT */}
                          <TouchableOpacity
                            style={styles.approveBtnYellow}
                            onPress={() => handleApprove(r.id, r.applicantName)}
                            activeOpacity={0.8}
                          >
                            <Feather name="check" size={15} color="#111827" />
                            <Text style={styles.approveBtnYellowText}>Approve Leave</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 5. REJECT REMARKS MODAL */}
      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalDialogSmall}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Leave Application</Text>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Feather name="x" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalPromptText}>
              Please state the justification or reason for rejection so the faculty member can be notified:
            </Text>

            <TextInput
              style={[styles.modalInput, styles.modalTextAreaSmall]}
              placeholder="e.g. Schedule conflicts during exam week; substitute not confirmed."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={rejectRemarks}
              onChangeText={setRejectRemarks}
            />

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmReject} style={styles.confirmRejectBtn}>
                <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 6. APPLY FOR LEAVE MODAL */}
      <Modal visible={applyModalVisible} transparent animationType="fade" onRequestClose={() => setApplyModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleWrap}>
                <View style={styles.modalIconSquare}>
                  <Feather name="calendar" size={15} color="#111827" />
                </View>
                <View>
                  <Text style={styles.modalTitle}>Submit Leave Application</Text>
                  <Text style={styles.modalSubtitle}>Institutional staff & faculty leave portal</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)}>
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollArea} contentContainerStyle={styles.modalScrollContent}>
              {/* Applicant Name & Dept */}
              <View style={styles.modalRowFields}>
                <View style={[styles.modalFieldGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Applicant Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={applyName}
                    onChangeText={setApplyName}
                    placeholder="Faculty name"
                  />
                </View>
                <View style={[styles.modalFieldGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Department *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={applyDept}
                    onChangeText={setApplyDept}
                    placeholder="Department"
                  />
                </View>
              </View>

              {/* Leave Type */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Leave Category *</Text>
                <View style={styles.modalChipsWrap}>
                  {(
                    [
                      { key: 'casual', label: 'Casual Leave (CL)' },
                      { key: 'medical', label: 'Medical Leave (ML)' },
                      { key: 'duty', label: 'On-Duty (OD)' },
                      { key: 'earned', label: 'Earned Leave (EL)' },
                      { key: 'maternity', label: 'Special / Other' },
                    ] as const
                  ).map((t) => {
                    const active = applyType === t.key;
                    return (
                      <TouchableOpacity
                        key={t.key}
                        style={[styles.modalChip, active && styles.modalChipActive]}
                        onPress={() => setApplyType(t.key)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.modalChipText, active && styles.modalChipTextActive]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Dates */}
              <View style={styles.modalRowFields}>
                <View style={[styles.modalFieldGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>Start Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-10-25"
                    placeholderTextColor="#9CA3AF"
                    value={applyStartDate}
                    onChangeText={setApplyStartDate}
                  />
                </View>
                <View style={[styles.modalFieldGroup, { flex: 1 }]}>
                  <Text style={styles.modalLabel}>End Date (YYYY-MM-DD) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="2026-10-26"
                    placeholderTextColor="#9CA3AF"
                    value={applyEndDate}
                    onChangeText={setApplyEndDate}
                  />
                </View>
              </View>

              {/* Substitute Faculty */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Class / Academic Substitute Arrangement *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Prof. Sneha Patil (CSE) arranged for Period 3 & 4"
                  placeholderTextColor="#9CA3AF"
                  value={applySubstitute}
                  onChangeText={setApplySubstitute}
                />
              </View>

              {/* Reason */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Reason for Leave *</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="Detailed explanation of the leave requirement..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={applyReason}
                  onChangeText={setApplyReason}
                />
              </View>

              {/* Contact */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Emergency Phone / Contact</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="+91 98450 00000"
                  placeholderTextColor="#9CA3AF"
                  value={applyPhone}
                  onChangeText={setApplyPhone}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => setApplyModalVisible(false)} style={styles.modalCancelBtn}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmitApplication} style={styles.modalSaveBtn}>
                <Feather name="check" size={13} color="#FFFFFF" />
                <Text style={styles.modalSaveText}>Submit Application</Text>
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
  },
  pageSubText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#6B7280',
    marginTop: 2,
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  applyBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  metricNum: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
    lineHeight: 22,
  },
  metricLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 2,
  },
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
    marginVertical: 8,
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
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
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
    color: '#F4C430',
  },
  deptScroll: {
    flexDirection: 'row',
    gap: 5,
  },
  deptChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  deptChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  deptChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#6B7280',
  },
  deptChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#92400E',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    paddingBottom: 110,
  },
  cardsGrid: {
    gap: 10,
  },
  cardsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderTouchable: {
    width: '100%',
  },
  cardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  applicantName: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#111827',
    lineHeight: 19,
  },
  applicantMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusPillPending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusPillApproved: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusPillRejected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: '#4B5563',
    letterSpacing: 0.4,
  },
  statusPillTextPending: {
    color: '#B45309',
  },
  statusPillTextApproved: {
    color: '#065F46',
  },
  statusPillTextRejected: {
    color: '#991B1B',
  },
  cardSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  summaryTagsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  leaveTypeTag: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  leaveTypeTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#92400E',
  },
  durationText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  totalDaysBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  totalDaysBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#92400E',
  },
  expandActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFDF7',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  expandActionText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#B45309',
  },
  expandedDetailsWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  balanceContainer: {
    backgroundColor: '#FFFDF7',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    borderRadius: 8,
    padding: 9,
    gap: 4,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  balanceHeaderTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  balanceValueText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#4B5563',
  },
  boldText: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  sectionRow: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#6B7280',
    marginBottom: 2,
  },
  reasonText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#1F2937',
    lineHeight: 17,
  },
  substituteText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#374151',
    lineHeight: 16.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    marginBottom: 4,
  },
  contactText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  dotSeparator: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  appliedDateText: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  auditBox: {
    backgroundColor: '#FFFDF7',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  auditText: {
    fontFamily: FontFamily.medium,
    fontSize: 10.5,
    color: '#4B5563',
  },
  auditRemarks: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rejectBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#DC2626',
  },
  approveBtnYellow: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F4C430', // Brand Yellow Fade
    borderWidth: 1,
    borderColor: '#EAB308',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 2,
  },
  approveBtnYellowText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#111827', // Black text
    letterSpacing: -0.1,
  },
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
    maxWidth: 290,
    lineHeight: 17,
  },
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
  modalDialogSmall: {
    width: '100%',
    maxWidth: 420,
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
  modalPromptText: {
    fontSize: 12,
    color: '#4B5563',
    fontFamily: FontFamily.regular,
    lineHeight: 17,
    marginBottom: 10,
  },
  modalScrollArea: {
    maxHeight: 420,
  },
  modalScrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  modalFieldGroup: {
    gap: 5,
  },
  modalRowFields: {
    flexDirection: 'row',
    gap: 10,
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
    height: 64,
    paddingVertical: 8,
  },
  modalTextAreaSmall: {
    height: 70,
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
  modalSaveText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  confirmRejectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  confirmRejectText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
});
