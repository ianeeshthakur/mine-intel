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

// Custom DivIcon for clusters — neutral slate color, rounded square with targets label
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  const children = cluster.getAllChildMarkers();
  
  let minScore = 100;
  let maxScore = 0;
  let sumScore = 0;
  let validCount = 0;

  children.forEach((marker: any) => {
    const target = marker.options.targetData;
    if (target && typeof target.prospectivityScore === 'number') {
      const score = target.prospectivityScore;
      if (score < minScore) minScore = score;
      if (score > maxScore) maxScore = score;
      sumScore += score;
      validCount++;
    }
  });

  const avgScore = validCount > 0 ? Math.round(sumScore / validCount) : 0;
  const rangeText = validCount > 0 ? `Score range: ${minScore}–${maxScore}` : 'Scores unavailable';
  const tooltipText = `${count} targets\n${rangeText}\nAvg score: ${avgScore}`;

  const color = '#334155'; // slate-700
  const size = count > 15 ? 46 : count > 8 ? 42 : 38;

  return L.divIcon({
    html: `
      <div 
        title="${tooltipText}"
        style="
        width: ${size}px; height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 8px; /* Distinct shape from score circles */
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        color: white; font-family: system-ui, sans-serif;
      ">
        <span style="font-weight: 700; font-size: ${count > 9 ? 12 : 14}px; line-height: 1;">${count}</span>
        <span style="font-weight: 500; font-size: 8px; line-height: 1; opacity: 0.8; margin-top: 1px;">targets</span>
      </div>`,
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

        {/* Map and Top Targets Layout */}
        <div className="flex gap-6 h-[520px]">
          {/* Map Card */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col">
            {/* Card header */}
            <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center bg-white flex-shrink-0">
              <div>
                <h3 className="font-semibold text-slate-800">Regional Overview: Prospectivity Map</h3>
                <p className="text-xs text-slate-400 mt-0.5">Balaghat, MP · 1,000 km² · Simulated AI prospectivity</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-slate-700" />
                  Target Clusters
                </div>
                <button
                  onClick={() => navigate('/explorer')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-md transition-colors"
                >
                  Full Explorer →
                </button>
              </div>
            </div>

            {/* Map container */}
            <div className="flex-1 relative" style={{ zIndex: 0 }}>
              <MapContainer
                center={[21.8, 80.2]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                zoomControl={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  subdomains={["a", "b", "c"]}
                  maxZoom={19}
                />

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

                <HeatmapLayer
                  points={targets.map(t => [t.latitude, t.longitude, t.prospectivityScore / 100.0])}
                />

                <MarkerClusterGroup iconCreateFunction={createClusterIcon} maxClusterRadius={60}>
                  {targets.map(target => (
                    <CircleMarker
                      key={target.id}
                      center={[target.latitude, target.longitude]}
                      radius={target.prospectivityScore > 90 ? 8 : 6}
                      // @ts-ignore
                      targetData={target}
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

              <ProspectivityLegend />
            </div>
          </div>

          {/* Top Targets Panel */}
          <div className="w-[380px] bg-white border border-slate-200 rounded-xl shadow-md flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2 flex-shrink-0">
              <Target className="w-5 h-5 text-slate-600" />
              <h3 className="font-bold text-slate-800">Top Priority Targets</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {targets.slice(0, 8).map((target, idx) => {
                let topFeature = "Multiple factors";
                if (target.mlScored && target.featureContributionsJson) {
                  try {
                    const shap = JSON.parse(target.featureContributionsJson);
                    if (shap && shap.length > 0) {
                      topFeature = shap[0].label;
                    }
                  } catch (e) {}
                }

                return (
                  <button
                    key={target.targetId}
                    onClick={() => navigate(`/explorer?target=${target.targetId}`)}
                    className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex flex-col gap-1.5 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{idx + 1}. {target.targetId}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          target.priority === 'VERY_HIGH' ? 'bg-red-100 text-red-700' :
                          target.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                          target.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {target.priority.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-0.5">
                        <span className={`text-lg font-bold ${
                          target.prospectivityScore > 90 ? 'text-red-600' :
                          target.prospectivityScore > 80 ? 'text-orange-600' : 'text-slate-700'
                        }`}>
                          {target.prospectivityScore}
                        </span>
                        <span className="text-xs text-slate-400">/100</span>
                      </div>
                    </div>
                    {target.mlScored && (
                      <div className="text-xs text-slate-500 truncate">
                        <span className="font-semibold text-slate-600">Top factor:</span> {topFeature}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
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
