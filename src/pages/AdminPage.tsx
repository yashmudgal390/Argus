// ═══════════════════════════════════════════════════
// AdminPage Component (Phase 6)
// Admin control center: Cameras CRUD, Watchlist CRUD, Users, Audit Trail
// ═══════════════════════════════════════════════════

import { useEffect, useState } from 'react';
import type { CameraFeed, BlacklistEntry, AlertPriority, WatchlistCategory } from '@/types';
import { fetchCameras, fetchBlacklistEntries } from '@/lib/supabase';
import { mockUsers, mockAuditLogs } from '@/data/mockAdmin';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  CameraIcon,
  ShieldAlertIcon,
  UsersIcon,
  HistoryIcon,
  PlusIcon,
  XIcon,
  LockIcon,
} from 'lucide-react';

type AdminTab = 'cameras' | 'watchlist' | 'users' | 'audit';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('cameras');
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [watchlist, setWatchlist] = useState<BlacklistEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddCameraModal, setShowAddCameraModal] = useState(false);
  const [showAddWatchlistModal, setShowAddWatchlistModal] = useState(false);

  // New camera form state
  const [newCamName, setNewCamName] = useState('');
  const [newCamCode, setNewCamCode] = useState('');
  const [newCamZone, setNewCamZone] = useState('Central Delhi');

  // New watchlist entry form state
  const [newBlPlate, setNewBlPlate] = useState('');
  const [newBlReason, setNewBlReason] = useState('');
  const [newBlPriority, setNewBlPriority] = useState<AlertPriority>('high');
  const [newBlCategory, setNewBlCategory] = useState<WatchlistCategory>('stolen');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cData, wData] = await Promise.all([
        fetchCameras(),
        fetchBlacklistEntries(),
      ]);
      setCameras(cData);
      setWatchlist(wData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAddCamera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamName || !newCamCode) return;
    const newCam: CameraFeed = {
      id: `cam-00${cameras.length + 1}`,
      name: newCamName,
      code: newCamCode,
      lat: 28.6100,
      lng: 77.2000,
      zone: newCamZone,
      direction: 'North',
      status: 'online',
      video_url: '/videos/cam_001.mp4',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setCameras([newCam, ...cameras]);
    setShowAddCameraModal(false);
    setNewCamName('');
    setNewCamCode('');
  };

  const handleAddWatchlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlPlate || !newBlReason) return;
    const newEntry: BlacklistEntry = {
      id: `bl-00${watchlist.length + 1}`,
      plate_text: newBlPlate.toUpperCase(),
      category: newBlCategory,
      priority: newBlPriority,
      reason: newBlReason,
      valid_from: new Date().toISOString(),
      valid_to: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setWatchlist([newEntry, ...watchlist]);
    setShowAddWatchlistModal(false);
    setNewBlPlate('');
    setNewBlReason('');
  };

  if (loading) return <LoadingState message="Loading administration dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={loadAdminData} />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-nero-text-primary">Admin Control Center</h1>
            <span className="rounded bg-nero-accent/20 px-2 py-0.5 text-xs font-bold text-nero-accent">
              Admin Role Active
            </span>
          </div>
          <p className="text-sm text-nero-text-muted mt-1">
            Manage cameras, watchlist targets, user access, and system audit logs
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-nero-border space-x-6">
        <button
          onClick={() => setActiveTab('cameras')}
          className={`flex items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'cameras'
              ? 'border-nero-accent text-nero-accent'
              : 'border-transparent text-nero-text-secondary hover:text-nero-text-primary'
          }`}
        >
          <CameraIcon size={16} />
          Camera Management ({cameras.length})
        </button>

        <button
          onClick={() => setActiveTab('watchlist')}
          className={`flex items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'watchlist'
              ? 'border-nero-accent text-nero-accent'
              : 'border-transparent text-nero-text-secondary hover:text-nero-text-primary'
          }`}
        >
          <ShieldAlertIcon size={16} />
          Watchlist Entries ({watchlist.length})
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-nero-accent text-nero-accent'
              : 'border-transparent text-nero-text-secondary hover:text-nero-text-primary'
          }`}
        >
          <UsersIcon size={16} />
          Users & Roles ({mockUsers.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'audit'
              ? 'border-nero-accent text-nero-accent'
              : 'border-transparent text-nero-text-secondary hover:text-nero-text-primary'
          }`}
        >
          <HistoryIcon size={16} />
          Audit Log
        </button>
      </div>

      {/* TAB 1: CAMERAS */}
      {activeTab === 'cameras' && (
        <Card>
          <CardHeader
            title="Registered Camera Feeds"
            subtitle="Virtual CCTV/ANPR deployment nodes"
            action={
              <button
                onClick={() => setShowAddCameraModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-nero-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-nero-accent-hover transition-colors"
              >
                <PlusIcon size={14} />
                Register Camera
              </button>
            }
          />
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-nero-border text-xs text-nero-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Zone</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nero-border text-xs">
                {cameras.map((cam) => (
                  <tr key={cam.id} className="hover:bg-nero-surface-hover">
                    <td className="py-3 px-4 font-semibold text-nero-text-primary">{cam.name}</td>
                    <td className="py-3 px-4 font-mono text-nero-accent font-bold">{cam.code}</td>
                    <td className="py-3 px-4 text-nero-text-secondary">{cam.zone}</td>
                    <td className="py-3 px-4 text-nero-text-secondary">{cam.direction}</td>
                    <td className="py-3 px-4"><StatusBadge variant={cam.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: WATCHLIST */}
      {activeTab === 'watchlist' && (
        <Card>
          <CardHeader
            title="Watchlist Targets"
            subtitle="Automatic ANPR detection alerts trigger on matching plates"
            action={
              <button
                onClick={() => setShowAddWatchlistModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-nero-accent px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-nero-accent-hover transition-colors"
              >
                <PlusIcon size={14} />
                Add Target Plate
              </button>
            }
          />
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-nero-border text-xs text-nero-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Plate Text</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nero-border text-xs">
                {watchlist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-nero-surface-hover">
                    <td className="py-3 px-4 font-mono font-bold text-nero-accent text-sm">{entry.plate_text}</td>
                    <td className="py-3 px-4 uppercase font-bold text-[10px] text-nero-text-secondary">{entry.category}</td>
                    <td className="py-3 px-4"><StatusBadge variant={entry.priority} /></td>
                    <td className="py-3 px-4 text-nero-text-primary">{entry.reason}</td>
                    <td className="py-3 px-4">
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: USERS */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader
            title="Operator & Admin Accounts"
            subtitle="Access roles for command center operators"
            action={<LockIcon size={16} className="text-nero-text-muted" />}
          />
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-nero-border text-xs text-nero-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Last Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nero-border text-xs">
                {mockUsers.map((usr) => (
                  <tr key={usr.id} className="hover:bg-nero-surface-hover">
                    <td className="py-3 px-4 font-semibold text-nero-text-primary">{usr.name}</td>
                    <td className="py-3 px-4 font-mono text-nero-text-secondary">{usr.email}</td>
                    <td className="py-3 px-4">
                      <StatusBadge variant={usr.role === 'admin' ? 'info' : 'online'} label={usr.role.toUpperCase()} />
                    </td>
                    <td className="py-3 px-4 text-nero-text-muted">{usr.last_active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader
            title="System Audit Trail"
            subtitle="Read-only event log capturing operator searches and admin actions"
            action={<HistoryIcon size={16} className="text-nero-accent" />}
          />
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-nero-border text-xs text-nero-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nero-border text-xs">
                {mockAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-nero-surface-hover">
                    <td className="py-3 px-4 font-mono text-nero-text-muted">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-nero-accent">{log.action}</td>
                    <td className="py-3 px-4 text-nero-text-secondary">{log.user_email}</td>
                    <td className="py-3 px-4 text-nero-text-primary">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: REGISTER CAMERA */}
      {showAddCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-nero-border bg-nero-surface p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-nero-border mb-4">
              <h3 className="text-base font-bold text-nero-text-primary">Register New Virtual Camera</h3>
              <button onClick={() => setShowAddCameraModal(false)} className="text-nero-text-muted hover:text-white">
                <XIcon size={18} />
              </button>
            </div>
            <form onSubmit={handleAddCamera} className="space-y-4 text-xs">
              <div>
                <label className="block text-nero-text-muted mb-1 font-medium">Camera Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yamuna Expressway Toll Gate"
                  value={newCamName}
                  onChange={(e) => setNewCamName(e.target.value)}
                  className="w-full rounded-lg border border-nero-border bg-nero-bg px-3 py-2 text-nero-text-primary focus:border-nero-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-nero-text-muted mb-1 font-medium">Camera Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. YE-01"
                  value={newCamCode}
                  onChange={(e) => setNewCamCode(e.target.value)}
                  className="w-full rounded-lg border border-nero-border bg-nero-bg px-3 py-2 font-mono text-nero-text-primary focus:border-nero-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-nero-text-muted mb-1 font-medium">Zone</label>
                <select
                  value={newCamZone}
                  onChange={(e) => setNewCamZone(e.target.value)}
                  className="w-full rounded-lg border border-nero-border bg-nero-bg px-3 py-2 text-nero-text-primary focus:border-nero-accent focus:outline-none"
                >
                  <option value="Central Delhi">Central Delhi</option>
                  <option value="South Delhi">South Delhi</option>
                  <option value="West Delhi">West Delhi</option>
                  <option value="Old Delhi">Old Delhi</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddCameraModal(false)}
                  className="rounded-lg px-4 py-2 text-nero-text-muted hover:bg-nero-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-nero-accent px-4 py-2 font-semibold text-white hover:bg-nero-accent-hover"
                >
                  Register Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WATCHLIST TARGET */}
      {showAddWatchlistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-nero-border bg-nero-surface p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-nero-border mb-4">
              <h3 className="text-base font-bold text-nero-text-primary">Add Watchlist Target Plate</h3>
              <button onClick={() => setShowAddWatchlistModal(false)} className="text-nero-text-muted hover:text-white">
                <XIcon size={18} />
              </button>
            </div>
            <form onSubmit={handleAddWatchlist} className="space-y-4 text-xs">
              <div>
                <label className="block text-nero-text-muted mb-1 font-medium">Target License Plate</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DL-05-XY-9999"
                  value={newBlPlate}
                  onChange={(e) => setNewBlPlate(e.target.value)}
                  className="w-full rounded-lg border border-nero-border bg-nero-bg px-3 py-2 font-mono text-nero-text-primary focus:border-nero-accent focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-nero-text-muted mb-1 font-medium">Category</label>
                  <select
                    value={newBlCategory}
                    onChange={(e) => setNewBlCategory(e.target.value as WatchlistCategory)}
                    className="w-full rounded-lg border border-nero-border bg-nero-bg px-3 py-2 text-nero-text-primary focus:border-nero-accent focus:outline-none"
                  >
                    <option value="stolen">Stolen</option>
                    <option value="wanted">Wanted</option>
                    <option value="missing">Missing</option>
                    <option value="flagged">Flagged</option>
                  </select>
                </div>
                <div>
                  <label className="block text-nero-text-muted mb-1 font-medium">Priority</label>
                  <select
                    value={newBlPriority}
                    onChange={(e) => setNewBlPriority(e.target.value as AlertPriority)}
                    className="w-full rounded-lg border border-nero-border bg-nero-bg px-3 py-2 text-nero-text-primary focus:border-nero-accent focus:outline-none"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-nero-text-muted mb-1 font-medium">Reason / Incident Details</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify law enforcement case reference or reason..."
                  value={newBlReason}
                  onChange={(e) => setNewBlReason(e.target.value)}
                  className="w-full rounded-lg border border-nero-border bg-nero-bg px-3 py-2 text-nero-text-primary focus:border-nero-accent focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddWatchlistModal(false)}
                  className="rounded-lg px-4 py-2 text-nero-text-muted hover:bg-nero-surface-hover"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-nero-accent px-4 py-2 font-semibold text-white hover:bg-nero-accent-hover"
                >
                  Add to Watchlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
