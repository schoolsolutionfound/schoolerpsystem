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
          tintColor="#000000"
          colors={['#000000']}
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
            <MaterialCommunityIcons name="map-marker" size={24} color="#FDC836" />
          </View>
        </View>

        {/* Bottom Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoTitleRow}>
              <MaterialCommunityIcons name="bus" size={20} color="#111827" />
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
              <MaterialCommunityIcons name="bus" size={16} color="#6B7280" />
              <Text style={styles.busInfoText}>Bus No: —</Text>
            </View>
            <View style={styles.busInfoItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color="#6B7280" />
              <Text style={styles.busInfoText}>Stop: —</Text>
            </View>
          </View>

          {/* Status Message */}
          <View style={styles.statusCard}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#FDC836" />
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
  container: { flex: 1, backgroundColor: '#FAF8F5' },
  mapContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    minHeight: 300,
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapText: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827' },
  mapSub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280' },
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
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    borderBottomWidth: 0,
    gap: 14,
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827' },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 5,
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
  liveText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#9CA3AF', letterSpacing: 0.8 },
  liveTextActive: { color: '#22C55E' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNum: { fontSize: 20, fontFamily: FontFamily.bold, color: '#111827' },
  statLabel: { fontSize: 10, fontFamily: FontFamily.semibold, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#E8E5DC', marginVertical: 4 },
  busInfoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  busInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  busInfoText: { fontSize: 12, color: '#111827', fontFamily: FontFamily.medium },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  statusText: { flex: 1, fontSize: 12, fontFamily: FontFamily.regular, color: '#111827', lineHeight: 18 },
});
