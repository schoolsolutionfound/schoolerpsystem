import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  MyBusData,
  getMyBusApi,
  subscribeToBusStream,
} from '../../../api/transport';
import { FontFamily } from '../../../constants/fonts';
import { BusMap } from '../maps/BusMap';

interface BusTrackingViewProps {
  audience: 'student' | 'parent';
}

export const BusTrackingView: React.FC<BusTrackingViewProps> = ({ audience }) => {
  const [data, setData] = useState<MyBusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [canStream, setCanStream] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    try {
      const result = await getMyBusApi();
      if (!mountedRef.current) return;
      setData(result);
      setError('');
      setCanStream(true);
    } catch (err: any) {
      if (!mountedRef.current) return;
      setCanStream(false);
      setData(null);
      const code = String(err?.code || '');
      if (code === 'TRANSPORT_NOT_ASSIGNED') {
        setError(
          audience === 'parent'
            ? 'No school bus is assigned to your child yet. Please contact the school office.'
            : 'No school bus is assigned to you yet. Please contact the school office.'
        );
      } else {
        setError(err?.message || 'Could not load live bus tracking.');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [audience]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  // Live updates pushed from the driver's device via SSE.
  useEffect(() => {
    if (!canStream) return;
    const unsubscribe = subscribeToBusStream(
      (payload) => {
        if (!mountedRef.current) return;
        if (payload.type === 'INITIAL') {
          setData(payload.data);
          setError('');
          return;
        }
        if (payload.type === 'LOCATION_UPDATE') {
          setData((prev) => {
            if (!prev) return prev;
            const nextStop = payload.currentStop ?? prev.currentStop;
            let nextRemaining = prev.stopsRemaining;
            if (payload.currentStop && prev.stop) {
              const tripType = prev.trip?.tripType ?? 'pickup';
              nextRemaining =
                tripType === 'dropoff'
                  ? payload.currentStop.sequence - prev.stop.sequence
                  : prev.stop.sequence - payload.currentStop.sequence;
            }
            return {
              ...prev,
              isLive: true,
              location: {
                latitude: Number(payload.location.latitude),
                longitude: Number(payload.location.longitude),
                speed: payload.location.speed,
                heading: payload.location.heading,
                updatedAt: String(payload.location.updatedAt),
              },
              currentStop: nextStop,
              stopsRemaining: nextRemaining,
            };
          });
          return;
        }
        if (payload.type === 'TRIP_STARTED') {
          setData((prev) => (prev ? { ...prev, isLive: true, trip: payload.trip } : prev));
          return;
        }
        if (payload.type === 'TRIP_ENDED') {
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  isLive: false,
                  location: null,
                  currentStop: null,
                  stopsRemaining: null,
                  trip: null,
                }
              : prev
          );
        }
      },
      () => {
        // Stream failures are non-fatal; the next reconnect or pull-to-refresh recovers.
      }
    );
    return unsubscribe;
  }, [canStream]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#F4C430" />
        <Text style={styles.loadingText}>Connecting to the bus...</Text>
      </View>
    );
  }

  const isLive = !!data?.isLive && !!data?.location;
  const speed = data?.location?.speed != null ? Math.round(Number(data.location.speed)) : null;
  const stopsRemaining = data?.stopsRemaining;
  const etaLabel =
    stopsRemaining === null || stopsRemaining === undefined
      ? '—'
      : stopsRemaining < 0
        ? 'Passed'
        : stopsRemaining === 0
          ? 'Arriving'
          : `${stopsRemaining} stop${stopsRemaining === 1 ? '' : 's'}`;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
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
      <View style={styles.root}>
        {data && data.stops.length > 0 ? (
          <BusMap
            stops={data.stops}
            roadPath={data.roadPath}
            busLocation={isLive ? data.location : null}
            studentStopId={data.stop?.id}
            isLive={isLive}
            height={300}
          />
        ) : (
          <View style={styles.mapPlaceholder}>
            <MaterialCommunityIcons name="map-outline" size={48} color="#D1D5DB" />
            <Text style={styles.mapText}>Live map</Text>
            <Text style={styles.mapSub}>
              {error
                ? 'Bus route will appear once the school assigns transport.'
                : 'Waiting for the driver to start the trip.'}
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoTitleRow}>
              <MaterialCommunityIcons name="bus" size={20} color="#111827" />
              <Text style={styles.infoTitle}>
                {audience === 'parent' ? "Child's Bus" : 'My Bus'}
              </Text>
            </View>
            <View style={[styles.liveBadge, isLive && styles.liveBadgeActive]}>
              <View style={[styles.liveDot, isLive && styles.liveDotActive]} />
              <Text style={[styles.liveText, isLive && styles.liveTextActive]}>
                {isLive ? 'LIVE' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          {!!error && (
            <View style={styles.errorCard}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#B45309" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statNum} numberOfLines={1}>
                {data?.route?.name || '—'}
              </Text>
              <Text style={styles.statLabel}>Route</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{etaLabel}</Text>
              <Text style={styles.statLabel}>To your stop</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statNum}>{speed != null ? `${speed}` : '—'}</Text>
              <Text style={styles.statLabel}>km/h</Text>
            </View>
          </View>

          <View style={styles.busInfoRow}>
            <View style={styles.busInfoItem}>
              <MaterialCommunityIcons name="bus" size={16} color="#6B7280" />
              <Text style={styles.busInfoText}>
                Bus: {data?.vehicle?.registrationNo || '—'}
              </Text>
            </View>
            <View style={styles.busInfoItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={16} color="#6B7280" />
              <Text style={styles.busInfoText}>
                My stop: {data?.stop?.name || '—'}
              </Text>
            </View>
          </View>

          <View style={styles.statusCard}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#FDC836" />
            <Text style={styles.statusText}>
              {isLive
                ? data?.currentStop
                  ? `Bus is near ${data.currentStop.name}.`
                  : 'Bus is on the way. The map updates in real time.'
                : 'Tracking starts automatically when the driver begins the trip.'}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  root: { flex: 1, backgroundColor: '#FAF8F5', padding: 12, gap: 12 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#6B7280' },

  mapPlaceholder: {
    height: 300,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  mapText: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827' },
  mapSub: { fontSize: 12, fontFamily: FontFamily.regular, color: '#6B7280', textAlign: 'center' },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 12,
  },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  liveBadgeActive: { backgroundColor: 'rgba(34, 197, 94, 0.1)' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  liveDotActive: { backgroundColor: '#22C55E' },
  liveText: { fontSize: 10, fontFamily: FontFamily.bold, color: '#9CA3AF', letterSpacing: 0.8 },
  liveTextActive: { color: '#22C55E' },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  errorText: { flex: 1, fontSize: 11, fontFamily: FontFamily.medium, color: '#92400E', lineHeight: 16 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 },
  statNum: { fontSize: 15, fontFamily: FontFamily.bold, color: '#111827', textAlign: 'center' },
  statLabel: {
    fontSize: 9,
    fontFamily: FontFamily.semibold,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  statDivider: { width: 1, backgroundColor: '#E8E5DC', marginVertical: 4 },

  busInfoRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
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
