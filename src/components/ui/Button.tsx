import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
          {
            "bg-violet-600 text-white hover:bg-violet-700 shadow-lg shadow-violet-500/20":
              variant === "default",
            "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20":
              variant === "destructive",
            "border border-white/10 bg-white/5 hover:bg-white/10 text-white":
              variant === "outline",
            "bg-white/10 text-white hover:bg-white/20":
              variant === "secondary",
            "hover:bg-white/5 text-zinc-400 hover:text-white":
              variant === "ghost",
            "underline-offset-4 hover:underline text-violet-400":
              variant === "link",
            "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/25":
              variant === "gradient",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 px-3 text-xs": size === "sm",
            "h-11 px-8 text-base": size === "lg",
            "h-9 w-9": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
