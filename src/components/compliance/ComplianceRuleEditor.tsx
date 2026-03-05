"use client";

import { useState } from "react";
import { usePolicyStore, useAllFrameworks } from "@/store/policyStore";
import { useToast } from "@/components/ui/Toast";
import { X, Plus, Tag } from "lucide-react";
import type { ComplianceSeverity, ComplianceRule } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  editingRule?: ComplianceRule | null;
}

const SEVERITIES: { value: ComplianceSeverity; label: string; color: string }[] = [
  { value: "critical", label: "Critical", color: "bg-red-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "medium", label: "Medium", color: "bg-amber-500" },
  { value: "low", label: "Low", color: "bg-blue-500" },
  { value: "info", label: "Info", color: "bg-zinc-500" },
];

export function ComplianceRuleEditor({ open, onClose, editingRule }: Props) {
  const frameworks = useAllFrameworks();
  const { addCustomRule, updateCustomRule, addCustomFramework } = usePolicyStore();
  const { toast } = useToast();

  const [title, setTitle] = useState(editingRule?.title || "");
  const [description, setDescription] = useState(editingRule?.description || "");
  const [section, setSection] = useState(editingRule?.section || "");
  const [severity, setSeverity] = useState<ComplianceSeverity>(editingRule?.severity || "medium");
  const [frameworkId, setFrameworkId] = useState(editingRule?.frameworkId || "");
  const [keywords, setKeywords] = useState<string[]>(editingRule?.keywords || []);
  const [keywordInput, setKeywordInput] = useState("");

  // New framework creation
  const [showNewFramework, setShowNewFramework] = useState(false);
  const [newFwName, setNewFwName] = useState("");
  const [newFwShort, setNewFwShort] = useState("");
  const [newFwColor, setNewFwColor] = useState("bg-purple-500");
  const [newFwDesc, setNewFwDesc] = useState("");

  const FW_COLORS = [
    "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-yellow-500",
    "bg-lime-500", "bg-emerald-500", "bg-teal-500", "bg-cyan-500",
    "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-purple-500",
    "bg-fuchsia-500", "bg-pink-500", "bg-rose-500",
  ];

  if (!open) return null;

  const addKeyword = () => {
    const kw = keywordInput.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  const handleCreateFramework = () => {
    if (!newFwName.trim() || !newFwShort.trim()) return;
    const fw = addCustomFramework(newFwName.trim(), newFwShort.trim(), newFwColor, newFwDesc.trim());
    setFrameworkId(fw.id);
    setShowNewFramework(false);
    setNewFwName("");
    setNewFwShort("");
    setNewFwDesc("");
    toast({ title: "Framework Created", description: `"${fw.shortName}" added`, variant: "success" });
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Error", description: "Title is required", variant: "error" });
      return;
    }
    if (!description.trim()) {
      toast({ title: "Error", description: "Description is required", variant: "error" });
      return;
    }
    if (!frameworkId) {
      toast({ title: "Error", description: "Please select a framework", variant: "error" });
      return;
    }

    if (editingRule) {
      updateCustomRule(editingRule.id, {
        title: title.trim(),
        description: description.trim(),
        section: section.trim() || undefined,
        severity,
        frameworkId,
        keywords,
      });
      toast({ title: "Rule Updated", description: `"${title.trim()}" saved`, variant: "success" });
    } else {
      addCustomRule(frameworkId, title.trim(), description.trim(), section.trim(), severity, keywords);
      toast({ title: "Rule Created", description: `"${title.trim()}" added to library`, variant: "success" });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-zinc-900/95 backdrop-blur px-6 py-4">
          <h2 className="text-lg font-semibold text-white">
            {editingRule ? "Edit Compliance Rule" : "Create Custom Compliance Rule"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          {/* Framework selector */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Framework</label>
            <div className="flex gap-2">
              <select
                value={frameworkId}
                onChange={(e) => setFrameworkId(e.target.value)}
                className="flex-1 rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                <option value="">Select a framework…</option>
                <optgroup label="Built-in Frameworks">
                  {frameworks.filter((f) => f.isBuiltIn).map((f) => (
                    <option key={f.id} value={f.id}>{f.shortName} — {f.name}</option>
                  ))}
                </optgroup>
                {frameworks.some((f) => !f.isBuiltIn) && (
                  <optgroup label="Custom Frameworks">
                    {frameworks.filter((f) => !f.isBuiltIn).map((f) => (
                      <option key={f.id} value={f.id}>{f.shortName} — {f.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
              <button
                type="button"
                onClick={() => setShowNewFramework(!showNewFramework)}
                className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-400 hover:bg-violet-500/20 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> New
              </button>
            </div>
          </div>

          {/* Inline new framework form */}
          {showNewFramework && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3">
              <p className="text-xs font-medium text-violet-400">Create New Framework</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-500">Full Name</label>
                  <input
                    value={newFwName}
                    onChange={(e) => setNewFwName(e.target.value)}
                    placeholder="e.g. Internal Security Standard"
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-zinc-500">Short Name</label>
                  <input
                    value={newFwShort}
                    onChange={(e) => setNewFwShort(e.target.value)}
                    placeholder="e.g. ISS"
                    className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Description</label>
                <input
                  value={newFwDesc}
                  onChange={(e) => setNewFwDesc(e.target.value)}
                  placeholder="Brief description of this framework"
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-1.5 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-zinc-500">Color</label>
                <div className="flex flex-wrap gap-1.5">
                  {FW_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewFwColor(c)}
                      className={`h-6 w-6 rounded-full ${c} transition-all ${
                        newFwColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateFramework}
                disabled={!newFwName.trim() || !newFwShort.trim()}
                className="rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-40 transition-colors"
              >
                Create Framework
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Rule Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lawful Basis for Processing"
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Description / What to Check</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe what the policy should contain to satisfy this requirement…"
              className="w-full resize-none rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Section reference */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Section / Reference (optional)</label>
              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="e.g. Article 6, §164.308"
                className="w-full rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Severity</label>
              <div className="flex gap-1.5">
                {SEVERITIES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`flex-1 rounded-lg border px-2 py-2 text-[11px] font-medium transition-all ${
                      severity === s.value
                        ? "border-white/20 bg-zinc-700 text-white"
                        : "border-white/[0.06] bg-zinc-800/50 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${s.color}`} />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Keywords <span className="text-zinc-600">(for auto-detection hints)</span>
            </label>
            <div className="flex gap-2">
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                placeholder="Add keyword and press Enter…"
                className="flex-1 rounded-lg border border-white/[0.08] bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={addKeyword}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-300"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    {kw}
                    <button
                      type="button"
                      onClick={() => removeKeyword(kw)}
                      className="ml-0.5 rounded-full hover:text-red-400"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-white/[0.06] bg-zinc-900/95 backdrop-blur px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
          >
            {editingRule ? "Save Changes" : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}
