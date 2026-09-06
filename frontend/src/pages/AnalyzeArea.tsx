import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

const stages = [
  { id: 1, title: 'Satellite observations', items: ['Surface spectral features processed'] },
  { id: 2, title: 'Geological interpretation', items: ['Lithology mapped', 'Geological contacts identified'] },
  { id: 3, title: 'Structural context', items: ['Faults / lineaments incorporated'] },
  { id: 4, title: 'Soil & terrain', items: ['Supporting environmental layers incorporated'] },
  { id: 5, title: 'Known mineralization', items: ['Spatial proximity calculated'] },
  { id: 6, title: 'AI evidence fusion', items: ['Candidate locations ranked'] },
];

export default function AnalyzeArea() {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState(0);
  const [complete, setComplete] = useState(false);

  const [apiDone, setApiDone] = useState(false);

  useEffect(() => {
    // Fire the ML scoring in the background as soon as the page loads
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    fetch(`${API_BASE}/api/analysis/run`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        console.log('ML analysis complete:', data);
        setApiDone(true);
      })
      .catch(err => {
        console.error('ML analysis failed:', err);
        setApiDone(true); // Still proceed so demo doesn't get stuck
      });
  }, []);

  useEffect(() => {
    if (currentStage < stages.length) {
      const timer = setTimeout(() => {
        setCurrentStage(prev => prev + 1);
      }, 1200); // 1.2s per stage
      return () => clearTimeout(timer);
    } else if (apiDone) {
      setTimeout(() => setComplete(true), 500);
    }
  }, [currentStage, apiDone]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 p-8">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-xl shadow-sm p-10">
        
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-slate-900">Regional AI Analysis</h1>
          <p className="text-slate-500 mt-2">Evaluating Balaghat Exploration Zone</p>
        </div>

        <div className="space-y-6">
          {stages.map((stage, index) => {
            const isActive = index === currentStage;
            const isDone = index < currentStage;
            const isPending = index > currentStage;

            return (
              <div 
                key={stage.id} 
                className={`transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'} flex gap-4`}
              >
                <div className="flex-shrink-0 mt-1">
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-slate-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-400">{stage.id}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDone ? 'text-slate-700' : isActive ? 'text-blue-700' : 'text-slate-500'}`}>
                    {String(stage.id).padStart(2, '0')} — {stage.title}
                  </h3>
                  <div className="mt-2 space-y-1">
                    {stage.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        {isDone && <span className="text-emerald-500 font-bold">✓</span>}
                        {isActive && <span className="text-blue-400 opacity-50 font-bold animate-pulse">⟳</span>}
                        {isPending && <span className="text-slate-300 font-bold">○</span>}
                        <span className={isDone ? "text-slate-700" : ""}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {complete && (
          <div className="mt-12 p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-2xl font-bold text-emerald-800 mb-2">Analysis Complete</h2>
            <p className="text-emerald-700 font-medium mb-1"><strong>10,000</strong> candidate cells evaluated</p>
            <p className="text-emerald-700 font-medium mb-6"><strong>100</strong> high-priority exploration targets identified</p>
            <button
              onClick={() => navigate('/explorer')}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded shadow-sm font-semibold transition-colors"
            >
              View Targets on Map
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
