import type { ReactNode } from "react";

const navItems = [
  { label: "Assessment", href: "#assessment" },
  { label: "Inventory", href: "#inventory" },
  { label: "Security tests", href: "#security-tests" },
  { label: "Reports", href: "#reports" },
  { label: "Monitoring", href: "#monitoring" },
  { label: "Audit", href: "#audit" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[260px] h-[420px] w-[420px] rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-120px] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-sm font-bold text-cyan-100">
              AG
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AI Governance Sentinel</p>
              <p className="text-xs text-slate-500">Enterprise AI control plane</p>
            </div>
          </a>

          <nav className="hidden items-center gap-2 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <a
            href="https://github.com/DiabiWali/ai-governance-sentinel"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100 sm:inline-flex"
          >
            GitHub
          </a>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-8">
        {children}

        <footer className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-500">
          AI Governance Sentinel · Inventory, assess, secure, report and monitor enterprise AI agents.
        </footer>
      </div>
    </main>
  );
}
