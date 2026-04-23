'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores';

function getToken() {
  if (typeof window === 'undefined') return '';
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : '';
}

export function useDiscussions() {
  const session = useAuthStore((s) => s.session);
  return useQuery({
    queryKey: ['discussions'],
    queryFn: async () => {
      const res = await fetch('/api/discussions', {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch discussions');
      const data = await res.json();
      return data.data as any[];
    },
    enabled: !!session,
    staleTime: 30 * 1000,
  });
}

export function useDiscussionMessages(channelId: string) {
  return useQuery({
    queryKey: ['discussion-messages', channelId],
    queryFn: async () => {
      const res = await fetch(`/api/discussions/${channelId}/messages`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      const data = await res.json();
      return data.data as any[];
    },
    enabled: !!channelId,
    staleTime: 10 * 1000,
    refetchInterval: 15000, // Poll every 15 seconds for new messages
  });
}

export function useCreateDiscussion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (channel: { type: string; name: string; participantId?: string }) => {
      const res = await fetch('/api/discussions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify(channel),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create discussion');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useSendDiscussionMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ channelId, content, type }: { channelId: string; content: string; type?: string }) => {
      const res = await fetch(`/api/discussions/${channelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        credentials: 'include',
        body: JSON.stringify({ content, type }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['discussion-messages', vars.channelId] });
      qc.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}
