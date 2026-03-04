"use client";

import { useState } from "react";
import { usePolicyStore } from "@/store/policyStore";
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
} from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
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
  Target,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
          </div>
          <p className="text-sm text-zinc-300 mt-1">{finding.description}</p>
        </div>
      </div>
    </div>
  );
}

export function PolicyAnalysisView() {
  const { selectedPolicyId, policies, setStatus, setAnalysis, toggleFavorite } =
    usePolicyStore();
  const policy = policies.find((p) => p.id === selectedPolicyId);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "findings" | "recommendations">(
    "overview"
  );

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
      } else {
        setStatus(policy.id, "error");
      }
    } catch {
      setStatus(policy.id, "error");
    }
    setIsReanalyzing(false);
  };

  const wordCount = countWords(policy.content);
  const readingTime = estimateReadingTime(wordCount);

  const tabs = ["overview", "findings", "recommendations"] as const;

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

        {/* Tabs */}
        {policy.analysis && (
          <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit mt-4">
            {tabs.map((tab) => (
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
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {policy.status === "analyzing" ? (
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
        ) : policy.status === "error" ? (
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
        ) : policy.status === "draft" ? (
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
        ) : policy.analysis ? (
          <div className="space-y-6">
            {activeTab === "overview" && (
              <>
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
                  policy.analysis.keyFindings.map((finding) => (
                    <FindingCard key={finding.id} finding={finding} />
                  ))
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
      </div>
    </div>
  );
}
