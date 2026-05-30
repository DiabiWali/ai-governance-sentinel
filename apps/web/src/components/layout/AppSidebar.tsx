import type { DashboardTab } from "@/components/layout/TabNavigation";

const navItems: Array<{
  key: DashboardTab;
  label: string;
  description: string;
  accent: string;
}> = [
  {
    key: "overview",
    label: "Overview",
    description: "Command center",
    accent: "bg-cyan-400",
  },
  {
    key: "agents",
    label: "Agents",
    description: "Inventory",
    accent: "bg-sky-400",
  },
  {
    key: "assessment",
    label: "Assessment",
    description: "Risk scoring",
    accent: "bg-blue-400",
  },
  {
    key: "security",
    label: "Security Tests",
    description: "Prompt injection",
    accent: "bg-purple-400",
  },
  {
    key: "compliance",
    label: "Compliance",
    description: "OWASP, NIST, AI Act",
    accent: "bg-emerald-400",
  },
  {
    key: "reports",
    label: "Reports",
    description: "PDF exports",
    accent: "bg-teal-400",
  },
  {
    key: "monitoring",
    label: "Monitoring",
    description: "Health and metrics",
    accent: "bg-lime-400",
  },
  {
    key: "audit",
    label: "Audit Logs",
    description: "Traceability",
    accent: "bg-orange-400",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Language",
    accent: "bg-pink-400",
  },
];

export function AppSidebar({
  activeTab,
  onChange,
}: {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}) {
  return (
    <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
      <div className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-slate-950/70 p-4 shadow-2xl backdrop-blur-xl">
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-sm font-bold text-cyan-100">
              AG
            </div>
            <div>
              <p className="font-semibold text-white">AI Governance</p>
              <p className="text-xs text-slate-400">Sentinel v1 workspace</p>
            </div>
          </div>
        </div>

        <nav className="mt-5 grid gap-2">
          {navItems.map((item) => {
            const active = activeTab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onChange(item.key)}
                className={`group flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? "border-cyan-400/40 bg-cyan-400/10 text-white shadow-lg shadow-cyan-950/30"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${item.accent} ${
                    active ? "opacity-100" : "opacity-40 group-hover:opacity-80"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-0.5 block truncate text-xs opacity-70">
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Demo mode
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Local enterprise cockpit with API key auth, RBAC, audit logs and monitoring.
          </p>
        </div>
      </div>
    </aside>
  );
}
