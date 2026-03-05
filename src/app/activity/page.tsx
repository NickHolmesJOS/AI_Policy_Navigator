"use client";

import { useState, useMemo } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { PageTransition, FadeInView } from "@/components/ui/Animations";
import { formatDate, formatTime } from "@/lib/utils";
import Link from "next/link";
import type { ActivityAction } from "@/types";
import {
  Activity,
  FileText,
  Search,
  Trash2,
  BarChart3,
  Star,
  MessageSquare,
  FolderOpen,
  Tag,
  Settings,
  Layers,
  Sparkles,
  Filter,
  Calendar,
  Clock,
  ExternalLink,
} from "lucide-react";

const ACTION_META: Record<ActivityAction, { icon: React.ReactNode; color: string; label: string }> = {
  policy_created: { icon: <FileText className="h-3.5 w-3.5" />, color: "text-emerald-400 bg-emerald-500/10", label: "Created" },
  policy_analyzed: { icon: <BarChart3 className="h-3.5 w-3.5" />, color: "text-violet-400 bg-violet-500/10", label: "Analyzed" },
  policy_deleted: { icon: <Trash2 className="h-3.5 w-3.5" />, color: "text-red-400 bg-red-500/10", label: "Deleted" },
  policy_exported: { icon: <ExternalLink className="h-3.5 w-3.5" />, color: "text-blue-400 bg-blue-500/10", label: "Exported" },
  policy_compared: { icon: <Layers className="h-3.5 w-3.5" />, color: "text-cyan-400 bg-cyan-500/10", label: "Compared" },
  policy_favorited: { icon: <Star className="h-3.5 w-3.5" />, color: "text-amber-400 bg-amber-500/10", label: "Favorited" },
  policy_unfavorited: { icon: <Star className="h-3.5 w-3.5" />, color: "text-zinc-400 bg-zinc-500/10", label: "Unfavorited" },
  folder_created: { icon: <FolderOpen className="h-3.5 w-3.5" />, color: "text-indigo-400 bg-indigo-500/10", label: "Folder" },
  folder_deleted: { icon: <FolderOpen className="h-3.5 w-3.5" />, color: "text-red-400 bg-red-500/10", label: "Folder" },
  tag_added: { icon: <Tag className="h-3.5 w-3.5" />, color: "text-teal-400 bg-teal-500/10", label: "Tag" },
  tag_removed: { icon: <Tag className="h-3.5 w-3.5" />, color: "text-zinc-400 bg-zinc-500/10", label: "Tag" },
  chat_message: { icon: <MessageSquare className="h-3.5 w-3.5" />, color: "text-blue-400 bg-blue-500/10", label: "Chat" },
  chat_cleared: { icon: <MessageSquare className="h-3.5 w-3.5" />, color: "text-zinc-400 bg-zinc-500/10", label: "Chat" },
  template_used: { icon: <Sparkles className="h-3.5 w-3.5" />, color: "text-violet-400 bg-violet-500/10", label: "Template" },
  bulk_action: { icon: <Layers className="h-3.5 w-3.5" />, color: "text-orange-400 bg-orange-500/10", label: "Bulk" },
  settings_changed: { icon: <Settings className="h-3.5 w-3.5" />, color: "text-zinc-400 bg-zinc-500/10", label: "Settings" },
};

const ACTION_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "policy", label: "Policies" },
  { value: "folder", label: "Folders" },
  { value: "tag", label: "Tags" },
  { value: "chat", label: "Chat" },
  { value: "template", label: "Templates" },
  { value: "settings", label: "Settings" },
];

export default function ActivityPage() {
  const activityLog = usePolicyStore((s) => s.activityLog);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    return activityLog.filter((entry) => {
      const matchesSearch =
        !search ||
        entry.label.toLowerCase().includes(search.toLowerCase()) ||
        entry.detail?.toLowerCase().includes(search.toLowerCase()) ||
        entry.policyTitle?.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" || entry.action.startsWith(filter);

      return matchesSearch && matchesFilter;
    });
  }, [activityLog, search, filter]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof filtered> = {};
    filtered.forEach((entry) => {
      const date = new Date(entry.timestamp).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  }, [filtered]);

  return (
    <PageTransition>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <FadeInView>
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Activity Log</h1>
              <p className="text-sm text-zinc-400">Full audit trail of all actions — {activityLog.length} entries</p>
            </div>
          </div>
        </FadeInView>

        {/* Search & filter */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-900/60 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {ACTION_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  filter === f.value
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {activityLog.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 py-20 text-center">
            <Activity className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-3 text-sm font-medium text-white">No activity yet</h3>
            <p className="mt-1 text-xs text-zinc-500">Actions like creating policies, analyzing, and organizing will appear here</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 py-16 text-center">
            <Filter className="mx-auto h-8 w-8 text-zinc-600" />
            <p className="mt-3 text-sm text-zinc-400">No matching activity</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-xs font-semibold text-zinc-400">{date}</span>
                  <span className="text-xs text-zinc-600">({entries.length})</span>
                </div>
                <div className="space-y-1">
                  {entries.map((entry) => {
                    const meta = ACTION_META[entry.action];
                    return (
                      <div
                        key={entry.id}
                        className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.02]"
                      >
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white">{entry.label}</p>
                          {entry.detail && (
                            <p className="mt-0.5 truncate text-xs text-zinc-500">{entry.detail}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {entry.policyId && (
                            <Link
                              href={`/policy/${entry.policyId}`}
                              className="hidden text-xs text-violet-400 hover:text-violet-300 group-hover:inline-flex items-center gap-1"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                          <div className="flex items-center gap-1 text-xs text-zinc-600">
                            <Clock className="h-3 w-3" />
                            {formatTime(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </PageTransition>
  );
}
