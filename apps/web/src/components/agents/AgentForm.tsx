"use client";

import { AUTONOMY_OPTIONS, CONNECTORS, DATA_SENSITIVITY_OPTIONS } from "@/lib/constants";
import type { AgentAssessmentForm } from "@/types";
import { ActionButton } from "@/components/ui/ActionButton";
import { Field } from "@/components/ui/Field";
import { Toggle } from "@/components/ui/Toggle";
import { useI18n } from "@/i18n/I18nProvider";
import { formatAutonomyLevel, formatDataSensitivity } from "@/lib/labels";

export function AgentForm({
  form,
  editingAgentId,
  loading,
  saving,
  promptTesting,
  reportGenerating,
  onNew,
  onAssess,
  onSecurityTests,
  onGenerateReport,
  onDownloadPdf,
  onSave,
  onUpdateField,
  onToggleConnector,
}: {
  form: AgentAssessmentForm;
  editingAgentId: number | null;
  loading: boolean;
  saving: boolean;
  promptTesting: boolean;
  reportGenerating: boolean;
  onNew: () => void;
  onAssess: () => void;
  onSecurityTests: () => void;
  onGenerateReport: () => void;
  onDownloadPdf: () => void;
  onSave: () => void;
  onUpdateField: <K extends keyof AgentAssessmentForm>(
    key: K,
    value: AgentAssessmentForm[K]
  ) => void;
  onToggleConnector: (connector: string) => void;
}) {
  const { t, language } = useI18n();
  const disabled = loading || saving || promptTesting || reportGenerating;

  return (
    <section
      id="assessment"
      className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
            {t("assessmentForm.eyebrow")}
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-white">
            {editingAgentId
              ? `${t("assessmentForm.editTitle")} #${editingAgentId}`
              : t("assessmentForm.defineTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            {t("assessmentForm.description")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
          <ActionButton onClick={onNew}>{t("assessmentForm.newAgent")}</ActionButton>
          <ActionButton onClick={onAssess} disabled={disabled}>
            {loading ? t("assessmentForm.assessing") : t("assessmentForm.calculateRisk")}
          </ActionButton>
          <ActionButton onClick={onSecurityTests} disabled={disabled} variant="purple">
            {promptTesting ? t("assessmentForm.testing") : t("assessmentForm.runTests")}
          </ActionButton>
          <ActionButton onClick={onGenerateReport} disabled={disabled} variant="green">
            {reportGenerating ? t("assessmentForm.generating") : t("assessmentForm.generateReport")}
          </ActionButton>
          <ActionButton onClick={onDownloadPdf} disabled={disabled} variant="white">
            {t("assessmentForm.pdfReport")}
          </ActionButton>
          <ActionButton onClick={onSave} disabled={disabled} variant="solid">
            {saving
              ? t("assessmentForm.saving")
              : editingAgentId
                ? t("assessmentForm.updateAgent")
                : t("assessmentForm.saveAgent")}
          </ActionButton>
        </div>
      </div>

      <div className="mt-8 grid gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label={t("assessmentForm.agentName")} hint={t("assessmentForm.agentNameHint")}>
            <input
              value={form.name}
              onChange={(event) => onUpdateField("name", event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="HR Assistant"
            />
          </Field>

          <Field label={t("assessmentForm.modelProvider")} hint={t("assessmentForm.modelProviderHint")}>
            <input
              value={form.model_provider}
              onChange={(event) => onUpdateField("model_provider", event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="OpenAI, Azure OpenAI, Mistral..."
            />
          </Field>
        </div>

        <Field label={t("assessmentForm.purpose")} hint={t("assessmentForm.purposeHint")}>
          <textarea
            value={form.purpose}
            onChange={(event) => onUpdateField("purpose", event.target.value)}
            className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            placeholder={t("assessmentForm.purposePlaceholder")}
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label={t("assessmentForm.dataSensitivity")}>
            <select
              value={form.data_sensitivity}
              onChange={(event) => onUpdateField("data_sensitivity", event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              {DATA_SENSITIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {formatDataSensitivity(option.value, language)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("assessmentForm.autonomyLevel")}>
            <select
              value={form.autonomy_level}
              onChange={(event) => onUpdateField("autonomy_level", event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
            >
              {AUTONOMY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {formatAutonomyLevel(option.value, language)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t("assessmentForm.connectedSystems")} hint={t("assessmentForm.connectedSystemsHint")}>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CONNECTORS.map((connector) => {
              const active = form.connectors.includes(connector);

              return (
                <button
                  key={connector}
                  type="button"
                  onClick={() => onToggleConnector(connector)}
                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                    active
                      ? "border-cyan-400 bg-cyan-400/10 text-cyan-100"
                      : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/25"
                  }`}
                >
                  {connector}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Toggle
            label={t("assessmentForm.internetExposed")}
            description={t("assessmentForm.internetExposedDescription")}
            checked={form.internet_exposed}
            onChange={(checked) => onUpdateField("internet_exposed", checked)}
          />
          <Toggle
            label={t("assessmentForm.humanApproval")}
            description={t("assessmentForm.humanApprovalDescription")}
            checked={form.human_approval_required}
            onChange={(checked) => onUpdateField("human_approval_required", checked)}
          />
          <Toggle
            label={t("assessmentForm.storesPrompts")}
            description={t("assessmentForm.storesPromptsDescription")}
            checked={form.stores_prompts}
            onChange={(checked) => onUpdateField("stores_prompts", checked)}
          />
          <Toggle
            label={t("assessmentForm.storesOutputs")}
            description={t("assessmentForm.storesOutputsDescription")}
            checked={form.stores_outputs}
            onChange={(checked) => onUpdateField("stores_outputs", checked)}
          />
        </div>
      </div>
    </section>
  );
}
