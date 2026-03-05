"use client";

import { useState, useMemo, useEffect } from "react";
import { usePolicyStore, useAllFrameworks, useAllComplianceRules } from "@/store/policyStore";
import { useToast } from "@/components/ui/Toast";
import { BUILT_IN_FRAMEWORKS } from "@/lib/complianceData";
import { getSeverityStyles } from "@/lib/complianceData";
import { X, Folder, Tag, FileText, ChevronDown, ShieldCheck, Check } from "lucide-react";
import type { ComplianceRule, ComplianceAssignmentLevel } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-select a single rule to assign */
  preSelectedRule?: ComplianceRule | null;
  /** Pre-select a whole framework to bulk-assign */
  preSelectedFrameworkId?: string | null;
}

export function ComplianceAssignmentModal({
  open,
  onClose,
  preSelectedRule,
  preSelectedFrameworkId,
}: Props) {
  const { policies, folders, complianceAssignments, addComplianceAssignment, bulkAssignFramework } = usePolicyStore();
  const frameworks = useAllFrameworks();
  const allRules = useAllComplianceRules();
  const { toast } = useToast();

  const [level, setLevel] = useState<ComplianceAssignmentLevel>("folder");
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [mode, setMode] = useState<"rule" | "framework">(preSelectedFrameworkId ? "framework" : "rule");
  const [selectedRuleId, setSelectedRuleId] = useState(preSelectedRule?.id || "");
  const [selectedFrameworkId, setSelectedFrameworkId] = useState(preSelectedFrameworkId || "");

  /* ── Sync state when the modal opens / props change ── */
  useEffect(() => {
    if (open) {
      setMode(preSelectedFrameworkId ? "framework" : preSelectedRule ? "rule" : "rule");
      setSelectedRuleId(preSelectedRule?.id || "");
      setSelectedFrameworkId(preSelectedFrameworkId || "");
      setSelectedTargetId("");
      setLevel("folder");
    }
  }, [open, preSelectedRule, preSelectedFrameworkId]);

  // Get all unique tags from policies
  const allTags = useMemo(() => {
    const tagMap = new Map<string, string>();
    policies.forEach((p) => p.tags.forEach((t) => tagMap.set(t.name, t.color)));
    return Array.from(tagMap.entries()).map(([name, color]) => ({ name, color }));
  }, [policies]);

  if (!open) return null;

  const targets = level === "folder"
    ? folders.map((f) => ({ id: f.id, label: f.name, icon: Folder, color: f.color }))
    : level === "tag"
    ? allTags.map((t) => ({ id: t.name, label: t.name, icon: Tag, color: t.color }))
    : policies.map((p) => ({ id: p.id, label: p.title, icon: FileText, color: "" }));

  const handleAssign = () => {
    if (!selectedTargetId) {
      toast({ title: "Error", description: "Please select a target", variant: "error" });
      return;
    }

    if (mode === "framework") {
      if (!selectedFrameworkId) {
        toast({ title: "Error", description: "Please select a framework", variant: "error" });
        return;
      }
      bulkAssignFramework(selectedFrameworkId, level, selectedTargetId);
      const fw = frameworks.find((f) => f.id === selectedFrameworkId);
      const targetLabel = targets.find((t) => t.id === selectedTargetId)?.label || selectedTargetId;
      toast({
        title: "Framework Assigned",
        description: `All ${fw?.shortName} rules assigned to ${level}: "${targetLabel}"`,
        variant: "success",
      });
    } else {
      if (!selectedRuleId) {
        toast({ title: "Error", description: "Please select a rule", variant: "error" });
        return;
      }
      addComplianceAssignment(selectedRuleId, level, selectedTargetId);
      const rule = allRules.find((r) => r.id === selectedRuleId);
      const targetLabel = targets.find((t) => t.id === selectedTargetId)?.label || selectedTargetId;
      toast({
        title: "Rule Assigned",
        description: `"${rule?.title}" assigned to ${level}: "${targetLabel}"`,
        variant: "success",
      });
    }
    onClose();
  };

  // Check if assignment already exists
  const alreadyAssigned = mode === "rule" && selectedRuleId && selectedTargetId
    ? complianceAssignments.some((a) => a.ruleId === selectedRuleId && a.level === level && a.targetId === selectedTargetId)
    : false;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">Assign Compliance</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Mode toggle */}
          {!preSelectedRule && !preSelectedFrameworkId && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Assign</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("rule")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    mode === "rule"
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                      : "border-white/[0.06] text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Single Rule
                </button>
                <button
                  type="button"
                  onClick={() => setMode("framework")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                    mode === "framework"
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-400"
                      : "border-white/[0.06] text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  Entire Framework
                </button>
              </div>
            </div>
          )}

          {/* Rule / Framework selection */}
          {mode === "rule" && !preSelectedRule && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Rule</label>
              <select
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="">Select a rule…</option>
                {frameworks.map((fw) => {
                  const fwRules = allRules.filter((r) => r.frameworkId === fw.id);
                  if (fwRules.length === 0) return null;
                  return (
                    <optgroup key={fw.id} label={fw.shortName}>
                      {fwRules.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.section ? `[${r.section}] ` : ""}{r.title}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
          )}

          {preSelectedRule && (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <p className="text-xs text-zinc-500">Assigning rule:</p>
              <p className="mt-0.5 text-sm font-medium text-white">{preSelectedRule.title}</p>
              {preSelectedRule.section && (
                <p className="text-xs text-zinc-500">{preSelectedRule.section}</p>
              )}
            </div>
          )}

          {/* Pre-selected framework info — shows all rules being bulk-assigned */}
          {mode === "framework" && preSelectedFrameworkId && (() => {
            const fw = frameworks.find((f) => f.id === preSelectedFrameworkId);
            const fwRules = allRules.filter((r) => r.frameworkId === preSelectedFrameworkId);
            if (!fw) return null;
            return (
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
                <p className="text-xs text-zinc-500">Assigning all rules from:</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{fw.shortName} — {fw.name}</p>
                <p className="mt-1 text-[10px] font-medium text-violet-400">{fwRules.length} rules will be assigned</p>
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {fwRules.map((rule) => {
                    const sevStyle = getSeverityStyles(rule.severity);
                    return (
                      <div key={rule.id} className="flex items-center gap-2 rounded-md bg-zinc-800/40 px-2 py-1.5">
                        <Check className="h-3 w-3 text-violet-400 shrink-0" />
                        <span className="text-xs text-zinc-300 flex-1 truncate">{rule.title}</span>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[8px] font-medium ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}>
                          {rule.severity}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {mode === "framework" && !preSelectedFrameworkId && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Framework</label>
              <select
                value={selectedFrameworkId}
                onChange={(e) => setSelectedFrameworkId(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="">Select a framework…</option>
                {frameworks.map((fw) => (
                  <option key={fw.id} value={fw.id}>
                    {fw.shortName} — {allRules.filter((r) => r.frameworkId === fw.id).length} rules
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Level selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Assign To</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "folder" as const, label: "Folder", icon: Folder, desc: "All policies in folder" },
                { value: "tag" as const, label: "Tag", icon: Tag, desc: "All policies with tag" },
                { value: "policy" as const, label: "Policy", icon: FileText, desc: "Specific policy" },
              ]).map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => { setLevel(l.value); setSelectedTargetId(""); }}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    level === l.value
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-white/[0.06] hover:border-white/10"
                  }`}
                >
                  <l.icon className={`h-4 w-4 ${level === l.value ? "text-violet-400" : "text-zinc-500"}`} />
                  <p className={`mt-1.5 text-sm font-medium ${level === l.value ? "text-white" : "text-zinc-400"}`}>
                    {l.label}
                  </p>
                  <p className="text-[10px] text-zinc-600">{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Target selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Select {level === "folder" ? "Folder" : level === "tag" ? "Tag" : "Policy"}
            </label>
            {targets.length === 0 ? (
              <div className="rounded-lg border border-white/[0.06] bg-zinc-800/50 px-4 py-6 text-center">
                <p className="text-sm text-zinc-500">
                  No {level === "folder" ? "folders" : level === "tag" ? "tags" : "policies"} found.
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  {level === "folder" ? "Create a folder first in the Organizer." : level === "tag" ? "Add tags to your policies first." : "Add policies to get started."}
                </p>
              </div>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-white/[0.06] bg-zinc-800/30 p-2">
                {targets.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTargetId(t.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors ${
                      selectedTargetId === t.id
                        ? "bg-violet-500/15 text-white"
                        : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {selectedTargetId === t.id ? (
                      <Check className="h-4 w-4 text-violet-400" />
                    ) : (
                      <t.icon className="h-4 w-4" />
                    )}
                    <span className="truncate text-sm">{t.label}</span>
                    {t.color && level !== "policy" && (
                      <span className={`ml-auto h-2.5 w-2.5 rounded-full`} style={{ backgroundColor: t.color }} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {alreadyAssigned && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
              <p className="text-xs text-amber-400">This rule is already assigned to this target.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedTargetId || (mode === "rule" && !selectedRuleId && !preSelectedRule) || (mode === "framework" && !selectedFrameworkId && !preSelectedFrameworkId) || alreadyAssigned}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
