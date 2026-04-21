"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/morning-briefing", label: "Morning Briefing", icon: "wb_sunny" },
  { href: "/inbox", label: "Inbox", icon: "inbox" },
  { href: "/leads", label: "Leads", icon: "person_search" },
  { href: "/pipeline", label: "Pipeline", icon: "account_tree" },
  { href: "/dialer", label: "Dialer", icon: "call" },
  { href: "/workflows", label: "Workflows", icon: "schema" },
  { href: "/discussions", label: "Discussions", icon: "forum" },
  { href: "/calendar", label: "Calendar", icon: "calendar_today" },
  { href: "/ai-command-center", label: "AI Command Center", icon: "terminal" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 overflow-y-auto bg-surface-container-low border-r border-outline-variant/15 flex flex-col p-4 gap-2 z-50">
      {/* Header */}
      <div className="mb-8 px-2 flex items-center justify-between">
        <h1 className="text-xl font-black text-on-surface tracking-tighter">RevRa CRM</h1>
      </div>

      {/* Agency Info */}
      <div className="px-2 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-container to-tertiary-container flex items-center justify-center shadow-[0_0_15px_rgba(45,91,255,0.3)]">
            <span className="material-symbols-outlined text-on-primary-container icon-fill">analytics</span>
          </div>
          <div>
            <p className="text-sm font-medium text-on-surface">Agent Workspace</p>
            <p className="text-xs text-on-surface-variant">The Intelligent Pulse</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 space-y-1 font-['Inter'] antialiased tracking-tight">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? "text-primary-container bg-primary-container/10 font-semibold"
                  : "text-on-surface/60 hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer / Settings */}
      <div className="mt-auto space-y-1 font-['Inter'] antialiased tracking-tight">
        {/* AI Credits */}
        <div className="px-3 py-3 mb-2 bg-surface-container-highest rounded-lg border border-outline-variant/15 flex items-center justify-between group cursor-pointer hover:bg-surface-variant transition-colors">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-sm">auto_awesome</span>
            <span className="text-xs font-medium text-on-surface">AI Credits: 1,240</span>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant text-sm group-hover:text-primary transition-colors">add</span>
        </div>

        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 active:scale-[0.98] ${
            pathname === "/settings"
              ? "text-primary-container bg-primary-container/10 font-semibold"
              : "text-on-surface/60 hover:text-on-surface hover:bg-surface-container"
          }`}
        >
          <span className="material-symbols-outlined text-lg">settings</span>
          <span>Settings</span>
        </Link>

        {/* Agent Profile Mini */}
        <div className="flex items-center gap-3 px-3 py-3 mt-2 border-t border-outline-variant/15">
          <img
            alt="Agent Profile"
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
            className="w-8 h-8 rounded-full object-cover border border-outline-variant/30"
          />
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-on-surface">Alex Mercer</span>
            <span className="text-[10px] text-on-surface-variant">Senior Agent</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
