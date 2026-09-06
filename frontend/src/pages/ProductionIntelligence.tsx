import React, { useState, useEffect } from 'react';
import { TrendingDown, AlertTriangle, Hammer, CheckSquare, BarChart2 } from 'lucide-react';

export default function ProductionIntelligence() {
  const [forecast, setForecast] = useState<any | null>(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/production/forecast')
      .then(res => res.json())
      .then(data => setForecast(data))
      .catch(console.error);
  }, []);

  if (!forecast) return <div className="p-8">Loading production forecast...</div>;

  return (
    <div className="flex h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-8">
        
        <div className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-blue-600" />
              Production Intelligence
            </h1>
            <p className="text-slate-500 mt-2">Connecting exploration insights with operational planning.</p>
          </div>
          <div className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded">
            Forecast Period: Q4 2026
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Planned</h3>
            <div className="text-3xl font-bold text-slate-900">{forecast.plannedTonnes.toLocaleString()} <span className="text-lg text-slate-500">t</span></div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Expected</h3>
            <div className="text-3xl font-bold text-slate-900">{forecast.expectedTonnes.toLocaleString()} <span className="text-lg text-slate-500">t</span></div>
          </div>
          <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm text-center">
            <h3 className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Potential Shortfall
            </h3>
            <div className="text-4xl font-extrabold text-red-700">{forecast.potentialShortfall.toLocaleString()} <span className="text-lg text-red-500">t</span></div>
            <div className="mt-2 text-xs font-bold bg-red-200 text-red-800 px-2 py-1 rounded inline-block">
              Risk: {forecast.riskLevel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          {/* Why is a shortfall predicted? */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-amber-500" />
              Why is a shortfall predicted?
            </h2>
            <ul className="space-y-3">
              {forecast.reasons?.map((reason: string, i: number) => {
                const [cause, impact] = reason.split('→').map(s => s.trim());
                const isHigh = impact.toLowerCase().includes('high');
                return (
                  <li key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-100">
                    <span className="font-medium text-slate-700">{cause}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${isHigh ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {impact}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Corrective Actions */}
          <div className="bg-slate-900 p-6 rounded-xl shadow-md text-white">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Hammer className="w-5 h-5 text-blue-400" />
              Recommended Corrective Actions
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              AI-assisted recommendations based on current exploration data and operational constraints.
            </p>
            <ul className="space-y-3">
              {forecast.recommendedActions?.map((action: string, i: number) => (
                <li key={i} className="flex gap-3 items-start bg-white/10 p-3 rounded">
                  <CheckSquare className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="font-medium text-blue-50">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
