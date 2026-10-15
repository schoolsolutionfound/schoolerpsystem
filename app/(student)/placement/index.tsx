import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listDrives, getStudentApplications, PlacementDrive, DriveApplication } from '../../../api/placement';
import { LoadingView } from '../../../features/shared/components/LoadingView';
import { EmptyState } from '../../../features/shared/components/EmptyState';
import { AppCard } from '../../../features/shared/components/AppCard';
import { AppBadge } from '../../../features/shared/components/AppBadge';
import { FontFamily } from '../../../constants/fonts';

export default function PlacementFeedScreen() {
  const router = useRouter();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [applications, setApplications] = useState<DriveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      const [drivesData, appsData] = await Promise.all([
        listDrives(),
        getStudentApplications(),
      ]);
      setDrives(drivesData || []);
      setApplications(appsData || []);
    } catch (err) {
      console.warn('Failed to load placement feed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFeed();
    setRefreshing(false);
  };

  if (loading) return <LoadingView message="Loading placement drives..." />;

  const getApplicationStatus = (driveId: string) => {
    return applications.find(a => a.driveId === driveId && a.status !== 'withdrawn');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1B1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Placement Cell</Text>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(student)/placement/profile')}>
          <MaterialCommunityIcons name="account-circle-outline" size={24} color="#1A1B1C" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {drives.length === 0 ? (
          <EmptyState
            iconName="briefcase-outline"
            title="No Drives Available"
            description="There are no upcoming placement drives published at the moment."
          />
        ) : (
          drives.map(drive => {
            const application = getApplicationStatus(drive.id);
            const isApplied = !!application;
            
            return (
              <AppCard key={drive.id} style={styles.driveCard}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => router.push(`/(student)/placement/${drive.id}` as any)}
                >
                  <View style={styles.cardHeader}>
                    {drive.logoUrl ? (
                      <Image source={{ uri: drive.logoUrl }} style={styles.logo} />
                    ) : (
                      <View style={styles.logoPlaceholder}>
                        <MaterialCommunityIcons name="office-building" size={24} color="#9CA3AF" />
                      </View>
                    )}
                    <View style={styles.cardHeaderRight}>
                      {isApplied ? (
                        <AppBadge label="Applied" type="active" />
                      ) : drive.eligible ? (
                        <AppBadge label="Eligible" type="trial" />
                      ) : (
                        <AppBadge label="Ineligible" type="inactive" />
                      )}
                    </View>
                  </View>
                  
                  <Text style={styles.companyName}>{drive.companyName}</Text>
                  <Text style={styles.driveTitle}>{drive.title}</Text>
                  
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{drive.location || 'Remote/Not specified'}</Text>
                  </View>
                  
                  <View style={styles.metaRow}>
                    <MaterialCommunityIcons name="cash" size={14} color="#6B7280" />
                    <Text style={styles.metaText}>{drive.ctcOrStipend || 'Not specified'}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.footerRow}>
                    <Text style={styles.deadlineText}>
                      Deadline: {new Date(drive.applyDeadline).toLocaleDateString()}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              </AppCard>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  profileBtn: { padding: 4 },
  scroll: { padding: 16, gap: 16 },
  
  driveCard: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  logo: { width: 48, height: 48, borderRadius: 8, resizeMode: 'contain' },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderRight: { alignItems: 'flex-end' },
  companyName: { fontSize: 14, fontFamily: FontFamily.medium, color: '#6B7280', marginBottom: 2 },
  driveTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: '#111827', marginBottom: 12 },
  
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 },
  metaText: { fontSize: 13, fontFamily: FontFamily.regular, color: '#4B5563' },
  
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deadlineText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#DC2626' },
});
