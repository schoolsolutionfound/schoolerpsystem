import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
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
  pendingPoint?: PickedCoordinate | null;
  searchEnabled?: boolean;
}

const DEFAULT_CENTER: PickedCoordinate = { latitude: 12.9716, longitude: 77.5946 };

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

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
  pendingPoint,
  searchEnabled,
}) => {
  const MapView = NativeMaps?.default;
  const Marker = NativeMaps?.Marker;
  const Polyline = NativeMaps?.Polyline;

  const mapRef = useRef<any>(null);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);

  if (!MapView) {
    return <PickerFallback height={height} />;
  }

  const sorted = [...stops].sort((a, b) => a.sequence - b.sequence);
  const center = sorted[0] || pendingPoint || initialCenter || DEFAULT_CENTER;
  const coordinates = sorted.map((s) => ({
    latitude: Number(s.latitude),
    longitude: Number(s.longitude),
  }));
  const pin = pendingPoint
    ? { latitude: Number(pendingPoint.latitude), longitude: Number(pendingPoint.longitude) }
    : null;

  // Expo Go (SDK 55+) no longer bundles Google Maps, so use the platform
  // default there (Apple Maps on iOS). Native builds use Google when the key is set.
  const provider = IS_EXPO_GO
    ? undefined
    : Platform.OS === 'android' || GOOGLE_MAPS_API_KEY
      ? NativeMaps?.PROVIDER_GOOGLE
      : undefined;

  const handleSearch = async () => {
    const query = searchText.trim();
    if (!query) return;
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'SchoolERP/1.0 (transport)' } }
      );
      const results = await response.json();
      const first = Array.isArray(results) ? results[0] : null;
      if (!first) {
        Alert.alert('Not found', 'No map match. Tap the map to place the point instead.');
        return;
      }
      const coordinate = { latitude: Number(first.lat), longitude: Number(first.lon) };
      onPick?.(coordinate);
      mapRef.current?.animateToRegion(
        { ...coordinate, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500
      );
    } catch {
      Alert.alert('Search failed', 'Check your connection or tap the map to place the point.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
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
        {pin && (
          <Marker
            coordinate={pin}
            draggable
            onDragEnd={(event: any) => {
              const coordinate = event?.nativeEvent?.coordinate;
              if (coordinate && onPick) {
                onPick({ latitude: coordinate.latitude, longitude: coordinate.longitude });
              }
            }}
          >
            <MaterialCommunityIcons name="map-marker" size={34} color="#DC2626" />
          </Marker>
        )}
      </MapView>

      {searchEnabled && (
        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={16} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search place or stop name"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
            {searching ? (
              <ActivityIndicator size="small" color="#1A1B1C" />
            ) : (
              <Text style={styles.searchBtnText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.hint}>
        <MaterialCommunityIcons name="gesture-tap" size={14} color="#FFFFFF" />
        <Text style={styles.hintText}>Tap the map or drag the pin to set the location</Text>
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
  searchBox: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 4,
    paddingVertical: 4,
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Montserrat_500Medium',
    color: '#111827',
    paddingVertical: 6,
  },
  searchBtn: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#F4C430',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: { fontSize: 11, fontFamily: 'Montserrat_700Bold', color: '#171717' },
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
