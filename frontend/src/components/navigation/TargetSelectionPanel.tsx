import React, { useState, useMemo } from 'react';
import { MapPin, Zap, Navigation, X, ChevronRight, ArrowUpDown } from 'lucide-react';
import { haversineMeters, compassLabel, bearingDeg } from '../../hooks/useFieldNavigation';
import type { LatLng } from '../../hooks/useFieldNavigation';

interface Target {
  id: number;
  targetId: string;
  latitude: number;
  longitude: number;
  prospectivityScore: number;
  priority: string;
  mlScored?: boolean;
}

interface Props {
  targets: Target[];
  userLocation: LatLng;
  isGpsReal: boolean;
  onSelectTarget: (target: Target) => void;
  onClose: () => void;
}

function priorityColor(priority: string) {
  switch (priority) {
    case 'VERY_HIGH': return { bg: 'bg-red-600', text: 'text-red-600', badge: 'bg-red-100 text-red-700', border: 'border-red-200' };
    case 'HIGH':      return { bg: 'bg-orange-500', text: 'text-orange-500', badge: 'bg-orange-100 text-orange-700', border: 'border-orange-200' };
    case 'MEDIUM':    return { bg: 'bg-yellow-500', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' };
    default:          return { bg: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' };
  }
}

function formatDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function formatPriority(p: string) {
  return p.replace('_', ' ');
}

export default function TargetSelectionPanel({ targets, userLocation, isGpsReal, onSelectTarget, onClose }: Props) {
  const [sortBy, setSortBy] = useState<'score' | 'distance'>('score');

  const enriched = useMemo(() => {
    return targets.slice(0, 20).map(t => ({
      ...t,
      distance: haversineMeters(userLocation, { lat: t.latitude, lng: t.longitude }),
      bearing: bearingDeg(userLocation, { lat: t.latitude, lng: t.longitude }),
    }));
  }, [targets, userLocation]);

  const sorted = useMemo(() => {
    return [...enriched].sort((a, b) =>
      sortBy === 'score' ? b.prospectivityScore - a.prospectivityScore : a.distance - b.distance
    );
  }, [enriched, sortBy]);

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-slate-700/60">
        <div className="flex items-start justify-between mb-1">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Mine-Intel</div>
            <h1 className="text-2xl font-extrabold tracking-tight">FIELD TARGETS</h1>
            <p className="text-sm text-slate-400 mt-1">Prioritized prospectivity targets ready for field verification.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 transition-colors ml-4 flex-shrink-0">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* GPS Status */}
        <div className="flex items-center gap-2 mt-3">
          <span className={`w-2 h-2 rounded-full ${isGpsReal ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          <span className="text-xs font-semibold text-slate-400">
            {isGpsReal ? 'GPS Active' : 'Demo Location'}
          </span>
        </div>

        {/* Sort control */}
        <div className="flex items-center gap-2 mt-4">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Sort</span>
          <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setSortBy('score')}
              className={`px-3 py-1.5 transition-colors ${sortBy === 'score' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              Highest Score
            </button>
            <button
              onClick={() => setSortBy('distance')}
              className={`px-3 py-1.5 transition-colors ${sortBy === 'distance' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            >
              Nearest
            </button>
          </div>
        </div>
      </div>

      {/* Target Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {sorted.map((target, idx) => {
          const c = priorityColor(target.priority);
          return (
            <div
              key={target.targetId}
              className={`bg-slate-800 rounded-xl border ${c.border} overflow-hidden hover:bg-slate-750 transition-colors`}
            >
              {/* Score bar accent */}
              <div
                className={`h-1 ${c.bg}`}
                style={{ width: `${target.prospectivityScore}%` }}
              />
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        #{idx + 1} Target
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${c.badge}`}>
                        {formatPriority(target.priority)}
                      </span>
                    </div>
                    <div className="text-xl font-extrabold tracking-tight mt-0.5">{target.targetId}</div>
                  </div>
                  {/* Score */}
                  <div className="text-right">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Prospectivity</div>
                    <div className={`text-3xl font-black leading-none ${c.text}`}>
                      {target.prospectivityScore}
                    </div>
                    <div className="text-xs text-slate-500">/ 100</div>
                  </div>
                </div>

                {/* Distance + bearing */}
                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{formatDistance(target.distance)}</span>
                    <span className="text-slate-500">away</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Navigation className="w-3.5 h-3.5" style={{ transform: `rotate(${target.bearing}deg)` }} />
                    <span className="font-mono text-xs">{Math.round(target.bearing)}° {compassLabel(target.bearing)}</span>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="text-xs text-slate-500 font-mono mb-4">
                  {target.latitude.toFixed(4)}°N, {target.longitude.toFixed(4)}°E
                </div>

                {/* ML badge */}
                {target.mlScored && (
                  <div className="flex items-center gap-1 mb-3">
                    <Zap className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">AI-Scored Target</span>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={() => onSelectTarget(target)}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all active:scale-95 ${c.bg} text-white hover:opacity-90`}
                >
                  <Navigation className="w-4 h-4" />
                  GO TO THIS LOCATION
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
