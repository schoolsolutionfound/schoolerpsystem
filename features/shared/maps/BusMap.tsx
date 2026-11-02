import React from 'react';
import { Platform } from 'react-native';
import { USE_NATIVE_MAP } from '../../../constants/featureFlags';
import { BusMapPlaceholder } from './BusMapPlaceholder';
import { BusMapProps } from './types';

// Safely require BusMapView (native react-native-maps: Google Maps on Android,
// Google Maps on iOS when configured, otherwise Apple Maps)
let NativeBusMapView: React.FC<BusMapProps> | null = null;
if (USE_NATIVE_MAP && Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('./BusMapView');
    NativeBusMapView = module.BusMapView;
  } catch (error) {
    console.warn('[BusMap] Falling back to placeholder map due to require failure (BusMapView):', error);
    NativeBusMapView = null;
  }
}

export const BusMap: React.FC<BusMapProps> = (props) => {
  // If master flag is off or on web -> render placeholder
  if (!USE_NATIVE_MAP || Platform.OS === 'web') {
    return <BusMapPlaceholder {...props} />;
  }

  if (NativeBusMapView) {
    return <NativeBusMapView {...props} />;
  }

  return <BusMapPlaceholder {...props} />;
};

export * from './types';
