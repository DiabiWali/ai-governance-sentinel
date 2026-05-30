export type DashboardTab =
  | "overview"
  | "discovery"
  | "assessment"
  | "agents"
  | "security"
  | "compliance"
  | "reports"
  | "monitoring"
  | "audit"
  | "settings";

const tabs: Array<{
  key: DashboardTab;
  label: string;
  description: string;
}> = [
  {
    key: "overview",
    label: "Overview",
    description: "Global command center",
  },
  {
    key: "discovery",
    label: "Discovery",
    description: "Shadow AI detection",
  },
  {
    key: "assessment",
    label: "Assessment",
    description: "Risk scoring studio",
  },
  {
    key: "agents",
    label: "Agents",
    description: "Inventory management",
  },
  {
    key: "security",
    label: "Security Tests",
    description: "Prompt injection testing",
  },
  {
    key: "compliance",
    label: "Compliance",
    description: "OWASP, NIST, AI Act",
  },
  {
    key: "reports",
    label: "Reports",
    description: "PDF and executive exports",
  },
  {
    key: "monitoring",
    label: "Monitoring",
    description: "Health and metrics",
  },
  {
    key: "audit",
    label: "Audit Logs",
    description: "Traceability",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Language and preferences",
  },
];

export function TabNavigation({
  activeTab,
  onChange,
}: {
  activeTab: DashboardTab;
  onChange: (tab: DashboardTab) => void;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl backdrop-blur">
      <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-9">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`rounded-2xl border px-4 py-4 text-left transition ${
                active
                  ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                  : "border-transparent bg-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <span className="block text-sm font-semibold">{tab.label}</span>
              <span className="mt-1 block text-xs leading-5 opacity-75">
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
