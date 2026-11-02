import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminBusRoute, getTransportOverviewApi } from '../../../api/transport';
import { BusMap } from '../../shared/maps/BusMap';
import { FontFamily } from '../../../constants/fonts';
import { AdmissionLiveTrackingSkeleton } from './skeletons/AdmissionSkeletons';

const POLL_INTERVAL_MS = 15000;

export const AdmissionLiveTrackingView: React.FC = () => {
  const [routes, setRoutes] = useState<AdminBusRoute[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const overview = await getTransportOverviewApi();
      if (!mountedRef.current) return;
      setRoutes(overview.routes);
      setError('');
      setSelectedRouteId((current) => {
        if (current && overview.routes.some((route) => route.id === current)) {
          return current;
        }
        return overview.routes[0]?.id ?? null;
      });
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err?.message || 'Could not load live bus tracking.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(() => load(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [load]);

  if (loading) {
    return <AdmissionLiveTrackingSkeleton />;
  }

  const selectedRoute = routes.find((route) => route.id === selectedRouteId) || null;
  const liveLocation = selectedRoute?.location ?? null;
  const isLive = !!selectedRoute?.liveTrip && !!liveLocation;
  const speed = liveLocation?.speed != null ? Math.round(Number(liveLocation.speed)) : null;
  const updatedLabel = liveLocation?.updatedAt
    ? new Date(liveLocation.updatedAt).toLocaleTimeString()
    : '—';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor="#000000"
          colors={['#000000']}
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      {routes.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routePills}
        >
          {routes.map((route) => {
            const active = route.id === selectedRouteId;
            return (
              <TouchableOpacity
                key={route.id}
                style={[styles.routePill, active && styles.routePillActive]}
                onPress={() => setSelectedRouteId(route.id)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="bus"
                  size={14}
                  color={active ? '#1A1B1C' : '#6B7280'}
                />
                <Text style={[styles.routePillText, active && styles.routePillTextActive]}>
                  {route.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#B45309" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {selectedRoute ? (
        <>
          {selectedRoute.stops.length > 0 ? (
            <BusMap
              stops={selectedRoute.stops}
              busLocation={liveLocation}
              isLive={isLive}
              height={300}
            />
          ) : (
            <View style={styles.mapPlaceholder}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={48} color="#D1D5DB" />
              <Text style={styles.mapText}>No stops on this route</Text>
              <Text style={styles.mapSub}>
                Add stops from the Transport tab to see this route on the map.
              </Text>
            </View>
          )}

          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoTitleRow}>
                <MaterialCommunityIcons name="bus" size={20} color="#111827" />
                <Text style={styles.infoTitle} numberOfLines={1}>
                  {selectedRoute.name}
                </Text>
              </View>
              <View style={[styles.liveBadge, isLive && styles.liveBadgeActive]}>
                <View style={[styles.liveDot, isLive && styles.liveDotActive]} />
                <Text style={[styles.liveText, isLive && styles.liveTextActive]}>
                  {isLive ? 'LIVE' : 'OFFLINE'}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{selectedRoute.stops.length}</Text>
                <Text style={styles.statLabel}>Stops</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum}>{speed != null ? `${speed}` : '—'}</Text>
                <Text style={styles.statLabel}>km/h</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={styles.statNum} numberOfLines={1}>
                  {updatedLabel}
                </Text>
                <Text style={styles.statLabel}>Updated</Text>
              </View>
            </View>

            <View style={styles.busInfoRow}>
              <View style={styles.busInfoItem}>
                <MaterialCommunityIcons name="bus" size={16} color="#6B7280" />
                <Text style={styles.busInfoText}>
                  Bus: {selectedRoute.vehicle?.registrationNo || 'Unassigned'}
                </Text>
              </View>
              <View style={styles.busInfoItem}>
                <MaterialCommunityIcons name="account" size={16} color="#6B7280" />
                <Text style={styles.busInfoText} numberOfLines={1}>
                  Driver: {selectedRoute.driver?.fullName || 'Unassigned'}
                </Text>
              </View>
            </View>

            <View style={styles.statusCard}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#FDC836" />
              <Text style={styles.statusText}>
                {isLive
                  ? 'Bus location refreshes automatically every 15 seconds.'
                  : 'Tracking starts automatically when the driver begins the trip.'}
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="bus-alert" size={48} color="#D1D5DB" />
          <Text style={styles.mapText}>No bus routes yet</Text>
          <Text style={styles.mapSub}>
            Create routes, stops, and driver assignments from the Transport tab.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#FAF8F5' },
  content: { flexGrow: 1, padding: 12, gap: 12 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, fontFamily: FontFamily.medium, color: '#6B7280' },

  routePills: { gap: 8, paddingVertical: 2 },
  routePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  routePillActive: { backgroundColor: '#F4C430', borderColor: '#F4C430' },
  routePillText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280' },
  routePillTextActive: { color: '#1A1B1C', fontFamily: FontFamily.bold },

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
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  infoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  infoTitle: { fontSize: 16, fontFamily: FontFamily.bold, color: '#111827', flex: 1 },
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
  statLabel: { fontSize: 9, fontFamily: FontFamily.medium, color: '#6B7280', letterSpacing: 0.4 },
  statDivider: { width: 1, backgroundColor: '#E8E5DC' },

  busInfoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  busInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  busInfoText: { fontSize: 12, fontFamily: FontFamily.medium, color: '#6B7280', flexShrink: 1 },

  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F5E6B8',
  },
  statusText: { flex: 1, fontSize: 11, fontFamily: FontFamily.medium, color: '#6B5330', lineHeight: 16 },

  emptyState: {
    flex: 1,
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
});
