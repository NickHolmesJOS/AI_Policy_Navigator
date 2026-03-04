"use client";

import { useState } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { PolicyList } from "@/components/policy/PolicyList";
import { PolicySubmitForm } from "@/components/policy/PolicySubmitForm";
import { PolicyAnalysisView } from "@/components/policy/PolicyAnalysisView";
import { PolicyChat } from "@/components/policy/PolicyChat";
import { PolicyOrganizer } from "@/components/policy/PolicyOrganizer";
import { Button } from "@/components/ui/Button";
import {
  Plus,
  BarChart3,
  MessageSquare,
  FolderOpen,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MainView = "analysis" | "chat" | "organize";

const VIEW_TABS = [
  { id: "analysis" as MainView, icon: BarChart3, label: "Analysis" },
  { id: "chat" as MainView, icon: MessageSquare, label: "Q&A Chat" },
  { id: "organize" as MainView, icon: FolderOpen, label: "Organize" },
];

export default function DashboardPage() {
  const { sidebarOpen, toggleSidebar, policies } = usePolicyStore();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [mainView, setMainView] = useState<MainView>("analysis");

  const analyzedCount = policies.filter((p) => p.status === "analyzed").length;
  const totalCount = policies.length;

  return (
    /* 
     * flex-1 so it stretches below the global navbar;
     * overflow-hidden prevents double scrollbars.
     * Use a hard min-h so the page fills the viewport below the navbar.
     */
    <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
      {/* ── Sidebar ──────────────────────────────── */}
      <aside
        className={cn(
          "flex shrink-0 flex-col border-r border-white/[0.06] bg-zinc-900/60 transition-[width] duration-300",
          sidebarOpen ? "w-72 xl:w-80" : "w-0"
        )}
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-white/[0.06] p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Policies</span>
            <span className="ml-auto rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-400">
              {totalCount}
            </span>
          </div>
          <Button
            variant="gradient"
            className="w-full"
            size="sm"
            onClick={() => setShowSubmitForm(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Policy
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <PolicyList />
        </div>
      </aside>

      {/* ── Main panel ───────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* toolbar */}
        <div className="flex h-12 shrink-0 items-center gap-2 border-b border-white/[0.06] px-3">
          <button
            onClick={toggleSidebar}
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </button>

          {/* View tabs */}
          <div className="ml-1 flex gap-0.5 rounded-lg bg-white/[0.04] p-0.5">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMainView(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  mainView === tab.id
                    ? "bg-violet-600 text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* right side stats */}
          <div className="ml-auto flex items-center gap-3 text-[11px] text-zinc-500">
            <span className="hidden items-center gap-1 md:flex">
              <FileText className="h-3 w-3" />
              {totalCount} total
            </span>
            <span className="hidden items-center gap-1 text-emerald-400/80 md:flex">
              <Sparkles className="h-3 w-3" />
              {analyzedCount} analyzed
            </span>
            {!sidebarOpen && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => setShowSubmitForm(true)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                New
              </Button>
            )}
          </div>
        </div>

        {/* content area */}
        <div className="flex-1 overflow-y-auto">
          {mainView === "analysis" && <PolicyAnalysisView />}
          {mainView === "chat" && <PolicyChat />}
          {mainView === "organize" && <PolicyOrganizer />}
        </div>
      </div>

      {/* ── Modal ────────────────────────────────── */}
      {showSubmitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl animate-in">
            <PolicySubmitForm
              onClose={() => setShowSubmitForm(false)}
              onSuccess={() => {
                setShowSubmitForm(false);
                setMainView("analysis");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
