import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useUserStore } from '../../../store/useUserStore';
import {
  fetchAdmissionsApi,
  updateAdmissionStatusApi,
  ExtendedAdmissionApplication,
} from '../../../api/admissions';
import { fetchInstitutionsApi } from '../../../api/institutions';
import { Institution } from '../../../features/developer/types/developer.types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const TIME_SLOTS = [
  { label: '09:00 AM', h: 9, m: 0 },
  { label: '10:00 AM', h: 10, m: 0 },
  { label: '11:30 AM', h: 11, m: 30 },
  { label: '02:00 PM', h: 14, m: 0 },
  { label: '03:30 PM', h: 15, m: 30 },
];

export default function AdminAdmissionsScreen() {
  const router = useRouter();
  const userRole = useUserStore((state) => state.userRole);
  const isSuperDev = userRole === 'dev';

  const rawInstCode = useUserStore((state) => state.institutionCode || state.institutionId || state.schoolId);
  const rawInstName = useUserStore((state) => state.institutionName || state.schoolName);

  // For school admins / admission officers, strictly lock to their own assigned institution (default OAK002)
  const lockedSchoolCode = (rawInstCode && rawInstCode !== 'DEFAULT') ? rawInstCode : 'OAK002';
  const lockedSchoolName = (rawInstName && rawInstName !== 'DEFAULT') ? rawInstName : 'Oakridge World Academy';

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>(isSuperDev ? 'ALL' : lockedSchoolCode);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'test_scheduled' | 'approved' | 'accepted' | 'rejected' | 'offer_declined' | 'all'>('pending');
  const [applications, setApplications] = useState<ExtendedAdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Entrance Test Modal state
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedAppForTest, setSelectedAppForTest] = useState<ExtendedAdmissionApplication | null>(null);

  // Interactive Calendar State
  const [selectedTestDate, setSelectedTestDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);
    return d;
  });
  const [viewingMonth, setViewingMonth] = useState<Date>(() => new Date());
  const [showNativeDatePicker, setShowNativeDatePicker] = useState(false);
  const [showNativeTimePicker, setShowNativeTimePicker] = useState(false);

  const [testVenueStr, setTestVenueStr] = useState('');
  const [testInstructionsStr, setTestInstructionsStr] = useState('');
  const [submittingTest, setSubmittingTest] = useState(false);

  // Load institutions list for selector
  useEffect(() => {
    fetchInstitutionsApi()
      .then((data) => {
        const schools = (data || []).filter(
          (i) => !i.institutionType || i.institutionType === 'school'
        );
        setInstitutions(schools);
        if (!isSuperDev) {
          setSelectedSchoolCode(lockedSchoolCode);
        }
      })
      .catch(() => {});
  }, [lockedSchoolCode, isSuperDev]);

  const fetchApplications = async () => {
    try {
      const targetParam = isSuperDev && selectedSchoolCode === 'ALL' ? undefined : (isSuperDev ? selectedSchoolCode : lockedSchoolCode);
      const data = await fetchAdmissionsApi({ schoolId: targetParam });
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching admissions from backend:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchApplications();
  }, [selectedSchoolCode, lockedSchoolCode]);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'accepted' | 'rejected') => {
    try {
      await updateAdmissionStatusApi(id, newStatus);
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
      Alert.alert(
        newStatus === 'approved'
          ? '🎉 Admission Offer Extended'
          : newStatus === 'accepted'
          ? 'Application Accepted & Enrolled'
          : 'Application Rejected',
        newStatus === 'approved'
          ? 'Admission offer has been sent to the parent. The parent can now review and accept this offer in their portal.'
          : `The application has been successfully marked as ${newStatus}.`
      );
    } catch (error: any) {
      console.error(`Error updating application to ${newStatus}:`, error);
      Alert.alert('Error', error?.message || 'Could not update status. Please try again.');
    }
  };

  const openScheduleModal = (app: ExtendedAdmissionApplication) => {
    setSelectedAppForTest(app);
    let initDate = new Date();
    initDate.setDate(initDate.getDate() + 3);
    initDate.setHours(10, 0, 0, 0);

    if (app.entranceTestDate) {
      const parsed = new Date(app.entranceTestDate);
      if (!isNaN(parsed.getTime())) {
        initDate = parsed;
      }
    }

    setSelectedTestDate(initDate);
    setViewingMonth(new Date(initDate.getFullYear(), initDate.getMonth(), 1));
    setTestVenueStr(app.entranceTestVenue || 'Main Campus Auditorium & Examination Hall');
    setTestInstructionsStr(
      app.entranceTestInstructions ||
        'Please arrive 15 minutes before time. Bring previous marks card copy, birth certificate, and examination stationery.'
    );
    setScheduleModalVisible(true);
  };

  const handleApplyPreset = (daysAhead: number, hours: number = 10, minutes: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hours, minutes, 0, 0);
    setSelectedTestDate(d);
    setViewingMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  const changeViewingMonth = (offset: number) => {
    const newMonth = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + offset, 1);
    setViewingMonth(newMonth);
  };

  const handleSelectDay = (day: number) => {
    const next = new Date(selectedTestDate);
    next.setFullYear(viewingMonth.getFullYear(), viewingMonth.getMonth(), day);
    setSelectedTestDate(next);
  };

  const handleSelectTimeSlot = (h: number, m: number) => {
    const next = new Date(selectedTestDate);
    next.setHours(h, m, 0, 0);
    setSelectedTestDate(next);
  };

  // Generate calendar days for viewing month
  const calendarDays = useMemo(() => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { day: number | null; dateObj: Date | null }[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ day: null, dateObj: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({
        day: d,
        dateObj: new Date(year, month, d),
      });
    }
    return days;
  }, [viewingMonth]);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (d: Date) => isSameDay(d, new Date());

  const handleSaveEntranceTest = async () => {
    if (!selectedAppForTest) return;

    setSubmittingTest(true);
    try {
      const isoDate = selectedTestDate.toISOString();

      const updated = await updateAdmissionStatusApi(selectedAppForTest.id, {
        status: 'test_scheduled',
        entranceTestDate: isoDate,
        entranceTestVenue: testVenueStr.trim(),
        entranceTestInstructions: testInstructionsStr.trim(),
      });

      setApplications((prev) =>
        prev.map((app) => (app.id === selectedAppForTest.id ? { ...app, ...updated } : app))
      );

      setScheduleModalVisible(false);
      Alert.alert(
        'Entrance Test Scheduled',
        `Entrance test has been scheduled for ${selectedAppForTest.childFullName}. The parent/student can view the schedule and instructions directly in their portal.`
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to schedule entrance test.');
    } finally {
      setSubmittingTest(false);
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Contact Number', 'No phone number was provided with this application.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Unable to Call', 'Cannot open dialer on this device.');
    });
  };

  const handleEmail = (email?: string) => {
    if (!email) {
      Alert.alert('No Email Address', 'No email address was provided with this application.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Unable to Email', 'Cannot open email client on this device.');
    });
  };

  // School-scoped applications for non-superDev
  const visibleApplications = useMemo(() => {
    if (!isSuperDev) {
      return applications.filter(
        (app) => !app.schoolId || app.schoolId === lockedSchoolCode
      );
    }
    return applications;
  }, [applications, isSuperDev, lockedSchoolCode]);

  // Counts
  const pendingCount = visibleApplications.filter((a) => a.status === 'pending').length;
  const testScheduledCount = visibleApplications.filter((a) => a.status === 'test_scheduled').length;
  const approvedCount = visibleApplications.filter((a) => a.status === 'approved').length;
  const acceptedCount = visibleApplications.filter((a) => a.status === 'accepted').length;

  // Filtered applications by status
  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') return visibleApplications;
    return visibleApplications.filter((app) => app.status === statusFilter);
  }, [visibleApplications, statusFilter]);

  const selectedSchoolObj = institutions.find(
    (i) => i.institutionCode === selectedSchoolCode || i.id === selectedSchoolCode
  );

  const displaySchoolName = isSuperDev
    ? (selectedSchoolObj?.institutionName || (selectedSchoolCode === 'ALL' ? 'All Campuses Overview' : selectedSchoolCode))
    : (lockedSchoolName || selectedSchoolObj?.institutionName || 'Oakridge World Academy');

  const displaySchoolCode = isSuperDev
    ? (selectedSchoolCode === 'ALL' ? 'GLOBAL' : selectedSchoolCode)
    : lockedSchoolCode;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>School Admissions</Text>
          <Text style={styles.headerSubtitle}>
            {displaySchoolName}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            setRefreshing(true);
            fetchApplications();
          }}
          style={styles.headerBtn}
        >
          <MaterialCommunityIcons name="refresh" size={22} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* School Switcher Chips - ONLY for platform Super Dev */}
      {isSuperDev && (
        <View style={styles.schoolSelectorSection}>
          <Text style={styles.selectorLabel}>SELECT SCHOOL / CAMPUS:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.schoolChipsScroll}
          >
            <TouchableOpacity
              style={[
                styles.schoolChip,
                selectedSchoolCode === 'ALL' && styles.schoolChipActive,
              ]}
              onPress={() => setSelectedSchoolCode('ALL')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="domain"
                size={14}
                color={selectedSchoolCode === 'ALL' ? '#FFFFFF' : '#64748B'}
              />
              <Text
                style={[
                  styles.schoolChipText,
                  selectedSchoolCode === 'ALL' && styles.schoolChipTextActive,
                ]}
              >
                All Schools
              </Text>
            </TouchableOpacity>

            {institutions.map((inst) => {
              const isSelected =
                selectedSchoolCode === inst.institutionCode ||
                selectedSchoolCode === inst.id;
              return (
                <TouchableOpacity
                  key={inst.id}
                  style={[styles.schoolChip, isSelected && styles.schoolChipActive]}
                  onPress={() => setSelectedSchoolCode(inst.institutionCode)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="school"
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.schoolChipText,
                      isSelected && styles.schoolChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {inst.institutionName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Active School Banner with Statistics */}
      <View style={styles.schoolBanner}>
        <View style={styles.schoolBannerRow}>
          <View style={styles.schoolIconWrap}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerSchoolName}>
              {displaySchoolName}
            </Text>
            <Text style={styles.bannerSchoolCode}>
              {isSuperDev ? `Code: ${displaySchoolCode}` : `Campus Code: ${displaySchoolCode}`}
            </Text>
          </View>
          <View style={styles.statsCol}>
            <View style={styles.bannerStatBadge}>
              <Text style={styles.bannerStatCount}>{pendingCount}</Text>
              <Text style={styles.bannerStatLabel}>Pending</Text>
            </View>
            <View style={[styles.bannerStatBadge, { backgroundColor: '#EEF2FF', marginTop: 3 }]}>
              <Text style={[styles.bannerStatCount, { color: '#4F46E5' }]}>{testScheduledCount}</Text>
              <Text style={[styles.bannerStatLabel, { color: '#4F46E5' }]}>Testing</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterTabsRow}>
        {(
          [
            { key: 'pending', label: `Pending (${pendingCount})` },
            { key: 'test_scheduled', label: `Testing (${testScheduledCount})` },
            { key: 'approved', label: `Offers (${approvedCount})` },
            { key: 'accepted', label: `Enrolled (${acceptedCount})` },
            { key: 'all', label: `All (${visibleApplications.length})` },
          ] as const
        ).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              statusFilter === tab.key && styles.filterTabActive,
            ]}
            onPress={() => setStatusFilter(tab.key)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === tab.key && styles.filterTabTextActive,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Applications List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284C7" />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredApplications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            fetchApplications();
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <MaterialCommunityIcons name="inbox-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptySubtitle}>
                No {statusFilter !== 'all' ? statusFilter.replace('_', ' ') : ''} admission applications for{' '}
                {selectedSchoolObj?.institutionName || 'this selection'}.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isPending = item.status === 'pending';
            const isTestScheduled = item.status === 'test_scheduled';
            const isApproved = item.status === 'approved';
            const isAccepted = item.status === 'accepted';
            const isOfferDeclined = item.status === 'offer_declined';

            return (
              <View style={styles.card}>
                {/* Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.applicantName}>{item.childFullName}</Text>
                    <Text style={styles.appliedGradeBadge}>
                      Applying for {item.gradeApplyingFor}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isAccepted
                        ? styles.statusAccepted
                        : isApproved
                        ? styles.statusApproved
                        : isTestScheduled
                        ? styles.statusTestScheduled
                        : isOfferDeclined
                        ? styles.statusOfferDeclined
                        : isPending
                        ? styles.statusPending
                        : styles.statusRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isAccepted
                          ? styles.statusAcceptedText
                          : isApproved
                          ? styles.statusApprovedText
                          : isTestScheduled
                          ? styles.statusTestScheduledText
                          : isOfferDeclined
                          ? styles.statusOfferDeclinedText
                          : isPending
                          ? styles.statusPendingText
                          : styles.statusRejectedText,
                      ]}
                    >
                      {item.status === 'approved' ? 'OFFER EXTENDED' : item.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* School Name Tag if Viewing All */}
                {selectedSchoolCode === 'ALL' && item.schoolName ? (
                  <View style={styles.schoolTagRow}>
                    <MaterialCommunityIcons name="school" size={14} color="#0284C7" />
                    <Text style={styles.schoolTagText}>{item.schoolName}</Text>
                  </View>
                ) : null}

                {/* Student Details */}
                <View style={styles.sectionDivider} />
                <View style={styles.detailsRow}>
                  <Text style={styles.label}>Age & Gender:</Text>
                  <Text style={styles.value}>
                    {item.childAge} yrs ({item.childGender})
                  </Text>
                </View>
                {item.previousSchool ? (
                  <View style={styles.detailsRow}>
                    <Text style={styles.label}>Prev School:</Text>
                    <Text style={styles.value}>{item.previousSchool}</Text>
                  </View>
                ) : null}
                <View style={styles.detailsRow}>
                  <Text style={styles.label}>Applied On:</Text>
                  <Text style={styles.value}>
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>

                {/* Parent & Contact Details Box */}
                <View style={styles.contactBox}>
                  <View style={styles.contactHeaderRow}>
                    <MaterialCommunityIcons
                      name="card-account-phone-outline"
                      size={16}
                      color="#0284C7"
                    />
                    <Text style={styles.contactBoxTitle}>Parent / Guardian Contacts</Text>
                  </View>

                  {item.parentName ? (
                    <View style={styles.detailsRow}>
                      <Text style={styles.contactLabel}>Guardian:</Text>
                      <Text style={styles.contactValue}>{item.parentName}</Text>
                    </View>
                  ) : null}

                  {/* Phone with Call Action */}
                  <View style={styles.contactActionRow}>
                    <View style={[styles.detailsRow, { flex: 1, marginBottom: 0 }]}>
                      <Text style={styles.contactLabel}>Phone No:</Text>
                      <Text style={[styles.contactValue, styles.phoneText]}>
                        {item.parentPhone || 'Not provided'}
                      </Text>
                    </View>
                    {item.parentPhone ? (
                      <TouchableOpacity
                        style={styles.quickCallBtn}
                        onPress={() => handleCall(item.parentPhone)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="phone" size={13} color="#FFFFFF" />
                        <Text style={styles.quickCallText}>Call</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Optional Email/Gmail with Mail Action */}
                  {item.parentEmail ? (
                    <View style={[styles.contactActionRow, { marginTop: 6 }]}>
                      <View style={[styles.detailsRow, { flex: 1, marginBottom: 0 }]}>
                        <Text style={styles.contactLabel}>Gmail/Email:</Text>
                        <Text
                          style={[styles.contactValue, { fontSize: 13 }]}
                          numberOfLines={1}
                        >
                          {item.parentEmail}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.quickEmailBtn}
                        onPress={() => handleEmail(item.parentEmail)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons
                          name="email-outline"
                          size={13}
                          color="#0284C7"
                        />
                        <Text style={styles.quickEmailText}>Mail</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={[styles.detailsRow, { marginTop: 4, marginBottom: 0 }]}>
                      <Text style={styles.contactLabel}>Gmail/Email:</Text>
                      <Text style={[styles.contactValue, { color: '#94A3B8', fontStyle: 'italic' }]}>
                        Not provided (optional)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Entrance Test Information Box (if scheduled) */}
                {(isTestScheduled || item.entranceTestDate) && (
                  <View style={styles.testScheduleCard}>
                    <View style={styles.testScheduleHeader}>
                      <MaterialCommunityIcons name="calendar-clock" size={16} color="#4F46E5" />
                      <Text style={styles.testScheduleTitle}>Entrance Test Scheduled</Text>
                    </View>

                    {item.entranceTestDate && (
                      <View style={styles.testDetailLine}>
                        <Text style={styles.testDetailLabel}>Date & Time:</Text>
                        <Text style={styles.testDetailValue}>
                          {new Date(item.entranceTestDate).toLocaleString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                    )}

                    {item.entranceTestVenue ? (
                      <View style={styles.testDetailLine}>
                        <Text style={styles.testDetailLabel}>Venue:</Text>
                        <Text style={[styles.testDetailValue, { color: '#065F46' }]}>
                          {item.entranceTestVenue}
                        </Text>
                      </View>
                    ) : null}

                    {item.entranceTestInstructions ? (
                      <View style={styles.testInstructionsWrap}>
                        <Text style={styles.testInstructionsLabel}>Instructions given to student:</Text>
                        <Text style={styles.testInstructionsContent}>
                          {item.entranceTestInstructions}
                        </Text>
                      </View>
                    ) : null}

                    <TouchableOpacity
                      style={styles.rescheduleBtn}
                      onPress={() => openScheduleModal(item)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="pencil-outline" size={14} color="#4F46E5" />
                      <Text style={styles.rescheduleBtnText}>Modify Entrance Test Schedule</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Primary Action Buttons */}
                {(isPending || isTestScheduled) ? (
                  <View style={styles.actionsContainer}>
                    {/* Schedule Test button */}
                    <TouchableOpacity
                      style={styles.scheduleTestBtn}
                      onPress={() => openScheduleModal(item)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="calendar-plus" size={16} color="#4F46E5" />
                      <Text style={styles.scheduleTestBtnText}>
                        {isTestScheduled ? 'Modify Entrance Test' : 'Schedule Entrance Test'}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        onPress={() => {
                          Alert.alert(
                            'Reject Application',
                            `Are you sure you want to reject the application for ${item.childFullName}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Reject',
                                style: 'destructive',
                                onPress: () => handleStatusUpdate(item.id, 'rejected'),
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="close" size={18} color="#EF4444" />
                        <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>
                          Reject
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.acceptBtn]}
                        onPress={() => {
                          Alert.alert(
                            'Approve & Extend Offer',
                            `Approve admission for ${item.childFullName} for ${item.gradeApplyingFor}?\n\nThis will send an Admission Offer to the parent. The parent can then review and accept this offer.`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Approve & Send Offer',
                                onPress: () => handleStatusUpdate(item.id, 'approved'),
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="star-shooting-outline" size={17} color="#10B981" />
                        <Text style={[styles.actionBtnText, { color: '#10B981' }]}>
                          Approve Admission
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : isApproved ? (
                  <View style={[styles.decisionBadge, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
                    <MaterialCommunityIcons
                      name="star-shooting-outline"
                      size={16}
                      color="#0284C7"
                    />
                    <Text
                      style={[
                        styles.decisionText,
                        { color: '#0369A1' },
                      ]}
                    >
                      Offer Extended (Awaiting Parent Acceptance)
                    </Text>
                  </View>
                ) : isAccepted ? (
                  <View style={[styles.decisionBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={16}
                      color="#10B981"
                    />
                    <Text
                      style={[
                        styles.decisionText,
                        { color: '#065F46' },
                      ]}
                    >
                      Parent Accepted & Enrolled
                    </Text>
                  </View>
                ) : isOfferDeclined ? (
                  <View style={[styles.decisionBadge, { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }]}>
                    <MaterialCommunityIcons
                      name="cancel"
                      size={16}
                      color="#64748B"
                    />
                    <Text
                      style={[
                        styles.decisionText,
                        { color: '#64748B' },
                      ]}
                    >
                      Offer Declined by Parent
                    </Text>
                  </View>
                ) : (
                  <View style={styles.decisionBadge}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={16}
                      color="#EF4444"
                    />
                    <Text
                      style={[
                        styles.decisionText,
                        { color: '#EF4444' },
                      ]}
                    >
                      Application Rejected
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* SCHEDULE ENTRANCE TEST MODAL WITH INTERACTIVE CALENDAR */}
      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconWrap}>
                <MaterialCommunityIcons name="calendar-clock" size={22} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Schedule Entrance Test</Text>
                <Text style={styles.modalSubtitle}>
                  For {selectedAppForTest?.childFullName} ({selectedAppForTest?.gradeApplyingFor})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setScheduleModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* Quick presets */}
              <Text style={styles.fieldLabel}>QUICK DATE PRESETS:</Text>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(3, 10, 0)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>In 3 Days (10 AM)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(5, 10, 0)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>In 5 Days (10 AM)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(7, 11, 0)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetChipText}>In 1 Week (11 AM)</Text>
                </TouchableOpacity>
              </View>

              {/* INTERACTIVE CALENDAR SELECTOR */}
              <View style={styles.calendarSection}>
                <View style={styles.calendarHeaderRow}>
                  <Text style={styles.fieldLabel}>SELECT TEST DATE FROM CALENDAR:</Text>
                  <TouchableOpacity
                    style={styles.systemPickerBtn}
                    onPress={() => setShowNativeDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="calendar-search" size={14} color="#4F46E5" />
                    <Text style={styles.systemPickerText}>System Dialog</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarContainer}>
                  {/* Month Navigation */}
                  <View style={styles.monthNavRow}>
                    <TouchableOpacity
                      onPress={() => changeViewingMonth(-1)}
                      style={styles.monthNavBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="chevron-left" size={22} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.monthNavTitle}>
                      {MONTH_NAMES[viewingMonth.getMonth()]} {viewingMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity
                      onPress={() => changeViewingMonth(1)}
                      style={styles.monthNavBtn}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="chevron-right" size={22} color="#1E293B" />
                    </TouchableOpacity>
                  </View>

                  {/* Day of Week Labels */}
                  <View style={styles.dayLabelsRow}>
                    {DAY_LABELS.map((label, idx) => (
                      <Text
                        key={label}
                        style={[
                          styles.dayLabelText,
                          (idx === 0 || idx === 6) && styles.dayLabelWeekend,
                        ]}
                      >
                        {label}
                      </Text>
                    ))}
                  </View>

                  {/* Calendar Days Grid */}
                  <View style={styles.daysGrid}>
                    {calendarDays.map((item, index) => {
                      if (!item.day || !item.dateObj) {
                        return <View key={`empty-${index}`} style={styles.dayCellEmpty} />;
                      }

                      const isSelected = isSameDay(item.dateObj, selectedTestDate);
                      const currentIsToday = isToday(item.dateObj);

                      return (
                        <TouchableOpacity
                          key={`day-${item.day}`}
                          style={[
                            styles.dayCell,
                            currentIsToday && styles.dayCellToday,
                            isSelected && styles.dayCellSelected,
                          ]}
                          onPress={() => handleSelectDay(item.day!)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dayCellText,
                              currentIsToday && styles.dayCellTextToday,
                              isSelected && styles.dayCellTextSelected,
                            ]}
                          >
                            {item.day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* TIME SLOT SELECTION */}
              <View style={styles.timeSection}>
                <View style={styles.calendarHeaderRow}>
                  <Text style={styles.fieldLabel}>SELECT TEST TIME:</Text>
                  <TouchableOpacity
                    style={styles.systemPickerBtn}
                    onPress={() => setShowNativeTimePicker(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#4F46E5" />
                    <Text style={styles.systemPickerText}>Exact Time Picker</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeSlotsRow}>
                  {TIME_SLOTS.map((slot) => {
                    const isSelected =
                      selectedTestDate.getHours() === slot.h &&
                      selectedTestDate.getMinutes() === slot.m;

                    return (
                      <TouchableOpacity
                        key={slot.label}
                        style={[
                          styles.timeSlotChip,
                          isSelected && styles.timeSlotChipSelected,
                        ]}
                        onPress={() => handleSelectTimeSlot(slot.h, slot.m)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons
                          name="clock-time-four"
                          size={13}
                          color={isSelected ? '#FFFFFF' : '#4F46E5'}
                        />
                        <Text
                          style={[
                            styles.timeSlotText,
                            isSelected && styles.timeSlotTextSelected,
                          ]}
                        >
                          {slot.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* ACTIVE SELECTION SUMMARY CARD */}
              <View style={styles.selectionSummaryCard}>
                <View style={styles.selectionSummaryIconWrap}>
                  <MaterialCommunityIcons name="calendar-check" size={24} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectionSummaryLabel}>SCHEDULED TEST DATE & TIME:</Text>
                  <Text style={styles.selectionSummaryValue}>
                    {selectedTestDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                    {' at '}
                    {selectedTestDate.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {/* Venue Input */}
              <Text style={styles.fieldLabel}>TEST VENUE / LOCATION:</Text>
              <TextInput
                style={styles.input}
                value={testVenueStr}
                onChangeText={setTestVenueStr}
                placeholder="Campus Hall / Room 204 or Online link"
                placeholderTextColor="#94A3B8"
              />

              {/* Instructions Input */}
              <Text style={styles.fieldLabel}>INSTRUCTIONS FOR CANDIDATE & PARENT:</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={testInstructionsStr}
                onChangeText={setTestInstructionsStr}
                placeholder="Bring stationery, admit card, arrive 15 minutes prior..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalNotice}>
                <MaterialCommunityIcons name="information-outline" size={16} color="#0284C7" />
                <Text style={styles.modalNoticeText}>
                  The applicant will see this entrance test date and instructions immediately on their tracker.
                </Text>
              </View>

              {/* Modal Buttons */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setScheduleModalVisible(false)}
                  disabled={submittingTest}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleSaveEntranceTest}
                  disabled={submittingTest}
                >
                  {submittingTest ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                      <Text style={styles.modalConfirmText}>Confirm Schedule</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Native Date Picker Dialog for Android/iOS */}
      {showNativeDatePicker && (
        <DateTimePicker
          value={selectedTestDate}
          mode="date"
          display="default"
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowNativeDatePicker(false);
            if (event.type === 'set' && date) {
              const next = new Date(selectedTestDate);
              next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
              setSelectedTestDate(next);
              setViewingMonth(new Date(date.getFullYear(), date.getMonth(), 1));
            }
          }}
        />
      )}

      {/* Native Time Picker Dialog for Android/iOS */}
      {showNativeTimePicker && (
        <DateTimePicker
          value={selectedTestDate}
          mode="time"
          display="default"
          is24Hour={false}
          onChange={(event: DateTimePickerEvent, time?: Date) => {
            setShowNativeTimePicker(false);
            if (event.type === 'set' && time) {
              const next = new Date(selectedTestDate);
              next.setHours(time.getHours(), time.getMinutes(), 0, 0);
              setSelectedTestDate(next);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { fontSize: 14, color: '#64748B', marginTop: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#334155', marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBtn: { padding: 6, width: 40, alignItems: 'center' },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 1 },

  // School Selector
  schoolSelectorSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  selectorLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  schoolChipsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  schoolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  schoolChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  schoolChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  schoolChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Active School Banner
  schoolBanner: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  schoolBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  schoolIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerSchoolName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  bannerSchoolCode: { fontSize: 12, color: '#0284C7', fontWeight: '600', marginTop: 2 },
  statsCol: {
    flexDirection: 'row',
    gap: 6,
  },
  bannerStatBadge: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bannerStatCount: { fontSize: 14, fontWeight: '800', color: '#D97706' },
  bannerStatLabel: { fontSize: 9, fontWeight: '700', color: '#B45309' },

  // Tabs
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    gap: 6,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabActive: {
    backgroundColor: '#0284C7',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // Card
  listContainer: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  applicantName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  appliedGradeBadge: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusPendingText: { color: '#B45309', fontSize: 11, fontWeight: '800' },
  statusTestScheduled: { backgroundColor: '#EEF2FF' },
  statusTestScheduledText: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },
  statusApproved: { backgroundColor: '#E0F2FE' },
  statusApprovedText: { color: '#0369A1', fontSize: 11, fontWeight: '800' },
  statusAccepted: { backgroundColor: '#ECFDF5' },
  statusAcceptedText: { color: '#065F46', fontSize: 11, fontWeight: '800' },
  statusRejected: { backgroundColor: '#FEF2F2' },
  statusRejectedText: { color: '#B91C1C', fontSize: 11, fontWeight: '800' },
  statusOfferDeclined: { backgroundColor: '#F1F5F9' },
  statusOfferDeclinedText: { color: '#64748B', fontSize: 11, fontWeight: '800' },

  schoolTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  schoolTagText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: { width: 95, fontSize: 13, color: '#64748B' },
  value: { flex: 1, fontSize: 13, color: '#1E293B', fontWeight: '500' },

  // Contact Box
  contactBox: {
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  contactBoxTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  contactLabel: {
    width: 85,
    fontSize: 12,
    color: '#64748B',
  },
  contactValue: {
    flex: 1,
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  phoneText: {
    color: '#0F172A',
    fontWeight: '700',
  },
  contactActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickCallBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  quickCallText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  quickEmailBtn: {
    backgroundColor: '#E0F2FE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  quickEmailText: { color: '#0284C7', fontSize: 11, fontWeight: '700' },

  // Entrance Test Schedule Card in item
  testScheduleCard: {
    marginTop: 10,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  testScheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  testScheduleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4338CA',
  },
  testDetailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  testDetailLabel: {
    width: 90,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  testDetailValue: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
  },
  testInstructionsWrap: {
    marginTop: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  testInstructionsLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
    marginBottom: 2,
  },
  testInstructionsContent: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  rescheduleBtnText: {
    fontSize: 12,
    color: '#4F46E5',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Actions
  actionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  scheduleTestBtn: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  scheduleTestBtnText: {
    color: '#4F46E5',
    fontSize: 13,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  acceptBtn: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  decisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignSelf: 'flex-start',
  },
  decisionText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCloseBtn: {
    padding: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },

  // CALENDAR SECTION
  calendarSection: {
    marginBottom: 14,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  systemPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  systemPickerText: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '700',
  },
  calendarContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  monthNavBtn: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthNavTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  dayLabelText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dayLabelWeekend: {
    color: '#EF4444',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCellEmpty: {
    width: '14.28%',
    height: 36,
  },
  dayCell: {
    width: '14.28%',
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  dayCellSelected: {
    backgroundColor: '#4F46E5',
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayCellTextToday: {
    color: '#4F46E5',
    fontWeight: '700',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // TIME SECTION
  timeSection: {
    marginBottom: 14,
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeSlotChipSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  timeSlotTextSelected: {
    color: '#FFFFFF',
  },

  // SELECTION SUMMARY CARD
  selectionSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  selectionSummaryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  selectionSummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4F46E5',
    letterSpacing: 0.5,
  },
  selectionSummaryValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E1B4B',
    marginTop: 2,
  },

  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 14,
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modalNoticeText: {
    fontSize: 12,
    color: '#0369A1',
    flex: 1,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    paddingBottom: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  modalConfirmBtn: {
    flex: 2,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
