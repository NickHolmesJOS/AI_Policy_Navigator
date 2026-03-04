import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { RiskLevel } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "text-emerald-400";
    case "medium":
      return "text-amber-400";
    case "high":
      return "text-orange-400";
    case "critical":
      return "text-red-400";
  }
}

export function getRiskBg(level: RiskLevel): string {
  switch (level) {
    case "low":
      return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
    case "medium":
      return "bg-amber-500/10 border-amber-500/20 text-amber-400";
    case "high":
      return "bg-orange-500/10 border-orange-500/20 text-orange-400";
    case "critical":
      return "bg-red-500/10 border-red-500/20 text-red-400";
  }
}

export function getRiskLabel(score: number): RiskLevel {
  if (score <= 30) return "low";
  if (score <= 60) return "medium";
  if (score <= 80) return "high";
  return "critical";
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function estimateReadingTime(wordCount: number): number {
  return Math.ceil(wordCount / 200);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
