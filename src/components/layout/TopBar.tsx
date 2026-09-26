// ═══════════════════════════════════════════════════
// TopBar — Enhanced Command Center Header
// Live ticking system clock, global search, profile badge
// ═══════════════════════════════════════════════════

import { SearchIcon, BellIcon, ShieldCheckIcon, ClockIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function TopBar() {
  const [searchValue, setSearchValue] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-nero-border bg-nero-surface/90 backdrop-blur-md px-6 z-20">
      {/* Global search input */}
      <div className="relative w-full max-w-md">
        <SearchIcon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nero-text-muted transition-colors group-focus-within:text-nero-accent"
        />
        <input
          id="global-search"
          type="text"
          placeholder="Search license plate, camera ID, or zone..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full rounded-xl border border-nero-border bg-nero-bg/80 pl-10 pr-12 py-2 text-xs font-medium text-nero-text-primary placeholder:text-nero-text-muted focus:border-nero-accent focus:bg-nero-bg focus:outline-none focus:ring-2 focus:ring-nero-accent/20 transition-all"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden rounded-md border border-nero-border-light bg-nero-surface-elevated px-1.5 py-0.5 text-[10px] font-mono text-nero-text-muted sm:inline">
          ⌘K
        </kbd>
      </div>

      {/* Right controls section */}
      <div className="flex items-center gap-5 ml-6">
        {/* Real-time Ticking System Clock */}
        <div className="hidden md:flex items-center gap-2 rounded-lg bg-nero-surface-elevated/60 border border-nero-border px-3 py-1.5">
          <ClockIcon size={14} className="text-nero-accent" />
          <span className="font-mono text-xs font-bold text-nero-text-primary tracking-wider">
            {currentTime || '00:00:00'}
          </span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest ml-1">
            IST
          </span>
        </div>

        {/* Notifications Bell */}
        <button
          className="relative rounded-xl p-2 text-nero-text-muted transition-all hover:bg-nero-surface-hover hover:text-nero-text-primary hover:border hover:border-nero-border"
          aria-label="Notifications"
        >
          <BellIcon size={18} />
          <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-4 ring-nero-surface animate-pulse" />
        </button>

        {/* User profile with Security Officer Badge */}
        <div className="flex items-center gap-3 rounded-xl bg-nero-surface-elevated/70 border border-nero-border px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nero-accent/20 border border-nero-accent/40 text-nero-accent shadow-sm">
            <ShieldCheckIcon size={18} />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-nero-text-primary">Command Officer</p>
            <p className="text-[10px] text-nero-text-muted font-mono">ID: SEC-8042</p>
          </div>
          <StatusBadge variant="info" label="Admin" size="sm" />
        </div>
      </div>
    </header>
  );
}
