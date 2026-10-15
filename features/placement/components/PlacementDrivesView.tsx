import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { listDrives, PlacementDrive } from '../../../api/placement';
import { LoadingView } from '../../shared/components/LoadingView';
import { EmptyState } from '../../shared/components/EmptyState';
import { AppCard } from '../../shared/components/AppCard';
import { AppBadge } from '../../shared/components/AppBadge';
import { FontFamily } from '../../../constants/fonts';

export function PlacementDrivesView() {
  const router = useRouter();
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = async () => {
    try {
      const drivesData = await listDrives();
      setDrives(drivesData || []);
    } catch (err) {
      console.warn('Failed to load placement drives:', err);
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Placement Drives</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(placement)/create' as any)}>
          <MaterialCommunityIcons name="plus" size={24} color="#1A1B1C" />
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
            description="There are no placement drives created yet."
          />
        ) : (
          drives.map(drive => (
            <AppCard key={drive.id} style={styles.driveCard}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/(placement)/${drive.id}` as any)}
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
                    <AppBadge 
                      label={drive.status} 
                      type={drive.status === 'published' ? 'active' : drive.status === 'draft' ? 'trial' : 'inactive'} 
                    />
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={styles.viewAppsText}>View Applicants</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#3B82F6" />
                  </View>
                </View>
              </TouchableOpacity>
            </AppCard>
          ))
        )}
      </ScrollView>
    </View>
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
  headerTitle: { fontSize: 18, fontFamily: FontFamily.bold, color: '#1A1B1C' },
  createBtn: { padding: 4, backgroundColor: '#F4C430', borderRadius: 8 },
  
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
  deadlineText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#4B5563' },
  viewAppsText: { fontSize: 13, fontFamily: FontFamily.semibold, color: '#3B82F6' },
});
