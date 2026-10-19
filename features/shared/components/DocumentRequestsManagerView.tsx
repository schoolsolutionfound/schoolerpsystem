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
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { FontFamily } from '../../../constants/fonts';
import {
  DocumentRequest,
  DocumentType,
  DocumentStatus,
  DOCUMENT_TYPE_CONFIG,
} from '../types/documentRequest.types';
import { generateAndShareCertificatePDF } from '../utils/generateInstitutionalCertificatePDF';

interface DocumentRequestsManagerViewProps {
  userRole?: 'principal' | 'hod' | 'admin' | 'student';
  currentStudentId?: string;
  currentStudentName?: string;
  currentStudentUSN?: string;
  userDepartment?: string;
  institutionName?: string;
}

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
    studentRemarks: 'Need official sealed marks card for university application deadline on Friday.',
    appliedDate: '18-Oct-2026',
    status: 'approved',
    reviewedBy: 'Dr. Robert Chen (Principal)',
    reviewDate: '18-Oct-2026',
    reviewRemarks: 'Verified all semester credits and dues clearance. Approved for issuance.',
    certificateNumber: 'MC-CSE-2026-0812',
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
    studentRemarks: 'Passport office scheduled appointment for next Tuesday.',
    appliedDate: '17-Oct-2026',
    status: 'generated',
    reviewedBy: 'Dr. Priya Sundaram (HOD AIML)',
    reviewDate: '17-Oct-2026',
    reviewRemarks: 'Verified bona fide enrollment and attendance compliance.',
    certificateNumber: 'SC-AIML-2026-042',
    generatedDate: '17-Oct-2026',
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
    purpose: 'End Semester Regular Examinations Re-issuance',
    urgency: 'urgent',
    copiesCount: 1,
    studentRemarks: 'Misplaced original hall ticket; exam starts day after tomorrow.',
    appliedDate: '18-Oct-2026',
    status: 'pending',
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
    studentRemarks: 'Completed 8th semester and got placed at Tata Motors Pune.',
    appliedDate: '16-Oct-2026',
    status: 'approved',
    reviewedBy: 'Dr. Robert Chen (Principal)',
    reviewDate: '17-Oct-2026',
    reviewRemarks: 'All 8 semesters cleared and library dues settled.',
    certificateNumber: 'TC-MECH-2026-091',
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
    studentRemarks: 'Required by State Scholarship Portal by end of month.',
    appliedDate: '15-Oct-2026',
    status: 'generated',
    reviewedBy: 'Finance & Accounts Officer',
    reviewDate: '16-Oct-2026',
    certificateNumber: 'FC-CIVIL-2026-029',
    generatedDate: '16-Oct-2026',
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
    appliedDate: '18-Oct-2026',
    status: 'pending',
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

  // Action Modals
  const [selectedRequest, setSelectedRequest] = useState<DocumentRequest | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [newRequestModalVisible, setNewRequestModalVisible] = useState(false);

  // Form states
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [certNumberInput, setCertNumberInput] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Student new request form state
  const [newDocType, setNewDocType] = useState<DocumentType>('marks_card');
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

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Role scope
      if (userRole === 'student') {
        if (req.studentId !== currentStudentId && req.rollNoOrUSN !== currentStudentUSN) {
          // If we have existing mocked data, allow seeing student's own requests
          // or top 3 for showcase
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
      pending: list.filter((r) => r.status === 'pending').length,
      approved: list.filter((r) => r.status === 'approved').length,
      generated: list.filter((r) => r.status === 'generated').length,
    };
  }, [requests, userRole, userDepartment]);

  // Handlers
  const handleOpenApproveModal = (req: DocumentRequest) => {
    setSelectedRequest(req);
    const cfg = DOCUMENT_TYPE_CONFIG[req.documentType];
    setCertNumberInput(
      req.certificateNumber ||
        `${cfg.prefix}-${req.department.slice(0, 3).toUpperCase()}-2026-${req.requestNumber.replace('DOC-2026-', '')}`
    );
    setReviewRemarks(req.reviewRemarks || 'Verified institutional records and cleared for issuance.');
    setApproveModalVisible(true);
  };

  const handleConfirmApproval = () => {
    if (!selectedRequest) return;
    const updated: DocumentRequest = {
      ...selectedRequest,
      status: 'approved',
      certificateNumber: certNumberInput.trim() || selectedRequest.certificateNumber,
      reviewRemarks: reviewRemarks.trim(),
      reviewedBy: userRole === 'principal' ? 'Principal Office' : 'Head of Department',
      reviewDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setApproveModalVisible(false);
    setSelectedRequest(null);
    Alert.alert('Request Approved', `Application ${updated.requestNumber} has been approved.`);
  };

  const handleOpenRejectModal = (req: DocumentRequest) => {
    setSelectedRequest(req);
    setReviewRemarks('');
    setRejectModalVisible(true);
  };

  const handleConfirmRejection = () => {
    if (!selectedRequest) return;
    if (!reviewRemarks.trim()) {
      Alert.alert('Reason Required', 'Please enter a clear reason for rejecting the request.');
      return;
    }

    const updated: DocumentRequest = {
      ...selectedRequest,
      status: 'rejected',
      reviewRemarks: reviewRemarks.trim(),
      reviewedBy: userRole === 'principal' ? 'Principal Office' : 'Head of Department',
      reviewDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setRejectModalVisible(false);
    setSelectedRequest(null);
    Alert.alert('Request Rejected', `Application ${updated.requestNumber} marked as rejected.`);
  };

  const handleGenerateDocument = async (req: DocumentRequest) => {
    try {
      setIsGeneratingPdf(true);
      const generatedDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      const updated: DocumentRequest = {
        ...req,
        status: 'generated',
        generatedDate,
        certificateNumber:
          req.certificateNumber ||
          `${DOCUMENT_TYPE_CONFIG[req.documentType].prefix}-2026-${req.requestNumber.replace('DOC-2026-', '')}`,
      };

      setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      if (selectedRequest && selectedRequest.id === updated.id) {
        setSelectedRequest(updated);
      }

      await generateAndShareCertificatePDF(updated, institutionName);
    } catch (err: any) {
      Alert.alert('Generation Failed', err?.message || 'Unable to generate document certificate.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSubmitNewRequest = () => {
    if (!newPurpose.trim()) {
      Alert.alert('Purpose Required', 'Please select or enter the purpose for this document request.');
      return;
    }

    const reqNum = `DOC-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newReq: DocumentRequest = {
      id: `doc-${Date.now()}`,
      requestNumber: reqNum,
      studentId: currentStudentId,
      studentName: currentStudentName,
      rollNoOrUSN: currentStudentUSN,
      department: userDepartment || 'Computer Science',
      classOrSemester: 'Semester V',
      documentType: newDocType,
      purpose: newPurpose.trim(),
      urgency: newUrgency,
      copiesCount: newCopies,
      studentRemarks: newRemarks.trim() || undefined,
      appliedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'pending',
    };

    setRequests((prev) => [newReq, ...prev]);
    setNewRequestModalVisible(false);
    setNewPurpose('');
    setNewRemarks('');
    setNewCopies(1);
    setNewUrgency('normal');
    Alert.alert('Request Submitted', `Your application ${reqNum} has been submitted for institutional verification.`);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'pending':
        return { label: 'PENDING APPROVAL', bg: '#FEF3C7', color: '#B45309', icon: 'clock-outline' };
      case 'approved':
        return { label: 'APPROVED / IN PROCESS', bg: '#EFF6FF', color: '#1D4ED8', icon: 'check-circle-outline' };
      case 'generated':
        return { label: 'DOCUMENT READY', bg: '#DCFCE7', color: '#15803D', icon: 'file-check-outline' };
      case 'rejected':
        return { label: 'REJECTED / ON HOLD', bg: '#FEE2E2', color: '#B91C1C', icon: 'close-circle-outline' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Document Requests & Issuance</Text>
          <Text style={styles.headerSub}>
            {userRole === 'student'
              ? 'Request & download marks cards, hall tickets, study certificates & TCs'
              : 'Review student document applications, approve, and generate certified credentials'}
          </Text>
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

      {/* KPI Stats Strip (for Principal/HOD/Admin) */}
      {userRole !== 'student' && (
        <View style={styles.statsStrip}>
          <View style={[styles.statCard, { borderLeftColor: '#4F46E5' }]}>
            <Text style={styles.statLabel}>TOTAL APPLICATIONS</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#F59E0B' }]}>
            <Text style={styles.statLabel}>PENDING VERIFICATION</Text>
            <Text style={[styles.statValue, { color: '#B45309' }]}>{stats.pending}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
            <Text style={styles.statLabel}>APPROVED IN PROCESS</Text>
            <Text style={[styles.statValue, { color: '#1D4ED8' }]}>{stats.approved}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#16A34A' }]}>
            <Text style={styles.statLabel}>GENERATED & ISSUED</Text>
            <Text style={[styles.statValue, { color: '#15803D' }]}>{stats.generated}</Text>
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
          style={[styles.filterBtn, (statusFilter !== 'all' || docTypeFilter !== 'all') && styles.filterBtnActive]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Feather
            name="sliders"
            size={16}
            color={statusFilter !== 'all' || docTypeFilter !== 'all' ? '#111827' : '#4B5563'}
          />
          <Text
            style={[
              styles.filterBtnText,
              (statusFilter !== 'all' || docTypeFilter !== 'all') && styles.filterBtnTextActive,
            ]}
          >
            Filters
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusChipsContainer}
      >
        <TouchableOpacity
          style={[styles.chip, statusFilter === 'all' && styles.chipActive]}
          onPress={() => setStatusFilter('all')}
        >
          <Text style={[styles.chipText, statusFilter === 'all' && styles.chipTextActive]}>All Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, statusFilter === 'pending' && styles.chipActive]}
          onPress={() => setStatusFilter('pending')}
        >
          <View style={[styles.dot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.chipText, statusFilter === 'pending' && styles.chipTextActive]}>
            Pending ({stats.pending})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, statusFilter === 'approved' && styles.chipActive]}
          onPress={() => setStatusFilter('approved')}
        >
          <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
          <Text style={[styles.chipText, statusFilter === 'approved' && styles.chipTextActive]}>
            Approved ({stats.approved})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, statusFilter === 'generated' && styles.chipActive]}
          onPress={() => setStatusFilter('generated')}
        >
          <View style={[styles.dot, { backgroundColor: '#16A34A' }]} />
          <Text style={[styles.chipText, statusFilter === 'generated' && styles.chipTextActive]}>
            Ready / Generated ({stats.generated})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, statusFilter === 'rejected' && styles.chipActive]}
          onPress={() => setStatusFilter('rejected')}
        >
          <View style={[styles.dot, { backgroundColor: '#DC2626' }]} />
          <Text style={[styles.chipText, statusFilter === 'rejected' && styles.chipTextActive]}>Rejected</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Requests List */}
      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Document Requests Found</Text>
            <Text style={styles.emptySub}>
              {searchQuery || statusFilter !== 'all' || docTypeFilter !== 'all'
                ? 'Try adjusting your search criteria or filter options.'
                : 'No document requests have been submitted yet.'}
            </Text>
            {userRole === 'student' && (
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

            return (
              <View key={req.id} style={styles.requestCard}>
                {/* Card Top Row */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.docTypeBadgeWrap}>
                    <View style={[styles.docIconBox, { backgroundColor: cfg.badgeBg }]}>
                      <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
                    </View>
                    <View>
                      <Text style={styles.docTypeTitle}>{cfg.label}</Text>
                      <Text style={styles.requestNumberText}>
                        Ref: {req.requestNumber} • Applied: {req.appliedDate}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.headerBadgesRight}>
                    {req.urgency === 'urgent' && (
                      <View style={styles.urgentBadge}>
                        <Feather name="zap" size={11} color="#B91C1C" />
                        <Text style={styles.urgentBadgeText}>URGENT</Text>
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <MaterialCommunityIcons name={badge.icon as any} size={12} color={badge.color} />
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>
                </View>

                {/* Student Info Bar (Principal/HOD/Admin) */}
                <View style={styles.studentInfoBar}>
                  <View style={styles.studentInfoItem}>
                    <Text style={styles.studentInfoLabel}>STUDENT</Text>
                    <Text style={styles.studentInfoVal}>{req.studentName}</Text>
                  </View>
                  <View style={styles.studentInfoItem}>
                    <Text style={styles.studentInfoLabel}>ROLL / USN</Text>
                    <Text style={[styles.studentInfoVal, { fontFamily: FontFamily.semibold }]}>
                      {req.rollNoOrUSN}
                    </Text>
                  </View>
                  <View style={styles.studentInfoItem}>
                    <Text style={styles.studentInfoLabel}>DEPARTMENT</Text>
                    <Text style={styles.studentInfoVal}>{req.department}</Text>
                  </View>
                  <View style={styles.studentInfoItem}>
                    <Text style={styles.studentInfoLabel}>COPIES</Text>
                    <Text style={styles.studentInfoVal}>{req.copiesCount} Copy</Text>
                  </View>
                </View>

                {/* Purpose and Remarks */}
                <View style={styles.purposeBox}>
                  <Text style={styles.purposeLabel}>PURPOSE / REASON</Text>
                  <Text style={styles.purposeText}>{req.purpose}</Text>
                  {req.studentRemarks && (
                    <Text style={styles.studentNotesText}>
                      <Text style={{ fontWeight: '700' }}>Note: </Text>
                      {req.studentRemarks}
                    </Text>
                  )}
                </View>

                {/* Certificate Number & Reviewer remark (if available) */}
                {(req.certificateNumber || req.reviewRemarks) && (
                  <View style={styles.reviewBanner}>
                    {req.certificateNumber && (
                      <View style={styles.certNumRow}>
                        <Feather name="award" size={13} color="#2563EB" />
                        <Text style={styles.certNumText}>
                          Cert No: <Text style={{ fontWeight: '700' }}>{req.certificateNumber}</Text>
                        </Text>
                      </View>
                    )}
                    {req.reviewRemarks && (
                      <Text style={styles.reviewRemarksText}>
                        <Text style={{ fontWeight: '700' }}>Remark ({req.reviewedBy}): </Text>
                        {req.reviewRemarks}
                      </Text>
                    )}
                  </View>
                )}

                {/* Card Action Buttons */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.detailsBtn}
                    onPress={() => {
                      setSelectedRequest(req);
                      setDetailsModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Feather name="eye" size={13} color="#4B5563" />
                    <Text style={styles.detailsBtnText}>View Details</Text>
                  </TouchableOpacity>

                  {/* Actions for Principal/HOD/Admin */}
                  {userRole !== 'student' && (
                    <View style={styles.adminActionGroup}>
                      {req.status === 'pending' && (
                        <>
                          <TouchableOpacity
                            style={styles.rejectBtn}
                            onPress={() => handleOpenRejectModal(req)}
                            activeOpacity={0.7}
                          >
                            <Feather name="x" size={13} color="#DC2626" />
                            <Text style={styles.rejectBtnText}>Reject</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.approveBtn}
                            onPress={() => handleOpenApproveModal(req)}
                            activeOpacity={0.8}
                          >
                            <Feather name="check" size={13} color="#FFFFFF" />
                            <Text style={styles.approveBtnText}>Accept / Approve</Text>
                          </TouchableOpacity>
                        </>
                      )}

                      {(req.status === 'approved' || req.status === 'generated') && (
                        <TouchableOpacity
                          style={styles.generateBtn}
                          onPress={() => handleGenerateDocument(req)}
                          activeOpacity={0.8}
                          disabled={isGeneratingPdf}
                        >
                          {isGeneratingPdf && selectedRequest?.id === req.id ? (
                            <ActivityIndicator size="small" color="#111827" />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="file-pdf-box" size={16} color="#111827" />
                              <Text style={styles.generateBtnText}>
                                {req.status === 'generated' ? 'Print / Share PDF' : 'Generate Document'}
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Actions for Student */}
                  {userRole === 'student' && (
                    <View style={styles.adminActionGroup}>
                      {req.status === 'generated' ? (
                        <TouchableOpacity
                          style={styles.downloadStudentBtn}
                          onPress={() => handleGenerateDocument(req)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="download" size={16} color="#111827" />
                          <Text style={styles.downloadStudentBtnText}>Download Certificate</Text>
                        </TouchableOpacity>
                      ) : req.status === 'approved' ? (
                        <View style={styles.inProcessingPill}>
                          <Feather name="refresh-cw" size={12} color="#2563EB" />
                          <Text style={styles.inProcessingText}>Approved • Generating Seal</Text>
                        </View>
                      ) : req.status === 'pending' ? (
                        <View style={styles.pendingReviewPill}>
                          <Feather name="clock" size={12} color="#D97706" />
                          <Text style={styles.pendingReviewText}>In Office Verification</Text>
                        </View>
                      ) : null}
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
                  { key: 'all', label: 'All Statuses' },
                  { key: 'pending', label: 'Pending Approval' },
                  { key: 'approved', label: 'Approved In Process' },
                  { key: 'generated', label: 'Document Ready' },
                  { key: 'rejected', label: 'Rejected' },
                ].map((s) => {
                  const isSel = statusFilter === s.key;
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.filterOptionChip, isSel && styles.filterOptionChipSelected]}
                      onPress={() => setStatusFilter(s.key as any)}
                    >
                      <Text style={[styles.filterOptionText, isSel && styles.filterOptionTextSelected]}>
                        {s.label}
                      </Text>
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
        onRequestClose={() => setNewRequestModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={[styles.actionModalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Official Document</Text>
                <Text style={styles.modalSubtitle}>
                  Select document type, specify purpose, and submit for verification
                </Text>
              </View>
              <TouchableOpacity onPress={() => setNewRequestModalVisible(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
              {/* Document Type Selector */}
              <Text style={styles.formLabel}>SELECT DOCUMENT TYPE</Text>
              <View style={styles.docTypeSelectGrid}>
                {Object.entries(DOCUMENT_TYPE_CONFIG).map(([typeKey, cfg]) => {
                  const isSel = newDocType === typeKey;
                  return (
                    <TouchableOpacity
                      key={typeKey}
                      style={[styles.docTypeSelectItem, isSel && styles.docTypeSelectItemActive]}
                      onPress={() => setNewDocType(typeKey as DocumentType)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.docIconBoxSmall, { backgroundColor: cfg.badgeBg }]}>
                        <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.docTypeSelectName, isSel && styles.docTypeSelectNameActive]}>
                          {cfg.label}
                        </Text>
                        <Text style={styles.docTypeSelectDesc} numberOfLines={2}>
                          {cfg.description}
                        </Text>
                      </View>
                      {isSel && <Feather name="check-circle" size={16} color="#16A34A" />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Purpose with quick chips */}
              <Text style={styles.formLabel}>PURPOSE / ENDORSEMENT NEEDED</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Higher Studies, Passport Office, Education Loan..."
                placeholderTextColor="#9CA3AF"
                value={newPurpose}
                onChangeText={setNewPurpose}
              />

              <Text style={[styles.formLabel, { marginTop: 8, fontSize: 11, color: '#6B7280' }]}>
                QUICK PURPOSE PRESETS:
              </Text>
              <View style={styles.presetChipsWrap}>
                {PURPOSE_PRESETS.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.presetChip, newPurpose === p && styles.presetChipActive]}
                    onPress={() => setNewPurpose(p)}
                  >
                    <Text style={[styles.presetChipText, newPurpose === p && styles.presetChipTextActive]}>
                      {p}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Copies & Urgency */}
              <View style={styles.rowFormFields}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>NO. OF COPIES</Text>
                  <View style={styles.counterRow}>
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

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>PROCESSING PRIORITY</Text>
                  <View style={styles.urgencyToggleRow}>
                    <TouchableOpacity
                      style={[styles.urgencyBtn, newUrgency === 'normal' && styles.urgencyBtnActive]}
                      onPress={() => setNewUrgency('normal')}
                    >
                      <Text style={[styles.urgencyBtnText, newUrgency === 'normal' && styles.urgencyBtnTextActive]}>
                        Normal
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.urgencyBtn,
                        newUrgency === 'urgent' && [styles.urgencyBtnActive, { borderColor: '#DC2626' }],
                      ]}
                      onPress={() => setNewUrgency('urgent')}
                    >
                      <Text
                        style={[
                          styles.urgencyBtnText,
                          newUrgency === 'urgent' && { color: '#DC2626', fontWeight: '800' },
                        ]}
                      >
                        ⚡ Urgent
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Remarks */}
              <Text style={styles.formLabel}>ADDITIONAL NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.formInput, { height: 60, textAlignVertical: 'top' }]}
                placeholder="Mention any deadlines, embassy requirements, or special details..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={newRemarks}
                onChangeText={setNewRemarks}
              />
            </ScrollView>

            <View style={styles.actionModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setNewRequestModalVisible(false)}
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

      {/* APPROVE / ACCEPT MODAL */}
      <Modal
        visible={approveModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setApproveModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.actionModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Accept & Approve Request</Text>
                <Text style={styles.modalSubtitle}>
                  Authorize issuance for {selectedRequest?.studentName} ({selectedRequest?.rollNoOrUSN})
                </Text>
              </View>
              <TouchableOpacity onPress={() => setApproveModalVisible(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 14 }}>
              <Text style={styles.formLabel}>CERTIFICATE / REFERENCE NUMBER</Text>
              <TextInput
                style={styles.formInput}
                value={certNumberInput}
                onChangeText={setCertNumberInput}
                placeholder="e.g. TC-CSE-2026-0812"
              />

              <Text style={[styles.formLabel, { marginTop: 12 }]}>APPROVAL / VERIFICATION REMARKS</Text>
              <TextInput
                style={[styles.formInput, { height: 75, textAlignVertical: 'top' }]}
                value={reviewRemarks}
                onChangeText={setReviewRemarks}
                placeholder="Enter office verification remarks..."
                multiline
              />
            </View>

            <View style={styles.actionModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setApproveModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitModalBtn, { backgroundColor: '#16A34A' }]}
                onPress={handleConfirmApproval}
              >
                <Feather name="check" size={15} color="#FFFFFF" />
                <Text style={[styles.submitModalBtnText, { color: '#FFFFFF' }]}>Confirm Approval</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* REJECT MODAL */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <View style={styles.actionModalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: '#DC2626' }]}>Reject Document Request</Text>
                <Text style={styles.modalSubtitle}>
                  Specify the reason for rejecting {selectedRequest?.requestNumber}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ marginVertical: 14 }}>
              <Text style={styles.formLabel}>REJECTION REASON (COMMUNICATED TO STUDENT)</Text>
              <TextInput
                style={[styles.formInput, { height: 85, textAlignVertical: 'top', borderColor: '#FCA5A5' }]}
                value={reviewRemarks}
                onChangeText={setReviewRemarks}
                placeholder="e.g. Pending fee dues in finance office, incomplete semester exam records..."
                multiline
              />
            </View>

            <View style={styles.actionModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitModalBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleConfirmRejection}
              >
                <Feather name="x-circle" size={15} color="#FFFFFF" />
                <Text style={[styles.submitModalBtnText, { color: '#FFFFFF' }]}>Reject Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* DETAILS DOSSIER MODAL */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.actionModalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Application Dossier</Text>
                <Text style={styles.modalSubtitle}>Reference: {selectedRequest?.requestNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Document Type</Text>
                  <Text style={styles.dossierValue}>
                    {DOCUMENT_TYPE_CONFIG[selectedRequest.documentType].label}
                  </Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Student Name</Text>
                  <Text style={[styles.dossierValue, { color: '#1E3A8A' }]}>
                    {selectedRequest.studentName}
                  </Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Roll No / USN</Text>
                  <Text style={[styles.dossierValue, { fontFamily: FontFamily.semibold }]}>
                    {selectedRequest.rollNoOrUSN}
                  </Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Department & Class</Text>
                  <Text style={styles.dossierValue}>
                    {selectedRequest.department} ({selectedRequest.classOrSemester})
                  </Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Purpose</Text>
                  <Text style={styles.dossierValue}>{selectedRequest.purpose}</Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Date Applied</Text>
                  <Text style={styles.dossierValue}>{selectedRequest.appliedDate}</Text>
                </View>
                <View style={styles.dossierRow}>
                  <Text style={styles.dossierLabel}>Current Status</Text>
                  <Text style={[styles.dossierValue, { fontWeight: '800' }]}>
                    {getStatusBadge(selectedRequest.status).label}
                  </Text>
                </View>
                {selectedRequest.certificateNumber && (
                  <View style={styles.dossierRow}>
                    <Text style={styles.dossierLabel}>Certificate Number</Text>
                    <Text style={[styles.dossierValue, { color: '#16A34A', fontWeight: '800' }]}>
                      {selectedRequest.certificateNumber}
                    </Text>
                  </View>
                )}
                {selectedRequest.reviewRemarks && (
                  <View style={styles.dossierRow}>
                    <Text style={styles.dossierLabel}>Reviewer Remarks</Text>
                    <Text style={styles.dossierValue}>
                      {selectedRequest.reviewRemarks} ({selectedRequest.reviewedBy || 'Office'})
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}

            <View style={styles.actionModalFooter}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Close</Text>
              </TouchableOpacity>

              {selectedRequest &&
                (selectedRequest.status === 'approved' || selectedRequest.status === 'generated') && (
                  <TouchableOpacity
                    style={[styles.submitModalBtn, { backgroundColor: '#F4C430' }]}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      handleGenerateDocument(selectedRequest);
                    }}
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={16} color="#111827" />
                    <Text style={styles.submitModalBtnText}>Generate / Share PDF</Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        </View>
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

  // Stats Strip
  statsStrip: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  statLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 8.5,
    color: '#6B7280',
    letterSpacing: 0.3,
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
    marginTop: 2,
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

  // Status Chips
  statusChipsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#111827',
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: '#4B5563',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontFamily: FontFamily.bold,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
  requestNumberText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  headerBadgesRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  urgentBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 9,
    color: '#B91C1C',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
  },

  // Student info bar
  studentInfoBar: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginVertical: 8,
    justifyContent: 'space-between',
  },
  studentInfoItem: {
    flex: 1,
  },
  studentInfoLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 8.5,
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
  studentInfoVal: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#1F2937',
    marginTop: 1,
  },

  // Purpose box
  purposeBox: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    padding: 8,
    borderRadius: 4,
    marginVertical: 6,
  },
  purposeLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 8.5,
    color: '#3B82F6',
    letterSpacing: 0.3,
  },
  purposeText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#1F2937',
    marginTop: 2,
  },
  studentNotesText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#4B5563',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Review banner
  reviewBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 6,
    padding: 8,
    marginVertical: 6,
  },
  certNumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  certNumText: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    color: '#166534',
  },
  reviewRemarksText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#166534',
    marginTop: 2,
  },

  // Card Actions
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    gap: 5,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    gap: 4,
  },
  rejectBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#DC2626',
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#16A34A',
    gap: 4,
  },
  approveBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F4C430',
    gap: 5,
  },
  generateBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  downloadStudentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F4C430',
    gap: 5,
  },
  downloadStudentBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#111827',
  },
  inProcessingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  inProcessingText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#1D4ED8',
  },
  pendingReviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 5,
  },
  pendingReviewText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: '#B45309',
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

  // Student New Request Grid
  docTypeSelectGrid: {
    gap: 6,
    marginBottom: 12,
  },
  docTypeSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#F9FAFB',
    gap: 10,
  },
  docTypeSelectItemActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  docIconBoxSmall: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docTypeSelectName: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
    color: '#1F2937',
  },
  docTypeSelectNameActive: {
    color: '#15803D',
  },
  docTypeSelectDesc: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#6B7280',
    marginTop: 1,
  },
  presetChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
  },
  presetChipActive: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  presetChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#4B5563',
  },
  presetChipTextActive: {
    color: '#111827',
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
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  urgencyBtnActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#111827',
    borderWidth: 1.5,
  },
  urgencyBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#4B5563',
  },
  urgencyBtnTextActive: {
    fontFamily: FontFamily.bold,
    color: '#111827',
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
