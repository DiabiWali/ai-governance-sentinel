"use client";

import { useMemo, useState, type ChangeEvent } from "react";

import type {
  DiscoveredAIAsset,
  DiscoveryScanResponse,
} from "@/types";
import { useI18n } from "@/i18n/I18nProvider";
import {
  formatAutonomyLevel,
  formatDataSensitivity,
  formatSeverity,
} from "@/lib/labels";
import { ActionButton } from "@/components/ui/ActionButton";

type DiscoveryMode = "endpoint" | "manual";

const emptyEndpointReport = {
  schema_version: "1.0",
  collector: "windows_shadow_ai_scan",
  host: {
    hostname: "DESKTOP-EXAMPLE",
    username: "user",
    os: "Windows",
    timestamp_utc: new Date().toISOString(),
  },
  signals: [],
  summary: {
    total_signals: 0,
  },
};

export function DiscoveryPanel({
  result,
  loading,
  onScan,
  onEndpointReport,
  onPromote,
}: {
  result: DiscoveryScanResponse | null;
  loading: boolean;
  onScan: (
    source: string,
    sourceName: string,
    payload: Record<string, unknown>
  ) => void;
  onEndpointReport: (payload: Record<string, unknown>) => void;
  onPromote: (asset: DiscoveredAIAsset) => void;
}) {
  const { t, language } = useI18n();

  const [mode, setMode] = useState<DiscoveryMode>("endpoint");
  const [source, setSource] = useState("endpoint");
  const [sourceName, setSourceName] = useState("manual-endpoint-report");
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(emptyEndpointReport, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const hasAssets = Boolean(result && result.assets.length > 0);

  function parsePayload() {
    try {
      const parsed = JSON.parse(payloadText) as Record<string, unknown>;
      setError(null);
      return parsed;
    } catch {
      setError(
        language === "fr"
          ? "Le JSON est invalide."
          : "The JSON payload is invalid."
      );
      return null;
    }
  }

  function runEndpointReport() {
    const parsed = parsePayload();

    if (!parsed) {
      return;
    }

    onEndpointReport(parsed);
  }

  function runManualScan() {
    const parsed = parsePayload();

    if (!parsed) {
      return;
    }

    onScan(source, sourceName, parsed);
  }

  async function handleFileImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setPayloadText(text);
    setMode("endpoint");
    setSource("endpoint");
    setSourceName(file.name.replace(".json", ""));
    setError(null);
  }

  function loadEmptyEndpointReport() {
    setMode("endpoint");
    setSource("endpoint");
    setSourceName("manual-endpoint-report");
    setPayloadText(JSON.stringify(emptyEndpointReport, null, 2));
    setError(null);
  }

  return (
    <section className="grid gap-6">
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-fuchsia-300">
              {t("discovery.eyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-white">
              {language === "fr"
                ? "Détection Shadow AI"
                : "Shadow AI discovery"}
            </h2>
            <p className="mt-3 max-w-4xl text-slate-400">
              {language === "fr"
                ? "Importe un rapport endpoint généré depuis un poste autorisé, ou scanne un payload JSON manuel pour détecter les agents IA, runtimes locaux, outils RAG et automatisations IA non gouvernés."
                : "Import an endpoint report generated from an authorized workstation, or scan a manual JSON payload to detect unmanaged AI agents, local runtimes, RAG tooling and AI automations."}
            </p>

            <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100/90">
              {language === "fr"
                ? "Le scanner endpoint ne remonte pas les secrets. Il collecte uniquement des signaux : processus, ports, images Docker, packages IA, chemins locaux et noms de variables d’environnement."
                : "The endpoint scanner does not collect secrets. It only reports signals: processes, ports, Docker images, AI packages, local paths and environment variable names."}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
            <ActionButton onClick={runEndpointReport} disabled={loading} variant="green">
              {loading
                ? t("discovery.scanning")
                : language === "fr"
                  ? "Analyser rapport endpoint"
                  : "Analyze endpoint report"}
            </ActionButton>

            <ActionButton onClick={runManualScan} disabled={loading}>
              {language === "fr" ? "Scanner JSON manuel" : "Scan manual JSON"}
            </ActionButton>

            <ActionButton onClick={loadEmptyEndpointReport} variant="purple">
              {language === "fr"
                ? "Réinitialiser rapport"
                : "Reset report"}
            </ActionButton>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm font-semibold text-white">
                {language === "fr" ? "Mode de découverte" : "Discovery mode"}
              </p>

              <div className="mt-3 grid gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("endpoint");
                    setSource("endpoint");
                  }}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    mode === "endpoint"
                      ? "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-100"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  {language === "fr"
                    ? "Rapport endpoint"
                    : "Endpoint report"}
                </button>

                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    mode === "manual"
                      ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-slate-950 text-slate-400 hover:text-white"
                  }`}
                >
                  {language === "fr" ? "JSON manuel" : "Manual JSON"}
                </button>
              </div>
            </div>

            <label className="block rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <span className="text-sm font-medium text-slate-300">
                {language === "fr"
                  ? "Importer endpoint-report.json"
                  : "Import endpoint-report.json"}
              </span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleFileImport}
                className="mt-3 block w-full text-sm text-slate-400 file:mr-3 file:rounded-xl file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950"
              />
            </label>

            {mode === "manual" && (
              <>
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    {t("discovery.source")}
                  </span>
                  <select
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    <option value="endpoint">Endpoint report</option>
                    <option value="n8n">n8n JSON export</option>
                    <option value="github">GitHub / code</option>
                    <option value="repository">Repository</option>
                    <option value="generic">Generic JSON</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    {t("discovery.sourceName")}
                  </span>
                  <input
                    value={sourceName}
                    onChange={(event) => setSourceName(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  />
                </label>
              </>
            )}

            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm leading-6 text-slate-400">
              {mode === "endpoint"
                ? language === "fr"
                  ? "Génère le rapport avec tools/endpoint-scanner/windows_shadow_ai_scan.ps1, puis importe le fichier JSON ici."
                  : "Generate the report with tools/endpoint-scanner/windows_shadow_ai_scan.ps1, then import the JSON file here."
                : language === "fr"
                  ? "Le mode JSON manuel permet de tester un export n8n, repository ou payload générique."
                  : "Manual JSON mode lets you test an n8n export, repository payload or generic payload."}
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">
              {mode === "endpoint"
                ? language === "fr"
                  ? "Rapport endpoint JSON"
                  : "Endpoint report JSON"
                : t("discovery.payload")}
            </span>
            <textarea
              value={payloadText}
              onChange={(event) => setPayloadText(event.target.value)}
              className="mt-2 min-h-[420px] w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-200 outline-none transition focus:border-cyan-400"
            />
          </label>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}
      </div>

      {!result && (
        <div className="rounded-[2rem] border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-slate-400">
          {t("discovery.noScan")}
        </div>
      )}

      {result && (
        <>
          <DiscoverySummary result={result} />

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
            <h3 className="text-2xl font-semibold text-white">
              {t("discovery.detectedAssetsTitle")}
            </h3>

            {!hasAssets && (
              <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
                {t("discovery.noScan")}
              </div>
            )}

            {hasAssets && (
              <div className="mt-6 grid gap-5 xl:grid-cols-2">
                {result.assets.map((asset) => (
                  <AssetCard
                    key={`${asset.source}-${asset.source_id}-${asset.name}`}
                    asset={asset}
                    onPromote={() => onPromote(asset)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function DiscoverySummary({ result }: { result: DiscoveryScanResponse }) {
  const { t } = useI18n();

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
        {t("discovery.summary")}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-5">
        <SummaryCard label={t("discovery.scannedItems")} value={String(result.summary.scanned_items)} />
        <SummaryCard label={t("discovery.detectedAssets")} value={String(result.summary.detected_assets)} />
        <SummaryCard label={t("discovery.highConfidence")} value={String(result.summary.high_confidence)} />
        <SummaryCard label={t("discovery.mediumConfidence")} value={String(result.summary.medium_confidence)} />
        <SummaryCard label={t("discovery.lowConfidence")} value={String(result.summary.low_confidence)} />
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  onPromote,
}: {
  asset: DiscoveredAIAsset;
  onPromote: () => void;
}) {
  const { t, language } = useI18n();

  const connectorText = useMemo(() => {
    if (asset.connectors.length === 0) {
      return t("discovery.noConnector");
    }

    return asset.connectors.join(", ");
  }, [asset.connectors, t]);

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge tone={confidenceTone(asset.confidence)}>
              {t("discovery.confidence")}: {asset.confidence}
            </Badge>
            <Badge>{asset.source}</Badge>
            <Badge>{asset.detected_type}</Badge>
          </div>

          <h3 className="mt-4 text-xl font-semibold text-white">{asset.name}</h3>
          <p className="mt-2 text-sm text-slate-400">
            {t("discovery.recommendation")}: {asset.recommended_action}
          </p>
        </div>

        <ActionButton onClick={onPromote} variant="green">
          {t("discovery.promote")}
        </ActionButton>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info label={t("discovery.provider")} value={asset.model_provider} />
        <Info label={t("discovery.detectedType")} value={asset.detected_type} />
        <Info
          label={t("discovery.sensitivity")}
          value={formatDataSensitivity(asset.data_sensitivity, language)}
        />
        <Info
          label={t("discovery.autonomy")}
          value={formatAutonomyLevel(asset.autonomy_level, language)}
        />
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {t("discovery.connectors")}
        </p>
        <p className="mt-2 text-sm text-slate-300">{connectorText}</p>
      </div>

      {asset.indicators.length > 0 && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("discovery.indicators")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {asset.indicators.map((indicator) => (
              <Badge key={indicator}>{indicator}</Badge>
            ))}
          </div>
        </div>
      )}

      {asset.findings.length > 0 && (
        <div className="mt-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {t("discovery.findings")}
          </p>

          <div className="mt-3 grid gap-3">
            {asset.findings.map((finding) => (
              <div
                key={`${finding.label}-${finding.evidence}`}
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
        </div>
      )}
    </article>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
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
  if (confidence === "high") {
    return "danger";
  }

  if (confidence === "medium") {
    return "warning";
  }

  return "neutral";
}

function severityTone(severity: string) {
  if (severity === "critical" || severity === "high") {
    return "danger";
  }

  if (severity === "medium") {
    return "warning";
  }

  return "good";
}
