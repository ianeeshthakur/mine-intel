import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import CommandCenter from './pages/CommandCenter';
import AnalyzeArea from './pages/AnalyzeArea';
import ProspectivityExplorer from './pages/ProspectivityExplorer';
import FieldVerification from './pages/FieldVerification';
import ProductionIntelligence from './pages/ProductionIntelligence';
import DataHealth from './pages/DataHealth';
import ReportsImpact from './pages/ReportsImpact';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<CommandCenter />} />
          <Route path="analyze" element={<AnalyzeArea />} />
          <Route path="explorer" element={<ProspectivityExplorer />} />
          <Route path="verification" element={<FieldVerification />} />
          <Route path="production" element={<ProductionIntelligence />} />
          <Route path="reports-impact" element={<ReportsImpact />} />
          <Route path="data-health" element={<DataHealth />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
