import React from 'react';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Device, DeviceStatus } from '../../shared/types';
import { Monitor, Cpu, HardDrive, Clock, Circle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DeviceWithStatus extends Device {
  status?: DeviceStatus;
}

export default function DevicesList() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to devices
    const q = query(collection(db, 'devices'), where('userId', '==', user.uid));
    const unsubDevices = onSnapshot(q, (snapshot) => {
      const devs = snapshot.docs.map(doc => ({ ...doc.data(), deviceId: doc.id } as Device));
      
      // For each device, listen to its status
      // Note: A more efficient approach for many devices is to query all statuses where deviceId in [ids]
      // but Firestore doesn't support 'in' with > 10 items easily if we don't know them. 
      // Listening to individual docs or just fetching the deviceStatus collection.
      
      setDevices(prev => {
        // Merge existing status to avoid flicker
        return devs.map(d => {
          const existing = prev.find(p => p.deviceId === d.deviceId);
          return { ...d, status: existing?.status };
        });
      });
      setLoading(false);
    });

    return () => unsubDevices();
  }, [user]);

  // Listen to statuses separately
  useEffect(() => {
    if (!devices.length) return;
    const unsubscribes = devices.map(device => {
      return onSnapshot(
        query(collection(db, 'deviceStatus'), where('__name__', '==', device.deviceId)),
        (snapshot) => {
          if (!snapshot.empty) {
            const status = snapshot.docs[0].data() as DeviceStatus;
            setDevices(prev => prev.map(p => p.deviceId === device.deviceId ? { ...p, status } : p));
          }
        }
      );
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }, [devices.length]); // only re-run if number of devices changes to avoid infinite loop

  if (loading) {
    return <div className="text-[var(--color-text-secondary)]">Loading devices...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">Your Devices</h1>
          <p className="text-[var(--color-text-secondary)] text-sm">Manage and monitor your connected workstations.</p>
        </div>
        <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/10">
          + Add Device
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="glass-card p-12 text-center border-dashed">
          <Monitor className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No devices found</h3>
          <p className="text-[var(--color-text-secondary)] text-sm mb-6 max-w-sm mx-auto">
            You haven't connected any devices yet. Download the Orion Agent to get started.
          </p>
          <button className="bg-[#00bfff] text-black font-semibold px-6 py-2 rounded-lg hover:bg-[#00bfff]/90 transition-colors">
            Download Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {devices.map(device => (
            <DeviceCard key={device.deviceId} device={device} />
          ))}
        </div>
      )}
    </div>
  );
}

function DeviceCard({ device }: { device: DeviceWithStatus }) {
  const isOnline = device.status?.online && (Date.now() - (device.status.lastSeen || 0) < 15000); // 15 seconds heartbeat timeout

  return (
    <Link to={`/dashboard/device/${device.deviceId}`} className="glass-card p-6 block hover:border-[#00bfff]/30 hover:bg-white/[0.02] transition-all group">
      <div className="flex items-start justify-between mb-6">
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            {device.computerName}
            <Circle className={`w-2.5 h-2.5 fill-current ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
          </h3>
          <span className="text-xs text-[var(--color-text-secondary)] mt-1">{device.os} • Agent v{device.agentVersion}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#00bfff]/10 group-hover:text-[#00bfff] transition-colors">
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#00bfff]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stat label="CPU" value={device.status?.cpu != null ? `${device.status.cpu.toFixed(1)}%` : '--'} icon={<Cpu className="w-3.5 h-3.5" />} />
        <Stat label="RAM" value={device.status?.ram != null ? `${device.status.ram.toFixed(1)}%` : '--'} icon={<Cpu className="w-3.5 h-3.5" />} />
        <Stat label="Disk" value={device.status?.disk != null ? `${device.status.disk.toFixed(1)}%` : '--'} icon={<HardDrive className="w-3.5 h-3.5" />} />
        <Stat label="Uptime" value={formatUptime(device.status?.uptime)} icon={<Clock className="w-3.5 h-3.5" />} />
      </div>
    </Link>
  );
}

function Stat({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
      <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)] text-xs mb-1 font-medium">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-200">
        {value}
      </div>
    </div>
  );
}

function formatUptime(seconds?: number) {
  if (seconds == null) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
