import { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, XCircle, BrainCircuit } from 'lucide-react';

export default function DataHealth() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    fetch(`${API_BASE}/api/analysis/model-metrics`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setMetrics(data);
      })
      .catch(err => console.error("Could not load ML metrics", err));
  }, []);

  const dataSources = [
    { name: 'Satellite (Sentinel-2, Sentinel-1, Landsat)', provider: 'ESA / Copernicus / USGS', status: 'ready' },
    { name: 'Geological (Lithology, Structures)', provider: 'NGDR / GSI', status: 'ready' },
    { name: 'Soil (pH, Clay, Sand, SOC)', provider: 'SoilGrids', status: 'ready' },
    { name: 'Terrain (DEM)', provider: 'Copernicus DEM', status: 'ready' },
    { name: 'Known Mineralization', provider: 'Historical Records', status: 'partial' },
    { name: 'Drillhole / Assay Data', provider: 'MOIL / Restricted', status: 'dependent' },
    { name: 'Field Ground Truth', provider: 'Exploration Teams', status: 'required' },
  ];

  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'ready': 
        return <div className="flex items-center gap-2 text-emerald-600 font-bold"><CheckCircle2 className="w-5 h-5"/> Ready</div>;
      case 'partial':
        return <div className="flex items-center gap-2 text-amber-500 font-bold"><AlertCircle className="w-5 h-5"/> Partial</div>;
      case 'dependent':
        return <div className="flex items-center gap-2 text-amber-600 font-bold"><AlertCircle className="w-5 h-5"/> Access dependent</div>;
      case 'required':
        return <div className="flex items-center gap-2 text-red-500 font-bold"><XCircle className="w-5 h-5"/> Required for validation</div>;
      default: return null;
    }
  }

  return (
    <div className="flex flex-col items-center min-h-full bg-slate-50 p-8 overflow-y-auto">
      <div className="max-w-3xl w-full pb-12">
        
        <div className="mb-8 border-b border-slate-200 pb-6 text-center">
          <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Health & Pipeline</h1>
          <p className="text-slate-500 mt-2">Status of integrated geospatial data layers for Balaghat region.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Data Source / Feature</th>
                <th className="px-6 py-4">Expected Provider</th>
                <th className="px-6 py-4">Integration Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {dataSources.map((ds, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-semibold text-slate-800">{ds.name}</td>
                  <td className="px-6 py-4 text-slate-500">{ds.provider}</td>
                  <td className="px-6 py-4">{getStatusDisplay(ds.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-4 mb-8">
          <div className="text-blue-600 mt-1"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <h3 className="text-blue-900 font-bold mb-1">Decision Confidence: Moderate</h3>
            <p className="text-blue-800 text-sm">
              High model evidence scores are supported by robust satellite and geological layers. 
              However, confidence remains moderate due to limited drillhole assay data and required field ground-truth validation.
            </p>
          </div>
        </div>

        {metrics && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <BrainCircuit className="w-6 h-6 text-purple-600" />
              ML Model Diagnostics
            </h2>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-sm font-bold text-purple-600 uppercase tracking-wider mb-1">Random Forest Classifier</p>
                  <p className="text-xs text-slate-500">{metrics.data_note}</p>
                </div>
                <div className="text-right text-xs text-slate-500 font-mono bg-slate-100 p-2 rounded">
                  Spatial Split: {metrics.train_zones?.join(',')} → {metrics.test_zones?.join(',')}
                  <br/>
                  Train: {metrics.train_size} | Test: {metrics.test_size}
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(metrics.metrics).map(([key, val]: any) => (
                  <div key={key} className="bg-slate-50 border border-slate-100 p-3 rounded text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">{key.replace('_', ' ')}</div>
                    <div className="text-xl font-mono font-bold text-slate-800">{(val as number).toFixed(4)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
