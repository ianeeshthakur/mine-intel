import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, CircleMarker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFieldNavigation } from '../../hooks/useFieldNavigation';
import NavigationInfoCard from './NavigationInfoCard';
import ArrivalState from './ArrivalState';

// ─── Custom User Arrow Marker ──────────────────────────────────────────────
function UserMarker({ lat, lng, heading, accuracy }: { lat: number; lng: number; heading: number; accuracy: number }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    const latlng: L.LatLngTuple = [lat, lng];

    // Accuracy circle
    if (!circleRef.current) {
      circleRef.current = L.circle(latlng, {
        radius: accuracy,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.08,
        weight: 1.5,
        dashArray: '4 4',
        interactive: false,
      }).addTo(map);
    } else {
      circleRef.current.setLatLng(latlng).setRadius(accuracy);
    }

    // Directional arrow HTML marker
    const icon = L.divIcon({
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      html: `
        <div style="
          width:40px;height:40px;display:flex;align-items:center;justify-content:center;
          transform:rotate(${heading}deg);
          filter:drop-shadow(0 2px 6px rgba(59,130,246,0.5));
        ">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="10" fill="#3b82f6" opacity="0.25"/>
            <circle cx="20" cy="20" r="6" fill="#3b82f6"/>
            <polygon points="20,4 25,18 20,15 15,18" fill="#60a5fa" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>`,
    });

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon, interactive: false, zIndexOffset: 1000 }).addTo(map);
    } else {
      markerRef.current.setLatLng(latlng).setIcon(icon);
    }

    return () => {
      if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }
      if (circleRef.current) { map.removeLayer(circleRef.current); circleRef.current = null; }
    };
  }, [lat, lng, heading, accuracy, map]);

  return null;
}

// ─── Pulsing Target Marker ────────────────────────────────────────────────
function TargetMarker({ lat, lng, targetId, score, color }: {
  lat: number; lng: number; targetId: string; score: number; color: string;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      iconSize: [80, 80],
      iconAnchor: [40, 40],
      html: `
        <div style="position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;">
          <div style="
            position:absolute;width:80px;height:80px;border-radius:50%;
            background:${color};opacity:0.12;
            animation:navPulse 2s ease-in-out infinite;
          "></div>
          <div style="
            position:absolute;width:56px;height:56px;border-radius:50%;
            background:${color};opacity:0.2;
            animation:navPulse 2s ease-in-out infinite 0.3s;
          "></div>
          <div style="
            width:28px;height:28px;border-radius:50%;
            background:${color};border:3px solid white;
            box-shadow:0 0 0 3px ${color}40,0 4px 20px ${color}60;
            position:relative;z-index:2;
          "></div>
        </div>`,
    });

    markerRef.current = L.marker([lat, lng], { icon, zIndexOffset: 500 })
      .bindTooltip(`
        <div style="background:rgba(15,23,42,0.95);border:1px solid rgba(255,255,255,0.12);border-radius:8px;padding:8px 12px;font-family:system-ui,sans-serif;">
          <div style="font-size:11px;font-weight:800;letter-spacing:0.08em;color:#94a3b8;text-transform:uppercase;margin-bottom:2px;">${targetId}</div>
          <div style="font-size:18px;font-weight:900;color:${color};">${score}<span style="font-size:11px;color:#64748b;font-weight:600;">/100</span></div>
        </div>`, {
        permanent: true,
        direction: 'top',
        offset: [0, -44],
        className: 'cluster-boundary-tooltip',
      })
      .addTo(map);

    return () => {
      if (markerRef.current) { map.removeLayer(markerRef.current); markerRef.current = null; }
    };
  }, [lat, lng, targetId, score, color, map]);

  return null;
}

// ─── Map auto-fit ─────────────────────────────────────────────────────────
function MapFitter({ userLat, userLng, targetLat, targetLng }: {
  userLat: number; userLng: number; targetLat: number; targetLng: number;
}) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(
      [userLat, userLng],
      [targetLat, targetLng]
    ).pad(0.25);
    map.fitBounds(bounds, { animate: true, duration: 1 });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

// ─── Target color helper ─────────────────────────────────────────────────
function targetColor(priority: string) {
  switch (priority) {
    case 'VERY_HIGH': return '#dc2626';
    case 'HIGH':      return '#f97316';
    case 'MEDIUM':    return '#eab308';
    default:          return '#22c55e';
  }
}

// ─── Main Component ───────────────────────────────────────────────────────
interface Target {
  targetId: string;
  latitude: number;
  longitude: number;
  prospectivityScore: number;
  priority: string;
}

interface Props {
  target: Target;
  onBack: () => void;
}

function NavigationOverlay({ target, onBack }: Props) {
  const color = targetColor(target.priority);
  const nav = useFieldNavigation({ lat: target.latitude, lng: target.longitude });

  return (
    <>
      {/* Fit map on first render */}
      <MapFitter
        userLat={nav.userLocation.lat} userLng={nav.userLocation.lng}
        targetLat={target.latitude} targetLng={target.longitude}
      />

      {/* Route line */}
      {nav.route && (
        <Polyline
          positions={nav.route.map(p => [p.lat, p.lng] as [number, number])}
          pathOptions={{
            color: nav.routeType === 'road' ? '#3b82f6' : '#f59e0b',
            weight: 4,
            opacity: 0.85,
            dashArray: nav.routeType === 'direct' ? '10 8' : undefined,
            lineCap: 'round',
            lineJoin: 'round',
          }}
        />
      )}

      {/* User marker */}
      <UserMarker
        lat={nav.userLocation.lat}
        lng={nav.userLocation.lng}
        heading={nav.heading}
        accuracy={nav.accuracy}
      />

      {/* Target pulsing marker */}
      <TargetMarker
        lat={target.latitude}
        lng={target.longitude}
        targetId={target.targetId}
        score={target.prospectivityScore}
        color={color}
      />

      {/* Bottom card — arrival or navigation */}
      {nav.isArrived ? (
        <ArrivalState
          targetId={target.targetId}
          score={target.prospectivityScore}
          priority={target.priority}
          onContinue={onBack}
        />
      ) : (
        <NavigationInfoCard
          targetId={target.targetId}
          score={target.prospectivityScore}
          priority={target.priority}
          distanceMeters={nav.distanceMeters}
          etaMinutes={nav.etaMinutes}
          bearingDeg={nav.bearingDeg}
          routeType={nav.routeType}
          accuracy={nav.accuracy}
          onBack={onBack}
          onForceDirect={nav.forceDirectPath}
          onForceRoad={nav.forceRoadRoute}
        />
      )}
    </>
  );
}

export default function FieldNavigationMap({ target, onBack }: Props) {
  const color = targetColor(target.priority);
  // Demo location as initial map center
  const center: [number, number] = [21.83, 80.14];

  return (
    <div className="relative h-full w-full bg-slate-900">
      {/* Field mode top header */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
        <div className="pointer-events-auto mx-3 mt-3 bg-slate-900/95 backdrop-blur-sm rounded-xl border border-slate-700/60 shadow-lg px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Field Navigation</span>
              <span className="text-sm font-extrabold text-white">{target.targetId}</span>
            </div>
            <div
              className="h-4 w-px bg-slate-700"
            />
            <div
              className="text-xs font-bold px-2 py-0.5 rounded"
              style={{ background: `${color}20`, color }}
            >
              {target.priority.replace('_', ' ')}
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          subdomains={['a', 'b', 'c']}
          maxZoom={19}
        />
        <NavigationOverlay target={target} onBack={onBack} />
      </MapContainer>

      {/* CSS keyframes for pulse */}
      <style>{`
        @keyframes navPulse {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.35); opacity: 0.08; }
        }
      `}</style>
    </div>
  );
}
