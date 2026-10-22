import { BusStop } from '../../../api/transport';
import { MapBusLocation } from './types';

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export interface LeafletHtmlOptions {
  stops: BusStop[];
  roadPath?: { latitude: number; longitude: number }[];
  busLocation?: MapBusLocation | null;
  studentStopId?: string | null;
  isLive?: boolean;
}

/**
 * Builds the standalone Leaflet HTML page string rendered inside WebView.
 */
export function buildLeafletMapHtml({
  stops,
  roadPath = [],
  busLocation = null,
  studentStopId = null,
  isLive = false,
}: LeafletHtmlOptions): string {
  const stopsJson = JSON.stringify(stops);
  const busLocJson = JSON.stringify(busLocation || null);
  const roadPathJson = JSON.stringify(roadPath || []);
  const safeStudentStopId = studentStopId || '';
  const liveFlag = isLive ? 'true' : 'false';

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
    const initialRoadPath = ${roadPathJson};
    const initialBusLocation = ${busLocJson};
    const studentStopId = '${safeStudentStopId}';
    let isLive = ${liveFlag};

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
      stopMarkers.forEach(function(m) { map.removeLayer(m); });
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

      // Draw road-following polyline (Gap 3: True road curves)
      const pathCoords = (initialRoadPath && initialRoadPath.length > 1)
        ? initialRoadPath.map(function(p) { return [Number(p.latitude), Number(p.longitude)]; })
        : latlngs;

      if (pathCoords.length > 1) {
        polyline = L.polyline(pathCoords, {
          color: '#1A1B1C',
          weight: 4.5,
          opacity: 0.88,
          lineJoin: 'round'
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

    window.addEventListener('message', function(event) {
      window.processIncomingMessage(event.data);
    });
    document.addEventListener('message', function(event) {
      window.processIncomingMessage(event.data);
    });

    window.onload = initMap;
  </script>
</body>
</html>
  `;
}
