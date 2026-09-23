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
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../../store/useUserStore';
import {
  fetchAdmissionsApi,
  updateAdmissionStatusApi,
  ExtendedAdmissionApplication,
} from '../../../api/admissions';
import { fetchInstitutionsApi } from '../../../api/institutions';
import { Institution } from '../../../features/developer/types/developer.types';

export default function AdminAdmissionsScreen() {
  const router = useRouter();
  const adminInstCode = useUserStore((state) => state.institutionCode || state.institutionId || state.schoolId);
  const adminInstName = useUserStore((state) => state.institutionName || state.schoolName);

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>(adminInstCode || 'ALL');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'test_scheduled' | 'accepted' | 'rejected' | 'all'>('pending');
  const [applications, setApplications] = useState<ExtendedAdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Entrance Test Modal state
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [selectedAppForTest, setSelectedAppForTest] = useState<ExtendedAdmissionApplication | null>(null);
  const [testDateStr, setTestDateStr] = useState('');
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
        // If current admin has an assigned school, default to it
        if (adminInstCode && adminInstCode !== 'DEFAULT') {
          setSelectedSchoolCode(adminInstCode);
        } else if (schools.length > 0 && selectedSchoolCode === 'ALL') {
          const oak = schools.find((s) => s.institutionCode === 'OAK002');
          if (oak) setSelectedSchoolCode(oak.institutionCode);
        }
      })
      .catch(() => {});
  }, [adminInstCode]);

  const fetchApplications = async () => {
    try {
      const schoolParam = selectedSchoolCode === 'ALL' ? undefined : selectedSchoolCode;
      const data = await fetchAdmissionsApi({ schoolId: schoolParam });
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
  }, [selectedSchoolCode]);

  const handleStatusUpdate = async (id: string, newStatus: 'accepted' | 'rejected') => {
    try {
      await updateAdmissionStatusApi(id, newStatus);
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
      Alert.alert(
        newStatus === 'accepted' ? 'Application Accepted' : 'Application Rejected',
        `The application has been successfully marked as ${newStatus}.`
      );
    } catch (error: any) {
      console.error(`Error updating application to ${newStatus}:`, error);
      Alert.alert('Error', error?.message || 'Could not update status. Please try again.');
    }
  };

  const openScheduleModal = (app: ExtendedAdmissionApplication) => {
    setSelectedAppForTest(app);
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);

    const initialDateStr = app.entranceTestDate
      ? new Date(app.entranceTestDate).toISOString().slice(0, 16).replace('T', ' ')
      : d.toISOString().slice(0, 16).replace('T', ' ');

    setTestDateStr(initialDateStr);
    setTestVenueStr(app.entranceTestVenue || 'Main Auditorium & Examination Hall');
    setTestInstructionsStr(
      app.entranceTestInstructions ||
        'Please arrive 15 minutes before time. Bring previous marks card copy, birth certificate, and examination stationery.'
    );
    setScheduleModalVisible(true);
  };

  const handleApplyPreset = (daysAhead: number, timeStr: string = '10:00') => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const datePart = d.toISOString().slice(0, 10);
    setTestDateStr(`${datePart} ${timeStr}`);
  };

  const handleSaveEntranceTest = async () => {
    if (!selectedAppForTest) return;
    if (!testDateStr.trim()) {
      Alert.alert('Missing Date', 'Please provide a valid entrance test date and time.');
      return;
    }

    setSubmittingTest(true);
    try {
      const parsedDate = new Date(testDateStr.replace(' ', 'T'));
      const isoDate = isNaN(parsedDate.getTime())
        ? new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString()
        : parsedDate.toISOString();

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

  // Counts
  const pendingCount = applications.filter((a) => a.status === 'pending').length;
  const testScheduledCount = applications.filter((a) => a.status === 'test_scheduled').length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  // Filtered applications by status
  const filteredApplications = useMemo(() => {
    if (statusFilter === 'all') return applications;
    return applications.filter((app) => app.status === statusFilter);
  }, [applications, statusFilter]);

  const selectedSchoolObj = institutions.find(
    (i) => i.institutionCode === selectedSchoolCode || i.id === selectedSchoolCode
  );

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
            {selectedSchoolObj?.institutionName || adminInstName || 'All Institutions'}
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

      {/* School Switcher Chips */}
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

      {/* Active School Banner with Statistics */}
      <View style={styles.schoolBanner}>
        <View style={styles.schoolBannerRow}>
          <View style={styles.schoolIconWrap}>
            <MaterialCommunityIcons name="shield-check" size={24} color="#0284C7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerSchoolName}>
              {selectedSchoolObj?.institutionName || 'All Campuses Overview'}
            </Text>
            <Text style={styles.bannerSchoolCode}>
              Code: {selectedSchoolCode === 'ALL' ? 'GLOBAL' : selectedSchoolCode}
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
            { key: 'test_scheduled', label: `Test Scheduled (${testScheduledCount})` },
            { key: 'accepted', label: `Accepted (${acceptedCount})` },
            { key: 'all', label: `All (${applications.length})` },
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
            const isAccepted = item.status === 'accepted';
            const isRejected = item.status === 'rejected';

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
                        : isTestScheduled
                        ? styles.statusTestScheduled
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
                          : isTestScheduled
                          ? styles.statusTestScheduledText
                          : isPending
                          ? styles.statusPendingText
                          : styles.statusRejectedText,
                      ]}
                    >
                      {item.status.replace('_', ' ').toUpperCase()}
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
                      <Text style={styles.rescheduleBtnText}>Modify Entrance Test Date</Text>
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
                        {isTestScheduled ? 'Update Entrance Test' : 'Schedule Entrance Test'}
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
                            'Accept Admission',
                            `Accept ${item.childFullName} for ${item.gradeApplyingFor}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Accept',
                                onPress: () => handleStatusUpdate(item.id, 'accepted'),
                              },
                            ]
                          );
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="check" size={18} color="#10B981" />
                        <Text style={[styles.actionBtnText, { color: '#10B981' }]}>
                          Accept Admission
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.decisionBadge}>
                    <MaterialCommunityIcons
                      name={isAccepted ? 'check-circle' : 'close-circle'}
                      size={16}
                      color={isAccepted ? '#10B981' : '#EF4444'}
                    />
                    <Text
                      style={[
                        styles.decisionText,
                        { color: isAccepted ? '#10B981' : '#EF4444' },
                      ]}
                    >
                      Application {isAccepted ? 'Accepted & Approved' : 'Rejected'}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}

      {/* SCHEDULE ENTRANCE TEST MODAL */}
      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
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

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Quick presets */}
              <Text style={styles.fieldLabel}>QUICK DATE PRESETS:</Text>
              <View style={styles.presetsRow}>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(3, '10:00')}
                >
                  <Text style={styles.presetChipText}>In 3 Days (10 AM)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(5, '10:00')}
                >
                  <Text style={styles.presetChipText}>In 5 Days (10 AM)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetChip}
                  onPress={() => handleApplyPreset(7, '11:00')}
                >
                  <Text style={styles.presetChipText}>In 1 Week (11 AM)</Text>
                </TouchableOpacity>
              </View>

              {/* Date & Time Input */}
              <Text style={styles.fieldLabel}>TEST DATE & TIME (YYYY-MM-DD HH:MM):</Text>
              <TextInput
                style={styles.input}
                value={testDateStr}
                onChangeText={setTestDateStr}
                placeholder="2026-10-15 10:00"
                placeholderTextColor="#94A3B8"
              />

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
                  The applicant will see these test details immediately in their portal tracking screen.
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
  statusAccepted: { backgroundColor: '#ECFDF5' },
  statusAcceptedText: { color: '#065F46', fontSize: 11, fontWeight: '800' },
  statusRejected: { backgroundColor: '#FEF2F2' },
  statusRejectedText: { color: '#B91C1C', fontSize: 11, fontWeight: '800' },

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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
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
    borderRadius: 8,
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
    marginTop: 6,
    paddingBottom: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
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
    borderRadius: 10,
    paddingVertical: 12,
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
