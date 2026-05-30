"use client";

import type { DiscoveredAIAssetRead } from "@/types";
import { ActionButton } from "@/components/ui/ActionButton";
import { useI18n } from "@/i18n/I18nProvider";
import {
  formatAutonomyLevel,
  formatDataSensitivity,
  formatSeverity,
} from "@/lib/labels";

export function DiscoveryHistoryPanel({
  assets,
  loading,
  onRefresh,
  onUpdateStatus,
  onPromoteAsset,
}: {
  assets: DiscoveredAIAssetRead[];
  loading: boolean;
  onRefresh: () => void;
  onUpdateStatus: (assetId: number, status: string) => void;
  onPromoteAsset: (asset: DiscoveredAIAssetRead) => void;
}) {
  const { language } = useI18n();

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
            {language === "fr" ? "Historique Discovery" : "Discovery History"}
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-white">
            {language === "fr"
              ? "Assets Shadow AI persistés"
              : "Persisted Shadow AI assets"}
          </h3>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            {language === "fr"
              ? "Les assets détectés sont conservés en base pour revue, qualification, promotion ou exclusion."
              : "Detected assets are stored in the database for review, qualification, promotion or exclusion."}
          </p>
        </div>

        <ActionButton onClick={onRefresh} disabled={loading}>
          {loading
            ? language === "fr"
              ? "Chargement..."
              : "Loading..."
            : language === "fr"
              ? "Actualiser"
              : "Refresh"}
        </ActionButton>
      </div>

      {assets.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
          {language === "fr"
            ? "Aucun asset Shadow AI persistant pour le moment."
            : "No persisted Shadow AI asset yet."}
        </div>
      )}

      {assets.length > 0 && (
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {assets.map((asset) => (
            <HistoryCard
              key={asset.id}
              asset={asset}
              onUpdateStatus={onUpdateStatus}
              onPromoteAsset={onPromoteAsset}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HistoryCard({
  asset,
  onUpdateStatus,
  onPromoteAsset,
}: {
  asset: DiscoveredAIAssetRead;
  onUpdateStatus: (assetId: number, status: string) => void;
  onPromoteAsset: (asset: DiscoveredAIAssetRead) => void;
}) {
  const { language } = useI18n();

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={confidenceTone(asset.confidence)}>{asset.confidence}</Badge>
            <Badge>{asset.source}</Badge>
            <Badge>{asset.detected_type}</Badge>
            <Badge tone={statusTone(asset.review_status)}>{asset.review_status}</Badge>
          </div>

          <h4 className="mt-4 text-xl font-semibold text-white">
            #{asset.id} · {asset.name}
          </h4>

          <p className="mt-2 text-sm text-slate-400">
            {asset.recommended_action}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info label="Provider" value={asset.model_provider} />
        <Info
          label={language === "fr" ? "Sensibilité" : "Sensitivity"}
          value={formatDataSensitivity(asset.data_sensitivity, language)}
        />
        <Info
          label={language === "fr" ? "Autonomie" : "Autonomy"}
          value={formatAutonomyLevel(asset.autonomy_level, language)}
        />
        <Info
          label={language === "fr" ? "Connecteurs" : "Connectors"}
          value={asset.connectors.length > 0 ? asset.connectors.join(", ") : "-"}
        />
      </div>

      {asset.findings.length > 0 && (
        <div className="mt-5 grid gap-3">
          {asset.findings.slice(0, 3).map((finding, index) => (
            <div
              key={`${asset.id}-${finding.label}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-white">{finding.label}</p>
                <Badge tone={severityTone(finding.severity)}>
                  {formatSeverity(finding.severity, language)}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {finding.evidence}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-4">
        <StatusButton
          label={language === "fr" ? "Revue" : "Reviewing"}
          onClick={() => onUpdateStatus(asset.id, "reviewing")}
        />
        <StatusButton
          label={language === "fr" ? "Promouvoir" : "Promote"}
          onClick={() => onPromoteAsset(asset)}
        />
        <StatusButton
          label={language === "fr" ? "Ignorer" : "Ignore"}
          onClick={() => onUpdateStatus(asset.id, "ignored")}
        />
        <StatusButton
          label={language === "fr" ? "Faux positif" : "False positive"}
          onClick={() => onUpdateStatus(asset.id, "false_positive")}
        />
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium text-white">{value}</p>
    </div>
  );
}

function StatusButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-100"
    >
      {label}
    </button>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "good" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "bg-white/10 text-slate-200",
    good: "bg-emerald-400/10 text-emerald-100",
    warning: "bg-yellow-400/10 text-yellow-100",
    danger: "bg-red-400/10 text-red-100",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${toneClass[tone]}`}>
      {children}
    </span>
  );
}

function confidenceTone(confidence: string) {
  if (confidence === "high") return "danger";
  if (confidence === "medium") return "warning";
  return "neutral";
}

function severityTone(severity: string) {
  if (severity === "critical" || severity === "high") return "danger";
  if (severity === "medium") return "warning";
  return "good";
}

function statusTone(status: string) {
  if (status === "promoted") return "good";
  if (status === "reviewing") return "warning";
  if (status === "ignored" || status === "false_positive") return "neutral";
  return "danger";
}
