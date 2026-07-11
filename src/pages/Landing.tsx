import React from 'react';
import { Monitor, Shield, Zap, ArrowRight, Download, Cpu, HardDrive, Terminal, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AGENT_URL = 'https://github.com/mdhasibulhasan0210/Project-Orion/releases/latest/download/Orion-Agent-Setup.exe';

const features = [
  { icon: <Monitor className="w-5 h-5" />,  title: 'Real-Time Monitoring', desc: 'CPU, RAM, disk, IP, and uptime tracked live every 5 seconds.' },
  { icon: <Zap className="w-5 h-5" />,      title: 'Power Control',         desc: 'Shutdown, restart, sleep, hibernate, lock — all remote.' },
  { icon: <Camera className="w-5 h-5" />,   title: 'Screenshot & Live View',desc: 'Capture screens instantly or stream at 3fps.' },
  { icon: <Terminal className="w-5 h-5" />, title: 'Remote Terminal',        desc: 'Execute PowerShell commands and see output in real-time.' },
  { icon: <HardDrive className="w-5 h-5" />, title: 'File Manager',          desc: 'Browse drives, navigate directories remotely.' },
  { icon: <Shield className="w-5 h-5" />,   title: 'Secure by Default',      desc: 'Firebase Auth, encrypted storage, Zod validation on every command.' },
];

const steps = [
  { n: '1', title: 'Download Agent',   desc: 'Install the .exe on any Windows PC.' },
  { n: '2', title: 'Sign In',          desc: 'Use your Orion account credentials.' },
  { n: '3', title: 'You\'re in Control', desc: 'PC appears in your dashboard instantly.' },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-white overflow-x-hidden">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,191,255,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* ── Navbar ── */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="mx-4 mt-4 px-5 py-3 flex items-center justify-between glass-card rounded-2xl max-w-6xl xl:mx-auto">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Orion" className="w-7 h-7 object-contain" />
            <span className="text-lg font-bold tracking-tight text-white">Orion</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#download" className="hover:text-white transition-colors">Download</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={user ? '/dashboard' : '/login'}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {user ? 'Dashboard →' : 'Sign In'}
            </Link>
            <a
              href={AGENT_URL}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary text-sm py-2 px-4 rounded-xl gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Get Agent
            </a>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-24 px-6 max-w-5xl mx-auto flex flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00bfff]/8 border border-[#00bfff]/20 text-[#00bfff] text-xs font-semibold uppercase tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00bfff] animate-pulse" />
          Remote Control Platform
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.05]">
          Manage every PC
          <br />
          from <span className="text-[#00bfff]">anywhere</span>.
        </h1>

        <p className="text-lg text-[var(--color-text-secondary)] mb-10 max-w-xl leading-relaxed">
          Install the agent on any Windows PC, sign in, and get full remote control — screenshot, terminal, power, files, and live monitoring.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <a
            href={AGENT_URL}
            target="_blank" rel="noopener noreferrer"
            className="btn-primary w-full sm:w-auto justify-center text-base px-7 py-3.5 rounded-xl gap-2"
          >
            <Download className="w-4 h-4" />
            Download Agent (.exe)
          </a>
          <Link
            to={user ? '/dashboard' : '/login'}
            className="btn-secondary w-full sm:w-auto justify-center text-base px-7 py-3.5 rounded-xl gap-2"
          >
            Open Dashboard
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-4 text-xs text-[var(--color-text-muted)]">
          Windows 10/11 · Free to use · No credit card required
        </p>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Everything you need, nothing you don't</h2>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto">
            A complete remote management suite built with real-time Firebase sync.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="surface-card p-5 hover:border-[#00bfff]/20 hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#00bfff]/8 border border-[#00bfff]/15 flex items-center justify-center text-[#00bfff] mb-4 group-hover:bg-[#00bfff]/15 transition-colors">
                {f.icon}
              </div>
              <h3 className="font-semibold text-white mb-1.5 text-sm">{f.title}</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Up and running in 60 seconds</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#00bfff]/8 border border-[#00bfff]/20 flex items-center justify-center text-[#00bfff] text-xl font-bold mx-auto mb-4">
                {s.n}
              </div>
              <h3 className="font-semibold text-white mb-1.5">{s.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Download CTA ── */}
      <section id="download" className="py-20 px-6 max-w-3xl mx-auto text-center">
        <div className="glass-card p-10">
          <img src="/logo.png" alt="Orion" className="w-16 h-16 object-contain mx-auto mb-5 animate-float" />
          <h2 className="text-3xl font-bold mb-2">Orion Agent for Windows</h2>
          <p className="text-[var(--color-text-secondary)] mb-2 text-sm">v1.0.0 · Windows 10/11 x64 · ~90MB</p>

          <a
            href={AGENT_URL}
            target="_blank" rel="noopener noreferrer"
            className="btn-primary w-full justify-center text-base py-3.5 rounded-xl gap-2 mt-6 mb-5"
          >
            <Download className="w-5 h-5" />
            Download Orion Agent (.exe)
          </a>

          <div className="grid grid-cols-3 gap-3 text-xs text-[var(--color-text-muted)]">
            {steps.map((s) => (
              <div key={s.n} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04]">
                <div className="text-white font-semibold mb-0.5">{s.n}. {s.title}</div>
                {s.desc}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Orion" className="w-5 h-5 object-contain opacity-60" />
            <span>Orion Remote Control Platform</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="https://github.com/mdhasibulhasan0210/Project-Orion" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
