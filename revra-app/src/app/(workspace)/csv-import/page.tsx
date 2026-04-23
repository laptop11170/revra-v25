"use client";

import { SubPageLayout } from "@/components/layout/SubPageLayout";
import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/stores";
import { useCreateLead } from "@/hooks/useLeads";
import type { Lead, CoverageType, LeadSource } from "@/types";

const REVRA_FIELDS = [
  { value: "", label: "-- Select Field --" },
  { value: "full_name", label: "Full Name" },
  { value: "phone_primary", label: "Primary Phone" },
  { value: "phone_secondary", label: "Secondary Phone" },
  { value: "email", label: "Email" },
  { value: "date_of_birth", label: "Date of Birth" },
  { value: "state", label: "State" },
  { value: "county", label: "County" },
  { value: "home_address", label: "Home Address" },
  { value: "coverage_type", label: "Coverage Type" },
  { value: "current_carrier", label: "Current Carrier" },
  { value: "policy_renewal_date", label: "Policy Renewal Date" },
  { value: "pre_existing_conditions", label: "Pre-existing Conditions" },
  { value: "monthly_budget", label: "Monthly Budget" },
  { value: "household_size", label: "Household Size" },
  { value: "dependents", label: "Dependents" },
  { value: "income_range", label: "Income Range" },
  { value: "lead_source", label: "Lead Source" },
  { value: "notes", label: "Notes" },
  { value: "ignore", label: "-- Ignore Column --" },
];

interface ColumnMapping {
  csvHeader: string;
  sampleValue: string;
  revraField: string;
  confidence: number;
  values: string[];
}

export default function CSVImportPage() {
  const session = useAuthStore((s) => s.session);
  const createLead = useCreateLead();
  const qc = useQueryClient();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawData, setRawData] = useState<string[][]>([]);
  const [columns, setColumns] = useState<ColumnMapping[]>([]);
  const [step, setStep] = useState<"upload" | "map" | "preview">("upload");
  const [imported, setImported] = useState(0);

  const parseCSV = (text: string): string[][] => {
    const lines = text.split(/\r?\n/);
    return lines.filter((l) => l.trim()).map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') { inQuotes = !inQuotes; }
        else if (c === "," && !inQuotes) { result.push(current.trim()); current = ""; }
        else { current += c; }
      }
      result.push(current.trim());
      return result;
    });
  };

  const guessField = (header: string): string => {
    const h = header.toLowerCase().replace(/[_\s-]/g, "");
    if (h.includes("name") && !h.includes("company")) return "full_name";
    if (h.includes("email")) return "email";
    if (h.includes("phone") && !h.includes("secondary") || h.includes("mobile")) return "phone_primary";
    if (h.includes("phone") && h.includes("secondary") || h.includes("phone2")) return "phone_secondary";
    if (h.includes("state") || h === "st") return "state";
    if (h.includes("county")) return "county";
    if (h.includes("address")) return "home_address";
    if (h.includes("coverage") || h.includes("product")) return "coverage_type";
    if (h.includes("carrier") || h.includes("insurance")) return "current_carrier";
    if (h.includes("dob") || h.includes("birth")) return "date_of_birth";
    if (h.includes("budget") || h.includes("premium")) return "monthly_budget";
    if (h.includes("household")) return "household_size";
    if (h.includes("dependent")) return "dependents";
    if (h.includes("income")) return "income_range";
    if (h.includes("renewal")) return "policy_renewal_date";
    if (h.includes("condition")) return "pre_existing_conditions";
    if (h.includes("source") || h.includes("campaign")) return "lead_source";
    if (h.includes("note")) return "notes";
    if (h.includes("id") || h.includes("temp") || h.includes("internal")) return "ignore";
    return "";
  };

  const guessConfidence = (revraField: string): number => {
    if (!revraField) return 0;
    if (revraField === "ignore") return 0;
    return 80;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setImported(0);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) return;
      const headers = rows[0];
      const dataRows = rows.slice(1);
      const mappedCols: ColumnMapping[] = headers.map((header, i) => {
        const vals = dataRows.map((r) => r[i] || "");
        const sample = vals.find((v) => v.trim()) || "";
        const revraField = guessField(header);
        return { csvHeader: header, sampleValue: sample, revraField, confidence: guessConfidence(revraField), values: vals };
      });
      setRawData(dataRows);
      setColumns(mappedCols);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const handleFieldChange = (index: number, field: string) => {
    const updated = [...columns];
    updated[index] = { ...updated[index], revraField: field };
    setColumns(updated);
  };

  const handleImport = async () => {
    if (!session) return;
    let count = 0;
    const validCoverage = ["ACA", "Medicare", "Final Expense", "Life", "Group Health"];
    for (const row of rawData) {
      const leadData: Record<string, string | number | undefined> = {};
      columns.forEach((col, i) => {
        if (!col.revraField || col.revraField === "ignore") return;
        leadData[col.revraField] = row[i] || "";
      });
      if (!leadData.full_name || !leadData.phone_primary) continue;
      try {
        await createLead.mutateAsync({
          assignedAgentId: session.userId,
          fullName: String(leadData.full_name),
          phonePrimary: String(leadData.phone_primary),
          phoneSecondary: leadData.phone_secondary ? String(leadData.phone_secondary) : undefined,
          email: leadData.email ? String(leadData.email) : undefined,
          dateOfBirth: leadData.date_of_birth ? String(leadData.date_of_birth) : undefined,
          state: leadData.state ? String(leadData.state) : "",
          county: leadData.county ? String(leadData.county) : undefined,
          homeAddress: leadData.home_address ? String(leadData.home_address) : undefined,
          coverageType: validCoverage.includes(String(leadData.coverage_type)) ? String(leadData.coverage_type) as CoverageType : "ACA",
          currentCarrier: leadData.current_carrier ? String(leadData.current_carrier) : undefined,
          policyRenewalDate: leadData.policy_renewal_date ? String(leadData.policy_renewal_date) : undefined,
          preExistingConditions: leadData.pre_existing_conditions ? String(leadData.pre_existing_conditions) : undefined,
          monthlyBudget: leadData.monthly_budget ? Number(leadData.monthly_budget) : undefined,
          householdSize: leadData.household_size ? Number(leadData.household_size) : undefined,
          dependents: leadData.dependents ? Number(leadData.dependents) : undefined,
          incomeRange: leadData.income_range ? String(leadData.income_range) : undefined,
          score: 50,
          source: "csv_import" as LeadSource,
          exclusivity: "exclusive",
          outcome: "pending",
          tags: [],
          pipeline: { stageId: "stage-1", enteredStageAt: Date.now() },
          notes: leadData.notes ? String(leadData.notes) : undefined,
        });
        count++;
      } catch {
        // Skip failed rows silently
      }
    }
    setImported(count);
    setStep("preview");
  };

  const handleReset = () => {
    setStep("upload");
    setFileName(null);
    setColumns([]);
    setRawData([]);
    setImported(0);
  };

  const confidentCount = columns.filter((c) => c.confidence >= 80).length;
  const mappedCount = columns.filter((c) => c.revraField && c.revraField !== "ignore").length;

  return (
    <SubPageLayout>
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto bg-surface p-6 md:p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-on-surface mb-2">
                  {step === "upload" ? "Import CSV" : step === "map" ? "Map Columns to RevRa Fields" : "Preview Import"}
                </h2>
                <p className="text-on-surface-variant text-sm max-w-2xl leading-relaxed">
                  {step === "upload"
                    ? "Upload a CSV file to import leads into your workspace. The file should contain contact information and lead details."
                    : "We've analyzed your CSV and attempted to automatically map the columns to standard RevRa fields."}
                </p>
              </div>
              {step === "map" && (
                <div className="bg-surface-container-low border border-tertiary/20 rounded-lg p-4 flex items-center gap-4 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                    <span className={`material-symbols-outlined icon-fill ${isAnalyzing ? "animate-spin" : ""}`}>auto_awesome</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-1">AI Analysis</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-on-surface">{confidentCount}/{columns.length}</span>
                      <span className="text-sm text-on-surface-variant">columns mapped</span>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (isAnalyzing) return;
                      setIsAnalyzing(true);
                      try {
                        const res = await fetch("/api/ai/csv-mapping", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({
                            columns: columns.map((c) => ({ header: c.csvHeader, sample: c.sampleValue })),
                          }),
                        });
                        if (res.ok) {
                          const { data } = await res.json();
                          if (data.mappings) {
                            const updated = columns.map((col) => {
                              const aiMap = data.mappings.find((m: any) => m.csv_header === col.csvHeader);
                              return aiMap ? { ...col, revraField: aiMap.revra_field, confidence: Math.round((aiMap.confidence || 0.5) * 100) } : col;
                            });
                            setColumns(updated);
                          }
                        }
                      } catch {}
                      setIsAnalyzing(false);
                    }}
                    disabled={isAnalyzing}
                    className="px-4 py-2 rounded-lg bg-tertiary-container text-tertiary text-xs font-bold hover:bg-tertiary-container/80 transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    {isAnalyzing ? "Analyzing..." : "Enhance with AI"}
                  </button>
                </div>
              )}
            </div>

            {step === "upload" && (
              <div className="flex flex-col items-center justify-center py-16">
                <label className="w-full max-w-lg cursor-pointer">
                  <div className="border-2 border-dashed border-outline-variant/50 rounded-xl p-12 flex flex-col items-center justify-center hover:border-primary/50 hover:bg-primary-container/5 transition-all">
                    <span className="material-symbols-outlined text-5xl text-outline mb-4">upload_file</span>
                    <p className="text-on-surface font-medium mb-2">Drop your CSV file here or click to browse</p>
                    <p className="text-sm text-on-surface-variant">Supports .csv files up to 10MB</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                </label>
              </div>
            )}

            {step === "map" && (
              <>
                <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/15 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-surface-container-low border-b border-outline-variant/15 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    <div className="col-span-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">description</span>
                      CSV Column Header
                    </div>
                    <div className="col-span-1 flex items-center justify-center"></div>
                    <div className="col-span-5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">database</span>
                      RevRa Field
                    </div>
                    <div className="col-span-2 text-right">Match Confidence</div>
                  </div>

                  <div className="divide-y divide-outline-variant/10">
                    {columns.map((col, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-12 gap-4 px-6 py-4 items-center bg-surface-container-lowest hover:bg-surface-container-low/50 transition-colors group ${
                          col.confidence >= 80 ? "" : col.confidence >= 50 ? "border-l-2 border-tertiary" : col.revraField ? "" : "border-l-2 border-error/50"
                        }`}
                      >
                        <div className="col-span-4 flex flex-col">
                          <span className="font-medium text-on-surface">{col.csvHeader}</span>
                          <span className="text-xs text-on-surface-variant mt-1 font-mono bg-surface-container px-2 py-0.5 rounded w-fit">e.g. &quot;{col.sampleValue}&quot;</span>
                        </div>
                        <div className="col-span-1 flex items-center justify-center text-outline">
                          <span className="material-symbols-outlined">{col.revraField === "ignore" ? "close" : "arrow_right_alt"}</span>
                        </div>
                        <div className="col-span-5">
                          <div className="relative">
                            <select
                              className={`w-full bg-surface-container border text-on-surface text-sm rounded px-3 py-2 pr-8 font-medium appearance-none focus:outline-none ${
                                col.confidence >= 80
                                  ? "border-outline-variant/30 focus:ring-1 focus:ring-primary focus:border-primary"
                                  : "border-tertiary/40 focus:ring-1 focus:ring-tertiary focus:border-tertiary shadow-[0_0_10px_rgba(131,66,244,0.1)]"
                              }`}
                              value={col.revraField}
                              onChange={(e) => handleFieldChange(i, e.target.value)}
                            >
                              {REVRA_FIELDS.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-on-surface-variant">
                              <span className="material-symbols-outlined text-[18px]">expand_more</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-end gap-2">
                          {col.revraField && col.revraField !== "ignore" ? (
                            <>
                              <span className={`text-sm font-semibold ${col.confidence >= 80 ? "text-secondary" : "text-tertiary"}`}>{col.confidence}%</span>
                              <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${col.confidence >= 80 ? "bg-secondary" : "bg-tertiary"}`}
                                  style={{ width: `${col.confidence}%` }}
                                ></div>
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Skipped</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-outline-variant/15 mt-8">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => { setStep("upload"); setColumns([]); setRawData([]); setFileName(null); }}
                      className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Upload Different File
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-on-surface-variant">{mappedCount} of {columns.length} columns mapped</span>
                    <button
                      onClick={() => setStep("preview")}
                      className="bg-primary-container text-on-primary-container hover:bg-primary-container/90 px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-[0_4px_14px_rgba(45,91,255,0.25)]"
                    >
                      Continue to Preview
                    </button>
                  </div>
                </div>
              </>
            )}

            {step === "preview" && (
              <div className="text-center py-16">
                {imported > 0 ? (
                  <>
                    <span className="material-symbols-outlined text-6xl text-emerald-400 mb-4">check_circle</span>
                    <h3 className="text-xl font-bold text-on-surface mb-2">Import Complete</h3>
                    <p className="text-on-surface-variant mb-2">{imported} leads successfully imported into your workspace.</p>
                    <p className="text-xs text-on-surface-variant mb-8">Check the Leads page to review imported records.</p>
                    <button onClick={handleReset} className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-container/90 text-sm font-semibold transition-colors shadow-[0_4px_14px_rgba(45,91,255,0.25)]">Import More</button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-6xl text-tertiary mb-4">check_circle</span>
                    <h3 className="text-xl font-bold text-on-surface mb-2">Ready to Import</h3>
                    <p className="text-on-surface-variant mb-2">{rawData.length} rows ready to import as leads.</p>
                    <p className="text-xs text-on-surface-variant mb-8">Mapped fields: {columns.filter((c) => c.revraField && c.revraField !== "ignore").length}</p>
                    <div className="flex justify-center gap-4">
                      <button onClick={() => setStep("map")} className="px-6 py-2.5 rounded-lg border border-outline-variant/30 text-sm font-medium text-on-surface hover:bg-surface-container transition-colors">Back to Mapping</button>
                      <button onClick={handleImport} className="px-6 py-2.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary-container/90 text-sm font-semibold transition-colors shadow-[0_4px_14px_rgba(45,91,255,0.25)]">Import Now</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </SubPageLayout>
  );
}
