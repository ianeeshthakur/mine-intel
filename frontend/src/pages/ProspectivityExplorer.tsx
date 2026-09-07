import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Polygon, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import { Layers, X } from 'lucide-react';
import HeatmapLayer from '../components/HeatmapLayer';
import ProspectivityLegend from '../components/ProspectivityLegend';
import TargetIntelligencePanel from '../components/intelligence/TargetIntelligencePanel';
import { createProspectivityClusterIcon } from '../components/createProspectivityClusterIcon';
import ClusterBoundaryController from '../components/ClusterBoundaryController';
import NavigateToTarget from '../components/navigation/NavigateToTarget';

// Approximate Balaghat exploration boundary
const BALAGHAT_BOUNDARY: [number, number][] = [
  [22.05, 79.95], [22.05, 80.45], [21.65, 80.48],
  [21.55, 80.20], [21.60, 79.92], [21.80, 79.88], [22.05, 79.95],
];

export default function ProspectivityExplorer() {
  // Ref passed to MarkerClusterGroup so ClusterBoundaryController
  // can attach the clusterclick listener to the underlying L.MarkerClusterGroup
  const clusterGroupRef = useRef<any>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTargetId = searchParams.get('target');

  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTargetData, setSelectedTargetData] = useState<any | null>(null);

  // Navigate-to-Target overlay state
  const [navOpen, setNavOpen] = useState(false);
  // User's coarse location for distance sorting in target list (demo fallback inside hook)
  const [explorerUserLoc, setExplorerUserLoc] = useState({ lat: 21.83, lng: 80.14 });
  const [explorerGpsReal, setExplorerGpsReal] = useState(false);

  // Attempt GPS once on mount for distance calculations in target list
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setExplorerUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setExplorerGpsReal(true);
      },
      () => { /* keep demo */ },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  const [layers, setLayers] = useState({
    spectral: false,
    lithology: true,
    structures: false,
    soil: false,
    terrain: false,
    mineralization: true,
    heatmap: true,
    priorityTargets: true,
    boundary: true,
  });

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    fetch(`${API_BASE}/api/targets`)
      .then(res => res.json())
      .then(data => {
        setTargets(data);
        if (selectedTargetId) {
          const t = data.find((x: any) => x.targetId === selectedTargetId);
          if (t) setSelectedTargetData(t);
        }
      })
      .catch(console.error);
  }, [selectedTargetId]);

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left sidebar: Layer Controls */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10 flex-shrink-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <Layers className="w-5 h-5 text-slate-600" />
          <h2 className="font-semibold text-slate-800">Map Layers</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <LayerGroup title="AI Intelligence">
            <Checkbox label="Prospectivity Heatmap" checked={layers.heatmap} onChange={() => toggleLayer('heatmap')} color="#f97316" />
            <Checkbox label="Priority Targets" checked={layers.priorityTargets} onChange={() => toggleLayer('priorityTargets')} color="#dc2626" />
          </LayerGroup>
          <LayerGroup title="Satellite Evidence">
            <Checkbox label="Spectral Anomaly (S2)" checked={layers.spectral} onChange={() => toggleLayer('spectral')} color="#6366f1" />
          </LayerGroup>
          <LayerGroup title="Geological Evidence">
            <Checkbox label="Lithology / Formation" checked={layers.lithology} onChange={() => toggleLayer('lithology')} color="#7c3aed" />
            <Checkbox label="Structural Lineaments" checked={layers.structures} onChange={() => toggleLayer('structures')} color="#92400e" />
          </LayerGroup>
          <LayerGroup title="Contextual Evidence">
            <Checkbox label="Known Mineralization" checked={layers.mineralization} onChange={() => toggleLayer('mineralization')} color="#059669" />
            <Checkbox label="Soil Properties" checked={layers.soil} onChange={() => toggleLayer('soil')} color="#b45309" />
            <Checkbox label="Terrain / DEM" checked={layers.terrain} onChange={() => toggleLayer('terrain')} color="#475569" />
          </LayerGroup>
          <LayerGroup title="Overlay">
            <Checkbox label="Exploration Boundary" checked={layers.boundary} onChange={() => toggleLayer('boundary')} color="#3b82f6" />
          </LayerGroup>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative" style={{ zIndex: 0 }}>
        <MapContainer center={[21.8, 80.2]} zoom={11} style={{ height: '100%', width: '100%' }}>
          {/* BASEMAP — OpenStreetMap standard tiles (free, no API key) */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            subdomains={["a", "b", "c"]}
            maxZoom={19}
          />

          {/* Exploration boundary */}
          {layers.boundary && (
            <Polygon
              positions={BALAGHAT_BOUNDARY}
              pathOptions={{
                color: '#3b82f6',
                weight: 2,
                dashArray: '8 6',
                fillOpacity: 0.04,
                fillColor: '#3b82f6',
              }}
            />
          )}

          {/* Prospectivity heatmap — independent of target markers */}
          {layers.heatmap && (
            <HeatmapLayer
              points={targets.map(t => [t.latitude, t.longitude, t.prospectivityScore / 100.0])}
            />
          )}

          {/* Clustered priority targets — independent of heatmap */}
          {/* ClusterBoundaryController must be inside MapContainer to access useMap() */}
          <ClusterBoundaryController clusterGroupRef={clusterGroupRef} />

          {layers.priorityTargets && (
            <MarkerClusterGroup
              ref={clusterGroupRef}
              iconCreateFunction={createProspectivityClusterIcon}
              maxClusterRadius={60}
            >
              {targets.map(target => (
                <CircleMarker
                  key={target.id}
                  center={[target.latitude, target.longitude]}
                  radius={selectedTargetId === target.targetId ? 12 : (target.prospectivityScore > 90 ? 8 : 6)}
                  // @ts-ignore — custom prop consumed by createProspectivityClusterIcon
                  targetData={target}
                  eventHandlers={{
                    click: () => {
                      setSelectedTargetData(target);
                      setSearchParams({ target: target.targetId });
                    }
                  }}
                  pathOptions={{
                    color: '#ffffff',
                    weight: selectedTargetId === target.targetId ? 3 : 2,
                    fillColor: selectedTargetId === target.targetId ? '#1d4ed8' : (target.prospectivityScore > 90 ? '#dc2626' : '#f97316'),
                    fillOpacity: selectedTargetId === target.targetId ? 0.95 : 0.88,
                  }}
                />
              ))}
            </MarkerClusterGroup>
          )}

          <MapEffect center={selectedTargetData ? [selectedTargetData.latitude, selectedTargetData.longitude] : null} />
        </MapContainer>

        {/* Floating legend inside map */}
        <ProspectivityLegend />
      </div>

      {/* Right Sidebar: Target Intelligence */}
      {selectedTargetData && (
        <div className="w-96 bg-white border-l border-slate-200 shadow-xl z-20 flex flex-col absolute right-0 top-0 bottom-0">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
            <div>
              <h2 className="font-bold text-lg text-slate-800">Target {selectedTargetData.targetId}</h2>
              <p className="text-xs text-slate-500">Click another target on the map to switch</p>
            </div>
            <button
              onClick={() => { setSearchParams({}); setSelectedTargetData(null); }}
              className="p-1 hover:bg-slate-200 rounded text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TargetIntelligencePanel
              target={selectedTargetData}
              onNavigate={() => setNavOpen(true)}
            />
          </div>
        </div>
      )}

      {/* Full-screen Navigate to Target overlay */}
      {navOpen && (
        <NavigateToTarget
          targets={targets}
          userLocation={explorerUserLoc}
          isGpsReal={explorerGpsReal}
          onClose={() => setNavOpen(false)}
        />
      )}
    </div>
  );
}

function LayerGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Checkbox({ label, checked, onChange, color }: {
  label: string; checked: boolean; onChange: () => void; color?: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <div
        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
          checked ? 'border-transparent' : 'bg-white border-slate-300 group-hover:border-blue-400'
        }`}
        style={checked ? { backgroundColor: color || '#3b82f6' } : {}}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

function MapEffect({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13, { animate: true });
  }, [center, map]);
  return null;
}
