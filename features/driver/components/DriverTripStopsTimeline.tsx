import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal } from 'react-native';
import { BusStop } from '../../../api/transport';
import { FontFamily } from '../../../constants/fonts';
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
        <View style={styles.stopsTitleWrap}>
          <Text style={styles.stopsTitle}>Route Stops ({stops.length})</Text>
          <View style={styles.titleUnderline} />
        </View>
        <TouchableOpacity
          style={styles.viewRouteBtn}
          onPress={() => setShowMapModal(true)}
          activeOpacity={0.8}
        >
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
              <Text style={styles.modalCloseText}>Close</Text>
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
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E5DC',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stopsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopsTitleWrap: { alignSelf: 'flex-start' },
  stopsTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  titleUnderline: {
    height: 3,
    width: 38,
    borderRadius: 2,
    backgroundColor: '#F4C430',
    marginTop: 4,
  },
  viewRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF4C7',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  viewRouteText: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#B45309',
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
    backgroundColor: '#E8E5DC',
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
    backgroundColor: '#F4C430',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  stopDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#171717',
  },
  stopLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E8E5DC',
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
    fontFamily: FontFamily.semibold,
    color: '#374151',
  },
  stopNameCurrent: {
    color: '#B45309',
    fontFamily: FontFamily.extrabold,
  },
  stopCoords: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: FontFamily.regular,
  },
  currentBadge: {
    backgroundColor: '#FFF4C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  currentBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: '#B45309',
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5DC',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: '#171717',
  },
  modalSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: FontFamily.regular,
  },
  modalCloseBtn: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: '#1A1B1C',
  },
});
