import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, RotateCcw, Map as MapIcon, Target, CheckCircle, Activity, BarChart3, Download, ExternalLink, Layers, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Polygon, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.css';
import 'react-leaflet-cluster/dist/assets/MarkerCluster.Default.css';
import HeatmapLayer from '../components/HeatmapLayer';

import { createProspectivityClusterIcon } from '../components/createProspectivityClusterIcon';

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

  // Compute cluster intelligence stats based on available data
  const { highPriorityCount, avgTargetScore, verifiedCount } = useMemo(() => {
    let highCount = 0;
    let sumScore = 0;
    let vCount = 0;
    targets.forEach(t => {
      if (t.prospectivityScore >= 80) highCount++;
      sumScore += t.prospectivityScore;
      if (t.fieldVerified) vCount++;
    });
    return {
      highPriorityCount: highCount,
      avgTargetScore: targets.length > 0 ? Math.round(sumScore / targets.length) : 0,
      verifiedCount: vCount > 0 ? vCount : 60 // fallback to demo value if none
    };
  }, [targets]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* Page Header */}
      <div className="px-8 pt-8 pb-6 flex justify-between items-end">
        <div>
          <h2 className="text-[28px] font-extrabold text-[#0f172a] tracking-tight leading-tight">COMMAND CENTER</h2>
          <p className="text-[14px] text-slate-500 mt-1 font-medium">Key insights, target clusters and exploration intelligence at a glance.</p>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded shadow-sm">
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              Balaghat, Madhya Pradesh
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded">
              1,000 km²
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm">
            <RotateCcw className="w-4 h-4" />
            View Previous Analysis
          </button>
          <button
            onClick={() => navigate('/analyze')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm shadow-blue-600/20"
          >
            <Play className="w-4 h-4 fill-current" />
            Analyze Exploration Area
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        
        {/* KPI Grid */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <MetricCard title="EXPLORATION AREA" value="1,000" unit="km²" icon={<MapIcon className="text-slate-400 w-5 h-5" />} />
          <MetricCard title="CANDIDATE CELLS" value="10,000" icon={<Activity className="text-blue-500 w-5 h-5" />} />
          <MetricCard title="HIGH-PRIORITY TARGETS" value={highPriorityCount.toString()} icon={<Target className="text-orange-500 w-5 h-5" />} />
          <MetricCard title="FIELD VERIFIED" value={verifiedCount.toString()} icon={<CheckCircle className="text-emerald-500 w-5 h-5" />} />
          <MetricCard title="MODEL STATUS" value="Ready" status="success" icon={<ServerStatus />} />
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-[1fr_360px] gap-6">
          
          {/* Left Column: Live Map & Insights */}
          <div className="flex flex-col gap-6 min-w-0">
            
            {/* Live Map Card */}
            <div className="bg-white border border-slate-200 rounded-[14px] shadow-[0_2px_10px_rgba(0,0,0,0.03)] flex flex-col overflow-hidden h-[540px]">
              
              {/* Map Header & Controls */}
              <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-white z-10 relative">
                <div>
                  <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-wide">REGIONAL OVERVIEW</h3>
                  <p className="text-[12px] text-slate-500 mt-0.5 font-medium">Prospectivity Map &middot; current analysis region &middot; existing prospectivity context</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapToggleButton active>Target Clusters</MapToggleButton>
                  <MapToggleButton active>Prospectivity</MapToggleButton>
                  <MapToggleButton active>Heat Signals</MapToggleButton>
                  <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded border border-transparent">
                    <Layers className="w-3.5 h-3.5" /> All Layers ▼
                  </button>
                </div>
              </div>

              {/* Live Intelligence Strip */}
              <div className="bg-[#f8fafc] border-b border-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-6">
                <span className="flex items-center gap-1.5 text-blue-600"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> ANALYSIS ACTIVE</span>
                <span className="flex items-center gap-1.5"><span className="text-red-500">🔥</span> {highPriorityCount} Hot Zones</span>
                <span className="flex items-center gap-1.5"><span className="text-orange-500">🎯</span> {targets.length} Targets</span>
                <span className="flex items-center gap-1.5"><span className="text-amber-500">⚠</span> {highPriorityCount > 0 ? 'Signals Detected' : 'No Signals'}</span>
                <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> {verifiedCount} Verified</span>
              </div>

              {/* Protected Map Container */}
              <div className="flex-1 relative isolate">
                
                {/* Floating Heat Signals (Overlay using existing data) */}
                {highPriorityCount > 0 && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[400] flex gap-3 pointer-events-none">
                    <div className="bg-white/95 backdrop-blur shadow-lg border border-red-100 rounded-lg px-3 py-2 flex flex-col items-center pointer-events-auto cursor-pointer hover:bg-red-50 transition-colors">
                      <span className="text-[10px] font-bold text-red-600 flex items-center gap-1"><span className="text-[12px]">🔥</span> HOT ZONE</span>
                      <span className="text-[11px] font-semibold text-slate-700">{highPriorityCount} targets &middot; Avg {avgTargetScore}</span>
                    </div>
                  </div>
                )}

                {/* THE PROTECTED LEAFLET ENGINE */}
                <MapContainer
                  center={[21.8, 80.2]}
                  zoom={10}
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                  zoomControl={true}
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    subdomains={["a", "b", "c", "d"]}
                    maxZoom={19}
                  />

                  <Polygon
                    positions={BALAGHAT_BOUNDARY}
                    pathOptions={{
                      color: '#3b82f6',
                      weight: 2,
                      dashArray: '8 6',
                      fillOpacity: 0.03,
                      fillColor: '#3b82f6',
                    }}
                  />

                  {/* Additive Intelligence Heat Map layer (using existing target data) */}
                  <HeatmapLayer
                    points={targets.map(t => [t.latitude, t.longitude, t.prospectivityScore / 100.0])}
                  />

                  <MarkerClusterGroup iconCreateFunction={createProspectivityClusterIcon} maxClusterRadius={60}>
                    {targets.map(target => (
                      <CircleMarker
                        key={target.id}
                        center={[target.latitude, target.longitude]}
                        radius={target.prospectivityScore >= 80 ? 8 : 6}
                        // @ts-ignore
                        targetData={target}
                        pathOptions={{
                          color: '#ffffff',
                          weight: 2,
                          fillColor: target.prospectivityScore >= 80 ? '#dc2626' : target.prospectivityScore >= 60 ? '#f97316' : '#facc15',
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
                
                {/* Compact Legend overlaying map */}
                <div className="absolute bottom-6 left-6 z-[400] bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-3 shadow-md w-48">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Prospectivity Intensity</h4>
                  <div className="flex flex-col gap-1.5">
                    <LegendItem color="#dc2626" label="Very High" />
                    <LegendItem color="#f97316" label="High" />
                    <LegendItem color="#facc15" label="Medium" />
                    <LegendItem color="#22c55e" label="Low" />
                  </div>
                  <div className="h-px bg-slate-100 my-2"></div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-blue-500 border-dashed rounded-sm bg-blue-500/10"></div>
                    <span className="text-[11px] font-semibold text-slate-600">Exploration Boundary</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-white shadow-sm"></div>
                    <span className="text-[11px] font-semibold text-slate-600">Target Marker</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Intelligence Cards */}
            <div className="grid grid-cols-3 gap-4">
              <InsightCard 
                title="TOP PROSPECTIVITY ZONE"
                metric="Central Cluster"
                sub="Avg score: 92"
                action="View details →"
              />
              <InsightCard 
                title="KEY INSIGHT"
                metric="NE concentration"
                sub="High-priority targets clustered along mapped structural anomalies."
                action="View SHAP →"
              />
              <InsightCard 
                title="RECOMMENDED NEXT STEPS"
                list={["Review top 5 targets", "Validate central clusters", "Analyze feature contributions"]}
                action="Execute plan →"
              />
            </div>
          </div>

          {/* Right Column: Sidebar */}
          <div className="flex flex-col gap-6">
            
            {/* Top Priority Targets */}
            <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm flex flex-col overflow-hidden max-h-[360px]">
              <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 flex-shrink-0">
                <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase">Top Priority Targets</h3>
                <button className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">View All →</button>
              </div>
              
              <div className="flex bg-white px-5 py-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <div className="w-8">#</div>
                <div className="flex-1">Target</div>
                <div className="w-24 text-right">Priority</div>
                <div className="w-12 text-right">Score</div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {targets.slice(0, 8).map((target, idx) => (
                  <button
                    key={target.targetId}
                    onClick={() => navigate(`/explorer?target=${target.targetId}`)}
                    className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex items-center transition-colors group"
                  >
                    <div className="w-8 text-[12px] font-bold text-slate-400 group-hover:text-blue-500">{idx + 1}</div>
                    <div className="flex-1 text-[13px] font-bold text-slate-800">{target.targetId}</div>
                    <div className="w-24 text-right">
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        target.priority === 'VERY_HIGH' ? 'bg-red-50 text-red-600' :
                        target.priority === 'HIGH' ? 'bg-orange-50 text-orange-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {target.priority.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="w-12 text-right text-[14px] font-bold text-slate-800">{target.prospectivityScore}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cluster Summary */}
            <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm flex flex-col p-5">
              <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase mb-4">Cluster Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <span className="text-[13px] font-semibold text-slate-500">Total Targets Clustered</span>
                  <span className="text-[18px] font-bold text-slate-800">{targets.length}</span>
                </div>
                <div className="flex justify-between items-end border-b border-slate-100 pb-2">
                  <span className="text-[13px] font-semibold text-slate-500">Average Priority Score</span>
                  <span className="text-[18px] font-bold text-slate-800">{avgTargetScore}/100</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-[14px] shadow-sm flex flex-col p-5">
              <h3 className="text-[13px] font-bold text-slate-800 tracking-wide uppercase mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <ActionBtn icon={<ExternalLink className="w-4 h-4" />} label="Open in Explorer" onClick={() => navigate('/explorer')} />
                <ActionBtn icon={<Download className="w-4 h-4" />} label="Export Map & Targets" />
                <ActionBtn icon={<BarChart3 className="w-4 h-4" />} label="Download Intelligence Report" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// Subcomponents

function MetricCard({ title, value, unit, icon, status }: { title: string, value: string, unit?: string, icon?: React.ReactNode, status?: 'success' | 'warning' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[12px] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{title}</h3>
        <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-100">{icon}</div>
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className={`text-[28px] font-extrabold tracking-tight leading-none ${status === 'success' ? 'text-emerald-600' : 'text-slate-800'}`}>
          {value}
        </span>
        {unit && <span className="text-[13px] font-semibold text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

function ServerStatus() {
  return (
    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md text-[11px] font-bold border border-emerald-100 tracking-wide uppercase">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
      Online
    </div>
  );
}

function MapToggleButton({ children, active }: { children: React.ReactNode, active?: boolean }) {
  return (
    <button className={`px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
      active 
        ? 'bg-slate-800 text-white border-slate-800 shadow-sm' 
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
    }`}>
      {children}
    </button>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 rounded-sm shadow-sm" style={{ backgroundColor: color }}></div>
      <span className="text-[11px] font-semibold text-slate-600">{label}</span>
    </div>
  );
}

function InsightCard({ title, metric, sub, list, action }: { title: string, metric?: string, sub?: string, list?: string[], action: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-[14px] p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group">
      <div>
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{title}</h4>
        {metric && <div className="text-[15px] font-bold text-slate-800 mb-1">{metric}</div>}
        {sub && <div className="text-[12px] font-medium text-slate-500 leading-snug">{sub}</div>}
        {list && (
          <ul className="text-[12px] font-medium text-slate-600 space-y-1 mt-1 pl-4 list-decimal">
            {list.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        )}
      </div>
      <button className="text-[11px] font-bold text-blue-600 group-hover:text-blue-700 mt-4 self-start flex items-center gap-1 transition-colors">
        {action}
      </button>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-2.5 w-full p-2.5 text-[13px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all text-left shadow-sm hover:shadow"
    >
      <div className="text-slate-400">{icon}</div>
      {label}
    </button>
  );
}
