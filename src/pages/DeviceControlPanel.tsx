import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/firebase';
import { Device, DeviceStatus } from '../../shared/types';
import {
  Power, Terminal, Folder, Clipboard, Info, Activity,
  Camera, ArrowLeft, RotateCw, Moon, Lock, LogOut,
  BatteryLow, Cpu, HardDrive, Globe,
  RefreshCw, Send, Volume2, AlertCircle, CheckCircle2,
  X, Loader2, ChevronRight
} from 'lucide-react';
import { doc, onSnapshot, collection, addDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeviceControlPanel() {
  const { id } = useParams<{ id: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [activeTab, setActiveTab] = useState('power');
  const [commandFeedback, setCommandFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    const unsubDevice = onSnapshot(doc(db, 'devices', id), (snap) => {
      if (snap.exists()) setDevice({ ...snap.data(), deviceId: snap.id } as Device);
    });
    const unsubStatus = onSnapshot(doc(db, 'deviceStatus', id), (snap) => {
      if (snap.exists()) setStatus(snap.data() as DeviceStatus);
    });
    return () => { unsubDevice(); unsubStatus(); };
  }, [id]);

  useEffect(() => {
    if (!commandFeedback) return;
    const t = setTimeout(() => setCommandFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [commandFeedback]);

  if (!device) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-[#00bfff] animate-spin" />
    </div>
  );

  // 60s window: heartbeat every 5s, mobile latency + clock skew can add up
  const isOnline = status?.online === true && (Date.now() - (status.lastSeen || 0) < 60000);

  const tabs = [
    { id: 'power', icon: <Power className="w-4 h-4" />, label: 'Power' },
    { id: 'apps', icon: <Activity className="w-4 h-4" />, label: 'Processes' },
    { id: 'files', icon: <Folder className="w-4 h-4" />, label: 'Files' },
    { id: 'clipboard', icon: <Clipboard className="w-4 h-4" />, label: 'Clipboard' },
    { id: 'screen', icon: <Camera className="w-4 h-4" />, label: 'Screenshot' },
    { id: 'terminal', icon: <Terminal className="w-4 h-4" />, label: 'Terminal' },
    { id: 'announce', icon: <Volume2 className="w-4 h-4" />, label: 'Announce' },
    { id: 'info', icon: <Info className="w-4 h-4" />, label: 'System Info' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              {device.computerName}
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isOnline ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-red-500/15 text-red-400 border border-red-500/20'}`}>
                {isOnline ? '● Online' : '● Offline'}
              </span>
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm mt-0.5">{status?.ip || 'IP Unknown'} · {device.os} · Agent v{device.agentVersion}</p>
          </div>
        </div>
      </div>

      {/* Command Feedback Toast */}
      <AnimatePresence>
        {commandFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium ${
              commandFeedback.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {commandFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {commandFeedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="glass-card p-2 space-y-0.5 lg:col-span-1 h-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00bfff]/10 text-[#00bfff] border border-[#00bfff]/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="glass-card p-6 lg:col-span-3 min-h-[540px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="h-full">
              {activeTab === 'power' && <PowerPanel deviceId={device.deviceId} isOnline={!!isOnline} onFeedback={setCommandFeedback} />}
              {activeTab === 'apps' && <ProcessPanel deviceId={device.deviceId} isOnline={!!isOnline} onFeedback={setCommandFeedback} />}
              {activeTab === 'files' && <FilePanel deviceId={device.deviceId} isOnline={!!isOnline} onFeedback={setCommandFeedback} />}
              {activeTab === 'clipboard' && <ClipboardPanel deviceId={device.deviceId} isOnline={!!isOnline} onFeedback={setCommandFeedback} />}
              {activeTab === 'screen' && <ScreenshotPanel deviceId={device.deviceId} isOnline={!!isOnline} onFeedback={setCommandFeedback} />}
              {activeTab === 'terminal' && <TerminalPanel deviceId={device.deviceId} isOnline={!!isOnline} onFeedback={setCommandFeedback} />}
              {activeTab === 'announce' && <AnnouncePanel deviceId={device.deviceId} isOnline={!!isOnline} onFeedback={setCommandFeedback} />}
              {activeTab === 'info' && <SystemInfoPanel device={device} status={status} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Shared hook: send command ──────────────────────────────────────────────────
type FeedbackSetter = (fb: { type: 'success' | 'error'; msg: string } | null) => void;

function useSendCommand(deviceId: string, isOnline: boolean, onFeedback: FeedbackSetter) {
  const [sending, setSending] = useState(false);

  const sendCommand = useCallback(async (command: string, params?: Record<string, unknown>) => {
    if (!isOnline) {
      onFeedback({ type: 'error', msg: 'Device is offline — command not sent.' });
      return null;
    }
    setSending(true);
    try {
      // Write command directly to Firestore — agent listens and picks it up
      const ref = await addDoc(collection(db, 'commands'), {
        deviceId,
        command,
        params:    params || {},
        status:    'pending',
        timestamp: Date.now(),
      });
      return ref.id;
    } catch (e) {
      onFeedback({ type: 'error', msg: `Failed to send command: ${(e as Error).message}` });
      return null;
    } finally {
      setSending(false);
    }
  }, [deviceId, isOnline, onFeedback]);

  return { sendCommand, sending };
}

function waitForResult(commandId: string, timeoutMs = 15000): Promise<{ result?: unknown; error?: string }> {
  return new Promise((resolve, reject) => {
    const unsub = onSnapshot(doc(db, 'commandResults', commandId), (snap) => {
      if (snap.exists()) {
        unsub();
        resolve(snap.data() as { result?: unknown; error?: string });
      }
    });
    setTimeout(() => { unsub(); reject(new Error('Command timed out')); }, timeoutMs);
  });
}

// ─── Power Panel ───────────────────────────────────────────────────────────────
function PowerPanel({ deviceId, isOnline, onFeedback }: { deviceId: string; isOnline: boolean; onFeedback: FeedbackSetter }) {
  const { sendCommand, sending } = useSendCommand(deviceId, isOnline, onFeedback);

  const actions = [
    { cmd: 'shutdown', label: 'Shutdown', icon: <Power className="w-6 h-6" />, color: 'text-red-400 bg-red-500/10 border-red-500/20 hover:bg-red-500/20', confirm: 'Shutdown this PC?' },
    { cmd: 'restart', label: 'Restart', icon: <RotateCw className="w-6 h-6" />, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20', confirm: 'Restart this PC?' },
    { cmd: 'sleep', label: 'Sleep', icon: <Moon className="w-6 h-6" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20' },
    { cmd: 'hibernate', label: 'Hibernate', icon: <BatteryLow className="w-6 h-6" />, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20' },
    { cmd: 'lock', label: 'Lock Screen', icon: <Lock className="w-6 h-6" />, color: 'text-gray-400 bg-gray-500/10 border-gray-500/20 hover:bg-gray-500/20' },
    { cmd: 'logoff', label: 'Log Off', icon: <LogOut className="w-6 h-6" />, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20', confirm: 'Log off the current user?' },
  ];

  const handleAction = async (cmd: string, label: string, confirm?: string) => {
    if (confirm && !window.confirm(confirm)) return;
    const id = await sendCommand(cmd);
    if (id) onFeedback({ type: 'success', msg: `${label} command sent successfully.` });
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Power className="w-5 h-5 text-[#00bfff]" /> Power Controls</h2>
      {!isOnline && (
        <div className="mb-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> Device is offline. Commands will not be executed.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {actions.map(a => (
          <button
            key={a.cmd}
            onClick={() => handleAction(a.cmd, a.label, a.confirm)}
            disabled={sending}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all font-semibold text-sm gap-3 ${a.color} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Process Panel ─────────────────────────────────────────────────────────────
interface Process { Name: string; Id: number; CPU: number | null; WorkingSet64: number }
function ProcessPanel({ deviceId, isOnline, onFeedback }: { deviceId: string; isOnline: boolean; onFeedback: FeedbackSetter }) {
  const { sendCommand, sending } = useSendCommand(deviceId, isOnline, onFeedback);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const refresh = async () => {
    setLoading(true);
    const cmdId = await sendCommand('get-processes');
    if (cmdId) {
      try {
        const res = await waitForResult(cmdId);
        const data = (res.result as { processes: Process[] | Process })?.processes;
        setProcesses(Array.isArray(data) ? data : data ? [data] : []);
      } catch { onFeedback({ type: 'error', msg: 'Failed to get processes.' }); }
    }
    setLoading(false);
  };

  const killProcess = async (pid: number, name: string) => {
    if (!window.confirm(`Kill process "${name}" (PID: ${pid})?`)) return;
    const cmdId = await sendCommand('kill-process', { pid });
    if (cmdId) {
      try {
        await waitForResult(cmdId);
        onFeedback({ type: 'success', msg: `Process "${name}" terminated.` });
        setProcesses(prev => prev.filter(p => p.Id !== pid));
      } catch { onFeedback({ type: 'error', msg: 'Failed to kill process.' }); }
    }
  };

  const filtered = processes.filter(p => p.Name?.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-[#00bfff]" /> Running Processes</h2>
        <button onClick={refresh} disabled={loading || sending} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-gray-300 border border-white/5 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      <input
        type="text" placeholder="Filter processes..." value={filter} onChange={e => setFilter(e.target.value)}
        className="w-full mb-3 px-3 py-2 bg-black/20 border border-white/5 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#00bfff]/30"
      />
      {processes.length === 0 ? (
        <div className="text-center py-12 text-gray-600 text-sm">{loading ? 'Loading...' : 'Click Refresh to load processes.'}</div>
      ) : (
        <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
          {filtered.slice(0, 100).map(p => (
            <div key={p.Id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.03] group transition-colors">
              <div className="flex-1 min-w-0">
                <span className="text-sm text-gray-200 font-medium truncate block">{p.Name}</span>
                <span className="text-xs text-gray-600">PID: {p.Id} · RAM: {((p.WorkingSet64 || 0) / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <button onClick={() => killProcess(p.Id, p.Name)} className="ml-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── File Panel ─────────────────────────────────────────────────────────────────
interface FileEntry { Name: string; PSIsContainer: boolean; Length: number; LastWriteTime: string }
function FilePanel({ deviceId, isOnline, onFeedback }: { deviceId: string; isOnline: boolean; onFeedback: FeedbackSetter }) {
  const { sendCommand, sending } = useSendCommand(deviceId, isOnline, onFeedback);
  const [path, setPath] = useState('C:\\');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [drives, setDrives] = useState<{ Name: string; Root: string; Used: number; Free: number }[]>([]);

  const loadDrives = async () => {
    const cmdId = await sendCommand('get-drives');
    if (cmdId) {
      try {
        const res = await waitForResult(cmdId);
        const data = (res.result as { drives: unknown[] })?.drives;
        setDrives(Array.isArray(data) ? data as never[] : []);
      } catch { onFeedback({ type: 'error', msg: 'Failed to list drives.' }); }
    }
  };

  const browseDir = async (dirPath: string) => {
    setLoading(true);
    setPath(dirPath);
    const cmdId = await sendCommand('get-files', { path: dirPath });
    if (cmdId) {
      try {
        const res = await waitForResult(cmdId);
        const data = (res.result as { files: unknown[] })?.files;
        setFiles(Array.isArray(data) ? data as FileEntry[] : []);
      } catch { onFeedback({ type: 'error', msg: 'Failed to browse directory.' }); }
    }
    setLoading(false);
  };

  useEffect(() => { if (isOnline) { loadDrives(); browseDir('C:\\'); } }, []);

  const goUp = () => {
    const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length <= 1) return;
    parts.pop();
    browseDir(parts.join('\\') + '\\');
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Folder className="w-5 h-5 text-[#00bfff]" /> File Manager</h2>
      {/* Drives */}
      {drives.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {drives.map(d => (
            <button key={d.Name} onClick={() => browseDir(d.Root || d.Name + ':\\')}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-300 transition-colors">
              {d.Root || d.Name + ':\\'}
            </button>
          ))}
        </div>
      )}
      {/* Path bar */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={goUp} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 -rotate-180" />
        </button>
        <div className="flex-1 px-3 py-1.5 bg-black/20 border border-white/5 rounded-lg text-xs text-gray-400 font-mono truncate">{path}</div>
        <button onClick={() => browseDir(path)} disabled={loading} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      {/* Files */}
      <div className="space-y-0.5 max-h-[360px] overflow-y-auto">
        {files.map(f => (
          <div
            key={f.Name}
            onClick={() => f.PSIsContainer && browseDir(path.endsWith('\\') ? path + f.Name : path + '\\' + f.Name)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${f.PSIsContainer ? 'hover:bg-white/[0.04] cursor-pointer' : 'cursor-default'}`}
          >
            {f.PSIsContainer
              ? <Folder className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              : <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
                  <div className="w-2.5 h-3 rounded-sm border border-gray-600 bg-gray-800" />
                </div>
            }
            <span className="text-gray-300 flex-1 truncate">{f.Name}</span>
            {!f.PSIsContainer && f.Length > 0 && (
              <span className="text-xs text-gray-600 flex-shrink-0">{(f.Length / 1024).toFixed(1)} KB</span>
            )}
          </div>
        ))}
        {files.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-600 text-sm">Empty directory or access denied.</div>
        )}
      </div>
    </div>
  );
}

// ─── Clipboard Panel ───────────────────────────────────────────────────────────
function ClipboardPanel({ deviceId, isOnline, onFeedback }: { deviceId: string; isOnline: boolean; onFeedback: FeedbackSetter }) {
  const { sendCommand, sending } = useSendCommand(deviceId, isOnline, onFeedback);
  const [remoteClip, setRemoteClip] = useState('');
  const [sendText, setSendText] = useState('');
  const [loading, setLoading] = useState(false);

  const readClipboard = async () => {
    setLoading(true);
    const cmdId = await sendCommand('get-clipboard');
    if (cmdId) {
      try {
        const res = await waitForResult(cmdId);
        setRemoteClip((res.result as { text: string })?.text || '');
        onFeedback({ type: 'success', msg: 'Remote clipboard read.' });
      } catch { onFeedback({ type: 'error', msg: 'Failed to read clipboard.' }); }
    }
    setLoading(false);
  };

  const writeClipboard = async () => {
    if (!sendText.trim()) return;
    const cmdId = await sendCommand('set-clipboard', { text: sendText });
    if (cmdId) {
      try {
        await waitForResult(cmdId);
        onFeedback({ type: 'success', msg: 'Clipboard set on remote device.' });
      } catch { onFeedback({ type: 'error', msg: 'Failed to write clipboard.' }); }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Clipboard className="w-5 h-5 text-[#00bfff]" /> Remote Clipboard</h2>
      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-400">Remote Clipboard Content</label>
            <button onClick={readClipboard} disabled={loading || sending} className="text-xs px-3 py-1.5 rounded-lg bg-[#00bfff]/10 hover:bg-[#00bfff]/20 text-[#00bfff] border border-[#00bfff]/20 transition-colors disabled:opacity-50 flex items-center gap-1.5">
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Read Clipboard
            </button>
          </div>
          <textarea
            readOnly value={remoteClip}
            placeholder="Click 'Read Clipboard' to fetch the remote device's clipboard..."
            className="w-full h-28 px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-sm text-gray-300 resize-none focus:outline-none font-mono"
          />
          {remoteClip && (
            <button onClick={() => navigator.clipboard.writeText(remoteClip)} className="mt-2 text-xs text-[#00bfff] hover:underline">
              Copy to my clipboard
            </button>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-2">Send Text to Remote Clipboard</label>
          <textarea
            value={sendText} onChange={e => setSendText(e.target.value)}
            placeholder="Type text to send to the remote device's clipboard..."
            className="w-full h-24 px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-sm text-gray-200 resize-none focus:outline-none focus:border-[#00bfff]/30 font-mono"
          />
          <button onClick={writeClipboard} disabled={!sendText.trim() || sending} className="mt-2 px-4 py-2 rounded-lg bg-[#00bfff] text-black text-sm font-semibold hover:bg-[#00bfff]/90 transition-colors disabled:opacity-50 flex items-center gap-2">
            <Send className="w-3.5 h-3.5" /> Send to Remote
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screenshot Panel ──────────────────────────────────────────────────────────
function ScreenshotPanel({ deviceId, isOnline, onFeedback }: { deviceId: string; isOnline: boolean; onFeedback: FeedbackSetter }) {
  const { sendCommand, sending } = useSendCommand(deviceId, isOnline, onFeedback);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ts, setTs] = useState<number | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const liveRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const capture = async () => {
    setLoading(true);
    const cmdId = await sendCommand('screenshot');
    if (cmdId) {
      try {
        const res = await waitForResult(cmdId, 20000);
        const data = res.result as { screenshot: string; timestamp: number };
        setScreenshot(data.screenshot);
        setTs(data.timestamp);
        onFeedback({ type: 'success', msg: 'Screenshot captured.' });
      } catch { onFeedback({ type: 'error', msg: 'Screenshot failed or timed out.' }); }
    }
    setLoading(false);
  };

  const toggleLive = () => {
    if (liveMode) {
      if (liveRef.current) clearInterval(liveRef.current);
      liveRef.current = null;
      setLiveMode(false);
    } else {
      setLiveMode(true);
      capture();
      liveRef.current = setInterval(capture, 3000);
    }
  };

  useEffect(() => () => { if (liveRef.current) clearInterval(liveRef.current); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"><Camera className="w-5 h-5 text-[#00bfff]" /> Screenshot</h2>
        <div className="flex gap-2">
          <button onClick={capture} disabled={loading || sending || liveMode}
            className="px-4 py-2 rounded-lg bg-[#00bfff]/10 hover:bg-[#00bfff]/20 text-[#00bfff] border border-[#00bfff]/20 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            Capture
          </button>
          <button onClick={toggleLive} disabled={sending && !liveMode}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${liveMode ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-white/5 border border-white/5 text-gray-400 hover:bg-white/10'}`}>
            {liveMode ? <><Square className="w-3.5 h-3.5" /> Stop Live</> : <><Play className="w-3.5 h-3.5" /> Live (~3fps)</>}
          </button>
        </div>
      </div>
      {screenshot ? (
        <div>
          <img src={screenshot} alt="Remote Screenshot" className="w-full rounded-xl border border-white/5 object-contain max-h-[400px]" />
          {ts && <p className="mt-2 text-xs text-gray-600 text-right">Captured at {new Date(ts).toLocaleTimeString()}</p>}
          <a href={screenshot} download={`orion-screenshot-${ts}.jpg`}
            className="mt-3 inline-flex items-center gap-2 text-xs text-[#00bfff] hover:underline">
            Download image
          </a>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/10 rounded-2xl text-gray-600 gap-3">
          <Camera className="w-10 h-10 opacity-30" />
          <p className="text-sm">Click Capture to take a screenshot</p>
        </div>
      )}
    </div>
  );
}

// ─── Terminal Panel ─────────────────────────────────────────────────────────────
function TerminalPanel({ deviceId, isOnline, onFeedback }: { deviceId: string; isOnline: boolean; onFeedback: FeedbackSetter }) {
  const { sendCommand, sending } = useSendCommand(deviceId, isOnline, onFeedback);
  const [history, setHistory] = useState<{ cmd: string; output: string; error?: boolean }[]>([]);
  const [input, setInput] = useState('');
  const endRef = React.useRef<HTMLDivElement>(null);

  const run = async () => {
    const cmd = input.trim();
    if (!cmd) return;
    setInput('');
    setHistory(prev => [...prev, { cmd, output: 'Running...' }]);
    const cmdId = await sendCommand('run-terminal', { cmd });
    if (cmdId) {
      try {
        const res = await waitForResult(cmdId, 30000);
        const output = res.error ? res.error : ((res.result as { output: string })?.output || '(no output)');
        setHistory(prev => { const copy = [...prev]; copy[copy.length - 1] = { cmd, output, error: !!res.error }; return copy; });
      } catch {
        setHistory(prev => { const copy = [...prev]; copy[copy.length - 1] = { cmd, output: 'Timed out', error: true }; return copy; });
      }
    }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Terminal className="w-5 h-5 text-[#00bfff]" /> Remote Terminal (PowerShell)</h2>
      <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-4 font-mono text-sm overflow-y-auto mb-3 min-h-[300px] max-h-[340px]">
        {history.length === 0 && <span className="text-gray-600">Type a PowerShell command and press Enter.</span>}
        {history.map((h, i) => (
          <div key={i} className="mb-3">
            <div className="text-[#00bfff]">PS &gt; {h.cmd}</div>
            <div className={h.error ? 'text-red-400' : 'text-gray-300 whitespace-pre-wrap'}>{h.output}</div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2">
        <div className="flex items-center text-[#00bfff] font-mono text-sm px-2">PS &gt;</div>
        <input
          type="text" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') run(); }}
          placeholder="Enter command..."
          className="flex-1 px-3 py-2 bg-black/30 border border-white/5 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-[#00bfff]/30 placeholder-gray-700"
        />
        <button onClick={run} disabled={!input.trim() || sending} className="px-3 py-2 rounded-lg bg-[#00bfff]/10 hover:bg-[#00bfff]/20 text-[#00bfff] border border-[#00bfff]/20 disabled:opacity-50 transition-colors">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Announce Panel ─────────────────────────────────────────────────────────────
function AnnouncePanel({ deviceId, isOnline, onFeedback }: { deviceId: string; isOnline: boolean; onFeedback: FeedbackSetter }) {
  const { sendCommand, sending } = useSendCommand(deviceId, isOnline, onFeedback);
  const [text, setText] = useState('');

  const speak = async () => {
    if (!text.trim()) return;
    const cmdId = await sendCommand('speak', { text });
    if (cmdId) {
      try {
        await waitForResult(cmdId);
        onFeedback({ type: 'success', msg: 'Text-to-speech sent.' });
      } catch { onFeedback({ type: 'error', msg: 'TTS failed.' }); }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Volume2 className="w-5 h-5 text-[#00bfff]" /> Remote Announcement</h2>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-400 block mb-2">Text to Speak (via system TTS)</label>
          <textarea
            value={text} onChange={e => setText(e.target.value)}
            placeholder="Type a message to speak on the remote device..."
            className="w-full h-32 px-3 py-2.5 bg-black/20 border border-white/5 rounded-xl text-sm text-gray-200 resize-none focus:outline-none focus:border-[#00bfff]/30"
          />
        </div>
        <button onClick={speak} disabled={!text.trim() || sending || !isOnline}
          className="px-6 py-3 rounded-xl bg-[#00bfff] text-black font-bold text-sm hover:bg-[#00bfff]/90 transition-colors disabled:opacity-50 flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Speak on Remote Device
        </button>
        <p className="text-xs text-gray-600">Uses Windows built-in Text-to-Speech. The message will be spoken aloud on the remote machine.</p>
      </div>
    </div>
  );
}

// ─── System Info Panel ──────────────────────────────────────────────────────────
function SystemInfoPanel({ device, status }: { device: Device; status: DeviceStatus | null }) {
  const stats = [
    { label: 'Computer Name', value: device.computerName, icon: <Globe className="w-3.5 h-3.5" /> },
    { label: 'Operating System', value: `${device.os} ${status?.osVersion || ''}`.trim(), icon: <Info className="w-3.5 h-3.5" /> },
    { label: 'Agent Version', value: `v${device.agentVersion}`, icon: <Zap className="w-3.5 h-3.5" /> },
    { label: 'Local IP', value: status?.ip || 'Unknown', icon: <Globe className="w-3.5 h-3.5" /> },
    { label: 'CPU Usage', value: status?.cpu != null ? `${status.cpu.toFixed(1)}%` : 'N/A', icon: <Cpu className="w-3.5 h-3.5" />, bar: status?.cpu },
    { label: 'RAM Usage', value: status?.ram != null ? `${status.ram.toFixed(1)}%` : 'N/A', icon: <MemoryStick className="w-3.5 h-3.5" />, bar: status?.ram },
    { label: 'Disk Usage', value: status?.disk != null ? `${status.disk.toFixed(1)}%` : 'N/A', icon: <HardDrive className="w-3.5 h-3.5" />, bar: status?.disk },
    { label: 'Uptime', value: status?.uptime != null ? `${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m` : 'N/A', icon: <Activity className="w-3.5 h-3.5" /> },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Info className="w-5 h-5 text-[#00bfff]" /> System Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {stats.map(s => (
          <div key={s.label} className="bg-black/20 p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1.5">{s.icon} {s.label}</div>
            <div className="text-sm font-semibold text-gray-200">{s.value}</div>
            {s.bar != null && (
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${s.bar > 80 ? 'bg-red-400' : s.bar > 60 ? 'bg-yellow-400' : 'bg-[#00bfff]'}`}
                  style={{ width: `${Math.min(s.bar, 100)}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
