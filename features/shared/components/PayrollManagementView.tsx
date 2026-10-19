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

export type PayrollStatus = 'disbursed' | 'pending' | 'on_hold';

export interface SalaryBreakdown {
  basic: number;
  hra: number;
  da: number;
  specialAllowance: number;
  grossSalary: number;
  pfDeduction: number;
  professionalTax: number;
  tds: number;
  lopDeduction: number;
  totalDeductions: number;
  netSalary: number;
}

export interface FacultyPayrollRecord {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  month: string; // e.g. "October 2026"
  salary: SalaryBreakdown;
  bankDetails: {
    bankName: string;
    accountNumberMasked: string;
    ifsc: string;
    pan: string;
  };
  status: PayrollStatus;
  disbursedDate?: string;
  transactionRef?: string;
  paymentMode?: 'NEFT' | 'RTGS' | 'IMPS' | 'Cheque';
  holdReason?: string;
  daysPresent: number;
  unpaidLeaves: number;
}

export interface PayrollManagementViewProps {
  userRole?: 'principal' | 'admin' | 'accountant' | 'hod' | 'teacher';
  userDepartment?: string;
  currentUserName?: string;
  institutionName?: string;
}

const INSTITUTION_DEPARTMENTS = [
  'Computer Science',
  'AIML',
  'Electronics & Comm',
  'Mechanical Eng',
  'Civil Eng',
  'Commerce & Mgmt',
  'Applied Sciences',
];

const PAYROLL_MONTHS = ['October 2026', 'September 2026', 'August 2026'];

const INITIAL_PAYROLL_RECORDS: FacultyPayrollRecord[] = [
  {
    id: 'pr-101',
    employeeCode: 'FAC-CSE-012',
    name: 'Dr. Rajesh Iyer',
    designation: 'Associate Professor',
    department: 'Computer Science',
    month: 'October 2026',
    salary: {
      basic: 65000,
      hra: 18000,
      da: 12000,
      specialAllowance: 8000,
      grossSalary: 103000,
      pfDeduction: 7800,
      professionalTax: 200,
      tds: 5500,
      lopDeduction: 0,
      totalDeductions: 13500,
      netSalary: 89500,
    },
    bankDetails: {
      bankName: 'HDFC Bank',
      accountNumberMasked: '•••• 4821',
      ifsc: 'HDFC0001245',
      pan: 'ABCPI1234K',
    },
    status: 'disbursed',
    disbursedDate: '2026-10-02',
    transactionRef: 'NEFT-CMS-984021029',
    paymentMode: 'NEFT',
    daysPresent: 26,
    unpaidLeaves: 0,
  },
  {
    id: 'pr-102',
    employeeCode: 'FAC-CSE-015',
    name: 'Prof. Sneha Patil',
    designation: 'Assistant Professor',
    department: 'Computer Science',
    month: 'October 2026',
    salary: {
      basic: 48000,
      hra: 14000,
      da: 9000,
      specialAllowance: 5000,
      grossSalary: 76000,
      pfDeduction: 5760,
      professionalTax: 200,
      tds: 2500,
      lopDeduction: 0,
      totalDeductions: 8460,
      netSalary: 67540,
    },
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumberMasked: '•••• 9104',
      ifsc: 'SBIN0004921',
      pan: 'DEFSP5678M',
    },
    status: 'disbursed',
    disbursedDate: '2026-10-02',
    transactionRef: 'NEFT-CMS-984021033',
    paymentMode: 'NEFT',
    daysPresent: 26,
    unpaidLeaves: 0,
  },
  {
    id: 'pr-103',
    employeeCode: 'FAC-AIM-004',
    name: 'Dr. Sneha Deshmukh',
    designation: 'Professor',
    department: 'AIML',
    month: 'October 2026',
    salary: {
      basic: 85000,
      hra: 24000,
      da: 16000,
      specialAllowance: 12000,
      grossSalary: 137000,
      pfDeduction: 10200,
      professionalTax: 200,
      tds: 11000,
      lopDeduction: 0,
      totalDeductions: 21400,
      netSalary: 115600,
    },
    bankDetails: {
      bankName: 'ICICI Bank',
      accountNumberMasked: '•••• 3098',
      ifsc: 'ICIC0000812',
      pan: 'GHIJK9012N',
    },
    status: 'pending',
    daysPresent: 25,
    unpaidLeaves: 0,
  },
  {
    id: 'pr-104',
    employeeCode: 'FAC-ECE-019',
    name: 'Prof. Ananya Sharma',
    designation: 'Assistant Professor',
    department: 'Electronics & Comm',
    month: 'October 2026',
    salary: {
      basic: 48000,
      hra: 14000,
      da: 9000,
      specialAllowance: 5000,
      grossSalary: 76000,
      pfDeduction: 5760,
      professionalTax: 200,
      tds: 2500,
      lopDeduction: 3000, // 1 day unpaid leave
      totalDeductions: 11460,
      netSalary: 64540,
    },
    bankDetails: {
      bankName: 'Axis Bank',
      accountNumberMasked: '•••• 7712',
      ifsc: 'UTIB0001024',
      pan: 'LMNOP3456P',
    },
    status: 'pending',
    daysPresent: 24,
    unpaidLeaves: 1,
  },
  {
    id: 'pr-105',
    employeeCode: 'FAC-MEC-008',
    name: 'Prof. Manish Hegde',
    designation: 'Assistant Professor',
    department: 'Mechanical Eng',
    month: 'October 2026',
    salary: {
      basic: 50000,
      hra: 15000,
      da: 9500,
      specialAllowance: 5500,
      grossSalary: 80000,
      pfDeduction: 6000,
      professionalTax: 200,
      tds: 3000,
      lopDeduction: 0,
      totalDeductions: 9200,
      netSalary: 70800,
    },
    bankDetails: {
      bankName: 'Canara Bank',
      accountNumberMasked: '•••• 1205',
      ifsc: 'CNRB0002140',
      pan: 'QRSMH7890Q',
    },
    status: 'on_hold',
    holdReason: 'Awaiting medical certificate verification for prolonged sick absence.',
    daysPresent: 20,
    unpaidLeaves: 0,
  },
  {
    id: 'pr-106',
    employeeCode: 'FAC-CIV-003',
    name: 'Dr. Suresh Patil',
    designation: 'Professor & Head',
    department: 'Civil Eng',
    month: 'October 2026',
    salary: {
      basic: 90000,
      hra: 25000,
      da: 17000,
      specialAllowance: 14000,
      grossSalary: 146000,
      pfDeduction: 10800,
      professionalTax: 200,
      tds: 13500,
      lopDeduction: 0,
      totalDeductions: 24500,
      netSalary: 121500,
    },
    bankDetails: {
      bankName: 'State Bank of India',
      accountNumberMasked: '•••• 6634',
      ifsc: 'SBIN0001200',
      pan: 'UVWSP1122R',
    },
    status: 'disbursed',
    disbursedDate: '2026-10-02',
    transactionRef: 'NEFT-CMS-984021045',
    paymentMode: 'NEFT',
    daysPresent: 26,
    unpaidLeaves: 0,
  },
];

export const PayrollManagementView: React.FC<PayrollManagementViewProps> = ({
  userRole = 'principal',
  userDepartment,
  currentUserName,
  institutionName = 'Engineering & Technology Institute',
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const maxContentWidth = Math.min(width, 1200);
  const cardGap = 10;
  const cardWidth = isDesktop ? Math.floor((maxContentWidth - 32 - cardGap) / 2) : '100%';

  const isTeacher = userRole === 'teacher';
  const isHOD = userRole === 'hod';
  const isManagement = userRole === 'principal' || userRole === 'admin' || userRole === 'accountant';

  const [records, setRecords] = useState<FacultyPayrollRecord[]>(INITIAL_PAYROLL_RECORDS);
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>(isHOD && userDepartment ? userDepartment : 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'disbursed' | 'pending' | 'on_hold'>('all');

  // Modals
  const [payslipModalRecord, setPayslipModalRecord] = useState<FacultyPayrollRecord | null>(null);
  const [holdModalRecord, setHoldModalRecord] = useState<FacultyPayrollRecord | null>(null);
  const [holdReasonInput, setHoldReasonInput] = useState('');

  // Add / Process Adjustment Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDept, setAddDept] = useState(userDepartment || 'Computer Science');
  const [addDesignation, setAddDesignation] = useState('Assistant Professor');
  const [addBasic, setAddBasic] = useState('50000');
  const [addHra, setAddHra] = useState('15000');
  const [addDa, setAddDa] = useState('9000');
  const [addSpecial, setAddSpecial] = useState('5000');
  const [addTds, setAddTds] = useState('3000');

  // Filtered Records based on role & search
  const visibleRecords = useMemo(() => {
    return records.filter((r) => {
      // Month
      if (r.month !== selectedMonth) return false;

      // Role Scoping
      if (isTeacher) {
        if (currentUserName && !r.name.toLowerCase().includes(currentUserName.toLowerCase())) {
          // If teacher, match name or fallback to first record for demo
          return r.id === 'pr-101' || r.name.toLowerCase().includes(currentUserName.toLowerCase());
        }
      } else if (isHOD && userDepartment) {
        if (r.department.toLowerCase() !== userDepartment.toLowerCase()) {
          return false;
        }
      } else if (selectedDept !== 'all') {
        if (r.department.toLowerCase() !== selectedDept.toLowerCase()) {
          return false;
        }
      }

      // Status
      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matches =
          r.name.toLowerCase().includes(q) ||
          r.employeeCode.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.designation.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [records, selectedMonth, isTeacher, isHOD, userDepartment, selectedDept, statusFilter, search, currentUserName]);

  // Financial Metrics
  const metrics = useMemo(() => {
    const monthPool = records.filter((r) => {
      if (r.month !== selectedMonth) return false;
      if (isHOD && userDepartment) return r.department.toLowerCase() === userDepartment.toLowerCase();
      if (isTeacher) return r.id === 'pr-101' || (currentUserName && r.name.includes(currentUserName));
      return true;
    });

    const totalGross = monthPool.reduce((acc, r) => acc + r.salary.grossSalary, 0);
    const totalDisbursed = monthPool.filter((r) => r.status === 'disbursed').reduce((acc, r) => acc + r.salary.netSalary, 0);
    const totalPending = monthPool.filter((r) => r.status !== 'disbursed').reduce((acc, r) => acc + r.salary.netSalary, 0);
    const totalDeductions = monthPool.reduce((acc, r) => acc + r.salary.totalDeductions, 0);

    return { totalGross, totalDisbursed, totalPending, totalDeductions, count: monthPool.length };
  }, [records, selectedMonth, isHOD, userDepartment, isTeacher, currentUserName]);

  // Actions
  const handleDisburse = (id: string, name: string, netAmount: number) => {
    const today = new Date().toISOString().slice(0, 10);
    const ref = `NEFT-CMS-${Math.floor(100000000 + Math.random() * 900000000)}`;

    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'disbursed',
              disbursedDate: today,
              transactionRef: ref,
              paymentMode: 'NEFT',
              holdReason: undefined,
            }
          : r
      )
    );

    Alert.alert(
      'Salary Disbursed',
      `₹${netAmount.toLocaleString('en-IN')} has been disbursed to ${name} via NEFT.\nUTR: ${ref}`
    );
  };

  const handleOpenHold = (r: FacultyPayrollRecord) => {
    setHoldModalRecord(r);
    setHoldReasonInput(r.holdReason || '');
  };

  const handleConfirmHold = () => {
    if (!holdModalRecord) return;
    setRecords((prev) =>
      prev.map((r) =>
        r.id === holdModalRecord.id
          ? {
              ...r,
              status: 'on_hold',
              holdReason: holdReasonInput.trim() || 'Salary held pending compliance / administrative review.',
            }
          : r
      )
    );
    setHoldModalRecord(null);
    Alert.alert('Salary On Hold', `Salary for ${holdModalRecord.name} has been placed on hold.`);
  };

  const handleReleaseHold = (id: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'pending',
              holdReason: undefined,
            }
          : r
      )
    );
    Alert.alert('Hold Released', 'Salary status changed to pending approval/disbursal.');
  };

  const handleCreatePayrollRecord = () => {
    const basic = parseFloat(addBasic) || 0;
    const hra = parseFloat(addHra) || 0;
    const da = parseFloat(addDa) || 0;
    const special = parseFloat(addSpecial) || 0;
    const tds = parseFloat(addTds) || 0;
    const pf = Math.round(basic * 0.12);
    const pt = 200;

    const gross = basic + hra + da + special;
    const deductions = pf + pt + tds;
    const net = gross - deductions;

    const newRec: FacultyPayrollRecord = {
      id: `pr-${Date.now()}`,
      employeeCode: `FAC-${addDept.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
      name: addName.trim() || 'New Faculty',
      designation: addDesignation,
      department: addDept,
      month: selectedMonth,
      salary: {
        basic,
        hra,
        da,
        specialAllowance: special,
        grossSalary: gross,
        pfDeduction: pf,
        professionalTax: pt,
        tds,
        lopDeduction: 0,
        totalDeductions: deductions,
        netSalary: net,
      },
      bankDetails: {
        bankName: 'Institutional Salary Account',
        accountNumberMasked: '•••• 0000',
        ifsc: 'INST0001001',
        pan: 'NEWPAN1234X',
      },
      status: 'pending',
      daysPresent: 26,
      unpaidLeaves: 0,
    };

    setRecords((prev) => [newRec, ...prev]);
    setAddModalVisible(false);
    Alert.alert('Payroll Processed', `Salary record for ${newRec.name} logged for ${selectedMonth}.`);
  };

  return (
    <View style={styles.container}>
      {/* 1. Top Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pageHeading} numberOfLines={1}>
            {isTeacher ? 'My Payslips & Compensation' : 'Staff & Faculty Payroll Ledger'}
          </Text>
          <Text style={styles.pageSubText}>
            {isTeacher
              ? 'Monthly salary credit records, statutory deductions & payslips'
              : isHOD
              ? `Department salary audit, attendance deductions & clearance (${userDepartment || 'Dept'})`
              : 'Institutional salary disbursements, PF & tax compliance management'}
          </Text>
        </View>

        {isManagement && (
          <TouchableOpacity style={styles.addBtn} onPress={() => setAddModalVisible(true)} activeOpacity={0.8}>
            <Feather name="plus" size={13} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Process Salary</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Month Selector & Summary Bar */}
      <View style={styles.metricsBar}>
        <View style={styles.monthSelectorRow}>
          <Feather name="calendar" size={13} color="#4B5563" />
          <Text style={styles.monthSelectorLabel}>Cycle:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.monthScroll}>
            {PAYROLL_MONTHS.map((m) => {
              const active = selectedMonth === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthPill, active && styles.monthPillActive]}
                  onPress={() => setSelectedMonth(m)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.monthPillText, active && styles.monthPillTextActive]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricCardsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{isTeacher ? 'My Gross Pay' : 'Total Gross'}</Text>
            <Text style={styles.metricNum}>₹{(metrics.totalGross / 100000).toFixed(2)}L</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{isTeacher ? 'Net Credited' : 'Disbursed'}</Text>
            <Text style={[styles.metricNum, { color: '#16A34A' }]}>
              ₹{(metrics.totalDisbursed / 100000).toFixed(2)}L
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{isTeacher ? 'Pending Credit' : 'Pending Disbursal'}</Text>
            <Text style={[styles.metricNum, { color: metrics.totalPending > 0 ? '#D97706' : '#6B7280' }]}>
              ₹{(metrics.totalPending / 100000).toFixed(2)}L
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Deductions (PF/Tax)</Text>
            <Text style={[styles.metricNum, { color: '#4B5563' }]}>
              ₹{(metrics.totalDeductions / 1000).toFixed(0)}k
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Search & Filter Bar (Only for management / HOD) */}
      {!isTeacher && (
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Feather name="search" size={13} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search faculty name, ID, or designation..."
              placeholderTextColor="#9CA3AF"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Feather name="x" size={13} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Status Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsScroll}>
            {[
              { key: 'all' as const, label: `All Records (${metrics.count})` },
              { key: 'disbursed' as const, label: 'Disbursed / Paid' },
              { key: 'pending' as const, label: 'Pending Disbursal' },
              { key: 'on_hold' as const, label: 'On Hold' },
            ].map((st) => {
              const active = statusFilter === st.key;
              return (
                <TouchableOpacity
                  key={st.key}
                  style={[styles.statusChip, active && styles.statusChipActive]}
                  onPress={() => setStatusFilter(st.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>{st.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Department Chips (Management Only) */}
          {isManagement && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.deptChipsScroll}>
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
          )}
        </View>
      )}

      {/* 4. Payroll Records Grid / List */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {visibleRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <Feather name="credit-card" size={24} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No payroll records found</Text>
            <Text style={styles.emptySub}>
              {search
                ? `No faculty matching "${search}" for ${selectedMonth}.`
                : `No salary records logged for ${selectedMonth} under the selected filters.`}
            </Text>
          </View>
        ) : (
          <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
            {visibleRecords.map((r) => {
              const isDisbursed = r.status === 'disbursed';
              const isHold = r.status === 'on_hold';
              const isPending = r.status === 'pending';

              return (
                <View key={r.id} style={[styles.card, { width: cardWidth }]}>
                  {/* Top Bar: Faculty Info & Status Pill */}
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardFacultyName}>{r.name}</Text>
                      <Text style={styles.cardFacultyMeta}>
                        {r.employeeCode} · {r.designation} · {r.department}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        isDisbursed && styles.statusPillDisbursed,
                        isHold && styles.statusPillHold,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isDisbursed && styles.statusPillTextDisbursed,
                          isHold && styles.statusPillTextHold,
                        ]}
                      >
                        {isDisbursed ? 'DISBURSED' : isHold ? 'ON HOLD' : 'PENDING'}
                      </Text>
                    </View>
                  </View>

                  {/* Salary Summary Highlight Box */}
                  <View style={styles.salaryHighlightBox}>
                    <View style={styles.salarySummaryCol}>
                      <Text style={styles.salarySummaryLabel}>Gross Pay</Text>
                      <Text style={styles.salarySummaryVal}>₹{r.salary.grossSalary.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.salarySummaryDivider} />
                    <View style={styles.salarySummaryCol}>
                      <Text style={styles.salarySummaryLabel}>Deductions</Text>
                      <Text style={[styles.salarySummaryVal, { color: '#B91C1C' }]}>
                        -₹{r.salary.totalDeductions.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.salarySummaryDivider} />
                    <View style={styles.salarySummaryCol}>
                      <Text style={styles.salarySummaryLabel}>Net Payable</Text>
                      <Text style={[styles.salarySummaryVal, { color: '#16A34A', fontFamily: FontFamily.bold }]}>
                        ₹{r.salary.netSalary.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Attendance & Deductions Micro Breakdown */}
                  <View style={styles.microDetailRow}>
                    <Text style={styles.microDetailText}>
                      Days Worked: <Text style={styles.boldText}>{r.daysPresent} Days</Text>
                      {r.unpaidLeaves > 0 ? (
                        <Text style={{ color: '#DC2626' }}> · LOP: {r.unpaidLeaves} Day</Text>
                      ) : null}
                    </Text>
                    <Text style={styles.microDetailText}>
                      PF: ₹{r.salary.pfDeduction} · TDS: ₹{r.salary.tds}
                    </Text>
                  </View>

                  {/* Bank & Disbursal Reference */}
                  <View style={styles.bankInfoRow}>
                    <MaterialCommunityIcons name="bank-outline" size={13} color="#6B7280" />
                    <Text style={styles.bankInfoText}>
                      {r.bankDetails.bankName} ({r.bankDetails.accountNumberMasked})
                    </Text>
                    {isDisbursed && r.transactionRef ? (
                      <>
                        <Text style={styles.dotSep}>·</Text>
                        <Text style={styles.refText}>{r.transactionRef}</Text>
                      </>
                    ) : null}
                  </View>

                  {/* Hold Reason Banner */}
                  {isHold && r.holdReason ? (
                    <View style={styles.holdBanner}>
                      <Feather name="alert-circle" size={12} color="#B91C1C" />
                      <Text style={styles.holdBannerText}>{r.holdReason}</Text>
                    </View>
                  ) : null}

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    {/* View Formal Payslip Button */}
                    <TouchableOpacity
                      style={styles.viewSlipBtn}
                      onPress={() => setPayslipModalRecord(r)}
                      activeOpacity={0.7}
                    >
                      <Feather name="file-text" size={12} color="#111827" />
                      <Text style={styles.viewSlipText}>View Payslip</Text>
                    </TouchableOpacity>

                    {/* Management Disbursal / Hold controls */}
                    {isManagement && isPending && (
                      <View style={styles.managementBtnGroup}>
                        <TouchableOpacity
                          style={styles.holdBtn}
                          onPress={() => handleOpenHold(r)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.holdBtnText}>Hold</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.disburseBtn}
                          onPress={() => handleDisburse(r.id, r.name, r.salary.netSalary)}
                          activeOpacity={0.8}
                        >
                          <Feather name="check" size={12} color="#FFFFFF" />
                          <Text style={styles.disburseBtnText}>Disburse</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {isManagement && isHold && (
                      <TouchableOpacity
                        style={styles.releaseHoldBtn}
                        onPress={() => handleReleaseHold(r.id)}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.releaseHoldText}>Release Hold</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 5. FORMAL PAYSLIP MODAL */}
      <Modal visible={!!payslipModalRecord} transparent animationType="fade" onRequestClose={() => setPayslipModalRecord(null)}>
        <View style={styles.modalOverlay}>
          {payslipModalRecord && (
            <View style={styles.payslipDialog}>
              <View style={styles.payslipHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payslipInstTitle}>{institutionName}</Text>
                  <Text style={styles.payslipInstSub}>Official Monthly Salary Statement & Payment Advice</Text>
                  <Text style={styles.payslipPeriodBadge}>Pay Period: {payslipModalRecord.month}</Text>
                </View>
                <TouchableOpacity onPress={() => setPayslipModalRecord(null)} style={styles.closeSlipBtn}>
                  <Feather name="x" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.payslipScroll} showsVerticalScrollIndicator={false}>
                {/* Employee Credentials Grid */}
                <View style={styles.slipCredsBox}>
                  <View style={styles.slipCredRow}>
                    <Text style={styles.slipCredLabel}>Employee Name:</Text>
                    <Text style={styles.slipCredVal}>{payslipModalRecord.name}</Text>
                  </View>
                  <View style={styles.slipCredRow}>
                    <Text style={styles.slipCredLabel}>Employee Code / ID:</Text>
                    <Text style={styles.slipCredVal}>{payslipModalRecord.employeeCode}</Text>
                  </View>
                  <View style={styles.slipCredRow}>
                    <Text style={styles.slipCredLabel}>Designation:</Text>
                    <Text style={styles.slipCredVal}>{payslipModalRecord.designation}</Text>
                  </View>
                  <View style={styles.slipCredRow}>
                    <Text style={styles.slipCredLabel}>Department:</Text>
                    <Text style={styles.slipCredVal}>{payslipModalRecord.department}</Text>
                  </View>
                  <View style={styles.slipCredRow}>
                    <Text style={styles.slipCredLabel}>Bank & Account:</Text>
                    <Text style={styles.slipCredVal}>
                      {payslipModalRecord.bankDetails.bankName} · {payslipModalRecord.bankDetails.accountNumberMasked}
                    </Text>
                  </View>
                  <View style={styles.slipCredRow}>
                    <Text style={styles.slipCredLabel}>IFSC & PAN:</Text>
                    <Text style={styles.slipCredVal}>
                      {payslipModalRecord.bankDetails.ifsc} · {payslipModalRecord.bankDetails.pan}
                    </Text>
                  </View>
                </View>

                {/* Earnings vs Deductions Dual Table */}
                <View style={styles.dualTableWrap}>
                  {/* Earnings Column */}
                  <View style={styles.tableCol}>
                    <View style={styles.colHeader}>
                      <Text style={styles.colHeaderText}>EARNINGS</Text>
                      <Text style={styles.colHeaderText}>AMOUNT (₹)</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.rowLabel}>Basic Pay</Text>
                      <Text style={styles.rowVal}>₹{payslipModalRecord.salary.basic.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.rowLabel}>Dearness Allowance (DA)</Text>
                      <Text style={styles.rowVal}>₹{payslipModalRecord.salary.da.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.rowLabel}>House Rent (HRA)</Text>
                      <Text style={styles.rowVal}>₹{payslipModalRecord.salary.hra.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.rowLabel}>Special / Academic</Text>
                      <Text style={styles.rowVal}>
                        ₹{payslipModalRecord.salary.specialAllowance.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[styles.tableRow, styles.totalRow]}>
                      <Text style={styles.totalRowLabel}>Gross Earnings</Text>
                      <Text style={styles.totalRowVal}>
                        ₹{payslipModalRecord.salary.grossSalary.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  {/* Deductions Column */}
                  <View style={styles.tableCol}>
                    <View style={[styles.colHeader, { backgroundColor: '#FEF2F2' }]}>
                      <Text style={[styles.colHeaderText, { color: '#B91C1C' }]}>DEDUCTIONS</Text>
                      <Text style={[styles.colHeaderText, { color: '#B91C1C' }]}>AMOUNT (₹)</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.rowLabel}>Provident Fund (PF)</Text>
                      <Text style={styles.rowVal}>₹{payslipModalRecord.salary.pfDeduction.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.rowLabel}>Professional Tax</Text>
                      <Text style={styles.rowVal}>₹{payslipModalRecord.salary.professionalTax.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.rowLabel}>TDS / Income Tax</Text>
                      <Text style={styles.rowVal}>₹{payslipModalRecord.salary.tds.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={styles.rowLabel}>Loss of Pay (LOP)</Text>
                      <Text style={styles.rowVal}>₹{payslipModalRecord.salary.lopDeduction.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={[styles.tableRow, styles.totalRow]}>
                      <Text style={styles.totalRowLabel}>Total Deductions</Text>
                      <Text style={[styles.totalRowVal, { color: '#B91C1C' }]}>
                        ₹{payslipModalRecord.salary.totalDeductions.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Net Take Home Pay Card */}
                <View style={styles.netPayCard}>
                  <View>
                    <Text style={styles.netPayCardSub}>NET SALARY CREDITED</Text>
                    <Text style={styles.netPayCardNum}>
                      ₹{payslipModalRecord.salary.netSalary.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.disbursalBadgeWrap}>
                    <Text style={styles.disbursalBadgeStatus}>
                      {payslipModalRecord.status.toUpperCase()}
                    </Text>
                    {payslipModalRecord.disbursedDate && (
                      <Text style={styles.disbursalBadgeDate}>On {payslipModalRecord.disbursedDate}</Text>
                    )}
                  </View>
                </View>

                {/* Digital Seal / Verification Notice */}
                <View style={styles.slipFooterNotice}>
                  <Feather name="shield" size={13} color="#6B7280" />
                  <Text style={styles.slipFooterText}>
                    This is a digitally verified institutional compensation record. Signature not required.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.payslipActionFooter}>
                <TouchableOpacity
                  style={styles.printBtn}
                  onPress={() => {
                    Alert.alert('Download Payslip', `Payslip for ${payslipModalRecord.name} (${payslipModalRecord.month}) ready for printing/download.`);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather name="printer" size={13} color="#FFFFFF" />
                  <Text style={styles.printBtnText}>Download / Print Payslip</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* 6. SALARY HOLD REASON MODAL */}
      <Modal visible={!!holdModalRecord} transparent animationType="fade" onRequestClose={() => setHoldModalRecord(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.holdDialog}>
            <View style={styles.modalTopHeader}>
              <Text style={styles.modalTopTitle}>Place Salary on Hold</Text>
              <TouchableOpacity onPress={() => setHoldModalRecord(null)}>
                <Feather name="x" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.holdPrompt}>
              Specify justification for withholding the salary disbursement for{' '}
              <Text style={styles.boldText}>{holdModalRecord?.name}</Text>:
            </Text>

            <TextInput
              style={styles.holdInput}
              placeholder="e.g. Incomplete attendance register / clearance pending from HOD..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              value={holdReasonInput}
              onChangeText={setHoldReasonInput}
            />

            <View style={styles.holdActions}>
              <TouchableOpacity onPress={() => setHoldModalRecord(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmHold} style={styles.confirmHoldBtn}>
                <Text style={styles.confirmHoldBtnText}>Confirm Hold</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 7. PROCESS / ADD SALARY MODAL */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.addDialog}>
            <View style={styles.modalTopHeader}>
              <View>
                <Text style={styles.modalTopTitle}>Process New Salary Record</Text>
                <Text style={styles.modalTopSub}>Cycle: {selectedMonth}</Text>
              </View>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <Feather name="x" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.addScroll} contentContainerStyle={{ gap: 10, paddingBottom: 6 }}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Faculty Full Name *</Text>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="e.g. Dr. Ramesh Kumar"
                  placeholderTextColor="#9CA3AF"
                  value={addName}
                  onChangeText={setAddName}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Department *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={addDept}
                    onChangeText={setAddDept}
                    placeholder="Department"
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Designation *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={addDesignation}
                    onChangeText={setAddDesignation}
                    placeholder="Designation"
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Basic Pay (₹) *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={addBasic}
                    onChangeText={setAddBasic}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>HRA (₹)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={addHra}
                    onChangeText={setAddHra}
                  />
                </View>
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>DA (₹)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={addDa}
                    onChangeText={setAddDa}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.fieldLabel}>Special Allowance (₹)</Text>
                  <TextInput
                    style={styles.fieldInput}
                    keyboardType="numeric"
                    value={addSpecial}
                    onChangeText={setAddSpecial}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>TDS / Income Tax Deduction (₹)</Text>
                <TextInput
                  style={styles.fieldInput}
                  keyboardType="numeric"
                  value={addTds}
                  onChangeText={setAddTds}
                />
              </View>
            </ScrollView>

            <View style={styles.holdActions}>
              <TouchableOpacity onPress={() => setAddModalVisible(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreatePayrollRecord} style={styles.confirmSaveBtn}>
                <Feather name="check" size={13} color="#FFFFFF" />
                <Text style={styles.confirmSaveText}>Save & Log Salary</Text>
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  addBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  metricsBar: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  monthSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  monthSelectorLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#374151',
  },
  monthScroll: {
    flexDirection: 'row',
    gap: 6,
  },
  monthPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthPillActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  monthPillText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#4B5563',
  },
  monthPillTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  metricCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  metricLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricNum: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#111827',
  },
  filterSection: {
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
    borderRadius: 6,
    paddingHorizontal: 10,
    height: 36,
    marginVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    color: '#111827',
    paddingVertical: 0,
  },
  statusChipsScroll: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  statusChip: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  statusChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#4B5563',
  },
  statusChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  deptChipsScroll: {
    flexDirection: 'row',
    gap: 5,
  },
  deptChip: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 4,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deptChipActive: {
    backgroundColor: '#374151',
    borderColor: '#374151',
  },
  deptChipText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#6B7280',
  },
  deptChipTextActive: {
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    paddingBottom: 100,
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
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardFacultyName: {
    fontFamily: FontFamily.bold,
    fontSize: 14.5,
    color: '#111827',
    lineHeight: 19,
  },
  cardFacultyMeta: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statusPillDisbursed: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  statusPillHold: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusPillText: {
    fontFamily: FontFamily.bold,
    fontSize: 9.5,
    color: '#B45309',
    letterSpacing: 0.4,
  },
  statusPillTextDisbursed: {
    color: '#15803D',
  },
  statusPillTextHold: {
    color: '#B91C1C',
  },
  salaryHighlightBox: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 8,
    alignItems: 'center',
  },
  salarySummaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  salarySummaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  salarySummaryLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  salarySummaryVal: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    color: '#111827',
  },
  microDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  microDetailText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#4B5563',
  },
  boldText: {
    fontFamily: FontFamily.bold,
    color: '#111827',
  },
  bankInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 8,
  },
  bankInfoText: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
  },
  dotSep: {
    fontSize: 10,
    color: '#D1D5DB',
  },
  refText: {
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  holdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  holdBannerText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 10.5,
    color: '#B91C1C',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
    gap: 8,
  },
  viewSlipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
  },
  viewSlipText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },
  managementBtnGroup: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  holdBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  holdBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#DC2626',
  },
  disburseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#111827',
  },
  disburseBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  releaseHoldBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: '#111827',
  },
  releaseHoldText: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#FFFFFF',
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
  payslipDialog: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
  },
  payslipInstTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: '#111827',
  },
  payslipInstSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  payslipPeriodBadge: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
    marginTop: 4,
  },
  closeSlipBtn: {
    padding: 4,
  },
  payslipScroll: {
    maxHeight: 460,
  },
  slipCredsBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 10,
    gap: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  slipCredRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slipCredLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#6B7280',
  },
  slipCredVal: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#111827',
  },
  dualTableWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  tableCol: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  colHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  colHeaderText: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#374151',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#4B5563',
  },
  rowVal: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    color: '#111827',
  },
  totalRow: {
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 0,
    paddingVertical: 6,
  },
  totalRowLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },
  totalRowVal: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#111827',
  },
  netPayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  netPayCardSub: {
    fontFamily: FontFamily.bold,
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
  netPayCardNum: {
    fontFamily: FontFamily.bold,
    fontSize: 19,
    color: '#FFFFFF',
    marginTop: 2,
  },
  disbursalBadgeWrap: {
    alignItems: 'flex-end',
  },
  disbursalBadgeStatus: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#34D399',
    letterSpacing: 0.4,
  },
  disbursalBadgeDate: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  slipFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  slipFooterText: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: '#6B7280',
  },
  payslipActionFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    marginTop: 8,
  },
  printBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#111827',
    paddingVertical: 9,
    borderRadius: 6,
  },
  printBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  holdDialog: {
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
  modalTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTopTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: '#111827',
  },
  modalTopSub: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  holdPrompt: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
    marginBottom: 8,
  },
  holdInput: {
    height: 70,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#111827',
    fontFamily: FontFamily.regular,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  holdActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    color: '#374151',
  },
  confirmHoldBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#DC2626',
  },
  confirmHoldBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  addDialog: {
    width: '100%',
    maxWidth: 480,
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
  addScroll: {
    maxHeight: 380,
  },
  fieldGroup: {
    gap: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontFamily: FontFamily.bold,
    fontSize: 11,
    color: '#374151',
  },
  fieldInput: {
    height: 36,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 12.5,
    color: '#111827',
    fontFamily: FontFamily.regular,
  },
  confirmSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#111827',
  },
  confirmSaveText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
});
