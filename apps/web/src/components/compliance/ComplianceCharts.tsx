"use client";

import {
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

import type {
  ComplianceControlMapping,
  ComplianceMappingResponse,
} from "@/types";
import { useI18n } from "@/i18n/I18nProvider";
import {
  formatComplianceStatus,
  formatPosture,
  formatSeverity,
} from "@/lib/labels";

const statusColors: Record<string, string> = {
  aligned: "#34d399",
  partial: "#22d3ee",
  gap: "#f87171",
  not_applicable: "#94a3b8",
};

const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#fb923c",
  medium: "#facc15",
  low: "#34d399",
};

const tooltipStyle = {
  background: "#020617",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "16px",
  color: "#fff",
};

export function ComplianceCharts({
  mapping,
}: {
  mapping: ComplianceMappingResponse;
}) {
  const { language } = useI18n();

  const frameworkScores = mapping.frameworks.map((framework) => ({
    framework: framework.framework,
    score: framework.score,
    posture: formatPosture(framework.posture, language),
  }));

  const allControls = mapping.frameworks.flatMap((framework) => framework.controls);
  const statusData = buildStatusDistribution(allControls, language);
  const severityData = buildSeverityDistribution(allControls, language);
  const priorities = buildRemediationPriorities(allControls);

  return (
    <section className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title={language === "fr" ? "Score par référentiel" : "Framework score"}
          description={
            language === "fr"
              ? "Comparaison de la posture conformité entre OWASP, NIST AI RMF et EU AI Act."
              : "Compare compliance posture across OWASP, NIST AI RMF and EU AI Act."
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={frameworkScores}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="framework" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="score" fill="#22d3ee" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={
            language === "fr"
              ? "Statut des contrôles"
              : "Control status distribution"
          }
          description={
            language === "fr"
              ? "Répartition des contrôles alignés, partiels ou en écart."
              : "Distribution of aligned, partial and gap controls."
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="label"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
              >
                {statusData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={statusColors[entry.key] || "#22d3ee"}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>

          <LegendList data={statusData} colors={statusColors} />
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <ChartCard
          title={language === "fr" ? "Sévérité des écarts" : "Severity distribution"}
          description={
            language === "fr"
              ? "Lecture rapide du niveau de criticité des contrôles."
              : "Quick view of the severity level across compliance controls."
          }
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {severityData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={severityColors[entry.key] || "#22d3ee"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-red-300">
            {language === "fr" ? "Priorités de remédiation" : "Remediation priorities"}
          </p>
          <h3 className="mt-3 text-xl font-semibold text-white">
            {language === "fr"
              ? "Contrôles à traiter en priorité"
              : "Controls requiring priority action"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {language === "fr"
              ? "Les contrôles en écart ou partiels sont triés selon leur niveau de sévérité."
              : "Gap and partial controls are ranked according to their severity level."}
          </p>

          <div className="mt-6 grid gap-4">
            {priorities.length === 0 && (
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100">
                {language === "fr"
                  ? "Aucune priorité critique détectée pour ce mapping."
                  : "No critical remediation priority detected for this mapping."}
              </div>
            )}

            {priorities.map((control) => (
              <PriorityCard
                key={`${control.framework}-${control.control_id}`}
                control={control}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function buildStatusDistribution(
  controls: ComplianceControlMapping[],
  language: "en" | "fr"
) {
  const counters: Record<string, number> = {
    aligned: 0,
    partial: 0,
    gap: 0,
    not_applicable: 0,
  };

  for (const control of controls) {
    counters[control.status] = (counters[control.status] || 0) + 1;
  }

  return Object.entries(counters)
    .filter(([, value]) => value > 0)
    .map(([key, value]) => ({
      key,
      label: formatComplianceStatus(key, language),
      value,
    }));
}

function buildSeverityDistribution(
  controls: ComplianceControlMapping[],
  language: "en" | "fr"
) {
  const counters: Record<string, number> = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const control of controls) {
    counters[control.severity] = (counters[control.severity] || 0) + 1;
  }

  return Object.entries(counters).map(([key, value]) => ({
    key,
    label: formatSeverity(key, language),
    value,
  }));
}

function buildRemediationPriorities(controls: ComplianceControlMapping[]) {
  const severityWeight: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const statusWeight: Record<string, number> = {
    gap: 3,
    partial: 2,
    aligned: 1,
    not_applicable: 0,
  };

  return controls
    .filter((control) => ["gap", "partial"].includes(control.status))
    .sort((a, b) => {
      const scoreA =
        (severityWeight[a.severity] || 0) * 10 + (statusWeight[a.status] || 0);
      const scoreB =
        (severityWeight[b.severity] || 0) * 10 + (statusWeight[b.status] || 0);

      return scoreB - scoreA;
    })
    .slice(0, 5);
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function LegendList({
  data,
  colors,
}: {
  data: Array<{ key: string; label: string; value: number }>;
  colors: Record<string, string>;
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
              style={{ backgroundColor: colors[item.key] || "#38bdf8" }}
            />
            {item.label}
          </span>
          <span className="text-sm font-semibold text-white">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function PriorityCard({ control }: { control: ComplianceControlMapping }) {
  const { language } = useI18n();

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
              {control.framework}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
              {control.control_id}
            </span>
            <span className="rounded-full bg-red-400/10 px-3 py-1 text-xs font-semibold uppercase text-red-100">
              {formatComplianceStatus(control.status, language)}
            </span>
            <span className="rounded-full bg-orange-400/10 px-3 py-1 text-xs font-semibold uppercase text-orange-100">
              {formatSeverity(control.severity, language)}
            </span>
          </div>

          <h4 className="mt-3 font-semibold text-white">
            {control.control_name}
          </h4>
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {control.recommendation}
      </p>
    </article>
  );
}
