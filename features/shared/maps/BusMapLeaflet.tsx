import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BusMapProps } from './types';
import { BusMapPlaceholder } from './BusMapPlaceholder';
import {
  buildLeafletMapHtml,
  TILE_URL,
  TILE_ATTRIBUTION,
} from './leafletHtmlBuilder';

export { TILE_URL, TILE_ATTRIBUTION };

export const BusMapLeaflet: React.FC<BusMapProps> = ({
  stops,
  roadPath,
  busLocation,
  studentStopId,
  isLive,
  height = 280,
}) => {
  const webViewRef = useRef<WebView>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isFollowingBus, setIsFollowingBus] = useState(true);

  // If there are no stops, show the placeholder empty state
  if (!stops || stops.length === 0) {
    return <BusMapPlaceholder stops={[]} isLive={isLive} height={height} />;
  }

  // Sorted stops by sequence for drawing route polyline
  const sortedStops = useMemo(() => {
    return [...stops].sort((a, b) => a.sequence - b.sequence);
  }, [stops]);

  // Initial HTML string for Leaflet map generated via builder
  const initialHtml = useMemo(() => {
    return buildLeafletMapHtml({
      stops: sortedStops,
      roadPath,
      busLocation,
      studentStopId,
      isLive,
    });
  }, [sortedStops, roadPath, busLocation, studentStopId, isLive]);

  // Update map state dynamically via both postMessage AND injectJavaScript for guaranteed Android compatibility
  useEffect(() => {
    if (!webViewRef.current) return;

    const payload = JSON.stringify({
      type: 'UPDATE_DATA',
      stops: sortedStops,
      busLocation: busLocation || null,
      studentStopId: studentStopId || null,
      isLive,
    });

    // 1. Send postMessage
    webViewRef.current.postMessage(payload);

    // 2. Also injectJavaScript as bulletproof fallback on Android
    const jsCode = `(function() {
      if (window.processIncomingMessage) {
        window.processIncomingMessage(${JSON.stringify(payload)});
      }
    })(); true;`;
    webViewRef.current.injectJavaScript(jsCode);
  }, [
    sortedStops,
    busLocation?.latitude,
    busLocation?.longitude,
    busLocation?.speed,
    busLocation?.heading,
    studentStopId,
    isLive,
    mapLoaded,
  ]);

  // Handle messages from the WebView (e.g. user panned or map initialized)
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_READY') {
        setMapLoaded(true);
      } else if (data.type === 'USER_PANNING') {
        setIsFollowingBus(false);
      } else if (data.type === 'JS_ERROR') {
        console.warn('[BusMapLeaflet] Internal JS Error:', data.error);
      }
    } catch (e) {
      // Ignore
    }
  };

  // Recenter button callback
  const handleRecenter = useCallback(() => {
    setIsFollowingBus(true);
    if (!webViewRef.current) return;
    const msg = JSON.stringify({
      type: 'RECENTER',
      forceFollow: isLive && !!busLocation,
    });
    webViewRef.current.postMessage(msg);
    webViewRef.current.injectJavaScript(`if (window.processIncomingMessage) { window.processIncomingMessage(${JSON.stringify(msg)}); } true;`);
  }, [isLive, busLocation]);

  if (hasError) {
    return (
      <View style={[styles.container, { height }]}>
        <BusMapPlaceholder
          stops={stops}
          busLocation={busLocation}
          studentStopId={studentStopId}
          isLive={isLive}
          height={height}
        />
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Offline Map Mode</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: initialHtml }}
        style={styles.webView}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        nestedScrollEnabled={true}
        scrollEnabled={false}
        overScrollMode="never"
        onLoadEnd={() => {
          setMapLoaded(true);
        }}
        onMessage={handleMessage}
        onError={() => setHasError(true)}
        renderLoading={() => (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#F4C430" />
            <Text style={styles.loadingText}>Loading Street Map...</Text>
          </View>
        )}
        startInLoadingState={true}
      />

      {/* Recenter Button (Native RN Overlay) */}
      <TouchableOpacity
        style={styles.recenterBtn}
        onPress={handleRecenter}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name={!isFollowingBus ? 'crosshairs-gps' : 'fit-to-screen-outline'}
          size={18}
          color="#1A1B1C"
        />
        <Text style={styles.recenterText}>
          {!isFollowingBus ? 'Follow Bus' : 'Reset View'}
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
  webView: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
  loadingWrap: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  errorBanner: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
