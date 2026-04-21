'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

const adminNav = [
  { href: '/admin/overview', label: 'Overview', icon: 'dashboard' },
  { href: '/admin/workspaces', label: 'Workspaces', icon: 'business' },
  { href: '/admin/agents', label: 'Agents', icon: 'groups' },
  { href: '/admin/billing', label: 'Billing', icon: 'credit_card' },
  { href: '/admin/plans', label: 'Plans', icon: 'sell' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/admin/integrations', label: 'Integrations', icon: 'extension' },
  { href: '/admin/network', label: 'Network', icon: 'network_check' },
  { href: '/admin/platform-settings', label: 'Settings', icon: 'settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside className="w-64 shrink-0 bg-surface-container-lowest border-r border-outline-variant/15 flex flex-col h-screen fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-5 border-b border-outline-variant/15">
        <Link href="/admin/overview" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
            <span className="text-on-primary-container font-black text-lg">R</span>
          </div>
          <div>
            <span className="text-lg font-black text-on-surface tracking-tight">RevRa</span>
            <span className="block text-[10px] font-medium text-error uppercase tracking-widest -mt-0.5">Platform Admin</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {adminNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-container/20 text-primary shadow-[0_0_12px_rgba(45,91,255,0.15)]'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-outline-variant/15 space-y-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Back to Workspace
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-error hover:bg-error-container/20 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
