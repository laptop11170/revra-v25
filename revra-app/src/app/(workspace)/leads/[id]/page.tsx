"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useDataStore } from "@/lib/stores";
import { useAuthStore } from "@/lib/stores";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import Link from "next/link";

export default function LeadProfilePage() {
  const params = useParams();
  const leadId = params.id as string;
  const session = useAuthStore((s) => s.session);
  const leads = useDataStore((s) => s.leads);
  const stages = useDataStore((s) => s.stages);
  const activities = useDataStore((s) => s.activities);
  const appointments = useDataStore((s) => s.appointments);

  const lead = leads.find((l) => l.id === leadId);
  const stage = lead ? stages.find((s) => s.id === lead.pipeline.stageId) : null;

  const leadActivities = useMemo(() => {
    if (!lead) return [];
    return activities
      .filter((a) => a.leadId === lead.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [activities, lead]);

  const leadAppointments = useMemo(() => {
    if (!lead) return [];
    return appointments
      .filter((a) => a.leadId === lead.id)
      .sort((a, b) => b.scheduledAt - a.scheduledAt);
  }, [appointments, lead]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  const formatDateTime = (ts: number) => {
    return new Date(ts).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (!lead) {
    return (
      <SubPageLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <span className="material-symbols-outlined text-6xl text-outline mb-4">person_off</span>
            <p className="text-on-surface-variant font-medium">Lead not found</p>
            <Link href="/leads" className="text-primary hover:underline text-sm mt-2 inline-block">
              Back to Leads
            </Link>
          </div>
        </div>
      </SubPageLayout>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lead_created": return "person_add";
      case "lead_updated": return "edit";
      case "stage_changed": return "swap_horiz";
      case "note_added": return "note";
      case "call_completed": return "call";
      case "sms_sent": return "sms";
      case "sms_received": return "chat";
      case "email_sent": return "mail";
      case "appointment_booked": return "event";
      case "appointment_completed": return "check_circle";
      case "ai_summary": return "auto_awesome";
      default: return "info";
    }
  };

  return (
    <SubPageLayout>
      <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        <section className="flex flex-col gap-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-surface-container-high border-2 border-surface-container flex items-center justify-center">
                  <span className="text-2xl font-bold text-on-surface">{getInitials(lead.fullName)}</span>
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-tertiary-container rounded-full border-2 border-surface flex items-center justify-center" title="AI Assessed">
                  <span className="material-symbols-outlined text-[10px] text-on-tertiary-container icon-fill">auto_awesome</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">{lead.fullName}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="bg-primary-container/10 text-primary-container border border-primary-container/20 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                    {lead.score >= 80 ? "Hot Lead" : lead.score >= 60 ? "Warm Lead" : "Cold Lead"}
                  </span>
                  <span className="bg-surface-bright text-on-surface-variant px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                    {lead.coverageType}
                  </span>
                  <span className="text-sm text-on-surface-variant flex items-center gap-1 ml-2">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {lead.state || "Unknown Location"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/leads">
                <button className="bg-surface-container border border-outline-variant/20 hover:bg-surface-bright text-on-surface px-4 py-2 rounded flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back
                </button>
              </Link>
              <button className="bg-gradient-to-r from-tertiary-container to-[#6b21a8] hover:opacity-90 text-on-tertiary-container px-4 py-2 rounded flex items-center gap-2 font-medium transition-all shadow-[0_4px_14px_rgba(131,66,244,0.3)]">
                <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                Generate Quote
              </button>
            </div>
          </div>

          <div className="border-b border-outline-variant/15 flex gap-8">
            <button className="text-primary-container font-semibold border-b-2 border-primary-container pb-3 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">overview</span>
              Overview
            </button>
            <button className="text-on-surface-variant hover:text-on-surface pb-3 text-sm font-medium flex items-center gap-2 transition-colors">
              <span className="material-symbols-outlined text-[18px]">history</span>
              Activity Log
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-surface-container rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-surface-variant"></div>
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">badge</span>
                Identity & Contact
              </h3>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant mb-0.5">Phone</span>
                  <div className="flex items-center justify-between group">
                    <span className="text-sm font-medium text-on-surface">{lead.phonePrimary}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-primary-container hover:text-primary p-1 bg-surface-container-highest rounded" title="Call">
                        <span className="material-symbols-outlined text-[14px]">call</span>
                      </button>
                      <button className="text-primary-container hover:text-primary p-1 bg-surface-container-highest rounded" title="SMS">
                        <span className="material-symbols-outlined text-[14px]">chat</span>
                      </button>
                    </div>
                  </div>
                </div>
                {lead.phoneSecondary && (
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface-variant mb-0.5">Secondary Phone</span>
                    <span className="text-sm font-medium text-on-surface">{lead.phoneSecondary}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface-variant mb-0.5">Email</span>
                    <div className="flex items-center justify-between group">
                      <span className="text-sm font-medium text-on-surface truncate pr-2">{lead.email}</span>
                      <button className="text-primary-container hover:text-primary p-1 bg-surface-container-highest rounded opacity-0 group-hover:opacity-100 transition-opacity" title="Email">
                        <span className="material-symbols-outlined text-[14px]">mail</span>
                      </button>
                    </div>
                  </div>
                )}
                {lead.dateOfBirth && (
                  <div className="h-px w-full bg-outline-variant/10 my-1"></div>
                )}
                {lead.dateOfBirth && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-on-surface-variant mb-0.5">DOB</span>
                      <span className="text-sm font-medium text-on-surface">{formatDate(new Date(lead.dateOfBirth).getTime())}</span>
                    </div>
                    {lead.age && (
                      <div className="flex flex-col">
                        <span className="text-xs text-on-surface-variant mb-0.5">Age</span>
                        <span className="text-sm font-medium text-on-surface">{lead.age}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">shield_person</span>
                  Insurance Profile
                </h3>
                <button className="text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                </button>
              </div>
              {lead.currentCarrier && (
                <div className="bg-surface-container-lowest rounded-lg p-3 border border-outline-variant/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded bg-[#00529b] flex items-center justify-center text-white font-bold text-xs">UH</div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{lead.currentCarrier}</p>
                      <p className="text-xs text-on-surface-variant">Current Carrier</p>
                    </div>
                  </div>
                  {lead.policyRenewalDate && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant text-xs">Renewal Date</span>
                      <span className="font-medium text-error flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                        {formatDate(new Date(lead.policyRenewalDate).getTime())}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pipeline Stage</span>
                <span className="px-3 py-1.5 bg-surface-container-low rounded text-sm font-medium text-on-surface border-l-2" style={{ borderLeftColor: stage?.color || "#6b7280" }}>
                  {stage?.name || "Unknown"}
                </span>
              </div>
              {lead.tags.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {lead.tags.map((tag) => (
                      <span key={tag} className="bg-surface-bright text-on-surface text-xs px-2 py-1 rounded border border-outline-variant/10">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2 mb-2">
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest">Chronological Activity</h3>
              <div className="flex gap-2">
                <button className="text-xs font-medium text-on-surface-variant hover:text-on-surface bg-surface-container px-2 py-1 rounded flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">filter_list</span> Filter
                </button>
              </div>
            </div>

            <div className="relative pl-6 flex flex-col gap-6">
              <div className="absolute left-2.5 top-2 bottom-2 w-px bg-outline-variant/15"></div>

              {leadActivities.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="material-symbols-outlined text-5xl text-outline mb-4">history</span>
                  <p className="text-on-surface-variant font-medium">No activity recorded yet</p>
                </div>
              )}

              {leadActivities.map((activity, i) => (
                <div key={activity.id} className="relative flex flex-col gap-2 group">
                  <div className="absolute -left-6 w-5 h-5 rounded-full border-2 border-surface flex items-center justify-center z-10 bg-surface-container-high">
                    <span className="material-symbols-outlined text-[10px] text-on-surface-variant">{getActivityIcon(activity.type)}</span>
                  </div>

                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs font-bold text-on-surface-variant tracking-wide uppercase">{activity.title}</span>
                    <span className="text-xs text-on-surface-variant">{formatDateTime(activity.createdAt)}</span>
                  </div>
                  {activity.description && (
                    <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-lg p-3">
                      <p className="text-sm text-on-surface leading-relaxed">{activity.description}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col gap-6">
            <div className="bg-surface-container rounded-xl p-5 border border-tertiary-container/30 relative overflow-hidden flex flex-col gap-5">
              <div className="absolute inset-0 bg-gradient-to-br from-tertiary-container/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
              <div className="relative z-10 flex items-center justify-between">
                <h3 className="text-xs font-bold text-tertiary uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] icon-fill">neurology</span>
                  RevRa Intelligence
                </h3>
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-tertiary-container flex items-center justify-center bg-surface-container-lowest shadow-[0_0_15px_rgba(131,66,244,0.2)]">
                  <span className="text-2xl font-headline font-black text-on-surface">{lead.score}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-on-surface">
                    {lead.score >= 80 ? "High" : lead.score >= 60 ? "Medium" : "Low"} Propensity
                  </span>
                  <span className="text-xs text-on-surface-variant">Conversion Probability</span>
                </div>
              </div>
              <div className="relative z-10 mt-2 bg-surface-container-highest p-4 rounded-lg border border-outline-variant/15 shadow-lg">
                <span className="text-xs text-on-surface-variant font-medium block mb-2">Recommended Next Action</span>
                <p className="text-sm font-bold text-on-surface mb-3">Schedule a follow-up call to discuss {lead.coverageType} options</p>
                <button className="w-full bg-tertiary-container hover:bg-tertiary-container/90 text-on-tertiary-container py-2 rounded text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">bolt</span> Execute Action
                </button>
              </div>
            </div>

            <div className="bg-surface-container rounded-xl p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">calendar_month</span>
                  Upcoming
                </h3>
                <button className="text-primary-container hover:text-primary text-xs font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">add</span> Add
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {leadAppointments.length === 0 && (
                  <div className="text-center py-4 border border-dashed border-outline-variant/20 rounded-lg">
                    <span className="text-xs text-on-surface-variant">No upcoming appointments</span>
                  </div>
                )}
                {leadAppointments.slice(0, 2).map((apt) => (
                  <div key={apt.id} className="bg-surface-container-lowest p-3 rounded-lg border-l-2 border-primary-container flex flex-col gap-1 hover:bg-surface-bright transition-colors cursor-pointer">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-on-surface">{apt.title}</span>
                      <span className="bg-primary-container/10 text-primary-container text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">{apt.status}</span>
                    </div>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">schedule</span> {formatDateTime(apt.scheduledAt)}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1 capitalize">
                      <span className="material-symbols-outlined text-[14px]">{apt.type === "video" ? "videocam" : apt.type === "phone" ? "call" : "person"}</span> {apt.type.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
