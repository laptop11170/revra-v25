'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores';

function getToken() {
  if (typeof window === 'undefined') return '';
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : '';
}

export function useActivities(leadId: string) {
  return useQuery({
    queryKey: ['activities', leadId],
    queryFn: async () => {
      const res = await fetch(`/api/leads/${leadId}/activities`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch activities');
      const data = await res.json();
      return data.data as any[];
    },
    enabled: !!leadId,
    staleTime: 30 * 1000,
  });
}

export function useCreateActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, ...activity }: {
      leadId: string;
      type: string;
      description: string;
      metadata?: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/leads/${leadId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify(activity),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create activity');
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['activities', vars.leadId] });
    },
  });
}
