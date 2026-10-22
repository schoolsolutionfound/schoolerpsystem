import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusStop } from '../../../api/transport';
import { BusMap } from '../../shared/maps/BusMap';

export interface DriverTripStopsTimelineProps {
  stops: BusStop[];
  currentStopIndex: number;
  isLive: boolean;
  routeName: string;
  regNo: string;
  displayLocation: { latitude: number; longitude: number; speed?: number | null; heading?: number | null } | null;
}

export const DriverTripStopsTimeline: React.FC<DriverTripStopsTimelineProps> = ({
  stops,
  currentStopIndex,
  isLive,
  routeName,
  regNo,
  displayLocation,
}) => {
  const [showMapModal, setShowMapModal] = useState(false);

  return (
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
              <Text style={styles.modalSub}>
                {stops.length} Stops • Bus {regNo}
              </Text>
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
  );
};

const styles = StyleSheet.create({
  stopsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 16,
  },
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1B1C',
  },
  viewRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    borderRadius: 6,
  },
  viewRouteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0EA5E9',
  },
  timelineList: {
    gap: 0,
  },
  stopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stopIndicatorCol: {
    alignItems: 'center',
    width: 20,
  },
  stopDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  stopDotPassed: {
    backgroundColor: '#9CA3AF',
  },
  stopDotCurrent: {
    backgroundColor: '#0EA5E9',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stopDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  stopLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 2,
  },
  stopInfoCol: {
    flex: 1,
    paddingBottom: 20,
    gap: 2,
  },
  stopNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  stopNameCurrent: {
    color: '#0EA5E9',
    fontWeight: '800',
  },
  stopCoords: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  currentBadge: {
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0EA5E9',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1B1C',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
