"use client";

import { useState, useRef, useEffect } from "react";
import { usePolicyStore } from "@/store/policyStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ChatMessage } from "@/types";
import { generateId } from "@/lib/utils";
import {
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

const SUGGESTED_QUESTIONS = [
  "What are the main risks in this policy?",
  "Does this policy comply with GDPR?",
  "What actions are required by employees?",
  "What are the data retention requirements?",
  "How does this policy affect third-party vendors?",
  "What are the penalties for non-compliance?",
];

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          isUser
            ? "bg-violet-600"
            : "bg-gradient-to-br from-violet-500 to-indigo-600"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          isUser
            ? "bg-violet-600 text-white rounded-tr-md"
            : "bg-white/5 border border-white/10 text-zinc-200 rounded-tl-md"
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <p
          className={cn(
            "text-xs mt-1.5",
            isUser ? "text-violet-200" : "text-zinc-500"
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

export function PolicyChat() {
  const { selectedPolicyId, policies, addChatMessage, clearChat } =
    usePolicyStore();
  const policy = policies.find((p) => p.id === selectedPolicyId);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [policy?.chatHistory]);

  if (!policy) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
          <MessageSquare className="w-10 h-10 text-violet-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Policy Q&A
        </h3>
        <p className="text-zinc-400 max-w-sm">
          Select a policy to start asking questions about it.
        </p>
      </div>
    );
  }

  const handleSend = async (question?: string) => {
    const text = question || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    addChatMessage(policy.id, userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policyId: policy.id,
          question: text,
          policyContent: policy.content,
          policyTitle: policy.title,
          chatHistory: policy.chatHistory,
        }),
      });

      if (res.ok) {
        const { answer } = await res.json();
        const assistantMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content: answer,
          timestamp: new Date().toISOString(),
        };
        addChatMessage(policy.id, assistantMessage);
      } else {
        const errorMessage: ChatMessage = {
          id: generateId(),
          role: "assistant",
          content:
            "I encountered an error processing your question. Please check your API configuration.",
          timestamp: new Date().toISOString(),
        };
        addChatMessage(policy.id, errorMessage);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "Connection error. Please try again.",
        timestamp: new Date().toISOString(),
      };
      addChatMessage(policy.id, errorMessage);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/5 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Ask AI about this policy
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 truncate max-w-xs">
            {policy.title}
          </p>
        </div>
        {policy.chatHistory.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearChat(policy.id);
              toast({ title: "Chat cleared", variant: "info" });
            }}
            title="Clear chat"
          >
            <Trash2 className="w-4 h-4 text-zinc-400" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {policy.chatHistory.length === 0 ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-3">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <p className="text-zinc-300 text-sm font-medium">
                Ready to answer your questions
              </p>
              <p className="text-zinc-500 text-xs mt-1">
                Ask me anything about &ldquo;{policy.title}&rdquo;
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 font-medium">
                Suggested questions:
              </p>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="w-full text-left p-3 rounded-lg border border-white/10 hover:border-violet-500/30 hover:bg-violet-500/5 text-sm text-zinc-400 hover:text-white transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {policy.chatHistory.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-white/5">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ask a question about this policy..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            variant="gradient"
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
