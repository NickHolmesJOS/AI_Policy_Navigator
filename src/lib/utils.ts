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

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  const groups = word.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  // subtract silent trailing 'e' unless the whole word is a vowel sound
  if (word.endsWith("e") && count > 1) count--;
  return Math.max(1, count);
}

export interface ReadingLevel {
  ease: number;       // Flesch Reading Ease score (0–100, higher = easier)
  grade: number;      // Flesch-Kincaid Grade Level
  label: string;      // Plain-language label
  color: string;      // Tailwind text color class
  easeLabel: string;  // Short ease descriptor
}

export function calcReadingLevel(text: string): ReadingLevel {
  const sentenceCount = Math.max(1, (text.match(/[.!?]+/g) || []).length);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const syllableCount = words.reduce((sum, w) => sum + countSyllables(w), 0);

  // Flesch Reading Ease (0–100)
  const rawEase =
    206.835 -
    1.015 * (wordCount / sentenceCount) -
    84.6 * (syllableCount / wordCount);
  const ease = Math.round(Math.max(0, Math.min(100, rawEase)));

  // Flesch-Kincaid Grade Level
  const grade = Math.max(
    1,
    Math.round(0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59)
  );

  let label: string;
  let easeLabel: string;
  let color: string;
  if (ease >= 70) {
    label = "Easy Read"; easeLabel = "Easy"; color = "text-emerald-400";
  } else if (ease >= 50) {
    label = "Standard"; easeLabel = "Standard"; color = "text-blue-400";
  } else if (ease >= 30) {
    label = "Complex"; easeLabel = "Difficult"; color = "text-amber-400";
  } else {
    label = "Very Complex"; easeLabel = "Very Difficult"; color = "text-red-400";
  }

  return { ease, grade, label, color, easeLabel };
}
