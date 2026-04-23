"use client";

import { useState } from 'react';
import { useAdminHealth } from '@/hooks/useAdmin';

export default function AdminNetworkPage() {
  const { data: healthData } = useAdminHealth();
  const health = (healthData as any)?.data;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">Network & Health</h1>
        <p className="text-on-surface-variant mt-1">Real-time system health monitoring</p>
      </div>

      {/* Status Overview */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 mb-6 flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]' : health?.status === 'degraded' ? 'bg-amber-400 animate-pulse' : 'bg-error'}`}></span>
          <span className="text-lg font-bold text-on-surface capitalize">{health?.status || 'loading'}</span>
        </div>
        <div className="h-8 w-px bg-outline-variant/30"></div>
        <div className="grid grid-cols-3 gap-8">
          <div>
            <span className="text-xs text-on-surface-variant">Uptime (30d)</span>
            <div className="text-xl font-bold text-on-surface">{health?.uptime ?? '—'}</div>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Avg Response</span>
            <div className="text-xl font-bold text-on-surface">{health?.latency ?? '—'}ms</div>
          </div>
          <div>
            <span className="text-xs text-on-surface-variant">Active Calls</span>
            <div className="text-xl font-bold text-on-surface">{health?.callCount ?? 0}</div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="bg-surface-container-low rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-outline-variant/15">
          <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">Service Status</h3>
        </div>
        <div className="divide-y divide-outline-variant/5">
          {(health?.services || []).map((svc: any) => (
            <div key={svc.name} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${svc.status === 'up' ? 'bg-emerald-400' : svc.status === 'degraded' ? 'bg-amber-400 animate-pulse' : 'bg-error'}`}></span>
                <span className="font-medium text-on-surface">{svc.name}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-on-surface-variant">{svc.latency ?? svc.responseTime}ms</div>
                <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${svc.status === 'up' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
          {!health?.services?.length && (
            <div className="px-6 py-4 text-sm text-on-surface-variant">Loading service status...</div>
          )}
        </div>
      </div>

      {/* Health Timeline */}
      <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
        <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide mb-4">24-Hour Event Timeline</h3>
        <div className="space-y-3">
          {[
            { time: '6:45 PM', event: 'Emma AI response time normalized to 890ms', severity: 'warning' },
            { time: '3:12 PM', event: 'API server response time briefly elevated (230ms peak)', severity: 'warning' },
            { time: '11:00 AM', event: 'All systems nominal after database maintenance window', severity: 'success' },
            { time: '6:00 AM', event: 'Scheduled database maintenance window started', severity: 'info' },
            { time: 'Yesterday', event: 'Weekly backup completed successfully', severity: 'success' },
          ].map((ev, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-on-surface-variant shrink-0 w-16">{ev.time}</span>
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${ev.severity === 'success' ? 'bg-emerald-400' : ev.severity === 'warning' ? 'bg-amber-400' : 'bg-primary'}`}></span>
              <span className="text-on-surface">{ev.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}