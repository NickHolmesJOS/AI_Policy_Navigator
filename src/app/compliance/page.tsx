"use client";

import { useState, useMemo } from "react";
import {
  usePolicyStore,
  useAllFrameworks,
  useAllComplianceRules,
} from "@/store/policyStore";
import { BUILT_IN_RULES, getSeverityStyles } from "@/lib/complianceData";
import { ComplianceRuleEditor } from "@/components/compliance/ComplianceRuleEditor";
import { ComplianceAssignmentModal } from "@/components/compliance/ComplianceAssignmentModal";
import { PageTransition, FadeInView, StaggerContainer, StaggerItem } from "@/components/ui/Animations";
import { useToast } from "@/components/ui/Toast";
import {
  ShieldCheck,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Folder,
  Tag,
  FileText,
  Settings,
  Layers,
  Search,
  BookOpen,
  Link2,
} from "lucide-react";
import type { ComplianceRule, ComplianceAssignmentLevel } from "@/types";

type TabId = "frameworks" | "assignments" | "custom";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "frameworks", label: "Frameworks & Rules", icon: BookOpen },
  { id: "assignments", label: "Assignments", icon: Link2 },
  { id: "custom", label: "Custom Rules", icon: Settings },
];

export default function CompliancePage() {
  const {
    policies,
    folders,
    complianceAssignments,
    complianceResults,
    customRules,
    customFrameworks,
    removeComplianceAssignment,
    toggleComplianceAssignment,
    deleteCustomRule,
    deleteCustomFramework,
  } = usePolicyStore();
  const frameworks = useAllFrameworks();
  const allRules = useAllComplianceRules();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>("frameworks");
  const [expandedFrameworks, setExpandedFrameworks] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | ComplianceAssignmentLevel>("all");

  // Modals
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignRule, setAssignRule] = useState<ComplianceRule | null>(null);
  const [assignFrameworkId, setAssignFrameworkId] = useState<string | null>(null);

  // Stats
  const stats = useMemo(() => {
    const totalRules = allRules.length;
    const totalAssignments = complianceAssignments.length;
    const enabledAssignments = complianceAssignments.filter((a) => a.enabled).length;
    const totalResults = complianceResults.length;
    const passCount = complianceResults.filter((r) => r.status === "pass").length;
    const failCount = complianceResults.filter((r) => r.status === "fail").length;
    const passRate = totalResults > 0 ? Math.round((passCount / totalResults) * 100) : 0;
    return { totalRules, totalAssignments, enabledAssignments, totalResults, passCount, failCount, passRate };
  }, [allRules, complianceAssignments, complianceResults]);

  const toggleFramework = (id: string) => {
    setExpandedFrameworks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openAssignRule = (rule: ComplianceRule) => {
    setAssignRule(rule);
    setAssignFrameworkId(null);
    setShowAssignModal(true);
  };

  const openAssignFramework = (frameworkId: string) => {
    setAssignRule(null);
    setAssignFrameworkId(frameworkId);
    setShowAssignModal(true);
  };

  const getAssignmentCount = (ruleId: string) =>
    complianceAssignments.filter((a) => a.ruleId === ruleId && a.enabled).length;

  const getTargetLabel = (level: string, targetId: string) => {
    if (level === "folder") return folders.find((f) => f.id === targetId)?.name || "Unknown Folder";
    if (level === "tag") return targetId;
    return policies.find((p) => p.id === targetId)?.title || "Unknown Policy";
  };

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    let filtered = complianceAssignments;
    if (assignmentFilter !== "all") {
      filtered = filtered.filter((a) => a.level === assignmentFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => {
        const rule = allRules.find((r) => r.id === a.ruleId);
        const target = getTargetLabel(a.level, a.targetId);
        return (
          rule?.title.toLowerCase().includes(q) ||
          target.toLowerCase().includes(q)
        );
      });
    }
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complianceAssignments, assignmentFilter, searchQuery, allRules, folders, policies]);

  // Group assignments by target
  const assignmentsByTarget = useMemo(() => {
    const groups = new Map<string, typeof filteredAssignments>();
    for (const a of filteredAssignments) {
      const key = `${a.level}:${a.targetId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(a);
    }
    return groups;
  }, [filteredAssignments]);

  return (
    <PageTransition>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeInView>
          <div className="mb-8 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Compliance Dashboard</h1>
                <p className="text-sm text-zinc-400">
                  Manage real regulatory requirements — assign to policies, folders, or tags
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setEditingRule(null); setShowRuleEditor(true); }}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> New Rule
              </button>
              <button
                onClick={() => { setAssignRule(null); setAssignFrameworkId(null); setShowAssignModal(true); }}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Link2 className="h-3.5 w-3.5" /> Assign
              </button>
            </div>
          </div>
        </FadeInView>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {[
            { label: "Total Rules", value: stats.totalRules, sub: `${BUILT_IN_RULES.length} built-in`, green: false, red: false },
            { label: "Assignments", value: stats.enabledAssignments, sub: `${stats.totalAssignments} total`, green: false, red: false },
            { label: "Checks Done", value: stats.totalResults, sub: "across all policies", green: false, red: false },
            { label: "Passing", value: stats.passCount, sub: `${stats.passRate}% rate`, green: true, red: false },
            { label: "Failing", value: stats.failCount, sub: "need attention", green: false, red: stats.failCount > 0 },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl border p-4 ${
                s.red ? "border-red-500/10 bg-red-950/20" : s.green ? "border-emerald-500/10 bg-emerald-950/20" : "border-white/[0.06] bg-zinc-900/60"
              }`}
            >
              <p className={`text-xs font-medium ${s.red ? "text-red-400" : s.green ? "text-emerald-400" : "text-zinc-500"}`}>{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.red ? "text-red-400" : s.green ? "text-emerald-400" : "text-white"}`}>{s.value}</p>
              <p className="mt-0.5 text-[10px] text-zinc-600">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex items-center gap-1 rounded-xl border border-white/[0.06] bg-zinc-900/40 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Frameworks & Rules Tab ─────────────────────────────────── */}
        {activeTab === "frameworks" && (
          <StaggerContainer className="space-y-3">
            {frameworks.map((fw) => {
              const fwRules = allRules.filter((r) => r.frameworkId === fw.id);
              const isExpanded = expandedFrameworks.has(fw.id);
              const assignedCount = fwRules.reduce((sum, r) => sum + getAssignmentCount(r.id), 0);

              return (
                <StaggerItem key={fw.id}>
                  <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/60">
                    {/* Framework header */}
                    <div
                      className="flex cursor-pointer items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors"
                      onClick={() => toggleFramework(fw.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-zinc-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-zinc-500" />
                        )}
                        <div className={`h-3 w-3 rounded-full ${fw.color}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">{fw.shortName}</h3>
                            {!fw.isBuiltIn && (
                              <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-medium text-violet-400">
                                CUSTOM
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500">{fw.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500">{fwRules.length} rules</span>
                        {assignedCount > 0 && (
                          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium text-violet-400">
                            {assignedCount} assigned
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); openAssignFramework(fw.id); }}
                          className="rounded-lg border border-white/[0.06] bg-zinc-800 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >
                          Assign All
                        </button>
                      </div>
                    </div>

                    {/* Expanded rules list */}
                    {isExpanded && (
                      <div className="border-t border-white/[0.04]">
                        {fw.description && (
                          <div className="border-b border-white/[0.04] bg-zinc-900/30 px-5 py-3">
                            <p className="text-xs text-zinc-500 leading-relaxed">{fw.description}</p>
                          </div>
                        )}
                        <div className="divide-y divide-white/[0.03]">
                          {fwRules.map((rule) => {
                            const sevStyle = getSeverityStyles(rule.severity);
                            const assignCount = getAssignmentCount(rule.id);
                            return (
                              <div
                                key={rule.id}
                                className="flex items-start gap-3 px-5 py-3 hover:bg-zinc-800/20 transition-colors"
                              >
                                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-600" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-white">{rule.title}</span>
                                    {rule.section && (
                                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                                        {rule.section}
                                      </span>
                                    )}
                                    <span
                                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}
                                    >
                                      {rule.severity}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 text-xs text-zinc-500 leading-relaxed">
                                    {rule.description}
                                  </p>
                                  {rule.keywords.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap gap-1">
                                      {rule.keywords.slice(0, 5).map((kw) => (
                                        <span key={kw} className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] text-zinc-600">
                                          {kw}
                                        </span>
                                      ))}
                                      {rule.keywords.length > 5 && (
                                        <span className="text-[9px] text-zinc-600">+{rule.keywords.length - 5}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {assignCount > 0 && (
                                    <span className="text-[10px] text-zinc-500">{assignCount} assigned</span>
                                  )}
                                  <button
                                    onClick={() => openAssignRule(rule)}
                                    className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1 text-[11px] font-medium text-violet-400 hover:bg-violet-500/15 transition-colors"
                                  >
                                    Assign
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}

        {/* ── Assignments Tab ────────────────────────────────────────── */}
        {activeTab === "assignments" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assignments…"
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/60 py-2 pl-10 pr-3 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-zinc-900/40 p-0.5">
                {(
                  [
                    { value: "all" as const, label: "All", icon: Layers },
                    { value: "folder" as const, label: "Folders", icon: Folder },
                    { value: "tag" as const, label: "Tags", icon: Tag },
                    { value: "policy" as const, label: "Policies", icon: FileText },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setAssignmentFilter(f.value)}
                    className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      assignmentFilter === f.value
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <f.icon className="h-3 w-3" />
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {assignmentsByTarget.size === 0 ? (
              <div className="rounded-xl border border-white/[0.06] bg-zinc-900/40 py-16 text-center">
                <Link2 className="mx-auto h-10 w-10 text-zinc-600" />
                <h3 className="mt-3 text-sm font-medium text-white">No Assignments Yet</h3>
                <p className="mt-1 text-xs text-zinc-500">
                  Assign compliance rules to folders, tags, or individual policies
                </p>
                <button
                  onClick={() => { setAssignRule(null); setAssignFrameworkId(null); setShowAssignModal(true); }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Assignment
                </button>
              </div>
            ) : (
              <StaggerContainer className="space-y-3">
                {Array.from(assignmentsByTarget.entries()).map(([key, assignments]) => {
                  const [level, ...targetParts] = key.split(":");
                  const targetId = targetParts.join(":");
                  const LevelIcon = level === "folder" ? Folder : level === "tag" ? Tag : FileText;
                  const targetLabel = getTargetLabel(level, targetId);

                  return (
                    <StaggerItem key={key}>
                      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-zinc-900/60">
                        <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <LevelIcon className="h-4 w-4 text-zinc-500" />
                            <div>
                              <span className="text-sm font-medium text-white">{targetLabel}</span>
                              <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                                {level}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-zinc-500">
                            {assignments.length} rule{assignments.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="divide-y divide-white/[0.03]">
                          {assignments.map((a) => {
                            const rule = allRules.find((r) => r.id === a.ruleId);
                            if (!rule) return null;
                            const fw = frameworks.find((f) => f.id === rule.frameworkId);
                            const sevStyle = getSeverityStyles(rule.severity);
                            return (
                              <div
                                key={a.id}
                                className={`flex items-center gap-3 px-5 py-2.5 transition-colors ${
                                  !a.enabled ? "opacity-40" : ""
                                }`}
                              >
                                <button
                                  onClick={() => toggleComplianceAssignment(a.id)}
                                  className="shrink-0"
                                  title={a.enabled ? "Disable" : "Enable"}
                                >
                                  {a.enabled ? (
                                    <ToggleRight className="h-5 w-5 text-violet-400" />
                                  ) : (
                                    <ToggleLeft className="h-5 w-5 text-zinc-600" />
                                  )}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate text-sm text-white">{rule.title}</span>
                                    {fw && (
                                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${fw.color.replace("bg-", "text-")} bg-zinc-800`}>
                                        {fw.shortName}
                                      </span>
                                    )}
                                    <span
                                      className={`rounded-full border px-1.5 py-0.5 text-[9px] ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}
                                    >
                                      {rule.severity}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    removeComplianceAssignment(a.id);
                                    toast({ title: "Removed", description: `"${rule.title}" unassigned`, variant: "info" });
                                  }}
                                  className="shrink-0 rounded-lg p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            )}
          </div>
        )}

        {/* ── Custom Rules Tab ───────────────────────────────────────── */}
        {activeTab === "custom" && (
          <div className="space-y-6">
            {/* Custom frameworks */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Custom Frameworks</h3>
                <button
                  onClick={() => { setEditingRule(null); setShowRuleEditor(true); }}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                >
                  <Plus className="h-3 w-3" /> New Rule (opens editor with framework creation)
                </button>
              </div>
              {customFrameworks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.08] py-8 text-center">
                  <p className="text-xs text-zinc-500">
                    No custom frameworks yet. Create one when adding a new custom rule.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {customFrameworks.map((fw) => {
                    const fwRules = customRules.filter((r) => r.frameworkId === fw.id);
                    return (
                      <div
                        key={fw.id}
                        className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${fw.color}`} />
                            <span className="text-sm font-medium text-white">{fw.shortName}</span>
                            <span className="text-xs text-zinc-500">{fw.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-500">{fwRules.length} rules</span>
                            <button
                              onClick={() => {
                                deleteCustomFramework(fw.id);
                                toast({ title: "Deleted", description: `"${fw.shortName}" removed with all its rules`, variant: "warning" });
                              }}
                              className="rounded-lg p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        {fw.description && (
                          <p className="mt-1 text-xs text-zinc-500">{fw.description}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom rules */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Custom Rules</h3>
                <button
                  onClick={() => { setEditingRule(null); setShowRuleEditor(true); }}
                  className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Create Rule
                </button>
              </div>
              {customRules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/[0.08] py-12 text-center">
                  <ShieldCheck className="mx-auto h-10 w-10 text-zinc-600" />
                  <h3 className="mt-3 text-sm font-medium text-white">No Custom Rules</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Create your own compliance checks for your organization&apos;s specific needs
                  </p>
                  <button
                    onClick={() => { setEditingRule(null); setShowRuleEditor(true); }}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" /> Create Your First Rule
                  </button>
                </div>
              ) : (
                <StaggerContainer className="space-y-2">
                  {customRules.map((rule) => {
                    const fw = [...customFrameworks, ...frameworks].find((f) => f.id === rule.frameworkId);
                    const sevStyle = getSeverityStyles(rule.severity);
                    return (
                      <StaggerItem key={rule.id}>
                        <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-white">{rule.title}</span>
                                {rule.section && (
                                  <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-500">
                                    {rule.section}
                                  </span>
                                )}
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${sevStyle.bg} ${sevStyle.text} ${sevStyle.border}`}
                                >
                                  {rule.severity}
                                </span>
                                {fw && (
                                  <span className={`rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium ${fw.color.replace("bg-", "text-")}`}>
                                    {fw.shortName}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{rule.description}</p>
                              {rule.keywords.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {rule.keywords.map((kw) => (
                                    <span key={kw} className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-[9px] text-zinc-600">
                                      {kw}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-4">
                              <button
                                onClick={() => openAssignRule(rule)}
                                className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-2.5 py-1 text-[11px] text-violet-400 hover:bg-violet-500/15 transition-colors"
                              >
                                Assign
                              </button>
                              <button
                                onClick={() => { setEditingRule(rule); setShowRuleEditor(true); }}
                                className="rounded-lg p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                              >
                                <Settings className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  deleteCustomRule(rule.id);
                                  toast({ title: "Deleted", description: `"${rule.title}" removed`, variant: "warning" });
                                }}
                                className="rounded-lg p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerContainer>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <ComplianceRuleEditor
        open={showRuleEditor}
        onClose={() => { setShowRuleEditor(false); setEditingRule(null); }}
        editingRule={editingRule}
      />
      <ComplianceAssignmentModal
        open={showAssignModal}
        onClose={() => { setShowAssignModal(false); setAssignRule(null); setAssignFrameworkId(null); }}
        preSelectedRule={assignRule}
        preSelectedFrameworkId={assignFrameworkId}
      />
    </PageTransition>
  );
}
