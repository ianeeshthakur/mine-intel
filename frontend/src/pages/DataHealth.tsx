

import { Database, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export default function DataHealth() {
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
    <div className="flex flex-col items-center min-h-full bg-slate-50 p-8">
      <div className="max-w-3xl w-full">
        
        <div className="mb-8 border-b border-slate-200 pb-6 text-center">
          <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Data Health & Pipeline</h1>
          <p className="text-slate-500 mt-2">Status of integrated geospatial data layers for Balaghat region.</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
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

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-start gap-4">
          <div className="text-blue-600 mt-1"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <h3 className="text-blue-900 font-bold mb-1">Decision Confidence: Moderate</h3>
            <p className="text-blue-800 text-sm">
              High model evidence scores are supported by robust satellite and geological layers. 
              However, confidence remains moderate due to limited drillhole assay data and required field ground-truth validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
