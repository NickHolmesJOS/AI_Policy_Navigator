import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        {
          "bg-violet-500/10 border-violet-500/20 text-violet-400":
            variant === "default",
          "bg-emerald-500/10 border-emerald-500/20 text-emerald-400":
            variant === "success",
          "bg-amber-500/10 border-amber-500/20 text-amber-400":
            variant === "warning",
          "bg-red-500/10 border-red-500/20 text-red-400": variant === "danger",
          "bg-blue-500/10 border-blue-500/20 text-blue-400": variant === "info",
          "bg-transparent border-white/20 text-zinc-400": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
