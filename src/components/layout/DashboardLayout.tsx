// ═══════════════════════════════════════════════════
// DashboardLayout — Main shell wrapping all pages
// Sidebar + TopBar + scrollable content area
// ═══════════════════════════════════════════════════

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-nero-bg">
      {/* Persistent sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
