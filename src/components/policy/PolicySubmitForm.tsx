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
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  const { addPolicy, setStatus, setAnalysis, selectPolicy } = usePolicyStore();

  const handleFileRead = useCallback((file: File) => {
    setFileName(file.name);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setContent((e.target?.result as string) || "");
    };
    reader.readAsText(file);
  }, [title]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md"))) {
        handleFileRead(file);
      }
    },
    [handleFileRead]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    const policy = addPolicy(title.trim(), content.trim(), category);
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
      } else {
        setStatus(policy.id, "error");
      }
    } catch {
      setStatus(policy.id, "error");
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
            ) : (
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
                  accept=".txt,.md,.text"
                  className="hidden"
                  onChange={handleFileInput}
                />
                {fileName ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-violet-400" />
                    <p className="text-white font-medium">{fileName}</p>
                    <p className="text-zinc-400 text-sm">
                      {content.length.toLocaleString()} characters loaded
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName(null);
                        setContent("");
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-zinc-500" />
                    <p className="text-zinc-400">
                      Drop a file here or{" "}
                      <span className="text-violet-400">browse</span>
                    </p>
                    <p className="text-zinc-500 text-xs">
                      Supports .txt, .md files
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="gradient"
            className="w-full"
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? (
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
