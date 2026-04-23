'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores';

function getToken() {
  if (typeof window === 'undefined') return '';
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : '';
}

export function useWorkspace() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['workspace', session?.workspaceId],
    queryFn: async () => {
      const res = await fetch('/api/workspace', {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.data as any;
    },
    enabled: !!session?.workspaceId,
    staleTime: 60 * 1000,
  });
}

export function usePipelineStages() {
  return useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: async () => {
      const res = await fetch('/api/pipeline', {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch stages');
      const data = await res.json();
      return data.data as any[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAppointments(agentId?: string) {
  return useQuery({
    queryKey: ['appointments', agentId],
    queryFn: async () => {
      const params = agentId ? `?agentId=${agentId}` : '';
      const res = await fetch(`/api/appointments${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch appointments');
      const data = await res.json();
      return data.data as any[];
    },
    staleTime: 30 * 1000,
  });
}