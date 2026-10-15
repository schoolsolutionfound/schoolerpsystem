import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listDrives, getStudentApplications, applyForDrive, withdrawApplication, PlacementDrive, DriveApplication } from '../../../api/placement';
import { LoadingView } from '../../../features/shared/components/LoadingView';
import { AppButton } from '../../../features/shared/components/AppButton';
import { AppBadge } from '../../../features/shared/components/AppBadge';
import { FontFamily } from '../../../constants/fonts';

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
        listDrives(),
        getStudentApplications(),
      ]);
      const foundDrive = drivesData?.find(d => d.id === id);
      setDrive(foundDrive || null);
      
      const foundApp = appsData?.find(a => a.driveId === id && a.status !== 'withdrawn');
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

  if (loading) return <LoadingView message="Loading drive details..." />;
  if (!drive) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Drive not found</Text>
        <AppButton title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  const isApplied = !!application;
  const deadlinePassed = new Date() > new Date(drive.applyDeadline);

  const handleApply = async () => {
    try {
      setActionLoading(true);
      await applyForDrive(drive.id);
      Alert.alert('Success', 'Application submitted successfully!');
      await fetchData();
    } catch (err: any) {
      if (err?.code === 'MISSING_RESUME') {
        Alert.alert('Missing Resume', 'Please update your placement profile with a resume URL first.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update Profile', onPress: () => router.push('/(student)/placement/profile') }
        ]);
      } else {
        Alert.alert('Error', err?.message || 'Failed to apply.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    Alert.alert('Withdraw Application', 'Are you sure you want to withdraw your application?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Withdraw', style: 'destructive', onPress: async () => {
        try {
          setActionLoading(true);
          await withdrawApplication(drive.id);
          Alert.alert('Success', 'Application withdrawn.');
          await fetchData();
        } catch (err: any) {
          Alert.alert('Error', err?.message || 'Failed to withdraw.');
        } finally {
          setActionLoading(false);
        }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1B1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drive Details</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {drive.bannerUrl ? (
          <Image source={{ uri: drive.bannerUrl }} style={styles.banner} />
        ) : (
          <View style={styles.bannerPlaceholder}>
            <MaterialCommunityIcons name="briefcase" size={48} color="#D1D5DB" />
          </View>
        )}

        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            {drive.logoUrl ? (
              <Image source={{ uri: drive.logoUrl }} style={styles.logo} />
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.companyName}>{drive.companyName}</Text>
              <Text style={styles.driveTitle}>{drive.title}</Text>
            </View>
          </View>
          
          <View style={styles.badgesRow}>
            <AppBadge label={drive.jobType.replace('_', ' ').toUpperCase()} type="school" />
            {isApplied ? (
              <AppBadge 
                label={application?.status === 'shortlisted' ? `Shortlisted R${application.currentRoundIndex || 1}` : application?.status?.toUpperCase() || 'APPLIED'} 
                type={application?.status === 'hired' ? 'active' : application?.status === 'rejected' ? 'inactive' : 'trial'} 
              />
            ) : drive.eligible ? (
              <AppBadge label="Eligible" type="trial" />
            ) : (
              <AppBadge label="Ineligible" type="inactive" />
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="cash" size={20} color="#6B7280" />
              <View>
                <Text style={styles.metaLabel}>CTC / Stipend</Text>
                <Text style={styles.metaValue}>{drive.ctcOrStipend || 'Not specified'}</Text>
              </View>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#6B7280" />
              <View>
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaValue}>{drive.location || 'Remote/Not specified'}</Text>
              </View>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="calendar-clock" size={20} color="#6B7280" />
              <View>
                <Text style={styles.metaLabel}>Deadline</Text>
                <Text style={[styles.metaValue, deadlinePassed && { color: '#DC2626' }]}>
                  {new Date(drive.applyDeadline).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {!drive.eligible && !isApplied && (
          <View style={styles.ineligibleBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.ineligibleText}>{drive.ineligibilityReason}</Text>
          </View>
        )}

        {drive.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Description</Text>
            <Text style={styles.bodyText}>{drive.description}</Text>
          </View>
        ) : null}

        {drive.rounds && drive.rounds.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interview Rounds</Text>
            {drive.rounds.map((round, idx) => (
              <View key={idx} style={styles.roundItem}>
                <View style={styles.roundNumber}>
                  <Text style={styles.roundNumberText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.roundTitle}>{round.name}</Text>
                  {!!round.description && <Text style={styles.roundDesc}>{round.description}</Text>}
                </View>
              </View>
            ))}
          </View>
        ) : null}

      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        {isApplied ? (
          <AppButton
            title="Withdraw Application"
            variant="outline"
            onPress={handleWithdraw}
            loading={actionLoading}
            disabled={deadlinePassed}
          />
        ) : (
          <AppButton
            title={deadlinePassed ? "Deadline Passed" : "Apply Now"}
            variant="primary"
            onPress={handleApply}
            loading={actionLoading}
            disabled={!drive.eligible || deadlinePassed}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, fontFamily: FontFamily.medium, marginBottom: 20, color: '#4B5563' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  
  scroll: { paddingBottom: 100 },
  banner: { width: '100%', height: 160, resizeMode: 'cover' },
  bannerPlaceholder: { width: '100%', height: 160, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  
  headerContent: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  logo: { width: 56, height: 56, borderRadius: 12, resizeMode: 'contain' },
  companyName: { fontSize: 14, fontFamily: FontFamily.medium, color: '#6B7280', marginBottom: 4 },
  driveTitle: { fontSize: 22, fontFamily: FontFamily.bold, color: '#111827' },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  sectionTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827', marginBottom: 16 },
  
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: '45%' },
  metaLabel: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280' },
  metaValue: { fontSize: 14, fontFamily: FontFamily.semibold, color: '#111827', marginTop: 2 },
  
  ineligibleBox: { margin: 20, padding: 12, backgroundColor: '#FEF2F2', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ineligibleText: { flex: 1, fontSize: 13, fontFamily: FontFamily.medium, color: '#DC2626' },
  
  bodyText: { fontSize: 14, fontFamily: FontFamily.regular, color: '#4B5563', lineHeight: 22 },
  
  roundItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roundNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  roundNumberText: { fontSize: 14, fontFamily: FontFamily.bold, color: '#4B5563' },
  roundTitle: { fontSize: 15, fontFamily: FontFamily.semibold, color: '#111827', marginBottom: 4 },
  roundDesc: { fontSize: 13, fontFamily: FontFamily.regular, color: '#6B7280' },
  
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});
