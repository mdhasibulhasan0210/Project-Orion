import React from 'react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { OrionLogo } from '../components/OrionLogo';

export default function Login() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00bfff]/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="glass-card w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <OrionLogo className="w-12 h-12 text-[#00bfff] mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Orion</h1>
          <p className="text-[var(--color-text-secondary)]">Sign in to manage your devices</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email">Email</label>
            <input 
              id="email"
              name="email"
              type="email" 
              required
              className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] transition-colors"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password">Password</label>
            <input 
              id="password"
              name="password"
              type="password" 
              required
              className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00bfff] hover:bg-[#00bfff]/90 text-black font-semibold rounded-lg px-4 py-2 mt-4 flex items-center justify-center transition-all disabled:opacity-50 accent-glow"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
