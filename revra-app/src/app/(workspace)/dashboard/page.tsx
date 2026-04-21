"use client";

import Link from "next/link";
import { useDataStore } from "@/lib/stores";
import { useAuthStore } from "@/lib/stores";
import { useAIStore } from "@/lib/stores";

export default function DashboardPage() {
  const session = useAuthStore((s) => s.session);
  const leads = useDataStore((s) => s.leads);
  const stages = useDataStore((s) => s.stages);
  const aiCredits = useAIStore((s) => s.aiCredits);
  const appointments = useDataStore((s) => s.appointments);

  const myLeads = leads.filter(
    (l) =>
      l.workspaceId === session?.workspaceId &&
      !l.deletedAt &&
      (session?.role === "admin" || l.assignedAgentId === session?.userId)
  );

  const hotLeads = myLeads.filter((l) => l.score >= 80).length;
  const newLeads = myLeads.filter((l) => l.pipeline.stageId === "stage-1").length;
  const totalLeads = myLeads.length;

  const today = new Date().setHours(0, 0, 0, 0);
  const todayAppointments = appointments.filter(
    (a) =>
      a.scheduledAt >= today &&
      a.scheduledAt < today + 86400000 &&
      a.agentId === session?.userId
  );

  const overdueLeads = myLeads.filter((l) => {
    const stage = stages.find((s) => s.id === l.pipeline.stageId);
    if (!stage || stage.position >= 8) return false;
    const daysInStage = Math.floor(
      (Date.now() - l.pipeline.enteredStageAt) / (1000 * 60 * 60 * 24)
    );
    return daysInStage > 7;
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">
          Good morning, {session?.name?.split(" ")[0]}
        </h1>
        <p className="text-on-surface-variant mt-1">
          Here&apos;s your workspace at a glance.
        </p>
      </div>

      {/* Hero / Quick Actions Asymmetric Grid */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Wallet & Performance (Bento style) */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container rounded-xl p-6 flex flex-col relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-tertiary/10 rounded-full blur-3xl"></div>
          <div className="flex justify-between items-start mb-6 z-10">
            <h2 className="text-lg font-bold text-on-surface tracking-tight">AI Compute</h2>
            <span className="material-symbols-outlined text-tertiary">memory</span>
          </div>
          <div className="flex items-end gap-2 mb-2 z-10">
            <span className="text-4xl font-black tracking-tight">{aiCredits.toLocaleString()}</span>
            <span className="text-sm text-on-surface-variant mb-1">credits</span>
          </div>
          <div className="w-full h-2 bg-surface-container-lowest rounded-full mb-6 z-10 overflow-hidden">
            <div className="h-full bg-tertiary-container rounded-full w-[65%]"></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-auto z-10">
            <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/15">
              <span className="text-xs text-on-surface-variant block mb-1">Weekly Burn</span>
              <span className="text-lg font-semibold text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">trending_up</span> 340
              </span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/15">
              <span className="text-xs text-on-surface-variant block mb-1">Est. Depletion</span>
              <span className="text-lg font-semibold text-secondary flex items-center gap-1">
                14 Days
              </span>
            </div>
          </div>
        </div>

        {/* Action Grid */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-2 gap-4">
          <Link
            href="/leads"
            className="bg-surface-container hover:bg-surface-container-high transition-colors rounded-xl p-5 flex flex-col justify-between items-start group border border-transparent hover:border-outline-variant/15"
          >
            <div className="p-3 bg-primary-container/10 rounded-lg text-primary mb-4 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">person_add</span>
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold text-on-surface mb-1">New Lead</span>
              <span className="text-xs text-on-surface-variant">Manual entry or scan</span>
            </div>
          </Link>

          <Link
            href="/ai-command-center"
            className="gradient-action rounded-xl p-5 flex flex-col justify-between items-start group shadow-[0_0_20px_rgba(45,91,255,0.15)] hover:shadow-[0_0_30px_rgba(45,91,255,0.25)] transition-all"
          >
            <div className="p-3 bg-black/20 rounded-lg text-white mb-4 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold text-white mb-1">Start AI Calls</span>
              <span className="text-xs text-white/80">Engage current pipeline</span>
            </div>
          </Link>

          <Link
            href="/csv-import"
            className="bg-surface-container hover:bg-surface-container-high transition-colors rounded-xl p-5 flex flex-col justify-between items-start group border border-transparent hover:border-outline-variant/15"
          >
            <div className="p-3 bg-secondary-container/20 rounded-lg text-secondary mb-4 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">upload_file</span>
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold text-on-surface mb-1">Import CSV</span>
              <span className="text-xs text-on-surface-variant">Bulk upload lists</span>
            </div>
          </Link>

          <Link
            href="/calendar"
            className="bg-surface-container hover:bg-surface-container-high transition-colors rounded-xl p-5 flex flex-col justify-between items-start group border border-transparent hover:border-outline-variant/15"
          >
            <div className="p-3 bg-surface-bright rounded-lg text-on-surface mb-4 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div className="text-left">
              <span className="block text-sm font-semibold text-on-surface mb-1">Schedule</span>
              <span className="text-xs text-on-surface-variant">View calendar</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Data Layer */}
      <div className="grid grid-cols-12 gap-6">
        {/* Performance Charts Area */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bg-surface-container rounded-xl p-6 h-[300px] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold uppercase text-on-surface tracking-wide">Revenue Velocity</h3>
              <button className="text-xs text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
                Last 30 Days <span className="material-symbols-outlined text-[14px]">expand_more</span>
              </button>
            </div>
            <div className="flex-1 flex items-end gap-2 relative">
              <div className="absolute bottom-0 left-0 w-full h-[150px] bg-gradient-to-t from-primary-container/10 to-transparent rounded-b-lg"></div>
              {[20, 35, 25, 50, 40, 65, 55, 80, 70, 90, 100, 40].map((height, i) => (
                <div
                  key={i}
                  className={`w-1/12 bg-surface-container-low hover:bg-surface-bright transition-colors rounded-t-sm z-10 ${
                    i === 10 ? "bg-primary-container shadow-[0_0_15px_rgba(45,91,255,0.3)] relative" : ""
                  }`}
                  style={{ height: `${height}%` }}
                >
                  {i === 9 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">$12k</div>
                  )}
                  {i === 10 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-surface-container-high px-2 py-1 rounded text-xs font-bold text-on-surface whitespace-nowrap">
                      $18.5k
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Focus (AI Powered) */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low rounded-xl p-6 flex flex-col border border-outline-variant/15 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-[120px] text-tertiary">psychology</span>
          </div>
          <div className="flex items-center gap-2 mb-6 z-10">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary"></span>
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-tertiary">Your Focus</h3>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6 z-10">
            <div className="text-center">
              <div className="text-2xl font-bold text-on-surface">{totalLeads}</div>
              <div className="text-xs text-on-surface-variant">Total Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{hotLeads}</div>
              <div className="text-xs text-on-surface-variant">Hot Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{overdueLeads.length}</div>
              <div className="text-xs text-on-surface-variant">Overdue</div>
            </div>
          </div>

          <div className="flex flex-col gap-4 z-10">
            {overdueLeads.slice(0, 2).map((lead) => (
              <div key={lead.id} className="bg-surface-container p-4 rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-on-surface">{lead.fullName}</span>
                  <span className="text-[10px] uppercase font-bold text-error bg-error/10 px-2 py-0.5 rounded">Overdue</span>
                </div>
                <p className="text-xs text-on-surface-variant mb-3">
                  {lead.coverageType} • Score: {lead.score}
                </p>
                <Link
                  href={`/leads/${lead.id}`}
                  className="text-xs text-tertiary font-medium group-hover:underline"
                >
                  View Lead →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
