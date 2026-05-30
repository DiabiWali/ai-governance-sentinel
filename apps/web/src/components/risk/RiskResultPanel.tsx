"use client";

import type { RiskResponse } from "@/types";
import { riskTone } from "@/lib/risk";
import { useI18n } from "@/i18n/I18nProvider";
import { formatRiskLevel, formatSeverity } from "@/lib/labels";

export function RiskResultPanel({ result }: { result: RiskResponse | null }) {
  const { t, language } = useI18n();

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
        {t("riskPanel.eyebrow")}
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        {t("riskPanel.title")}
      </h2>

      {!result && (
        <p className="mt-5 text-slate-400">
          {t("riskPanel.empty")}
        </p>
      )}

      {result && (
        <div className="mt-6">
          <div className={`rounded-3xl border p-6 ${riskTone(result.risk_level)}`}>
            <p className="text-sm uppercase tracking-wide">
              {formatRiskLevel(result.risk_level, language)} {t("riskPanel.riskSuffix")}
            </p>
            <p className="mt-3 text-6xl font-bold">
              {result.risk_score}
              <span className="text-xl text-slate-400">/100</span>
            </p>
            <p className="mt-4 text-sm text-slate-300">
              {t("riskPanel.agent")}: {result.agent_name}
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {result.factors.length === 0 && (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                <h3 className="font-semibold text-emerald-100">
                  {t("riskPanel.noMajorRisk")}
                </h3>
                <p className="mt-3 text-sm leading-6 text-emerald-100/80">
                  {t("riskPanel.noMajorRiskDescription")}
                </p>
              </div>
            )}

            {result.factors.map((factor, index) => (
              <div
                key={`${factor.label}-${index}`}
                className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-white">{factor.label}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-slate-300">
                    {formatSeverity(factor.severity, language)}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {factor.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
