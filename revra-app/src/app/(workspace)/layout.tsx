"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { FloatingAIBar } from "@/components/ai/FloatingAIBar";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <TopNav />
        <div className="flex-1 p-6 overflow-y-auto">{children}</div>
      </main>
      <FloatingAIBar />
    </div>
  );
}
