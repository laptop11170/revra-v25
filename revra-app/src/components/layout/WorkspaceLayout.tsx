"use client";

import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  topNavActions?: React.ReactNode;
}

export function WorkspaceLayout({ children, title, showBack, topNavActions }: WorkspaceLayoutProps) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopNav showBack={showBack}>{topNavActions}</TopNav>
        <div className="flex-1 p-6 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
