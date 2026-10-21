import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusMap } from '../../shared/maps/BusMap';
import { useDriverLocationBroadcast } from '../hooks/useDriverLocationBroadcast';
import { USE_REAL_DRIVER_GPS, SHOW_DRIVER_SIMULATOR } from '../../../constants/featureFlags';
import {
  getDriverAssignmentApi,
  startDriverTripApi,
  updateDriverLocationApi,
  endDriverTripApi,
  DriverAssignmentData,
  BusStop,
} from '../../../api/transport';

export const DriverTripsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [assignment, setAssignment] = useState<DriverAssignmentData | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [autoBroadcast, setAutoBroadcast] = useState(false);
  const [simCoords, setSimCoords] = useState<{ lat: number; lng: number; speed: number } | null>(null);
  const [showMapModal, setShowMapModal] = useState(false);

  const broadcastTimerRef = useRef<any>(null);

  const fetchAssignment = useCallback(async () => {
    try {
      const data = await getDriverAssignmentApi();
      setAssignment(data);
      if (data.hasLiveTrip && data.liveTrip) {
        setActiveTripId(data.liveTrip.id);
      } else {
        setActiveTripId(null);
      }
    } catch (err: any) {
      console.warn('[DriverTripsView] Failed to fetch assignment:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const isLive = !!activeTripId;
  const stops: BusStop[] = assignment?.stops || [];

  // ─── Real GPS broadcasting via expo-location ───
  const gps = useDriverLocationBroadcast(activeTripId, isLive);

  // Derive the bus location to display: prefer real GPS fix, fall back to sim coords
  const displayLocation = gps.lastFix
    ? {
        latitude: gps.lastFix.latitude,
        longitude: gps.lastFix.longitude,
        speed: gps.lastFix.speed,
        heading: gps.lastFix.heading,
      }
    : simCoords
    ? { latitude: simCoords.lat, longitude: simCoords.lng, speed: simCoords.speed }
    : null;

  // Display speed: prefer GPS, fall back to sim
  const displaySpeed = gps.lastFix?.speed ?? simCoords?.speed ?? null;

  // Manual simulation location sender (fallback for dev / web)
  const broadcastSimLocation = useCallback(
    async (lat: number, lng: number, speed: number = 28) => {
      if (!activeTripId) return;
      try {
        await updateDriverLocationApi(activeTripId, {
          latitude: lat,
          longitude: lng,
          speed,
          heading: 180,
        });
        setSimCoords({ lat, lng, speed });
      } catch (err: any) {
        if (
          err?.message?.includes('Location can only be reported') ||
          err?.message?.includes('not active') ||
          err?.message?.includes('TRIP_NOT_LIVE') ||
          err?.code === 'TRIP_NOT_LIVE'
        ) {
          setActiveTripId(null);
          setAutoBroadcast(false);
          fetchAssignment();
        } else {
          console.warn('[DriverTripsView] Simulation broadcast failed:', err.message);
        }
      }
    },
    [activeTripId, fetchAssignment]
  );

  // Advance simulation to next stop along the route
  const handleNextStop = useCallback(() => {
    if (stops.length === 0) return;
    const nextIdx = (currentStopIndex + 1) % stops.length;
    setCurrentStopIndex(nextIdx);
    const stop = stops[nextIdx];
    broadcastSimLocation(stop.latitude, stop.longitude, 32);
  }, [stops, currentStopIndex, broadcastSimLocation]);

  // Auto-broadcast simulation loop when enabled
  useEffect(() => {
    if (isLive && autoBroadcast && stops.length > 0) {
      broadcastTimerRef.current = setInterval(() => {
        setCurrentStopIndex((prev) => {
          const next = (prev + 1) % stops.length;
          const stop = stops[next];
          broadcastSimLocation(stop.latitude, stop.longitude, Math.floor(25 + Math.random() * 15));
          return next;
        });
      }, 5000);
    } else {
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    }
    return () => {
      if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    };
  }, [isLive, autoBroadcast, stops, broadcastSimLocation]);

  const handleStartTrip = async () => {
    setActionLoading(true);
    try {
      const trip = await startDriverTripApi('pickup');
      setActiveTripId(trip.id);
      setCurrentStopIndex(0);
      await fetchAssignment();
    } catch (err: any) {
      Alert.alert('Cannot Start Trip', err.message || 'Failed to start trip.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndTrip = async () => {
    if (!activeTripId) return;
    setActionLoading(true);
    setAutoBroadcast(false);
    if (broadcastTimerRef.current) clearInterval(broadcastTimerRef.current);
    try {
      await endDriverTripApi(activeTripId);
    } catch (err: any) {
      console.warn('[DriverTripsView] End trip notice:', err.message);
    } finally {
      setActiveTripId(null);
      setSimCoords(null);
      await fetchAssignment();
      setActionLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0EA5E9" />
        <Text style={styles.loadingText}>Loading assigned route & bus...</Text>
      </View>
    );
  }

  const routeName = assignment?.route?.name || 'No route assigned';
  const regNo = assignment?.vehicle?.registrationNo || 'N/A';

  // GPS status label for the broadcast card
  const gpsStatusLabel = (() => {
    switch (gps.status) {
      case 'acquiring': return 'Acquiring GPS...';
      case 'sharing': return 'GPS Live — Sharing Location';
      case 'offline': return 'Connection Lost — Retrying...';
      case 'permission_needed': return 'Location Permission Needed';
      case 'error': return gps.error || 'GPS Error';
      default: return 'GPS Idle';
    }
  })();

  const gpsStatusColor = (() => {
    switch (gps.status) {
      case 'sharing': return '#16A34A';
      case 'acquiring': return '#F59E0B';
      case 'offline': return '#EF4444';
      case 'permission_needed': return '#DC2626';
      case 'error': return '#DC2626';
      default: return '#9CA3AF';
    }
  })();

  return (
    <View style={styles.container}>
      {/* Hero Block */}
      <View style={styles.heroBlock}>
        <View style={styles.heroRow}>
          <View style={[styles.heroIconWrap, isLive && styles.heroIconWrapLive]}>
            <MaterialCommunityIcons name="bus-side" size={26} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {routeName}
            </Text>
            <Text style={styles.heroSub}>
              Bus {regNo} • {today}
            </Text>
          </View>
          <View style={[styles.statusBadge, isLive && styles.statusBadgeActive]}>
            <View style={[styles.statusDot, isLive && styles.statusDotActive]} />
            <Text style={[styles.statusText, isLive && styles.statusTextActive]}>
              {isLive ? 'LIVE' : 'IDLE'}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}>
            <MaterialCommunityIcons name="bus" size={18} color="#F4C430" />
            <Text style={styles.statNum} numberOfLines={1}>
              {regNo}
            </Text>
            <Text style={styles.statLabel}>Vehicle</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <MaterialCommunityIcons name="map-marker-radius" size={18} color="#F4C430" />
            <Text style={styles.statNum}>{stops.length}</Text>
            <Text style={styles.statLabel}>Stops</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <MaterialCommunityIcons name="speedometer" size={18} color="#F4C430" />
            <Text style={styles.statNum}>
              {displaySpeed != null ? `${displaySpeed} km/h` : '0 km/h'}
            </Text>
            <Text style={styles.statLabel}>Speed</Text>
          </View>
        </View>
      </View>

      {/* Start / End Tracking Button */}
      {isLive ? (
        <TouchableOpacity
          style={[styles.trackBtn, styles.trackBtnEnd]}
          onPress={handleEndTrip}
          disabled={actionLoading}
          activeOpacity={0.85}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="stop-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.trackBtnText}>End Active Trip</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={handleStartTrip}
          disabled={actionLoading}
          activeOpacity={0.85}
        >
          {actionLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="play-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.trackBtnText}>Start Live Trip</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Live GPS Status Card (shown when trip is active and real GPS is enabled) */}
      {isLive && USE_REAL_DRIVER_GPS && (
        <View style={styles.broadcastCard}>
          <View style={styles.broadcastHeader}>
            <View style={styles.broadcastHeaderLeft}>
              <View style={[styles.pulseDot, { backgroundColor: gpsStatusColor }]} />
              <Text style={styles.broadcastTitle}>{gpsStatusLabel}</Text>
            </View>
            <View style={[styles.autoPill, styles.autoPillGps]}>
              <Text style={[styles.autoPillText, styles.autoPillGpsText]}>
                {USE_REAL_DRIVER_GPS ? 'REAL GPS' : 'SIM'}
              </Text>
            </View>
          </View>

          {/* Permission needed prompt */}
          {gps.status === 'permission_needed' && (
            <View style={styles.permRow}>
              <Text style={styles.permText}>
                Location permission is required to share bus position with students and parents.
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={styles.permBtn} onPress={gps.retry}>
                  <Text style={styles.permBtnText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.permBtn, styles.permBtnSec]} onPress={gps.openSettings}>
                  <Text style={[styles.permBtnText, styles.permBtnSecText]}>Open Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* GPS fix details when sharing */}
          {gps.status === 'sharing' && gps.lastFix && (
            <View style={styles.gpsStatusCard}>
              <View style={styles.gpsStatusHeader}>
                <Text style={styles.coordText}>
                  {gps.lastFix.latitude.toFixed(6)}, {gps.lastFix.longitude.toFixed(6)}
                </Text>
                {gps.lastSentAt && (
                  <Text style={styles.lastSentText}>
                    Sent {Math.round((Date.now() - gps.lastSentAt) / 1000)}s ago
                  </Text>
                )}
              </View>
              <View style={styles.fixDetailsRow}>
                <Text style={styles.fixMetaText}>
                  Speed: {gps.lastFix.speed ?? 0} km/h
                </Text>
                <Text style={styles.fixMetaText}>
                  Accuracy: ±{gps.lastFix.accuracy ?? '?'}m
                </Text>
                {gps.lastFix.heading != null && (
                  <Text style={styles.fixMetaText}>
                    Heading: {gps.lastFix.heading}°
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Offline / error retry */}
          {(gps.status === 'offline' || gps.status === 'error') && (
            <View style={styles.warningNotice}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#92400E" />
              <Text style={styles.warningNoticeText}>
                {gps.error || 'Location updates paused. Will retry automatically.'}
              </Text>
              <TouchableOpacity onPress={gps.retry}>
                <Text style={{ color: '#0EA5E9', fontWeight: '700', fontSize: 12 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Developer Route Simulator (Visible while trip is live, dev only) */}
      {isLive && SHOW_DRIVER_SIMULATOR && (
        <View style={[styles.broadcastCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <View style={styles.simNotice}>
            <Text style={[styles.broadcastTitle, { color: '#92400E' }]}>Dev Simulator</Text>
          </View>

          <View style={[styles.simulatorSection, { borderTopColor: '#FDE68A' }]}>
            <View style={styles.simHeader}>
              <Text style={styles.simHeaderTitle}>Manual Stop Control</Text>
              <TouchableOpacity
                style={[styles.autoPill, autoBroadcast && styles.autoPillActive]}
                onPress={() => setAutoBroadcast(!autoBroadcast)}
              >
                <Text style={[styles.autoPillText, autoBroadcast && styles.autoPillTextActive]}>
                  {autoBroadcast ? 'Auto-Move ON' : 'Auto-Move OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={handleNextStop}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="map-marker-right" size={18} color="#0EA5E9" />
              <Text style={styles.simulateBtnText}>
                Simulate Next Stop ({stops[currentStopIndex]?.name || 'Route'})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Route Stops Sequence */}
      <View style={styles.stopsCard}>
        <View style={styles.stopsHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="map-marker-path" size={18} color="#0EA5E9" />
            <Text style={styles.stopsTitle}>Route Stops ({stops.length})</Text>
          </View>
          <TouchableOpacity
            style={styles.viewRouteBtn}
            onPress={() => setShowMapModal(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="map-outline" size={14} color="#0EA5E9" />
            <Text style={styles.viewRouteText}>View Map</Text>
          </TouchableOpacity>
        </View>

        {/* Route Map Modal for Driver */}
        <Modal
          visible={showMapModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowMapModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{routeName}</Text>
                <Text style={styles.modalSub}>{stops.length} Stops • Bus {regNo}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowMapModal(false)}
              >
                <MaterialCommunityIcons name="close" size={20} color="#1A1B1C" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, padding: 16 }}>
              <BusMap
                stops={stops}
                busLocation={displayLocation}
                isLive={isLive}
                height={500}
              />
            </View>
          </View>
        </Modal>

        <View style={styles.timelineList}>
          {stops.map((stop, index) => {
            const isCurrent = isLive && index === currentStopIndex;
            const isLast = index === stops.length - 1;

            return (
              <View key={stop.id} style={styles.stopRow}>
                <View style={styles.stopIndicatorCol}>
                  <View
                    style={[
                      styles.stopDot,
                      isCurrent && styles.stopDotCurrent,
                      index < currentStopIndex && styles.stopDotPassed,
                    ]}
                  >
                    {isCurrent && <View style={styles.stopDotInner} />}
                  </View>
                  {!isLast && <View style={styles.stopLine} />}
                </View>

                <View style={styles.stopInfoCol}>
                  <View style={styles.stopNameRow}>
                    <Text
                      style={[
                        styles.stopName,
                        isCurrent && styles.stopNameCurrent,
                      ]}
                    >
                      {stop.name}
                    </Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>BUS HERE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.stopCoords}>
                    Stop #{stop.sequence} • {Number(stop.latitude).toFixed(4)},{' '}
                    {Number(stop.longitude).toFixed(4)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Quick Emergency / Support Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => Linking.openURL('tel:100')}
        >
          <MaterialCommunityIcons name="phone-alert" size={24} color="#DC3545" />
          <Text style={styles.actionText}>Emergency</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={fetchAssignment}>
          <MaterialCommunityIcons name="refresh" size={24} color="#0EA5E9" />
          <Text style={styles.actionText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { fontSize: 13, color: '#6B6B6B' },

  heroBlock: {
    backgroundColor: '#1A1B1C',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2A2B2C',
    gap: 14,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIconWrapLive: {
    backgroundColor: '#16A34A',
  },
  heroTitle: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  heroSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(138, 138, 138, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(138, 138, 138, 0.3)',
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.6)',
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' },
  statusDotActive: { backgroundColor: '#22C55E' },
  statusText: { fontSize: 10, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.8 },
  statusTextActive: { color: '#22C55E' },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#232425',
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#2A2B2C',
  },
  statCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  statNum: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  statLabel: { fontSize: 9, fontWeight: '700', color: '#8A8A8A', textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, backgroundColor: '#2F3031', marginVertical: 4 },

  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0EA5E9',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#0EA5E9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trackBtnEnd: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
  },
  trackBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },

  broadcastCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 10,
  },
  broadcastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  broadcastHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' },
  broadcastTitle: { fontSize: 14, fontWeight: '800', color: '#166534' },
  autoPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
  },
  autoPillActive: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  autoPillGps: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  autoPillGpsText: {
    color: '#15803D',
    fontWeight: '800',
  },
  autoPillSim: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  autoPillSimText: {
    color: '#B45309',
    fontWeight: '800',
  },
  autoPillText: { fontSize: 11, fontWeight: '700', color: '#6B7280' },
  autoPillTextActive: { color: '#15803D' },
  gpsActiveNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gpsActiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  broadcastSub: { fontSize: 12, color: '#374151' },
  coordText: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace' },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0EA5E9',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  simulateBtnText: { fontSize: 13, fontWeight: '700', color: '#0EA5E9' },
  simulateBtnDisabled: { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  simulateBtnTextDisabled: { color: '#9CA3AF' },

  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningNoticeText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },

  gpsStatusCard: {
    gap: 6,
    paddingTop: 2,
  },
  gpsStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastSentText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '700',
  },
  fixDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  fixMetaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },

  permRow: {
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  permText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
  },
  permBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  permBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  permBtnSec: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  permBtnSecText: {
    color: '#DC2626',
  },

  simNotice: {
    paddingVertical: 4,
  },
  simulatorSection: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#BBF7D0',
    paddingTop: 8,
    gap: 6,
  },
  simHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  simHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  simDisabledNotice: {
    fontSize: 10,
    color: '#6B7280',
    fontStyle: 'italic',
  },

  stopsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 14,
  },
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopsTitle: { fontSize: 14, fontWeight: '800', color: '#171717' },
  viewRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  viewRouteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0EA5E9',
  },

  // Driver Route Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  timelineList: { gap: 0, paddingLeft: 6 },
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 48 },
  stopIndicatorCol: { alignItems: 'center', width: 20 },
  stopDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopDotCurrent: {
    borderColor: '#0EA5E9',
    backgroundColor: '#E0F2FE',
  },
  stopDotPassed: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  stopDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#0EA5E9',
  },
  stopLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    minHeight: 28,
  },
  stopInfoCol: { flex: 1, paddingLeft: 12, paddingBottom: 16 },
  stopNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stopName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  stopNameCurrent: { color: '#0EA5E9', fontWeight: '800' },
  currentBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: { fontSize: 9, fontWeight: '800', color: '#0284C7' },
  stopCoords: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  actionText: { fontSize: 11, fontWeight: '700', color: '#171717' },
});
