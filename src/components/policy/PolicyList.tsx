"use client";

import { useState } from "react";
import { usePolicyStore, useFilteredPolicies, useAllTags } from "@/store/policyStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PolicyEditModal } from "@/components/policy/PolicyEditModal";
import type { PolicyCategory, PolicyStatus, RiskLevel } from "@/types";
import { formatDate, truncate, getRiskBg } from "@/lib/utils";
import {
  Search,
  Star,
  StarOff,
  Trash2,
  ChevronRight,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Folder,
  Filter,
  Pencil,
  CheckSquare,
  Square,
  MinusSquare,
  Download,
  Tag,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { exportAnalysisReport } from "@/lib/exportReport";
import { ReviewStatusBadge } from "@/components/policy/ReviewTimeline";

const CATEGORIES: (PolicyCategory | "All")[] = [
  "All",
  "Privacy",
  "Security",
  "HR",
  "Compliance",
  "Environmental",
  "Financial",
  "Ethics",
  "Other",
];

const STATUSES: (PolicyStatus | "All")[] = [
  "All",
  "draft",
  "analyzing",
  "analyzed",
  "error",
];

function StatusIcon({ status }: { status: PolicyStatus }) {
  switch (status) {
    case "draft":
      return <Clock className="w-4 h-4 text-zinc-400" />;
    case "analyzing":
      return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
    case "analyzed":
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case "error":
      return <XCircle className="w-4 h-4 text-red-400" />;
  }
}

function StatusBadge({ status }: { status: PolicyStatus }) {
  const map: Record<PolicyStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" | "outline" }> = {
    draft: { label: "Draft", variant: "outline" },
    analyzing: { label: "Analyzing...", variant: "warning" },
    analyzed: { label: "Analyzed", variant: "success" },
    error: { label: "Error", variant: "danger" },
  };
  const { label, variant } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border",
        getRiskBg(level)
      )}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)} Risk
    </span>
  );
}

export function PolicyList() {
  const {
    selectedPolicyId,
    selectPolicy,
    deletePolicy,
    deletePolicies,
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterRiskLevel,
    setFilterRiskLevel,
    filterTag,
    setFilterTag,
    folders,
    setStatus,
    setAnalysis,
  } = usePolicyStore();

  const filteredPolicies = useFilteredPolicies();
  const allTags = useAllTags();
  const [showFilters, setShowFilters] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkReanalyzing, setBulkReanalyzing] = useState(false);
  const { toast } = useToast();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPolicies.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPolicies.map((p) => p.id)));
    }
  };

  const handleBulkDelete = () => {
    if (!bulkDeleteConfirm) {
      setBulkDeleteConfirm(true);
      return;
    }
    deletePolicies(Array.from(selectedIds));
    toast({ title: `Deleted ${selectedIds.size} policies`, variant: "info" });
    setSelectedIds(new Set());
    setBulkMode(false);
    setBulkDeleteConfirm(false);
  };

  const handleBulkExport = () => {
    const selected = filteredPolicies.filter((p) => selectedIds.has(p.id) && p.analysis);
    if (selected.length === 0) {
      toast({ title: "No analyzed policies to export", variant: "warning" });
      return;
    }
    selected.forEach((p) => {
      if (p.analysis) exportAnalysisReport(p);
    });
    toast({ title: `Exported ${selected.length} reports`, variant: "success" });
  };

  const handleBulkFavorite = () => {
    const store = usePolicyStore.getState();
    selectedIds.forEach((id) => store.toggleFavorite(id));
    toast({ title: `Toggled favorites for ${selectedIds.size} policies`, variant: "success" });
  };

  const handleBulkReanalyze = async () => {
    const toReanalyze = filteredPolicies.filter((p) => selectedIds.has(p.id));
    if (toReanalyze.length === 0) {
      toast({ title: "No policies selected", variant: "warning" });
      return;
    }
    setBulkReanalyzing(true);
    toast({ title: `Re-analyzing ${toReanalyze.length} ${toReanalyze.length === 1 ? "policy" : "policies"}...`, variant: "info" });
    toReanalyze.forEach((p) => setStatus(p.id, "analyzing"));

    const results = await Promise.allSettled(
      toReanalyze.map(async (p) => {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ policyId: p.id, content: p.content, title: p.title }),
        });
        if (!res.ok) throw new Error("failed");
        const analysis = await res.json();
        setAnalysis(p.id, analysis);
      })
    );

    const failed = results.filter((r) => r.status === "rejected").length;
    toReanalyze.forEach((p, i) => {
      if (results[i].status === "rejected") setStatus(p.id, "error");
    });

    if (failed === 0) {
      toast({ title: `All ${toReanalyze.length} policies re-analyzed`, variant: "success" });
    } else {
      toast({ title: `${toReanalyze.length - failed} succeeded, ${failed} failed`, variant: "warning" });
    }
    setBulkReanalyzing(false);
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      const p = filteredPolicies.find((pp) => pp.id === deleteTarget);
      deletePolicy(deleteTarget);
      toast({ title: "Policy deleted", description: p?.title || "Removed", variant: "info" });
      setDeleteTarget(null);
    }
  };

  const favorites = filteredPolicies.filter((p) => p.isFavorite);
  const rest = filteredPolicies.filter((p) => !p.isFavorite);

  const renderPolicy = (policy: (typeof filteredPolicies)[0]) => {
    const folder = folders.find((f) => f.id === policy.folderId);
    const isSelected = policy.id === selectedPolicyId;

    return (
      <div
        key={policy.id}
        onClick={() => bulkMode ? toggleSelect(policy.id) : selectPolicy(policy.id)}
        className={cn(
          "group relative p-4 rounded-xl border cursor-pointer transition-all duration-200",
          isSelected && !bulkMode
            ? "border-violet-500/50 bg-violet-500/10"
            : selectedIds.has(policy.id) && bulkMode
            ? "border-violet-500/50 bg-violet-500/10"
            : "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10"
        )}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {bulkMode && (
              <button onClick={(e) => { e.stopPropagation(); toggleSelect(policy.id); }} className="shrink-0">
                {selectedIds.has(policy.id) ? (
                  <CheckSquare className="w-4 h-4 text-violet-400" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600" />
                )}
              </button>
            )}
            <StatusIcon status={policy.status} />
            <span className="font-medium text-white text-sm truncate">
              {policy.title}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(policy.id); }}
              className="p-1 rounded hover:bg-white/10 transition-colors"
              title={policy.isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {policy.isFavorite ? (
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              ) : (
                <StarOff className="w-3.5 h-3.5 text-zinc-400" />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(policy.id); }}
              className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors text-zinc-400"
              title="Delete policy"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setEditTarget(policy.id); }}
              className="p-1 rounded hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
              title="Edit policy"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content preview */}
        <p className="text-xs text-zinc-500 mb-3 line-clamp-2">
          {truncate(policy.content, 100)}
        </p>

        {/* Bottom row */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={policy.status} />
          <Badge variant="outline">{policy.category}</Badge>
          {policy.analysis && (
            <RiskBadge level={policy.analysis.riskLevel} />
          )}
          <ReviewStatusBadge policyId={policy.id} />
          {folder && (
            <span className="flex items-center gap-1 text-xs text-zinc-400">
              <Folder className="w-3 h-3" style={{ color: folder.color }} />
              {folder.name}
            </span>
          )}
          <span className="ml-auto text-xs text-zinc-600">
            {formatDate(policy.createdAt)}
          </span>
        </div>

        {/* Tags */}
        {policy.tags.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {policy.tags.slice(0, 3).map((tag) => (
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
            {policy.tags.length > 3 && (
              <span className="text-xs text-zinc-500">
                +{policy.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {isSelected && (
          <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-4 space-y-3 border-b border-white/5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Search policies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full justify-start"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {(filterCategory !== "All" || filterStatus !== "All" || filterRiskLevel !== "All" || filterTag) && (
            <span className="ml-auto w-2 h-2 rounded-full bg-violet-500" />
          )}
        </Button>

        {showFilters && (
          <div className="space-y-2">
            <Select
              value={filterCategory}
              onValueChange={(v) => setFilterCategory(v as PolicyCategory | "All")}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
            <Select
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as PolicyStatus | "All")}
              options={STATUSES.map((s) => ({
                label: s === "All" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1),
                value: s,
              }))}
            />
            <Select
              value={filterRiskLevel}
              onValueChange={(v) => setFilterRiskLevel(v as RiskLevel | "All")}
              options={[
                { label: "All Risk Levels", value: "All" },
                { label: "🟢 Low Risk", value: "low" },
                { label: "🟡 Medium Risk", value: "medium" },
                { label: "🟠 High Risk", value: "high" },
                { label: "🔴 Critical Risk", value: "critical" },
              ]}
            />
            {/* Tag filter */}
            {allTags.length > 0 && (
              <div className="space-y-1.5">
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
                  <Tag className="w-3 h-3" /> Filter by tag
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {filterTag && (
                    <button
                      onClick={() => setFilterTag("")}
                      className="flex items-center gap-1 rounded-full bg-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-300 hover:bg-zinc-600 transition-colors"
                    >
                      <X className="w-2.5 h-2.5" /> Clear
                    </button>
                  )}
                  {allTags.map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => setFilterTag(filterTag === tag.name ? "" : tag.name)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium transition-all",
                        filterTag === tag.name
                          ? "ring-1 ring-white/30 scale-105"
                          : "opacity-70 hover:opacity-100"
                      )}
                      style={{
                        backgroundColor: tag.color + "20",
                        borderColor: tag.color + (filterTag === tag.name ? "80" : "40"),
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk action strip — always visible above the list */}
      {filteredPolicies.length > 1 && (
        <div className={cn(
          "shrink-0 border-b px-4 transition-all",
          bulkMode
            ? "border-violet-500/20 bg-violet-500/5 py-2.5 space-y-2"
            : "border-white/5 py-1.5"
        )}>
          {bulkMode ? (
            <>
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  {selectedIds.size === filteredPolicies.length ? (
                    <MinusSquare className="w-3.5 h-3.5" />
                  ) : (
                    <CheckSquare className="w-3.5 h-3.5" />
                  )}
                  {selectedIds.size === filteredPolicies.length ? "Deselect all" : "Select all"}
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-violet-400 font-medium">{selectedIds.size} selected</span>
                  <button
                    onClick={() => { setBulkMode(false); setSelectedIds(new Set()); setBulkDeleteConfirm(false); }}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={handleBulkFavorite}
                  disabled={selectedIds.size === 0}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-zinc-800 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 transition-colors"
                >
                  <Star className="w-3 h-3" /> Fav
                </button>
                <button
                  onClick={handleBulkReanalyze}
                  disabled={selectedIds.size === 0 || bulkReanalyzing}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-zinc-800 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 transition-colors"
                >
                  {bulkReanalyzing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Analyze
                </button>
                <button
                  onClick={handleBulkExport}
                  disabled={selectedIds.size === 0}
                  className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-zinc-800 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 disabled:opacity-30 transition-colors"
                >
                  <Download className="w-3 h-3" /> Export
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors disabled:opacity-30",
                    bulkDeleteConfirm
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 text-red-400 hover:bg-red-500/10"
                  )}
                >
                  <Trash2 className="w-3 h-3" /> {bulkDeleteConfirm ? "Confirm" : "Delete"}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setBulkMode(true)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-violet-400 transition-colors"
            >
              <CheckSquare className="w-3 h-3" />
              Bulk actions
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredPolicies.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FileText className="w-12 h-12 text-zinc-700 mb-3" />
            <p className="text-zinc-400 text-sm">No policies found</p>
            <p className="text-zinc-600 text-xs mt-1">
              Submit a policy to get started
            </p>
          </div>
        ) : (
          <>
            {favorites.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-500 px-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  Favorites
                </div>
                {favorites.map(renderPolicy)}
              </div>
            )}
            {rest.length > 0 && (
              <div className="space-y-2">
                {favorites.length > 0 && (
                  <div className="text-xs text-zinc-500 px-1 pt-2">
                    All Policies ({rest.length})
                  </div>
                )}
                {rest.map(renderPolicy)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats footer */}
      <div className="shrink-0 p-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{filteredPolicies.length} policies</span>
          <span>
            {filteredPolicies.filter((p) => p.status === "analyzed").length} analyzed
          </span>
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this policy?"
        description="This action cannot be undone. The policy and its analysis will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Edit modal */}
      <PolicyEditModal
        policyId={editTarget}
        onClose={() => setEditTarget(null)}
      />
    </div>
  );
}
