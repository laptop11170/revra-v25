'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores';

function getToken() {
  if (typeof window === 'undefined') return '';
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : '';
}

function wsFetch(path: string, options?: RequestInit) {
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options?.headers,
    },
    credentials: 'include',
  });
}

export function useWorkflows() {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const res = await wsFetch('/workflows');
      if (!res.ok) throw new Error('Failed to fetch workflows');
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; isActive?: boolean; nodes?: any[]; edges?: any[] }) => {
      const res = await wsFetch('/workflows', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create workflow');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; description?: string; isActive?: boolean; nodes?: any[]; edges?: any[] }) => {
      const res = await wsFetch(`/workflows/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update workflow');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await wsFetch(`/workflows/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete workflow');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workflows'] }),
  });
}