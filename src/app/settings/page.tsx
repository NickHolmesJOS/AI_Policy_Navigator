"use client";

import { useState } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { useToast } from "@/components/ui/Toast";
import { PageTransition } from "@/components/ui/Animations";
import {
  Settings,
  Key,
  Download,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  FolderOpen,
  FileText,
  Bell,
} from "lucide-react";
import type { PolicyCategory } from "@/types";

const CATEGORIES: PolicyCategory[] = [
  "Privacy",
  "Security",
  "HR",
  "Compliance",
  "Environmental",
  "Financial",
  "Ethics",
  "Other",
];

export default function SettingsPage() {
  const { settings, updateSettings, policies, folders, activityLog, clearActivityLog } = usePolicyStore();
  const { toast } = useToast();
  const [showKey, setShowKey] = useState(false);
  const [confirmClear, setConfirmClear] = useState<string | null>(null);

  const handleExportAll = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      policies,
      folders,
      activityLog,
      settings: { ...settings, openaiApiKey: "" },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy-navigator-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported successfully", variant: "success" });
  };

  const handleClearPolicies = () => {
    if (confirmClear !== "policies") {
      setConfirmClear("policies");
      return;
    }
    const store = usePolicyStore.getState();
    store.policies.forEach((p) => store.deletePolicy(p.id));
    setConfirmClear(null);
    toast({ title: "All policies deleted", variant: "warning" });
  };

  const handleClearActivity = () => {
    if (confirmClear !== "activity") {
      setConfirmClear("activity");
      return;
    }
    clearActivityLog();
    setConfirmClear(null);
    toast({ title: "Activity log cleared", variant: "info" });
  };

  return (
    <PageTransition>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-sm text-zinc-400">Configure your AI Policy Navigator</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Key */}
          <section className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-6">
            <div className="mb-4 flex items-center gap-2 text-white">
              <Key className="h-4 w-4 text-violet-400" />
              <h2 className="text-base font-semibold">OpenAI API Key</h2>
            </div>
            <p className="mb-3 text-sm text-zinc-400">
              Enter your OpenAI API key to enable live AI analysis. Without a key, the app uses mock analysis.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? "text" : "password"}
                  value={settings.openaiApiKey}
                  onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 pr-10 text-sm text-white placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {settings.openaiApiKey && (
              <p className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                <Check className="h-3 w-3" /> API key configured
              </p>
            )}
          </section>

          {/* Preferences */}
          <section className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-6">
            <div className="mb-4 flex items-center gap-2 text-white">
              <Bell className="h-4 w-4 text-violet-400" />
              <h2 className="text-base font-semibold">Preferences</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Auto-analyze on submit</p>
                  <p className="text-xs text-zinc-500">Automatically start analysis when a policy is submitted</p>
                </div>
                <button
                  onClick={() => updateSettings({ autoAnalyze: !settings.autoAnalyze })}
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {settings.autoAnalyze ? (
                    <ToggleRight className="h-7 w-7" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-zinc-600" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Show welcome banner</p>
                  <p className="text-xs text-zinc-500">Display the getting-started banner on dashboard</p>
                </div>
                <button
                  onClick={() => updateSettings({ showWelcomeBanner: !settings.showWelcomeBanner })}
                  className="text-violet-400 hover:text-violet-300 transition-colors"
                >
                  {settings.showWelcomeBanner ? (
                    <ToggleRight className="h-7 w-7" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-zinc-600" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Default category</p>
                  <p className="text-xs text-zinc-500">Default category for new policies</p>
                </div>
                <select
                  value={settings.defaultCategory}
                  onChange={(e) =>
                    updateSettings({ defaultCategory: e.target.value as PolicyCategory })
                  }
                  className="rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Export format</p>
                  <p className="text-xs text-zinc-500">Default format when exporting reports</p>
                </div>
                <select
                  value={settings.exportFormat}
                  onChange={(e) =>
                    updateSettings({ exportFormat: e.target.value as "markdown" | "json" | "txt" })
                  }
                  className="rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                >
                  <option value="markdown">Markdown</option>
                  <option value="json">JSON</option>
                  <option value="txt">Plain text</option>
                </select>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-6">
            <div className="mb-4 flex items-center gap-2 text-white">
              <Download className="h-4 w-4 text-violet-400" />
              <h2 className="text-base font-semibold">Data Management</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Policies</p>
                    <p className="text-xs text-zinc-500">{policies.length} policies stored</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-zinc-800/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Folders</p>
                    <p className="text-xs text-zinc-500">{folders.length} folders</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleExportAll}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-zinc-800 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                <Download className="h-4 w-4" />
                Export all data (JSON)
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="rounded-xl border border-red-500/20 bg-red-950/20 p-6">
            <div className="mb-4 flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <h2 className="text-base font-semibold">Danger Zone</h2>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleClearActivity}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  confirmClear === "activity"
                    ? "border-red-500 bg-red-600 text-white"
                    : "border-red-500/20 bg-red-950/30 text-red-400 hover:bg-red-950/50"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                {confirmClear === "activity" ? "Click again to confirm" : "Clear activity log"}
              </button>
              <button
                onClick={handleClearPolicies}
                className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  confirmClear === "policies"
                    ? "border-red-500 bg-red-600 text-white"
                    : "border-red-500/20 bg-red-950/30 text-red-400 hover:bg-red-950/50"
                }`}
              >
                <Trash2 className="h-4 w-4" />
                {confirmClear === "policies" ? "Click again to confirm — this is irreversible" : "Delete all policies"}
              </button>
            </div>
          </section>
        </div>
      </main>
    </PageTransition>
  );
}
