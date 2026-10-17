import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  listDrives,
  getStudentApplications,
  applyForDrive,
  withdrawApplication,
  PlacementDrive,
  DriveApplication,
} from '../../../api/placement';
import { FontFamily } from '../../../constants/fonts';
import { BorderRadius } from '../../../constants/theme';

export default function DriveDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [application, setApplication] = useState<DriveApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [drivesData, appsData] = await Promise.all([
        listDrives().catch(() => []),
        getStudentApplications().catch(() => []),
      ]);
      const foundDrive = drivesData?.find((d) => d.id === id);
      setDrive(foundDrive || null);

      const foundApp = appsData?.find((a) => a.driveId === id && a.status !== 'withdrawn');
      setApplication(foundApp || null);
    } catch (err) {
      console.warn('Failed to load drive details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator size="large" color="#F4C430" />
      </View>
    );
  }

  if (!drive) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Placement drive not found</Text>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.back()}>
            <Text style={styles.backHomeBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isApplied = !!application;
  const deadlinePassed = new Date() > new Date(drive.applyDeadline);

  const handleApply = async () => {
    try {
      setActionLoading(true);
      await applyForDrive(drive.id);
      Alert.alert('Application Submitted!', 'Your profile and resume have been submitted to the placement cell.');
      await fetchData();
    } catch (err: any) {
      if (err?.code === 'MISSING_RESUME') {
        Alert.alert(
          'Resume Required',
          'Please update your placement profile with a valid resume URL before applying.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Update Profile', onPress: () => router.push('/(student)/placement/profile') },
          ]
        );
      } else {
        Alert.alert('Cannot Apply', err?.message || 'Failed to submit application.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw your application for this drive? You can re-apply before the deadline.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              await withdrawApplication(drive.id);
              Alert.alert('Withdrawn', 'Your application has been withdrawn.');
              await fetchData();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to withdraw application.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const isShortlisted = application?.status === 'shortlisted';
  const isHired = application?.status === 'hired';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#171717" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{drive.companyName}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Company Title Banner Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            {drive.logoUrl ? (
              <Image source={{ uri: drive.logoUrl }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoInitial}>
                  {drive.companyName ? drive.companyName.substring(0, 2).toUpperCase() : 'CO'}
                </Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{drive.companyName}</Text>
              <Text style={styles.driveTitle}>{drive.title}</Text>
            </View>
          </View>

          {/* Badges */}
          <View style={styles.badgesRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>{drive.jobType.replace('_', ' ').toUpperCase()}</Text>
            </View>

            {isApplied ? (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isHired
                      ? 'rgba(22, 163, 74, 0.15)'
                      : isShortlisted
                      ? 'rgba(244, 196, 48, 0.2)'
                      : '#F3F1EA',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: isHired ? '#16A34A' : isShortlisted ? '#D97706' : '#1A1B1C',
                    },
                  ]}
                >
                  {isHired
                    ? 'HIRED / OFFERED'
                    : isShortlisted
                    ? `SHORTLISTED: ROUND ${application.currentRoundIndex || 1}`
                    : 'APPLIED'}
                </Text>
              </View>
            ) : drive.eligible ? (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(244, 196, 48, 0.15)' }]}>
                <Text style={[styles.statusBadgeText, { color: '#B45309' }]}>YOU ARE ELIGIBLE</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: '#FEF2F2' }]}>
                <Text style={[styles.statusBadgeText, { color: '#DC2626' }]}>NOT ELIGIBLE</Text>
              </View>
            )}
          </View>
        </View>

        {/* Ineligibility Reason Banner */}
        {!drive.eligible && !isApplied && drive.ineligibilityReason ? (
          <View style={styles.ineligibleBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={styles.ineligibleText}>{drive.ineligibilityReason}</Text>
          </View>
        ) : null}

        {/* Overview Details Grid */}
        <Text style={styles.sectionTitle}>OPPORTUNITY DETAILS</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MaterialCommunityIcons name="cash" size={20} color="#F4C430" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>CTC / Compensation</Text>
              <Text style={styles.detailVal}>{drive.ctcOrStipend || 'Competitive / As per industry'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#F4C430" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Job Location</Text>
              <Text style={styles.detailVal}>{drive.location || 'Hybrid / Remote / TBD'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#F4C430" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailLabel}>Apply By Deadline</Text>
              <Text style={[styles.detailVal, deadlinePassed && { color: '#DC2626' }]}>
                {new Date(drive.applyDeadline).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {deadlinePassed ? ' (Expired)' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Selection Stages / Rounds */}
        {drive.rounds && drive.rounds.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>SELECTION ROUNDS ({drive.rounds.length})</Text>
            <View style={styles.roundsCard}>
              {drive.rounds.map((round, idx) => {
                const roundNum = idx + 1;
                const isCurrentRound = isShortlisted && (application.currentRoundIndex || 1) === roundNum;
                const isCompleted = isShortlisted && (application.currentRoundIndex || 1) > roundNum;

                return (
                  <View key={idx} style={styles.roundRow}>
                    <View
                      style={[
                        styles.roundNumberCircle,
                        isCurrentRound && styles.roundCircleCurrent,
                        isCompleted && styles.roundCircleCompleted,
                      ]}
                    >
                      {isCompleted ? (
                        <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
                      ) : (
                        <Text
                          style={[
                            styles.roundNumberText,
                            (isCurrentRound || isCompleted) && { color: '#FFFFFF' },
                          ]}
                        >
                          {roundNum}
                        </Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.roundName}>{round.name}</Text>
                      {round.description ? (
                        <Text style={styles.roundDesc}>{round.description}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Job Description */}
        {drive.description ? (
          <>
            <Text style={styles.sectionTitle}>JOB DESCRIPTION</Text>
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{drive.description}</Text>
            </View>
          </>
        ) : null}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <View style={styles.stickyFooter}>
        {isApplied ? (
          <TouchableOpacity
            style={[styles.withdrawBtn, deadlinePassed && { opacity: 0.5 }]}
            onPress={handleWithdraw}
            disabled={actionLoading || deadlinePassed}
            activeOpacity={0.8}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Text style={styles.withdrawBtnText}>
                {deadlinePassed ? 'Deadline Passed (Cannot Withdraw)' : 'Withdraw Application'}
              </Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.applyBtn,
              (!drive.eligible || deadlinePassed) && styles.applyBtnDisabled,
            ]}
            onPress={handleApply}
            disabled={actionLoading || !drive.eligible || deadlinePassed}
            activeOpacity={0.85}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#1A1B1C" />
            ) : (
              <Text style={styles.applyBtnText}>
                {deadlinePassed
                  ? 'Application Deadline Expired'
                  : !drive.eligible
                  ? 'Not Eligible to Apply'
                  : 'Apply Now with Resume'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF7' },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, color: '#6B6B6B', fontWeight: '700', marginBottom: 16 },
  backHomeBtn: {
    backgroundColor: '#F4C430',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.button,
  },
  backHomeBtnText: { color: '#1A1B1C', fontWeight: '800' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  scroll: { padding: 14, gap: 10 },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 16,
    gap: 12,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  logo: { width: 52, height: 52, borderRadius: 10, resizeMode: 'contain' },
  logoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F4C430',
  },
  logoInitial: { fontSize: 18, fontWeight: '800', color: '#1A1B1C' },
  companyName: { fontSize: 12, color: '#6B6B6B', fontWeight: '600' },
  driveTitle: { fontSize: 18, fontWeight: '800', color: '#171717', marginTop: 2 },

  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBadge: {
    backgroundColor: '#F3F1EA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 10, fontWeight: '800', color: '#4B5563' },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },

  ineligibleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: BorderRadius.card,
  },
  ineligibleText: { flex: 1, fontSize: 12, color: '#DC2626', fontWeight: '700' },

  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8A8A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 6,
    paddingHorizontal: 2,
  },

  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF4C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: { fontSize: 11, color: '#8A8A8A', fontWeight: '600' },
  detailVal: { fontSize: 13, fontWeight: '800', color: '#171717', marginTop: 1 },
  divider: { height: 1, backgroundColor: '#F3F1EA', marginVertical: 8 },

  roundsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
    gap: 12,
  },
  roundRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  roundNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F1EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roundCircleCurrent: { backgroundColor: '#F4C430' },
  roundCircleCompleted: { backgroundColor: '#16A34A' },
  roundNumberText: { fontSize: 12, fontWeight: '800', color: '#6B6B6B' },
  roundName: { fontSize: 13, fontWeight: '800', color: '#171717' },
  roundDesc: { fontSize: 11, color: '#6B6B6B', marginTop: 1 },

  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.card,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    padding: 14,
  },
  descriptionText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },

  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
    padding: 14,
  },
  applyBtn: {
    backgroundColor: '#F4C430',
    borderRadius: BorderRadius.button,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  applyBtnText: { fontSize: 14, fontWeight: '800', color: '#1A1B1C' },
  withdrawBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.button,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  withdrawBtnText: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
});
