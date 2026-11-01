/**
 * Global Feature Flags
 * Can be safely toggled to revert or experiment with features without touching business logic.
 */
export const USE_NATIVE_MAP = true;

/**
 * Legacy Android-only Leaflet / OpenStreetMap fallback.
 * Disabled: Android now uses native react-native-maps with Google Maps
 * (EXPO_PUBLIC_GOOGLE_MAPS_API_KEY). iOS uses Google Maps when a key is
 * configured, otherwise native Apple Maps.
 */
export const USE_LEAFLET_ANDROID_FALLBACK = false;

/**
 * Phase 3: Real driver GPS broadcast via expo-location.
 * Set to false as a kill switch to revert driver screen to simulation-only behavior.
 */
export const USE_REAL_DRIVER_GPS = true;

/**
 * Phase 3: Show driver route simulation controls in dev mode.
 */
export const SHOW_DRIVER_SIMULATOR = __DEV__;
