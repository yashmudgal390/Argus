// ═══════════════════════════════════════════════════
// Sidebar — Enhanced Command Center Navigation
// Cyberpunk Flock aesthetic with glowing logo & active indicators
// ═══════════════════════════════════════════════════

import { NavLink } from 'react-router-dom';
import {
  MapIcon,
  CameraIcon,
  CarIcon,
  BellIcon,
  BarChart3Icon,
  ListIcon,
  SettingsIcon,
  ScanEyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RadioIcon,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface NavItem {
  path: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/',           label: 'Live Map',       icon: <MapIcon size={18} /> },
  { path: '/cameras',    label: 'Cameras Grid',   icon: <CameraIcon size={18} /> },
  { path: '/vehicles',   label: 'Vehicles Track', icon: <CarIcon size={18} /> },
  { path: '/alerts',     label: 'Alerts Feed',    icon: <BellIcon size={18} /> },
  { path: '/analytics',  label: 'Analytics',      icon: <BarChart3Icon size={18} /> },
  { path: '/detections', label: 'Detections Log', icon: <ListIcon size={18} /> },
  { path: '/admin',      label: 'Admin Control',  icon: <SettingsIcon size={18} />, adminOnly: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        flex flex-col border-r border-nero-border bg-nero-surface/95 backdrop-blur-md
        transition-all duration-300 ease-in-out z-30 relative
        ${collapsed ? 'w-[72px]' : 'w-[240px]'}
      `}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-nero-border px-4">
        <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nero-accent/30 to-nero-cyan/10 border border-nero-accent/40 shadow-lg shadow-nero-accent/20">
          <ScanEyeIcon size={22} className="text-nero-accent" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-nero-surface animate-pulse" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <h1 className="text-lg font-black tracking-wider text-nero-text-primary flex items-center gap-1.5">
              NERO
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-nero-accent/20 text-nero-accent font-bold">
                PROT
              </span>
            </h1>
            <p className="text-[10px] font-semibold tracking-widest text-nero-text-muted uppercase flex items-center gap-1">
              <RadioIcon size={9} className="text-emerald-400" />
              City Intelligence
            </p>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200 group
              ${
                isActive
                  ? 'bg-gradient-to-r from-nero-accent/20 to-nero-accent/5 text-nero-accent border border-nero-accent/30 shadow-md shadow-nero-accent/10'
                  : 'text-nero-text-secondary hover:bg-nero-surface-hover hover:text-nero-text-primary hover:border hover:border-nero-border'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active left indicator glow bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-nero-accent shadow-lg shadow-nero-accent" />
                )}
                <span className={`flex-shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-nero-accent' : ''}`}>
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="animate-fade-in truncate">{item.label}</span>
                )}
                {/* Alert badge counter for Alerts nav */}
                {item.path === '/alerts' && !collapsed && (
                  <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-400 ring-1 ring-red-500/30">
                    2
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-nero-border p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-nero-text-muted transition-all hover:bg-nero-surface-hover hover:text-nero-text-primary hover:border hover:border-nero-border"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
          {!collapsed && <span>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}
