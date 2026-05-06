"use client";

import { useState, useMemo } from "react";
import {
  usePolicyStore,
  useEffectiveRulesForPolicy,
  usePolicyComplianceStats,
  useAllFrameworks,
  useAllComplianceRules,
} from "@/store/policyStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import type { PolicyFinding, RiskLevel } from "@/types";
import {
  getRiskBg,
  getRiskColor,
  formatDate,
  formatTime,
  countWords,
  estimateReadingTime,
  calcReadingLevel,
} from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  XCircle as XCircleIcon,
  Info,
  Lightbulb,
  RefreshCw,
  Loader2,
  Star,
  StarOff,
  Tag,
  Folder,
  Clock,
  FileText,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  Download,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportAnalysisReport } from "@/lib/exportReport";
import { autoScorePolicy } from "@/lib/autoScore";
import { useToast } from "@/components/ui/Toast";
import { ReviewTimeline } from "@/components/policy/ReviewTimeline";

function RiskGauge({ score, level }: { score: number; level: RiskLevel }) {
  const colorMap: Record<RiskLevel, string> = {
    low: "text-emerald-400",
    medium: "text-amber-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };
  const bgMap: Record<RiskLevel, string> = {
    low: "bg-emerald-500",
    medium: "bg-amber-500",
    high: "bg-orange-500",
    critical: "bg-red-500",
  };
  const progressColor: Record<RiskLevel, "emerald" | "amber" | "red" | "violet" | "blue"> = {
    low: "emerald",
    medium: "amber",
    high: "red",
    critical: "red",
  };

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-white/10 bg-white/2">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="12"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={
              level === "low"
                ? "#10b981"
                : level === "medium"
                ? "#f59e0b"
                : level === "high"
                ? "#f97316"
                : "#ef4444"
            }
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 314} 314`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-3xl font-bold", colorMap[level])}>
            {score}
          </span>
          <span className="text-xs text-zinc-400">Risk Score</span>
        </div>
      </div>
      <div className={cn("text-sm font-semibold uppercase tracking-wider", colorMap[level])}>
        {level} Risk
      </div>
    </div>
  );
}

function FindingIcon({ type }: { type: PolicyFinding["type"] }) {
  switch (type) {
    case "risk":
      return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    case "requirement":
      return <Target className="w-4 h-4 text-blue-400" />;
    case "recommendation":
      return <Lightbulb className="w-4 h-4 text-amber-400" />;
    case "compliance":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  }
}

function FindingCard({ finding }: { finding: PolicyFinding }) {
  const [aiRewrite, setAiRewrite] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleRewrite = async () => {
    setLoading(true);
    setAiRewrite(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "rewrite",
          clause: finding.description,
          title: finding.title,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiRewrite(data.rewrite || "No suggestion returned.");
      } else {
        setAiRewrite("Error: Could not get rewrite.");
      }
    } catch {
      setAiRewrite("Error: Could not reach server.");
    }
    setLoading(false);
  };
  return (
    <div
      className={cn(
        "p-4 rounded-xl border space-y-2",
        getRiskBg(finding.severity)
      )}
    >
      <div className="flex items-start gap-2">
        <FindingIcon type={finding.type} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-white">
              {finding.title}
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full border",
                getRiskBg(finding.severity)
              )}
            >
              {finding.severity}
            </span>
            {finding.section && (
              <span className="text-xs text-zinc-500">§ {finding.section}</span>
            )}
            <button
              className="ml-2 px-2 py-0.5 rounded bg-violet-600 text-xs text-white hover:bg-violet-700 transition-colors"
              onClick={handleRewrite}
              disabled={loading}
            >
              {loading ? "Rewriting..." : "Rewrite"}
            </button>
          </div>
          <p className="text-sm text-zinc-300 mt-1">{finding.description}</p>
          {aiRewrite && (
            <div className="mt-3 p-3 rounded bg-zinc-800 border border-violet-500/30 text-xs text-violet-200">
              <span className="font-semibold text-violet-400">AI Suggestion:</span>
              <br />
              {aiRewrite}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PolicyAnalysisView() {
  const { selectedPolicyId, policies, setStatus, setAnalysis, toggleFavorite, setComplianceResult } =
    usePolicyStore();
  const policy = policies.find((p) => p.id === selectedPolicyId);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "findings" | "recommendations" | "reviews" | "search">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPage, setSearchPage] = useState(0);
  const [searchIndex, setSearchIndex] = useState(0);
  const [expandedComplianceFw, setExpandedComplianceFw] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Compliance data for the selected policy
  const complianceStats = usePolicyComplianceStats(selectedPolicyId || "");
  const effective = useEffectiveRulesForPolicy(selectedPolicyId || "");
  const allFrameworks = useAllFrameworks();
  const allRulesGlobal = useAllComplianceRules();

  const frameworkScores = useMemo(() => {
    if (!selectedPolicyId) return [];
    return allFrameworks
      .map((fw) => {
        const fwRuleIds = new Set(allRulesGlobal.filter((r) => r.frameworkId === fw.id).map((r) => r.id));
        const assigned = effective.filter((e) => fwRuleIds.has(e.rule.id));
        if (assigned.length === 0) return null;
        const pass = assigned.filter((e) => e.result?.status === "pass").length;
        const fail = assigned.filter((e) => e.result?.status === "fail").length;
        const partial = assigned.filter((e) => e.result?.status === "partial").length;
        const unchecked = assigned.length - pass - fail - partial;
        const score = Math.round(((pass + partial * 0.5) / assigned.length) * 100);
        // Per-rule details for expandable view
        const rules = assigned.map((e) => ({
          id: e.rule.id,
          title: e.rule.title,
          section: e.rule.section,
          status: (e.result?.status || "unchecked") as "pass" | "fail" | "partial" | "unchecked",
          note: e.result?.note || null,
        }));
        return { fw, total: assigned.length, pass, fail, partial, unchecked, score, rules };
      })
      .filter(Boolean) as { fw: typeof allFrameworks[0]; total: number; pass: number; fail: number; partial: number; unchecked: number; score: number; rules: { id: string; title: string; section?: string; status: "pass" | "fail" | "partial" | "unchecked"; note: string | null }[] }[];
  }, [selectedPolicyId, allFrameworks, allRulesGlobal, effective]);

  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
          <FileText className="w-10 h-10 text-violet-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Select a Policy
        </h3>
        <p className="text-zinc-400 max-w-sm">
          Choose a policy from the sidebar or submit a new one to view its
          AI-powered analysis.
        </p>
      </div>
    );
  }

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    setStatus(policy.id, "analyzing");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: policy.id,
          content: policy.content,
          title: policy.title,
        }),
      });
      if (res.ok) {
        const analysis = await res.json();
        setAnalysis(policy.id, analysis);
        toast({ title: "Analysis complete", description: `Risk score: ${analysis.riskScore}/100`, variant: "success" });
      } else {
        setStatus(policy.id, "error");
        toast({ title: "Analysis failed", description: "Check your API configuration", variant: "error" });
      }
    } catch {
      setStatus(policy.id, "error");
      toast({ title: "Connection error", description: "Could not reach the server", variant: "error" });
    }

    // Auto-score all active compliance rules against this policy
    if (effective.length > 0) {
      const activeRules = effective.map((e) => e.rule);
      const results = autoScorePolicy(policy.content, activeRules);
      for (const r of results) {
        setComplianceResult(r.ruleId, policy.id, r.status, r.note);
      }
    }

    setIsReanalyzing(false);
  };

  const handleExport = () => {
    if (!policy?.analysis) return;
    exportAnalysisReport(policy);
    toast({ title: "Report exported", description: `${policy.title} report downloaded`, variant: "success" });
  };

  const wordCount = countWords(policy.content);
  const readingTime = estimateReadingTime(wordCount);

  const tabs = ["overview", "findings", "recommendations", "search", "reviews"] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-white/5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {policy.title}
            </h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge variant="outline">{policy.category}</Badge>
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <FileText className="w-3 h-3" />
                {wordCount.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-400">
                <Clock className="w-3 h-3" />
                ~{readingTime} min read
              </span>
              <span className="text-xs text-zinc-500">
                Added {formatDate(policy.createdAt)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => toggleFavorite(policy.id)}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              title={policy.isFavorite ? "Remove favorite" : "Add to favorites"}
            >
              {policy.isFavorite ? (
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              ) : (
                <StarOff className="w-5 h-5 text-zinc-400" />
              )}
            </button>
            {policy.analysis && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                title="Export report"
              >
                <Download className="w-4 h-4" />
                <span className="ml-1.5 hidden sm:inline">Export</span>
              </Button>
            )}
            {policy.status !== "analyzing" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReanalyze}
                disabled={isReanalyzing}
              >
                {isReanalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-1.5">Re-analyze</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tags */}
        {policy.tags.length > 0 && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <Tag className="w-3.5 h-3.5 text-zinc-500 mt-0.5" />
            {policy.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: tag.color + "20",
                  borderColor: tag.color + "40",
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Tabs — always visible */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit mt-4 flex-wrap">
          {tabs.map((tab) => {
            // hide analysis-only tabs when policy has no analysis
            if (!policy.analysis && tab !== "reviews" && tab !== "search") return null;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize",
                  activeTab === tab
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                {tab === "search" ? "Search" : tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "search" ? (
          <div className="space-y-6">
            <div className="max-w-lg mx-auto mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setSearchPage(0);
                  setSearchIndex(0);
                }}
                placeholder="Search policy text..."
                className="w-full px-4 py-2 rounded-lg bg-zinc-900 text-white border border-white/10 focus:border-violet-500 outline-none text-sm"
              />
            </div>
            {policy.pageContents && policy.pageContents.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-zinc-400">Page</span>
                  <button
                    className="px-2 py-0.5 rounded bg-zinc-800 text-white"
                    onClick={() => setSearchPage(p => Math.max(0, p - 1))}
                    disabled={searchPage === 0}
                  >Prev</button>
                  <span className="font-bold text-violet-400">{searchPage + 1}</span>
                  <span className="text-xs text-zinc-400">of {policy.pageContents?.length ?? 0}</span>
                  <button
                    className="px-2 py-0.5 rounded bg-zinc-800 text-white"
                    onClick={() => setSearchPage(p => Math.min((policy.pageContents?.length ?? 1) - 1, p + 1))}
                    disabled={searchPage === (policy.pageContents?.length ?? 1) - 1}
                  >Next</button>
                  {searchQuery && (
                    <span className="ml-4 text-xs text-violet-400 font-semibold">
                      {(() => {
                        const pageText = policy.pageContents[searchPage];
                        return pageText.split(new RegExp(searchQuery, "gi")).length - 1;
                      })()} matches
                    </span>
                  )}
                </div>
                <div className="rounded-xl border border-white/10 bg-white/2 p-4 whitespace-pre-wrap text-sm text-zinc-200">
                  {searchQuery
                    ? (() => {
                        const pageText = policy.pageContents[searchPage];
                        const parts = pageText.split(new RegExp(`(${searchQuery})`, "gi"));
                        return parts.map((part, i) => {
                          if (searchQuery && part.toLowerCase() === searchQuery.toLowerCase()) {
                            return (
                              <span
                                key={i}
                                className="bg-violet-600 text-white rounded px-1 py-0.5"
                              >{part}</span>
                            );
                          }
                          return <span key={i}>{part}</span>;
                        });
                      })()
                    : policy.pageContents[searchPage]}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-white/2 p-4 whitespace-pre-wrap text-sm text-zinc-200">
                {searchQuery
                  ? (() => {
                      const parts = policy.content.split(new RegExp(`(${searchQuery})`, "gi"));
                      return parts.map((part, i) => {
                        if (searchQuery && part.toLowerCase() === searchQuery.toLowerCase()) {
                          return (
                            <span
                              key={i}
                              className="bg-violet-600 text-white rounded px-1 py-0.5"
                            >{part}</span>
                          );
                        }
                        return <span key={i}>{part}</span>;
                      });
                    })()
                  : policy.content}
              </div>
            )}
          </div>
        ) : activeTab !== "reviews" && policy.status === "analyzing" ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Analyzing Policy...</p>
              <p className="text-zinc-400 text-sm mt-1">
                AI is reviewing your policy for risks, compliance, and
                recommendations.
              </p>
            </div>
          </div>
        ) : activeTab !== "reviews" && policy.status === "error" ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium">Analysis Failed</p>
              <p className="text-zinc-400 text-sm mt-1">
                Could not analyze this policy. Check your API configuration.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={handleReanalyze}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        ) : activeTab !== "reviews" && policy.status === "draft" ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center h-40 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <FileText className="w-8 h-8 text-zinc-500" />
              </div>
              <div className="text-center">
                <p className="text-white font-medium">Not Yet Analyzed</p>
                <p className="text-zinc-400 text-sm mt-1">
                  Run analysis to get AI-powered insights.
                </p>
                <Button
                  variant="gradient"
                  size="sm"
                  className="mt-3"
                  onClick={handleReanalyze}
                >
                  Analyze Now
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-white/5 p-4 bg-white/2">
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                {policy.content}
              </p>
            </div>
          </div>
        ) : activeTab !== "reviews" && policy.analysis ? (
          <div className="space-y-6">
            {activeTab === "overview" && (
              <>
                {/* Reading Level banner — always shown in overview */}
                {(() => {
                  const rl = calcReadingLevel(policy.content);
                  return (
                    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/2 px-5 py-3">
                      <BookOpen className={`w-5 h-5 shrink-0 ${rl.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-zinc-400">Reading Level</span>
                          <span className={`text-xs font-semibold ${rl.color}`}>{rl.label} · Grade {rl.grade}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              rl.ease >= 70 ? "bg-emerald-500" : rl.ease >= 50 ? "bg-blue-500" : rl.ease >= 30 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${rl.ease}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-lg font-bold leading-none ${rl.color}`}>{rl.ease}</div>
                        <div className="text-[10px] text-zinc-600 mt-0.5">ease score</div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RiskGauge
                    score={policy.analysis.riskScore}
                    level={policy.analysis.riskLevel}
                  />

                  <div className="grid grid-rows-2 gap-3">
                    <div className="p-4 rounded-xl border border-white/10 bg-white/2">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-zinc-300">
                          Compliance Status
                        </span>
                      </div>
                      <p className="text-sm text-white">
                        {policy.analysis.complianceStatus}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl border border-white/10 bg-white/2">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-violet-400" />
                        <span className="text-sm font-medium text-zinc-300">
                          Key Metrics
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-zinc-500">Findings</span>
                          <p className="text-white font-semibold">
                            {policy.analysis.keyFindings.length}
                          </p>
                        </div>
                        <div>
                          <span className="text-zinc-500">Recommendations</span>
                          <p className="text-white font-semibold">
                            {policy.analysis.recommendations.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Info className="w-4 h-4 text-violet-400" />
                      AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                      {policy.analysis.summary}
                    </p>
                    <p className="text-xs text-zinc-600 mt-3">
                      Analyzed {formatDate(policy.analysis.analyzedAt)} at{" "}
                      {formatTime(policy.analysis.analyzedAt)}
                    </p>
                  </CardContent>
                </Card>

                {/* ── Compliance Scorecard ──────────── */}
                {frameworkScores.length > 0 && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
                        <ShieldCheck className="h-4 w-4 text-violet-400" />
                        Active Compliance
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${complianceStats.score >= 70 ? "text-emerald-400" : complianceStats.score >= 40 ? "text-amber-400" : "text-red-400"}`}>
                          {complianceStats.score}%
                        </span>
                        <span className="text-[10px] text-zinc-500">overall</span>
                      </div>
                    </div>

                    {/* Overall progress bar */}
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-800 mb-4">
                      <div className="flex h-full">
                        {complianceStats.pass > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${(complianceStats.pass / complianceStats.total) * 100}%` }} />}
                        {complianceStats.partial > 0 && <div className="bg-amber-500 transition-all duration-500" style={{ width: `${(complianceStats.partial / complianceStats.total) * 100}%` }} />}
                        {complianceStats.fail > 0 && <div className="bg-red-500 transition-all duration-500" style={{ width: `${(complianceStats.fail / complianceStats.total) * 100}%` }} />}
                      </div>
                    </div>

                    {/* Per-framework rows — click to expand per-rule detail */}
                    <div className="space-y-2.5">
                      {frameworkScores.map(({ fw, total, pass, fail, partial, unchecked, score, rules }) => {
                        const fwColor = fw.color.replace("bg-", "text-");
                        const isExpanded = expandedComplianceFw.has(fw.id);
                        const toggleFwExpand = () => {
                          setExpandedComplianceFw((prev) => {
                            const next = new Set(prev);
                            if (next.has(fw.id)) next.delete(fw.id);
                            else next.add(fw.id);
                            return next;
                          });
                        };
                        return (
                          <div key={fw.id} className="overflow-hidden rounded-lg border border-white/[0.04] bg-zinc-900/40">
                            <button
                              onClick={toggleFwExpand}
                              className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
                            >
                              <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${fwColor} bg-zinc-800`}>
                                {fw.shortName}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-zinc-300 truncate">{fw.name}</span>
                                  <span className={`text-xs font-semibold ${score >= 70 ? "text-emerald-400" : score >= 40 ? "text-amber-400" : score > 0 ? "text-red-400" : "text-zinc-500"}`}>
                                    {score}%
                                  </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                                  <div className="flex h-full">
                                    {pass > 0 && <div className="bg-emerald-500" style={{ width: `${(pass / total) * 100}%` }} />}
                                    {partial > 0 && <div className="bg-amber-500" style={{ width: `${(partial / total) * 100}%` }} />}
                                    {fail > 0 && <div className="bg-red-500" style={{ width: `${(fail / total) * 100}%` }} />}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
                                <span className="flex items-center gap-0.5 text-emerald-400"><CheckCircle2 className="h-3 w-3" />{pass}</span>
                                <span className="flex items-center gap-0.5 text-amber-400"><AlertTriangle className="h-3 w-3" />{partial}</span>
                                <span className="flex items-center gap-0.5 text-red-400"><XCircleIcon className="h-3 w-3" />{fail}</span>
                                {unchecked > 0 && <span className="flex items-center gap-0.5 text-zinc-600"><HelpCircle className="h-3 w-3" />{unchecked}</span>}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                              )}
                            </button>

                            {/* Per-rule breakdown */}
                            {isExpanded && (
                              <div className="border-t border-white/[0.03] px-3 py-2 space-y-1">
                                {rules.map((r) => {
                                  const statusColor = r.status === "pass" ? "text-emerald-400"
                                    : r.status === "fail" ? "text-red-400"
                                    : r.status === "partial" ? "text-amber-400"
                                    : "text-zinc-600";
                                  const StatusIcon = r.status === "pass" ? CheckCircle2
                                    : r.status === "fail" ? XCircleIcon
                                    : r.status === "partial" ? AlertTriangle
                                    : HelpCircle;
                                  return (
                                    <div key={r.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white/[0.02]">
                                      <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${statusColor}`} />
                                      <span className={`text-xs flex-1 truncate ${r.status === "pass" ? "text-zinc-500 line-through" : "text-zinc-300"}`}>
                                        {r.title}
                                      </span>
                                      {r.section && (
                                        <span className="text-[9px] text-zinc-600 shrink-0">§{r.section}</span>
                                      )}
                                      <span className={`text-[10px] font-medium shrink-0 ${statusColor}`}>
                                        {r.status}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-[10px] text-zinc-600">
                      Toggle frameworks on/off in the Organize tab · {complianceStats.total} rules across {frameworkScores.length} frameworks
                    </p>
                  </div>
                )}
              </>
            )}

            {activeTab === "findings" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-zinc-300">
                    {policy.analysis.keyFindings.length} Key Findings
                  </h3>
                  <div className="flex gap-2">
                    {(["risk", "requirement", "recommendation", "compliance"] as const).map(
                      (type) => {
                        const count = policy.analysis!.keyFindings.filter(
                          (f) => f.type === type
                        ).length;
                        if (count === 0) return null;
                        return (
                          <span
                            key={type}
                            className="text-xs text-zinc-400 capitalize"
                          >
                            {count} {type}
                          </span>
                        );
                      }
                    )}
                  </div>
                </div>
                {policy.analysis.keyFindings.length === 0 ? (
                  <p className="text-zinc-400 text-sm text-center py-8">
                    No findings identified.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {policy.analysis.keyFindings.map((finding) => (
                      <FindingCard key={finding.id} finding={finding} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "recommendations" && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-zinc-300">
                  {policy.analysis.recommendations.length} Recommendations
                </h3>
                {policy.analysis.recommendations.length === 0 ? (
                  <p className="text-zinc-400 text-sm text-center py-8">
                    No recommendations at this time.
                  </p>
                ) : (
                  policy.analysis.recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-white/10 bg-white/2 flex gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-violet-400">
                          {i + 1}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300">{rec}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Reviews tab — always rendered regardless of analysis state */}
        {activeTab === "reviews" && (
          <ReviewTimeline policyId={policy.id} />
        )}
      </div>
    </div>
  );
}
