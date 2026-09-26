// ═══════════════════════════════════════════════════
// App — Root component with router setup
// All routes rendered inside DashboardLayout
// ═══════════════════════════════════════════════════

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LiveMapPage } from '@/pages/LiveMapPage';
import { CamerasPage } from '@/pages/CamerasPage';
import { VehiclesPage } from '@/pages/VehiclesPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AdminPage } from '@/pages/AdminPage';
import { DetectionsPage } from '@/pages/DetectionsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<LiveMapPage />} />
          <Route path="/cameras" element={<CamerasPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/detections" element={<DetectionsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
