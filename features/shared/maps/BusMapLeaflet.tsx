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

/**
 * Standard OpenStreetMap tile URL (Free, no API key).
 * Put in ONE constant so it can easily be swapped for another tile provider (e.g. CartoDB, Stamen).
 */
export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const BusMapLeaflet: React.FC<BusMapProps> = ({
  stops,
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

  // Initial HTML string for Leaflet map
  const initialHtml = useMemo(() => {
    const stopsJson = JSON.stringify(sortedStops);
    const busLocJson = JSON.stringify(busLocation || null);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #E5E7EB;
      touch-action: manipulation;
    }
    #map {
      width: 100%;
      height: 100%;
    }
    /* Stop Marker Pin */
    .stop-marker-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 11px;
      background-color: #1A1B1C;
      color: #FFFFFF;
      font-size: 10px;
      font-weight: 800;
      border: 2px solid #FFFFFF;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    /* Student Stop Marker Pin */
    .student-stop-marker-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 14px;
      background-color: #F4C430;
      color: #1A1B1C;
      font-size: 10px;
      font-weight: 900;
      border: 2.5px solid #1A1B1C;
      box-shadow: 0 3px 6px rgba(244, 196, 48, 0.6);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    /* Bus Marker Pin */
    .bus-marker-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: transform 0.4s ease;
    }
    .bus-marker-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 16px;
      background-color: #F4C430;
      border: 2.5px solid #1A1B1C;
      box-shadow: 0 3px 8px rgba(0,0,0,0.35);
      font-size: 16px;
    }
    .bus-marker-badge {
      background-color: #1A1B1C;
      color: #F4C430;
      font-size: 8px;
      font-weight: 900;
      padding: 1px 4px;
      border-radius: 3px;
      margin-top: 2px;
      letter-spacing: 0.5px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .leaflet-popup-content-wrapper {
      background: #1A1B1C;
      color: #FFFFFF;
      border-radius: 8px;
      padding: 2px;
    }
    .leaflet-popup-content {
      margin: 8px 12px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .leaflet-popup-tip {
      background: #1A1B1C;
    }
    .popup-title {
      font-size: 12px;
      font-weight: 800;
      color: #FFFFFF;
    }
    .popup-sub {
      font-size: 10px;
      color: #9CA3AF;
      margin-top: 2px;
    }
    .student-popup-title {
      color: #F4C430;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    let map;
    let stopMarkers = [];
    let polyline = null;
    let busMarker = null;
    let isUserPanning = false;

    const initialStops = ${stopsJson};
    const initialBusLocation = ${busLocJson};
    const studentStopId = '${studentStopId || ''}';
    let isLive = ${isLive ? 'true' : 'false'};

    function initMap() {
      map = L.map('map', {
        zoomControl: false,
        attributionControl: true
      });

      L.tileLayer('${TILE_URL}', {
        maxZoom: 19,
        attribution: '${TILE_ATTRIBUTION}'
      }).addTo(map);

      map.on('dragstart zoomstart', function() {
        isUserPanning = true;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'USER_PANNING' }));
        }
      });

      renderStops(initialStops, studentStopId);

      if (isLive && initialBusLocation) {
        updateBus(initialBusLocation);
      }

      fitMapToBounds();

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_READY' }));
      }
    }

    function renderStops(stops, studentId) {
      // Clear existing stop markers
      stopMarkers.forEach(m => map.removeLayer(m));
      stopMarkers = [];
      if (polyline) map.removeLayer(polyline);

      const latlngs = [];

      stops.forEach(function(s) {
        const isStudent = s.id === studentId;
        const latlng = [Number(s.latitude), Number(s.longitude)];
        latlngs.push(latlng);

        const html = isStudent
          ? '<div class="student-stop-marker-pin">★' + s.sequence + '</div>'
          : '<div class="stop-marker-pin">' + s.sequence + '</div>';

        const icon = L.divIcon({
          html: html,
          className: '',
          iconSize: isStudent ? [28, 28] : [22, 22],
          iconAnchor: isStudent ? [14, 14] : [11, 11]
        });

        const popupHtml = isStudent
          ? '<div class="popup-title student-popup-title">★ YOUR STOP (' + s.name + ')</div><div class="popup-sub">Stop #' + s.sequence + '</div>'
          : '<div class="popup-title">' + s.name + '</div><div class="popup-sub">Stop #' + s.sequence + '</div>';

        const marker = L.marker(latlng, { icon: icon }).bindPopup(popupHtml).addTo(map);
        stopMarkers.push(marker);
      });

      // Draw sequence polyline
      if (latlngs.length > 1) {
        polyline = L.polyline(latlngs, {
          color: '#1A1B1C',
          weight: 4,
          opacity: 0.85
        }).addTo(map);
      }
    }

    function updateBus(loc) {
      if (!loc) {
        if (busMarker) {
          map.removeLayer(busMarker);
          busMarker = null;
        }
        return;
      }

      const latlng = [Number(loc.latitude), Number(loc.longitude)];
      const speed = loc.speed != null ? Math.round(loc.speed) + ' km/h' : '';

      const busHtml = '<div class="bus-marker-container">' +
                        '<div class="bus-marker-pin">' +
                          '<svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1B1C">' +
                            '<path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>' +
                          '</svg>' +
                        '</div>' +
                        '<div class="bus-marker-badge">BUS</div>' +
                      '</div>';

      const busIcon = L.divIcon({
        html: busHtml,
        className: '',
        iconSize: [36, 46],
        iconAnchor: [18, 23]
      });

      const popupHtml = '<div class="popup-title" style="color: #F4C430;">Live School Bus</div>' +
        (speed ? '<div class="popup-sub">Speed: ' + speed + '</div>' : '');

      if (!busMarker) {
        busMarker = L.marker(latlng, { icon: busIcon, zIndexOffset: 1000 })
          .bindPopup(popupHtml)
          .addTo(map);
      } else {
        busMarker.setLatLng(latlng);
        busMarker.setIcon(busIcon);
        if (busMarker.getPopup()) {
          busMarker.setPopupContent(popupHtml);
        }
      }
    }

    function fitMapToBounds() {
      const bounds = [];
      stopMarkers.forEach(function(m) {
        bounds.push(m.getLatLng());
      });
      if (busMarker) {
        bounds.push(busMarker.getLatLng());
      }
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [35, 35] });
      }
    }

    function recenter(forceFollow) {
      isUserPanning = false;
      if (forceFollow && busMarker) {
        map.panTo(busMarker.getLatLng(), { animate: true, duration: 0.5 });
      } else {
        fitMapToBounds();
      }
    }

    // Function callable directly or via message
    window.processIncomingMessage = function(data) {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : data;
        if (msg.type === 'UPDATE_DATA') {
          isLive = msg.isLive;
          if (msg.isLive && msg.busLocation) {
            updateBus(msg.busLocation);
            if (!isUserPanning) {
              map.panTo([Number(msg.busLocation.latitude), Number(msg.busLocation.longitude)], { animate: true, duration: 0.5 });
            }
          } else {
            updateBus(null);
          }
        } else if (msg.type === 'RECENTER') {
          recenter(msg.forceFollow);
        }
      } catch (err) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'JS_ERROR', error: String(err) }));
        }
      }
    };

    // Both document and window message listeners for React Native Android WebView compatibility
    window.addEventListener('message', function(event) {
      window.processIncomingMessage(event.data);
    });
    document.addEventListener('message', function(event) {
      window.processIncomingMessage(event.data);
    });

    // Start on load
    window.onload = initMap;
  </script>
</body>
</html>
    `;
  }, [sortedStops, isLive, studentStopId]);

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
