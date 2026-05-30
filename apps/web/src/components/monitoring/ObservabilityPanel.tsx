import type { HealthStatus, ObservabilityMetrics, RouteMetrics } from "@/types";
import { formatUptime } from "@/lib/formatters";
import { ActionButton } from "@/components/ui/ActionButton";

export function ObservabilityPanel({
  liveness,
  readiness,
  metrics,
  loading,
  onRefresh,
}: {
  liveness: HealthStatus | null;
  readiness: HealthStatus | null;
  metrics: ObservabilityMetrics | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section
      id="monitoring"
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">
            Operations
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            Observability & Monitoring
          </h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            Runtime health, database readiness, API latency, request volume and
            governance metrics exposed by the backend.
          </p>
        </div>

        <ActionButton onClick={onRefresh} disabled={loading} variant="green">
          {loading ? "Refreshing..." : "Refresh monitoring"}
        </ActionButton>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <MonitoringCard label="Live" value={liveness?.status || "unknown"} good={liveness?.status === "live"} />
        <MonitoringCard label="Ready" value={readiness?.status || "unknown"} good={readiness?.status === "ready"} />
        <MonitoringCard label="Database" value={readiness?.database || "unknown"} good={readiness?.database === "ok"} />
        <MonitoringCard label="API version" value={metrics?.version || liveness?.version || "unknown"} good />
      </div>

      {metrics && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Metric label="Total requests" value={String(metrics.runtime.total_requests)} />
            <Metric label="Total errors" value={String(metrics.runtime.total_errors)} />
            <Metric label="Avg latency" value={`${metrics.runtime.average_latency_ms} ms`} />
            <Metric label="Uptime" value={formatUptime(metrics.runtime.uptime_seconds)} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Metric label="Agents in database" value={String(metrics.database.agents_count)} />
            <Metric label="Risk assessments" value={String(metrics.database.risk_assessments_count)} />
            <Metric label="Audit logs" value={String(metrics.database.audit_logs_count)} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Metric label="Reports generated" value={String(metrics.governance.report_events_count)} />
            <Metric label="Prompt tests" value={String(metrics.governance.prompt_test_events_count)} />
            <Metric
              label="Agent changes"
              value={String(
                metrics.governance.agent_create_events_count +
                  metrics.governance.agent_update_events_count +
                  metrics.governance.agent_delete_events_count
              )}
            />
          </div>

          <RouteMetricsList routes={metrics.runtime.routes} />
        </>
      )}

      {!metrics && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
          Metrics are not available yet. Check the API and demo admin API key.
        </div>
      )}
    </section>
  );
}

function MonitoringCard({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        good
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
          : "border-yellow-400/30 bg-yellow-400/10 text-yellow-100"
      }`}
    >
      <p className="text-sm uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-3 text-2xl font-semibold capitalize">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function RouteMetricsList({ routes }: { routes: Record<string, RouteMetrics> }) {
  const routeEntries = Object.entries(routes)
    .sort(([, a], [, b]) => b.requests - a.requests)
    .slice(0, 8);

  if (routeEntries.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
        No route metrics recorded yet.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
      <div className="grid grid-cols-[1fr_120px_120px_160px] bg-slate-900 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
        <span>Route</span>
        <span>Requests</span>
        <span>Errors</span>
        <span>Avg latency</span>
      </div>

      <div className="divide-y divide-white/10">
        {routeEntries.map(([route, values]) => (
          <div
            key={route}
            className="grid grid-cols-[1fr_120px_120px_160px] px-4 py-4 text-sm text-slate-300"
          >
            <span className="font-mono text-xs text-slate-200">{route}</span>
            <span>{values.requests}</span>
            <span>{values.errors}</span>
            <span>{values.average_latency_ms} ms</span>
          </div>
        ))}
      </div>
    </div>
  );
}
