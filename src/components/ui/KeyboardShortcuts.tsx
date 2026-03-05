"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Keyboard } from "lucide-react";

const SHORTCUT_GROUPS = [
  {
    title: "Navigation",
    items: [
      { keys: ["⌘", "K"], desc: "Open command palette" },
      { keys: ["?"], desc: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Quick Go",
    items: [
      { keys: ["G", "then", "H"], desc: "Go to Home" },
      { keys: ["G", "then", "D"], desc: "Go to Dashboard" },
      { keys: ["G", "then", "A"], desc: "Go to Analysis" },
      { keys: ["G", "then", "C"], desc: "Go to Chat" },
      { keys: ["G", "then", "T"], desc: "Go to Templates" },
      { keys: ["G", "then", "M"], desc: "Go to Compliance" },
      { keys: ["G", "then", "L"], desc: "Go to Activity Log" },
      { keys: ["G", "then", "S"], desc: "Go to Settings" },
    ],
  },
  {
    title: "General",
    items: [
      { keys: ["Esc"], desc: "Close dialog / palette" },
      { keys: ["↑", "↓"], desc: "Navigate list items" },
      { keys: ["Enter"], desc: "Confirm selection" },
    ],
  },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let gPressed = false;
    let gTimeout: ReturnType<typeof setTimeout>;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ? to open shortcuts
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !isInput) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      // G then X navigation
      if (!isInput && !e.metaKey && !e.ctrlKey) {
        if (e.key === "g" || e.key === "G") {
          gPressed = true;
          clearTimeout(gTimeout);
          gTimeout = setTimeout(() => {
            gPressed = false;
          }, 1000);
          return;
        }

        if (gPressed) {
          gPressed = false;
          clearTimeout(gTimeout);
          const routes: Record<string, string> = {
            h: "/",
            d: "/dashboard",
            a: "/analyze",
            c: "/chat",
            o: "/organize",
            p: "/compare",
            t: "/templates",
            m: "/compliance",
            l: "/activity",
            s: "/settings",
          };
          const route = routes[e.key.toLowerCase()];
          if (route) {
            e.preventDefault();
            window.location.href = route;
          }
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearTimeout(gTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-4 w-4 text-violet-400" />
                <h3 className="font-semibold text-white">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5">
              {SHORTCUT_GROUPS.map((group) => (
                <div key={group.title}>
                  <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {group.title}
                  </h4>
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.desc}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.03]"
                      >
                        <span className="text-sm text-zinc-400">
                          {item.desc}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.keys.map((k, i) =>
                            k === "then" ? (
                              <span
                                key={i}
                                className="text-[10px] text-zinc-600"
                              >
                                then
                              </span>
                            ) : (
                              <kbd
                                key={i}
                                className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 text-xs font-medium text-zinc-300"
                              >
                                {k}
                              </kbd>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-white/[0.03] p-3 text-center">
              <p className="text-xs text-zinc-500">
                Press <kbd className="mx-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-white/10 bg-white/[0.04] px-1 text-[10px] font-medium text-zinc-300">?</kbd> to toggle this dialog
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
