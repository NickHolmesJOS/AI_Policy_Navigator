"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePolicyStore } from "@/store/policyStore";
import { useToast } from "@/components/ui/Toast";
import { generateId } from "@/lib/utils";
import type { Policy, PolicyCategory, PolicyTag } from "@/types";
import {
  X,
  Save,
  Tag,
  Plus,
  Trash2,
  FileText,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  History,
  RotateCcw,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { diffLines } from "@/lib/diffUtils";

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

const TAG_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
];

interface PolicyEditModalProps {
  policyId: string | null;
  onClose: () => void;
}

/* ─────────────────────── Version History Panel ──────────────────────── */

function formatVersionDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Today at ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" }) + ` at ${time}`;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function VersionHistoryPanel({
  policy,
  selectedVersionId,
  onSelectVersion,
  onRestore,
}: {
  policy: Policy;
  selectedVersionId: string | null;
  onSelectVersion: (id: string | null) => void;
  onRestore: (versionId: string) => void;
}) {
  const versions = policy.versions ?? [];
  const previewVersion = selectedVersionId ? versions.find((v) => v.id === selectedVersionId) : null;
  const previewContent = previewVersion ? previewVersion.content : policy.content;
  const previewTitle = previewVersion ? previewVersion.title : policy.title;
  const previewCategory = previewVersion ? previewVersion.category : policy.category;
  const showDiff = !!previewVersion;
  const diff = showDiff ? diffLines(previewVersion.content, policy.content) : [];

  return (
    <div className="flex min-h-[460px] gap-4">
      {/* Left: version list */}
      <div className="flex w-44 shrink-0 flex-col gap-1.5 overflow-y-auto">
        <p className="mb-1 px-1 text-[10px] uppercase tracking-wider text-zinc-600">Saved versions</p>

        {/* Current */}
        <button
          onClick={() => onSelectVersion(null)}
          className={cn(
            "w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
            !selectedVersionId
              ? "border-violet-500/50 bg-violet-500/10"
              : "border-white/[0.06] bg-zinc-800/40 hover:border-white/10 hover:bg-zinc-800"
          )}
        >
          <div className="mb-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-white">Current</span>
          </div>
          <p className="pl-3 text-[10px] text-zinc-500">{countWords(policy.content).toLocaleString()} words</p>
        </button>

        {/* Past versions */}
        {versions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Clock className="h-6 w-6 text-zinc-700" />
            <p className="text-[11px] leading-relaxed text-zinc-600">
              No history yet.
              <br />
              Save edits to create versions.
            </p>
          </div>
        ) : (
          versions.map((version, i) => {
            const vNum = versions.length - i;
            const isSelected = selectedVersionId === version.id;
            return (
              <button
                key={version.id}
                onClick={() => onSelectVersion(version.id)}
                className={cn(
                  "w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
                  isSelected
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-white/[0.06] bg-zinc-800/40 hover:border-white/10 hover:bg-zinc-800"
                )}
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-zinc-300">v{vNum}</span>
                  <span className="text-[10px] text-zinc-600">
                    {countWords(version.content).toLocaleString()}w
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500">{formatVersionDate(version.savedAt)}</p>
              </button>
            );
          })
        )}
      </div>

      {/* Right: preview or diff */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.08]">
        {/* Preview header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-zinc-800/50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{previewTitle}</p>
            <p className="text-[11px] text-zinc-500">
              {previewCategory} &middot; {countWords(previewContent).toLocaleString()} words
              {previewVersion && (
                <span className="ml-2 text-zinc-600">&middot; {formatVersionDate(previewVersion.savedAt)}</span>
              )}
            </p>
          </div>
          {selectedVersionId && (
            <button
              onClick={() => onRestore(selectedVersionId)}
              className="ml-3 flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </button>
          )}
        </div>
        {/* Diff or preview content */}
        <div className="flex-1 overflow-y-auto bg-zinc-900/30 p-5">
          {showDiff ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-xs text-zinc-400">Version</p>
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {diff.map((line, i) => (
                    <span
                      key={i}
                      className={cn(
                        line.type === "removed" ? "bg-red-900 text-red-300" : line.type === "added" ? "bg-green-900 text-green-300" : "text-zinc-300"
                      )}
                    >{line.left || "\n"}</span>
                  ))}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-xs text-zinc-400">Current</p>
                <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {diff.map((line, i) => (
                    <span
                      key={i}
                      className={cn(
                        line.type === "added" ? "bg-green-900 text-green-300" : line.type === "removed" ? "bg-red-900 text-red-300" : "text-zinc-300"
                      )}
                    >{line.right || "\n"}</span>
                  ))}
                </pre>
              </div>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-300">
              {previewContent}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */

export function PolicyEditModal({ policyId, onClose }: PolicyEditModalProps) {
  const { policies, updatePolicy, addTag, removeTag, movePolicyToFolder, folders, saveVersion, restoreVersion } = usePolicyStore();
  const { toast } = useToast();
  const policy = policies.find((p) => p.id === policyId);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PolicyCategory>("Other");
  const [folderId, setFolderId] = useState<string | undefined>(undefined);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [dirty, setDirty] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<"pages" | "edit">("pages");
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  useEffect(() => {
    if (policy) {
      setTitle(policy.title);
      setContent(policy.content);
      setCategory(policy.category);
      setFolderId(policy.folderId);
      setDirty(false);
      setCurrentPage(0);
      setViewMode(policy.pageContents?.length ? "pages" : "edit");
      setActiveTab("edit");
      setSelectedVersionId(null);
    }
  }, [policy]);

  const handleSave = useCallback(() => {
    if (!policyId || !title.trim()) return;
    // Snapshot current state only when meaningful content actually changed
    const hasChanges =
      title.trim() !== policy?.title ||
      content !== policy?.content ||
      category !== policy?.category;
    if (hasChanges) saveVersion(policyId);
    updatePolicy(policyId, { title: title.trim(), content, category, folderId });
    if (folderId !== policy?.folderId) {
      movePolicyToFolder(policyId, folderId);
    }
    toast({ title: "Policy updated", variant: "success" });
    setDirty(false);
    onClose();
  }, [policyId, title, content, category, folderId, policy, saveVersion, updatePolicy, movePolicyToFolder, toast, onClose]);

  const handleRestore = useCallback((versionId: string) => {
    if (!policyId) return;
    restoreVersion(policyId, versionId);
    toast({ title: "Version restored", description: "The policy has been rolled back to this version.", variant: "success" });
    setActiveTab("edit");
    setSelectedVersionId(null);
  }, [policyId, restoreVersion, toast]);

  const handleAddTag = () => {
    if (!policyId || !newTagName.trim()) return;
    const tag: PolicyTag = { id: generateId(), name: newTagName.trim(), color: newTagColor };
    addTag(policyId, tag);
    setNewTagName("");
    setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
    toast({ title: `Tag "${tag.name}" added`, variant: "success" });
  };

  const handleRemoveTag = (tagId: string) => {
    if (!policyId) return;
    removeTag(policyId, tagId);
  };

  // Keyboard: Escape to close, Cmd+S to save
  useEffect(() => {
    if (!policyId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [policyId, onClose, handleSave]);

  if (!policy) return null;

  return (
    <AnimatePresence>
      {policyId && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-violet-400" />
                <h2 className="text-base font-semibold text-white">Edit Policy</h2>
                {dirty && activeTab === "edit" && (
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                    Unsaved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Tab switcher */}
                <div className="flex gap-0.5 rounded-lg bg-zinc-800 p-0.5">
                  <button
                    onClick={() => setActiveTab("edit")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                      activeTab === "edit" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <FileText className="h-3 w-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => { setActiveTab("history"); setSelectedVersionId(null); }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                      activeTab === "history" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
                    )}
                  >
                    <History className="h-3 w-3" />
                    History
                    {(policy.versions?.length ?? 0) > 0 && (
                      <span className="rounded-full bg-violet-500/30 px-1.5 py-0.5 text-[10px] text-violet-300">
                        {policy.versions?.length}
                      </span>
                    )}
                  </button>
                </div>
                {activeTab === "edit" && (
                  <button
                    onClick={handleSave}
                    disabled={!title.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "history" ? (
              <VersionHistoryPanel
                policy={policy}
                selectedVersionId={selectedVersionId}
                onSelectVersion={setSelectedVersionId}
                onRestore={handleRestore}
              />
            ) : (
              <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                  placeholder="Policy title"
                />
              </div>

              {/* Category & Folder row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Category</label>
                  <select
                    value={category}
                    onChange={(e) => { setCategory(e.target.value as PolicyCategory); setDirty(true); }}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                    <FolderOpen className="mr-1 inline h-3 w-3" />
                    Folder
                  </label>
                  <select
                    value={folderId || ""}
                    onChange={(e) => { setFolderId(e.target.value || undefined); setDirty(true); }}
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500/50 focus:outline-none"
                  >
                    <option value="">No folder</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-zinc-400">
                  <Tag className="mr-1 inline h-3 w-3" />
                  Tags
                </label>
                {policy.tags.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {policy.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor: tag.color + "20",
                          borderColor: tag.color + "40",
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                        <button
                          onClick={() => handleRemoveTag(tag.id)}
                          className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-white/10"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                      placeholder="New tag name..."
                      className="flex-1 rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none"
                    />
                    <div className="flex gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewTagColor(color)}
                          className={cn(
                            "h-5 w-5 rounded-full border-2 transition-all",
                            newTagColor === color ? "border-white scale-110" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={handleAddTag}
                    disabled={!newTagName.trim()}
                    className="flex items-center gap-1 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-30"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                </div>
              </div>

              {/* Content */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-400">Content</label>
                  {policy.pageContents?.length && (
                    <div className="flex gap-1 rounded-lg bg-zinc-800 p-0.5">
                      <button
                        type="button"
                        onClick={() => setViewMode("pages")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                          viewMode === "pages"
                            ? "bg-violet-600 text-white"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        <FileText className="mr-1 inline h-3 w-3" />
                        Pages
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("edit")}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                          viewMode === "edit"
                            ? "bg-violet-600 text-white"
                            : "text-zinc-400 hover:text-white"
                        )}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                {viewMode === "pages" && policy.pageContents?.length ? (
                  /* ── Paginated reader ───────────────────────────────── */
                  <div className="overflow-hidden rounded-lg border border-white/[0.08]">
                    {/* Page content */}
                    <div className="h-72 overflow-y-auto bg-zinc-900/60 p-4">
                      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-200">
                        {policy.pageContents[currentPage] ?? ""}
                      </pre>
                    </div>
                    {/* Pagination bar */}
                    {policy.pageContents.length > 1 && (
                      <div className="flex items-center justify-between border-t border-white/[0.06] bg-zinc-800/60 px-4 py-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                          disabled={currentPage === 0}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" /> Prev
                        </button>
                        <span className="tabular-nums text-[11px] text-zinc-400">
                          Page {currentPage + 1} of {policy.pageContents.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.min((policy.pageContents?.length ?? 1) - 1, p + 1)
                            )
                          }
                          disabled={currentPage === (policy.pageContents?.length ?? 1) - 1}
                          className="flex items-center gap-1 text-[11px] text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          Next <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Editable textarea ─────────────────────────────────── */
                  <textarea
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setDirty(true); }}
                    rows={14}
                    className="w-full resize-y rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-300 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                    placeholder="Policy content..."
                  />
                )}
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-4 text-[11px] text-zinc-600">
                <span>ID: {policy.id.slice(0, 8)}…</span>
                <span>Created: {new Date(policy.createdAt).toLocaleDateString()}</span>
                <span>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
                <span>Status: {policy.status}</span>
              </div>
              </div>
            )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-white/[0.04] px-6 py-3 text-center">
              <span className="text-[11px] text-zinc-600">
                {activeTab === "edit" && (
                  <><kbd className="rounded border border-white/10 bg-zinc-800 px-1 py-0.5 text-[10px]">⌘S</kbd> Save ·{" "}</>
                )}
                <kbd className="rounded border border-white/10 bg-zinc-800 px-1 py-0.5 text-[10px]">Esc</kbd> Close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
