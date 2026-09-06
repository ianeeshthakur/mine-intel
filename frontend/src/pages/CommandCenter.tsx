import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, Map as MapIcon, Target, CheckCircle, Activity, Info } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polygon, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import HeatmapLayer from '../components/HeatmapLayer';
import ProspectivityLegend from '../components/ProspectivityLegend';

// Approximate Balaghat exploration boundary polygon (covering ~1,000 km²)
const BALAGHAT_BOUNDARY: [number, number][] = [
  [22.05, 79.95],
  [22.05, 80.45],
  [21.65, 80.48],
  [21.55, 80.20],
  [21.60, 79.92],
  [21.80, 79.88],
  [22.05, 79.95],
];

// Custom DivIcon for clusters — colored circle with white count
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  // Estimate avg score: color the cluster by density
  const color = count > 15 ? '#dc2626' : count > 8 ? '#f97316' : '#facc15';
  const size = count > 15 ? 44 : count > 8 ? 38 : 32;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px; height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        display: flex; align-items: center; justify-content: center;
        color: white; font-weight: 700; font-size: ${count > 9 ? 13 : 14}px;
        font-family: system-ui, sans-serif;
      ">${count}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function CommandCenter() {
  const navigate = useNavigate();
  const [targets, setTargets] = useState<any[]>([]);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    fetch(`${API_BASE}/api/targets`)
      .then(res => res.json())
      .then(data => setTargets(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">MINE-INTEL</h1>
            <h2 className="text-lg font-medium text-slate-600 mt-1">Manganese Exploration Intelligence Platform</h2>
            <div className="flex items-center gap-2 mt-4 text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1 rounded-full w-fit border border-blue-100">
              <MapIcon className="w-4 h-4" />
              Region: Balaghat, Madhya Pradesh
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button
              onClick={() => navigate('/analyze')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold shadow-sm transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              Analyze Exploration Area
            </button>
            <button className="flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm transition-colors">
              <RotateCcw className="w-4 h-4" />
              View Previous Analysis
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">

        {/* Warning label */}
        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-4 py-3 rounded-md border border-amber-200 mb-6 font-medium text-sm">
          <Info className="w-5 h-5 text-amber-600" />
          DEMO / SIMULATED DATA: Values shown are for illustrative prototype purposes.
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          <MetricCard title="Exploration Area" value="1,000" unit="km²" icon={<MapIcon className="text-slate-400 w-6 h-6" />} />
          <MetricCard title="Candidate Cells" value="10,000" icon={<Activity className="text-blue-500 w-6 h-6" />} />
          <MetricCard title="High-Priority Targets" value="100" icon={<Target className="text-orange-500 w-6 h-6" />} />
          <MetricCard title="Field Verified" value="60" icon={<CheckCircle className="text-emerald-500 w-6 h-6" />} />
          <MetricCard title="Model Status" value="Ready" status="success" icon={<ServerStatus />} />
        </div>

        {/* Map Card — premium framing */}
        <div
          className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col"
          style={{ height: '500px' }}
        >
          {/* Card header */}
          <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
            <div>
              <h3 className="font-semibold text-slate-800">Regional Overview: Prospectivity Map</h3>
              <p className="text-xs text-slate-400 mt-0.5">Balaghat, MP · 1,000 km² · Simulated AI prospectivity</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-red-500" />
                AI Prospectivity + Clustered Targets
              </div>
              <button
                onClick={() => navigate('/explorer')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-md transition-colors"
              >
                Full Explorer →
              </button>
            </div>
          </div>

          {/* Map container — relative so the legend can be positioned inside */}
          <div className="flex-1 relative" style={{ zIndex: 0 }}>
            <MapContainer
              center={[21.8, 80.2]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
            >
              {/* BASEMAP — OpenStreetMap standard tiles (free, no API key) */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                subdomains={["a", "b", "c"]}
                maxZoom={19}
              />

              {/* Exploration boundary dashed outline */}
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

              {/* Prospectivity heatmap */}
              <HeatmapLayer
                points={targets.map(t => [t.latitude, t.longitude, t.prospectivityScore / 100.0])}
              />

              {/* Clustered priority targets with custom icons */}
              <MarkerClusterGroup iconCreateFunction={createClusterIcon} maxClusterRadius={60}>
                {targets.map(target => (
                  <CircleMarker
                    key={target.id}
                    center={[target.latitude, target.longitude]}
                    radius={target.prospectivityScore > 90 ? 8 : 6}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 2,
                      fillColor: target.prospectivityScore > 90 ? '#dc2626' : '#f97316',
                      fillOpacity: 0.9,
                    }}
                  >
                    <Popup>
                      <div className="font-sans min-w-[140px]">
                        <div className="font-bold text-slate-900 text-base">{target.targetId}</div>
                        <div className="text-sm text-slate-600 mt-0.5">
                          Prospectivity: <span className="font-semibold text-orange-600">{target.prospectivityScore}/100</span>
                        </div>
                        <div className="text-xs text-slate-400 mb-2">{target.priority.replace('_', ' ')}</div>
                        <button
                          onClick={() => navigate(`/explorer?target=${target.targetId}`)}
                          className="w-full text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 py-1.5 px-2 rounded transition-colors"
                        >
                          Investigate Target →
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>

            {/* Floating legend inside the map card */}
            <ProspectivityLegend />
          </div>
        </div>

      </div>
    </div>
  );
}

function MetricCard({ title, value, unit, icon, status }: { title: string, value: string, unit?: string, icon?: React.ReactNode, status?: 'success' | 'warning' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        {icon}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-3xl font-bold tracking-tight ${status === 'success' ? 'text-emerald-600' : 'text-slate-900'}`}>
          {value}
        </span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function ServerStatus() {
  return (
    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-1 rounded text-xs font-semibold border border-emerald-100">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
      ONLINE
    </div>
  );
}
