"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useAuthStore } from "@/lib/stores";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAppointments } from "@/hooks/useWorkspace";
import { useLeads } from "@/hooks/useLeads";
import { useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from "@/hooks/useAppointments";

function getToken() {
  if (typeof window === "undefined") return "";
  const match = document.cookie.match(/sb-access-token=([^;]+)/);
  return match ? match[1] : "";
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const session = useAuthStore((s) => s.session);
  const { data: appointments = [] } = useAppointments();
  const { data: allLeads = [] } = useLeads();
  const createApt = useCreateAppointment();
  const updateApt = useUpdateAppointment();
  const deleteApt = useDeleteAppointment();
  const qc = useQueryClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [showBookModal, setShowBookModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [aptLeadId, setAptLeadId] = useState("");
  const [preCallBrief, setPreCallBrief] = useState<any>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [aptTitle, setAptTitle] = useState("");
  const [aptType, setAptType] = useState<string>("phone");
  const [aptDate, setAptDate] = useState("");
  const [aptTime, setAptTime] = useState("");
  const [aptDuration, setAptDuration] = useState(30);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map appointments to include lead info
  const leadMap = useMemo(() => {
    const map = new Map<string, any>();
    allLeads.forEach((l: any) => map.set(l.id, l));
    return map;
  }, [allLeads]);

  const myAppointments = appointments.filter((a: any) => a.agent_id === session?.userId);

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    return d;
  };

  const getWeekDays = (start: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const weekStart = getWeekStart(currentDate);
  const weekDays = getWeekDays(weekStart);
  const weekLabel = `${MONTHS[weekStart.getMonth()]} ${weekStart.getDate()} - ${MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`;

  const getAppointmentsForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = dayStart.getTime() + 86400000;
    return myAppointments.filter((a: any) => {
      const aTime = new Date(a.scheduled_at).getTime();
      return aTime >= dayStart.getTime() && aTime < dayEnd;
    });
  };

  const todayAppointments = getAppointmentsForDay(today);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const goToday = () => setCurrentDate(new Date());

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const getTypeIcon = (type: string) => type === "video" ? "videocam" : type === "phone" ? "call" : "person";
  const getInitials = (name: string) => name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const handleBookAppointment = () => {
    if (!aptLeadId || !aptTitle || !aptDate || !aptTime || !session) return;
    createApt.mutate({
      leadId: aptLeadId,
      title: aptTitle,
      type: aptType,
      scheduledAt: new Date(`${aptDate}T${aptTime}`).toISOString(),
      durationMinutes: aptDuration,
    });
    setShowBookModal(false);
    setAptLeadId(""); setAptTitle(""); setAptDate(""); setAptTime("");
    setAptDuration(30);
  };

  const handleUpdateStatus = (status: string) => {
    if (!selectedApt) return;
    updateApt.mutate({ id: selectedApt.id, status });
    setSelectedApt({ ...selectedApt, status });
  };

  const handleDeleteApt = () => {
    if (!selectedApt) return;
    deleteApt.mutate(selectedApt.id);
    setShowDetailModal(false);
    setSelectedApt(null);
  };

  return (
    <SubPageLayout>
      <div className="w-full h-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Appointments</h1>
            <p className="text-on-surface-variant text-sm mt-1">Manage your schedule and prepare for upcoming engagements.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-surface-container-low rounded p-1 border border-outline-variant/15">
              <button onClick={() => setView("day")} className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-sm ${view === "day" ? "bg-surface-variant text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>Day</button>
              <button onClick={() => setView("week")} className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-sm ${view === "week" ? "bg-surface-variant text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>Week</button>
              <button onClick={() => setView("month")} className={`px-3 py-1.5 text-sm font-medium transition-colors rounded-sm ${view === "month" ? "bg-surface-variant text-on-surface shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`}>Month</button>
            </div>
            <button onClick={() => setShowBookModal(true)} className="bg-primary-container text-on-primary-container rounded py-2 px-5 font-semibold text-sm hover:bg-primary-container/90 transition-colors shadow-lg shadow-primary-container/20">
              Book Appointment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
          <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
            <div className="bg-surface-container-low rounded-xl flex flex-col overflow-hidden relative">
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15 bg-surface-container-high/50">
                <div className="flex items-center gap-4 text-on-surface">
                  <button onClick={prevWeek} className="p-1 hover:bg-surface-variant rounded-full transition-colors"><span className="material-symbols-outlined text-sm">chevron_left</span></button>
                  <h2 className="font-semibold text-sm">{weekLabel}</h2>
                  <button onClick={nextWeek} className="p-1 hover:bg-surface-variant rounded-full transition-colors"><span className="material-symbols-outlined text-sm">chevron_right</span></button>
                  <button onClick={goToday} className="text-xs text-primary hover:text-primary-container px-2 py-1 rounded hover:bg-primary-container/10 transition-colors ml-2">Today</button>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-7 gap-px bg-outline-variant/15 p-px">
                {weekDays.map((day, i) => (
                  <div key={i} className={`bg-surface-container-low p-2 text-center flex flex-col gap-1 ${isToday(day) ? "bg-surface-variant border-t-2 border-primary-container" : ""}`}>
                    <span className={`text-xs uppercase tracking-wider font-semibold ${isToday(day) ? "text-primary" : "text-on-surface-variant"}`}>{DAYS[i]}</span>
                    <span className={`text-sm ${isToday(day) ? "font-bold text-primary" : ""}`}>{day.getDate()}</span>
                  </div>
                ))}
                {weekDays.map((day, dayIndex) => {
                  const dayAppts = getAppointmentsForDay(day);
                  return (
                    <div key={`content-${dayIndex}`} className={`bg-surface-container-low min-h-[120px] p-2 flex flex-col gap-2 ${isToday(day) ? "relative bg-primary-container/5" : ""}`}>
                      {dayAppts.map((apt: any) => {
                        const lead = leadMap.get(apt.lead_id);
                        return (
                          <button
                            key={apt.id}
                            onClick={() => { setSelectedApt(apt); setShowDetailModal(true); }}
                            className={`w-full text-left bg-surface-container-highest shadow-lg text-xs p-2 rounded border-l-2 cursor-pointer hover:shadow-md transition-shadow overflow-hidden ${isToday(day) ? "border-primary-container text-on-surface" : "border-outline-variant text-on-surface-variant"}`}
                          >
                            <div className="font-semibold mb-0.5 truncate">{lead?.fullName || "Lead"}</div>
                            <div className="text-[10px] opacity-80 truncate">{formatTime(apt.scheduled_at)}</div>
                            <div className="flex items-center gap-1 mt-1 opacity-60">
                              <span className="material-symbols-outlined text-[10px]">{getTypeIcon(apt.type)}</span>
                              <span className="capitalize">{apt.type}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>

            {todayAppointments.length > 0 && (
              <div className="bg-surface-container rounded-xl flex-1 relative overflow-hidden shadow-2xl shadow-background/80 group">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-tertiary-container/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-container via-tertiary-container to-surface-variant"></div>
                <div className="p-6 h-full flex flex-col relative z-10">
                  <div className="flex items-start justify-between mb-6 border-b border-outline-variant/15 pb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0">
                        <span className="material-symbols-outlined text-on-surface-variant text-xl">event</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-xl font-bold text-on-surface">Today&apos;s Schedule</h2>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase text-white ${todayAppointments[0]?.status === "confirmed" ? "bg-emerald-500" : "bg-amber-500"}`}>
                            {todayAppointments[0]?.status || "scheduled"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-on-surface-variant">
                          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">schedule</span> {todayAppointments.length} appointment{todayAppointments.length !== 1 ? "s" : ""} today</div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (todayAppointments.length === 0 || isGeneratingBrief) return;
                        const lead = leadMap.get(todayAppointments[0]?.lead_id);
                        if (!lead) return;
                        setIsGeneratingBrief(true);
                        try {
                          const res = await fetch("/api/ai/pre-call-brief", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                            credentials: "include",
                            body: JSON.stringify({ leadId: lead.id }),
                          });
                          if (res.ok) {
                            const { data } = await res.json();
                            setPreCallBrief(data.briefing);
                          }
                        } catch {}
                        setIsGeneratingBrief(false);
                      }}
                      className="bg-tertiary-container/10 text-tertiary border border-tertiary/20 px-3 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase flex items-center gap-2 shadow-[0_0_15px_rgba(210,187,255,0.1)] hover:bg-tertiary-container/20 transition-colors cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-sm icon-fill ${isGeneratingBrief ? "animate-spin" : ""}`}>auto_awesome</span>
                      {isGeneratingBrief ? "Generating..." : "AI Prep Brief"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-8 flex-1">
                    <div className="flex flex-col gap-6">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-[14px]">subject</span> Today&apos;s Appointments</h3>
                        <div className="space-y-2">
                          {todayAppointments.slice(0, 3).map((apt: any) => {
                            const lead = leadMap.get(apt.lead_id);
                            return (
                              <div key={apt.id} className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/10 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary font-bold text-xs">{lead ? getInitials(lead.fullName) : "?"}</div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium text-on-surface">{lead?.fullName || "Lead"}</div>
                                  <div className="text-xs text-on-surface-variant">{formatTime(apt.scheduled_at)} &bull; {apt.duration}m</div>
                                </div>
                                <span className="material-symbols-outlined text-sm text-on-surface-variant">{getTypeIcon(apt.type)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="bg-surface-container-lowest rounded-lg p-5 border border-tertiary/10 relative">
                      <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-tertiary/5 to-transparent pointer-events-none rounded-lg"></div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-tertiary mb-4 flex items-center gap-2 relative z-10">
                        <span className="material-symbols-outlined text-[14px] icon-fill">auto_awesome</span> AI Pre-Call Brief
                      </h3>
                      {preCallBrief ? (
                        <div className="space-y-4 relative z-10">
                          {preCallBrief.talking_points && preCallBrief.talking_points.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-tertiary/70 mb-2">Talking Points</div>
                              <ul className="space-y-2">
                                {preCallBrief.talking_points.map((point: string, i: number) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-tertiary-container/30 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="material-symbols-outlined text-[10px] text-tertiary">check</span>
                                    </div>
                                    <span className="text-sm text-on-surface">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {preCallBrief.recommended_outcome && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-tertiary/70 mb-2">Recommended Outcome</div>
                              <div className="text-sm text-on-surface bg-tertiary-container/10 rounded px-3 py-2 border border-tertiary/10">{preCallBrief.recommended_outcome}</div>
                            </div>
                          )}
                          {preCallBrief.notes && (
                            <div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-tertiary/70 mb-2">Notes</div>
                              <div className="text-sm text-on-surface">{preCallBrief.notes}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <ul className="space-y-3 relative z-10">
                          <li className="flex items-start gap-3 group"><div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5 border border-outline-variant/30"><span className="material-symbols-outlined text-[12px] text-on-surface-variant">check</span></div><span className="text-sm text-on-surface">Review lead notes before each call</span></li>
                          <li className="flex items-start gap-3 group"><div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5 border border-outline-variant/30"><span className="material-symbols-outlined text-[12px] text-on-surface-variant">check</span></div><span className="text-sm text-on-surface">Check coverage type before recommending</span></li>
                          <li className="flex items-start gap-3 group"><div className="w-5 h-5 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5 border border-outline-variant/30"><span className="material-symbols-outlined text-[12px] text-on-surface-variant">check</span></div><span className="text-sm text-on-surface">Send follow-up SMS within 15 minutes</span></li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col">
            <div className="bg-surface-container-low rounded-xl p-5 h-full flex flex-col border border-outline-variant/5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Upcoming Today</h2>
                <span className="bg-surface-variant text-on-surface text-xs px-2 py-1 rounded font-medium">{todayAppointments.length} Events</span>
              </div>
              <div className="flex flex-col gap-3 overflow-y-auto pr-2">
                {todayAppointments.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline mb-3">event_available</span>
                    <p className="text-sm text-on-surface-variant">No appointments today</p>
                  </div>
                )}
                {todayAppointments.map((apt: any, i: number) => {
                  const lead = leadMap.get(apt.lead_id);
                  const isPast = new Date(apt.scheduled_at).getTime() + apt.duration * 60000 < Date.now();
                  return (
                    <div
                      key={apt.id}
                      className={`p-3 rounded-lg flex items-start gap-4 ${isPast ? "opacity-50 bg-surface-container-lowest" : i === 0 ? "bg-surface-container-highest border-l-2 border-primary-container shadow-md relative overflow-hidden cursor-pointer" : "bg-surface-container hover:bg-surface-variant transition-colors cursor-pointer border border-transparent hover:border-outline-variant/20"}`}
                    >
                      {i === 0 && <div className="absolute top-0 right-0 w-16 h-16 bg-primary-container/5 rounded-bl-full pointer-events-none"></div>}
                      <div className="flex flex-col items-end gap-1 w-12 pt-0.5 shrink-0">
                        <div className={`text-xs ${i === 0 ? "font-bold text-primary" : isPast ? "" : "font-medium text-on-surface"}`}>{formatTime(apt.scheduled_at)}</div>
                        {isPast && <div className="text-[10px] text-on-surface-variant line-through">Completed</div>}
                      </div>
                      {i === 0 && !isPast && (
                        <>
                          <div className="relative mt-1.5 shrink-0"><div className="w-2 h-2 rounded-full bg-primary-container"></div><div className="w-2 h-2 rounded-full bg-primary-container absolute top-0 left-0 animate-ping opacity-75"></div></div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-on-surface">{lead?.fullName || "Lead"}</div>
                            <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">{getTypeIcon(apt.type)}</span> {apt.type} &bull; {apt.duration}m</div>
                            <div className="mt-2 inline-flex items-center gap-1 bg-tertiary-container/10 text-tertiary text-[10px] px-1.5 py-0.5 rounded font-medium border border-tertiary/20"><span className="material-symbols-outlined text-[10px]">auto_awesome</span> Prep Brief Ready</div>
                          </div>
                        </>
                      )}
                      {!isPast && i !== 0 && (
                        <><div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-outline-variant"></div><div className="flex-1"><div className="text-sm font-medium text-on-surface">{lead?.fullName || "Lead"}</div><div className="text-xs text-on-surface-variant mt-1 flex items-center gap-1.5"><span className="material-symbols-outlined text-[12px]">{getTypeIcon(apt.type)}</span> {apt.type}</div></div></>
                      )}
                      {isPast && (
                        <><div className="w-2 h-2 rounded-full mt-1.5 shrink-0 bg-outline-variant"></div><div className="flex-1"><div className="text-sm font-medium text-on-surface">{lead?.fullName || "Lead"}</div><div className="text-xs text-on-surface-variant mt-1">Completed</div></div></>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowBookModal(false)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Book Appointment</h3>
              <button onClick={() => setShowBookModal(false)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Select Lead</label>
                <select value={aptLeadId} onChange={(e) => setAptLeadId(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary">
                  <option value="">Choose a lead...</option>
                  {allLeads.map((l: any) => <option key={l.id} value={l.id}>{l.fullName} ({l.phonePrimary})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Title</label>
                <input type="text" value={aptTitle} onChange={(e) => setAptTitle(e.target.value)} placeholder="e.g. Discovery Call" className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Type</label>
                <div className="flex gap-2">
                  {(["phone", "video", "in_person"] as const).map((t) => (
                    <button key={t} onClick={() => setAptType(t)} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${aptType === t ? "bg-primary-container border-primary-container text-on-primary-container" : "border-outline-variant/30 text-on-surface hover:bg-surface-container"}`}>{t === "phone" ? "Phone" : t === "video" ? "Video" : "In Person"}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Date</label>
                  <input type="date" value={aptDate} onChange={(e) => setAptDate(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Time</label>
                  <input type="time" value={aptTime} onChange={(e) => setAptTime(e.target.value)} className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant mb-1.5">Duration</label>
                <div className="flex gap-2">
                  {([15, 30, 45, 60] as const).map((d) => (
                    <button key={d} onClick={() => setAptDuration(d)} className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${aptDuration === d ? "bg-primary-container border-primary-container text-on-primary-container" : "border-outline-variant/30 text-on-surface hover:bg-surface-container"}`}>{d}m</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowBookModal(false)} className="flex-1 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Cancel</button>
              <button onClick={handleBookAppointment} disabled={!aptLeadId || !aptTitle || !aptDate || !aptTime || createApt.isPending} className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors disabled:opacity-40">Book</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedApt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100]" onClick={() => setShowDetailModal(false)}>
          <div className="bg-surface-container-highest rounded-2xl p-6 w-full max-w-md shadow-2xl border border-outline-variant/20" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-on-surface">Appointment Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="p-1 rounded hover:bg-surface-container text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="space-y-3">
              <div className="bg-surface-container rounded-lg p-4">
                <p className="text-sm font-bold text-on-surface mb-1">{selectedApt.title}</p>
                <p className="text-xs text-on-surface-variant">with {leadMap.get(selectedApt.lead_id)?.fullName || "Unknown"}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-xs text-on-surface-variant block mb-0.5">Date</span><span className="font-medium text-on-surface">{new Date(selectedApt.scheduled_at).toLocaleDateString()}</span></div>
                <div><span className="text-xs text-on-surface-variant block mb-0.5">Time</span><span className="font-medium text-on-surface">{formatTime(selectedApt.scheduled_at)}</span></div>
                <div><span className="text-xs text-on-surface-variant block mb-0.5">Type</span><span className="font-medium text-on-surface capitalize">{selectedApt.type}</span></div>
                <div><span className="text-xs text-on-surface-variant block mb-0.5">Duration</span><span className="font-medium text-on-surface">{selectedApt.duration}m</span></div>
              </div>
              <div>
                <span className="text-xs text-on-surface-variant block mb-1.5">Status</span>
                <div className="flex gap-2 flex-wrap">
                  {(["pending", "confirmed", "completed", "no_show", "cancelled"] as const).map((s) => (
                    <button key={s} onClick={() => handleUpdateStatus(s)} className={`px-3 py-1.5 rounded text-xs font-medium border capitalize transition-colors ${selectedApt.status === s ? "bg-primary-container border-primary-container text-on-primary-container" : "border-outline-variant/30 text-on-surface hover:bg-surface-container"}`}>{s}</button>
                  ))}
                </div>
              </div>
              {selectedApt.notes && <div><span className="text-xs text-on-surface-variant block mb-0.5">Notes</span><p className="text-sm text-on-surface">{selectedApt.notes}</p></div>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleDeleteApt} className="py-2.5 px-4 rounded-lg border border-error/30 text-error text-sm font-medium hover:bg-error/10 transition-colors">Delete</button>
              <Link href={`/leads/${selectedApt.lead_id}`} className="flex-1">
                <button className="w-full py-2.5 rounded-lg bg-primary-container text-on-primary-container text-sm font-bold hover:bg-primary-container/90 transition-colors">View Lead</button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </SubPageLayout>
  );
}