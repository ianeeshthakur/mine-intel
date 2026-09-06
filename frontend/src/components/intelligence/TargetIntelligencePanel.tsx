import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ShieldAlert, ArrowRight, BookOpen, AlertTriangle } from 'lucide-react';

export default function TargetIntelligencePanel({ target }: { target: any }) {
  const navigate = useNavigate();

  return (
    <div className="p-5 space-y-8 bg-white">
      
      {/* Header Info */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prospectivity</div>
            <div className="flex items-baseline gap-1">
              <span className={`text-4xl font-extrabold tracking-tight ${target.prospectivityScore > 90 ? 'text-red-600' : 'text-orange-600'}`}>
                {target.prospectivityScore}
              </span>
              <span className="text-slate-400 font-medium text-lg">/ 100</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Priority</div>
            <div className={`px-2 py-1 rounded text-xs font-bold ${target.priority === 'VERY_HIGH' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}`}>
              {target.priority.replace('_', ' ')}
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm">
          <div className="flex items-center gap-2 text-slate-600 mb-1">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="font-medium">Coordinates</span>
          </div>
          <div className="text-slate-800 font-mono">
            {target.latitude.toFixed(4)}° N, {target.longitude.toFixed(4)}° E
          </div>
        </div>
      </div>

      {/* Why this target? (Evidence FOR) */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          Why did AI prioritize this location?
        </h3>
        <div className="space-y-3">
          {target.evidences?.map((ev: any, idx: number) => (
            <div key={idx} className="border-l-2 border-blue-400 pl-3">
              <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-sm font-semibold text-slate-800">{String(idx + 1).padStart(2, '0')} — {ev.category}</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{ev.strength}</span>
              </div>
              <p className="text-sm text-slate-600">{ev.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm font-medium rounded border border-blue-100">
          <strong>Overall Interpretation:</strong> Multiple independent evidence layers strongly support further investigation.
        </div>
      </div>

      {/* Counter-Evidence (Why it might be wrong) */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          What could make this prediction wrong?
        </h3>
        <ul className="space-y-2">
          {target.counterEvidences?.map((cev: any, idx: number) => (
            <li key={idx} className="flex gap-2 text-sm text-slate-700 bg-amber-50 p-2 rounded border border-amber-100">
              <span className="text-amber-600 mt-0.5">⚠</span>
              <span>{cev.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Unknown Information */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-slate-500" />
          What don't we know yet?
        </h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
          {target.unknownFactors?.map((uf: any, idx: number) => (
            <li key={idx}>{uf.description}</li>
          ))}
        </ul>
      </div>

      {/* Next Best Action */}
      <div className="border-t border-slate-200 pt-6 pb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Recommended Next Action</h3>
        <div className="bg-slate-900 text-white p-4 rounded-lg shadow-md">
          <div className="font-bold text-lg mb-1">FIELD GEOLOGICAL VERIFICATION</div>
          <p className="text-slate-300 text-sm mb-4">High surface and geological evidence present, but no direct subsurface confirmation.</p>
          <button 
            onClick={() => navigate(`/verification?target=${target.targetId}`)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
          >
            Execute Field Verification
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
