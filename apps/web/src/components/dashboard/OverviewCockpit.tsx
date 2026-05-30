"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardTab } from "@/components/layout/TabNavigation";
import type { AgentRead, AuditLogRead, ObservabilityMetrics } from "@/types";
import { useI18n } from "@/i18n/I18nProvider";
import { formatDataSensitivity, formatRiskLevel } from "@/lib/labels";

const riskColors: Record<string, string> = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#facc15",
  low: "#34d399",
  no_assessment: "#64748b",
};

const sensitivityColors: Record<string, string> = {
  public: "#38bdf8",
  internal: "#22d3ee",
  confidential: "#a78bfa",
  restricted: "#f87171",
};

export function OverviewCockpit({
  agents,
  auditLogs,
  metrics,
  onNavigate,
}: {
  agents: AgentRead[];
  auditLogs: AuditLogRead[];
  metrics: ObservabilityMetrics | null;
  onNavigate: (tab: DashboardTab) => void;
}) {
  const { t, language } = useI18n();

  const riskData = buildRiskDistribution(agents, language);
  const sensitivityData = buildSensitivityDistribution(agents, language);
  const connectorData = buildConnectorExposure(agents);
  const activityData = buildGovernanceActivity(auditLogs);

  const totalAgents = agents.length;
  const criticalAgents = agents.filter(
    (agent) => agent.latest_assessment?.risk_level === "critical"
  ).length;
  const highOrCritical = agents.filter((agent) =>
    ["critical", "high"].includes(agent.latest_assessment?.risk_level || "")
  ).length;

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
            {t("overview.organizationPosture")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {t("overview.commandOverview")}
          </h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            {t("overview.description")}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <PostureCard
              label={t("overview.registeredAgents")}
              value={String(totalAgents)}
              description={t("overview.registeredAgentsDescription")}
              tone="neutral"
            />
            <PostureCard
              label={t("overview.highOrCritical")}
              value={String(highOrCritical)}
              description={t("overview.highOrCriticalDescription")}
              tone={highOrCritical > 0 ? "danger" : "good"}
            />
            <PostureCard
              label={t("overview.criticalAgents")}
              value={String(criticalAgents)}
              description={t("overview.criticalAgentsDescription")}
              tone={criticalAgents > 0 ? "danger" : "good"}
            />
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickAction label={t("overview.assessAgent")} onClick={() => onNavigate("assessment")} />
            <QuickAction label={t("overview.manageInventory")} onClick={() => onNavigate("agents")} />
            <QuickAction label={t("overview.runSecurityTests")} onClick={() => onNavigate("security")} />
            <QuickAction label={t("overview.openCompliance")} onClick={() => onNavigate("compliance")} />
          </div>
        </div>

        <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">
            {t("overview.runtimeSnapshot")}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {t("overview.platformHealth")}
          </h3>

          <div className="mt-6 grid gap-3">
            <SnapshotLine
              label={t("overview.totalRequests")}
              value={metrics ? String(metrics.runtime.total_requests) : t("common.unknown")}
            />
            <SnapshotLine
              label={t("overview.totalErrors")}
              value={metrics ? String(metrics.runtime.total_errors) : t("common.unknown")}
            />
            <SnapshotLine
              label={t("overview.averageLatency")}
              value={metrics ? `${metrics.runtime.average_latency_ms} ms` : t("common.unknown")}
            />
            <SnapshotLine
              label={t("overview.auditEvents")}
              value={metrics ? String(metrics.database.audit_logs_count) : t("common.unknown")}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Risk distribution"
          description="Number of agents by latest risk level."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {riskData.map((entry) => (
                  <Cell key={entry.key} fill={riskColors[entry.key] || "#22d3ee"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Data sensitivity"
          description="Distribution of agents by declared data sensitivity."
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={sensitivityData}
                dataKey="value"
                nameKey="label"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
              >
                {sensitivityData.map((entry) => (
                  <Cell key={entry.key} fill={sensitivityColors[entry.key] || "#38bdf8"} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <LegendList data={sensitivityData} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Connector exposure"
          description="Most frequently used connectors across registered AI agents."
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={connectorData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <YAxis type="category" dataKey="label" stroke="#94a3b8" fontSize={12} width={110} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#22d3ee" radius={[0, 10, 10, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Governance activity"
          description="Recent audit activity grouped by governance workflow."
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={activityData}>
              <defs>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#22d3ee"
                fill="url(#activityGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </section>
  );
}

const tooltipStyle = {
  background: "#020617",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  color: "#fff",
};

function buildRiskDistribution(agents: AgentRead[], language: "en" | "fr") {
  const counters: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    no_assessment: 0,
  };

  for (const agent of agents) {
    const level = agent.latest_assessment?.risk_level || "no_assessment";
    counters[level] = (counters[level] || 0) + 1;
  }

  return Object.entries(counters).map(([key, value]) => ({
    key,
    label: formatRiskLevel(key, language),
    value,
  }));
}

function buildSensitivityDistribution(agents: AgentRead[], language: "en" | "fr") {
  const counters: Record<string, number> = {
    public: 0,
    internal: 0,
    confidential: 0,
    restricted: 0,
  };

  for (const agent of agents) {
    counters[agent.data_sensitivity] = (counters[agent.data_sensitivity] || 0) + 1;
  }

  return Object.entries(counters).map(([key, value]) => ({
    key,
    label: formatDataSensitivity(key, language),
    value,
  }));
}

function buildConnectorExposure(agents: AgentRead[]) {
  const counters: Record<string, number> = {};

  for (const agent of agents) {
    for (const connector of agent.connectors) {
      counters[connector] = (counters[connector] || 0) + 1;
    }
  }

  const data = Object.entries(counters)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (data.length === 0) {
    return [{ label: "No connector", value: 0 }];
  }

  return data;
}

function buildGovernanceActivity(logs: AuditLogRead[]) {
  const groups = [
    { label: "Risk", matcher: "risk" },
    { label: "Agents", matcher: "agents" },
    { label: "Tests", matcher: "prompt" },
    { label: "Reports", matcher: "report" },
    { label: "Audit", matcher: "audit" },
  ];

  return groups.map((group) => ({
    label: group.label,
    value: logs.filter((log) => log.action.includes(group.matcher)).length,
  }));
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function PostureCard({
  label,
  value,
  description,
  tone,
}: {
  label: string;
  value: string;
  description: string;
  tone: "good" | "danger" | "neutral";
}) {
  const toneClass = {
    good: "border-emerald-400/20 bg-emerald-400/10",
    danger: "border-red-400/20 bg-red-400/10",
    neutral: "border-white/10 bg-slate-900/70",
  };

  return (
    <div className={`rounded-3xl border p-5 ${toneClass[tone]}`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-semibold text-white">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
    >
      {label}
    </button>
  );
}

function SnapshotLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function LegendList({
  data,
}: {
  data: Array<{ key: string; label: string; value: number }>;
}) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {data.map((item) => (
        <div
          key={item.key}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm text-slate-300">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: sensitivityColors[item.key] || "#38bdf8" }}
            />
            {item.label}
          </span>
          <span className="text-sm font-semibold text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
