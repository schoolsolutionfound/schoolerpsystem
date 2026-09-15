import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Animated, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BorderRadius } from '../../../constants/theme';
import { FontFamily } from '../../../constants/fonts';
import { BusTrackingSkeleton } from './skeletons';
import { ShimmerProvider } from './ShimmerSkeleton';

export const StudentBusTrackingView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busActive, setBusActive] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (busActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [busActive, pulseAnim]);

  const load = useCallback(async () => {
    try {
      await new Promise((r) => setTimeout(r, 600));
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
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <ShimmerProvider><BusTrackingSkeleton /></ShimmerProvider>
      </ScrollView>
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
            <Text style={styles.mapSub}>Bus location will appear here</Text>
          </View>

          {/* Simulated bus marker */}
          {busActive && (
            <Animated.View style={[styles.busMarker, { transform: [{ scale: pulseAnim }] }]}>
              <View style={styles.busMarkerInner}>
                <MaterialCommunityIcons name="bus" size={20} color="#FFFFFF" />
              </View>
            </Animated.View>
          )}

          {/* Simulated student stop marker */}
          <View style={styles.stopMarker}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#F4C430" />
          </View>
        </View>

        {/* Bottom Info Card */}
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

          {/* Stats Row */}
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

          {/* Bus Info */}
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

          {/* Status Message */}
          <View style={styles.statusCard}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#0EA5E9" />
            <Text style={styles.statusText}>
              {busActive
                ? 'Bus is on its way. ETA will update in real-time.'
                : 'Bus tracking is not active yet. Check back during your scheduled pickup time.'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  container: { flex: 1 },
  mapContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    position: 'relative',
    minHeight: 300,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapText: { fontSize: 16, fontWeight: '700', color: '#9CA3AF' },
  mapSub: { fontSize: 12, color: '#D1D5DB' },
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
  infoTitle: { fontSize: 16, fontWeight: '800', color: '#1A1B1C' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(138, 138, 138, 0.1)',
  },
  liveBadgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
  },
  liveDotActive: {
    backgroundColor: '#22C55E',
  },
  liveText: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8 },
  liveTextActive: { color: '#22C55E' },
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
  statNum: { fontSize: 18, fontWeight: '800', color: '#F4C430' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },
  busInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  busInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  busInfoText: { fontSize: 12, color: '#6B6B6B', fontWeight: '600' },
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
  statusText: { flex: 1, fontSize: 12, color: '#0369A1', lineHeight: 18 },
});
