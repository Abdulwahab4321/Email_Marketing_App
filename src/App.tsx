import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CreateCampaign from './pages/CreateCampaign';
import AllCampaigns from './pages/AllCampaigns';
import { CampaignProvider } from './context/CampaignContext';

const App: React.FC = () => {
  return (
    <CampaignProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaign/new" element={<CreateCampaign />} />
            <Route path="/campaigns" element={<AllCampaigns />} />
          </Routes>
        </main>
      </div>
    </CampaignProvider>
  );
};

export default App;
