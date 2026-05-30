"use client";

import type { PromptInjectionFinding, PromptInjectionTestResponse } from "@/types";
import { riskTone } from "@/lib/risk";
import { ActionButton } from "@/components/ui/ActionButton";
import { useI18n } from "@/i18n/I18nProvider";
import { formatSeverity } from "@/lib/labels";

export function PromptTestPanel({
  result,
  loading,
  onRunCurrent,
}: {
  result: PromptInjectionTestResponse | null;
  loading: boolean;
  onRunCurrent: () => void;
}) {
  const { t } = useI18n();

  return (
    <section
      id="security-tests"
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-purple-300">
            {t("promptTests.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {t("promptTests.title")}
          </h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            {t("promptTests.description")}
          </p>
        </div>

        <ActionButton onClick={onRunCurrent} disabled={loading} variant="purple">
          {loading ? t("promptTests.running") : t("promptTests.runCurrent")}
        </ActionButton>
      </div>

      {!result && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
          {t("promptTests.empty")}
        </div>
      )}

      {result && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className={`rounded-3xl border p-5 ${riskTone(result.overall_status)}`}>
            <p className="text-sm uppercase tracking-wide">{result.overall_status}</p>
            <h3 className="mt-2 text-2xl font-bold">{result.agent_name}</h3>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric label={t("promptTests.total")} value={String(result.total_tests)} />
              <Metric label={t("promptTests.passed")} value={String(result.passed_tests)} />
              <Metric label={t("promptTests.failed")} value={String(result.failed_tests)} />
            </div>
          </div>

          <div className="grid gap-4">
            {result.findings.map((finding) => (
              <FindingCard key={finding.scenario_id} finding={finding} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function FindingCard({ finding }: { finding: PromptInjectionFinding }) {
  const { t, language } = useI18n();

  return (
    <article
      className={`rounded-2xl border p-5 ${
        finding.passed
          ? "border-emerald-400/20 bg-emerald-400/5"
          : "border-red-400/20 bg-red-400/5"
      }`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                finding.passed
                  ? "bg-emerald-400/10 text-emerald-100"
                  : "bg-red-400/10 text-red-100"
              }`}
            >
              {finding.passed
                ? t("promptTests.statusPassed")
                : t("promptTests.statusFailed")}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-slate-300">
              {finding.category}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-slate-300">
              {formatSeverity(finding.severity, language)}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-white">{finding.title}</h3>
        </div>

        <span className="font-mono text-xs text-slate-500">{finding.scenario_id}</span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {t("promptTests.attackPrompt")}
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{finding.attack_prompt}</p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("promptTests.finding")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{finding.finding}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("promptTests.recommendation")}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {finding.recommendation}
          </p>
        </div>
      </div>
    </article>
  );
}
