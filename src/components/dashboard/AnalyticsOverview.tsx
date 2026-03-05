"use client";

import { useMemo } from "react";
import { usePolicyStore, useAllFrameworks, useAllComplianceRules } from "@/store/policyStore";
import { BUILT_IN_RULES } from "@/lib/complianceData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Clock,
  Shield,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Target,
  XCircle,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRiskColor, formatDate } from "@/lib/utils";
import type { RiskLevel } from "@/types";

/* ── SVG Donut Chart ─────────────────────────────────── */

const RISK_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

function RiskDonut({
  data,
}: {
  data: { level: string; count: number; color: string }[];
}) {
  const total = data.reduce((a, d) => a + d.count, 0);
  if (total === 0) return null;

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="h-36 w-36">
      {data
        .filter((d) => d.count > 0)
        .map((d) => {
          const fraction = d.count / total;
          const dashLength = fraction * circumference;
          const gap = data.filter((dd) => dd.count > 0).length > 1 ? 2 : 0;
          const currentOffset = offset;
          offset += dashLength;
          return (
            <circle
              key={d.level}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${Math.max(dashLength - gap, 1)} ${circumference - Math.max(dashLength - gap, 1)}`}
              strokeDashoffset={-currentOffset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-700"
            />
          );
        })}
      <text
        x="50"
        y="46"
        textAnchor="middle"
        className="fill-white"
        fontSize="16"
        fontWeight="bold"
      >
        {total}
      </text>
      <text
        x="50"
        y="60"
        textAnchor="middle"
        className="fill-zinc-400"
        fontSize="7"
      >
        analyzed
      </text>
    </svg>
  );
}

/* ── Category Bar Chart ──────────────────────────────── */

function CategoryBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 truncate text-xs text-zinc-400">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="w-6 text-right text-xs font-medium text-zinc-300">
        {count}
      </span>
    </div>
  );
}

/* ── Activity Item ───────────────────────────────────── */

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface ActivityItem {
  id: string;
  type: "created" | "analyzed" | "error";
  title: string;
  timestamp: string;
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const iconMap = {
    created: <FileText className="h-3.5 w-3.5 text-blue-400" />,
    analyzed: <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />,
    error: <XCircle className="h-3.5 w-3.5 text-red-400" />,
  };
  const labelMap = {
    created: "Created",
    analyzed: "Analyzed",
    error: "Error",
  };

  return (
    <div className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02]">
      <div className="mt-0.5 shrink-0">{iconMap[item.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm text-white">{item.title}</p>
        <p className="text-xs text-zinc-500">
          {labelMap[item.type]} · {timeAgo(item.timestamp)}
        </p>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────── */

export function AnalyticsOverview({
  onSelectPolicy,
  onNewPolicy,
}: {
  onSelectPolicy: (id: string) => void;
  onNewPolicy: () => void;
}) {
  const { policies, folders, complianceAssignments, complianceResults } = usePolicyStore();
  const allFrameworks = useAllFrameworks();
  const allRulesGlobal = useAllComplianceRules();

  // Per-policy compliance stats for the overview
  const complianceOverview = useMemo(() => {
    const policyStats = policies.map((policy) => {
      // Find assignments relevant to this policy
      const relevantAssignments = complianceAssignments.filter((a) => {
        if (!a.enabled) return false;
        if (a.level === "policy" && a.targetId === policy.id) return true;
        if (a.level === "folder" && policy.folderId && a.targetId === policy.folderId) return true;
        if (a.level === "tag" && policy.tags.some((t) => t.name === a.targetId)) return true;
        return false;
      });

      const assignedRuleIds = new Set(relevantAssignments.map((a) => a.ruleId));
      const total = assignedRuleIds.size;
      if (total === 0) return null;

      let pass = 0, fail = 0, partial = 0;
      for (const ruleId of assignedRuleIds) {
        const result = complianceResults.find((r) => r.ruleId === ruleId && r.policyId === policy.id);
        if (result?.status === "pass") pass++;
        else if (result?.status === "fail") fail++;
        else if (result?.status === "partial") partial++;
      }
      const unchecked = total - pass - fail - partial;
      const score = Math.round(((pass + partial * 0.5) / total) * 100);

      // Which frameworks are active
      const activeFrameworkIds = new Set<string>();
      for (const ruleId of assignedRuleIds) {
        const rule = allRulesGlobal.find((r) => r.id === ruleId);
        if (rule) activeFrameworkIds.add(rule.frameworkId);
      }

      return {
        policyId: policy.id,
        policyTitle: policy.title,
        total, pass, fail, partial, unchecked, score,
        frameworkCount: activeFrameworkIds.size,
      };
    }).filter(Boolean) as { policyId: string; policyTitle: string; total: number; pass: number; fail: number; partial: number; unchecked: number; score: number; frameworkCount: number }[];

    const totalPoliciesWithCompliance = policyStats.length;
    const avgScore = totalPoliciesWithCompliance > 0
      ? Math.round(policyStats.reduce((a, p) => a + p.score, 0) / totalPoliciesWithCompliance)
      : 0;
    const totalRulesChecked = policyStats.reduce((a, p) => a + p.total, 0);
    const totalPass = policyStats.reduce((a, p) => a + p.pass, 0);
    const totalFail = policyStats.reduce((a, p) => a + p.fail, 0);
    const totalPartial = policyStats.reduce((a, p) => a + p.partial, 0);

    return { policyStats, totalPoliciesWithCompliance, avgScore, totalRulesChecked, totalPass, totalFail, totalPartial };
  }, [policies, complianceAssignments, complianceResults, allRulesGlobal]);

  const stats = useMemo(() => {
    const analyzed = policies.filter((p) => p.status === "analyzed");
    const withAnalysis = analyzed.filter((p) => p.analysis);
    const highRisk = withAnalysis.filter(
      (p) =>
        p.analysis!.riskLevel === "high" ||
        p.analysis!.riskLevel === "critical"
    );
    const avgScore =
      withAnalysis.length > 0
        ? Math.round(
            withAnalysis.reduce((a, p) => a + p.analysis!.riskScore, 0) /
              withAnalysis.length
          )
        : 0;

    const riskDist = (["low", "medium", "high", "critical"] as const).map(
      (level) => ({
        level,
        count: withAnalysis.filter((p) => p.analysis!.riskLevel === level)
          .length,
        color: RISK_COLORS[level],
      })
    );

    const categories = new Map<string, number>();
    policies.forEach((p) => {
      categories.set(p.category, (categories.get(p.category) || 0) + 1);
    });
    const categoryData = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }));

    // Activity timeline: derive from policy timestamps
    const activity: ActivityItem[] = [];
    policies.forEach((p) => {
      activity.push({
        id: p.id + "-created",
        type: "created",
        title: p.title,
        timestamp: p.createdAt,
      });
      if (p.analysis?.analyzedAt) {
        activity.push({
          id: p.id + "-analyzed",
          type: "analyzed",
          title: p.title,
          timestamp: p.analysis.analyzedAt,
        });
      }
      if (p.status === "error") {
        activity.push({
          id: p.id + "-error",
          type: "error",
          title: p.title,
          timestamp: p.updatedAt,
        });
      }
    });
    activity.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return {
      total: policies.length,
      analyzed: analyzed.length,
      highRisk: highRisk.length,
      avgScore,
      riskDist,
      categoryData,
      activity: activity.slice(0, 8),
      needsAttention: [
        ...policies.filter((p) => p.status === "error"),
        ...highRisk,
      ].slice(0, 5),
    };
  }, [policies]);

  const CATEGORY_COLORS = [
    "#8b5cf6",
    "#06b6d4",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#6366f1",
    "#f97316",
    "#14b8a6",
  ];

  if (policies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
          <BarChart3 className="h-10 w-10 text-violet-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">
          Welcome to your Dashboard
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">
          Submit your first policy to see analytics, risk assessments, and AI-powered
          insights here.
        </p>
        <Button variant="gradient" className="mt-6" onClick={onNewPolicy}>
          <Sparkles className="mr-1.5 h-4 w-4" />
          Submit Your First Policy
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-5">
      {/* ── Stats Grid ────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total Policies",
            value: stats.total,
            Icon: FileText,
            color: "text-zinc-400",
            bg: "bg-zinc-500/10",
          },
          {
            label: "Analyzed",
            value: stats.analyzed,
            Icon: CheckCircle,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "High Risk",
            value: stats.highRisk,
            Icon: AlertTriangle,
            color: "text-red-400",
            bg: "bg-red-500/10",
          },
          {
            label: "Avg. Score",
            value: stats.avgScore,
            Icon: TrendingUp,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
            suffix: "/100",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg",
                  s.bg
                )}
              >
                <s.Icon className={cn("h-3.5 w-3.5", s.color)} />
              </div>
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {s.value}
              {("suffix" in s) && (
                <span className="text-sm font-normal text-zinc-500">
                  {s.suffix}
                </span>
              )}
            </p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Risk Distribution */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <Shield className="h-4 w-4 text-violet-400" />
            Risk Distribution
          </h3>
          {stats.riskDist.some((d) => d.count > 0) ? (
            <div className="flex items-center gap-6">
              <RiskDonut data={stats.riskDist} />
              <div className="flex-1 space-y-2.5">
                {stats.riskDist.map((d) => (
                  <div key={d.level} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="flex-1 text-xs capitalize text-zinc-400">
                      {d.level}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <Shield className="mb-2 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">
                Analyze policies to see risk distribution
              </p>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
            <FolderOpen className="h-4 w-4 text-cyan-400" />
            Categories
          </h3>
          {stats.categoryData.length > 0 ? (
            <div className="space-y-3">
              {stats.categoryData.map((cat, i) => (
                <CategoryBar
                  key={cat.label}
                  label={cat.label}
                  count={cat.count}
                  max={stats.categoryData[0].count}
                  color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <FolderOpen className="mb-2 h-8 w-8 text-zinc-700" />
              <p className="text-sm text-zinc-500">No policies yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Compliance Health ─────────────────────── */}
      {complianceOverview.totalPoliciesWithCompliance > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-violet-400" />
              Compliance Health
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-zinc-500">{complianceOverview.totalPoliciesWithCompliance} policies with compliance</span>
              <span className={`text-lg font-bold ${complianceOverview.avgScore >= 70 ? "text-emerald-400" : complianceOverview.avgScore >= 40 ? "text-amber-400" : "text-red-400"}`}>
                {complianceOverview.avgScore}%
                <span className="text-xs font-normal text-zinc-500 ml-1">avg</span>
              </span>
            </div>
          </div>

          {/* Aggregate bar */}
          <div className="h-2.5 overflow-hidden rounded-full bg-zinc-800 mb-4">
            <div className="flex h-full">
              {complianceOverview.totalPass > 0 && <div className="bg-emerald-500 transition-all" style={{ width: `${(complianceOverview.totalPass / complianceOverview.totalRulesChecked) * 100}%` }} />}
              {complianceOverview.totalPartial > 0 && <div className="bg-amber-500 transition-all" style={{ width: `${(complianceOverview.totalPartial / complianceOverview.totalRulesChecked) * 100}%` }} />}
              {complianceOverview.totalFail > 0 && <div className="bg-red-500 transition-all" style={{ width: `${(complianceOverview.totalFail / complianceOverview.totalRulesChecked) * 100}%` }} />}
            </div>
          </div>

          {/* Per-policy rows */}
          <div className="space-y-2">
            {complianceOverview.policyStats
              .sort((a, b) => a.score - b.score)
              .slice(0, 6)
              .map((ps) => (
                <button
                  key={ps.policyId}
                  onClick={() => onSelectPolicy(ps.policyId)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/[0.04] bg-zinc-900/40 px-3 py-2.5 text-left transition-colors hover:border-white/[0.08] hover:bg-zinc-900/60"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{ps.policyTitle}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div className="flex h-full">
                        {ps.pass > 0 && <div className="bg-emerald-500" style={{ width: `${(ps.pass / ps.total) * 100}%` }} />}
                        {ps.partial > 0 && <div className="bg-amber-500" style={{ width: `${(ps.partial / ps.total) * 100}%` }} />}
                        {ps.fail > 0 && <div className="bg-red-500" style={{ width: `${(ps.fail / ps.total) * 100}%` }} />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-zinc-500">{ps.frameworkCount} fw</span>
                    <span className={`text-xs font-bold ${ps.score >= 70 ? "text-emerald-400" : ps.score >= 40 ? "text-amber-400" : ps.score > 0 ? "text-red-400" : "text-zinc-500"}`}>
                      {ps.score}%
                    </span>
                    <div className="flex items-center gap-1 text-[10px]">
                      <span className="text-emerald-400">{ps.pass}✓</span>
                      <span className="text-red-400">{ps.fail}✗</span>
                      <span className="text-amber-400">{ps.partial}~</span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* ── Bottom Row ────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Clock className="h-4 w-4 text-amber-400" />
            Recent Activity
          </h3>
          {stats.activity.length > 0 ? (
            <div className="space-y-0.5">
              {stats.activity.map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <p className="py-6 text-center text-sm text-zinc-500">
              No activity yet
            </p>
          )}
        </div>

        {/* Needs Attention */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
            <Target className="h-4 w-4 text-red-400" />
            Needs Attention
          </h3>
          {stats.needsAttention.length > 0 ? (
            <div className="space-y-2">
              {stats.needsAttention.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPolicy(p.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-white/[0.03]"
                >
                  {p.status === "error" ? (
                    <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-orange-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm text-white">{p.title}</p>
                    <p className="text-xs text-zinc-500">
                      {p.status === "error"
                        ? "Analysis failed"
                        : `Risk: ${p.analysis?.riskScore}/100`}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle className="mb-2 h-8 w-8 text-emerald-500/30" />
              <p className="text-sm text-zinc-500">
                All policies look good!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
