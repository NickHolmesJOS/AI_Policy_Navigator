"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePolicyStore, useAllFrameworks, useAllComplianceRules } from "@/store/policyStore";
import type {
  Policy,
  PolicyFolder,
  ComplianceAssignment,
  ComplianceCheckResult,
  ComplianceAssignmentLevel,
} from "@/types";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Loader2,
  Trash2,
  Minus,
  ChevronUp,
  Bot,
  User,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

function buildContextSummary(
  policies: Policy[],
  folders: PolicyFolder[],
  complianceAssignments: ComplianceAssignment[],
  complianceResults: ComplianceCheckResult[],
  frameworkNames: Record<string, string>,
  ruleNames: Record<string, string>,
): string {
  const lines: string[] = [];

  lines.push(`=== WORKSPACE SUMMARY ===`);
  lines.push(`Total policies: ${policies.length}`);
  lines.push(`Folders: ${folders.length}`);

  // Folder breakdown
  if (folders.length > 0) {
    lines.push(`\nFolders:`);
    for (const f of folders) {
      const count = policies.filter((p) => p.folderId === f.id).length;
      lines.push(`  - ${f.name} (${count} policies)`);
    }
  }

  // All unique tags
  const allTags = new Set<string>();
  policies.forEach((p) => p.tags.forEach((t) => allTags.add(t.name)));
  if (allTags.size > 0) {
    lines.push(`\nTags in use: ${[...allTags].join(", ")}`);
  }

  // Policy summaries
  if (policies.length > 0) {
    lines.push(`\n=== POLICIES ===`);
    for (const p of policies.slice(0, 25)) {
      const folder = folders.find((f) => f.id === p.folderId);
      const tags = p.tags.map((t) => t.name).join(", ");
      lines.push(`\nPolicy: "${p.title}" [${p.status}]`);
      lines.push(`  Category: ${p.category}`);
      if (folder) lines.push(`  Folder: ${folder.name}`);
      if (tags) lines.push(`  Tags: ${tags}`);
      if (p.isFavorite) lines.push(`  ★ Favorited`);
      if (p.analysis) {
        lines.push(`  Risk Score: ${p.analysis.riskScore}/100 (${p.analysis.riskLevel})`);
        lines.push(`  Summary: ${p.analysis.summary.slice(0, 200)}`);
        if (p.analysis.keyFindings.length > 0) {
          lines.push(`  Key Findings: ${p.analysis.keyFindings.length} findings`);
          for (const f of p.analysis.keyFindings.slice(0, 3)) {
            lines.push(`    - [${f.severity}] ${f.title}`);
          }
        }
        if (p.analysis.recommendations.length > 0) {
          lines.push(`  Top Recommendations:`);
          for (const r of p.analysis.recommendations.slice(0, 2)) {
            lines.push(`    - ${r.slice(0, 120)}`);
          }
        }
      }

      // Compliance results for this policy
      const pResults = complianceResults.filter((r) => r.policyId === p.id);
      if (pResults.length > 0) {
        const pass = pResults.filter((r) => r.status === "pass").length;
        const fail = pResults.filter((r) => r.status === "fail").length;
        const partial = pResults.filter((r) => r.status === "partial").length;
        lines.push(`  Compliance: ${pass} pass, ${fail} fail, ${partial} partial out of ${pResults.length} checked`);
      }
    }
    if (policies.length > 25) {
      lines.push(`\n... and ${policies.length - 25} more policies`);
    }
  }

  // Compliance assignments summary
  if (complianceAssignments.length > 0) {
    lines.push(`\n=== COMPLIANCE ASSIGNMENTS ===`);
    lines.push(`Total assignments: ${complianceAssignments.length}`);
    const byLevel = { folder: 0, tag: 0, policy: 0 };
    complianceAssignments.forEach((a) => { if (a.enabled) byLevel[a.level]++; });
    lines.push(`  By folder: ${byLevel.folder}, By tag: ${byLevel.tag}, Individual: ${byLevel.policy}`);
  }

  return lines.join("\n");
}

// Simple markdown-ish rendering for bold and lists
function renderContent(text: string) {
  const parts = text.split("\n");
  return parts.map((line, i) => {
    // Bold
    let processed = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Bullet lists
    if (processed.match(/^[-•]\s/)) {
      processed = processed.replace(/^[-•]\s/, "");
      return (
        <li
          key={i}
          className="ml-4 list-disc text-inherit"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    }
    // Numbered lists
    if (processed.match(/^\d+\.\s/)) {
      return (
        <li
          key={i}
          className="ml-4 list-decimal text-inherit"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
      );
    }
    if (processed.trim() === "") return <br key={i} />;
    return (
      <p
        key={i}
        className="text-inherit"
        dangerouslySetInnerHTML={{ __html: processed }}
      />
    );
  });
}

const SUGGESTED_QUESTIONS = [
  "How many policies do I have?",
  "What's my compliance status?",
  "Which policies are highest risk?",
  "What can you help me with?",
];

export function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { policies, folders, complianceAssignments, complianceResults } = usePolicyStore();
  const frameworks = useAllFrameworks();
  const rules = useAllComplianceRules();

  const frameworkNames = useMemo(() => {
    const map: Record<string, string> = {};
    frameworks.forEach((f) => { map[f.id] = f.name; });
    return map;
  }, [frameworks]);

  const ruleNames = useMemo(() => {
    const map: Record<string, string> = {};
    rules.forEach((r) => { map[r.id] = r.title; });
    return map;
  }, [rules]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
      setHasNewMessage(false);
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async (text?: string) => {
    const question = (text || input).trim();
    if (!question || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const context = buildContextSummary(
        policies,
        folders,
        complianceAssignments,
        complianceResults,
        frameworkNames,
        ruleNames,
      );

      const chatHistory = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, context, chatHistory }),
      });

      const data = await res.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer || "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (!isOpen || isMinimized) {
        setHasNewMessage(true);
      }
    } catch {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const toggleOpen = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
      setIsMinimized(false);
    }
    setHasNewMessage(false);
  };

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          className={`fixed bottom-20 right-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-2xl shadow-black/40 transition-all duration-300 ${
            isMinimized ? "h-12 w-72" : "h-[520px] w-[380px]"
          }`}
          style={{ maxHeight: "calc(100vh - 120px)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] bg-zinc-900/95 px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">AI Assistant</p>
                {!isMinimized && (
                  <p className="text-[10px] text-zinc-500">Ask about your policies & data</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && !isMinimized && (
                <button
                  onClick={clearChat}
                  className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                  title="Clear chat"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <ChevronUp className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-red-400 transition-colors"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scroll-smooth">
                {messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 mb-3">
                      <Bot className="h-7 w-7 text-violet-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1">
                      Hi! I&apos;m your AI Assistant
                    </h3>
                    <p className="text-xs text-zinc-500 mb-4 max-w-[260px]">
                      I can answer questions about your policies, compliance status, risk assessments, and help you navigate the app.
                    </p>
                    <div className="w-full space-y-1.5">
                      {SUGGESTED_QUESTIONS.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="w-full rounded-xl border border-white/[0.06] bg-zinc-800/50 px-3 py-2 text-left text-xs text-zinc-300 hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-white transition-all"
                        >
                          <Sparkles className="mr-1.5 inline h-3 w-3 text-violet-400" />
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                          msg.role === "user"
                            ? "bg-zinc-700"
                            : "bg-gradient-to-br from-violet-500 to-indigo-600"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="h-3 w-3 text-zinc-300" />
                        ) : (
                          <Bot className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === "user"
                            ? "bg-violet-600 text-white rounded-tr-md"
                            : "bg-zinc-800 text-zinc-200 rounded-tl-md"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="space-y-1 [&_strong]:font-semibold [&_strong]:text-white">
                            {renderContent(msg.content)}
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                    <div className="rounded-2xl rounded-tl-md bg-zinc-800 px-4 py-2.5">
                      <div className="flex gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-white/[0.06] p-3">
                <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-800/60 px-3 py-2 focus-within:border-violet-500/50 transition-colors">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Ask about your policies…"
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none"
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white transition-all hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600"
                  >
                    {isLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating bubble button */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg shadow-black/30 transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen
            ? "bg-zinc-800 border border-white/10 hover:bg-zinc-700"
            : "bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
        }`}
        title="AI Assistant"
      >
        {isOpen ? (
          <MessageCircle className="h-6 w-6 text-zinc-300" />
        ) : (
          <Sparkles className="h-6 w-6 text-white" />
        )}
        {/* New message indicator */}
        {hasNewMessage && !isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-zinc-950">
            !
          </span>
        )}
        {/* Pulse effect when closed */}
        {!isOpen && messages.length === 0 && (
          <span className="absolute inset-0 rounded-full bg-violet-500 opacity-20 animate-ping" />
        )}
      </button>
    </>
  );
}
