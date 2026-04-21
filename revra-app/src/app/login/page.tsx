"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      const session = useAuthStore.getState().session;
      if (session?.role === 'super_admin') {
        router.push('/admin/overview');
      } else {
        router.push('/dashboard');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-surface">
      {/* Ambient AI Glow Background */}
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-tertiary/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-60 -left-40 w-[600px] h-[600px] bg-primary-container/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md px-6 relative z-10">
        {/* Header / Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-on-surface tracking-tighter mb-2">RevRa</h1>
          <p className="text-sm font-medium text-on-surface-variant">Modern Agent CRM</p>
        </div>

        {/* Glassmorphic Login Card */}
        <div className="glass-panel rounded-xl p-8 shadow-2xl shadow-surface-container-lowest/50">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-1">Welcome back</h2>
            <p className="text-sm text-on-surface-variant">Sign in to access your intelligent workspace.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-on-surface-variant mb-2" htmlFor="email">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-xl">mail</span>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-lg text-sm placeholder-outline/50 transition-colors duration-200 bg-surface-container-lowest border border-outline-variant/15 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                  placeholder="agent1@revra.test"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-on-surface-variant" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline text-xl">lock</span>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-lg text-sm placeholder-outline/50 transition-colors duration-200 bg-surface-container-lowest border border-outline-variant/15 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                  placeholder="password"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-error-container/20 border border-error/30 text-error text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-on-primary-container bg-primary-container hover:bg-primary-container/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-container focus:ring-offset-surface transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 bg-surface-container-lowest/50 rounded-lg p-4 border border-outline-variant/10">
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Demo Credentials</p>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Agent:</span>
                <code className="text-on-surface">agent1@revra.test / password</code>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Admin:</span>
                <code className="text-on-surface">admin1@revra.test / password</code>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Super Admin:</span>
                <code className="text-on-surface">super@revra.test / password</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <span className="font-medium text-primary cursor-default">Request access</span>
          </p>
        </div>
      </div>
    </div>
  );
}
