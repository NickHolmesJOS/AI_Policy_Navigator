"use client";

import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { KeyboardShortcuts } from "@/components/ui/KeyboardShortcuts";
import { AIChatBubble } from "@/components/ui/AIChatBubble";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <CommandPalette />
      <KeyboardShortcuts />
      {children}
      <ScrollToTop />
      <AIChatBubble />
    </ToastProvider>
  );
}
