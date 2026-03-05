import Link from "next/link";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                AI Policy Navigator
              </span>
            </div>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              Analyze, organize, and understand your policies with AI-powered
              insights. Streamline compliance and risk management.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Navigate</h4>
            <ul className="space-y-2">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/analyze", label: "Analysis" },
                { href: "/chat", label: "Q&A Chat" },
                { href: "/templates", label: "Templates" },
                { href: "/compliance", label: "Compliance" },
                { href: "/compare", label: "Compare" },
                { href: "/activity", label: "Activity Log" },
                { href: "/settings", label: "Settings" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-400 hover:text-violet-400 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">About</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-zinc-400">
                  Built with Next.js & AI
                </span>
              </li>
              <li>
                <span className="text-sm text-zinc-400">
                  Works with or without API key
                </span>
              </li>
              <li>
                <span className="text-sm text-zinc-400">
                  Demo mode available
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} AI Policy Navigator. All rights
            reserved.
          </p>
          <p className="text-xs text-zinc-600">
            Powered by AI • Built with Next.js
          </p>
        </div>
      </div>
    </footer>
  );
}
