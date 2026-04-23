'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores';

function getToken() {
  if (typeof window === 'undefined') return '';
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : '';
}

function adminFetch(path: string, options?: RequestInit) {
  return fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...options?.headers,
    },
    credentials: 'include',
  });
}

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const res = await adminFetch('/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics');
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminWorkspaces() {
  return useQuery({
    queryKey: ['admin', 'workspaces'],
    queryFn: async () => {
      const res = await adminFetch('/workspaces');
      if (!res.ok) throw new Error('Failed to fetch workspaces');
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminAgents() {
  return useQuery({
    queryKey: ['admin', 'agents'],
    queryFn: async () => {
      const res = await adminFetch('/agents');
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminPlans() {
  return useQuery({
    queryKey: ['admin', 'plans'],
    queryFn: async () => {
      const res = await adminFetch('/plans');
      if (!res.ok) throw new Error('Failed to fetch plans');
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminIntegrations() {
  return useQuery({
    queryKey: ['admin', 'integrations'],
    queryFn: async () => {
      const res = await adminFetch('/integrations');
      if (!res.ok) throw new Error('Failed to fetch integrations');
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useAdminHealth() {
  return useQuery({
    queryKey: ['admin', 'health'],
    queryFn: async () => {
      const res = await fetch('/api/admin/health');
      if (!res.ok) throw new Error('Failed to fetch health');
      return res.json();
    },
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });
}
