'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: 'agent' | 'admin' | 'super_admin';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const session = useAuthStore((s) => s.session);
  const checkSession = useAuthStore((s) => s.checkSession);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!session) {
      router.push('/login');
    } else if (requiredRole && session.role !== requiredRole && session.role !== 'super_admin') {
      if (requiredRole === 'super_admin') {
        router.push('/dashboard');
      } else if (session.role === 'agent' && requiredRole === 'admin') {
        router.push('/dashboard');
      }
    } else if (session.role === 'super_admin' && requiredRole !== 'super_admin') {
      // Super admin can access any workspace route, redirect to admin
      router.push('/admin/overview');
    }
  }, [session, requiredRole, router]);

  if (!session) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
