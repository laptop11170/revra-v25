'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores';

function getToken() {
  if (typeof window === 'undefined') return '';
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : '';
}

export function useCalls(leadId?: string) {
  const session = useAuthStore((s) => s.session);

  return useQuery({
    queryKey: ['calls', session?.userId, leadId],
    queryFn: async () => {
      const url = leadId
        ? `/api/calls?leadId=${leadId}`
        : '/api/calls';
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch calls');
      const data = await res.json();
      return data.data as any[];
    },
    enabled: !!session?.userId,
    staleTime: 30 * 1000,
  });
}

export function useLogCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (call: {
      leadId: string;
      direction?: string;
      status?: string;
      outcome?: string;
      duration?: number;
      notes?: string;
      emmaAi?: boolean;
    }) => {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify(call),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to log call');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
      qc.invalidateQueries({ queryKey: ['calls'] });
    },
  });
}