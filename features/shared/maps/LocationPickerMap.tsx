import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { USE_NATIVE_MAP } from '../../../constants/featureFlags';
import { MapStop } from './types';

export interface PickedCoordinate {
  latitude: number;
  longitude: number;
}

export interface LocationPickerMapProps {
  stops: MapStop[];
  onPick?: (coordinate: PickedCoordinate) => void;
  height?: number;
  initialCenter?: PickedCoordinate | null;
}

const DEFAULT_CENTER: PickedCoordinate = { latitude: 12.9716, longitude: 77.5946 };

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

let NativeMaps: any = null;
if (USE_NATIVE_MAP && Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NativeMaps = require('react-native-maps');
  } catch (error) {
    console.warn('[LocationPickerMap] react-native-maps unavailable, falling back:', error);
    NativeMaps = null;
  }
}

const NativePicker: React.FC<LocationPickerMapProps> = ({
  stops,
  onPick,
  height = 260,
  initialCenter,
}) => {
  const MapView = NativeMaps?.default;
  const Marker = NativeMaps?.Marker;
  const Polyline = NativeMaps?.Polyline;

  if (!MapView) {
    return <PickerFallback height={height} />;
  }

  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  const center = sorted[0] || initialCenter || DEFAULT_CENTER;
  const coordinates = sorted.map((s) => ({
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
  }));

  // Android always uses Google Maps. iOS uses Google Maps when an API key is
  // configured, otherwise falls back to native Apple Maps.
  const provider =
    Platform.OS === 'android' || GOOGLE_MAPS_API_KEY
      ? NativeMaps?.PROVIDER_GOOGLE
      : undefined;

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        provider={provider}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: Number(center.latitude),
          longitude: Number(center.longitude),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        onPress={(event: any) => {
          const coordinate = event?.nativeEvent?.coordinate;
          if (coordinate && onPick) {
            onPick({ latitude: coordinate.latitude, longitude: coordinate.longitude });
          }
        }}
      >
        {coordinates.length > 1 && (
          <Polyline coordinates={coordinates} strokeColor="#1A1B1C" strokeWidth={4} />
        )}
        {sorted.map((stop) => (
          <Marker
            key={stop.id}
            coordinate={{ latitude: Number(stop.latitude), longitude: Number(stop.longitude) }}
          >
            <View style={styles.stopMarker}>
              <Text style={styles.stopMarkerText}>{stop.sequence}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
      <View style={styles.hint}>
        <MaterialCommunityIcons name="gesture-tap" size={14} color="#FFFFFF" />
        <Text style={styles.hintText}>Tap the map to add a bus stop</Text>
      </View>
    </View>
  );
};

const PickerFallback: React.FC<{ height: number }> = ({ height }) => (
  <View style={[styles.container, styles.fallback, { height }]}>
    <MaterialCommunityIcons name="map-marker-radius-outline" size={34} color="#9CA3AF" />
    <Text style={styles.fallbackTitle}>Map picking unavailable here</Text>
    <Text style={styles.fallbackText}>Add stops using the latitude / longitude fields below.</Text>
  </View>
);

export const LocationPickerMap: React.FC<LocationPickerMapProps> = (props) => {
  if (!USE_NATIVE_MAP || Platform.OS === 'web') {
    return <PickerFallback height={props.height || 260} />;
  }
  return <NativePicker {...props} />;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    position: 'relative',
  },
  webView: { flex: 1, backgroundColor: '#E5E7EB' },
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loadingText: { fontSize: 12, fontFamily: 'Montserrat_600SemiBold', color: '#4B5563' },
  hint: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(26,27,28,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  hintText: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Montserrat_700Bold' },
  stopMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F4C430',
    borderWidth: 2,
    borderColor: '#1A1B1C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopMarkerText: { color: '#1A1B1C', fontSize: 10, fontFamily: 'Montserrat_700Bold' },
  fallback: { alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 },
  fallbackTitle: { fontSize: 13, fontFamily: 'Montserrat_700Bold', color: '#374151' },
  fallbackText: { fontSize: 11, fontFamily: 'Montserrat_400Regular', color: '#6B7280', textAlign: 'center' },
});
