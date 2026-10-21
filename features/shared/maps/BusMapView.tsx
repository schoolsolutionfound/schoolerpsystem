import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusMapProps } from './types';
import { BusMapPlaceholder } from './BusMapPlaceholder';

export const BusMapView: React.FC<BusMapProps> = ({
  stops,
  busLocation,
  studentStopId,
  isLive,
  showUserLocation = false,
  height = 280,
}) => {
  const mapRef = useRef<MapView>(null);
  const [isUserPanning, setIsUserPanning] = useState(false);

  // If there are no stops, show placeholder empty state
  if (!stops || stops.length === 0) {
    return <BusMapPlaceholder stops={[]} isLive={isLive} height={height} />;
  }

  // Sorted stops by sequence for drawing route polyline
  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => a.sequence - b.sequence);
  }, [stops]);

  // Coordinates array for polyline
  const polylineCoordinates = useMemo(() => {
    return sortedStops.map((s) => ({
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
    }));
  }, [sortedStops]);

  // Initial region or fit on mount / stops change
  const fitMapToStops = () => {
    if (!mapRef.current || polylineCoordinates.length === 0) return;
    const allCoords = [...polylineCoordinates];
    if (busLocation) {
      allCoords.push({
        latitude: Number(busLocation.latitude),
        longitude: Number(busLocation.longitude),
      });
    }

    mapRef.current.fitToCoordinates(allCoords, {
      edgePadding: { top: 50, right: 40, bottom: 50, left: 40 },
      animated: true,
    });
    setIsUserPanning(false);
  };

  useEffect(() => {
    // Slight timeout to allow map layout to finish before fitting
    const timer = setTimeout(() => {
      fitMapToStops();
    }, 400);
    return () => clearTimeout(timer);
  }, [stops]);

  // Gently animate camera to follow bus when live and user is not manually panning
  useEffect(() => {
    if (isLive && busLocation && !isUserPanning && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: Number(busLocation.latitude),
            longitude: Number(busLocation.longitude),
          },
          zoom: 15,
        },
        { duration: 1000 }
      );
    }
  }, [busLocation?.latitude, busLocation?.longitude, isLive, isUserPanning]);

  const recenter = () => {
    if (isLive && busLocation && mapRef.current) {
      setIsUserPanning(false);
      mapRef.current.animateCamera(
        {
          center: {
            latitude: Number(busLocation.latitude),
            longitude: Number(busLocation.longitude),
          },
          zoom: 15,
        },
        { duration: 800 }
      );
    } else {
      fitMapToStops();
    }
  };

  const initialRegion = {
    latitude: Number(sortedStops[0]?.latitude || 12.9716),
    longitude: Number(sortedStops[0]?.longitude || 77.5946),
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        onTouchStart={() => setIsUserPanning(true)}
        toolbarEnabled={false}
      >
        {/* Route Polyline connecting stops in sequence */}
        <Polyline
          coordinates={polylineCoordinates}
          strokeColor="#1A1B1C"
          strokeWidth={4}
          lineDashPattern={[0]}
        />

        {/* Stop Markers */}
        {sortedStops.map((stop) => {
          const isStudentStop = studentStopId === stop.id;
          const coord = {
            latitude: Number(stop.latitude),
            longitude: Number(stop.longitude),
          };

          return (
            <Marker
              key={stop.id}
              coordinate={coord}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              {isStudentStop ? (
                <View style={styles.studentStopMarker}>
                  <MaterialCommunityIcons name="star" size={12} color="#1A1B1C" />
                  <Text style={styles.studentStopSeq}>{stop.sequence}</Text>
                </View>
              ) : (
                <View style={styles.regularStopMarker}>
                  <Text style={styles.regularStopSeq}>{stop.sequence}</Text>
                </View>
              )}

              <Callout tooltip>
                <View style={[styles.calloutCard, isStudentStop && styles.calloutCardStudent]}>
                  <Text style={[styles.calloutTitle, isStudentStop && styles.calloutTitleStudent]}>
                    {isStudentStop ? `★ YOUR STOP (${stop.name})` : stop.name}
                  </Text>
                  <Text style={styles.calloutSub}>Stop #{stop.sequence}</Text>
                </View>
              </Callout>
            </Marker>
          );
        })}

        {/* Live Bus Marker */}
        {isLive && busLocation && (
          <Marker
            coordinate={{
              latitude: Number(busLocation.latitude),
              longitude: Number(busLocation.longitude),
            }}
            rotation={busLocation.heading ?? 0}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
            zIndex={999}
          >
            <View style={styles.busMarkerWrap}>
              <View style={styles.busMarkerPin}>
                <MaterialCommunityIcons name="bus" size={18} color="#1A1B1C" />
              </View>
              <View style={styles.busMarkerBadge}>
                <Text style={styles.busMarkerBadgeText}>BUS</Text>
              </View>
            </View>
            <Callout tooltip>
              <View style={styles.busCallout}>
                <Text style={styles.busCalloutTitle}>Live School Bus</Text>
                {busLocation.speed != null && (
                  <Text style={styles.busCalloutSub}>
                    Speed: {Math.round(busLocation.speed)} km/h
                  </Text>
                )}
              </View>
            </Callout>
          </Marker>
        )}
      </MapView>

      {/* Floating Recenter / Reset View Button */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={recenter}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name={isUserPanning ? 'crosshairs-gps' : 'fit-to-screen-outline'}
          size={18}
          color="#1A1B1C"
        />
        <Text style={styles.recenterText}>
          {isUserPanning ? 'Follow Bus' : 'Reset View'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  regularStopMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1A1B1C',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  regularStopSeq: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  studentStopMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4C430',
    borderWidth: 2,
    borderColor: '#1A1B1C',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F4C430',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  studentStopSeq: {
    color: '#1A1B1C',
    fontSize: 9,
    fontWeight: '900',
    marginTop: -2,
  },
  calloutCard: {
    backgroundColor: '#1A1B1C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  calloutCardStudent: {
    backgroundColor: '#F4C430',
    borderColor: '#1A1B1C',
  },
  calloutTitle: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  calloutTitleStudent: {
    color: '#1A1B1C',
    fontWeight: '900',
  },
  calloutSub: {
    color: '#9CA3AF',
    fontSize: 9,
  },
  busMarkerWrap: {
    alignItems: 'center',
  },
  busMarkerPin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F4C430',
    borderWidth: 2.5,
    borderColor: '#1A1B1C',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  busMarkerBadge: {
    backgroundColor: '#1A1B1C',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  busMarkerBadgeText: {
    color: '#F4C430',
    fontSize: 8,
    fontWeight: '900',
  },
  busCallout: {
    backgroundColor: '#1A1B1C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  busCalloutTitle: {
    color: '#F4C430',
    fontSize: 11,
    fontWeight: '800',
  },
  busCalloutSub: {
    color: '#FFFFFF',
    fontSize: 9,
    marginTop: 2,
  },
  recenterBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  recenterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1B1C',
  },
});
