import { useState, useEffect, useRef, useCallback } from 'react';

export interface LatLng { lat: number; lng: number; }

export interface NavigationState {
  userLocation: LatLng;
  accuracy: number;
  heading: number;
  distanceMeters: number;
  bearingDeg: number;
  etaMinutes: number;
  isGpsReal: boolean;
  isArrived: boolean;
  route: LatLng[] | null;
  routeType: 'road' | 'direct';
}

// Demo location: near center of Balaghat exploration zone
const DEMO_LOCATION: LatLng = { lat: 21.83, lng: 80.14 };
const DEMO_ACCURACY = 12;
const DEMO_HEADING = 32; // NE
const ARRIVAL_THRESHOLD_M = 150;

function toRad(d: number) { return d * Math.PI / 180; }

export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function bearingDeg(from: LatLng, to: LatLng): number {
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat), lat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

export function compassLabel(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

async function fetchOsrmRoute(from: LatLng, to: LatLng): Promise<LatLng[] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== 'Ok') return null;
    const coords: [number, number][] = data.routes[0].geometry.coordinates;
    return coords.map(([lng, lat]) => ({ lat, lng }));
  } catch {
    return null;
  }
}

export function useFieldNavigation(target: LatLng | null) {
  const [userLocation, setUserLocation] = useState<LatLng>(DEMO_LOCATION);
  const [accuracy, setAccuracy] = useState(DEMO_ACCURACY);
  const [heading, setHeading] = useState(DEMO_HEADING);
  const [isGpsReal, setIsGpsReal] = useState(false);
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [routeType, setRouteType] = useState<'road' | 'direct'>('direct');
  const watchRef = useRef<number | null>(null);

  // GPS watch
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(Math.round(pos.coords.accuracy));
        if (pos.coords.heading != null) setHeading(pos.coords.heading);
        setIsGpsReal(true);
      },
      () => { /* denied → keep demo */ },
      { enableHighAccuracy: true, maximumAge: 3000 }
    );
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  // Simulate slow demo movement toward target when not real GPS
  useEffect(() => {
    if (isGpsReal || !target) return;
    const id = setInterval(() => {
      setUserLocation(prev => {
        const dLat = (target.lat - prev.lat) * 0.002;
        const dLng = (target.lng - prev.lng) * 0.002;
        return { lat: prev.lat + dLat, lng: prev.lng + dLng };
      });
    }, 2000);
    return () => clearInterval(id);
  }, [isGpsReal, target]);

  // Fetch / compute route when target changes
  const fetchRoute = useCallback(async () => {
    if (!target) { setRoute(null); return; }
    const osrm = await fetchOsrmRoute(userLocation, target);
    if (osrm && osrm.length > 1) {
      setRoute(osrm);
      setRouteType('road');
    } else {
      setRoute([userLocation, target]);
      setRouteType('direct');
    }
  }, [target, userLocation.lat, userLocation.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchRoute(); }, [target?.lat, target?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const forceDirectPath = useCallback(() => {
    if (!target) return;
    setRoute([userLocation, target]);
    setRouteType('direct');
  }, [target, userLocation]);

  const forceRoadRoute = useCallback(() => { fetchRoute(); }, [fetchRoute]);

  const distanceMeters = target ? haversineMeters(userLocation, target) : 0;
  const bearing = target ? bearingDeg(userLocation, target) : heading;
  const etaMinutes = Math.round(distanceMeters / 80); // ~80m/min walking
  const isArrived = target ? distanceMeters < ARRIVAL_THRESHOLD_M : false;

  return {
    userLocation, accuracy, heading: bearing, isGpsReal,
    distanceMeters, bearingDeg: bearing, etaMinutes, isArrived,
    route, routeType, forceDirectPath, forceRoadRoute, refetchRoute: fetchRoute,
  } satisfies NavigationState & { forceDirectPath: () => void; forceRoadRoute: () => void; refetchRoute: () => void };
}
