'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function LoginForm() {
  const { signInWithEmail, error, clearError, user } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password) return;

    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
    } catch {
      // Error handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      suppressHydrationWarning
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-4 relative overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" suppressHydrationWarning>
        <div className="absolute -top-1/3 -left-1/3 w-2/3 h-2/3 rounded-full bg-indigo-600/15 blur-[120px]" />
        <div className="absolute -bottom-1/3 -right-1/3 w-2/3 h-2/3 rounded-full bg-purple-600/15 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md" suppressHydrationWarning>
        {/* Brand Header */}
        <div className="text-center mb-6" suppressHydrationWarning>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl mb-4 bg-slate-900 border border-slate-700/60 p-2.5">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl">
              <Image src="/logo.png" alt="TeamHQ Logo" fill sizes="40px" className="object-cover scale-[1.65]" priority />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">TeamHQ</h1>
          <p className="text-indigo-200/80 mt-1.5 text-sm font-medium">
            Executive Deliverable & Performance Tracking Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl p-8" suppressHydrationWarning>
          <div className="flex items-center justify-between mb-6" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <h2 className="text-xl font-bold text-white">Sign In</h2>
              <p className="text-xs text-slate-400 mt-0.5" suppressHydrationWarning>
                Enter your credentials to access the scoreboard
              </p>
            </div>
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-200 text-xs font-semibold" role="alert">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div suppressHydrationWarning>
              <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative" suppressHydrationWarning>
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm font-medium"
                />
              </div>
            </div>

            <div suppressHydrationWarning>
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative" suppressHydrationWarning>
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-900/60 border border-white/15 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition p-1 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 cursor-pointer text-sm"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Authenticating…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6" suppressHydrationWarning>
          © 2026 TeamHQ. Secure performance tracking platform.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
