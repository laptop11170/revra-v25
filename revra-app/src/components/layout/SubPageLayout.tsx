"use client";

interface SubPageLayoutProps {
  children: React.ReactNode;
}

export function SubPageLayout({ children }: SubPageLayoutProps) {
  return (
    <div className="min-h-screen bg-surface p-6">
      {children}
    </div>
  );
}
