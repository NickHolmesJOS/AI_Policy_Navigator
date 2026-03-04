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
  Menu,
  X,
  Sparkles,
  Shield,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

type MainView = "analysis" | "chat" | "organize";

const NAV_ITEMS = [
  { id: "analysis" as MainView, icon: BarChart3, label: "Analysis" },
  { id: "chat" as MainView, icon: MessageSquare, label: "Q&A Chat" },
  { id: "organize" as MainView, icon: FolderOpen, label: "Organize" },
];

export default function Dashboard() {
  const { sidebarOpen, toggleSidebar, policies } = usePolicyStore();
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [mainView, setMainView] = useState<MainView>("analysis");

  const analyzedCount = policies.filter((p) => p.status === "analyzed").length;
  const totalCount = policies.length;

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col bg-zinc-900/80 border-r border-white/5 transition-all duration-300 shrink-0",
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex-shrink-0 p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-white text-sm">
                  Policy Navigator
                </h1>
                <p className="text-xs text-zinc-400">
                  {totalCount} {totalCount === 1 ? "policy" : "policies"}
                </p>
              </div>
            </div>
          </div>
          <Button
            variant="gradient"
            className="w-full"
            onClick={() => setShowSubmitForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Policy
          </Button>
        </div>

        {/* Policy List */}
        <div className="flex-1 overflow-hidden">
          <PolicyList />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Nav */}
        <div className="flex-shrink-0 h-14 border-b border-white/5 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-zinc-400 hover:text-white"
            >
              {sidebarOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            {!sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="font-semibold text-sm text-white">
                  AI Policy Navigator
                </span>
              </div>
            )}

            {/* View tabs */}
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg ml-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setMainView(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    mainView === item.id
                      ? "bg-violet-600 text-white"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="hidden md:flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              {totalCount} total
            </span>
            <span className="hidden md:flex items-center gap-1 text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              {analyzedCount} analyzed
            </span>
            {!sidebarOpen && (
              <Button
                variant="gradient"
                size="sm"
                onClick={() => setShowSubmitForm(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                New
              </Button>
            )}
          </div>
        </div>

        {/* Main View */}
        <div className="flex-1 overflow-hidden">
          {mainView === "analysis" && <PolicyAnalysisView />}
          {mainView === "chat" && <PolicyChat />}
          {mainView === "organize" && <PolicyOrganizer />}
        </div>
      </div>

      {/* Submit Form Modal */}
      {showSubmitForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
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
