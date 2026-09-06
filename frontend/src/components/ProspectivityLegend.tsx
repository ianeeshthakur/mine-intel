import React from 'react';

// Floating legend that sits inside the map card (position: absolute inside relative parent)
export default function ProspectivityLegend() {
  const tiers = [
    { label: 'Very High (0.8–1.0)', color: '#dc2626' },
    { label: 'High (0.6–0.8)',       color: '#f97316' },
    { label: 'Medium (0.35–0.6)',    color: '#facc15' },
    { label: 'Low (0–0.35)',         color: '#22c55e' },
  ];

  return (
    <div
      className="absolute bottom-6 left-4 z-[1000] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg shadow-md p-3 text-xs"
      style={{ pointerEvents: 'none' }}
    >
      <div className="font-bold text-slate-700 mb-2 uppercase tracking-wider text-[10px]">
        Prospectivity
      </div>
      <div className="space-y-1.5">
        {tiers.map(tier => (
          <div key={tier.label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: tier.color }}
            />
            <span className="text-slate-600">{tier.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
        SIMULATED DEMO DATA
      </div>
    </div>
  );
}
