"use client";

import Link from "next/link";

interface TopNavProps {
  title?: string;
  showBack?: boolean;
  children?: React.ReactNode;
}

export function TopNav({ title, showBack, children }: TopNavProps) {
  return (
    <header className="sticky top-0 w-full z-40 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/15 flex justify-between items-center px-6 py-3">
      {/* Left Section */}
      <div className="flex items-center gap-4 flex-1">
        {showBack ? (
          <Link href="/leads" className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            <span>Back to Leads</span>
          </Link>
        ) : (
          <>
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                className="w-full bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container placeholder:text-on-surface-variant/50 transition-all"
                placeholder="Search leads, calls, workflows..."
                type="text"
              />
            </div>
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <button className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-md px-2 py-2 transition-colors relative">
          <span className="material-symbols-outlined text-xl">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full shadow-[0_0_4px_rgba(255,180,171,0.6)]"></span>
        </button>
        <button className="text-tertiary hover:text-tertiary-fixed hover:bg-surface-variant/50 rounded-md px-2 py-2 transition-colors relative">
          <span className="material-symbols-outlined text-xl icon-fill">bolt</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container animate-pulse shadow-[0_0_8px_rgba(131,66,244,0.6)]"></span>
        </button>
        <div className="h-5 w-px bg-outline-variant/30 mx-2"></div>

        {children || (
          <>
            <Link
              href="/leads"
              className="text-on-surface hover:text-primary transition-colors px-3 py-2 rounded-md hover:bg-surface-container text-sm font-medium"
            >
              Quick Actions
            </Link>
            <Link
              href="/leads"
              className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_2px_10px_rgba(45,91,255,0.2)] flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Add Lead
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
