"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePolicyStore, usePolicyComplianceStats } from "@/store/policyStore";
import { PolicyChat } from "@/components/policy/PolicyChat";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { exportAnalysisReport } from "@/lib/exportReport";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/Animations";
import { Footer } from "@/components/layout/Footer";
import { PolicyComplianceChecklist } from "@/components/compliance/PolicyComplianceChecklist";
import {
  ArrowLeft,
  BarChart3,
  MessageSquare,
  FileText,
  Tag,
  Folder,
  Star,
  StarOff,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Lightbulb,
  Target,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Clock,
  ChevronRight,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getRiskColor,
  getRiskBg,
  formatDate,
  formatTime,
  countWords,
  estimateReadingTime,
} from "@/lib/utils";
import type { PolicyFinding, RiskLevel } from "@/types";

function FindingIcon({ type }: { type: PolicyFinding["type"] }) {
  switch (type) {
    case "risk":
      return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    case "requirement":
      return <Target className="h-4 w-4 text-blue-400" />;
    case "recommendation":
      return <Lightbulb className="h-4 w-4 text-amber-400" />;
    case "compliance":
      return <CheckCircle className="h-4 w-4 text-emerald-400" />;
  }
}

type TabId = "overview" | "findings" | "recommendations" | "compliance" | "chat" | "content";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "findings", label: "Findings", icon: AlertTriangle },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
  { id: "chat", label: "Q&A Chat", icon: MessageSquare },
  { id: "content", label: "Raw Content", icon: Eye },
];

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const policyId = params.id as string;
  const {
    policies,
    selectPolicy,
    toggleFavorite,
    setStatus,
    setAnalysis,
  } = usePolicyStore();
  const policy = policies.find((p) => p.id === policyId);
  const complianceStats = usePolicyComplianceStats(policyId);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Select this policy so the chat component works
  useEffect(() => {
    if (policy && policyId) {
      selectPolicy(policyId);
    }
  }, [policy, policyId, selectPolicy]);

  if (!policy) {
    return (
      <PageTransition>
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-4 py-32 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800">
            <FileText className="h-8 w-8 text-zinc-500" />
          </div>
          <h1 className="text-xl font-semibold text-white">
            Policy Not Found
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            This policy may have been deleted or the link is invalid.
          </p>
          <Link href="/dashboard">
            <Button variant="gradient" className="mt-6">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <Footer />
      </PageTransition>
    );
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
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
        toast({
          title: "Analysis complete",
          description: `Risk score: ${analysis.riskScore}/100`,
          variant: "success",
        });
      } else {
        setStatus(policy.id, "error");
        toast({
          title: "Analysis failed",
          variant: "error",
        });
      }
    } catch {
      setStatus(policy.id, "error");
      toast({ title: "Connection error", variant: "error" });
    }
    setIsAnalyzing(false);
  };

  const handleExport = () => {
    if (!policy.analysis) return;
    exportAnalysisReport(policy);
    toast({
      title: "Report exported",
      description: `${policy.title} report downloaded`,
      variant: "success",
    });
  };

  const a = policy.analysis;
  const wordCount = countWords(policy.content);
  const readingTime = estimateReadingTime(wordCount);

  const riskColorMap: Record<RiskLevel, string> = {
    low: "text-emerald-400",
    medium: "text-amber-400",
    high: "text-orange-400",
    critical: "text-red-400",
  };

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── Breadcrumb ─────────────────────────── */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
          <Link
            href="/dashboard"
            className="transition-colors hover:text-white"
          >
            Dashboard
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link
            href="/analyze"
            className="transition-colors hover:text-white"
          >
            Analysis
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-zinc-300">{policy.title}</span>
        </nav>

        {/* ── Header ─────────────────────────────── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="truncate text-2xl font-bold text-white">
                {policy.title}
              </h1>
              <button
                onClick={() => toggleFavorite(policy.id)}
                className="shrink-0"
              >
                {policy.isFavorite ? (
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                ) : (
                  <StarOff className="h-5 w-5 text-zinc-500 hover:text-amber-400 transition-colors" />
                )}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{policy.category}</Badge>
              <Badge
                variant={
                  policy.status === "analyzed"
                    ? "success"
                    : policy.status === "error"
                    ? "danger"
                    : policy.status === "analyzing"
                    ? "warning"
                    : "outline"
                }
              >
                {policy.status}
              </Badge>
              {a && (
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    getRiskBg(a.riskLevel)
                  )}
                >
                  {a.riskLevel.charAt(0).toUpperCase() + a.riskLevel.slice(1)}{" "}
                  Risk — {a.riskScore}/100
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <FileText className="h-3 w-3" />
                {wordCount.toLocaleString()} words
              </span>
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Clock className="h-3 w-3" />~{readingTime} min read
              </span>
              <span className="text-xs text-zinc-600">
                Added {formatDate(policy.createdAt)}
              </span>
            </div>
            {/* Tags */}
            {policy.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Tag className="h-3.5 w-3.5 text-zinc-500 mt-0.5" />
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
          </div>

          <div className="flex shrink-0 gap-2">
            {a && (
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              )}
              {a ? "Re-analyze" : "Analyze"}
            </Button>
          </div>
        </div>

        {/* ── Tabs ────────────────────────────────── */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg bg-white/[0.03] p-1 border border-white/[0.06]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              )}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === "findings" && a && (
                <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                  {a.keyFindings.length}
                </span>
              )}
              {tab.id === "compliance" && complianceStats.total > 0 && (
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  complianceStats.score >= 70 ? "bg-emerald-500/20 text-emerald-400" :
                  complianceStats.score >= 40 ? "bg-amber-500/20 text-amber-400" :
                  "bg-red-500/20 text-red-400"
                }`}>
                  {complianceStats.score}%
                </span>
              )}
              {tab.id === "chat" && policy.chatHistory.length > 0 && (
                <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">
                  {policy.chatHistory.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab Content ────────────────────────── */}
        <div className="min-h-[500px]">
          {/* Overview */}
          {activeTab === "overview" && (
            <>
              {policy.status === "analyzing" && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="h-10 w-10 text-violet-400 animate-spin" />
                  <p className="text-white font-medium">Analyzing…</p>
                </div>
              )}
              {policy.status === "draft" && (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-zinc-500" />
                  </div>
                  <p className="text-white font-medium">Not Yet Analyzed</p>
                  <p className="text-sm text-zinc-400">
                    Run analysis to get AI-powered insights.
                  </p>
                  <Button variant="gradient" onClick={handleAnalyze}>
                    <Lightbulb className="h-4 w-4 mr-1.5" />
                    Analyze Now
                  </Button>
                </div>
              )}
              {policy.status === "error" && (
                <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-white font-medium">Analysis Failed</p>
                  <Button variant="outline" onClick={handleAnalyze}>
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Try Again
                  </Button>
                </div>
              )}
              {a && (
                <div className="grid gap-5 md:grid-cols-3">
                  {/* Risk gauge */}
                  <div className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
                    <div className="relative flex h-32 w-32 items-center justify-center">
                      <svg
                        className="-rotate-90"
                        viewBox="0 0 120 120"
                        width="128"
                        height="128"
                      >
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
                            a.riskLevel === "low"
                              ? "#10b981"
                              : a.riskLevel === "medium"
                              ? "#f59e0b"
                              : a.riskLevel === "high"
                              ? "#f97316"
                              : "#ef4444"
                          }
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${(a.riskScore / 100) * 314} 314`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className={cn(
                            "text-3xl font-bold",
                            riskColorMap[a.riskLevel]
                          )}
                        >
                          {a.riskScore}
                        </span>
                        <span className="text-xs text-zinc-400">
                          Risk Score
                        </span>
                      </div>
                    </div>
                    <p
                      className={cn(
                        "mt-3 text-sm font-semibold uppercase tracking-wider",
                        riskColorMap[a.riskLevel]
                      )}
                    >
                      {a.riskLevel} Risk
                    </p>
                  </div>

                  {/* Summary & Compliance */}
                  <div className="space-y-4 md:col-span-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                      <div className="mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4 text-violet-400" />
                        <span className="text-sm font-medium text-white">
                          AI Summary
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-zinc-300">
                        {a.summary}
                      </p>
                      <p className="mt-3 text-xs text-zinc-600">
                        Analyzed {formatDate(a.analyzedAt)} at{" "}
                        {formatTime(a.analyzedAt)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4 text-blue-400" />
                          <span className="text-xs font-medium text-zinc-400">
                            Compliance
                          </span>
                        </div>
                        <p className="text-sm text-white">
                          {a.complianceStatus}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-violet-400" />
                          <span className="text-xs font-medium text-zinc-400">
                            Key Metrics
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-zinc-500">Findings</span>
                            <p className="text-lg font-bold text-white">
                              {a.keyFindings.length}
                            </p>
                          </div>
                          <div>
                            <span className="text-zinc-500">Recs</span>
                            <p className="text-lg font-bold text-white">
                              {a.recommendations.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Findings */}
          {activeTab === "findings" && (
            <div className="space-y-3">
              {!a ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  Analyze this policy to see findings.
                </p>
              ) : a.keyFindings.length === 0 ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  No findings identified.
                </p>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {(
                      [
                        "risk",
                        "requirement",
                        "recommendation",
                        "compliance",
                      ] as const
                    ).map((type) => {
                      const count = a.keyFindings.filter(
                        (f) => f.type === type
                      ).length;
                      if (!count) return null;
                      return (
                        <span
                          key={type}
                          className="rounded-full bg-white/[0.04] px-3 py-1 text-xs capitalize text-zinc-400"
                        >
                          {count} {type}
                        </span>
                      );
                    })}
                  </div>
                  {a.keyFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className={cn(
                        "rounded-xl border p-4 space-y-2",
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
                              <span className="text-xs text-zinc-500">
                                § {finding.section}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-300 mt-1">
                            {finding.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Recommendations */}
          {activeTab === "recommendations" && (
            <div className="space-y-3">
              {!a ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  Analyze this policy to see recommendations.
                </p>
              ) : a.recommendations.length === 0 ? (
                <p className="py-16 text-center text-sm text-zinc-500">
                  No recommendations at this time.
                </p>
              ) : (
                a.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20">
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

          {/* Chat */}
          {activeTab === "chat" && (
            <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]" style={{ height: 540 }}>
              <PolicyChat />
            </div>
          )}

          {/* Compliance */}
          {activeTab === "compliance" && (
            <PolicyComplianceChecklist policyId={policyId} />
          )}

          {/* Raw Content */}
          {activeTab === "content" && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-zinc-300">
                  Policy Content
                </h3>
                <span className="text-xs text-zinc-500">
                  {wordCount.toLocaleString()} words · ~{readingTime} min read
                </span>
              </div>
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap rounded-lg bg-black/30 p-5 text-sm leading-relaxed text-zinc-300 font-sans border border-white/[0.04]">
                  {policy.content}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </PageTransition>
  );
}
