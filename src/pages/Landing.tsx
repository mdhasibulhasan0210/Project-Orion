import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Shield, Zap, ArrowRight, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { OrionLogo } from '../components/OrionLogo';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#05070a] text-white selection:bg-[#00bfff]/30">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-[#00bfff]/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#00bfff]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card mx-4 mt-4 px-6 py-4 flex items-center justify-between !rounded-full">
        <div className="flex items-center gap-2">
          <OrionLogo className="w-6 h-6 text-[#00bfff]" />
          <span className="text-xl font-bold tracking-tight">Orion</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
            {user ? 'Dashboard' : 'Sign In'}
          </Link>
          <a href="#download" className="bg-[#00bfff] hover:bg-[#00bfff]/90 text-black px-4 py-2 rounded-full text-sm font-bold transition-all accent-glow">
            Get Agent
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#00bfff] text-sm font-medium mb-6 inline-block">
            Production-Ready Remote Management
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
            Control your devices <br className="hidden md:block" /> from <span className="text-[#00bfff]">anywhere</span>.
          </h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-10 max-w-2xl mx-auto">
            A lightning-fast, secure, and beautiful SaaS platform for managing Windows workstations remotely. Execute commands, transfer files, and view screens in real-time.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={user ? '/dashboard' : '/login'} className="w-full sm:w-auto bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2">
              {user ? 'Go to Dashboard' : 'Start Managing Free'}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#download" className="w-full sm:w-auto glass-card hover:bg-white/5 px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center gap-2">
              <Download className="w-5 h-5 text-[#00bfff]" />
              Download Agent
            </a>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap className="w-8 h-8 text-yellow-400" />}
            title="Real-Time Execution"
            description="Send power commands, terminate processes, and execute terminal commands with zero latency using Firestore real-time streams."
          />
          <FeatureCard 
            icon={<Shield className="w-8 h-8 text-green-400" />}
            title="Secure by Design"
            description="All commands are securely signed. The Electron agent verifies HMAC signatures before executing any action on the host machine."
          />
          <FeatureCard 
            icon={<Monitor className="w-8 h-8 text-[#00bfff]" />}
            title="Full System Access"
            description="View active screens, browse file systems, transfer large files, and read system diagnostics all from the browser."
          />
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 px-6 max-w-4xl mx-auto text-center border-t border-white/5">
        <h2 className="text-3xl font-bold mb-4">Install the Agent</h2>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Download the lightweight Windows agent, install it on any PC, sign in, and it automatically appears in your dashboard.
        </p>
        <div className="glass-card p-8 inline-block max-w-lg mx-auto w-full">
          <OrionLogo className="w-16 h-16 text-[#00bfff] mx-auto mb-6" />
          <h3 className="text-xl font-bold mb-1">Orion Agent for Windows</h3>
          <p className="text-sm text-gray-400 mb-6">v1.0.0 · Windows 10/11 x64 · ~80MB</p>

          <a
            href="https://github.com/mdhasibulhasan0210/Project-Orion/releases/latest/download/Orion-Agent-Setup.exe"
            className="bg-[#00bfff] text-black px-8 py-3 rounded-lg font-bold w-full hover:bg-[#00bfff]/90 transition-all accent-glow block text-center mb-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download className="w-4 h-4 inline mr-2" />
            Download Orion Agent (.exe)
          </a>

          <div className="grid grid-cols-3 gap-3 text-xs text-gray-500 mb-4">
            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
              <div className="text-white font-semibold mb-0.5">1. Install</div>
              Run the .exe installer
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
              <div className="text-white font-semibold mb-0.5">2. Sign In</div>
              Use your Orion account
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
              <div className="text-white font-semibold mb-0.5">3. Done!</div>
              PC appears on dashboard
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Source code on{' '}
            <a href="https://github.com/mdhasibulhasan0210/Project-Orion" target="_blank" rel="noopener noreferrer" className="text-[#00bfff] hover:underline">
              GitHub
            </a>
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 text-center text-sm text-[var(--color-text-secondary)] border-t border-white/5 mt-20">
        <p>&copy; {new Date().getFullYear()} Orion Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-card p-8 hover:bg-white/[0.02] transition-colors">
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
    </div>
  );
}
