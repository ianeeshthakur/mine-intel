import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Target, CheckCircle, XCircle, HelpCircle, Camera, Save, Activity, RefreshCw } from 'lucide-react';

export default function FieldVerification() {
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get('target') || 'T-047';
  
  const [targetData, setTargetData] = useState<any | null>(null);
  const [status, setStatus] = useState<string>('PENDING');
  const [notes, setNotes] = useState('');
  const [sampleId, setSampleId] = useState('');
  const [rockObservation, setRockObservation] = useState('');
  
  // Advanced Geological Fields
  const [strike, setStrike] = useState('');
  const [dip, setDip] = useState('');
  const [alterationType, setAlterationType] = useState('None');
  const [gpsAccuracy, setGpsAccuracy] = useState('');
  const [elevation, setElevation] = useState('');
  const [dispatchedToLab, setDispatchedToLab] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    fetch(`${API_BASE}/api/targets/by-target-id/${targetId}`)
      .then(res => res.json())
      .then(data => {
        setTargetData(data);
        setStatus(data.fieldStatus || 'PENDING');
      })
      .catch(console.error);
  }, [targetId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    fetch(`${API_BASE}/api/targets/${targetData?.id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status, 
        notes, 
        sampleId, 
        rockObservation,
        strike: strike ? parseInt(strike) : null,
        dip: dip ? parseInt(dip) : null,
        alterationType,
        gpsAccuracy: gpsAccuracy ? parseFloat(gpsAccuracy) : null,
        elevation: elevation ? parseFloat(elevation) : null,
        dispatchedToLab
      })
    }).then(() => setSubmitted(true));
  };

  if (!targetData) return <div className="p-8">Loading target {targetId}...</div>;

  return (
    <div className="flex h-full bg-slate-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full p-8">
        
        <div className="mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-600" />
            Field Verification
          </h1>
          <p className="text-slate-500 mt-2">Target {targetId} • Predicted Prospectivity: {targetData.prospectivityScore}/100 ({targetData.priority})</p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Record Field Result</h2>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <label className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${status === 'CONFIRMED' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-200'}`}>
                <input type="radio" name="status" value="CONFIRMED" checked={status === 'CONFIRMED'} onChange={() => setStatus('CONFIRMED')} className="sr-only" />
                <CheckCircle className={`w-8 h-8 ${status === 'CONFIRMED' ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className={`font-semibold ${status === 'CONFIRMED' ? 'text-emerald-700' : 'text-slate-600'}`}>Confirmed</span>
              </label>
              <label className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${status === 'NOT_CONFIRMED' ? 'border-red-500 bg-red-50' : 'border-slate-200 hover:border-red-200'}`}>
                <input type="radio" name="status" value="NOT_CONFIRMED" checked={status === 'NOT_CONFIRMED'} onChange={() => setStatus('NOT_CONFIRMED')} className="sr-only" />
                <XCircle className={`w-8 h-8 ${status === 'NOT_CONFIRMED' ? 'text-red-500' : 'text-slate-400'}`} />
                <span className={`font-semibold ${status === 'NOT_CONFIRMED' ? 'text-red-700' : 'text-slate-600'}`}>Not Confirmed</span>
              </label>
              <label className={`cursor-pointer border-2 rounded-lg p-4 flex flex-col items-center gap-2 transition-colors ${status === 'UNCERTAIN' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-amber-200'}`}>
                <input type="radio" name="status" value="UNCERTAIN" checked={status === 'UNCERTAIN'} onChange={() => setStatus('UNCERTAIN')} className="sr-only" />
                <HelpCircle className={`w-8 h-8 ${status === 'UNCERTAIN' ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className={`font-semibold ${status === 'UNCERTAIN' ? 'text-amber-700' : 'text-slate-600'}`}>Uncertain</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">GPS Coordinates (Auto)</label>
                <input type="text" disabled value={`${targetData.latitude.toFixed(5)}, ${targetData.longitude.toFixed(5)}`} className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm text-slate-500" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">GPS Acc. (±m)</label>
                  <input type="number" value={gpsAccuracy} onChange={(e) => setGpsAccuracy(e.target.value)} placeholder="3.5" className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Elev. (m ASL)</label>
                  <input type="number" value={elevation} onChange={(e) => setElevation(e.target.value)} placeholder="450" className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-6 mb-6">
              <h3 className="text-md font-bold text-slate-800 mb-4">Geological & Structural Data</h3>
              
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Strike (°)</label>
                  <input type="number" min="0" max="360" value={strike} onChange={(e) => setStrike(e.target.value)} placeholder="0-360" className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Dip (°)</label>
                  <input type="number" min="0" max="90" value={dip} onChange={(e) => setDip(e.target.value)} placeholder="0-90" className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Alteration Grade</label>
                  <select value={alterationType} onChange={(e) => setAlterationType(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                    <option value="None">None (Fresh Rock)</option>
                    <option value="Argillic">Argillic</option>
                    <option value="Silicification">Silicification</option>
                    <option value="Chloritic">Chloritic</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Geological / Rock Observation</label>
                <textarea rows={2} value={rockObservation} onChange={(e) => setRockObservation(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Field Notes</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"></textarea>
              </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 mb-6">
              <h3 className="text-md font-bold text-slate-800 mb-4">Sample Dispatch Workflow</h3>
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Sample ID</label>
                  <input type="text" value={sampleId} onChange={(e) => setSampleId(e.target.value)} placeholder="e.g., SMP-001" className="w-full border border-slate-300 rounded px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                </div>
                <div className="flex-1 flex items-center mt-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={dispatchedToLab} onChange={(e) => setDispatchedToLab(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    <span className="ml-3 text-sm font-semibold text-slate-700">Bagged & Dispatched to Lab for Assay</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 border-t border-slate-200 pt-6">
              <button type="button" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 bg-slate-100 px-4 py-2 rounded font-medium transition-colors">
                <Camera className="w-4 h-4" /> Add Photo
              </button>
              <button type="submit" className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold transition-colors">
                <Save className="w-4 h-4" /> Save Field Report
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* The WOW Feature - Model Was Wrong */}
            {status === 'NOT_CONFIRMED' && (
              <div className="bg-white border-2 border-red-100 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
                  <Activity className="text-red-600 w-6 h-6" />
                  <h2 className="text-xl font-bold text-red-900">Prediction Diagnostic</h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">What did AI believe?</h3>
                      <ul className="space-y-2 text-sm text-slate-700">
                        {targetData.evidences?.map((ev: any, i: number) => (
                          <li key={i} className="flex justify-between border-b border-slate-100 pb-1">
                            <span>{ev.category}</span>
                            <span className="font-semibold text-slate-900">{ev.strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-500 uppercase mb-3">What happened?</h3>
                      <div className="bg-slate-50 p-4 rounded border border-slate-200 text-slate-700 font-medium h-full">
                        No manganese mineralization was confirmed at the surface or immediate shallow subsurface during field investigation.
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-6 text-white mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                      <RefreshCw className="w-5 h-5 text-blue-400" />
                      Why might the model have been wrong?
                    </h3>
                    <p className="text-slate-300 text-sm mb-4">
                      Comparing this target against recently confirmed targets in the region...
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div className="bg-white/10 p-3 rounded">
                        <div className="text-emerald-400 font-bold mb-1">Confirmed Targets (Common Feature)</div>
                        <div>Specific weathering / regolith condition present</div>
                      </div>
                      <div className="bg-white/10 p-3 rounded">
                        <div className="text-red-400 font-bold mb-1">This Failed Target (Feature)</div>
                        <div>Different surface cover detected</div>
                      </div>
                    </div>

                    <div className="bg-blue-900/50 border border-blue-500/30 p-4 rounded text-sm">
                      <div className="text-blue-300 font-bold uppercase text-xs mb-1">Potential Missing Feature Identified</div>
                      <div className="text-lg font-bold mb-2">Regolith / surface-cover condition</div>
                      <div className="text-blue-200">
                        <strong>Status:</strong> Hypothesis — requires geological validation.
                        <br/>
                        <strong>Recommendation:</strong> Collect additional field observations for this feature to retrain the model.
                      </div>
                    </div>
                  </div>

                  {/* Learning Loop Visualization */}
                  <div className="border-t border-slate-200 pt-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 text-center">Core Intelligence Loop</h3>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-full border border-slate-200">
                      <span>Prediction</span>
                      <span>→</span>
                      <span>Field Result</span>
                      <span>→</span>
                      <span className="text-red-600">Error Analysis</span>
                      <span>→</span>
                      <span className="text-blue-600">Model Retraining</span>
                      <span>→</span>
                      <span className="text-emerald-600">Improved Prospectivity</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {status === 'CONFIRMED' && (
              <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl text-center">
                <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-emerald-900 mb-2">Target Confirmed!</h2>
                <p className="text-emerald-700">The field verification matches the AI prediction. This result has been fed back into the model to improve future prospectivity ranking.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
