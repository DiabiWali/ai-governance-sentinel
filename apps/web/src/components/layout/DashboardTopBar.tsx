import type { DashboardTab } from "@/components/layout/TabNavigation";
import type { HealthStatus, ObservabilityMetrics, SecurityPrincipal } from "@/types";

const titleByTab: Record<DashboardTab, { title: string; subtitle: string }> = {
  overview: {
    title: "Enterprise AI governance cockpit",
    subtitle: "Global posture, platform health and governance workflow.",
  },
  agents: {
    title: "AI agent inventory",
    subtitle: "Manage, filter and govern registered enterprise AI agents.",
  },
  assessment: {
    title: "Risk assessment studio",
    subtitle: "Evaluate agent exposure, autonomy, connectors and data sensitivity.",
  },
  security: {
    title: "LLM security testing",
    subtitle: "Run prompt injection and connector abuse simulations.",
  },
  compliance: {
    title: "Compliance mapping",
    subtitle: "Prepare OWASP, NIST AI RMF and EU AI Act governance mapping.",
  },
  reports: {
    title: "Governance reports",
    subtitle: "Generate executive and technical exports for review committees.",
  },
  monitoring: {
    title: "Observability and operations",
    subtitle: "Track runtime health, latency, errors and governance activity.",
  },
  audit: {
    title: "Audit trail",
    subtitle: "Review traceability of security-sensitive platform actions.",
  },
  settings: {
    title: "Workspace settings",
    subtitle: "Language, preferences and future enterprise configuration.",
  },
};

export function DashboardTopBar({
  activeTab,
  principal,
  liveness,
  readiness,
  metrics,
}: {
  activeTab: DashboardTab;
  principal: SecurityPrincipal | null;
  liveness: HealthStatus | null;
  readiness: HealthStatus | null;
  metrics: ObservabilityMetrics | null;
}) {
  const content = titleByTab[activeTab];

  return (
    <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            AI Governance Sentinel
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {content.title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {content.subtitle}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TopStatus label="Identity" value={principal ? `${principal.actor} / ${principal.role}` : "not authenticated"} tone={principal ? "good" : "warning"} />
          <TopStatus label="API" value={liveness?.status || "unknown"} tone={liveness?.status === "live" ? "good" : "warning"} />
          <TopStatus label="Database" value={readiness?.database || "unknown"} tone={readiness?.database === "ok" ? "good" : "warning"} />
          <TopStatus label="Latency" value={metrics ? `${metrics.runtime.average_latency_ms} ms` : "unknown"} tone="neutral" />
        </div>
      </div>
    </header>
  );
}

function TopStatus({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warning" | "neutral";
}) {
  const toneClass = {
    good: "border-emerald-400/20 bg-emerald-400/10 text-emerald-100",
    warning: "border-yellow-400/20 bg-yellow-400/10 text-yellow-100",
    neutral: "border-white/10 bg-slate-900/80 text-slate-100",
  };

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass[tone]}`}>
      <p className="text-xs uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 max-w-[180px] truncate text-sm font-semibold capitalize">
        {value}
      </p>
    </div>
  );
}
