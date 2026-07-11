import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot, FirestoreError, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Device, DeviceStatus } from '../../shared/types';
import { Monitor, Cpu, HardDrive, Clock, ArrowRight, RefreshCw, Download, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorCard, SkeletonCard, parseFirebaseError } from '../components/ErrorBoundary';

interface DeviceWithStatus extends Device {
  status?: DeviceStatus;
}

export default function DevicesList() {
  const { user }              = useAuth();
  const [devices, setDevices] = useState<DeviceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    setError('');
    setLoading(true);
    setRetryKey(k => k + 1);
  }, []);

  // Listen to devices collection
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'devices'), where('userId', '==', user.uid));

    const unsub = onSnapshot(
      q,
      { includeMetadataChanges: false },
      (snapshot) => {
        const devs = snapshot.docs.map(d => ({ ...d.data(), deviceId: d.id } as Device));
        setDevices(prev => devs.map(d => ({
          ...d,
          status: prev.find(p => p.deviceId === d.deviceId)?.status,
        })));
        setLoading(false);
        setError('');
      },
      (err: FirestoreError) => {
        console.error('[DevicesList] Firestore error:', err);
        setError(parseFirebaseError(err));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, retryKey]);

  // Listen to each device's status document
  useEffect(() => {
    if (!devices.length) return;

    const unsubs = devices.map(device => {
      const statusRef = doc(db, 'deviceStatus', device.deviceId);
      return onSnapshot(
        statusRef,
        (snap) => {
          if (snap.exists()) {
            const status = snap.data() as DeviceStatus;
            setDevices(prev => prev.map(p =>
              p.deviceId === device.deviceId ? { ...p, status } : p
            ));
          }
        },
        (err) => console.error(`[DevicesList] Status error for ${device.deviceId}:`, err)
      );
    });

    return () => unsubs.forEach(u => u());
  }, [devices.length]);

  /* ── Render ── */
  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Devices</h1>
          <p className="page-subtitle">
            {loading ? 'Loading...' : `${devices.length} device${devices.length !== 1 ? 's' : ''} connected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={retry}
            disabled={loading}
            className="btn-secondary gap-2 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <a
            href="https://github.com/mdhasibulhasan0210/Project-Orion/releases/latest/download/Orion-Agent-Setup.exe"
            target="_blank" rel="noopener noreferrer"
            className="btn-primary gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download Agent</span>
          </a>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-6">
          <ErrorCard message={error} onRetry={retry} />
        </div>
      )}

      {/* Loading skeletons */}
      {loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && devices.length === 0 && (
        <div className="glass-card p-12 text-center border-dashed border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-5">
            <Monitor className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No devices connected</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-sm mx-auto leading-relaxed">
            Download the Orion Agent on any Windows PC, sign in, and it will appear here automatically.
          </p>
          <a
            href="https://github.com/mdhasibulhasan0210/Project-Orion/releases/latest/download/Orion-Agent-Setup.exe"
            target="_blank" rel="noopener noreferrer"
            className="btn-primary inline-flex gap-2"
          >
            <Download className="w-4 h-4" />
            Download Orion Agent
          </a>
        </div>
      )}

      {/* Device grid */}
      {!loading && !error && devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {devices.map(device => (
            <DeviceCard key={device.deviceId} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Device Card ── */
function DeviceCard({ device }: { device: DeviceWithStatus }) {
  const isOnline = !!(device.status?.online && (Date.now() - (device.status.lastSeen || 0) < 20000));
  const cpu  = device.status?.cpu  ?? null;
  const ram  = device.status?.ram  ?? null;
  const disk = device.status?.disk ?? null;

  return (
    <Link
      to={`/dashboard/device/${device.deviceId}`}
      className="surface-card p-5 block hover:border-[#00bfff]/25 transition-all duration-200 group hover:-translate-y-0.5"
    >
      {/* Card header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00bfff]/8 border border-[#00bfff]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#00bfff]/15 transition-colors">
            <Monitor className="w-5 h-5 text-[#00bfff]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white text-sm truncate max-w-[160px]">
              {device.computerName || device.deviceId}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
              {device.os || 'Windows'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isOnline ? (
            <span className="badge-online">
              <Wifi className="w-3 h-3" />
              Online
            </span>
          ) : (
            <span className="badge-offline">
              <WifiOff className="w-3 h-3" />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2.5 mb-4">
        <StatBar label="CPU" value={cpu} />
        <StatBar label="RAM" value={ram} />
        <StatBar label="Disk" value={disk} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
        <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <Clock className="w-3 h-3" />
          {device.status?.uptime != null ? formatUptime(device.status.uptime) : 'No data'}
        </div>
        <div className="flex items-center gap-1 text-xs font-medium text-[#00bfff] opacity-0 group-hover:opacity-100 transition-opacity">
          Control
          <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}

function StatBar({ label, value }: { label: string; value: number | null }) {
  const pct    = value ?? 0;
  const danger  = pct >= 90;
  const warning = pct >= 70 && pct < 90;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-text-muted)] font-medium">{label}</span>
        <span className={`font-semibold tabular-nums ${danger ? 'text-red-400' : warning ? 'text-amber-400' : 'text-[var(--color-text-secondary)]'}`}>
          {value != null ? `${value.toFixed(0)}%` : '--'}
        </span>
      </div>
      <div className="stat-bar-track">
        <div
          className={`stat-bar-fill ${danger ? 'danger' : warning ? 'warning' : ''}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function formatUptime(seconds: number) {
  if (seconds < 60)   return `${Math.floor(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
