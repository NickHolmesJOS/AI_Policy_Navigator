"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  usePolicyStore,
  useEffectiveRulesForPolicy,
  usePolicyComplianceStats,
  useAllFrameworks,
} from "@/store/policyStore";
import { getSeverityStyles, BUILT_IN_RULES, BUILT_IN_FRAMEWORKS } from "@/lib/complianceData";
import { autoScorePolicy } from "@/lib/autoScore";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Folder,
  Tag,
  FileText,
  MessageSquare,
  Circle,
  Check,
  Zap,
  BookOpen,
  Loader2,
  Search,
  RotateCcw,
  ExternalLink,
  ScanSearch,
} from "lucide-react";
import type { ComplianceCheckStatus, ComplianceAssignmentLevel, ComplianceRule } from "@/types";
import Link from "next/link";

interface Props {
  policyId: string;
}

const STATUS_CONFIG: Record<
  ComplianceCheckStatus,
  { icon: typeof CheckCircle2; label: string; color: string; bg: string; border: string; ring: string }
> = {
  pass: { icon: CheckCircle2, label: "Pass", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", ring: "ring-emerald-500/30" },
  fail: { icon: XCircle, label: "Fail", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", ring: "ring-red-500/30" },
  partial: { icon: AlertTriangle, label: "Partial", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", ring: "ring-amber-500/30" },
  unchecked: { icon: HelpCircle, label: "Unchecked", color: "text-zinc-500", bg: "bg-zinc-500/10", border: "border-zinc-500/20", ring: "ring-zinc-500/30" },
};

const SOURCE_CONFIG: Record<ComplianceAssignmentLevel, { icon: typeof Folder; label: string; color: string; bg: string; border: string }> = {
  folder: { icon: Folder, label: "Folder", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  tag: { icon: Tag, label: "Tag", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  policy: { icon: FileText, label: "Individual", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
};

type EffectiveItem = {
  rule: ComplianceRule;
  sources: { level: ComplianceAssignmentLevel; targetId: string }[];
  result: { ruleId: string; policyId: string; status: ComplianceCheckStatus; note: string; checkedAt: string; checkedBy: string } | null;
};

/* ─── Expanded compliance document view ─────────────────────────── */
function ComplianceDocView({
  item,
  policyId,
  onClose,
}: {
  item: EffectiveItem;
  policyId: string;
  onClose: () => void;
}) {
  const { setComplianceResult } = usePolicyStore();
  const [noteValue, setNoteValue] = useState(item.result?.note ?? "");
  const { rule, result } = item;
  const currentStatus: ComplianceCheckStatus = result?.status || "unchecked";
  const sevStyle = getSeverityStyles(rule.severity);
  const frameworks = useAllFrameworks();
  const fw = frameworks.find((f) => f.id === rule.frameworkId);
  const config = STATUS_CONFIG[currentStatus];

  const setStatus = (status: ComplianceCheckStatus) => {
    setComplianceResult(rule.id, policyId, status, noteValue);
  };

  const saveNote = () => {
    setComplianceResult(rule.id, policyId, currentStatus, noteValue);
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-zinc-900/80 overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] bg-zinc-900 px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <BookOpen className="h-4 w-4 text-violet-400 shrink-0" />
            <h3 className="text-base font-semibold text-white truncate">{rule.title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {fw && (
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${fw.color.replace("bg-", "text-")} bg-zinc-800`}>
                {fw.name}
              </span>
            )}
            {rule.section && (
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400 font-medium">§ {rule.section}</span>
            )}
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}>
              {rule.severity}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors shrink-0">
          <XCircle className="h-4 w-4" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Current Status:</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.color} ${config.border} border`}>
            <config.icon className="h-3.5 w-3.5" />
            {config.label}
          </span>
        </div>

        <div>
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">Requirement Description</h4>
          <div className="rounded-lg border border-white/[0.04] bg-black/20 p-4">
            <p className="text-sm text-zinc-200 leading-relaxed">{rule.description}</p>
          </div>
        </div>

        {rule.keywords.length > 0 && (
          <div>
            <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              <Search className="inline h-3 w-3 mr-1" />Keywords Checked ({rule.keywords.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {rule.keywords.map((kw) => (
                <span key={kw} className="rounded-md border border-white/[0.06] bg-zinc-800/60 px-2 py-0.5 text-[11px] text-zinc-300">{kw}</span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">Mark Compliance Status</h4>
          <div className="flex gap-1.5 flex-wrap">
            {(Object.entries(STATUS_CONFIG) as [ComplianceCheckStatus, (typeof STATUS_CONFIG)["pass"]][]).map(
              ([status, cfg]) => (
                <button
                  key={status}
                  onClick={() => setStatus(status)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                    currentStatus === status
                      ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-1 ${cfg.ring}`
                      : "border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:border-white/10"
                  }`}
                >
                  <cfg.icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </button>
              )
            )}
          </div>
        </div>

        <div>
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            <MessageSquare className="inline h-3 w-3 mr-1" />Notes
          </h4>
          <textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            onBlur={saveNote}
            placeholder="Add notes about this compliance check…"
            rows={3}
            className="w-full rounded-lg border border-white/[0.08] bg-zinc-800/50 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none resize-none"
          />
        </div>

        {result?.checkedAt && (
          <p className="text-[10px] text-zinc-600">
            Last checked: {new Date(result.checkedAt).toLocaleString()} · {result.checkedBy === "auto" ? "Auto-scored" : "Manual"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Single compliance rule row ───────────────────────────────── */
function ComplianceRuleRow({
  item,
  policyId,
  isSelected,
  onSelect,
}: {
  item: EffectiveItem;
  policyId: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { setComplianceResult } = usePolicyStore();
  const { rule, result } = item;
  const currentStatus: ComplianceCheckStatus = result?.status || "unchecked";
  const config = STATUS_CONFIG[currentStatus];
  const sevStyle = getSeverityStyles(rule.severity);
  const frameworks = useAllFrameworks();
  const fw = frameworks.find((f) => f.id === rule.frameworkId);

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const order: ComplianceCheckStatus[] = ["unchecked", "pass", "partial", "fail"];
    const idx = order.indexOf(currentStatus);
    const next = order[(idx + 1) % order.length];
    setComplianceResult(rule.id, policyId, next, result?.note || "");
  };

  const matchInfo = result?.note?.match(/(\d+)\/(\d+) keywords found/);

  return (
    <div
      onClick={onSelect}
      className={`group flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all ${
        isSelected
          ? "border-violet-500/30 bg-violet-500/[0.05] ring-1 ring-violet-500/20"
          : currentStatus === "pass"
          ? "border-emerald-500/15 bg-emerald-500/[0.03] hover:border-emerald-500/25"
          : currentStatus === "fail"
          ? "border-red-500/15 bg-red-500/[0.03] hover:border-red-500/25"
          : currentStatus === "partial"
          ? "border-amber-500/15 bg-amber-500/[0.03] hover:border-amber-500/25"
          : "border-white/[0.06] bg-zinc-900/40 hover:border-white/[0.1]"
      }`}
    >
      <button
        onClick={cycleStatus}
        className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
          currentStatus === "pass"
            ? "border-emerald-500 bg-emerald-500"
            : currentStatus === "fail"
            ? "border-red-500 bg-red-500"
            : currentStatus === "partial"
            ? "border-amber-500 bg-amber-500/30"
            : "border-zinc-600 bg-transparent hover:border-zinc-400"
        }`}
        title={`${config.label} — click to cycle`}
      >
        {currentStatus === "pass" && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        {currentStatus === "fail" && <XCircle className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
        {currentStatus === "partial" && <AlertTriangle className="h-3 w-3 text-amber-400" strokeWidth={2.5} />}
        {currentStatus === "unchecked" && <Circle className="h-2 w-2 text-zinc-600" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium leading-tight ${currentStatus === "pass" ? "text-zinc-400 line-through" : "text-white"}`}>
            {rule.title}
          </span>
          {rule.section && (
            <span className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">{rule.section}</span>
          )}
        </div>
        {matchInfo && (
          <p className="mt-0.5 text-[10px] text-zinc-500">{matchInfo[1]}/{matchInfo[2]} keywords matched</p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {fw && (
          <span className={`hidden sm:inline shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium bg-zinc-800 ${fw.color.replace("bg-", "text-")}`}>
            {fw.shortName}
          </span>
        )}
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}>
          {rule.severity}
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
      </div>
    </div>
  );
}

/* ─── Framework distribution for auto-detect ──────────────────── */
const FOLDER_FRAMEWORKS = ["gdpr", "hipaa"];
const TAG_FRAMEWORKS = ["soc2", "pci-dss"];
const POLICY_FRAMEWORKS = ["iso27001", "ccpa"];

/* ─── Main component ───────────────────────────────────────────── */
export function PolicyComplianceChecklist({ policyId }: Props) {
  const { folders, policies, setComplianceResult, addComplianceAssignment } = usePolicyStore();
  const effective = useEffectiveRulesForPolicy(policyId);
  const stats = usePolicyComplianceStats(policyId);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [isAutoScoring, setIsAutoScoring] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const hasAutoInitialized = useRef(false);

  const policy = policies.find((p) => p.id === policyId);

  /* ── Auto-detect & assign on first load ─────────────────────── */
  const runAutoDetect = useCallback(() => {
    if (!policy) return;
    setIsScanning(true);

    // Distribute frameworks across inheritance levels
    const assignRulesForFrameworks = (frameworkIds: string[], level: ComplianceAssignmentLevel, targetId: string) => {
      for (const fwId of frameworkIds) {
        const rules = BUILT_IN_RULES.filter((r) => r.frameworkId === fwId);
        for (const rule of rules) {
          addComplianceAssignment(rule.id, level, targetId);
        }
      }
    };

    // Folder-level: GDPR & HIPAA (inherited by all policies in the folder)
    if (policy.folderId) {
      assignRulesForFrameworks(FOLDER_FRAMEWORKS, "folder", policy.folderId);
    } else {
      // No folder → assign at policy level instead
      assignRulesForFrameworks(FOLDER_FRAMEWORKS, "policy", policyId);
    }

    // Tag-level: SOC 2 & PCI DSS (inherited by all policies with the tag)
    if (policy.tags.length > 0) {
      assignRulesForFrameworks(TAG_FRAMEWORKS, "tag", policy.tags[0].name);
    } else {
      assignRulesForFrameworks(TAG_FRAMEWORKS, "policy", policyId);
    }

    // Policy-level (individual): ISO 27001 & CCPA
    assignRulesForFrameworks(POLICY_FRAMEWORKS, "policy", policyId);

    // Auto-score after a brief delay for visual feedback
    setTimeout(() => {
      const results = autoScorePolicy(policy.content, BUILT_IN_RULES);
      for (const r of results) {
        setComplianceResult(r.ruleId, policyId, r.status, r.note);
      }
      setIsScanning(false);
    }, 600);
  }, [policy, policyId, addComplianceAssignment, setComplianceResult]);

  // Auto-run on first mount if no assignments exist
  useEffect(() => {
    if (hasAutoInitialized.current || !policy) return;

    // Check raw store state to see if ANY assignments exist for this policy
    const assignments = usePolicyStore.getState().complianceAssignments;
    const hasAssignments = assignments.some((a) => {
      if (a.level === "policy" && a.targetId === policyId) return true;
      if (a.level === "folder" && policy.folderId && a.targetId === policy.folderId) return true;
      if (a.level === "tag" && policy.tags.some((t) => t.name === a.targetId)) return true;
      return false;
    });

    hasAutoInitialized.current = true;

    if (!hasAssignments) {
      runAutoDetect();
    }
  }, [policy, policyId, runAutoDetect]);

  const selectedItem = useMemo(
    () => effective.find((e) => e.rule.id === selectedRuleId) || null,
    [effective, selectedRuleId]
  );

  const handleAutoScore = useCallback(() => {
    if (!policy) return;
    setIsAutoScoring(true);
    setTimeout(() => {
      const results = autoScorePolicy(policy.content, effective.map((e) => e.rule));
      for (const r of results) {
        setComplianceResult(r.ruleId, policyId, r.status, r.note);
      }
      setIsAutoScoring(false);
    }, 400);
  }, [policy, effective, policyId, setComplianceResult]);

  const handleReset = useCallback(() => {
    for (const item of effective) {
      setComplianceResult(item.rule.id, policyId, "unchecked", "");
    }
  }, [effective, policyId, setComplianceResult]);

  const filteredEffective = useMemo(() => {
    if (!searchQuery.trim()) return effective;
    const q = searchQuery.toLowerCase();
    return effective.filter(
      (e) =>
        e.rule.title.toLowerCase().includes(q) ||
        e.rule.description.toLowerCase().includes(q) ||
        e.rule.section?.toLowerCase().includes(q) ||
        e.rule.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [effective, searchQuery]);

  const sourceGroups = useMemo(() => {
    const groups: Record<string, { level: ComplianceAssignmentLevel; targetId: string; label: string; items: EffectiveItem[] }> = {};

    for (const item of filteredEffective) {
      for (const source of item.sources) {
        let label: string;
        if (source.level === "folder") {
          const f = folders.find((fo) => fo.id === source.targetId);
          label = f?.name || source.targetId;
        } else if (source.level === "tag") {
          label = source.targetId;
        } else {
          label = "This Policy Only";
        }
        const key = `${source.level}:${source.targetId}`;
        if (!groups[key]) {
          groups[key] = { level: source.level, targetId: source.targetId, label, items: [] };
        }
        if (!groups[key].items.some((i) => i.rule.id === item.rule.id)) {
          groups[key].items.push(item);
        }
      }
    }

    const order: ComplianceAssignmentLevel[] = ["policy", "folder", "tag"];
    return Object.values(groups).sort((a, b) => order.indexOf(a.level) - order.indexOf(b.level));
  }, [filteredEffective, folders]);

  // Scanning animation
  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <ScanSearch className="h-8 w-8 text-violet-400 animate-pulse" />
          </div>
          <div className="absolute -inset-2 rounded-2xl border-2 border-violet-500/20 animate-ping" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-white">Scanning Policy for Compliance</h3>
          <p className="mt-1 text-xs text-zinc-500">Detecting applicable frameworks and scoring against 60 rules…</p>
        </div>
        <div className="flex items-center gap-3 mt-2">
          {BUILT_IN_FRAMEWORKS.slice(0, 6).map((fw) => (
            <span key={fw.id} className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${fw.color.replace("bg-", "text-")} bg-zinc-800/60 animate-pulse`}>
              {fw.shortName}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (effective.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 py-16 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-zinc-600" />
        <h3 className="mt-3 text-sm font-medium text-white">No Compliance Rules Assigned</h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-sm mx-auto">
          Scan this policy to auto-detect applicable compliance frameworks, or assign rules manually on the{" "}
          <Link href="/compliance" className="text-violet-400 hover:text-violet-300 underline">Compliance page</Link>.
        </p>
        <button
          onClick={runAutoDetect}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-violet-300 transition-all hover:bg-violet-500/20"
        >
          <ScanSearch className="h-4 w-4" />
          Scan for Compliance Requirements
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Score</p>
          <p className={`mt-0.5 text-2xl font-bold ${stats.score >= 70 ? "text-emerald-400" : stats.score >= 40 ? "text-amber-400" : "text-red-400"}`}>
            {stats.score}%
          </p>
        </div>
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/60">Passed</p>
          <p className="mt-0.5 text-2xl font-bold text-emerald-400">{stats.pass}</p>
        </div>
        <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-amber-400/60">Partial</p>
          <p className="mt-0.5 text-2xl font-bold text-amber-400">{stats.partial}</p>
        </div>
        <div className="rounded-xl border border-red-500/10 bg-red-500/[0.03] p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-red-400/60">Failed</p>
          <p className="mt-0.5 text-2xl font-bold text-red-400">{stats.fail}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-3.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Unchecked</p>
          <p className="mt-0.5 text-2xl font-bold text-zinc-400">{stats.unchecked}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800">
        <div className="flex h-full">
          {stats.pass > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(stats.pass / stats.total) * 100}%` }} />}
          {stats.partial > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(stats.partial / stats.total) * 100}%` }} />}
          {stats.fail > 0 && <div className="bg-red-500 transition-all duration-500" style={{ width: `${(stats.fail / stats.total) * 100}%` }} />}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rules…"
            className="w-full rounded-lg border border-white/[0.08] bg-zinc-800/50 py-2 pl-9 pr-3 text-xs text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoScore}
            disabled={isAutoScoring}
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3.5 py-2 text-xs font-medium text-violet-300 transition-all hover:bg-violet-500/20 disabled:opacity-50"
          >
            {isAutoScoring ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {isAutoScoring ? "Scoring…" : "Re-Score All"}
          </button>
          <button
            onClick={runAutoDetect}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/10 transition-colors"
          >
            <ScanSearch className="h-3.5 w-3.5" />
            Rescan
          </button>
          {stats.total - stats.unchecked > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:border-white/10 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main content: list + document view */}
      <div className={`grid gap-5 ${selectedItem ? "lg:grid-cols-2" : "lg:grid-cols-1"}`}>
        <div className="space-y-4">
          {sourceGroups.map((group) => {
            const srcConfig = SOURCE_CONFIG[group.level];
            const SrcIcon = srcConfig.icon;
            const groupPass = group.items.filter((i) => i.result?.status === "pass").length;
            const groupPartial = group.items.filter((i) => i.result?.status === "partial").length;
            const groupFail = group.items.filter((i) => i.result?.status === "fail").length;
            const groupTotal = group.items.length;
            const groupScore = groupTotal > 0 ? Math.round(((groupPass + groupPartial * 0.5) / groupTotal) * 100) : 0;

            return (
              <div key={`${group.level}:${group.targetId}`} className="space-y-2">
                <div className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 ${srcConfig.border} ${srcConfig.bg}`}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05]">
                    <SrcIcon className={`h-3.5 w-3.5 ${srcConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">
                        {group.level === "policy" ? "Individual Assignments" : group.level === "folder" ? "From Folder" : "From Tag"}
                      </span>
                      {group.level !== "policy" && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${srcConfig.color}`}>{group.label}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-bold ${groupScore >= 70 ? "text-emerald-400" : groupScore >= 40 ? "text-amber-400" : groupScore > 0 ? "text-red-400" : "text-zinc-500"}`}>
                      {groupScore}%
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      <span className="text-emerald-500">{groupPass}✓</span>{" "}
                      <span className="text-red-500">{groupFail}✗</span>{" "}
                      <span className="text-amber-500">{groupPartial}~</span>
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <ComplianceRuleRow
                      key={item.rule.id}
                      item={item}
                      policyId={policyId}
                      isSelected={selectedRuleId === item.rule.id}
                      onSelect={() => setSelectedRuleId(selectedRuleId === item.rule.id ? null : item.rule.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredEffective.length === 0 && searchQuery && (
            <div className="py-10 text-center">
              <Search className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-2 text-sm text-zinc-500">No rules match &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}
        </div>

        {selectedItem && (
          <div className="lg:sticky lg:top-4 lg:self-start">
            <ComplianceDocView item={selectedItem} policyId={policyId} onClose={() => setSelectedRuleId(null)} />
          </div>
        )}
      </div>

      {/* Footer link */}
      <div className="rounded-xl border border-dashed border-white/[0.08] px-4 py-3 text-center">
        <p className="text-xs text-zinc-500">
          Manage rules and assignments on the{" "}
          <Link href="/compliance" className="text-violet-400 hover:text-violet-300 underline transition-colors">Compliance Dashboard</Link>
        </p>
      </div>
    </div>
  );
}
