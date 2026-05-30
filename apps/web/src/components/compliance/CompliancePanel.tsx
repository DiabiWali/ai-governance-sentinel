"use client";

import type {
  ComplianceControlMapping,
  ComplianceFrameworkMapping,
  ComplianceMappingResponse,
} from "@/types";
import { formatDateTime } from "@/lib/formatters";
import { ActionButton } from "@/components/ui/ActionButton";
import { useI18n } from "@/i18n/I18nProvider";

export function CompliancePanel({
  mapping,
  loading,
  onMapCurrent,
}: {
  mapping: ComplianceMappingResponse | null;
  loading: boolean;
  onMapCurrent: () => void;
}) {
  const { t } = useI18n();

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">
            {t("complianceModule.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {t("complianceModule.title")}
          </h2>
          <p className="mt-3 max-w-4xl text-slate-400">
            {t("complianceModule.description")}
          </p>
        </div>

        <ActionButton onClick={onMapCurrent} disabled={loading} variant="green">
          {loading ? t("complianceModule.mapping") : t("complianceModule.mapCurrent")}
        </ActionButton>
      </div>

      {!mapping && (
        <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-slate-900/60 p-10 text-center">
          <p className="text-lg font-semibold text-white">
            {t("complianceModule.emptyTitle")}
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            {t("complianceModule.emptyDescription")}
          </p>
        </div>
      )}

      {mapping && (
        <div className="mt-6 grid gap-6">
          <ComplianceSummary mapping={mapping} />

          <div className="grid gap-6 xl:grid-cols-3">
            {mapping.frameworks.map((framework) => (
              <FrameworkPanel key={framework.framework} framework={framework} />
            ))}
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-yellow-100">
              {t("complianceModule.disclaimer")}
            </p>
            <p className="mt-3 text-sm leading-6 text-yellow-100/90">
              {mapping.disclaimer}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function ComplianceSummary({ mapping }: { mapping: ComplianceMappingResponse }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <div className={`rounded-3xl border p-6 ${postureTone(mapping.overall_posture)}`}>
        <p className="text-sm uppercase tracking-wide opacity-80">
          {t("complianceModule.overallPosture")}
        </p>
        <p className="mt-3 text-6xl font-bold">
          {mapping.overall_score}
          <span className="text-xl opacity-70">/100</span>
        </p>
        <p className="mt-4 text-2xl font-semibold capitalize">
          {mapping.overall_posture}
        </p>
        <p className="mt-4 text-sm opacity-80">Agent: {mapping.agent_name}</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
          {t("complianceModule.executiveSummary")}
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-white">
          {t("complianceModule.automatedAssessment")}
        </h3>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          {mapping.executive_summary}
        </p>
        <p className="mt-5 text-xs text-slate-500">
          {t("complianceModule.generatedAt")} {formatDateTime(mapping.generated_at)}
        </p>
      </div>
    </div>
  );
}

function FrameworkPanel({ framework }: { framework: ComplianceFrameworkMapping }) {
  const { t } = useI18n();

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold text-white">{framework.framework}</h3>
          <p className="mt-2 text-sm text-slate-400">
            {t("complianceModule.frameworkDescription")}
          </p>
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-center ${postureTone(framework.posture)}`}>
          <p className="text-2xl font-bold">{framework.score}</p>
          <p className="text-xs uppercase">{framework.posture}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {framework.controls.map((control) => (
          <ControlCard key={`${control.framework}-${control.control_id}`} control={control} />
        ))}
      </div>
    </div>
  );
}

function ControlCard({ control }: { control: ComplianceControlMapping }) {
  const { t } = useI18n();

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
              {control.control_id}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusBadge(control.status)}`}>
              {control.status}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${severityBadge(control.severity)}`}>
              {control.severity}
            </span>
          </div>

          <h4 className="mt-3 font-semibold text-white">{control.control_name}</h4>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("complianceModule.evidence")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {control.evidence}
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("complianceModule.recommendation")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {control.recommendation}
          </p>
        </div>
      </div>
    </article>
  );
}

function postureTone(posture: string) {
  switch (posture) {
    case "strong":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "moderate":
      return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
    case "weak":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-100";
    case "critical":
      return "border-red-400/30 bg-red-400/10 text-red-100";
    default:
      return "border-white/10 bg-slate-900/70 text-slate-100";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "aligned":
      return "bg-emerald-400/10 text-emerald-100";
    case "partial":
      return "bg-cyan-400/10 text-cyan-100";
    case "gap":
      return "bg-red-400/10 text-red-100";
    default:
      return "bg-slate-400/10 text-slate-100";
  }
}

function severityBadge(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-400/10 text-red-100";
    case "high":
      return "bg-orange-400/10 text-orange-100";
    case "medium":
      return "bg-yellow-400/10 text-yellow-100";
    default:
      return "bg-emerald-400/10 text-emerald-100";
  }
}
