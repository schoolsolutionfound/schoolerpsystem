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
  RefreshControl,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';

export type LeaveType = 'casual' | 'medical' | 'earned' | 'duty' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type ApprovalAuthority = 'hod' | 'principal' | 'hr';

export interface LeaveRequest {
  id: string;
  applicantId: string;
  applicantName: string;
  employeeCode: string;
  designation: string;
  department: string;
  leaveType: LeaveType;
  approvalAuthority: ApprovalAuthority;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  substituteFaculty?: string;
  contactNumber?: string;
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
  userRole?: 'principal' | 'hod' | 'admin' | 'hr' | 'teacher' | 'faculty';
  userDepartment?: string;
  reviewerName?: string;
}

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  casual: 'Casual Leave',
  medical: 'Medical Leave',
  earned: 'Earned Leave',
  duty: 'On-Duty',
  other: 'Other',
};

const APPROVAL_AUTHORITY_LABELS: Record<ApprovalAuthority, string> = {
  hod: 'Head of Dept (HOD)',
  principal: 'Principal',
  hr: 'HR / Admin Office',
};

const formatShortDate = (dStr: string): string => {
  if (!dStr) return '';
  const parts = dStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1] || parts[1];
    return `${day} ${month}`;
  }
  return dStr;
};

const formatLeaveDuration = (start: string, end: string, days: number): string => {
  const daysLabel = `${days}d`;
  if (start === end) {
    return `${formatShortDate(start)} · ${daysLabel}`;
  }
  return `${formatShortDate(start)} – ${formatShortDate(end)} · ${daysLabel}`;
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

const DEPARTMENT_HODS: Record<string, { name: string; designation: string }> = {
  'Computer Science': { name: 'Dr. K. S. Ramanathan', designation: 'Professor & HOD (Computer Science)' },
  'AIML': { name: 'Dr. Sneha Deshmukh', designation: 'Professor & HOD (AIML)' },
  'Electronics & Comm': { name: 'Dr. Vikram Desai', designation: 'Professor & HOD (Electronics & Comm)' },
  'Mechanical Eng': { name: 'Prof. S. R. Verma', designation: 'Professor & HOD (Mechanical Eng)' },
  'Civil Eng': { name: 'Dr. Manjunath Shetty', designation: 'Professor & HOD (Civil Eng)' },
  'Commerce & Mgmt': { name: 'Dr. Anjali Menon', designation: 'Professor & HOD (Commerce & Mgmt)' },
  'Applied Sciences': { name: 'Dr. P. N. Murthy', designation: 'Professor & HOD (Applied Sciences)' },
};

const INITIAL_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr-101',
    applicantId: 'fac-cse-1',
    applicantName: 'Dr. Rajesh Iyer',
    employeeCode: 'FAC-CSE-012',
    designation: 'Associate Professor',
    department: 'Computer Science',
    leaveType: 'duty',
    approvalAuthority: 'hod',
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
    approvalAuthority: 'hod',
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
    designation: 'Professor & HOD',
    department: 'AIML',
    leaveType: 'casual',
    approvalAuthority: 'principal',
    startDate: '2026-10-28',
    endDate: '2026-10-28',
    totalDays: 1,
    reason: 'Attending Directorate of Technical Education meeting for curriculum revisions as HOD.',
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
    approvalAuthority: 'hod',
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
    reviewedBy: 'Prof. S. R. Verma (HOD - Mechanical Eng)',
    reviewDate: '2026-10-16',
    reviewRemarks: 'Approved by Department Reporting Manager (HOD). Substituted classes confirmed.',
  },
  {
    id: 'lr-105',
    applicantId: 'fac-cse-2',
    applicantName: 'Prof. Sneha Patil',
    employeeCode: 'FAC-CSE-028',
    designation: 'Assistant Professor',
    department: 'Computer Science',
    leaveType: 'casual',
    approvalAuthority: 'hod',
    startDate: '2026-10-23',
    endDate: '2026-10-24',
    totalDays: 2,
    reason: 'Family urgent personal commitment requiring 2 days out-of-station leave.',
    substituteFaculty: 'Dr. Rajesh Iyer covering Data Structures lab.',
    contactNumber: '+91 98450 33445',
    appliedDate: '2026-10-19',
    leaveBalance: {
      casualTaken: 1,
      casualAvailable: 11,
      medicalTaken: 0,
      medicalAvailable: 10,
      earnedTaken: 0,
      earnedAvailable: 15,
    },
    status: 'pending',
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

  const isPrincipal = userRole === 'principal' || userRole === 'admin';
  const isHOD = userRole === 'hod';
  const isFaculty = userRole === 'teacher' || userRole === 'faculty';
  const effectiveDepartment = userDepartment || 'Computer Science';

  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [selectedDept, setSelectedDept] = useState<string>(isHOD ? effectiveDepartment : 'all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Base requests scoped strictly by role & department:
  // - Principal: Institution-wide visibility across all departments.
  // - HOD: Strictly scoped to their own department (e.g. Computer Science).
  //        Other department HODs cannot view this department's leave applications no matter what!
  // - Faculty: Sees their own department's leaves and their own submissions.
  const baseRequests = useMemo(() => {
    if (isPrincipal) {
      return requests;
    }
    if (isHOD) {
      return requests.filter(
        (r) => r.department.toLowerCase() === effectiveDepartment.toLowerCase()
      );
    }
    if (isFaculty) {
      return requests.filter(
        (r) =>
          r.department.toLowerCase() === effectiveDepartment.toLowerCase() ||
          r.applicantName.toLowerCase() === (reviewerName || '').toLowerCase()
      );
    }
    return requests;
  }, [requests, isPrincipal, isHOD, isFaculty, effectiveDepartment, reviewerName]);

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
  const [applyName, setApplyName] = useState(reviewerName || (isFaculty ? 'Faculty Member' : 'Staff Member'));
  const [applyDept, setApplyDept] = useState(effectiveDepartment);
  const [applyDeptDropdownOpen, setApplyDeptDropdownOpen] = useState(false);
  const [applyType, setApplyType] = useState<LeaveType>('casual');
  const [applyTypeDropdownOpen, setApplyTypeDropdownOpen] = useState(false);
  const [applyStartDate, setApplyStartDate] = useState('');
  const [applyEndDate, setApplyEndDate] = useState('');
  const [applyReason, setApplyReason] = useState('');

  // Auto-fetched Approving Authority (Reporting Manager) based on role & department
  const autoApprover = useMemo(() => {
    if (isHOD) {
      // HOD reports directly to the Principal
      return {
        authority: 'principal' as ApprovalAuthority,
        name: 'Dr. V. K. Rao',
        designation: 'Principal & Institutional Head',
        roleBadge: 'Reporting Manager',
        helperText: 'As Head of Department, your reporting manager is the Principal. Your application is automatically routed to the Principal for sanction.',
      };
    }
    if (isFaculty) {
      // Faculty reports directly to their Department HOD
      const hod = DEPARTMENT_HODS[applyDept] || {
        name: `HOD (${applyDept})`,
        designation: `Head of Department · ${applyDept}`,
      };
      return {
        authority: 'hod' as ApprovalAuthority,
        name: hod.name,
        designation: hod.designation,
        roleBadge: 'Reporting Manager',
        helperText: `Your direct reporting manager is ${hod.name}. Your leave is sanctioned solely by your HOD. The Principal receives real-time institutional records.`,
      };
    }
    // General staff fallback -> Principal
    return {
      authority: 'principal' as ApprovalAuthority,
      name: 'Dr. V. K. Rao',
      designation: 'Principal & Institutional Head',
      roleBadge: 'Reporting Manager',
      helperText: 'Your application is automatically routed to the Principal for executive sanction.',
    };
  }, [isHOD, isFaculty, applyDept]);

  // Metrics (calculated over scoped baseRequests)
  const pendingCount = useMemo(() => baseRequests.filter((r) => r.status === 'pending').length, [baseRequests]);
  const approvedCount = useMemo(() => baseRequests.filter((r) => r.status === 'approved').length, [baseRequests]);
  const rejectedCount = useMemo(() => baseRequests.filter((r) => r.status === 'rejected').length, [baseRequests]);
  const onLeaveTodayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return baseRequests.filter((r) => r.status === 'approved' && r.startDate <= today && r.endDate >= today).length;
  }, [baseRequests]);

  // Filter Modal State
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [tempStatus, setTempStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>(statusFilter);
  const [tempDept, setTempDept] = useState<string>(selectedDept);
  const [authorityFilter, setAuthorityFilter] = useState<'all' | ApprovalAuthority>('all');
  const [tempAuthority, setTempAuthority] = useState<'all' | ApprovalAuthority>(authorityFilter);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    (isPrincipal && selectedDept.toLowerCase() !== 'all') ||
    authorityFilter !== 'all';
  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (isPrincipal && selectedDept.toLowerCase() !== 'all' ? 1 : 0) +
    (authorityFilter !== 'all' ? 1 : 0);

  const handleOpenFilterModal = () => {
    setTempStatus(statusFilter);
    setTempDept(selectedDept);
    setTempAuthority(authorityFilter);
    setFilterModalVisible(true);
  };

  const handleApplyFilters = () => {
    setStatusFilter(tempStatus);
    if (isPrincipal) {
      setSelectedDept(tempDept);
    }
    setAuthorityFilter(tempAuthority);
    setFilterModalVisible(false);
  };

  const handleResetFilters = () => {
    setTempStatus('all');
    setTempDept(isHOD ? effectiveDepartment : 'all');
    setTempAuthority('all');
    setStatusFilter('all');
    setSelectedDept(isHOD ? effectiveDepartment : 'all');
    setAuthorityFilter('all');
    setFilterModalVisible(false);
  };

  // Filtering
  const filteredRequests = useMemo(() => {
    return baseRequests.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        r.applicantName.toLowerCase().includes(q) ||
        r.employeeCode.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      if (isPrincipal && selectedDept !== 'all' && r.department.toLowerCase() !== selectedDept.toLowerCase()) {
        return false;
      }

      if (authorityFilter !== 'all' && (r.approvalAuthority || 'principal') !== authorityFilter) {
        return false;
      }

      return true;
    });
  }, [baseRequests, search, statusFilter, selectedDept, authorityFilter, isPrincipal]);

  // Approval permission check:
  // - Departmental faculty leaves (approvalAuthority === 'hod'):
  //   ONLY the respective department HOD can sanction/reject.
  //   Principal has institutional oversight (can view/track all departments), but CANNOT sanction faculty leaves,
  //   as approving them directly creates scheduling, substitute, and departmental planning issues for the HOD!
  // - HOD leaves / Institutional leaves (approvalAuthority === 'principal'):
  //   Sanctioned by the Principal (who is the direct reporting manager for HODs).
  const canUserApprove = (r: LeaveRequest) => {
    if (r.status !== 'pending') return false;
    if (isPrincipal) {
      // Principal only sanctions leaves routed to the Principal (e.g. HOD leave applications)
      return r.approvalAuthority === 'principal';
    }
    if (isHOD) {
      // HOD only sanctions leaves for faculty in their own department
      return (
        r.approvalAuthority === 'hod' &&
        r.department.toLowerCase() === effectiveDepartment.toLowerCase()
      );
    }
    return false; // Faculty cannot approve leaves
  };

  // Handlers
  const handleApprove = (id: string, name: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const approverRoleTitle = isHOD ? `HOD (${effectiveDepartment})` : 'Principal';
    const sanctionRemarks = isHOD
      ? `Sanctioned by Reporting Manager (${reviewerName}, HOD - ${effectiveDepartment}). Visible to Principal.`
      : `Sanctioned by Executive Authority (${reviewerName}, Principal).`;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'approved',
              reviewedBy: `${reviewerName} (${approverRoleTitle})`,
              reviewDate: today,
              reviewRemarks: sanctionRemarks,
            }
          : r
      )
    );
    Alert.alert(
      'Leave Approved',
      `Leave request for ${name} has been sanctioned.${
        isHOD ? ' Principal has been updated for institutional oversight.' : ''
      }`
    );
  };

  const handleOpenReject = (id: string) => {
    setRejectTargetId(id);
    setRejectRemarks('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = () => {
    if (!rejectTargetId) return;
    const today = new Date().toISOString().slice(0, 10);
    const approverRoleTitle = isHOD ? `HOD (${effectiveDepartment})` : 'Principal';
    setRequests((prev) =>
      prev.map((r) =>
        r.id === rejectTargetId
          ? {
              ...r,
              status: 'rejected',
              reviewedBy: `${reviewerName} (${approverRoleTitle})`,
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
    setApplyName(reviewerName || (isFaculty ? 'Faculty Member' : isHOD ? 'Head of Dept' : 'Institutional Staff'));
    setApplyDept(effectiveDepartment);
    setApplyType('casual');
    setApplyStartDate(new Date().toISOString().slice(0, 10));
    setApplyEndDate(new Date().toISOString().slice(0, 10));
    setApplyReason('');
    setApplyDeptDropdownOpen(false);
    setApplyTypeDropdownOpen(false);
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
      applicantId: `emp-${Date.now()}`,
      applicantName: applyName.trim() || 'Staff Member',
      employeeCode: `EMP-${applyDept.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      designation: isHOD ? 'Head of Department' : isFaculty ? 'Assistant Professor' : 'Faculty / Staff',
      department: applyDept,
      leaveType: applyType,
      approvalAuthority: autoApprover.authority,
      startDate: applyStartDate.trim(),
      endDate: (applyEndDate.trim() || applyStartDate.trim()),
      totalDays: isNaN(days) ? 1 : days,
      reason: applyReason.trim(),
      substituteFaculty: 'Internal departmental handover arranged',
      contactNumber: '+91 98450 00000',
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

    Alert.alert(
      'Leave Submitted',
      `Your application has been routed to your auto-assigned Reporting Manager (${autoApprover.name}, ${autoApprover.designation}) for sanction.`
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.pageHeading} numberOfLines={1}>
            {isHOD
              ? 'Department Leave Approvals'
              : isFaculty
              ? 'My Leave Applications'
              : 'Leave Approvals'}
          </Text>
          <Text style={styles.pageSubText} numberOfLines={1}>
            {isHOD
              ? `Reporting Manager View · ${effectiveDepartment} Faculty`
              : isFaculty
              ? `Reporting Manager: HOD (${effectiveDepartment})`
              : 'All Departments'}
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

      {/* 3. Search & Filters with In-Bar Filter Button */}
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
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearSearchBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Feather name="x" size={13} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}

          {/* Search / Filter Divider */}
          <View style={styles.searchFilterDivider} />

          {/* In-bar Filter Button */}
          <TouchableOpacity
            style={[styles.inBarFilterBtn, hasActiveFilters && styles.inBarFilterBtnActive]}
            onPress={handleOpenFilterModal}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={15}
              color={hasActiveFilters ? '#111827' : '#4B5563'}
            />
            <Text
              style={[styles.inBarFilterText, hasActiveFilters && styles.inBarFilterTextActive]}
              numberOfLines={1}
            >
              Filter
            </Text>
            {hasActiveFilters ? (
              <View style={styles.inBarFilterActiveBadge}>
                <Text style={styles.inBarFilterActiveBadgeText}>{activeFiltersCount}</Text>
              </View>
            ) : (
              <Feather name="chevron-down" size={13} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>

        {/* Active Filter Tags Row */}
        {hasActiveFilters ? (
          <View style={styles.activeFiltersRow}>
            {statusFilter !== 'all' && (
              <View style={styles.activeTagPill}>
                <Text style={styles.activeTagPillText}>
                  Status: {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                </Text>
                <TouchableOpacity
                  onPress={() => setStatusFilter('all')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Feather name="x" size={11} color="#111827" />
                </TouchableOpacity>
              </View>
            )}
            {authorityFilter !== 'all' && (
              <View style={styles.activeTagPill}>
                <Text style={styles.activeTagPillText}>
                  Approver: {APPROVAL_AUTHORITY_LABELS[authorityFilter]}
                </Text>
                <TouchableOpacity
                  onPress={() => setAuthorityFilter('all')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Feather name="x" size={11} color="#111827" />
                </TouchableOpacity>
              </View>
            )}
            {selectedDept.toLowerCase() !== 'all' && (
              <View style={styles.activeTagPill}>
                <Text style={styles.activeTagPillText}>Dept: {selectedDept}</Text>
                <TouchableOpacity
                  onPress={() => setSelectedDept('all')}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Feather name="x" size={11} color="#111827" />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              onPress={() => {
                setStatusFilter('all');
                setSelectedDept('all');
                setAuthorityFilter('all');
              }}
              style={styles.clearAllFiltersBtn}
            >
              <Text style={styles.clearAllFiltersText}>Reset</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>

      {/* 4. Requests List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#000000']}
            tintColor="#000000"
          />
        }
      >
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
              const hodInfo = DEPARTMENT_HODS[r.department];
              const approverDesignation = r.approvalAuthority === 'hod' ? `HOD (${r.department})` : 'Principal';
              const approverText = r.approvalAuthority === 'hod' && hodInfo
                ? `${hodInfo.name} (HOD - ${r.department})`
                : approverDesignation;

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
                          {r.designation} · {r.department}
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
                        <Text style={styles.leaveTypeTagText}>{LEAVE_TYPE_LABELS[r.leaveType]}</Text>
                        <Text style={styles.durationText}>
                          · {formatLeaveDuration(r.startDate, r.endDate, r.totalDays)}
                        </Text>
                        <Text style={styles.authorityIndicatorText}>
                          · To: {APPROVAL_AUTHORITY_LABELS[r.approvalAuthority || 'principal']}
                        </Text>
                      </View>

                      {/* Expand / Collapse Indicator */}
                      <View style={styles.expandActionWrap}>
                        <Text style={styles.expandActionText}>
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </Text>
                        <Feather
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={13}
                          color="#111827"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* EXPANDABLE SECTION: The rest opens on click */}
                  {isExpanded && (
                    <View style={styles.expandedDetailsWrap}>
                      {/* Compact Balance Info */}
                      <View style={styles.compactBalanceRow}>
                        <Feather name="clock" size={12} color="#6B7280" />
                        <Text style={styles.compactBalanceText}>
                          Available: <Text style={styles.boldText}>{r.leaveBalance.casualAvailable} CL</Text> · <Text style={styles.boldText}>{r.leaveBalance.medicalAvailable} ML</Text> · <Text style={styles.boldText}>{r.leaveBalance.earnedAvailable} EL</Text>
                        </Text>
                      </View>

                      {/* Approving Authority & Reporting Manager info */}
                      <View style={styles.reportingManagerCard}>
                        <View style={styles.reportingManagerTop}>
                          <Feather name="shield" size={12} color="#111827" />
                          <Text style={styles.reportingManagerTitle}>
                            Reporting Manager: {approverText}
                          </Text>
                        </View>
                      </View>

                      {/* Reason */}
                      <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Reason:</Text>
                        <Text style={styles.reasonText}>{r.reason}</Text>
                      </View>

                      {/* Substitute */}
                      <View style={styles.sectionRow}>
                        <Text style={styles.sectionTitle}>Substitute:</Text>
                        <Text style={styles.substituteText}>{r.substituteFaculty}</Text>
                      </View>

                      {/* Emergency Contact & Applied Date */}
                      <View style={styles.contactRow}>
                        <Feather name="phone" size={11} color="#6B7280" />
                        <Text style={styles.contactText}>{r.contactNumber}</Text>
                        <Text style={styles.dotSeparator}>·</Text>
                        <Text style={styles.appliedDateText}>Applied {formatShortDate(r.appliedDate)}</Text>
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
                      {isPending && canUserApprove(r) && (
                        <View style={styles.actionBtnRow}>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleOpenReject(r.id)}
                            activeOpacity={0.7}
                          >
                            <Feather name="x" size={14} color="#DC2626" />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>

                          {/* Accept / Approve Button */}
                          <TouchableOpacity
                            style={styles.approveBtnYellow}
                            onPress={() => handleApprove(r.id, r.applicantName)}
                            activeOpacity={0.8}
                          >
                            <Feather name="check" size={15} color="#111827" />
                            <Text style={styles.approveBtnYellowText}>
                              {isHOD ? 'Approve as HOD' : 'Approve Leave'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      {/* Notice if pending but user is faculty or not designated approver */}
                      {isPending && !canUserApprove(r) && (
                        <View style={styles.pendingNoticeWrap}>
                          <Feather name="clock" size={12} color="#D97706" />
                          <Text style={styles.pendingNoticeText}>
                            Awaiting approval by {approverText}
                          </Text>
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

            <ScrollView style={styles.modalScrollArea} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              {/* Applicant Name */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Applicant Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={applyName}
                  onChangeText={setApplyName}
                  placeholder="Full name"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {/* Department */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Department *</Text>
                {isPrincipal ? (
                  <>
                    <TouchableOpacity
                      style={[styles.dropdownTrigger, applyDeptDropdownOpen && styles.dropdownTriggerActive]}
                      onPress={() => {
                        setApplyDeptDropdownOpen(!applyDeptDropdownOpen);
                        setApplyTypeDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dropdownTriggerText}>{applyDept}</Text>
                      <Feather name={applyDeptDropdownOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#6B7280" />
                    </TouchableOpacity>
                    {applyDeptDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        {INSTITUTION_DEPARTMENTS.map((dept) => {
                          const selected = applyDept === dept;
                          return (
                            <TouchableOpacity
                              key={dept}
                              style={[styles.dropdownMenuItem, selected && styles.dropdownMenuItemActive]}
                              onPress={() => {
                                setApplyDept(dept);
                                setApplyDeptDropdownOpen(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text style={[styles.dropdownMenuText, selected && styles.dropdownMenuTextActive]}>
                                {dept}
                              </Text>
                              {selected && <Feather name="check" size={13} color="#111827" />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.lockedDeptField}>
                    <Text style={styles.lockedDeptText}>{applyDept}</Text>
                    <View style={styles.lockedDeptBadge}>
                      <Feather name="lock" size={11} color="#6B7280" />
                      <Text style={styles.lockedDeptBadgeText}>Your Department</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Leave Category Dropdown */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Leave Category *</Text>
                <TouchableOpacity
                  style={[styles.dropdownTrigger, applyTypeDropdownOpen && styles.dropdownTriggerActive]}
                  onPress={() => {
                    setApplyTypeDropdownOpen(!applyTypeDropdownOpen);
                    setApplyDeptDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dropdownTriggerText}>{LEAVE_TYPE_LABELS[applyType]}</Text>
                  <Feather name={applyTypeDropdownOpen ? 'chevron-up' : 'chevron-down'} size={15} color="#6B7280" />
                </TouchableOpacity>
                {applyTypeDropdownOpen && (
                  <View style={styles.dropdownMenu}>
                    {(['casual', 'medical', 'earned', 'duty', 'other'] as LeaveType[]).map((typeKey) => {
                      const selected = applyType === typeKey;
                      return (
                        <TouchableOpacity
                          key={typeKey}
                          style={[styles.dropdownMenuItem, selected && styles.dropdownMenuItemActive]}
                          onPress={() => {
                            setApplyType(typeKey);
                            setApplyTypeDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.dropdownMenuText, selected && styles.dropdownMenuTextActive]}>
                            {LEAVE_TYPE_LABELS[typeKey]}
                          </Text>
                          {selected && <Feather name="check" size={13} color="#111827" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Approving Authority (Reporting Manager) */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Approving Authority</Text>

                <View style={styles.autoFetchedApproverCard}>
                  <View style={styles.autoFetchedAvatar}>
                    <Feather name="user-check" size={16} color="#111827" />
                  </View>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.autoFetchedApproverName}>
                      {autoApprover.name}
                    </Text>
                    <Text style={styles.autoFetchedApproverRole}>
                      {autoApprover.designation}
                    </Text>
                  </View>
                  <View style={styles.reportingManagerTag}>
                    <Text style={styles.reportingManagerTagText}>{autoApprover.roleBadge}</Text>
                  </View>
                </View>

                <Text style={styles.autoFetchedHelperNote}>
                  {autoApprover.helperText}
                </Text>
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

              {/* Reason */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalLabel}>Reason for Leave *</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  placeholder="State the reason or purpose of leave..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={applyReason}
                  onChangeText={setApplyReason}
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

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.filterModalBackdrop}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.filterModalCard} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.filterModalHeader}>
              <View style={styles.filterModalHeaderLeft}>
                <View style={styles.filterModalIconWrap}>
                  <MaterialCommunityIcons name="tune-variant" size={16} color="#111827" />
                </View>
                <Text style={styles.filterModalTitle}>Filter Leave Requests</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Status Selection */}
            <View style={styles.filterSectionGroup}>
              <Text style={styles.filterSectionLabel}>Application Status</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { key: 'pending' as const, label: 'Pending', count: pendingCount },
                  { key: 'approved' as const, label: 'Approved', count: approvedCount },
                  { key: 'rejected' as const, label: 'Rejected', count: rejectedCount },
                  { key: 'all' as const, label: 'All Statuses', count: requests.length },
                ].map((item) => {
                  const selected = tempStatus === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.filterOptionPill, selected && styles.filterOptionPillActive]}
                      onPress={() => setTempStatus(item.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selected && styles.filterOptionTextActive]}>
                        {item.label}
                      </Text>
                      <View style={[styles.filterOptionCountBadge, selected && styles.filterOptionCountBadgeActive]}>
                        <Text style={[styles.filterOptionCountText, selected && styles.filterOptionCountTextActive]}>
                          {item.count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Approving Authority Selection */}
            <View style={styles.filterSectionGroup}>
              <Text style={styles.filterSectionLabel}>Approving Authority</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { key: 'all' as const, label: 'All Authorities' },
                  { key: 'principal' as const, label: 'Principal' },
                  { key: 'hod' as const, label: 'Head of Dept (HOD)' },
                  { key: 'hr' as const, label: 'HR / Admin Office' },
                ].map((item) => {
                  const selected = tempAuthority === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[styles.filterOptionPill, selected && styles.filterOptionPillActive]}
                      onPress={() => setTempAuthority(item.key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.filterOptionText, selected && styles.filterOptionTextActive]}>
                        {item.label}
                      </Text>
                      {selected && <Feather name="check" size={12} color="#111827" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Department Selection */}
            <View style={styles.filterSectionGroup}>
              <Text style={styles.filterSectionLabel}>Department</Text>
              {isPrincipal ? (
                <View style={styles.filterOptionsGrid}>
                  {['all', ...INSTITUTION_DEPARTMENTS].map((dept) => {
                    const selected = tempDept.toLowerCase() === dept.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={dept}
                        style={[styles.filterOptionPill, selected && styles.filterOptionPillActive]}
                        onPress={() => setTempDept(dept)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.filterOptionText, selected && styles.filterOptionTextActive]}>
                          {dept === 'all' ? 'All Departments' : dept}
                        </Text>
                        {selected && <Feather name="check" size={12} color="#111827" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.filterDeptLockedPill}>
                  <Feather name="lock" size={12} color="#4B5563" />
                  <Text style={styles.filterDeptLockedText}>
                    {effectiveDepartment} (Locked to your reporting jurisdiction)
                  </Text>
                </View>
              )}
            </View>

            {/* Footer Actions */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity style={styles.filterModalResetBtn} onPress={handleResetFilters} activeOpacity={0.7}>
                <Text style={styles.filterModalResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterModalApplyBtn} onPress={handleApplyFilters} activeOpacity={0.8}>
                <Feather name="check" size={14} color="#111827" />
                <Text style={styles.filterModalApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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
  searchFilterDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  inBarFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  inBarFilterBtnActive: {
    backgroundColor: 'transparent',
  },
  inBarFilterText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  inBarFilterTextActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  inBarFilterActiveBadge: {
    backgroundColor: '#F4C430',
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  inBarFilterActiveBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#111827',
  },
  activeFiltersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeTagPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#111827',
  },
  clearAllFiltersBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  clearAllFiltersText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  filterModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  filterModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  filterModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterModalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterModalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEF9C3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterModalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  filterSectionGroup: {
    gap: 8,
  },
  filterSectionLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  filterOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionPillActive: {
    backgroundColor: '#FEF9C3',
    borderColor: '#F4C430',
  },
  filterOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  filterOptionTextActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  filterOptionCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  filterOptionCountBadgeActive: {
    backgroundColor: '#F4C430',
  },
  filterOptionCountText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#374151',
  },
  filterOptionCountTextActive: {
    color: '#111827',
  },
  filterModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  filterModalResetBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
  },
  filterModalResetText: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#4B5563',
  },
  filterModalApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 7,
    backgroundColor: '#F4C430',
  },
  filterModalApplyText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#111827',
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
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  statusPillPending: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  statusPillApproved: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  statusPillRejected: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  statusPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
    letterSpacing: 0.5,
  },
  statusPillTextPending: {
    color: '#D97706',
  },
  statusPillTextApproved: {
    color: '#16A34A',
  },
  statusPillTextRejected: {
    color: '#DC2626',
  },
  cardSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    gap: 6,
  },
  summaryTagsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  leaveTypeTag: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  leaveTypeTagText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  durationText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  authorityIndicatorText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  totalDaysBadge: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  totalDaysBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },
  expandActionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
  },
  expandActionText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#111827',
  },
  expandedDetailsWrap: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  compactBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  compactBalanceText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
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
  authorityText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#111827',
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
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 3,
    paddingHorizontal: 0,
    marginTop: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 8,
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
  dropdownTrigger: {
    height: 38,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownTriggerActive: {
    borderColor: '#111827',
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerText: {
    fontSize: 13,
    color: '#111827',
    fontFamily: FontFamily.regular,
  },
  dropdownMenu: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#F9FAFB',
  },
  dropdownMenuText: {
    fontSize: 12.5,
    color: '#374151',
    fontFamily: FontFamily.regular,
  },
  dropdownMenuTextActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },
  dropdownSubtext: {
    fontSize: 10.5,
    color: '#6B7280',
    fontFamily: FontFamily.regular,
    marginTop: 1,
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

  reportingManagerCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginVertical: 4,
  },
  reportingManagerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportingManagerTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  reportingManagerSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    lineHeight: 15,
  },
  pendingNoticeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    marginTop: 6,
  },
  pendingNoticeText: {
    fontSize: 11.5,
    fontFamily: FontFamily.medium,
    color: '#B45309',
    flex: 1,
  },
  lockedDeptField: {
    height: 38,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedDeptText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  lockedDeptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedDeptBadgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
  },
  modalHierarchyNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    borderRadius: 6,
  },
  modalHierarchyNoteText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#4B5563',
    flex: 1,
    lineHeight: 15,
  },
  filterDeptLockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterDeptLockedText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: '#4B5563',
  },

  autoFetchedApproverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginTop: 2,
  },
  autoFetchedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  autoFetchedApproverName: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  autoFetchedApproverRole: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    marginTop: 1,
  },
  reportingManagerTag: {
    backgroundColor: '#111827',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  reportingManagerTagText: {
    fontSize: 9.5,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  autoFetchedHelperNote: {
    fontSize: 10.5,
    fontFamily: FontFamily.regular,
    color: '#6B7280',
    lineHeight: 15,
    marginTop: 4,
  },
});
