"use client";

import Link from "next/link";
import {
  Shield,
  BarChart3,
  MessageSquare,
  FolderOpen,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Lock,
  Eye,
  GitCompareArrows,
  FileText,
  TrendingUp,
  Bot,
} from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { FadeInView } from "@/components/ui/Animations";

const FEATURES = [
  {
    icon: BarChart3,
    title: "AI-Powered Analysis",
    description:
      "Submit any policy document and get instant AI-driven risk scoring, compliance checks, and actionable findings.",
    color: "from-violet-500 to-indigo-500",
  },
  {
    icon: MessageSquare,
    title: "Policy Q&A Chat",
    description:
      "Ask questions about your policies in natural language and get precise, context-aware answers from AI.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description:
      "Tag, categorize, and organize policies into folders. Keep your policy library clean and searchable.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: Shield,
    title: "Risk Assessment",
    description:
      "Get detailed risk scores with visual gauges, severity breakdowns, and prioritized recommendations.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: GitCompareArrows,
    title: "Side-by-Side Compare",
    description:
      "Compare two policies head-to-head with visual diff badges, risk score deltas, and compliance breakdowns.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: FileText,
    title: "Export Reports",
    description:
      "Download detailed Markdown analysis reports with risk indicators, findings tables, and recommendations.",
    color: "from-sky-500 to-indigo-400",
  },
];

const STATS = [
  { value: "8", label: "Policy Categories" },
  { value: "AI", label: "Powered Analysis" },
  { value: "Real-time", label: "Chat Responses" },
  { value: "100%", label: "Local & Private" },
];

const FLOATING_ICONS = [
  { Icon: Shield, x: "8%", y: "20%", delay: 0, size: "h-5 w-5", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  { Icon: BarChart3, x: "85%", y: "15%", delay: 2, size: "h-4 w-4", color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
  { Icon: Bot, x: "5%", y: "65%", delay: 4, size: "h-4 w-4", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { Icon: TrendingUp, x: "90%", y: "60%", delay: 1, size: "h-5 w-5", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { Icon: Lock, x: "15%", y: "80%", delay: 3, size: "h-3.5 w-3.5", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { Icon: FileText, x: "80%", y: "80%", delay: 5, size: "h-3.5 w-3.5", color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative isolate overflow-hidden">
        {/* Animated gradient mesh background */}
        <div className="pointer-events-none absolute inset-0 -z-10 gradient-mesh" />
        {/* Grid pattern overlay */}
        <div className="pointer-events-none absolute inset-0 -z-10 grid-pattern" />
        {/* Glow orbs */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-violet-700/10 blur-3xl" />
        <div className="pointer-events-none absolute top-20 -right-40 -z-10 h-[400px] w-[400px] rounded-full bg-cyan-600/5 blur-3xl" />
        <div className="pointer-events-none absolute top-60 -left-40 -z-10 h-[350px] w-[350px] rounded-full bg-indigo-600/5 blur-3xl" />

        {/* Floating icon badges */}
        <div className="pointer-events-none absolute inset-0 -z-[5] hidden lg:block">
          {FLOATING_ICONS.map((item, i) => (
            <div
              key={i}
              className={`absolute flex h-10 w-10 items-center justify-center rounded-xl border ${item.bg}`}
              style={{
                left: item.x,
                top: item.y,
                animation: `float 4s ease-in-out ${item.delay}s infinite`,
              }}
            >
              <item.Icon className={`${item.size} ${item.color}`} />
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-24 pt-20 text-center sm:px-6 sm:pb-32 sm:pt-28 lg:px-8">
          <FadeInView>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-sm font-medium text-violet-300">
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Policy Intelligence
            </span>

            <h1 className="mx-auto max-w-3xl text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Navigate Your Policies{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                with AI
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg">
              Analyze, organize, and understand your policies with AI-powered
              insights. Get instant risk assessments, compliance checks, and smart
              recommendations.
            </p>
          </FadeInView>

          <FadeInView delay={0.15}>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-600/30 active:scale-[.97]"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/analyze"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
              >
                View Analysis
              </Link>
            </div>
          </FadeInView>

          {/* Keyboard shortcut hint */}
          <FadeInView delay={0.25}>
            <p className="mt-6 text-xs text-zinc-600">
              Press{" "}
              <kbd className="mx-0.5 inline-flex h-5 items-center rounded border border-white/10 bg-white/[0.04] px-1.5 text-[10px] font-medium text-zinc-400">
                ⌘K
              </kbd>{" "}
              to search &middot;{" "}
              <kbd className="mx-0.5 inline-flex h-5 items-center rounded border border-white/10 bg-white/[0.04] px-1.5 text-[10px] font-medium text-zinc-400">
                ?
              </kbd>{" "}
              for shortcuts
            </p>
          </FadeInView>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-white/[0.015]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {STATS.map((s, i) => (
            <FadeInView key={s.label} delay={i * 0.06}>
              <div className="text-center">
                <p className="text-2xl font-bold text-white sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500 sm:text-sm">
                  {s.label}
                </p>
              </div>
            </FadeInView>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView>
            <div className="mb-14 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Everything you need for{" "}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  policy management
                </span>
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-zinc-400 sm:text-base">
                From AI analysis to smart organization, our platform helps you
                understand and manage policies efficiently.
              </p>
            </div>
          </FadeInView>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <FadeInView key={f.title} delay={i * 0.06}>
                <div className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.04] hover:shadow-lg hover:shadow-violet-500/[0.03]">
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${f.color} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <f.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-white">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                    {f.description}
                  </p>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────── */}
      <section className="relative border-t border-white/[0.06] py-20 sm:py-24">
        <div className="pointer-events-none absolute inset-0 dot-pattern" />
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <FadeInView>
            <div className="mb-14 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                How it works
              </h2>
              <p className="mt-3 text-sm text-zinc-400 sm:text-base">
                Three simple steps to smarter policy management
              </p>
            </div>
          </FadeInView>

          <div className="grid gap-10 sm:grid-cols-3 sm:gap-6">
            {(
              [
                {
                  step: "1",
                  title: "Submit Your Policy",
                  desc: "Paste or upload your policy document. We support text and markdown files.",
                  Icon: Zap,
                  color: "from-violet-500 to-indigo-500",
                },
                {
                  step: "2",
                  title: "AI Analyzes It",
                  desc: "Our AI scores risks, checks compliance, and identifies key findings instantly.",
                  Icon: Eye,
                  color: "from-cyan-500 to-blue-500",
                },
                {
                  step: "3",
                  title: "Get Insights",
                  desc: "Review findings, ask questions, and organize policies with smart tools.",
                  Icon: CheckCircle,
                  color: "from-emerald-500 to-teal-500",
                },
              ] as const
            ).map((item, i) => (
              <FadeInView key={item.step} delay={i * 0.1}>
                <div className="text-center">
                  <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}>
                    <item.Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold text-violet-400">
                    {item.step}
                  </span>
                  <h3 className="text-base font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-sm text-zinc-400">
                    {item.desc}
                  </p>
                </div>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <FadeInView>
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/[0.12] to-indigo-600/[0.08] p-10 text-center sm:p-14">
            <div className="pointer-events-none absolute inset-0 grid-pattern" />
            <div className="relative z-10">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-600/25">
                <Lock className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Ready to get started?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-zinc-300 sm:text-base">
                Start analyzing your policies today. Works in demo mode — no API
                key required to try it out.
              </p>
              <Link
                href="/dashboard"
                className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-600/30 active:scale-[.97]"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </FadeInView>
      </section>

      <Footer />
    </>
  );
}
