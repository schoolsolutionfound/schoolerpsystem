import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { BusStop } from '../../../api/transport';
import { UseDriverLocationBroadcastReturn } from '../hooks/useDriverLocationBroadcast';
import { USE_REAL_DRIVER_GPS, SHOW_DRIVER_SIMULATOR } from '../../../constants/featureFlags';

export interface DriverTripBroadcastCardProps {
  isLive: boolean;
  autoBroadcast: boolean;
  onToggleAutoBroadcast: (enabled: boolean) => void;
  stops: BusStop[];
  currentStopIndex: number;
  displaySpeed: number | null;
  gps: UseDriverLocationBroadcastReturn;
  onSimulateNextStop: () => void;
}

export const DriverTripBroadcastCard: React.FC<DriverTripBroadcastCardProps> = ({
  isLive,
  autoBroadcast,
  onToggleAutoBroadcast,
  stops,
  currentStopIndex,
  displaySpeed,
  gps,
  onSimulateNextStop,
}) => {
  if (!isLive) return null;

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
    <>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionTitle}>Live Tracking</Text>
          <View style={styles.sectionUnderline} />
        </View>
      </View>

      {/* Broadcast Mode Segment Control (Live GPS vs Auto-Simulation) */}
      <View style={styles.modeSegmentContainer}>
        <TouchableOpacity
          style={[styles.modeSegmentBtn, !autoBroadcast && styles.modeSegmentBtnActive]}
          onPress={() => onToggleAutoBroadcast(false)}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeSegmentText, !autoBroadcast && styles.modeSegmentTextActive]}>
            Real GPS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeSegmentBtn, autoBroadcast && styles.modeSegmentBtnActive]}
          onPress={() => onToggleAutoBroadcast(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.modeSegmentText, autoBroadcast && styles.modeSegmentTextActive]}>
            Auto Simulation
          </Text>
        </TouchableOpacity>
      </View>

      {/* Auto-Simulation Status Banner */}
      {autoBroadcast && (
        <View style={[styles.broadcastCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <View style={styles.broadcastHeader}>
            <View style={styles.broadcastHeaderLeft}>
              <View style={[styles.pulseDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.broadcastTitle, { color: '#92400E' }]}>
                Auto-Simulation Active
              </Text>
            </View>
            <View style={[styles.autoPill, { backgroundColor: '#FDE68A' }]}>
              <Text style={[styles.autoPillText, { color: '#92400E' }]}>
                STOP {currentStopIndex + 1}/{stops.length}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#78350F', fontWeight: '700', marginTop: 4 }}>
            Now at: {stops[currentStopIndex]?.name || 'Route'} (Moving @ {displaySpeed || 32} km/h)
          </Text>
          <Text style={{ fontSize: 11, color: '#92400E', marginTop: 2 }}>
            Broadcasting live coordinates every 3.5s to students & parents. Tap "Real GPS" above to switch back.
          </Text>
        </View>
      )}

      {/* Live GPS Status Card */}
      {!autoBroadcast && USE_REAL_DRIVER_GPS && (
        <View style={styles.broadcastCard}>
          <View style={styles.broadcastHeader}>
            <View style={styles.broadcastHeaderLeft}>
              <View style={[styles.pulseDot, { backgroundColor: gpsStatusColor }]} />
              <Text style={styles.broadcastTitle}>{gpsStatusLabel}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {gps.isBackgroundEnabled && (
                <View style={[styles.autoPill, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.autoPillText, { color: '#16A34A' }]}>
                    BACKGROUND
                  </Text>
                </View>
              )}
              <View style={[styles.autoPill, styles.autoPillGps]}>
                <Text style={[styles.autoPillText, styles.autoPillGpsText]}>
                  {USE_REAL_DRIVER_GPS ? 'REAL GPS' : 'SIM'}
                </Text>
              </View>
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
              <Text style={styles.warningNoticeText}>
                {gps.error || 'Location updates paused. Will retry automatically.'}
              </Text>
              <TouchableOpacity onPress={gps.retry}>
                <Text style={{ color: '#D97706', fontWeight: '700', fontSize: 12 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Developer Route Simulator (Visible while trip is live, dev only) */}
      {SHOW_DRIVER_SIMULATOR && (
        <View style={[styles.broadcastCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <View style={styles.simNotice}>
            <Text style={[styles.broadcastTitle, { color: '#92400E' }]}>Dev Simulator</Text>
          </View>

          <View style={[styles.simulatorSection, { borderTopColor: '#FDE68A' }]}>
            <View style={styles.simHeader}>
              <Text style={styles.simHeaderTitle}>Manual Stop Control</Text>
              <TouchableOpacity
                style={[styles.autoPill, autoBroadcast && styles.autoPillActive]}
                onPress={() => onToggleAutoBroadcast(!autoBroadcast)}
              >
                <Text style={[styles.autoPillText, autoBroadcast && styles.autoPillTextActive]}>
                  {autoBroadcast ? 'Auto-Move ON' : 'Auto-Move OFF'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.simulateBtn}
              onPress={onSimulateNextStop}
              activeOpacity={0.8}
            >
              <Text style={styles.simulateBtnText}>
                Simulate Next Stop ({stops[currentStopIndex]?.name || 'Route'})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#171717',
  },
  sectionUnderline: {
    height: 3,
    width: 44,
    borderRadius: 2,
    backgroundColor: '#F4C430',
    marginTop: 4,
  },
  modeSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 7,
    padding: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  modeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 5,
  },
  modeSegmentBtnActive: {
    backgroundColor: '#F4C430',
    shadowColor: '#171717',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  modeSegmentText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  modeSegmentTextActive: {
    color: '#171717',
  },
  broadcastCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 8,
  },
  broadcastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  broadcastHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  broadcastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171717',
  },
  autoPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E8E5DC',
  },
  autoPillActive: {
    backgroundColor: '#F4C430',
    borderColor: '#EAB308',
  },
  autoPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6B7280',
  },
  autoPillTextActive: {
    color: '#171717',
  },
  autoPillGps: {
    backgroundColor: '#FFF4C7',
    borderColor: '#FDE68A',
  },
  autoPillGpsText: {
    color: '#B45309',
  },
  permRow: {
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 4,
  },
  permText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 18,
  },
  permBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    borderColor: '#FECACA',
  },
  permBtnSecText: {
    color: '#DC2626',
  },
  gpsStatusCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 6,
  },
  gpsStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coordText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
    fontFamily: 'monospace',
  },
  lastSentText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
  },
  fixDetailsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fixMetaText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  warningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 6,
  },
  warningNoticeText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
  },
  simNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simulatorSection: {
    borderTopWidth: 1,
    paddingTop: 8,
    gap: 8,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78350F',
  },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  simulateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
});
