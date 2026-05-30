import type { HealthStatus, ObservabilityMetrics, SecurityPrincipal } from "@/types";
import { ActionButton } from "@/components/ui/ActionButton";
import { KpiCard } from "@/components/ui/KpiCard";
import { useI18n } from "@/i18n/I18nProvider";

export function CommandCenter({
  principal,
  liveness,
  readiness,
  metrics,
  savedAgents,
  criticalAgents,
  visibleAgents,
  auditEvents,
  onRefreshIdentity,
  onRefreshAuditLogs,
  onRefreshMonitoring,
  monitoringLoading,
}: {
  principal: SecurityPrincipal | null;
  liveness: HealthStatus | null;
  readiness: HealthStatus | null;
  metrics: ObservabilityMetrics | null;
  savedAgents: number;
  criticalAgents: number;
  visibleAgents: number;
  auditEvents: number;
  onRefreshIdentity: () => void;
  onRefreshAuditLogs: () => void;
  onRefreshMonitoring: () => void;
  monitoringLoading: boolean;
}) {
  const { t } = useI18n();

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100">
            {t("commandCenter.badge")}
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            {t("commandCenter.title")}
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            {t("commandCenter.description")}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ActionButton onClick={onRefreshIdentity}>
              {t("commandCenter.refreshIdentity")}
            </ActionButton>
            <ActionButton onClick={onRefreshAuditLogs}>
              {t("commandCenter.refreshAuditLogs")}
            </ActionButton>
            <ActionButton
              onClick={onRefreshMonitoring}
              disabled={monitoringLoading}
              variant="green"
            >
              {monitoringLoading ? t("common.loading") : t("commandCenter.refreshMonitoring")}
            </ActionButton>
          </div>
        </div>

        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
          <p className="text-sm uppercase tracking-wide text-cyan-200">
            {t("commandCenter.securityContext")}
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            {principal ? `${principal.actor} / ${principal.role}` : t("topbar.notAuthenticated")}
          </h2>

          <div className="mt-5 grid gap-3">
            <StatusLine label={t("commandCenter.api")} value={liveness?.status || t("common.unknown")} />
            <StatusLine label={t("commandCenter.readiness")} value={readiness?.status || t("common.unknown")} />
            <StatusLine label={t("commandCenter.database")} value={readiness?.database || t("common.unknown")} />
            <StatusLine label={t("commandCenter.version")} value={metrics?.version || liveness?.version || t("common.unknown")} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <KpiCard label={t("commandCenter.savedAgents")} value={String(savedAgents)} />
        <KpiCard label={t("commandCenter.criticalAgents")} value={String(criticalAgents)} />
        <KpiCard label={t("commandCenter.visibleAgents")} value={String(visibleAgents)} />
        <KpiCard label={t("commandCenter.auditEvents")} value={String(auditEvents)} />
      </div>
    </section>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  const good = value === "live" || value === "ready" || value === "ok";

  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
          good ? "bg-emerald-400/10 text-emerald-100" : "bg-yellow-400/10 text-yellow-100"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
