"use client";

import { useState, useMemo } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { Footer } from "@/components/layout/Footer";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/Animations";
import {
  GitCompareArrows,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  TrendingUp,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Minus,
  FileText,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Policy, RiskLevel } from "@/types";
import { getRiskColor, formatDate } from "@/lib/utils";
import { PolicySubmitForm } from "@/components/policy/PolicySubmitForm";

function MiniGauge({ score, level }: { score: number; level: RiskLevel }) {
  const color =
    level === "low"
      ? "#10b981"
      : level === "medium"
      ? "#f59e0b"
      : level === "high"
      ? "#f97316"
      : "#ef4444";

  return (
    <div className="flex items-center gap-3">
      <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 138.2} 138.2`}
          className="transition-all duration-700"
        />
      </svg>
      <div>
        <p className={cn("text-2xl font-bold", getRiskColor(level))}>{score}</p>
        <p className="text-[11px] uppercase tracking-wider text-zinc-500">{level} risk</p>
      </div>
    </div>
  );
}

function DiffBadge({ diff }: { diff: number }) {
  if (diff === 0) return <Minus className="h-3.5 w-3.5 text-zinc-500" />;
  if (diff > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-red-400">
        <ArrowUp className="h-3 w-3" />+{diff}
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-400">
      <ArrowDown className="h-3 w-3" />{diff}
    </span>
  );
}

function PolicyColumn({ policy, other }: { policy: Policy | null; other: Policy | null }) {
  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-24 text-center">
        <GitCompareArrows className="mb-3 h-10 w-10 text-zinc-700" />
        <p className="text-sm text-zinc-500">Select a policy above</p>
      </div>
    );
  }

  const a = policy.analysis;
  const oA = other?.analysis;
  const scoreDiff = a && oA ? a.riskScore - oA.riskScore : null;

  return (
    <div className="space-y-4">
      {/* Title card */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="text-base font-semibold text-white truncate">{policy.title}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="outline">{policy.category}</Badge>
          <Badge
            variant={
              policy.status === "analyzed"
                ? "success"
                : policy.status === "error"
                ? "danger"
                : "outline"
            }
          >
            {policy.status}
          </Badge>
          <span className="text-[11px] text-zinc-500">
            {formatDate(policy.createdAt)}
          </span>
        </div>
      </div>

      {a ? (
        <>
          {/* Risk score */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between">
              <MiniGauge score={a.riskScore} level={a.riskLevel} />
              {scoreDiff !== null && (
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">
                    vs other
                  </span>
                  <DiffBadge diff={scoreDiff} />
                </div>
              )}
            </div>
          </div>

          {/* Compliance */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-zinc-400">Compliance</span>
            </div>
            <p className="text-sm text-zinc-300">{a.complianceStatus}</p>
          </div>

          {/* Summary */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-zinc-400">Summary</span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-300">{a.summary}</p>
          </div>

          {/* Findings summary */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-400" />
              <span className="text-xs font-medium text-zinc-400">
                Findings ({a.keyFindings.length})
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["critical", "high", "medium", "low"] as const).map((sev) => {
                const count = a.keyFindings.filter((f) => f.severity === sev).length;
                return (
                  <div key={sev} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-1.5">
                    <span className={cn("text-xs capitalize", getRiskColor(sev))}>{sev}</span>
                    <span className="text-sm font-semibold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-zinc-400">
                Recommendations ({a.recommendations.length})
              </span>
            </div>
            <ul className="space-y-1.5">
              {a.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-400">
                  <span className="mt-0.5 shrink-0 text-xs font-bold text-violet-400">{i + 1}.</span>
                  <span className="line-clamp-2">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center py-12 text-center">
          <FileText className="mb-2 h-8 w-8 text-zinc-700" />
          <p className="text-sm text-zinc-500">Not yet analyzed</p>
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const { policies, selectPolicy } = usePolicyStore();
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const analyzedPolicies = policies.filter((p) => p.status === "analyzed");

  const leftPolicy = policies.find((p) => p.id === leftId) ?? null;
  const rightPolicy = policies.find((p) => p.id === rightId) ?? null;

  const policyOptions = useMemo(
    () => [
      { label: "Select a policy…", value: "" },
      ...policies.map((p) => ({
        label: `${p.title} (${p.status})`,
        value: p.id,
      })),
    ],
    [policies]
  );

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
              <GitCompareArrows className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Compare Policies</h1>
              <p className="text-sm text-zinc-400">
                Side-by-side risk and compliance comparison
              </p>
            </div>
          </div>
          <Button variant="gradient" size="sm" onClick={() => setShowSubmitForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Submit New Policy
          </Button>
        </div>

        {policies.length < 2 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10">
              <GitCompareArrows className="h-8 w-8 text-pink-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Need at least 2 policies</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">
              Submit and analyze at least two policies to compare them side by side.
            </p>
            <Button variant="gradient" className="mt-6" onClick={() => setShowSubmitForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Submit a Policy
            </Button>
          </div>
        ) : (
          <StaggerContainer>
            {/* Selectors */}
            <StaggerItem>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Policy A</label>
                  <Select
                    value={leftId}
                    onValueChange={setLeftId}
                    options={policyOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-500">Policy B</label>
                  <Select
                    value={rightId}
                    onValueChange={setRightId}
                    options={policyOptions}
                  />
                </div>
              </div>
            </StaggerItem>

            {/* Quick compare bar */}
            {leftPolicy?.analysis && rightPolicy?.analysis && (
              <StaggerItem>
                <div className="mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="grid grid-cols-3 items-center gap-4 text-center">
                    <div>
                      <p className={cn("text-2xl font-bold", getRiskColor(leftPolicy.analysis.riskLevel))}>
                        {leftPolicy.analysis.riskScore}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{leftPolicy.title}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <ArrowRight className="h-5 w-5 text-zinc-600" />
                      <DiffBadge diff={leftPolicy.analysis.riskScore - rightPolicy.analysis.riskScore} />
                    </div>
                    <div>
                      <p className={cn("text-2xl font-bold", getRiskColor(rightPolicy.analysis.riskLevel))}>
                        {rightPolicy.analysis.riskScore}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{rightPolicy.title}</p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            )}

            {/* Two columns */}
            <StaggerItem>
              <div className="grid gap-6 md:grid-cols-2">
                <PolicyColumn policy={leftPolicy} other={rightPolicy} />
                <PolicyColumn policy={rightPolicy} other={leftPolicy} />
              </div>
            </StaggerItem>
          </StaggerContainer>
        )}
      </div>

      {/* Modal */}
      {showSubmitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl animate-in">
            <PolicySubmitForm
              onClose={() => setShowSubmitForm(false)}
              onSuccess={(policyId) => {
                setShowSubmitForm(false);
                if (!leftId) setLeftId(policyId);
                else if (!rightId) setRightId(policyId);
              }}
            />
          </div>
        </div>
      )}

      <Footer />
    </PageTransition>
  );
}
