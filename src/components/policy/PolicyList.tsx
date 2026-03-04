"use client";

import { useState } from "react";
import { usePolicyStore, useFilteredPolicies } from "@/store/policyStore";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    toggleFavorite,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    folders,
  } = usePolicyStore();

  const filteredPolicies = useFilteredPolicies();
  const [showFilters, setShowFilters] = useState(false);

  const favorites = filteredPolicies.filter((p) => p.isFavorite);
  const rest = filteredPolicies.filter((p) => !p.isFavorite);

  const renderPolicy = (policy: (typeof filteredPolicies)[0]) => {
    const folder = folders.find((f) => f.id === policy.folderId);
    const isSelected = policy.id === selectedPolicyId;

    return (
      <div
        key={policy.id}
        onClick={() => selectPolicy(policy.id)}
        className={cn(
          "group relative p-4 rounded-xl border cursor-pointer transition-all duration-200",
          isSelected
            ? "border-violet-500/50 bg-violet-500/10"
            : "border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10"
        )}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
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
              onClick={(e) => { e.stopPropagation(); deletePolicy(policy.id); }}
              className="p-1 rounded hover:bg-red-500/10 hover:text-red-400 transition-colors text-zinc-400"
              title="Delete policy"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
          {(filterCategory !== "All" || filterStatus !== "All") && (
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
          </div>
        )}
      </div>

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
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{filteredPolicies.length} policies</span>
          <span>
            {filteredPolicies.filter((p) => p.status === "analyzed").length} analyzed
          </span>
        </div>
      </div>
    </div>
  );
}
