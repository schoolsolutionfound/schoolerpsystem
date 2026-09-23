import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth } from '../../../firebaseConfig';
import { fetchAdmissionsApi, updateAdmissionStatusApi, ExtendedAdmissionApplication } from '../../../api/admissions';
import { useUserStore } from '../../../store/useUserStore';

export const ApplicationStatusTracker = () => {
  const [applications, setApplications] = useState<ExtendedAdmissionApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const data = await fetchAdmissionsApi({ parentId: user.uid });
      setApplications(data || []);
    } catch (error) {
      console.error("Error fetching applications from backend:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleParentAccept = (item: ExtendedAdmissionApplication) => {
    Alert.alert(
      'Accept Admission Offer',
      `Confirm enrollment for ${item.childFullName} at ${item.schoolName}?\n\nThis will officially link your student to ${item.schoolName}. Any other school offers for this student will be automatically declined.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept & Enroll',
          onPress: async () => {
            try {
              setActionLoadingId(item.id);
              await updateAdmissionStatusApi(item.id, 'accepted');
              // Update user store
              useUserStore.getState().setUserProfile({
                childName: item.childFullName,
                institutionCode: item.schoolId,
                schoolId: item.schoolId,
                institutionName: item.schoolName,
                schoolName: item.schoolName,
                relation: 'Parent',
              });
              // Update local list
              setApplications((prev) =>
                prev.map((app) => {
                  if (app.id === item.id) return { ...app, status: 'accepted' };
                  if (app.childFullName.toLowerCase() === item.childFullName.toLowerCase()) {
                    return { ...app, status: 'offer_declined' };
                  }
                  return app;
                })
              );
              Alert.alert(
                '🎉 Enrollment Confirmed!',
                `${item.childFullName} is now officially enrolled at ${item.schoolName}. You can now view your student's dashboard and affiliated campus.`
              );
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to accept offer. Please try again.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleParentDecline = (item: ExtendedAdmissionApplication) => {
    Alert.alert(
      'Decline Admission Offer',
      `Are you sure you want to decline the admission offer from ${item.schoolName} for ${item.childFullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline Offer',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(item.id);
              await updateAdmissionStatusApi(item.id, 'offer_declined');
              setApplications((prev) =>
                prev.map((app) => (app.id === item.id ? { ...app, status: 'offer_declined' } : app))
              );
              Alert.alert('Offer Declined', `You have declined the admission offer from ${item.schoolName}.`);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to decline offer. Please try again.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#10B981'; // Green (Enrolled)
      case 'approved':
        return '#0284C7'; // Blue (Offer Extended)
      case 'rejected':
        return '#EF4444'; // Red
      case 'offer_declined':
        return '#64748B'; // Slate
      case 'test_scheduled':
        return '#6366F1'; // Indigo for Entrance Test
      default:
        return '#F59E0B'; // pending
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'check-decagram';
      case 'approved':
        return 'star-shooting-outline';
      case 'rejected':
        return 'close-circle-outline';
      case 'offer_declined':
        return 'cancel';
      case 'test_scheduled':
        return 'calendar-clock';
      default:
        return 'clock-outline';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'test_scheduled') return 'TEST SCHEDULED';
    if (status === 'approved') return 'OFFER RECEIVED';
    if (status === 'accepted') return 'ENROLLED';
    if (status === 'offer_declined') return 'OFFER DECLINED';
    return status.toUpperCase();
  };

  return (
    <FlatList
      data={applications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emptyText}>You haven't applied to any schools yet.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const hasEntranceTest = item.status === 'test_scheduled' || Boolean(item.entranceTestDate);

        return (
          <View style={styles.card}>
            {/* School & Status Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.schoolName}>{item.schoolName || 'School Campus'}</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) + '1A' },
                ]}
              >
                <MaterialCommunityIcons
                  name={getStatusIcon(item.status) as any}
                  size={15}
                  color={getStatusColor(item.status)}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(item.status) },
                  ]}
                >
                  {getStatusLabel(item.status)}
                </Text>
              </View>
            </View>

            {/* Applicant Basic Info */}
            <View style={styles.detailsRow}>
              <Text style={styles.label}>Applicant:</Text>
              <Text style={styles.value}>
                {item.childFullName} (Age: {item.childAge})
              </Text>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.label}>Grade:</Text>
              <Text style={styles.value}>{item.gradeApplyingFor}</Text>
            </View>
            {item.parentPhone ? (
              <View style={styles.detailsRow}>
                <Text style={styles.label}>Contact No:</Text>
                <Text style={[styles.value, styles.contactHighlight]}>{item.parentPhone}</Text>
              </View>
            ) : null}
            {item.parentEmail ? (
              <View style={styles.detailsRow}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{item.parentEmail}</Text>
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

            {/* ADMISSION OFFER RECEIVED CARD (AWAITING PARENT ACCEPTANCE / DECLINE) */}
            {item.status === 'approved' ? (
              <View style={styles.offerCard}>
                <View style={styles.offerHeaderRow}>
                  <View style={styles.offerIconBadge}>
                    <MaterialCommunityIcons name="star-shooting-outline" size={20} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerTitle}>Admission Offer Received!</Text>
                    <Text style={styles.offerSub}>Seat offered for {item.gradeApplyingFor}</Text>
                  </View>
                </View>

                <Text style={styles.offerDesc}>
                  Congratulations! <Text style={{ fontWeight: '700' }}>{item.schoolName}</Text> has evaluated and approved the admission application for <Text style={{ fontWeight: '700' }}>{item.childFullName}</Text>.
                </Text>

                <View style={styles.offerInfoNote}>
                  <MaterialCommunityIcons name="information-outline" size={15} color="#0284C7" />
                  <Text style={styles.offerInfoText}>
                    Accepting this offer will confirm enrollment at {item.schoolName}. Any other school offers for {item.childFullName} will be automatically declined.
                  </Text>
                </View>

                {/* Parent Decision Buttons */}
                <View style={styles.decisionActionsRow}>
                  <TouchableOpacity
                    style={[styles.decisionBtn, styles.declineOfferBtn]}
                    onPress={() => handleParentDecline(item)}
                    disabled={actionLoadingId === item.id}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" />
                    <Text style={styles.declineOfferBtnText}>Decline Offer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionBtn, styles.acceptOfferBtn]}
                    onPress={() => handleParentAccept(item)}
                    disabled={actionLoadingId === item.id}
                    activeOpacity={0.8}
                  >
                    {actionLoadingId === item.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-decagram" size={16} color="#FFFFFF" />
                        <Text style={styles.acceptOfferBtnText}>Accept & Enroll</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : item.status === 'accepted' ? (
              <View style={styles.acceptedCard}>
                <View style={styles.acceptedHeaderRow}>
                  <View style={styles.acceptedIconBadge}>
                    <MaterialCommunityIcons name="school" size={20} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.acceptedTitle}>Admission Confirmed & Enrolled</Text>
                    <Text style={styles.acceptedSub}>Officially accepted into {item.gradeApplyingFor}</Text>
                  </View>
                </View>

                <Text style={styles.acceptedDesc}>
                  Congratulations! <Text style={{ fontWeight: '700' }}>{item.childFullName}</Text> is officially enrolled at <Text style={{ fontWeight: '700' }}>{item.schoolName}</Text>. The student is linked to your parent account!
                </Text>

                {item.entranceTestDate ? (
                  <View style={styles.completedTestRow}>
                    <MaterialCommunityIcons name="check-decagram" size={15} color="#10B981" />
                    <Text style={styles.completedTestText}>
                      Entrance Assessment evaluated & approved.
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : item.status === 'offer_declined' ? (
              <View style={styles.declinedCard}>
                <View style={styles.declinedHeaderRow}>
                  <MaterialCommunityIcons name="cancel" size={18} color="#64748B" />
                  <Text style={styles.declinedText}>Offer Declined by Parent</Text>
                </View>
                <Text style={styles.declinedSubText}>
                  You chose not to proceed with enrollment at this campus.
                </Text>
              </View>
            ) : item.status === 'rejected' ? (
              <View style={styles.rejectedCard}>
                <View style={styles.declinedHeaderRow}>
                  <MaterialCommunityIcons name="close-circle-outline" size={18} color="#EF4444" />
                  <Text style={[styles.declinedText, { color: '#B91C1C' }]}>Application Not Accepted</Text>
                </View>
                <Text style={styles.declinedSubText}>
                  This application could not be admitted for the upcoming term.
                </Text>
              </View>
            ) : item.status === 'test_scheduled' || Boolean(item.entranceTestDate) ? (
              <View style={styles.testCard}>
                <View style={styles.testHeaderRow}>
                  <View style={styles.testIconBadge}>
                    <MaterialCommunityIcons name="calendar-star" size={18} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testTitle}>Entrance Test Scheduled</Text>
                    <Text style={styles.testSub}>Action required for admission evaluation</Text>
                  </View>
                </View>

                {item.entranceTestDate && (
                  <View style={styles.testDetailRow}>
                    <MaterialCommunityIcons name="clock-time-four-outline" size={16} color="#6366F1" />
                    <Text style={styles.testLabel}>Date & Time:</Text>
                    <Text style={styles.testDateValue}>
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
                  <View style={styles.testDetailRow}>
                    <MaterialCommunityIcons name="map-marker-radius-outline" size={16} color="#059669" />
                    <Text style={styles.testLabel}>Venue / Hall:</Text>
                    <Text style={styles.testVenueValue}>{item.entranceTestVenue}</Text>
                  </View>
                ) : null}

                {item.entranceTestInstructions ? (
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsTitle}>Instructions & Requirements:</Text>
                    <Text style={styles.instructionsText}>{item.entranceTestInstructions}</Text>
                  </View>
                ) : null}

                <View style={styles.testTipsFooter}>
                  <MaterialCommunityIcons name="information-outline" size={14} color="#6366F1" />
                  <Text style={styles.testTipsText}>
                    Please arrive 15 minutes before time with identity proof.
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 15, color: '#64748B' },
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
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 85,
    fontSize: 13,
    color: '#64748B',
  },
  value: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '500',
  },
  contactHighlight: {
    color: '#0284C7',
    fontWeight: '700',
  },

  // Test Highlight Card
  testCard: {
    marginTop: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  testHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  testIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3730A3',
  },
  testSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  testDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  testLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  testDateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338CA',
    flex: 1,
  },
  testVenueValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
  },
  instructionsBox: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  instructionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
    marginBottom: 2,
  },
  instructionsText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  testTipsFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  testTipsText: {
    fontSize: 11,
    color: '#6366F1',
    fontStyle: 'italic',
    flex: 1,
  },

  // Accepted Card Styles
  acceptedCard: {
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  acceptedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  acceptedIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#6EE7B7',
  },
  acceptedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#065F46',
  },
  acceptedSub: {
    fontSize: 11,
    color: '#047857',
  },
  acceptedDesc: {
    fontSize: 12,
    color: '#1F2937',
    lineHeight: 18,
  },
  completedTestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D1FAE5',
  },
  completedTestText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },

  // Admission Offer Card Styles
  offerCard: {
    marginTop: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#7DD3FC',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  offerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  offerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369A1',
  },
  offerSub: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '500',
  },
  offerDesc: {
    fontSize: 12,
    color: '#1E293B',
    lineHeight: 18,
    marginBottom: 8,
  },
  offerInfoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  offerInfoText: {
    flex: 1,
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
  },
  decisionActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  decisionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  acceptOfferBtn: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  acceptOfferBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  declineOfferBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  declineOfferBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Declined & Rejected Card Styles
  declinedCard: {
    marginTop: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  rejectedCard: {
    marginTop: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  declinedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  declinedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  declinedSubText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
});
