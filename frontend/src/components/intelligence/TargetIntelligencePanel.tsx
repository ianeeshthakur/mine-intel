import { useNavigate } from 'react-router-dom';
import { MapPin, ShieldAlert, ArrowRight, BookOpen, AlertTriangle, Volume2, Square, Navigation } from 'lucide-react';
import { useNarration } from '../../hooks/useNarration';

export default function TargetIntelligencePanel({ target, onNavigate }: { target: any; onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { play, stop, isPlaying, currentCaption } = useNarration();

  const handleListen = () => {
    if (isPlaying) {
      stop();
    } else {
      if (target.explanationText) {
        // Construct a full narrative combining the explanation and any other relevant text
        play(target.explanationText);
      }
    }
  };

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
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            AI-Generated Explanation
          </h3>
          {target.mlScored && target.explanationText && (
            <button
              onClick={handleListen}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                isPlaying 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" /> Stop
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" /> Listen
                </>
              )}
            </button>
          )}
        </div>
        
        {target.mlScored && target.featureContributionsJson ? (
          <>
            <div className="space-y-3">
              {JSON.parse(target.featureContributionsJson).slice(0, 4).map((c: any, idx: number) => {
                const isPositive = c.shap_value >= 0;
                return (
                  <div key={idx} className={`border-l-2 pl-3 ${isPositive ? 'border-emerald-400' : 'border-rose-400'}`}>
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-sm font-semibold text-slate-800">{String(idx + 1).padStart(2, '0')} — {c.label}</span>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                        {isPositive ? 'Increased' : 'Reduced'} by {c.contribution_pct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 flex overflow-hidden">
                      {isPositive ? (
                        <div 
                          className="h-1.5 bg-emerald-500 rounded-full" 
                          style={{ width: `${Math.min(100, c.contribution_pct * 2)}%` }} 
                        />
                      ) : (
                        <div 
                          className="h-1.5 bg-rose-500 rounded-full ml-auto" 
                          style={{ width: `${Math.min(100, c.contribution_pct * 2)}%` }} 
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {target.explanationText && (
              <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-100 leading-relaxed relative">
                {target.explanationText}
                
                {/* Active Caption Overlay */}
                {isPlaying && currentCaption && (
                  <div className="mt-3 p-2 bg-blue-900 text-white font-medium rounded shadow-inner text-center animate-pulse">
                    "{currentCaption}"
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-3">
            {target.evidences?.map((ev: any, idx: number) => (
              <div key={idx} className="border-l-2 border-slate-300 pl-3">
                <div className="flex justify-between items-baseline mb-0.5">
                  <span className="text-sm font-semibold text-slate-800">{String(idx + 1).padStart(2, '0')} — {ev.category}</span>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{ev.strength}</span>
                </div>
                <p className="text-sm text-slate-600">{ev.description}</p>
              </div>
            ))}
            <div className="mt-4 p-3 bg-slate-50 text-slate-600 text-sm font-medium rounded border border-slate-200">
              Run Regional AI Analysis to generate ML explanation.
            </div>
          </div>
        )}
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

          {/* ── Navigate to Target CTA (primary) ── */}
          {onNavigate && (
            <button
              onClick={onNavigate}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-2.5 px-4 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 mb-2 shadow-lg shadow-red-900/30"
            >
              <Navigation className="w-4 h-4" />
              Navigate to Target
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* ── Field Verification (secondary) ── */}
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
