import React from 'react';
import { CheckCircle, ArrowRight, Navigation, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  targetId: string;
  score: number;
  priority: string;
  onContinue: () => void;
}

function priorityColor(p: string) {
  switch (p) {
    case 'VERY_HIGH': return { bg: 'bg-red-600', text: 'text-red-400', badge: 'bg-red-900/50 text-red-300 border-red-700/50' };
    case 'HIGH':      return { bg: 'bg-orange-500', text: 'text-orange-400', badge: 'bg-orange-900/50 text-orange-300 border-orange-700/50' };
    case 'MEDIUM':    return { bg: 'bg-yellow-500', text: 'text-yellow-400', badge: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50' };
    default:          return { bg: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50' };
  }
}

export default function ArrivalState({ targetId, score, priority, onContinue }: Props) {
  const navigate = useNavigate();
  const c = priorityColor(priority);

  const handleVerify = () => {
    navigate(`/verification?target=${targetId}`);
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[500] pointer-events-none px-3 pb-3">
      <div className="pointer-events-auto bg-slate-900/98 backdrop-blur-sm rounded-2xl border border-emerald-700/40 shadow-2xl overflow-hidden">
        {/* Success header */}
        <div className="bg-emerald-900/60 border-b border-emerald-700/40 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 animate-pulse">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-emerald-400">Mission Status</div>
            <div className="text-lg font-extrabold text-white tracking-tight">ARRIVED AT TARGET</div>
          </div>
        </div>

        {/* Target summary */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-2xl font-extrabold text-white tracking-tight">{targetId}</div>
              <div className={`inline-flex items-center gap-1 mt-1 text-xs font-bold uppercase px-2 py-0.5 rounded border ${c.badge}`}>
                {priority.replace('_', ' ')}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-5xl font-black ${c.text} leading-none`}>{score}</div>
              <div className="text-xs text-slate-500 mt-1">/ 100 Prospectivity</div>
            </div>
          </div>

          {/* Primary CTA */}
          <button
            onClick={handleVerify}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base transition-all active:scale-95 shadow-lg shadow-emerald-900/40 mb-3"
          >
            <CheckCircle className="w-5 h-5" />
            MARK AS VERIFIED
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Secondary CTA */}
          <button
            onClick={onContinue}
            className="w-full flex items-center justify-center gap-1 py-2 text-sm font-semibold text-slate-400 hover:text-slate-300 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Continue Navigation
          </button>
        </div>
      </div>
    </div>
  );
}
