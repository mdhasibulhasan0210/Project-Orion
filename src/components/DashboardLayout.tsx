import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Monitor, Bell, Settings, Download, ChevronRight } from 'lucide-react';
import { OrionLogo } from './OrionLogo';
import { useState } from 'react';

export default function DashboardLayout() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: <Monitor className="w-4 h-4" />, label: 'My Devices', exact: true },
  ];

  const isActive = (to: string, exact?: boolean) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex bg-[#05070a]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 flex flex-col bg-[#0a0d14] border-r border-white/[0.06] transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.06]">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#00bfff]/10 border border-[#00bfff]/20 flex items-center justify-center group-hover:bg-[#00bfff]/20 transition-colors">
              <OrionLogo className="w-4 h-4 text-[#00bfff]" />
            </div>
            <div>
              <div className="text-white font-bold text-sm tracking-tight leading-none">Orion</div>
              <div className="text-[10px] text-[#00bfff] font-medium tracking-widest uppercase leading-none mt-0.5">Remote Control</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2 pt-1">Management</p>
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive(item.to, item.exact)
                  ? 'bg-[#00bfff]/10 text-[#00bfff] border border-[#00bfff]/15'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {isActive(item.to, item.exact) && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          ))}

          <div className="pt-4">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2">Downloads</p>
            <a
              href="https://github.com/mdhasibulhasan0210/Project-Orion/releases/latest/download/Orion-Agent-Setup.exe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all group"
            >
              <Download className="w-4 h-4" />
              <span className="flex-1">Download Agent</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#00bfff]/10 text-[#00bfff] border border-[#00bfff]/20 font-semibold">.EXE</span>
            </a>
          </div>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00bfff]/30 to-[#0088cc]/30 border border-[#00bfff]/20 flex items-center justify-center text-xs font-bold text-[#00bfff] flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{user?.email}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Authenticated</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-red-400 rounded-xl hover:bg-red-500/[0.05] transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[#0a0d14]">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex flex-col justify-center items-center gap-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <span className="w-5 h-0.5 bg-gray-400 rounded" />
            <span className="w-5 h-0.5 bg-gray-400 rounded" />
            <span className="w-3 h-0.5 bg-gray-400 rounded" />
          </button>
          <div className="flex items-center gap-2">
            <OrionLogo className="w-5 h-5 text-[#00bfff]" />
            <span className="text-white font-bold text-sm">Orion</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
