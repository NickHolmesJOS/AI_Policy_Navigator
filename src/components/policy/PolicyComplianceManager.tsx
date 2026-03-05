"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  usePolicyStore,
  useEffectiveRulesForPolicy,
  usePolicyComplianceStats,
  useAllFrameworks,
  useAllComplianceRules,
} from "@/store/policyStore";
import { BUILT_IN_FRAMEWORKS, BUILT_IN_RULES } from "@/lib/complianceData";
import { autoScorePolicy } from "@/lib/autoScore";
import {
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Folder,
  Tag,
  FileText,
  Info,
} from "lucide-react";
import type {
  ComplianceFramework,
  ComplianceAssignmentLevel,
  ComplianceCheckStatus,
} from "@/types";

/* ── Status helpers ───────────────────────────────── */
const STATUS_ICON: Record<ComplianceCheckStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  fail: XCircle,
  partial: AlertTriangle,
  unchecked: HelpCircle,
};
const STATUS_COLOR: Record<ComplianceCheckStatus, string> = {
  pass: "text-emerald-400",
  fail: "text-red-400",
  partial: "text-amber-400",
  unchecked: "text-zinc-600",
};

/* ── Level badges ─────────────────────────────────── */
const LEVEL_CONFIG: Record<ComplianceAssignmentLevel, { icon: typeof Folder; label: string; color: string }> = {
  folder: { icon: Folder, label: "Folder-level", color: "text-blue-400" },
  tag:    { icon: Tag, label: "Tag-level", color: "text-violet-400" },
  policy: { icon: FileText, label: "Policy-level", color: "text-amber-400" },
};

/* ── Determine the best assignment level for a policy ── */
function pickLevel(
  policy: { folderId?: string; tags: { name: string }[] },
  policyId: string,
  preference: "auto" | ComplianceAssignmentLevel = "auto"
): { level: ComplianceAssignmentLevel; targetId: string } {
  if (preference === "folder" && policy.folderId) return { level: "folder", targetId: policy.folderId };
  if (preference === "tag" && policy.tags.length > 0) return { level: "tag", targetId: policy.tags[0].name };
  if (preference === "policy") return { level: "policy", targetId: policyId };

  // auto: prefer policy-level for direct control
  return { level: "policy", targetId: policyId };
}

/* ══════════════════════════════════════════════════════
   Main export: PolicyComplianceManager
   ══════════════════════════════════════════════════════ */

export function PolicyComplianceManager({ policyId }: { policyId: string }) {
  const {
    policies,
    complianceAssignments,
    complianceResults,
    addComplianceAssignment,
    removeComplianceAssignment,
    bulkAssignFramework,
    removeFrameworkAssignments,
    setComplianceResult,
  } = usePolicyStore();

  const policy = policies.find((p) => p.id === policyId);
  const frameworks = useAllFrameworks();
  const allRules = useAllComplianceRules();
  const effective = useEffectiveRulesForPolicy(policyId);
  const stats = usePolicyComplianceStats(policyId);

  const [expandedFrameworks, setExpandedFrameworks] = useState<Set<string>>(new Set());
  const [isScoring, setIsScoring] = useState(false);

  if (!policy) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 p-6 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-zinc-600" />
        <p className="mt-2 text-sm text-zinc-500">Select a policy to manage compliance.</p>
      </div>
    );
  }

  /* ── Compute which frameworks are "on" for this policy ── */
  const frameworkStates = useMemo(() => {
    return frameworks.map((fw) => {
      const fwRules = allRules.filter((r) => r.frameworkId === fw.id);
      const fwRuleIds = new Set(fwRules.map((r) => r.id));

      // Count how many of this framework's rules are assigned (via any level)
      const assignedRules = effective.filter((e) => fwRuleIds.has(e.rule.id));
      const isActive = assignedRules.length > 0;
      const isFullyAssigned = assignedRules.length === fwRules.length;

      // Per-rule results
      const ruleResults = fwRules.map((rule) => {
        const eff = effective.find((e) => e.rule.id === rule.id);
        const result = eff?.result ?? null;
        const status: ComplianceCheckStatus = result?.status || "unchecked";
        return { rule, result, status, isAssigned: !!eff };
      });

      const passCount = ruleResults.filter((r) => r.status === "pass").length;
      const failCount = ruleResults.filter((r) => r.status === "fail").length;
      const partialCount = ruleResults.filter((r) => r.status === "partial").length;
      const score = assignedRules.length > 0
        ? Math.round(((passCount + partialCount * 0.5) / assignedRules.length) * 100)
        : 0;

      return {
        framework: fw,
        isActive,
        isFullyAssigned,
        totalRules: fwRules.length,
        assignedCount: assignedRules.length,
        ruleResults,
        passCount,
        failCount,
        partialCount,
        score,
      };
    });
  }, [frameworks, allRules, effective]);

  /* ── Toggle a whole framework on/off ── */
  const toggleFramework = useCallback(
    (fw: ComplianceFramework, currentlyActive: boolean) => {
      const { level, targetId } = pickLevel(policy, policyId);
      if (currentlyActive) {
        removeFrameworkAssignments(fw.id, level, targetId);
        // Also try removing from other levels
        if (policy.folderId) removeFrameworkAssignments(fw.id, "folder", policy.folderId);
        for (const tag of policy.tags) removeFrameworkAssignments(fw.id, "tag", tag.name);
      } else {
        bulkAssignFramework(fw.id, level, targetId);
      }
    },
    [policy, policyId, bulkAssignFramework, removeFrameworkAssignments]
  );

  /* ── Toggle a single rule on/off ── */
  const toggleSingleRule = useCallback(
    (ruleId: string, isCurrentlyAssigned: boolean) => {
      const { level, targetId } = pickLevel(policy, policyId);
      if (isCurrentlyAssigned) {
        // Find and remove the assignment(s) for this rule matching this policy
        const toRemove = complianceAssignments.filter((a) => {
          if (a.ruleId !== ruleId) return false;
          // Match any level that applies to this policy
          if (a.level === "policy" && a.targetId === policyId) return true;
          if (a.level === "folder" && a.targetId === policy.folderId) return true;
          if (a.level === "tag" && policy.tags.some((t) => t.name === a.targetId)) return true;
          return false;
        });
        for (const a of toRemove) {
          removeComplianceAssignment(a.id);
        }
      } else {
        addComplianceAssignment(ruleId, level, targetId);
      }
    },
    [policy, policyId, complianceAssignments, addComplianceAssignment, removeComplianceAssignment]
  );

  /* ── Auto-score all active rules ── */
  const handleAutoScore = useCallback(() => {
    if (!policy) return;
    setIsScoring(true);
    setTimeout(() => {
      const activeRules = effective.map((e) => e.rule);
      const results = autoScorePolicy(policy.content, activeRules);
      for (const r of results) {
        setComplianceResult(r.ruleId, policyId, r.status, r.note);
      }
      setIsScoring(false);
    }, 300);
  }, [policy, effective, policyId, setComplianceResult]);

  const toggleExpand = (fwId: string) => {
    setExpandedFrameworks((prev) => {
      const next = new Set(prev);
      if (next.has(fwId)) next.delete(fwId);
      else next.add(fwId);
      return next;
    });
  };

  const activeCount = frameworkStates.filter((f) => f.isActive).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Compliance Frameworks</h3>
          <span className="rounded-md bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
            {activeCount}/{frameworks.length} active
          </span>
        </div>
        {activeCount > 0 && (
          <button
            onClick={handleAutoScore}
            disabled={isScoring}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-[11px] font-medium text-violet-300 transition-all hover:bg-violet-500/20 disabled:opacity-50"
          >
            {isScoring ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            {isScoring ? "Scoring…" : "Auto-Score"}
          </button>
        )}
      </div>

      {/* Overall score bar (only when some frameworks are active) */}
      {activeCount > 0 && (
        <div className="rounded-lg border border-white/[0.06] bg-zinc-900/60 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Overall Compliance Score</span>
            <span className={`text-sm font-bold ${stats.score >= 70 ? "text-emerald-400" : stats.score >= 40 ? "text-amber-400" : "text-red-400"}`}>
              {stats.score}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div className="flex h-full">
              {stats.pass > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(stats.pass / stats.total) * 100}%` }} />}
              {stats.partial > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(stats.partial / stats.total) * 100}%` }} />}
              {stats.fail > 0 && <div className="bg-red-500 transition-all duration-500" style={{ width: `${(stats.fail / stats.total) * 100}%` }} />}
            </div>
          </div>
          <div className="mt-1.5 flex gap-3 text-[10px] text-zinc-500">
            <span><span className="text-emerald-400 font-medium">{stats.pass}</span> pass</span>
            <span><span className="text-amber-400 font-medium">{stats.partial}</span> partial</span>
            <span><span className="text-red-400 font-medium">{stats.fail}</span> fail</span>
            <span><span className="text-zinc-400 font-medium">{stats.unchecked}</span> unchecked</span>
          </div>
        </div>
      )}

      {/* Framework list */}
      <div className="space-y-2">
        {frameworkStates.map(({ framework: fw, isActive, isFullyAssigned, totalRules, assignedCount, ruleResults, passCount, failCount, partialCount, score }) => {
          const isExpanded = expandedFrameworks.has(fw.id);
          const fwColor = fw.color.replace("bg-", "text-");
          const isPartial = isActive && !isFullyAssigned;

          return (
            <div
              key={fw.id}
              className={`rounded-xl border transition-all overflow-hidden ${
                isActive ? "border-white/[0.08] bg-zinc-900/60" : "border-white/[0.04] bg-zinc-900/20"
              }`}
            >
              {/* Framework header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Toggle — shows partial state with minus icon */}
                <button
                  onClick={() => toggleFramework(fw, isActive)}
                  className="shrink-0"
                  title={isActive ? "Disable framework" : "Enable framework"}
                >
                  {isActive ? (
                    <div className="relative">
                      <ToggleRight className={`h-5 w-5 ${isPartial ? "text-amber-400" : "text-violet-400"}`} />
                      {isPartial && (
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-amber-500 text-[7px] font-bold text-black leading-none">
                          ~
                        </span>
                      )}
                    </div>
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-zinc-600" />
                  )}
                </button>

                {/* Name + badge */}
                <button
                  onClick={() => toggleExpand(fw.id)}
                  className="flex flex-1 items-center gap-2 min-w-0 text-left"
                >
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${fwColor} bg-zinc-800`}>
                    {fw.shortName}
                  </span>
                  <span className={`text-sm font-medium truncate ${isActive ? "text-white" : "text-zinc-500"}`}>
                    {fw.name}
                  </span>
                </button>

                {/* Status chips */}
                <div className="flex items-center gap-2 shrink-0">
                  {isActive && (
                    <>
                      <span className={`text-xs font-semibold ${score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : score > 0 ? "text-red-400" : "text-zinc-500"}`}>
                        {score}%
                      </span>
                      <span className="text-[10px] text-zinc-500">{assignedCount}/{totalRules}</span>
                    </>
                  )}
                  {!isActive && (
                    <span className="text-[10px] text-zinc-600">{totalRules} rules</span>
                  )}
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                  )}
                </div>
              </div>

              {/* Expanded rule list with per-rule toggles */}
              {isExpanded && (
                <div className="border-t border-white/[0.04] px-4 py-3 space-y-1">
                  {ruleResults.map(({ rule, status, isAssigned }) => {
                    const Icon = STATUS_ICON[status];
                    return (
                      <div
                        key={rule.id}
                        className={`flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors ${
                          isAssigned ? "hover:bg-white/[0.02]" : "hover:bg-white/[0.01] opacity-60"
                        }`}
                      >
                        {/* Per-rule toggle */}
                        <button
                          onClick={() => toggleSingleRule(rule.id, isAssigned)}
                          className="shrink-0"
                          title={isAssigned ? `Disable ${rule.title}` : `Enable ${rule.title}`}
                        >
                          {isAssigned ? (
                            <ToggleRight className="h-4 w-4 text-violet-400" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-zinc-600" />
                          )}
                        </button>

                        {/* Status icon (only meaningful when assigned) */}
                        {isAssigned && (
                          <Icon className={`h-3.5 w-3.5 shrink-0 ${STATUS_COLOR[status]}`} />
                        )}

                        {/* Rule title */}
                        <span className={`text-xs flex-1 truncate ${
                          !isAssigned
                            ? "text-zinc-600"
                            : status === "pass"
                            ? "text-zinc-400 line-through"
                            : "text-zinc-300"
                        }`}>
                          {rule.title}
                        </span>
                        {rule.section && (
                          <span className="text-[9px] text-zinc-600">§{rule.section}</span>
                        )}
                        {isAssigned && (
                          <span className={`text-[10px] font-medium ${STATUS_COLOR[status]}`}>
                            {status}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 rounded-lg border border-white/[0.04] bg-zinc-900/30 px-3 py-2.5">
        <Info className="h-3.5 w-3.5 text-zinc-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          Toggle frameworks or individual rules to control which compliance checks apply.
          The Analysis view reflects pass/fail for each active rule.
        </p>
      </div>
    </div>
  );
}
