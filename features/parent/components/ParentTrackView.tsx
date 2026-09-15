import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated, RefreshControl, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import * as Location from 'expo-location';

type TrackMode = 'student' | 'bus';

export const ParentTrackView: React.FC = () => {
  const [mode, setMode] = useState<TrackMode>('student');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busActive, setBusActive] = useState(false);
  const [studentLocation, setStudentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const studentPulseAnim = useRef(new Animated.Value(1)).current;

  // Bus pulse
  useEffect(() => {
    if (busActive && mode === 'bus') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [busActive, mode, pulseAnim]);

  // Student pulse
  useEffect(() => {
    if (mode === 'student') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(studentPulseAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(studentPulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [mode, studentPulseAnim]);

  const load = useCallback(async () => {
    try {
      // Simulate fetching bus status
      await new Promise((r) => setTimeout(r, 500));

      // Simulate student location (in production, fetch from API)
      setStudentLocation({ latitude: 12.9716, longitude: 77.5946 });
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingBox}>
        <MaterialCommunityIcons name="crosshairs-gps" size={32} color="#E8E5DC" />
        <Text style={styles.loadingText}>Loading tracker...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#1A1B1C"
          colors={['#1A1B1C']}
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      <View style={styles.container}>
        {/* Map Placeholder */}
        <View style={styles.mapContainer}>
          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons name="map-outline" size={48} color="#D1D5DB" />
            <Text style={styles.mapText}>Live Map</Text>
            <Text style={styles.mapSub}>
              {mode === 'student' ? 'Student location will appear here' : 'Bus location will appear here'}
            </Text>
          </View>

          {/* Student marker */}
          {mode === 'student' && studentLocation && (
            <Animated.View style={[styles.studentMarker, { transform: [{ scale: studentPulseAnim }] }]}>
              <View style={styles.studentMarkerInner}>
                <MaterialCommunityIcons name="account" size={18} color="#FFFFFF" />
              </View>
            </Animated.View>
          )}

          {/* Bus marker */}
          {mode === 'bus' && busActive && (
            <Animated.View style={[styles.busMarker, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.busMarkerInner}>
                <MaterialCommunityIcons name="bus" size={20} color="#FFFFFF" />
              </View>
            </Animated.View>
          )}

          {/* Stop marker */}
          <View style={styles.stopMarker}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#F4C430" />
          </View>
        </View>

        {/* Info Card */}
        {mode === 'bus' ? (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoTitleRow}>
                <MaterialCommunityIcons name="bus" size={20} color="#1A1B1C" />
                <Text style={styles.infoTitle}>Bus Tracking</Text>
              </View>
              <View style={[styles.liveBadge, busActive && styles.liveBadgeActive]}>
                <View style={[styles.liveDot, busActive && styles.liveDotActive]} />
                <Text style={[styles.liveText, busActive && styles.liveTextActive]}>
                  {busActive ? 'LIVE' : 'OFFLINE'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statNum}>—</Text>
                <Text style={styles.statLabel}>Route</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum}>—</Text>
                <Text style={styles.statLabel}>ETA</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum}>—</Text>
                <Text style={styles.statLabel}>Speed</Text>
              </View>
            </View>

            <View style={styles.busInfoRow}>
              <View style={styles.busInfoItem}>
                <MaterialCommunityIcons name="bus" size={16} color="#6B6B6B" />
                <Text style={styles.busInfoText}>Bus No: —</Text>
              </View>
              <View style={styles.busInfoItem}>
                <MaterialCommunityIcons name="map-marker-distance" size={16} color="#6B6B6B" />
                <Text style={styles.busInfoText}>Stop: —</Text>
              </View>
            </View>

            <View style={styles.statusCard}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#0EA5E9" />
              <Text style={styles.statusText}>
                {busActive
                  ? 'Bus is on its way. ETA will update in real-time.'
                  : 'Bus tracking is not active yet. Check back during scheduled pickup time.'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoTitleRow}>
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color="#1A1B1C" />
                <Text style={styles.infoTitle}>Student Location</Text>
              </View>
              <View style={[styles.liveBadge, styles.liveBadgeActive]}>
                <View style={[styles.liveDot, styles.liveDotActive]} />
                <Text style={[styles.liveText, styles.liveTextActive]}>TRACKING</Text>
              </View>
            </View>

            <View style={styles.locationDetails}>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#F4C430" />
                <Text style={styles.locationLabel}>Latitude</Text>
                <Text style={styles.locationValue}>{studentLocation?.latitude?.toFixed(4) ?? '—'}</Text>
              </View>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="map-marker" size={16} color="#F4C430" />
                <Text style={styles.locationLabel}>Longitude</Text>
                <Text style={styles.locationValue}>{studentLocation?.longitude?.toFixed(4) ?? '—'}</Text>
              </View>
              <View style={styles.locationRow}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#6B6B6B" />
                <Text style={styles.locationLabel}>Last Updated</Text>
                <Text style={styles.locationValue}>{lastUpdated || '—'}</Text>
              </View>
            </View>

            {locationError ? (
              <View style={styles.errorCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.errorText}>{locationError}</Text>
              </View>
            ) : (
              <View style={styles.statusCard}>
                <MaterialCommunityIcons name="shield-check-outline" size={16} color="#16A34A" />
                <Text style={[styles.statusText, { color: '#15803D' }]}>
                  Your child&apos;s location is being tracked. Location updates every 30 seconds.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Mode Toggle — fixed at bottom */}
        <View style={styles.toggleBar}>
          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'student' && styles.toggleBtnActive]}
            onPress={() => setMode('student')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={20}
              color={mode === 'student' ? '#FFFFFF' : '#6B6B6B'}
            />
            <Text style={[styles.toggleLabel, mode === 'student' && styles.toggleLabelActive]}>
              Student Location
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, mode === 'bus' && styles.toggleBtnActive]}
            onPress={() => setMode('bus')}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="bus"
              size={20}
              color={mode === 'bus' ? '#FFFFFF' : '#6B6B6B'}
            />
            <Text style={[styles.toggleLabel, mode === 'bus' && styles.toggleLabelActive]}>
              Bus Location
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8, paddingTop: 80 },
  loadingText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#9CA3AF' },

  // Map
  mapContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    minHeight: 280,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapText: { fontSize: 16, fontFamily: FontFamily.bold, color: '#9CA3AF' },
  mapSub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#D1D5DB' },

  // Markers
  studentMarker: {
    position: 'absolute',
    top: '40%',
    left: '45%',
    marginLeft: -18,
    marginTop: -18,
  },
  studentMarkerInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4C430',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#F4C430',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  busMarker: {
    position: 'absolute',
    top: '45%',
    left: '40%',
    marginLeft: -20,
    marginTop: -20,
  },
  busMarkerInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  stopMarker: {
    position: 'absolute',
    top: '65%',
    right: '25%',
  },

  // Info Card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderBottomWidth: 0,
    gap: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { fontSize: 16, fontFamily: FontFamily.extrabold, color: '#1A1B1C' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(138, 138, 138, 0.1)',
  },
  liveBadgeActive: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  liveDotActive: { backgroundColor: '#22C55E' },
  liveText: { fontSize: 10, fontFamily: FontFamily.extrabold, color: '#9CA3AF', letterSpacing: 0.8 },
  liveTextActive: { color: '#22C55E' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#1A1B1C',
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNum: { fontSize: 18, fontFamily: FontFamily.extrabold, color: '#F4C430' },
  statLabel: { fontSize: 9, fontFamily: FontFamily.bold, color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  busInfoRow: { flexDirection: 'row', gap: 16 },
  busInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  busInfoText: { fontSize: 12, fontFamily: FontFamily.semibold, color: '#6B6B6B' },

  // Location details
  locationDetails: { gap: 8 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  locationLabel: { flex: 1, fontSize: 12, fontFamily: FontFamily.medium, color: '#6B6B6B' },
  locationValue: { fontSize: 13, fontFamily: FontFamily.bold, color: '#171717' },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  statusText: { flex: 1, fontSize: 12, fontFamily: FontFamily.regular, color: '#0369A1', lineHeight: 18 },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 12, fontFamily: FontFamily.regular, color: '#991B1B', lineHeight: 18 },

  // Toggle Bar
  toggleBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E5DC',
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  toggleBtnActive: {
    backgroundColor: '#1A1B1C',
    borderColor: '#1A1B1C',
  },
  toggleLabel: { fontSize: 13, fontFamily: FontFamily.bold, color: '#6B6B6B' },
  toggleLabelActive: { color: '#FFFFFF' },
});
