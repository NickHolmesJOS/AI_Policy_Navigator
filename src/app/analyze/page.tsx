"use client";

import { useState } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { PolicySubmitForm } from "@/components/policy/PolicySubmitForm";
import { PolicyAnalysisView } from "@/components/policy/PolicyAnalysisView";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Plus,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/layout/Footer";
import { PageTransition } from "@/components/ui/Animations";

export default function AnalyzePage() {
  const { policies, selectedPolicyId, selectPolicy } = usePolicyStore();
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  const analyzedPolicies = policies.filter((p) => p.status === "analyzed");
  const pendingPolicies = policies.filter(
    (p) => p.status === "draft" || p.status === "analyzing"
  );

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Policy Analysis</h1>
              <p className="text-sm text-zinc-400">
                AI-powered risk assessment and compliance analysis
              </p>
            </div>
          </div>
          <Button variant="gradient" size="sm" onClick={() => setShowSubmitForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Submit New Policy
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "Total", val: policies.length, Icon: FileText, cls: "text-zinc-400" },
            { label: "Analyzed", val: analyzedPolicies.length, Icon: CheckCircle, cls: "text-emerald-400" },
            { label: "Pending", val: pendingPolicies.length, Icon: Clock, cls: "text-amber-400" },
            {
              label: "High Risk",
              val: analyzedPolicies.filter(
                (p) => p.analysis?.riskLevel === "high" || p.analysis?.riskLevel === "critical"
              ).length,
              Icon: AlertTriangle,
              cls: "text-red-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <s.Icon className={cn("h-3.5 w-3.5", s.cls)} />
                <span className="text-xs text-zinc-500">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>

        {/* Main content */}
        {policies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
              <BarChart3 className="h-8 w-8 text-violet-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">No policies yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-400">
              Submit your first policy to get AI-powered analysis.
            </p>
            <Button variant="gradient" className="mt-6" onClick={() => setShowSubmitForm(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Submit Your First Policy
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Selector */}
            <div className="lg:col-span-1">
              <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Your Policies
                  </h3>
                </div>
                <div className="max-h-[540px] divide-y divide-white/[0.04] overflow-y-auto">
                  {policies.map((policy) => (
                    <button
                      key={policy.id}
                      onClick={() => selectPolicy(policy.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors hover:bg-white/[0.04]",
                        selectedPolicyId === policy.id &&
                          "border-l-2 border-l-violet-500 bg-violet-500/[0.06]"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-white">
                          {policy.title}
                        </span>
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
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="outline">{policy.category}</Badge>
                        {policy.analysis && (
                          <span className="text-[11px] text-zinc-500">
                            Risk {policy.analysis.riskScore}/100
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis view */}
            <div className="lg:col-span-2">
              <div className="min-h-[540px] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <PolicyAnalysisView />
              </div>
            </div>
          </div>
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
                selectPolicy(policyId);
              }}
            />
          </div>
        </div>
      )}

      <Footer />
    </PageTransition>
  );
}
