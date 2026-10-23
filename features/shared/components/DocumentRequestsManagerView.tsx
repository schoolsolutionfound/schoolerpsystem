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
import {
  DocumentRequest,
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPE_CONFIG,
} from '../types/documentRequest.types';

interface DocumentRequestsManagerViewProps {
  userRole?: 'principal' | 'hod' | 'admin' | 'student';
  currentStudentId?: string;
  currentStudentName?: string;
  currentStudentUSN?: string;
  userDepartment?: string;
  institutionName?: string;
}

export const QUERY_PRESETS = [
  'Physical signature required on office register / application form',
  'Original fee clearance receipt needed for verification',
  'Previous semester marksheet copies missing / illegible',
  'In-person consultation required with Academic Coordinator / HOD',
  'Recent passport-size photograph submission required',
  'Parent / Guardian consent endorsement letter needed',
];

export const PICKUP_LOCATION_PRESETS = [
  'Administrative Office (Accounts Counter 2)',
  'Administrative Office (Counter 3, Ground Floor)',
  'Examination Cell (Window 1)',
  'Department HOD Office',
  'Academic Registrar Desk (Main Block)',
];

const INITIAL_REQUESTS: DocumentRequest[] = [
  {
    id: 'doc-001',
    requestNumber: 'DOC-2026-0812',
    studentId: 'std-101',
    studentName: 'Aarav Sharma',
    rollNoOrUSN: '1MS21CS001',
    department: 'Computer Science',
    classOrSemester: 'Semester VI',
    documentType: 'marks_card',
    purpose: 'Higher Studies Admission (Master’s Program in AI)',
    urgency: 'urgent',
    copiesCount: 2,
    feeAmount: 300,
    paymentNote: 'Pay ₹300 must be paid while collecting document',
    studentRemarks: 'Need official sealed marks card for university application deadline on Friday.',
    appliedDate: '18-Oct-2026',
    status: 'pending',
    academicDetails: {
      semester: 'Semester V',
      academicYear: '2025 - 2026',
      sgpa: 9.24,
      cgpa: 8.98,
      totalCredits: 21,
      resultStatus: 'First Class with Distinction',
    },
  },
  {
    id: 'doc-002',
    requestNumber: 'DOC-2026-0813',
    studentId: 'std-102',
    studentName: 'Ananya Reddy',
    rollNoOrUSN: '1MS21AI014',
    department: 'AIML',
    classOrSemester: 'Semester VI',
    documentType: 'study_certificate',
    purpose: 'Passport Application & International Hackathon Visa Endorsement',
    urgency: 'normal',
    copiesCount: 1,
    feeAmount: 100,
    paymentNote: 'Pay ₹100 must be paid while collecting document',
    studentRemarks: 'Passport office scheduled appointment for next Tuesday.',
    appliedDate: '17-Oct-2026',
    status: 'processed',
    processedDate: '18-Oct-2026',
    processedBy: 'Administrative Office',
    pickupLocation: 'Administrative Office (Counter 3, Ground Floor)',
    certificateNumber: 'SC-AIML-2026-042',
    reviewRemarks: 'Physical certificate printed with official seal.',
    academicDetails: {
      semester: 'Semester VI',
      academicYear: '2025 - 2026',
      admissionDate: '18-Aug-2022',
      feeStatus: 'paid',
    },
  },
  {
    id: 'doc-003',
    requestNumber: 'DOC-2026-0814',
    studentId: 'std-103',
    studentName: 'Rohan Deshmukh',
    rollNoOrUSN: '1MS21EC045',
    department: 'Electronics & Comm',
    classOrSemester: 'Semester IV',
    documentType: 'hall_ticket',
    purpose: 'End Semester Regular Examinations Duplicate Issuance',
    urgency: 'urgent',
    copiesCount: 1,
    feeAmount: 0,
    paymentNote: 'Free Official Issuance (₹0)',
    studentRemarks: 'Misplaced original hall ticket; exam starts day after tomorrow.',
    appliedDate: '18-Oct-2026',
    status: 'query_raised',
    queryText: 'Physical signature required on the lost hall-ticket affidavit along with recent passport-size photograph.',
    queryDate: '19-Oct-2026',
    queriedBy: 'HOD ECE Desk',
    academicDetails: {
      semester: 'Semester IV',
      academicYear: '2025 - 2026',
      examCenter: 'Campus Main Block, Auditorium Hall B',
    },
  },
  {
    id: 'doc-004',
    requestNumber: 'DOC-2026-0815',
    studentId: 'std-104',
    studentName: 'Pooja Iyer',
    rollNoOrUSN: '1MS20ME032',
    department: 'Mechanical Eng',
    classOrSemester: 'Semester VIII',
    documentType: 'transfer_certificate',
    purpose: 'Degree Course Completed & Relocation for Employment',
    urgency: 'normal',
    copiesCount: 2,
    feeAmount: 500,
    paymentNote: 'Pay ₹500 must be paid while collecting document',
    studentRemarks: 'Completed 8th semester and got placed at Tata Motors Pune.',
    appliedDate: '16-Oct-2026',
    status: 'pending',
    academicDetails: {
      semester: 'Semester VIII',
      academicYear: '2024 - 2025',
      admissionDate: '15-Aug-2020',
      feeStatus: 'paid',
    },
  },
  {
    id: 'doc-005',
    requestNumber: 'DOC-2026-0816',
    studentId: 'std-105',
    studentName: 'Vikram Joshi',
    rollNoOrUSN: '1MS21CV019',
    department: 'Civil Eng',
    classOrSemester: 'Semester V',
    documentType: 'fee_clearance',
    purpose: 'State Post-Matric Scholarship Submission & Loan Subsidy',
    urgency: 'normal',
    copiesCount: 1,
    feeAmount: 0,
    paymentNote: 'Free Official Issuance (₹0)',
    studentRemarks: 'Required by State Scholarship Portal by end of month.',
    appliedDate: '15-Oct-2026',
    status: 'processed',
    processedDate: '16-Oct-2026',
    processedBy: 'Finance & Accounts Officer',
    pickupLocation: 'Administrative Office (Accounts Counter 2)',
    certificateNumber: 'FC-CIVIL-2026-029',
    academicDetails: {
      feeStatus: 'paid',
      academicYear: '2025 - 2026',
    },
  },
  {
    id: 'doc-006',
    requestNumber: 'DOC-2026-0817',
    studentId: 'std-106',
    studentName: 'Kavya Nair',
    rollNoOrUSN: '1MS21CS088',
    department: 'Computer Science',
    classOrSemester: 'Semester V',
    documentType: 'conduct_certificate',
    purpose: 'Off-Campus Internship at Google India Bengaluru',
    urgency: 'urgent',
    copiesCount: 1,
    feeAmount: 100,
    paymentNote: 'Pay ₹100 must be paid while collecting document',
    appliedDate: '18-Oct-2026',
    status: 'query_raised',
    queryText: 'Attendance falls below the minimum required 75% for conduct endorsement. Please consult office.',
    queriedBy: 'Principal Office',
    queryDate: '19-Oct-2026',
  },
];

const PURPOSE_PRESETS = [
  'Higher Studies Admission',
  'Passport / Visa Verification',
  'State / National Scholarship Application',
  'Campus Placement & Corporate Onboarding',
  'Bank Education Loan Subsidy',
  'Concession Pass (Bus / Railway)',
  'Off-Campus Internship Endorsement',
  'Inter-University Transfer',
];

export const DocumentRequestsManagerView: React.FC<DocumentRequestsManagerViewProps> = ({
  userRole = 'principal',
  currentStudentId = 'std-101',
  currentStudentName = 'Aarav Sharma',
  currentStudentUSN = '1MS21CS001',
  userDepartment,
  institutionName = 'APEX INSTITUTE OF SCIENCE & TECHNOLOGY',
}) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 420;

  // Requests state
  const [requests, setRequests] = useState<DocumentRequest[]>(INITIAL_REQUESTS);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DocumentStatus>('all');
  const [docTypeFilter, setDocTypeFilter] = useState<'all' | DocumentType>('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  // Card expansion state
  const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});
  const toggleExpandCard = (id: string) => {
    setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Action Modals
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [queryModalVisible, setQueryModalVisible] = useState(false);
  const [newRequestModalVisible, setNewRequestModalVisible] = useState(false);

  // Form states
  const [pickupLocationInput, setPickupLocationInput] = useState('Administrative Office (Accounts Counter 2)');
  const [pickupDropdownOpen, setPickupDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };
  const [processRemarksInput, setProcessRemarksInput] = useState('');
  const [queryTextInput, setQueryTextInput] = useState('');
  const [selectedQueryPreset, setSelectedQueryPreset] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Student new request form state
  const [newDocType, setNewDocType] = useState<DocumentType>('marks_card');
  const [docDropdownOpen, setDocDropdownOpen] = useState(false);
  const [newPurpose, setNewPurpose] = useState('');
  const [newCopies, setNewCopies] = useState(1);
  const [newUrgency, setNewUrgency] = useState<'normal' | 'urgent'>('normal');
  const [newRemarks, setNewRemarks] = useState('');

  // Department list
  const departmentsList = useMemo(() => {
    return [
      'all',
      'Computer Science',
      'AIML',
      'Electronics & Comm',
      'Mechanical Eng',
      'Civil Eng',
      'Commerce & Mgmt',
      'Applied Sciences',
    ];
  }, []);

  // Filter check
  const isAnyFilterActive =
    statusFilter !== 'all' ||
    docTypeFilter !== 'all' ||
    selectedDeptFilter !== 'all' ||
    searchQuery.trim().length > 0;

  const handleClearAllFilters = () => {
    setStatusFilter('all');
    setDocTypeFilter('all');
    setSelectedDeptFilter('all');
    setSearchQuery('');
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    const list = requests.filter((req) => {
      // Role scope
      if (userRole === 'student') {
        if (req.studentId !== currentStudentId && req.rollNoOrUSN !== currentStudentUSN) {
          // If we have existing mocked data, allow seeing student's own requests
        }
      } else if (userRole === 'hod' && userDepartment) {
        if (req.department.toLowerCase() !== userDepartment.toLowerCase()) {
          return false;
        }
      }

      // Department filter
      if (selectedDeptFilter !== 'all' && req.department !== selectedDeptFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }

      // Document Type filter
      if (docTypeFilter !== 'all' && req.documentType !== docTypeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = req.studentName.toLowerCase().includes(q);
        const matchesUSN = req.rollNoOrUSN.toLowerCase().includes(q);
        const matchesReq = req.requestNumber.toLowerCase().includes(q);
        const matchesPurpose = req.purpose.toLowerCase().includes(q);
        if (!matchesName && !matchesUSN && !matchesReq && !matchesPurpose) {
          return false;
        }
      }

      return true;
    });

    // Priority sorting:
    // 1. Unprocessed / Pending (no queries raised) on TOP
    // 2. Queries Raised (above processed ones)
    // 3. Processed at the bottom
    return [...list].sort((a, b) => {
      const getPriority = (status: DocumentStatus) => {
        if (status === 'pending' || status === 'approved') return 1;
        if (status === 'query_raised') return 2;
        return 3; // processed / generated
      };

      const pA = getPriority(a.status);
      const pB = getPriority(b.status);
      if (pA !== pB) return pA - pB;

      // Within same status, urgent requests come first
      if (a.urgency === 'urgent' && b.urgency !== 'urgent') return -1;
      if (b.urgency === 'urgent' && a.urgency !== 'urgent') return 1;

      return 0;
    });
  }, [
    requests,
    userRole,
    currentStudentId,
    currentStudentUSN,
    userDepartment,
    selectedDeptFilter,
    statusFilter,
    docTypeFilter,
    searchQuery,
  ]);

  // Statistics
  const stats = useMemo(() => {
    const list = userRole === 'hod' && userDepartment
      ? requests.filter((r) => r.department.toLowerCase() === userDepartment.toLowerCase())
      : requests;

    return {
      total: list.length,
      pending: list.filter((r) => r.status === 'pending' || r.status === 'approved').length,
      queryRaised: list.filter((r) => r.status === 'query_raised').length,
      processed: list.filter((r) => r.status === 'processed' || r.status === 'generated').length,
    };
  }, [requests, userRole, userDepartment]);

  // Process Handler
  const handleOpenProcessModal = (req: DocumentRequest) => {
    setSelectedRequest(req);
    setPickupDropdownOpen(false);
    setPickupLocationInput(req.pickupLocation || 'Administrative Office (Accounts Counter 2)');
    setProcessRemarksInput(req.reviewRemarks || '');
    setProcessModalVisible(true);
  };

  const handleConfirmProcess = () => {
    if (!selectedRequest) return;
    const cfg = DOCUMENT_TYPE_CONFIG[selectedRequest.documentType];
    const pickupLoc = pickupLocationInput.trim() || 'Administrative Office (Counter 3, Ground Floor)';
    const updated: DocumentRequest = {
      ...selectedRequest,
      status: 'processed',
      processedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      processedBy: userRole === 'principal' ? 'Principal Office' : userRole === 'hod' ? 'Head of Department' : 'Administrative Office',
      pickupLocation: pickupLoc,
      reviewRemarks: processRemarksInput.trim() || selectedRequest.reviewRemarks,
    };

    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedRequest && selectedRequest.id === updated.id) {
      setSelectedRequest(updated);
    }
    setPickupDropdownOpen(false);
    setProcessModalVisible(false);

    Alert.alert(
      'Document Processed & Student Notified',
      `Notification sent to ${updated.studentName}:\n\n"Your requested document (${cfg.label}) is processed. You can go and collect it from office (${pickupLoc})."`
    );
  };

  // Raise Query Handler
  const handleOpenQueryModal = (req: DocumentRequest) => {
    setSelectedRequest(req);
    setQueryTextInput(req.queryText || '');
    setSelectedQueryPreset('');
    setQueryModalVisible(true);
  };

  const handleConfirmQuery = () => {
    if (!selectedRequest) return;
    if (!queryTextInput.trim()) {
      Alert.alert('Query Details Required', 'Please enter or select consultation requirements for the student.');
      return;
    }
    const cfg = DOCUMENT_TYPE_CONFIG[selectedRequest.documentType];
    const updated: DocumentRequest = {
      ...selectedRequest,
      status: 'query_raised',
      queryText: queryTextInput.trim(),
      queryDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      queriedBy: userRole === 'principal' ? 'Principal Office' : userRole === 'hod' ? 'Head of Department' : 'Administrative Office',
    };

    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selectedRequest && selectedRequest.id === updated.id) {
      setSelectedRequest(updated);
    }
    setQueryModalVisible(false);

    Alert.alert(
      'Query Dispatched & Student Notified',
      `Notification sent to ${updated.studentName}:\n\n"Consultation / Action Required on requested document (${cfg.label}):\n${updated.queryText}\n\nPlease consult the office."`
    );
  };

  const handleSubmitNewRequest = () => {
    if (!newPurpose.trim()) {
      Alert.alert('Reason / Purpose Required', 'Please provide a short description explaining why you need this document.');
      return;
    }

    const selCfg = DOCUMENT_TYPE_CONFIG[newDocType];
    const unitFee = selCfg?.fee ?? 0;
    const totalFee = unitFee * newCopies;
    const paymentNotice =
      totalFee > 0
        ? `Pay ₹${unitFee} × ${newCopies} = ₹${totalFee} must be paid while collecting document`
        : 'Free Official Issuance (₹0)';

    const reqNum = `DOC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newReq: DocumentRequest = {
      id: `doc-${Date.now()}`,
      requestNumber: reqNum,
      studentId: currentStudentId || 'std-101',
      studentName: currentStudentName || 'Aarav Sharma',
      rollNoOrUSN: currentStudentUSN || '1MS21CS001',
      department: userDepartment || 'Computer Science',
      classOrSemester: 'Semester V',
      documentType: newDocType,
      purpose: newPurpose.trim(),
      urgency: newUrgency,
      copiesCount: newCopies,
      feeAmount: totalFee,
      paymentNote: paymentNotice,
      studentRemarks: newRemarks.trim() || undefined,
      appliedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'pending',
    };

    setRequests((prev) => [newReq, ...prev]);
    setDocDropdownOpen(false);
    setNewRequestModalVisible(false);
    setNewPurpose('');
    setNewRemarks('');
    setNewCopies(1);
    setNewUrgency('normal');
    Alert.alert(
      'Application Submitted',
      `Your application ${reqNum} for ${selCfg.label} has been submitted.\n\n${paymentNotice}`
    );
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending' };
      case 'query_raised':
        return { label: 'Query Raised' };
      case 'approved':
        return { label: 'In Process' };
      case 'processed':
      case 'generated':
        return { label: 'Processed · Ready' };
      case 'rejected':
        return { label: 'Rejected' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Document Desk</Text>
        </View>

        {userRole === 'student' && (
          <TouchableOpacity
            style={styles.newRequestBtn}
            activeOpacity={0.8}
            onPress={() => setNewRequestModalVisible(true)}
          >
            <Feather name="plus-circle" size={16} color="#111827" />
            <Text style={styles.newRequestBtnText}>New Request</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Single Yellow Container: Documents Left for Processing & Queries */}
      {userRole !== 'student' && (
        <View style={styles.processingBannerContainer}>
          <View style={styles.processingBanner}>
            <View style={styles.processingBannerCountBadge}>
              <Text style={styles.processingBannerCountText}>{stats.pending}</Text>
            </View>
            <View style={styles.processingBannerTextCol}>
              <Text style={styles.processingBannerTitle}>Documents Left for Processing</Text>
              <Text style={styles.processingBannerSub}>
                Queries Raised: <Text style={styles.processingBannerQueryCount}>{stats.queryRaised}</Text>
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Search & Filter Bar */}
      <View style={styles.controlsBar}>
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={
              userRole === 'student'
                ? 'Search requests by type or purpose...'
                : 'Search by student name, USN, or request ID...'
            }
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            (statusFilter !== 'all' || docTypeFilter !== 'all' || selectedDeptFilter !== 'all') &&
              styles.filterBtnActive,
          ]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Feather
            name="sliders"
            size={16}
            color={
              statusFilter !== 'all' || docTypeFilter !== 'all' || selectedDeptFilter !== 'all'
                ? '#111827'
                : '#4B5563'
            }
          />
          <Text
            style={[
              styles.filterBtnText,
              (statusFilter !== 'all' || docTypeFilter !== 'all' || selectedDeptFilter !== 'all') &&
                styles.filterBtnTextActive,
            ]}
          >
            Filters
            {(statusFilter !== 'all' || docTypeFilter !== 'all' || selectedDeptFilter !== 'all')
              ? ` (${(statusFilter !== 'all' ? 1 : 0) + (docTypeFilter !== 'all' ? 1 : 0) + (selectedDeptFilter !== 'all' ? 1 : 0)})`
              : ''}
          </Text>
        </TouchableOpacity>

        {isAnyFilterActive && (
          <TouchableOpacity
            style={styles.clearFiltersBtn}
            onPress={handleClearAllFilters}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={13} color="#DC2626" />
            <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Requests List */}
      <ScrollView
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
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Document Requests Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || statusFilter !== 'all' || docTypeFilter !== 'all'
                ? 'Try adjusting your search criteria or filter options.'
                : 'No document requests have been submitted yet.'}
            </Text>
            {isAnyFilterActive && (
              <TouchableOpacity style={styles.emptyResetBtn} onPress={handleClearAllFilters}>
                <Feather name="rotate-ccw" size={14} color="#111827" />
                <Text style={styles.emptyResetBtnText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
            {userRole === 'student' && !isAnyFilterActive && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setNewRequestModalVisible(true)}
              >
                <Feather name="plus" size={15} color="#111827" />
                <Text style={styles.emptyActionBtnText}>Create New Document Request</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredRequests.map((req) => {
            const cfg = DOCUMENT_TYPE_CONFIG[req.documentType];
            const badge = getStatusBadge(req.status);
            const isExpanded = !!expandedCardIds[req.id];

            return (
              <View key={req.id} style={styles.requestCard}>
                {/* Main Important Summary - Always Visible & Clickable to Expand/Collapse */}
                <TouchableOpacity
                  style={styles.cardHeaderPressable}
                  activeOpacity={0.7}
                  onPress={() => toggleExpandCard(req.id)}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.docTypeTitle}>{cfg.label}</Text>
                      {userRole !== 'student' ? (
                        <Text style={styles.mainInfoText}>
                          <Text style={styles.mainInfoStudent}>{req.studentName}</Text> · {req.rollNoOrUSN}
                        </Text>
                      ) : (
                        <Text style={styles.mainInfoText}>
                          Ref: {req.requestNumber} · {req.appliedDate}
                        </Text>
                      )}
                    </View>

                    <View style={styles.headerBadgesRight}>
                      {req.urgency === 'urgent' && (
                        <Text style={styles.urgentText}>URGENT</Text>
                      )}
                      <Text style={styles.statusPlainText}>{badge.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Full Data - Displayed Only When Pressed / Expanded */}
                {isExpanded && (
                  <View style={styles.expandedContentBox}>
                    {/* Meta Strip */}
                    <View style={styles.expandedMetaStrip}>
                      <Text style={styles.expandedMetaText}>
                        Ref: <Text style={styles.expandedMetaBold}>{req.requestNumber}</Text> · Applied: <Text style={styles.expandedMetaBold}>{req.appliedDate}</Text>
                      </Text>
                      {req.copiesCount > 1 && (
                        <Text style={styles.expandedMetaBadge}>
                          {req.copiesCount} Copies
                        </Text>
                      )}
                    </View>

                    {/* Department (Staff View) */}
                    {userRole !== 'student' && (
                      <View style={styles.expandedInfoRow}>
                        <Text style={styles.expandedInfoLabel}>Department:</Text>
                        <Text style={styles.expandedInfoVal}>{req.department}</Text>
                      </View>
                    )}

                    {/* Purpose / Reason */}
                    <View style={styles.purposeBox}>
                      <Text style={styles.purposeText}>
                        <Text style={styles.purposeLabel}>Reason: </Text>
                        {req.purpose}
                      </Text>
                      {req.studentRemarks && (
                        <Text style={styles.studentNotesText}>
                          Note: {req.studentRemarks}
                        </Text>
                      )}
                    </View>

                    {/* Collection Fee & Payment Note */}
                    <View style={styles.feeNoticeRow}>
                      <MaterialCommunityIcons
                        name={req.feeAmount && req.feeAmount > 0 ? 'cash-check' : 'check-decagram-outline'}
                        size={14}
                        color={req.feeAmount && req.feeAmount > 0 ? '#B45309' : '#15803D'}
                      />
                      <Text
                        style={[
                          styles.feeNoticeText,
                          (!req.feeAmount || req.feeAmount === 0) && { color: '#15803D' },
                        ]}
                      >
                        {req.paymentNote ||
                          (req.feeAmount && req.feeAmount > 0
                            ? `Pay ₹${req.feeAmount} must be paid while collecting document`
                            : 'Free Official Issuance (₹0)')}
                      </Text>
                    </View>

                    {/* Pickup Location Info */}
                    {(req.status === 'processed' || req.status === 'generated') && req.pickupLocation && (
                      <View style={styles.pickupInfoRow}>
                        <Text style={styles.pickupInfoText}>
                          Pickup Location: <Text style={{ fontFamily: FontFamily.bold }}>{req.pickupLocation}</Text>
                        </Text>
                      </View>
                    )}

                    {/* Query Alert Box */}
                    {req.status === 'query_raised' && req.queryText && (
                      <View style={styles.queryAlertBox}>
                        <Text style={styles.queryAlertBody}>{req.queryText}</Text>
                        {req.queriedBy && (
                          <Text style={styles.queryAlertMeta}>
                            From {req.queriedBy} · {req.queryDate}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Dossier & Actions */}
                    <View style={styles.expandedActionsRow}>
                      <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => {
                          setSelectedRequest(req);
                          setDetailsModalVisible(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.detailsBtnText}>View Full Dossier</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Primary Action Buttons & Expand Toggle */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    onPress={() => toggleExpandCard(req.id)}
                    style={styles.expandToggleTextBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.expandToggleText}>
                      {isExpanded ? 'Less info ▲' : 'More info ▼'}
                    </Text>
                  </TouchableOpacity>

                  {userRole !== 'student' &&
                    (req.status === 'pending' ||
                      req.status === 'query_raised' ||
                      req.status === 'approved') && (
                      <View style={styles.adminActionGroup}>
                        <TouchableOpacity
                          style={styles.raiseQueryBtn}
                          onPress={() => handleOpenQueryModal(req)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.raiseQueryBtnText}>
                            {req.status === 'query_raised' ? 'Update Query' : 'Raise Query'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.processBtn}
                          onPress={() => handleOpenProcessModal(req)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.processBtnText}>Processed</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.filterModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Document Applications</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Document Type Category */}
              <Text style={styles.filterSectionTitle}>DOCUMENT TYPE</Text>
              <View style={styles.filterOptionsGrid}>
                <TouchableOpacity
                  style={[styles.filterOptionChip, docTypeFilter === 'all' && styles.filterOptionChipSelected]}
                  onPress={() => setDocTypeFilter('all')}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      docTypeFilter === 'all' && styles.filterOptionTextSelected,
                    ]}
                  >
                    All Document Types
                  </Text>
                </TouchableOpacity>

                {Object.entries(DOCUMENT_TYPE_CONFIG).map(([typeKey, cfg]) => {
                  const isSel = docTypeFilter === typeKey;
                  return (
                    <TouchableOpacity
                      key={typeKey}
                      style={[styles.filterOptionChip, isSel && styles.filterOptionChipSelected]}
                      onPress={() => setDocTypeFilter(typeKey as DocumentType)}
                    >
                      <Text style={[styles.filterOptionText, isSel && styles.filterOptionTextSelected]}>
                        {cfg.shortLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Department Category (if Principal or Admin) */}
              {userRole !== 'hod' && userRole !== 'student' && (
                <>
                  <Text style={styles.filterSectionTitle}>ACADEMIC DEPARTMENT</Text>
                  <View style={styles.filterOptionsGrid}>
                    {departmentsList.map((dept) => {
                      const isSel = selectedDeptFilter === dept;
                      return (
                        <TouchableOpacity
                          key={dept}
                          style={[styles.filterOptionChip, isSel && styles.filterOptionChipSelected]}
                          onPress={() => setSelectedDeptFilter(dept)}
                        >
                          <Text style={[styles.filterOptionText, isSel && styles.filterOptionTextSelected]}>
                            {dept === 'all' ? 'All Departments' : dept}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Status Category */}
              <Text style={styles.filterSectionTitle}>APPLICATION STATUS</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { key: 'all', label: `All Statuses (${stats.total})` },
                  { key: 'pending', label: `Pending Review (${stats.pending})`, dotColor: '#F59E0B' },
                  { key: 'query_raised', label: `Queries / Consultation (${stats.queryRaised})`, dotColor: '#B45309' },
                  { key: 'processed', label: `Processed (${stats.processed})`, dotColor: '#16A34A' },
                ].map((s) => {
                  const isSel = statusFilter === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.filterOptionChip, isSel && styles.filterOptionChipSelected]}
                      onPress={() => setStatusFilter(s.key as any)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {s.dotColor && (
                          <View
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 3.5,
                              backgroundColor: isSel ? '#F4C430' : s.dotColor,
                            }}
                          />
                        )}
                        <Text style={[styles.filterOptionText, isSel && styles.filterOptionTextSelected]}>
                          {s.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.resetFilterBtn}
                onPress={() => {
                  setStatusFilter('all');
                  setDocTypeFilter('all');
                  setSelectedDeptFilter('all');
                  setSearchQuery('');
                }}
              >
                <Text style={styles.resetFilterBtnText}>Reset All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyFilterBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyFilterBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* STUDENT: NEW DOCUMENT REQUEST MODAL */}
      <Modal
        visible={newRequestModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setDocDropdownOpen(false);
          setNewRequestModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.actionModalCard, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Official Document</Text>
              <TouchableOpacity
                onPress={() => {
                  setDocDropdownOpen(false);
                  setNewRequestModalVisible(false);
                }}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {(() => {
              const selectedDocConfig = DOCUMENT_TYPE_CONFIG[newDocType];
              const unitFee = selectedDocConfig?.fee ?? 0;
              const totalPayableFee = unitFee * newCopies;

              return (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  style={{ marginVertical: 10 }}
                  nestedScrollEnabled
                >
                  {/* Document Type Dropdown Selector */}
                  <View style={styles.formSectionHeaderRow}>
                    <Text style={styles.formLabel}>SELECT DOCUMENT</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.dropdownTrigger, docDropdownOpen && styles.dropdownTriggerActive]}
                    onPress={() => setDocDropdownOpen((prev) => !prev)}
                    activeOpacity={0.8}
                  >
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.dropdownSelectedTitle}>{selectedDocConfig.label}</Text>
                    </View>
                    <View style={styles.dropdownTriggerRight}>
                      <View style={styles.docFeePillSmall}>
                        <Text style={styles.docFeePillText}>
                          {unitFee > 0 ? `₹${unitFee}` : 'Free'}
                        </Text>
                      </View>
                      <Feather
                        name={docDropdownOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#6B7280"
                        style={{ marginLeft: 6 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Dropdown Options List */}
                  {docDropdownOpen && (
                    <View style={styles.dropdownMenuContainer}>
                      {Object.entries(DOCUMENT_TYPE_CONFIG).map(([typeKey, cfg]) => {
                        const isSel = newDocType === typeKey;
                        return (
                          <TouchableOpacity
                            key={typeKey}
                            style={[styles.dropdownOptionItem, isSel && styles.dropdownOptionItemActive]}
                            onPress={() => {
                              setNewDocType(typeKey as DocumentType);
                              setDocDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={{ flex: 1, marginRight: 10 }}>
                              <Text style={[styles.dropdownOptionTitle, isSel && styles.dropdownOptionTitleActive]}>
                                {cfg.label}
                              </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <View style={styles.docFeePillSmall}>
                                <Text style={styles.docFeePillText}>
                                  {cfg.fee > 0 ? `₹${cfg.fee}` : 'Free'}
                                </Text>
                              </View>
                              {isSel && <Feather name="check" size={14} color="#111827" />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Reason / Short description why document is needed */}
                  <View style={{ marginTop: 14 }}>
                    <View style={styles.formSectionHeaderRow}>
                      <Text style={styles.formLabel}>WHY DO YOU NEED THIS DOCUMENT?</Text>
                      <Text style={styles.requiredFieldHint}>(Required)</Text>
                    </View>
                    <TextInput
                      style={[styles.formInput, styles.purposeTextArea]}
                      placeholder="Short description"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={3}
                      value={newPurpose}
                      onChangeText={setNewPurpose}
                    />
                  </View>

                  {/* Copies */}
                  <View style={{ marginVertical: 10 }}>
                    <Text style={styles.formLabel}>NO. OF COPIES</Text>
                    <View style={[styles.counterRow, { width: 140 }]}>
                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => setNewCopies((c) => Math.max(1, c - 1))}
                      >
                        <Feather name="minus" size={14} color="#111827" />
                      </TouchableOpacity>
                      <Text style={styles.counterVal}>{newCopies}</Text>
                      <TouchableOpacity
                        style={styles.counterBtn}
                        onPress={() => setNewCopies((c) => Math.min(5, c + 1))}
                      >
                        <Feather name="plus" size={14} color="#111827" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Clean Collection Payment Notice Banner (Directly below copies) */}
                  <View style={[styles.paymentNoticeCard, { marginTop: 4, marginBottom: 12, alignItems: 'center' }]}>
                    <View style={styles.paymentNoticeIconBox}>
                      <MaterialCommunityIcons
                        name={totalPayableFee > 0 ? 'cash-check' : 'file-check-outline'}
                        size={18}
                        color="#111827"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentNoticeTitle}>
                        {totalPayableFee > 0
                          ? `Pay ₹${unitFee} × ${newCopies} = ₹${totalPayableFee} must be paid while collecting document`
                          : 'Free Official Document (₹0)'}
                      </Text>
                    </View>
                  </View>

                  {/* Remarks */}
                  <View style={{ marginTop: 4 }}>
                    <Text style={styles.formLabel}>ADDITIONAL NOTES (OPTIONAL)</Text>
                    <TextInput
                      style={[styles.formInput, { height: 56, textAlignVertical: 'top' }]}
                      placeholder="Mention any deadlines, embassy requirements, or special details..."
                      placeholderTextColor="#9CA3AF"
                      multiline
                      value={newRemarks}
                      onChangeText={setNewRemarks}
                    />
                  </View>
                </ScrollView>
              );
            })()}

            <View style={styles.actionModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => {
                  setDocDropdownOpen(false);
                  setNewRequestModalVisible(false);
                }}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitModalBtn} onPress={handleSubmitNewRequest}>
                <Feather name="send" size={15} color="#111827" />
                <Text style={styles.submitModalBtnText}>Submit Application</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* PROCESS DOCUMENT MODAL */}
      <Modal
        visible={processModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setProcessModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.actionModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Document as Processed</Text>
              <TouchableOpacity
                onPress={() => {
                  setPickupDropdownOpen(false);
                  setProcessModalVisible(false);
                }}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalReqSummaryBox}>
                <Text style={styles.modalReqSummaryTitle}>
                  {DOCUMENT_TYPE_CONFIG[selectedRequest.documentType].label}
                </Text>
                <Text style={styles.modalReqSummarySub}>
                  Student: {selectedRequest.studentName} · Roll: {selectedRequest.rollNoOrUSN} · Ref: {selectedRequest.requestNumber}
                </Text>
              </View>
            )}

            <View style={{ marginVertical: 12 }}>
              <Text style={styles.formLabel}>COLLECTION COUNTER / PICKUP LOCATION</Text>

              <TouchableOpacity
                style={[styles.dropdownTrigger, pickupDropdownOpen && styles.dropdownTriggerActive]}
                onPress={() => setPickupDropdownOpen((prev) => !prev)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.dropdownSelectedTitle}>
                    {pickupLocationInput || 'Select Pickup Location'}
                  </Text>
                </View>
                <Feather
                  name={pickupDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>

              {pickupDropdownOpen && (
                <View style={styles.dropdownMenuContainer}>
                  {PICKUP_LOCATION_PRESETS.map((loc) => {
                    const isSel = pickupLocationInput === loc;
                    return (
                      <TouchableOpacity
                        key={loc}
                        style={[styles.dropdownOptionItem, isSel && styles.dropdownOptionItemActive]}
                        onPress={() => {
                          setPickupLocationInput(loc);
                          setPickupDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1, marginRight: 10 }}>
                          <Text style={[styles.dropdownOptionTitle, isSel && styles.dropdownOptionTitleActive]}>
                            {loc}
                          </Text>
                        </View>
                        {isSel && <Feather name="check" size={14} color="#111827" />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={{ marginTop: 10 }}>
                <Text style={styles.formLabel}>OFFICE NOTE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.formInput, { height: 56, textAlignVertical: 'top' }]}
                  value={processRemarksInput}
                  onChangeText={setProcessRemarksInput}
                  placeholder="Short note (optional)..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                />
              </View>
            </View>

            <View style={styles.actionModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => {
                  setPickupDropdownOpen(false);
                  setProcessModalVisible(false);
                }}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleConfirmProcess}
              >
                <Feather name="check-circle" size={15} color="#111827" />
                <Text style={styles.submitModalBtnText}>
                  Confirm & Notify Student
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* RAISE QUERY / CONSULTATION MODAL */}
      <Modal
        visible={queryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQueryModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.actionModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Query / Consultation</Text>
              <TouchableOpacity onPress={() => setQueryModalVisible(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <View style={styles.modalReqSummaryBox}>
                <Text style={styles.modalReqSummaryTitle}>
                  {DOCUMENT_TYPE_CONFIG[selectedRequest.documentType].label}
                </Text>
                <Text style={styles.modalReqSummarySub}>
                  Student: {selectedRequest.studentName} · Roll: {selectedRequest.rollNoOrUSN} · Ref: {selectedRequest.requestNumber}
                </Text>
              </View>
            )}

            <View style={{ marginVertical: 12 }}>
              <View style={styles.formSectionHeaderRow}>
                <Text style={styles.formLabel}>DESCRIPTION</Text>
                <Text style={styles.requiredFieldHint}>(Required)</Text>
              </View>
              <TextInput
                style={[styles.formInput, { height: 72, textAlignVertical: 'top' }]}
                value={queryTextInput}
                onChangeText={setQueryTextInput}
                placeholder="Short description"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.actionModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setQueryModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleConfirmQuery}
              >
                <Feather name="send" size={15} color="#111827" />
                <Text style={styles.submitModalBtnText}>
                  Send Query to Student
                </Text>
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
    backgroundColor: '#F9FAFB',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: '#111827',
  },
  headerSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  newRequestBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },

  // Single Yellow Processing Banner
  processingBannerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  processingBanner: {
    backgroundColor: '#F4C430',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  processingBannerCountBadge: {
    backgroundColor: '#111827',
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingBannerCountText: {
    fontFamily: FontFamily.bold,
    fontSize: 20,
    color: '#F4C430',
  },
  processingBannerTextCol: {
    flex: 1,
  },
  processingBannerTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13.5,
    color: '#111827',
  },
  processingBannerSub: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#111827',
    marginTop: 2,
    opacity: 0.85,
  },
  processingBannerQueryCount: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },

  // Controls bar
  controlsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBtnActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  filterBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  filterBtnTextActive: {
    color: '#111827',
    fontFamily: FontFamily.bold,
  },

  // Clear Filters button in controls bar
  clearFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 12,
    borderRadius: 8,
    height: 40,
    gap: 6,
  },
  clearFiltersBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#DC2626',
  },

  // Status Chips ScrollView & Container - explicit minHeight prevents flex collapse
  statusFilterScrollView: {
    flexGrow: 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 52,
  },
  statusChipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    minHeight: 52,
    backgroundColor: '#FFFFFF',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
    height: 36,
  },
  chipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  clearStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    height: 36,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 5,
  },
  clearStatusChipText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#DC2626',
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#374151',
    marginTop: 12,
  },
  emptySub: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginTop: 14,
  },
  emptyResetBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#111827',
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
    marginTop: 16,
  },
  emptyActionBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },

  // Request Card
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  docTypeBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  docIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#111827',
  },
  cardHeaderPressable: {
    width: '100%',
  },
  mainInfoText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  mainInfoStudent: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  chevronBox: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  expandedContentBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandedMetaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  expandedMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  expandedMetaBold: {
    fontFamily: FontFamily.bold,
    color: '#374151',
  },
  expandedMetaBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    color: '#4B5563',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  expandedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  expandedInfoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#6B7280',
  },
  expandedInfoVal: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  expandedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  expandToggleTextBtn: {
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  expandToggleText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#6B7280',
  },
  headerBadgesRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  urgentText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#111827',
    letterSpacing: 0.4,
  },
  statusPlainText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#111827',
  },

  // Student info bar
  studentInfoBar: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginVertical: 6,
    justifyContent: 'space-between',
  },
  studentInfoItem: {
    flex: 1,
  },
  studentInfoLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 8.5,
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  studentInfoVal: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#111827',
    marginTop: 1,
  },

  // Purpose box
  purposeBox: {
    marginVertical: 4,
  },
  purposeLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#4B5563',
  },
  purposeText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#374151',
    lineHeight: 16,
  },
  studentNotesText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },

  // Query Alert Box
  queryAlertBox: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  queryAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  queryAlertTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#B45309',
    letterSpacing: 0.3,
  },
  queryAlertBody: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
  },
  queryAlertMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#D97706',
    marginTop: 4,
  },

  // Pickup Info Row
  pickupInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 4,
    gap: 6,
  },
  pickupInfoText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#15803D',
  },

  // Processed Notice Box
  processedNoticeBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  processedNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  processedNoticeTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#16A34A',
    letterSpacing: 0.3,
  },
  processedNoticeBody: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#15803D',
    lineHeight: 17,
  },

  // Rejection Notice Box
  rejectedNoticeBox: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
  },
  rejectedNoticeTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#DC2626',
    marginBottom: 2,
  },
  rejectedNoticeText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
  },

  // Card Actions
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsBtn: {
    paddingVertical: 6,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  detailsBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  adminActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rejectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  rejectBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#111827',
  },
  raiseQueryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 5,
  },
  raiseQueryBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#111827',
  },
  processBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 5,
  },
  processBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#111827',
  },
  pickupEditBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  pickupEditBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#111827',
  },
  readyStudentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  readyStudentBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#15803D',
  },
  actionRequiredStudentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  actionRequiredStudentBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#B45309',
  },
  pendingReviewText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#D97706',
  },

  // Modal Request Summary
  modalReqSummaryBox: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  modalReqSummaryTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  modalReqSummarySub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  modalSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  filterSectionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#4B5563',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterOptionChipSelected: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterOptionText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#374151',
  },
  filterOptionTextSelected: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  filterModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  resetFilterBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  applyFilterBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  applyFilterBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },

  // Action / Form Modals
  actionModalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  formLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#374151',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  actionModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelModalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelModalBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: '#6B7280',
  },
  submitModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
  },
  submitModalBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },

  // Form Section Header & Badges
  formSectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  adminConfigHint: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  requiredFieldHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  formFieldHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
  },

  // Document Dropdown Selector
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#FFFFFF',
  },
  dropdownTriggerActive: {
    borderColor: '#111827',
    backgroundColor: '#FAFAFA',
  },
  dropdownSelectedTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  dropdownSelectedSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  dropdownTriggerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docFeePillSmall: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  docFeePillText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },

  // Dropdown Menu
  dropdownMenuContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: 6,
    marginBottom: 10,
    padding: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dropdownMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownMenuHeaderText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#6B7280',
    letterSpacing: 0.4,
  },
  dropdownMenuHeaderHint: {
    fontFamily: FontFamily.medium,
    fontSize: 9.5,
    color: '#9CA3AF',
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 1,
  },
  dropdownOptionItemActive: {
    backgroundColor: '#F3F4F6',
  },
  dropdownOptionTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#111827',
  },
  dropdownOptionTitleActive: {
    color: '#111827',
  },
  dropdownOptionDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 1,
  },
  docIconBoxSmall: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Clean Collection Payment Notice Banner
  paymentNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    gap: 10,
  },
  paymentNoticeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentNoticeTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#111827',
    letterSpacing: 0.1,
  },
  paymentNoticeSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#4B5563',
    marginTop: 2,
    lineHeight: 15,
  },

  // Purpose text area
  purposeTextArea: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 8,
    lineHeight: 18,
  },

  // Fee Notice in Expanded Cards
  feeNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  feeNoticeText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#111827',
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
  },
  presetChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  presetChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#4B5563',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  rowFormFields: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 6,
    height: 38,
    justifyContent: 'space-between',
  },
  counterBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  counterVal: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: '#111827',
  },
  urgencyToggleRow: {
    flexDirection: 'row',
    gap: 6,
    height: 38,
  },
  urgencyBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urgencyBtnActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  urgencyBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  urgencyBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },

  // Dossier details
  dossierRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dossierLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  dossierValue: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
    flex: 1.5,
    textAlign: 'right',
  },
});
