"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePolicyStore } from "@/store/policyStore";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Home,
  LayoutDashboard,
  BarChart3,
  MessageSquare,
  FolderOpen,
  GitCompareArrows,
  FileText,
  ArrowRight,
  Command,
  ShieldCheck,
  Activity,
  Settings,
  Sparkles,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[];
  group: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { policies, selectPolicy } = usePolicyStore();

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router]
  );

  const items = useMemo<CommandItem[]>(() => {
    const nav: CommandItem[] = [
      {
        id: "nav-home",
        label: "Home",
        description: "Go to landing page",
        icon: <Home className="h-4 w-4" />,
        action: () => go("/"),
        keywords: ["home", "landing"],
        group: "Navigation",
      },
      {
        id: "nav-dashboard",
        label: "Dashboard",
        description: "Open the dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
        action: () => go("/dashboard"),
        keywords: ["dashboard", "main"],
        group: "Navigation",
      },
      {
        id: "nav-analyze",
        label: "Analysis",
        description: "Policy analysis page",
        icon: <BarChart3 className="h-4 w-4" />,
        action: () => go("/analyze"),
        keywords: ["analyze", "risk", "assessment"],
        group: "Navigation",
      },
      {
        id: "nav-chat",
        label: "Q&A Chat",
        description: "Chat with AI about policies",
        icon: <MessageSquare className="h-4 w-4" />,
        action: () => go("/chat"),
        keywords: ["chat", "question", "ask"],
        group: "Navigation",
      },
      {
        id: "nav-organize",
        label: "Organize",
        description: "Tag and folder policies",
        icon: <FolderOpen className="h-4 w-4" />,
        action: () => go("/organize"),
        keywords: ["organize", "folder", "tag"],
        group: "Navigation",
      },
      {
        id: "nav-compare",
        label: "Compare",
        description: "Side-by-side policy comparison",
        icon: <GitCompareArrows className="h-4 w-4" />,
        action: () => go("/compare"),
        keywords: ["compare", "diff", "side"],
        group: "Navigation",
      },
      {
        id: "nav-templates",
        label: "Templates",
        description: "Start from a policy template",
        icon: <Sparkles className="h-4 w-4" />,
        action: () => go("/templates"),
        keywords: ["template", "starter", "blueprint"],
        group: "Navigation",
      },
      {
        id: "nav-compliance",
        label: "Compliance Matrix",
        description: "Regulatory coverage tracker",
        icon: <ShieldCheck className="h-4 w-4" />,
        action: () => go("/compliance"),
        keywords: ["compliance", "gdpr", "hipaa", "soc", "regulation"],
        group: "Navigation",
      },
      {
        id: "nav-activity",
        label: "Activity Log",
        description: "Audit trail of all actions",
        icon: <Activity className="h-4 w-4" />,
        action: () => go("/activity"),
        keywords: ["activity", "log", "history", "audit"],
        group: "Navigation",
      },
      {
        id: "nav-settings",
        label: "Settings",
        description: "Configure API key, preferences",
        icon: <Settings className="h-4 w-4" />,
        action: () => go("/settings"),
        keywords: ["settings", "config", "api", "preferences"],
        group: "Navigation",
      },
    ];

    const policyItems: CommandItem[] = policies.map((p) => ({
      id: `policy-${p.id}`,
      label: p.title,
      description: `${p.category} · ${p.status}`,
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        selectPolicy(p.id);
        go("/analyze");
      },
      keywords: [p.title.toLowerCase(), p.category.toLowerCase()],
      group: "Policies",
    }));

    return [...nav, ...policyItems];
  }, [go, policies, selectPolicy]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.keywords?.some((k) => k.includes(q))
    );
  }, [query, items]);

  // Group filtered items
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    }
    return groups;
  }, [filtered]);

  // Flatten for keyboard nav
  const flatFiltered = useMemo(() => filtered, [filtered]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleNav(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && flatFiltered[selectedIndex]) {
        e.preventDefault();
        flatFiltered[selectedIndex].action();
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", handleNav);
    return () => window.removeEventListener("keydown", handleNav);
  }, [open, flatFiltered, selectedIndex]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="fixed left-1/2 top-[20%] z-[91] w-full max-w-lg -translate-x-1/2 overflow-hidden rounded-xl border border-white/[0.08] bg-zinc-900 shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
              <Search className="h-4 w-4 shrink-0 text-zinc-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, pages, policies…"
                className="h-12 flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 focus:outline-none"
              />
              <kbd className="hidden shrink-0 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 sm:inline">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto p-2">
              {flatFiltered.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No results found
                </div>
              ) : (
                Object.entries(grouped).map(([group, groupItems]) => (
                  <div key={group}>
                    <div className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                      {group}
                    </div>
                    {groupItems.map((item) => {
                      const idx = flatFiltered.indexOf(item);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            item.action();
                            setOpen(false);
                            setQuery("");
                          }}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                            idx === selectedIndex
                              ? "bg-violet-600/20 text-white"
                              : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                          )}
                        >
                          <span className="shrink-0 text-zinc-500">
                            {item.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-white">
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="ml-2 text-xs text-zinc-500">
                                {item.description}
                              </span>
                            )}
                          </div>
                          {idx === selectedIndex && (
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-violet-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 border-t border-white/[0.06] px-4 py-2 text-[11px] text-zinc-600">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 text-[10px]">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 text-[10px]">↵</kbd>
                Open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-white/10 bg-white/[0.04] px-1 text-[10px]">Esc</kbd>
                Close
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Small button to show in the navbar to hint about Cmd+K */
export function CommandPaletteTrigger() {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "k", metaKey: true })
        )
      }
      className="hidden items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300 md:flex"
    >
      <Search className="h-3 w-3" />
      <span>Search…</span>
      <kbd className="ml-2 flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.04] px-1 text-[10px] font-medium">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </button>
  );
}
