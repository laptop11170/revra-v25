'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores';

function getToken() {
  if (typeof window === 'undefined') return '';
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : '';
}

export function useAgents() {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['agents', session?.workspaceId],
    queryFn: async () => {
      const res = await fetch('/api/agents', {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch agents');
      const data = await res.json();
      return data.data as any[];
    },
    enabled: !!session?.workspaceId,
    staleTime: 60 * 1000,
  });
}