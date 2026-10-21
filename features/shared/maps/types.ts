export interface MapStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
}

export interface MapBusLocation {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
}

export interface BusMapProps {
  stops: MapStop[];
  busLocation?: MapBusLocation | null;
  studentStopId?: string | null;
  isLive: boolean;
  showUserLocation?: boolean;
  height?: number;
}
