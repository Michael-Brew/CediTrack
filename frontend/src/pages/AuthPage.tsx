import React, { useState } from 'react';
import { Sparkles, Shield, ArrowRight, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

export const AuthPage: React.FC = () => {
  const { login, signup, loginDemo } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await signup(email, password, name);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Accent Gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/60 mb-4">
          <span className="text-3xl font-black text-slate-950 font-sans">₵</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          CediTrack Ghana
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Personal & SME Finance Tracker with MoMo, Bank & Cash visibility
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/90 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 space-y-6">
          {/* 1-Click Instant Demo Login Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 via-slate-850 to-amber-950/50 border border-emerald-500/30 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Instant Test Mode</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Explore CediTrack immediately with pre-loaded Ghanaian MoMo, bank and SME sample records.
            </p>
            <button
              type="button"
              onClick={loginDemo}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore as Kwame Mensah (Demo)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Or Sign In / Sign Up
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
                {error}
              </div>
            )}

            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name / Business Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kwame@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950/40 transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create CediTrack Account' : 'Sign In'}
            </button>
          </form>

          {/* Toggle between login / signup */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
