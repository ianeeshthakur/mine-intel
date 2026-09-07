import React from 'react';
import { Navigation, Clock, Crosshair, ArrowLeft, Route, Compass } from 'lucide-react';
import { compassLabel } from '../../hooks/useFieldNavigation';

interface Props {
  targetId: string;
  score: number;
  priority: string;
  distanceMeters: number;
  etaMinutes: number;
  bearingDeg: number;
  routeType: 'road' | 'direct';
  accuracy: number;
  onBack: () => void;
  onForceRoad: () => void;
  onForceDirect: () => void;
}

function priorityColor(p: string) {
  switch (p) {
    case 'VERY_HIGH': return 'text-red-400';
    case 'HIGH': return 'text-orange-400';
    case 'MEDIUM': return 'text-yellow-400';
    default: return 'text-emerald-400';
  }
}

function formatDist(m: number) {
  if (m < 1000) return { value: Math.round(m).toString(), unit: 'm' };
  return { value: (m / 1000).toFixed(1), unit: 'km' };
}

export default function NavigationInfoCard({
  targetId, score, priority, distanceMeters, etaMinutes,
  bearingDeg, routeType, accuracy, onBack, onForceRoad, onForceDirect,
}: Props) {
  const dist = formatDist(distanceMeters);
  const bearing = Math.round(bearingDeg);
  const dir = compassLabel(bearingDeg);
  const pc = priorityColor(priority);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[500] pointer-events-none px-3 pb-3">
      <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700/60 shadow-2xl overflow-hidden">
        {/* Mission header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1 rounded hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </button>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Field Navigation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Crosshair className="w-3 h-3" />
              <span>±{accuracy}m</span>
            </div>
            <div className={`flex items-center gap-1 text-xs ${routeType === 'road' ? 'text-blue-400' : 'text-amber-400'}`}>
              <Route className="w-3 h-3" />
              <span>{routeType === 'road' ? 'Road Route' : 'Direct Path'}</span>
            </div>
          </div>
        </div>

        {/* Main metrics */}
        <div className="px-4 py-4">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {/* Distance */}
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-white tracking-tight leading-none">{dist.value}</span>
                <span className="text-lg font-bold text-slate-400">{dist.unit}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Remaining</div>
            </div>
            {/* ETA */}
            <div className="text-center border-x border-slate-700/50">
              <div className="flex items-center justify-center gap-1 mt-1">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-3xl font-black text-white tracking-tight leading-none">~{etaMinutes}</span>
                <span className="text-sm font-bold text-slate-400">min</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Est. Walk</div>
            </div>
            {/* Bearing */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mt-1">
                <Navigation className="w-4 h-4 text-blue-400" style={{ transform: `rotate(${bearing}deg)` }} />
                <span className="text-2xl font-black text-white leading-none">{bearing}°</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{dir}</div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-700/50 mb-3" />

          {/* Target info + route toggles */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-sm">{targetId}</div>
              <div className="text-xs text-slate-400">
                Prospectivity <span className="font-bold text-white">{score}</span>
                <span className={`ml-2 font-bold ${pc}`}>• {priority.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onForceDirect}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors ${routeType === 'direct' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                Direct
              </button>
              <button
                onClick={onForceRoad}
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors ${routeType === 'road' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
              >
                Road
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
