/**
 * Global Feature Flags
 * Can be safely toggled to revert or experiment with features without touching business logic.
 */
export const USE_NATIVE_MAP = true;

/**
 * Phase 2B: Android-only Leaflet / OpenStreetMap fallback.
 * Uses free OpenStreetMap tiles inside WebView on Android so no Google Maps API keys are needed.
 * iOS continues to use native Apple Maps (BusMapView) without change.
 */
export const USE_LEAFLET_ANDROID_FALLBACK = true;

/**
 * Phase 3: Real driver GPS broadcast via expo-location.
 * Set to false as a kill switch to revert driver screen to simulation-only behavior.
 */
export const USE_REAL_DRIVER_GPS = true;

/**
 * Phase 3: Show driver route simulation controls in dev mode.
 */
export const SHOW_DRIVER_SIMULATOR = __DEV__;
