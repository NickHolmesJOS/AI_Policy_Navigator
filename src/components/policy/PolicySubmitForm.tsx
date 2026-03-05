"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { usePolicyStore } from "@/store/policyStore";
import type { PolicyCategory } from "@/types";
import {
  FileText,
  Upload,
  X,
  Loader2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import { extractFileText, isSupportedFile } from "@/lib/extractFile";

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

interface PolicySubmitFormProps {
  onClose?: () => void;
  onSuccess?: (policyId: string) => void;
}

export function PolicySubmitForm({ onClose, onSuccess }: PolicySubmitFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<PolicyCategory>("Other");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"text" | "file">("text");
  const [isParsing, setIsParsing] = useState(false);
  const [filePages, setFilePages] = useState<number | null>(null);
  const [pageContents, setPageContents] = useState<string[] | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const { addPolicy, setStatus, setAnalysis, selectPolicy } = usePolicyStore();
  const { toast } = useToast();

  const handleFileRead = useCallback(async (file: File) => {
    setFileName(file.name);
    setFilePages(null);
    setPageContents(null);
    setCurrentPage(0);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    setIsParsing(true);
    try {
      const { text, pages, pageContents: extracted } = await extractFileText(file);
      setContent(text);
      if (pages) setFilePages(pages);
      if (extracted?.length) setPageContents(extracted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not read file";
      toast({ title: "Extraction failed", description: msg, variant: "error" });
      setFileName(null);
    } finally {
      setIsParsing(false);
    }
  }, [title, toast]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (isSupportedFile(file)) {
        handleFileRead(file);
      } else {
        toast({ title: "Unsupported file type", description: "Please drop a PDF, DOCX, TXT, or MD file", variant: "error" });
      }
    },
    [handleFileRead, toast]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const policy = addPolicy(title.trim(), content.trim(), category, pageContents ?? undefined);
    selectPolicy(policy.id);

    // Run analysis immediately
    setStatus(policy.id, "analyzing");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policyId: policy.id, content: content.trim(), title: title.trim() }),
      });

      if (res.ok) {
        const analysis = await res.json();
        setAnalysis(policy.id, analysis);
        toast({ title: "Policy analyzed", description: `"${title.trim()}" — Risk score: ${analysis.riskScore}/100`, variant: "success" });
      } else {
        setStatus(policy.id, "error");
        toast({ title: "Analysis failed", description: "Policy saved but analysis encountered an error", variant: "error" });
      }
    } catch {
      setStatus(policy.id, "error");
      toast({ title: "Connection error", description: "Policy saved but could not reach the analysis API", variant: "error" });
    }

    setIsSubmitting(false);
    onSuccess?.(policy.id);
    onClose?.();
  };

  const isValid = title.trim().length > 0 && content.trim().length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto" glow>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <CardTitle>Submit New Policy</CardTitle>
              <p className="text-sm text-zinc-400 mt-0.5">
                Add a policy for AI-powered analysis
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Policy Title
            </label>
            <Input
              placeholder="e.g., Data Privacy Policy 2024"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Category
            </label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as PolicyCategory)}
              options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            />
          </div>

          {/* Content tabs */}
          <div className="space-y-3">
            <div className="flex gap-1 p-1 bg-white/5 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === "text"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <FileText className="w-4 h-4 inline mr-1.5" />
                Paste Text
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("file")}
                className={cn(
                  "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeTab === "file"
                    ? "bg-violet-600 text-white"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Upload className="w-4 h-4 inline mr-1.5" />
                Upload File
              </button>
            </div>

            {activeTab === "text" ? (
              <Textarea
                placeholder="Paste your policy content here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px]"
                required
              />
            ) : isParsing ? (
              /* ── Parsing spinner ──────────────────────────────── */
              <div className="border-2 border-dashed border-white/10 rounded-xl p-10 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                  <p className="text-zinc-300 font-medium">Extracting text…</p>
                  <p className="text-zinc-500 text-xs">Reading {fileName}</p>
                </div>
              </div>
            ) : fileName ? (
              /* ── Page reader ──────────────────────────────────── */
              <div className="border border-white/10 rounded-xl overflow-hidden">
                {/* Reader header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/10">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                    <span className="text-sm text-white font-medium truncate">{fileName}</span>
                    {filePages && (
                      <span className="text-xs text-zinc-500 shrink-0">
                        &middot; {filePages} page{filePages !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileName(null);
                      setContent("");
                      setFilePages(null);
                      setPageContents(null);
                      setCurrentPage(0);
                    }}
                    className="text-zinc-500 hover:text-red-400 transition-colors ml-3 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Page content */}
                <div className="h-60 overflow-y-auto p-5 bg-black/20">
                  <pre className="text-xs text-zinc-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {pageContents ? (pageContents[currentPage] ?? "") : content}
                  </pre>
                </div>

                {/* Pagination footer */}
                {pageContents && pageContents.length > 1 && (
                  <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Prev
                    </button>
                    <span className="text-xs text-zinc-400 tabular-nums">
                      Page {currentPage + 1} of {pageContents.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(pageContents.length - 1, p + 1))
                      }
                      disabled={currentPage === pageContents.length - 1}
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Swap file */}
                <label
                  htmlFor="file-input-swap"
                  className="block text-center text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer py-2 transition-colors border-t border-white/5"
                >
                  Upload a different file
                  <input
                    id="file-input-swap"
                    type="file"
                    accept=".txt,.md,.text,.pdf,.docx"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </label>
              </div>
            ) : (
              /* ── Drop zone ────────────────────────────────────── */
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer",
                  isDragging
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-white/10 hover:border-white/20"
                )}
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".txt,.md,.text,.pdf,.docx"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-zinc-500" />
                  <p className="text-zinc-400">
                    Drop a file here or{" "}
                    <span className="text-violet-400">browse</span>
                  </p>
                  <p className="text-zinc-500 text-xs">Supports PDF, DOCX, TXT, MD</p>
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={!isValid || isSubmitting || isParsing}
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Extracting text…
              </>
            ) : isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Policy...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Submit & Analyze
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
