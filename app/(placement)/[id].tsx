import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Image, Alert, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listDrives, getDriveApplicationsForStaff, updateApplicationStatusForStaff, DriveApplication, PlacementDrive } from '../../api/placement';
import { LoadingView } from '../../features/shared/components/LoadingView';
import { AppCard } from '../../features/shared/components/AppCard';
import { AppBadge } from '../../features/shared/components/AppBadge';
import { AppButton } from '../../features/shared/components/AppButton';
import { EmptyState } from '../../features/shared/components/EmptyState';
import { FontFamily } from '../../constants/fonts';
import * as Linking from 'expo-linking';

export default function PlacementAdminApplicantsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [drive, setDrive] = useState<PlacementDrive | null>(null);
  const [applications, setApplications] = useState<DriveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [roundFilter, setRoundFilter] = useState<string>('all');
  
  const fetchData = async () => {
    try {
      if (!id) return;
      const [appsData, drivesData] = await Promise.all([
        getDriveApplicationsForStaff(id as string),
        listDrives(),
      ]);
      setApplications(appsData || []);
      const found = drivesData?.find(d => d.id === id);
      setDrive(found || null);
    } catch (err) {
      console.warn('Failed to load applicants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleUpdateStatus = async (appId: string, newStatus: string, currentRoundIndex?: number) => {
    try {
      await updateApplicationStatusForStaff(id as string, appId, newStatus, currentRoundIndex);
      // Optimistically update UI
      setApplications(prev => prev.map(a => 
        a.id === appId 
          ? { ...a, status: newStatus as any, currentRoundIndex: currentRoundIndex ?? a.currentRoundIndex } 
          : a
      ));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update status.');
    }
  };

  const totalRounds = drive?.rounds?.length || 0;

  const getStatusOptions = (app: DriveApplication) => {
    if (app.status === 'withdrawn') return [];
    
    const options = [];
    
    // Always have a fast-track option to Hire or Reject
    if (app.status !== 'hired') options.push({ label: 'Hire', action: 'hired' });
    if (app.status !== 'rejected') options.push({ label: 'Reject', action: 'rejected' });
    if (app.status === 'hired' || app.status === 'rejected') options.push({ label: 'Undo (to Applied)', action: 'applied' });

    // Shortlisting logic
    if (app.status === 'applied' || (app.status === 'shortlisted' && app.currentRoundIndex < totalRounds)) {
      const nextRound = app.status === 'applied' ? 1 : app.currentRoundIndex + 1;
      options.unshift({ 
        label: `Shortlist R${nextRound}`, 
        action: 'shortlisted', 
        roundIndex: nextRound 
      });
    }

    return options;
  };

  const branches = useMemo(() => {
    const b = new Set<string>();
    applications.forEach(a => { if (a.student?.branch) b.add(a.student.branch); });
    return Array.from(b);
  }, [applications]);

  const filteredApps = useMemo(() => {
    return applications.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (branchFilter !== 'all' && a.student?.branch !== branchFilter) return false;
      return true;
    });
  }, [applications, statusFilter, branchFilter]);

  const stats = useMemo(() => {
    const s = { total: applications.length, applied: 0, shortlisted: 0, hired: 0 };
    applications.forEach(a => {
      if (a.status === 'applied') s.applied++;
      if (a.status === 'shortlisted') s.shortlisted++;
      if (a.status === 'hired') s.hired++;
    });
    return s;
  }, [applications]);

  const getStatusColor = (status: string): { type: any } => {
    switch(status) {
      case 'hired': return { type: 'active' };
      case 'shortlisted': return { type: 'trial' };
      case 'rejected': return { type: 'inactive' };
      case 'withdrawn': return { type: 'inactive' };
      default: return { type: 'school' };
    }
  };

  if (loading) return <LoadingView message="Loading applicants..." />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1A1B1C" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Applicants</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.applied}</Text>
            <Text style={styles.statLabel}>Applied</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.shortlisted}</Text>
            <Text style={styles.statLabel}>Shortlisted</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.hired}</Text>
            <Text style={styles.statLabel}>Hired</Text>
          </View>
        </View>

        <View style={styles.filtersWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, statusFilter === 'all' && styles.filterChipActive]}
              onPress={() => setStatusFilter('all')}
            >
              <Text style={[styles.filterText, statusFilter === 'all' && styles.filterTextActive]}>All Status</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, statusFilter === 'applied' && styles.filterChipActive]}
              onPress={() => setStatusFilter('applied')}
            >
              <Text style={[styles.filterText, statusFilter === 'applied' && styles.filterTextActive]}>Applied</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, statusFilter === 'shortlisted' && styles.filterChipActive]}
              onPress={() => setStatusFilter('shortlisted')}
            >
              <Text style={[styles.filterText, statusFilter === 'shortlisted' && styles.filterTextActive]}>Shortlisted</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, statusFilter === 'hired' && styles.filterChipActive]}
              onPress={() => setStatusFilter('hired')}
            >
              <Text style={[styles.filterText, statusFilter === 'hired' && styles.filterTextActive]}>Hired</Text>
            </TouchableOpacity>
            
            <View style={styles.vDivider} />
            
            <TouchableOpacity 
              style={[styles.filterChip, branchFilter === 'all' && styles.filterChipActive]}
              onPress={() => setBranchFilter('all')}
            >
              <Text style={[styles.filterText, branchFilter === 'all' && styles.filterTextActive]}>All Branches</Text>
            </TouchableOpacity>
            {branches.map(b => (
              <TouchableOpacity 
                key={b}
                style={[styles.filterChip, branchFilter === b && styles.filterChipActive]}
                onPress={() => setBranchFilter(b)}
              >
                <Text style={[styles.filterText, branchFilter === b && styles.filterTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {filteredApps.length === 0 ? (
          <EmptyState
            iconName="account-search-outline"
            title="No Applicants Found"
            description="No students match the current filters."
          />
        ) : (
          filteredApps.map(app => (
            <AppCard key={app.id} style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={styles.appHeaderLeft}>
                  {app.student?.profilePicUrl ? (
                    <Image source={{ uri: app.student.profilePicUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <MaterialCommunityIcons name="account" size={24} color="#9CA3AF" />
                    </View>
                  )}
                  <View>
                    <Text style={styles.studentName}>{app.student?.fullName || 'Unknown Student'}</Text>
                    <Text style={styles.studentMeta}>
                      {app.student?.branch || 'N/A'} • {app.student?.year || 'N/A'}
                    </Text>
                  </View>
                </View>
                <AppBadge 
                  label={app.status === 'shortlisted' ? `SHORTLISTED R${app.currentRoundIndex || 1}` : app.status.toUpperCase()} 
                  type={getStatusColor(app.status).type} 
                />
              </View>

              <View style={styles.contactRow}>
                <Text style={styles.contactText}>{app.student?.email}</Text>
                <Text style={styles.contactText}>{app.student?.phone}</Text>
              </View>

              <View style={styles.gradesRow}>
                <View style={styles.gradeBox}>
                  <Text style={styles.gradeLabel}>10th</Text>
                  <Text style={styles.gradeValue}>{app.student?.tenthPercentage || 'N/A'}</Text>
                </View>
                <View style={styles.gradeBox}>
                  <Text style={styles.gradeLabel}>12th</Text>
                  <Text style={styles.gradeValue}>{app.student?.twelfthPercentage || 'N/A'}</Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                {!!app.resumeUrl && (
                  <TouchableOpacity 
                    style={styles.resumeBtn}
                    onPress={() => Linking.openURL(app.resumeUrl)}
                  >
                    <MaterialCommunityIcons name="file-document-outline" size={16} color="#3B82F6" />
                    <Text style={styles.resumeText}>View Resume</Text>
                  </TouchableOpacity>
                )}
                
                <View style={styles.statusButtons}>
                  {getStatusOptions(app).map((opt, i) => (
                    <TouchableOpacity 
                      key={i}
                      style={[styles.statusBtn, opt.action === 'rejected' && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }]}
                      onPress={() => handleUpdateStatus(app.id, opt.action, opt.roundIndex)}
                    >
                      <Text style={[styles.statusBtnText, opt.action === 'rejected' && { color: '#DC2626' }]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </AppCard>
          ))
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
  
  scroll: { paddingBottom: 60 },
  
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center' },
  statNum: { fontSize: 20, fontFamily: FontFamily.bold, color: '#111827' },
  statLabel: { fontSize: 11, fontFamily: FontFamily.medium, color: '#6B7280', marginTop: 4 },
  
  filtersWrapper: { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  filtersScroll: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  filterChipActive: { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' },
  filterText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#4B5563' },
  filterTextActive: { color: '#1D4ED8' },
  vDivider: { width: 1, height: 20, backgroundColor: '#E5E7EB', marginHorizontal: 4 },
  
  appCard: { marginHorizontal: 16, marginTop: 16, padding: 16 },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  appHeaderLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 15, fontFamily: FontFamily.semibold, color: '#111827', marginBottom: 2 },
  studentMeta: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280' },
  
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  contactText: { fontSize: 12, fontFamily: FontFamily.regular, color: '#4B5563' },
  
  gradesRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  gradeBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 8, borderRadius: 8, alignItems: 'center' },
  gradeLabel: { fontSize: 11, fontFamily: FontFamily.medium, color: '#6B7280', marginBottom: 2 },
  gradeValue: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#111827' },
  
  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#EFF6FF', borderRadius: 6 },
  resumeText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#3B82F6' },
  
  statusButtons: { flexDirection: 'row', gap: 8 },
  statusBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6 },
  statusBtnText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#4B5563' },
});
