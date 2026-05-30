import type { DashboardTab } from "@/components/layout/TabNavigation";
import type { HealthStatus, ObservabilityMetrics, SecurityPrincipal } from "@/types";
import { useI18n } from "@/i18n/I18nProvider";

const titleKeysByTab: Record<DashboardTab, { title: string; subtitle: string }> = {
  overview: {
    title: "topbar.overviewTitle",
    subtitle: "topbar.overviewSubtitle",
  },
  discovery: {
    title: "topbar.discoveryTitle",
    subtitle: "topbar.discoverySubtitle",
  },
  agents: {
    title: "topbar.agentsTitle",
    subtitle: "topbar.agentsSubtitle",
  },
  assessment: {
    title: "topbar.assessmentTitle",
    subtitle: "topbar.assessmentSubtitle",
  },
  security: {
    title: "topbar.securityTitle",
    subtitle: "topbar.securitySubtitle",
  },
  compliance: {
    title: "topbar.complianceTitle",
    subtitle: "topbar.complianceSubtitle",
  },
  reports: {
    title: "topbar.reportsTitle",
    subtitle: "topbar.reportsSubtitle",
  },
  monitoring: {
    title: "topbar.monitoringTitle",
    subtitle: "topbar.monitoringSubtitle",
  },
  audit: {
    title: "topbar.auditTitle",
    subtitle: "topbar.auditSubtitle",
  },
  settings: {
    title: "topbar.settingsTitle",
    subtitle: "topbar.settingsSubtitle",
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
  const { t } = useI18n();
  const content = titleKeysByTab[activeTab];

  return (
    <header className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
            {t("topbar.product")}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {t(content.title)}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {t(content.subtitle)}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TopStatus
            label={t("topbar.identity")}
            value={principal ? `${principal.actor} / ${principal.role}` : t("topbar.notAuthenticated")}
            tone={principal ? "good" : "warning"}
          />
          <TopStatus
            label={t("topbar.api")}
            value={liveness?.status || t("common.unknown")}
            tone={liveness?.status === "live" ? "good" : "warning"}
          />
          <TopStatus
            label={t("topbar.database")}
            value={readiness?.database || t("common.unknown")}
            tone={readiness?.database === "ok" ? "good" : "warning"}
          />
          <TopStatus
            label={t("topbar.latency")}
            value={metrics ? `${metrics.runtime.average_latency_ms} ms` : t("common.unknown")}
            tone="neutral"
          />
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
