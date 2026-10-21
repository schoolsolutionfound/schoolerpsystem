import React from 'react';
import { Platform } from 'react-native';
import { USE_NATIVE_MAP, USE_LEAFLET_ANDROID_FALLBACK } from '../../../constants/featureFlags';
import { BusMapPlaceholder } from './BusMapPlaceholder';
import { BusMapProps } from './types';

// Safely require BusMapView (iOS native Apple Maps / react-native-maps)
let NativeBusMapView: React.FC<BusMapProps> | null = null;
if (USE_NATIVE_MAP && Platform.OS !== 'web') {
  try {
    const module = require('./BusMapView');
    NativeBusMapView = module.BusMapView;
  } catch (error) {
    console.warn('[BusMap] Falling back to placeholder map due to require failure (BusMapView):', error);
    NativeBusMapView = null;
  }
}

// Safely require BusMapLeaflet (Android-only free Leaflet / OpenStreetMap fallback)
let LeafletBusMapView: React.FC<BusMapProps> | null = null;
if (USE_NATIVE_MAP && USE_LEAFLET_ANDROID_FALLBACK && Platform.OS === 'android') {
  try {
    const module = require('./BusMapLeaflet');
    LeafletBusMapView = module.BusMapLeaflet;
  } catch (error) {
    console.warn('[BusMap] Falling back to placeholder map due to require failure (BusMapLeaflet):', error);
    LeafletBusMapView = null;
  }
}

export const BusMap: React.FC<BusMapProps> = (props) => {
  // If master flag is off or on web -> render placeholder
  if (!USE_NATIVE_MAP || Platform.OS === 'web') {
    return <BusMapPlaceholder {...props} />;
  }

  // On Android with Leaflet fallback enabled -> use Leaflet OpenStreetMap
  if (Platform.OS === 'android' && USE_LEAFLET_ANDROID_FALLBACK) {
    if (LeafletBusMapView) {
      return <LeafletBusMapView {...props} />;
    }
    // If Leaflet module failed to load, fall back safely to placeholder
    return <BusMapPlaceholder {...props} />;
  }

  // On iOS -> use native Apple Maps (BusMapView)
  if (Platform.OS === 'ios') {
    if (NativeBusMapView) {
      return <NativeBusMapView {...props} />;
    }
    return <BusMapPlaceholder {...props} />;
  }

  // Fallback
  if (NativeBusMapView) {
    return <NativeBusMapView {...props} />;
  }
  return <BusMapPlaceholder {...props} />;
};

export * from './types';
