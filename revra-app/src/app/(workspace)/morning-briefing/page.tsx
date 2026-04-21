"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useDataStore } from "@/lib/stores";
import { useAuthStore } from "@/lib/stores";
import { useMemo } from "react";
import Link from "next/link";

export default function MorningBriefingPage() {
  const session = useAuthStore((s) => s.session);
  const leads = useDataStore((s) => s.leads);
  const stages = useDataStore((s) => s.stages);
  const appointments = useDataStore((s) => s.appointments);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = today.getTime() + 86400000;

  const myLeads = leads.filter((l) => {
    if (l.deletedAt) return false;
    if (l.workspaceId !== session?.workspaceId) return false;
    if (session?.role === "agent" && l.assignedAgentId !== session?.userId) return false;
    return true;
  });

  const overdueLeads = useMemo(() => {
    return myLeads.filter((l) => {
      const stage = stages.find((s) => s.id === l.pipeline.stageId);
      if (!stage || stage.position >= 8) return false;
      const daysInStage = Math.floor((Date.now() - l.pipeline.enteredStageAt) / (1000 * 60 * 60 * 24));
      return daysInStage > 7;
    });
  }, [myLeads, stages]);

  const newLeads = myLeads.filter((l) => l.pipeline.stageId === "stage-1");

  const hotLeads = myLeads.filter((l) => l.score >= 80);

  const todayAppointments = appointments.filter(
    (a) => a.scheduledAt >= today.getTime() && a.scheduledAt < todayEnd && a.agentId === session?.userId
  );

  const aiSuggestions = useMemo(() => {
    const suggestions: Array<{ leadId: string; message: string }> = [];
    hotLeads.slice(0, 2).forEach((lead) => {
      suggestions.push({
        leadId: lead.id,
        message: `Consider reaching out to ${lead.fullName} (Score: ${lead.score}). High-intent signal based on profile data.`,
      });
    });
    overdueLeads.slice(0, 1).forEach((lead) => {
      suggestions.push({
        leadId: lead.id,
        message: `${lead.fullName} is overdue for follow-up. Consider an immediate touchpoint.`,
      });
    });
    return suggestions;
  }, [hotLeads, overdueLeads]);

  const getDaysOverdue = (enteredStageAt: number) =>
    Math.floor((Date.now() - enteredStageAt) / (1000 * 60 * 60 * 24)) - 7;

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SubPageLayout>
      <div className="max-w-7xl w-full">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Morning Briefing</h2>
            <p className="text-on-surface-variant text-sm max-w-2xl">
              Good morning. You have{" "}
              <span className="text-error font-medium">{overdueLeads.length} overdue item{overdueLeads.length !== 1 ? "s" : ""}</span> and{" "}
              <span className="text-tertiary font-medium">{aiSuggestions.length} new AI suggestion{aiSuggestions.length !== 1 ? "s" : ""}</span> to review today.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            {overdueLeads.length > 0 && (
              <section className="bg-surface-container rounded-xl p-6 relative overflow-hidden group">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-error"></div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-error">warning</span>
                  <h3 className="text-lg font-bold text-on-surface">Overdue Follow-Ups</h3>
                  <span className="bg-error/10 text-error text-xs font-semibold px-2 py-0.5 rounded-full ml-auto">Immediate Action Required</span>
                </div>
                <p className="text-sm text-on-surface-variant mb-5 italic border-l-2 border-outline-variant/30 pl-3">
                  &quot;These leads have been in their current stage for over 7 days. Recommend immediate touchpoints before EOD.&quot;
                </p>
                <div className="flex flex-col gap-3">
                  {overdueLeads.slice(0, 3).map((lead) => {
                    const daysOverdue = getDaysOverdue(lead.pipeline.enteredStageAt);
                    return (
                      <div key={lead.id} className="bg-surface-container-low rounded-lg p-4 flex items-center justify-between hover:bg-surface-bright transition-colors border border-outline-variant/10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-on-surface-variant font-medium border border-outline-variant/20">
                            {getInitials(lead.fullName)}
                          </div>
                          <div>
                            <h4 className="font-medium text-on-surface text-sm">{lead.fullName}</h4>
                            <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[14px]">schedule</span>
                              {daysOverdue} day{daysOverdue !== 1 ? "s" : ""} overdue • {lead.coverageType} • Score: {lead.score}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/leads/${lead.id}`}>
                            <button className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-variant flex items-center justify-center transition-colors" title="View Lead">
                              <span className="material-symbols-outlined text-[18px]">person</span>
                            </button>
                          </Link>
                          <button className="w-8 h-8 rounded-full bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-variant flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined text-[18px]">sms</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-surface-container rounded-xl p-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-container"></div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">person_add</span>
                  <h3 className="text-base font-bold text-on-surface">New Leads</h3>
                </div>
                <p className="text-xs text-on-surface-variant mb-4 italic pl-2 border-l border-outline-variant/30">
                  &quot;{newLeads.length} new lead{newLeads.length !== 1 ? "s" : ""} in your pipeline. Prioritize by score.&quot;
                </p>
                <div className="space-y-2">
                  {newLeads.slice(0, 3).map((lead) => (
                    <div key={lead.id} className="bg-surface-container-lowest/50 rounded p-3 flex justify-between items-start border border-outline-variant/10">
                      <div>
                        <Link href={`/leads/${lead.id}`}>
                          <p className="text-sm font-medium text-on-surface hover:text-primary transition-colors">{lead.fullName}</p>
                        </Link>
                        <p className="text-xs text-on-surface-variant mt-1 capitalize">{lead.source.replace("_", " ")} • Score: <span className="text-primary font-medium">{lead.score}</span></p>
                      </div>
                      <Link href={`/leads/${lead.id}`}>
                        <button className="text-on-surface-variant hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </Link>
                    </div>
                  ))}
                  {newLeads.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-4">No new leads</p>
                  )}
                </div>
              </section>

              <section className="bg-surface-container rounded-xl p-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-emerald-500 text-[20px]">local_fire_department</span>
                  <h3 className="text-base font-bold text-on-surface">Hot Leads</h3>
                </div>
                <p className="text-xs text-on-surface-variant mb-4 italic pl-2 border-l border-outline-variant/30">
                  &quot;High-intent prospects with score 80+. Prioritize outreach.&quot;
                </p>
                <div className="space-y-2">
                  {hotLeads.slice(0, 3).map((lead) => (
                    <div key={lead.id} className="bg-surface-container-lowest/50 rounded p-3 flex justify-between items-start border border-outline-variant/10">
                      <div>
                        <Link href={`/leads/${lead.id}`}>
                          <p className="text-sm font-medium text-on-surface hover:text-primary transition-colors">{lead.fullName}</p>
                        </Link>
                        <p className="text-xs text-on-surface-variant mt-1">Score: <span className="text-emerald-500 font-bold">{lead.score}</span> • {lead.coverageType}</p>
                      </div>
                      <Link href={`/leads/${lead.id}`}>
                        <button className="bg-emerald-500/20 text-emerald-500 px-2 py-1 rounded text-xs font-medium hover:bg-emerald-500/30 transition-colors">
                          View
                        </button>
                      </Link>
                    </div>
                  ))}
                  {hotLeads.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-4">No hot leads</p>
                  )}
                </div>
              </section>
            </div>

            {todayAppointments.length > 0 && (
              <section className="bg-surface-container rounded-xl p-5 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-amber-500 text-[20px]">calendar_month</span>
                  <h3 className="text-base font-bold text-on-surface">Today&apos;s Appointments</h3>
                </div>
                <p className="text-xs text-on-surface-variant mb-4 italic pl-2 border-l border-outline-variant/30">
                  &quot;{todayAppointments.length} appointment{todayAppointments.length !== 1 ? "s" : ""} scheduled for today.&quot;
                </p>
                <div className="space-y-2">
                  {todayAppointments.slice(0, 3).map((apt) => {
                    const lead = leads.find((l) => l.id === apt.leadId);
                    return (
                      <div key={apt.id} className="bg-surface-container-lowest/50 rounded p-3 flex justify-between items-start border border-outline-variant/10">
                        <div>
                          <p className="text-sm font-medium text-on-surface">{lead?.fullName || "Lead"}</p>
                          <p className="text-xs text-on-surface-variant mt-1">
                            {new Date(apt.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {apt.duration}min • {apt.type.replace("_", " ")}
                          </p>
                        </div>
                        <span className="text-xs text-on-surface-variant capitalize">{apt.status}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
            <section className="bg-surface-variant/40 rounded-xl p-6 border border-tertiary-container/30 relative overflow-hidden backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-br from-tertiary-container/5 to-transparent pointer-events-none"></div>
              <div className="flex items-center gap-2 mb-4 relative z-10">
                <span className="material-symbols-outlined text-tertiary icon-fill">psychiatry</span>
                <h3 className="text-base font-bold text-on-surface">Emma AI Insights</h3>
              </div>
              <div className="space-y-4 relative z-10">
                {aiSuggestions.length === 0 && (
                  <p className="text-sm text-on-surface-variant">No suggestions at this time.</p>
                )}
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="bg-surface-container-lowest/60 rounded-lg p-4 border border-outline-variant/15">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-tertiary text-[18px] mt-0.5">lightbulb</span>
                      <div>
                        <p className="text-sm text-on-surface leading-relaxed">{s.message}</p>
                        <div className="mt-3 flex gap-2">
                          <Link href={`/leads/${s.leadId}`}>
                            <button className="text-xs bg-tertiary-container text-white px-3 py-1.5 rounded font-medium hover:bg-tertiary-container/90 transition-colors">View Lead</button>
                          </Link>
                          <button className="text-xs bg-transparent text-on-surface-variant hover:text-on-surface px-2 py-1.5 rounded transition-colors">Dismiss</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-surface-container rounded-xl p-6 relative overflow-hidden flex-1">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-amber-500 text-[20px]">today</span>
                <h3 className="text-base font-bold text-on-surface">Due Today</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-container-high transition-colors -mx-2">
                  <input className="mt-1 rounded border-outline bg-surface-container-lowest text-primary focus:ring-primary focus:ring-offset-surface" type="checkbox" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">Review hot leads queue</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{hotLeads.length} high-priority leads</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-container-high transition-colors -mx-2">
                  <input className="mt-1 rounded border-outline bg-surface-container-lowest text-primary focus:ring-primary focus:ring-offset-surface" type="checkbox" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">Follow up on overdue leads</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{overdueLeads.length} leads need attention</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 p-2 rounded-lg hover:bg-surface-container-high transition-colors -mx-2">
                  <input className="mt-1 rounded border-outline bg-surface-container-lowest text-primary focus:ring-primary focus:ring-offset-surface" type="checkbox" />
                  <div>
                    <p className="text-sm font-medium text-on-surface">Prepare for appointments</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{todayAppointments.length} scheduled today</p>
                  </div>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
