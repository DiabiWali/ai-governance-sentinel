"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

type RiskFactor = {
  label: string;
  severity: string;
  recommendation: string;
};

type RiskResponse = {
  agent_name: string;
  risk_score: number;
  risk_level: string;
  factors: RiskFactor[];
};

type RiskAssessmentRead = {
  id: number;
  risk_score: number;
  risk_level: string;
  factors: RiskFactor[];
  created_at: string;
};

type AgentRead = {
  id: number;
  name: string;
  purpose: string;
  model_provider: string;
  data_sensitivity: string;
  autonomy_level: string;
  connectors: string[];
  internet_exposed: boolean;
  human_approval_required: boolean;
  stores_prompts: boolean;
  stores_outputs: boolean;
  created_at: string;
  updated_at: string;
  latest_assessment: RiskAssessmentRead | null;
};

type AgentAssessmentForm = {
  name: string;
  purpose: string;
  model_provider: string;
  data_sensitivity: string;
  autonomy_level: string;
  connectors: string[];
  internet_exposed: boolean;
  human_approval_required: boolean;
  stores_prompts: boolean;
  stores_outputs: boolean;
};

type PromptInjectionFinding = {
  scenario_id: string;
  title: string;
  category: string;
  severity: string;
  attack_prompt: string;
  expected_control: string;
  passed: boolean;
  finding: string;
  recommendation: string;
};

type PromptInjectionTestResponse = {
  agent_name: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  overall_status: string;
  findings: PromptInjectionFinding[];
};

type RiskReportResponse = {
  agent_name: string;
  generated_at: string;
  executive_summary: string;
  agent_profile: AgentAssessmentForm;
  risk_assessment: RiskResponse;
  prompt_injection_tests: PromptInjectionTestResponse;
  recommendations: string[];
  markdown_report: string;
};

type SecurityPrincipal = {
  actor: string;
  role: string;
};

type AuditLogRead = {
  id: number;
  actor: string;
  role: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  status: string;
  details: Record<string, unknown>;
  created_at: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const DEMO_API_KEY = process.env.NEXT_PUBLIC_DEMO_API_KEY || "dev-admin-key";

const CONNECTORS = [
  "sharepoint",
  "outlook",
  "github",
  "postgresql",
  "hr_api",
  "finance_api",
  "servicenow",
  "salesforce",
];

const DATA_SENSITIVITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
  { value: "restricted", label: "Restricted" },
];

const AUTONOMY_OPTIONS = [
  { value: "read_only", label: "Read only" },
  { value: "suggest_action", label: "Suggest action" },
  { value: "execute_with_approval", label: "Execute with approval" },
  { value: "fully_autonomous", label: "Fully autonomous" },
];

const INITIAL_FORM: AgentAssessmentForm = {
  name: "HR Assistant",
  purpose: "Answer HR policy questions and draft internal emails",
  model_provider: "OpenAI",
  data_sensitivity: "confidential",
  autonomy_level: "fully_autonomous",
  connectors: ["sharepoint", "outlook", "hr_api"],
  internet_exposed: false,
  human_approval_required: false,
  stores_prompts: true,
  stores_outputs: true,
};

function authHeaders(): HeadersInit {
  return {
    "X-API-Key": DEMO_API_KEY,
  };
}

function jsonAuthHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-Key": DEMO_API_KEY,
  };
}

export default function Home() {
  const [form, setForm] = useState<AgentAssessmentForm>(INITIAL_FORM);
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [promptResult, setPromptResult] =
    useState<PromptInjectionTestResponse | null>(null);
  const [report, setReport] = useState<RiskReportResponse | null>(null);
  const [agents, setAgents] = useState<AgentRead[]>([]);
  const [principal, setPrincipal] = useState<SecurityPrincipal | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRead[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promptTesting, setPromptTesting] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  useEffect(() => {
    loadCurrentPrincipal();
    loadAgents();
    loadAuditLogs();
  }, []);

  const sensitiveConnectorCount = useMemo(() => {
    return form.connectors.filter((connector) =>
      ["sharepoint", "outlook", "github", "postgresql", "hr_api", "finance_api"].includes(
        connector
      )
    ).length;
  }, [form.connectors]);

  const criticalAgents = useMemo(() => {
    return agents.filter((agent) => agent.latest_assessment?.risk_level === "critical")
      .length;
  }, [agents]);

  function updateField<K extends keyof AgentAssessmentForm>(
    key: K,
    value: AgentAssessmentForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleConnector(connector: string) {
    setForm((current) => {
      const exists = current.connectors.includes(connector);

      return {
        ...current,
        connectors: exists
          ? current.connectors.filter((item) => item !== connector)
          : [...current.connectors, connector],
      };
    });
  }

  async function loadCurrentPrincipal() {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error("Unable to load current principal");
      }

      const data = await response.json();
      setPrincipal(data);
    } catch (error) {
      console.error(error);
      setPrincipal(null);
    }
  }

  async function loadAuditLogs() {
    setAuditLoading(true);

    try {
      const response = await fetch(`${API_URL}/audit-logs?limit=20`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error("Unable to load audit logs");
      }

      const data = await response.json();
      setAuditLogs(data);
    } catch (error) {
      console.error(error);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function loadAgents() {
    setInventoryLoading(true);

    try {
      const response = await fetch(`${API_URL}/agents`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error("Unable to load agents");
      }

      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load agents. Check the API key and FastAPI server.");
    } finally {
      setInventoryLoading(false);
    }
  }

  async function runAssessment() {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/risk/assess`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Risk assessment failed");
      }

      const data = await response.json();
      setResult(data);
      loadAuditLogs();
    } catch (error) {
      console.error(error);
      alert("Unable to reach the API. Check the API key and FastAPI server.");
    } finally {
      setLoading(false);
    }
  }

  async function runPromptTestsForCurrentForm() {
    setPromptTesting(true);
    setPromptResult(null);

    try {
      const response = await fetch(`${API_URL}/prompt-tests/run`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Prompt injection tests failed");
      }

      const data = await response.json();
      setPromptResult(data);
      loadAuditLogs();
    } catch (error) {
      console.error(error);
      alert("Unable to run prompt injection tests. Check the API key and FastAPI server.");
    } finally {
      setPromptTesting(false);
    }
  }

  async function runPromptTestsForSavedAgent(agentId: number) {
    setPromptTesting(true);
    setPromptResult(null);

    try {
      const response = await fetch(`${API_URL}/agents/${agentId}/prompt-tests/run`, {
        method: "POST",
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error("Prompt injection tests failed for saved agent");
      }

      const data = await response.json();
      setPromptResult(data);
      loadAuditLogs();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert("Unable to run tests for this saved agent.");
    } finally {
      setPromptTesting(false);
    }
  }

  async function generateReportForCurrentForm() {
    setReportGenerating(true);
    setReport(null);

    try {
      const response = await fetch(`${API_URL}/reports/generate`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Unable to generate report");
      }

      const data = await response.json();
      setReport(data);
      setResult(data.risk_assessment);
      setPromptResult(data.prompt_injection_tests);
      loadAuditLogs();
    } catch (error) {
      console.error(error);
      alert("Unable to generate report. Check the API key and FastAPI server.");
    } finally {
      setReportGenerating(false);
    }
  }

  async function generateReportForSavedAgent(agentId: number) {
    setReportGenerating(true);
    setReport(null);

    try {
      const response = await fetch(`${API_URL}/agents/${agentId}/report`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error("Unable to generate saved agent report");
      }

      const data = await response.json();
      setReport(data);
      setResult(data.risk_assessment);
      setPromptResult(data.prompt_injection_tests);
      loadAuditLogs();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert("Unable to generate report for this saved agent.");
    } finally {
      setReportGenerating(false);
    }
  }

  async function downloadPdfReportForCurrentForm() {
    setReportGenerating(true);

    try {
      const response = await fetch(`${API_URL}/reports/generate/pdf`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Unable to generate PDF report");
      }

      const blob = await response.blob();
      downloadBlob(blob, `ai-risk-report-${safeFileName(form.name)}.pdf`);
      loadAuditLogs();
    } catch (error) {
      console.error(error);
      alert("Unable to generate PDF report. Check the API key and FastAPI server.");
    } finally {
      setReportGenerating(false);
    }
  }

  async function downloadPdfReportForSavedAgent(agentId: number, agentName: string) {
    setReportGenerating(true);

    try {
      const response = await fetch(`${API_URL}/agents/${agentId}/report/pdf`, {
        headers: authHeaders(),
      });

      if (!response.ok) {
        throw new Error("Unable to generate saved agent PDF report");
      }

      const blob = await response.blob();
      downloadBlob(blob, `ai-risk-report-${safeFileName(agentName)}.pdf`);
      loadAuditLogs();
    } catch (error) {
      console.error(error);
      alert("Unable to generate PDF report for this saved agent.");
    } finally {
      setReportGenerating(false);
    }
  }

  async function saveAgent() {
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/agents`, {
        method: "POST",
        headers: jsonAuthHeaders(),
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Unable to save agent");
      }

      const savedAgent: AgentRead = await response.json();

      setAgents((current) => [
        savedAgent,
        ...current.filter((agent) => agent.id !== savedAgent.id),
      ]);

      if (savedAgent.latest_assessment) {
        setResult({
          agent_name: savedAgent.name,
          risk_score: savedAgent.latest_assessment.risk_score,
          risk_level: savedAgent.latest_assessment.risk_level,
          factors: savedAgent.latest_assessment.factors,
        });
      }

      loadAuditLogs();
    } catch (error) {
      console.error(error);
      alert("Unable to save agent. Check PostgreSQL, FastAPI and the API key.");
    } finally {
      setSaving(false);
    }
  }

  function downloadMarkdownReport() {
    if (!report) {
      return;
    }

    const blob = new Blob([report.markdown_report], {
      type: "text/markdown;charset=utf-8",
    });

    downloadBlob(blob, `ai-risk-report-${safeFileName(report.agent_name)}.md`);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  function safeFileName(value: string) {
    return (
      value
        .toLowerCase()
        .replaceAll(" ", "-")
        .replace(/[^a-z0-9-_]/g, "") || "agent"
    );
  }

  function loadAgentIntoForm(agent: AgentRead) {
    setForm({
      name: agent.name,
      purpose: agent.purpose,
      model_provider: agent.model_provider,
      data_sensitivity: agent.data_sensitivity,
      autonomy_level: agent.autonomy_level,
      connectors: agent.connectors,
      internet_exposed: agent.internet_exposed,
      human_approval_required: agent.human_approval_required,
      stores_prompts: agent.stores_prompts,
      stores_outputs: agent.stores_outputs,
    });

    if (agent.latest_assessment) {
      setResult({
        agent_name: agent.name,
        risk_score: agent.latest_assessment.risk_score,
        risk_level: agent.latest_assessment.risk_level,
        factors: agent.latest_assessment.factors,
      });
    }

    setPromptResult(null);
    setReport(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            AI Governance • LLM Security • Enterprise Architecture
          </div>

          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              AI Governance Sentinel
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Inventory, assess, test, report and audit enterprise AI agents before they
              become a risk for your information system.
            </p>
          </div>
        </header>

        <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-cyan-200">
                Enterprise security context
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                {principal ? `${principal.actor} · ${principal.role}` : "Not authenticated"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                Frontend requests are authenticated with the demo API key through the
                <span className="font-mono text-cyan-200"> X-API-Key</span> header.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={loadCurrentPrincipal}
                className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Refresh identity
              </button>

              <button
                onClick={loadAuditLogs}
                className="rounded-xl border border-white/10 bg-slate-900 px-5 py-3 font-semibold text-slate-100 transition hover:border-cyan-400/50"
              >
                Refresh audit logs
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-4">
          <KpiCard label="Saved agents" value={String(agents.length)} />
          <KpiCard label="Critical agents" value={String(criticalAgents)} />
          <KpiCard label="Sensitive connectors" value={String(sensitiveConnectorCount)} />
          <KpiCard label="Audit events" value={String(auditLogs.length)} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">AI agent assessment</h2>
                <p className="mt-2 max-w-2xl text-slate-400">
                  Describe an AI agent, assess its risk, run security tests and generate
                  an exportable governance report.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <ActionButton label={loading ? "Assessing..." : "Assess"} onClick={runAssessment} disabled={loading || saving || promptTesting || reportGenerating} />
                <ActionButton label={promptTesting ? "Testing..." : "Security tests"} onClick={runPromptTestsForCurrentForm} disabled={loading || saving || promptTesting || reportGenerating} variant="purple" />
                <ActionButton label={reportGenerating ? "Generating..." : "Generate report"} onClick={generateReportForCurrentForm} disabled={loading || saving || promptTesting || reportGenerating} variant="green" />
                <ActionButton label="PDF" onClick={downloadPdfReportForCurrentForm} disabled={loading || saving || promptTesting || reportGenerating} variant="white" />
                <ActionButton label={saving ? "Saving..." : "Save"} onClick={saveAgent} disabled={loading || saving || promptTesting || reportGenerating} variant="solid" />
              </div>
            </div>

            <div className="mt-8 grid gap-5">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Agent name">
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    placeholder="HR Assistant"
                  />
                </Field>

                <Field label="Model provider">
                  <input
                    value={form.model_provider}
                    onChange={(event) => updateField("model_provider", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    placeholder="OpenAI, Azure OpenAI, Mistral..."
                  />
                </Field>
              </div>

              <Field label="Purpose">
                <textarea
                  value={form.purpose}
                  onChange={(event) => updateField("purpose", event.target.value)}
                  className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  placeholder="Describe what this AI agent is supposed to do."
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Data sensitivity">
                  <select
                    value={form.data_sensitivity}
                    onChange={(event) => updateField("data_sensitivity", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    {DATA_SENSITIVITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Autonomy level">
                  <select
                    value={form.autonomy_level}
                    onChange={(event) => updateField("autonomy_level", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                  >
                    {AUTONOMY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Connectors">
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {CONNECTORS.map((connector) => {
                    const active = form.connectors.includes(connector);

                    return (
                      <button
                        key={connector}
                        type="button"
                        onClick={() => toggleConnector(connector)}
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
                <Toggle label="Internet exposed" checked={form.internet_exposed} onChange={(checked) => updateField("internet_exposed", checked)} />
                <Toggle label="Human approval required" checked={form.human_approval_required} onChange={(checked) => updateField("human_approval_required", checked)} />
                <Toggle label="Stores prompts" checked={form.stores_prompts} onChange={(checked) => updateField("stores_prompts", checked)} />
                <Toggle label="Stores outputs" checked={form.stores_outputs} onChange={(checked) => updateField("stores_outputs", checked)} />
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <h2 className="text-2xl font-semibold">Assessment result</h2>

            {!result && (
              <p className="mt-4 text-slate-400">
                No assessment yet. Configure the AI agent and run the assessment.
              </p>
            )}

            {result && (
              <div className="mt-6">
                <div className={`rounded-2xl border p-5 ${riskTone(result.risk_level)}`}>
                  <p className="text-sm uppercase tracking-wide">
                    {result.risk_level} risk
                  </p>
                  <p className="mt-2 text-5xl font-bold">
                    {result.risk_score}
                    <span className="text-xl text-slate-400">/100</span>
                  </p>
                  <p className="mt-3 text-sm text-slate-300">
                    Agent: {result.agent_name}
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  {result.factors.length === 0 && (
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                      <h3 className="font-semibold text-emerald-100">
                        No major risk detected
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-emerald-100/80">
                        The current configuration appears to be low risk. Keep audit logs,
                        access reviews and data retention controls enabled.
                      </p>
                    </div>
                  )}

                  {result.factors.map((factor, index) => (
                    <div
                      key={`${factor.label}-${index}`}
                      className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-semibold">{factor.label}</h3>
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-slate-300">
                          {factor.severity}
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
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Risk report export</h2>
              <p className="mt-2 text-slate-400">
                Generate an executive and technical report combining the agent profile,
                risk score, prompt injection findings and remediation plan.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <ActionButton label={reportGenerating ? "Generating..." : "Generate report"} onClick={generateReportForCurrentForm} disabled={reportGenerating} variant="green" />
              <ActionButton label="Download Markdown" onClick={downloadMarkdownReport} disabled={!report} variant="green" />
              <ActionButton label="Download PDF" onClick={downloadPdfReportForCurrentForm} disabled={reportGenerating} variant="white" />
            </div>
          </div>

          {!report && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
              No report generated yet.
            </div>
          )}

          {report && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
              <div className={`rounded-2xl border p-5 ${riskTone(report.risk_assessment.risk_level)}`}>
                <p className="text-sm uppercase tracking-wide">Generated report</p>
                <h3 className="mt-2 text-2xl font-bold">{report.agent_name}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {report.executive_summary}
                </p>

                <div className="mt-5 grid gap-3">
                  <MiniInfo label="Risk score" value={`${report.risk_assessment.risk_score}/100`} />
                  <MiniInfo label="Risk level" value={report.risk_assessment.risk_level} />
                  <MiniInfo label="Prompt tests failed" value={String(report.prompt_injection_tests.failed_tests)} />
                  <MiniInfo label="Generated at" value={new Date(report.generated_at).toLocaleString()} />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold">Markdown preview</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
                    .md preview
                  </span>
                </div>

                <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-300">
                  {report.markdown_report}
                </pre>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Prompt injection test suite</h2>
              <p className="mt-2 text-slate-400">
                Simulated security tests evaluate whether the agent configuration is
                exposed to prompt injection, data exfiltration, connector abuse or
                approval bypass risks.
              </p>
            </div>

            <ActionButton label={promptTesting ? "Running tests..." : "Test current agent"} onClick={runPromptTestsForCurrentForm} disabled={promptTesting} variant="purple" />
          </div>

          {!promptResult && (
            <div className="mt-6 rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
              No prompt injection tests have been executed yet.
            </div>
          )}

          {promptResult && (
            <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
              <div className={`rounded-2xl border p-5 ${riskTone(promptResult.overall_status)}`}>
                <p className="text-sm uppercase tracking-wide">
                  {promptResult.overall_status}
                </p>
                <h3 className="mt-2 text-2xl font-bold">{promptResult.agent_name}</h3>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <PromptMetric label="Total" value={String(promptResult.total_tests)} />
                  <PromptMetric label="Passed" value={String(promptResult.passed_tests)} />
                  <PromptMetric label="Failed" value={String(promptResult.failed_tests)} />
                </div>
              </div>

              <div className="grid gap-4">
                {promptResult.findings.map((finding) => (
                  <PromptFindingCard key={finding.scenario_id} finding={finding} />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Persistent agent inventory</h2>
              <p className="mt-2 text-slate-400">
                Agents saved through the API are stored in PostgreSQL and loaded from
                <span className="font-mono text-cyan-200"> /agents</span>.
              </p>
            </div>

            <ActionButton label={inventoryLoading ? "Refreshing..." : "Refresh"} onClick={loadAgents} disabled={inventoryLoading} />
          </div>

          <div className="mt-6">
            {agents.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
                No saved agents yet. Fill the assessment form and click Save.
              </div>
            )}

            {agents.length > 0 && (
              <div className="grid gap-4 lg:grid-cols-2">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onLoad={() => loadAgentIntoForm(agent)}
                    onRunTests={() => runPromptTestsForSavedAgent(agent.id)}
                    onGenerateReport={() => generateReportForSavedAgent(agent.id)}
                    onDownloadPdf={() => downloadPdfReportForSavedAgent(agent.id, agent.name)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Audit logs</h2>
              <p className="mt-2 text-slate-400">
                Admin-only traceability of security-sensitive actions executed through the API.
              </p>
            </div>

            <ActionButton label={auditLoading ? "Loading..." : "Refresh logs"} onClick={loadAuditLogs} disabled={auditLoading} />
          </div>

          <div className="mt-6">
            {auditLogs.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/60 p-8 text-center text-slate-400">
                No audit logs available, or the current API key does not have admin permissions.
              </div>
            )}

            {auditLogs.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <div className="grid grid-cols-[180px_120px_1fr_120px] bg-slate-900 px-4 py-3 text-xs uppercase tracking-wide text-slate-400">
                  <span>Actor</span>
                  <span>Role</span>
                  <span>Action</span>
                  <span>Status</span>
                </div>

                <div className="divide-y divide-white/10">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-[180px_120px_1fr_120px] px-4 py-4 text-sm text-slate-300"
                    >
                      <span>{log.actor}</span>
                      <span className="capitalize">{log.role}</span>
                      <span>
                        <span className="font-medium text-slate-100">{log.action}</span>
                        <span className="ml-2 text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </span>
                      <span className="capitalize">{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "purple" | "green" | "white" | "solid";
}) {
  const classNameByVariant = {
    default:
      "border border-cyan-400/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20",
    purple:
      "border border-purple-400/40 bg-purple-400/10 text-purple-100 hover:bg-purple-400/20",
    green:
      "border border-emerald-400/40 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20",
    white: "bg-white text-slate-950 hover:bg-slate-200",
    solid: "bg-cyan-400 text-slate-950 hover:bg-cyan-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`min-w-[130px] whitespace-nowrap rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${classNameByVariant[variant]}`}
    >
      {label}
    </button>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold capitalize">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
        checked
          ? "border-cyan-400 bg-cyan-400/10"
          : "border-white/10 bg-slate-900 hover:border-white/25"
      }`}
    >
      <span className="font-medium text-slate-100">{label}</span>
      <span
        className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
          checked ? "bg-cyan-400" : "bg-slate-700"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}

function AgentCard({
  agent,
  onLoad,
  onRunTests,
  onGenerateReport,
  onDownloadPdf,
}: {
  agent: AgentRead;
  onLoad: () => void;
  onRunTests: () => void;
  onGenerateReport: () => void;
  onDownloadPdf: () => void;
}) {
  const assessment = agent.latest_assessment;

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{agent.name}</h3>
          <p className="mt-1 text-sm text-slate-400">{agent.model_provider}</p>
        </div>

        {assessment && (
          <span
            className={`rounded-full border px-3 py-1 text-xs uppercase ${riskBadge(
              assessment.risk_level
            )}`}
          >
            {assessment.risk_level} • {assessment.risk_score}/100
          </span>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-300">{agent.purpose}</p>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <MiniInfo label="Sensitivity" value={agent.data_sensitivity} />
        <MiniInfo label="Autonomy" value={agent.autonomy_level} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {agent.connectors.length === 0 && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">
            no connector
          </span>
        )}

        {agent.connectors.map((connector) => (
          <span
            key={`${agent.id}-${connector}`}
            className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300"
          >
            {connector}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <button onClick={onLoad} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-cyan-400/10">
          Load
        </button>
        <button onClick={onRunTests} className="rounded-xl border border-purple-400/30 bg-purple-400/10 px-4 py-3 font-semibold text-purple-100 transition hover:bg-purple-400/20">
          Tests
        </button>
        <button onClick={onGenerateReport} className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 font-semibold text-emerald-100 transition hover:bg-emerald-400/20">
          Report
        </button>
        <button onClick={onDownloadPdf} className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 font-semibold text-white transition hover:bg-white/20">
          PDF
        </button>
      </div>
    </article>
  );
}

function PromptMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-center">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function PromptFindingCard({ finding }: { finding: PromptInjectionFinding }) {
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
              {finding.passed ? "passed" : "failed"}
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-slate-300">
              {finding.category}
            </span>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase text-slate-300">
              {finding.severity}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold">{finding.title}</h3>
        </div>

        <span className="font-mono text-xs text-slate-500">
          {finding.scenario_id}
        </span>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Attack prompt
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {finding.attack_prompt}
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Finding</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">{finding.finding}</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Recommendation
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {finding.recommendation}
          </p>
        </div>
      </div>
    </article>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 font-medium capitalize text-slate-100">
        {value.replaceAll("_", " ")}
      </p>
    </div>
  );
}

function riskTone(level: string) {
  switch (level) {
    case "critical":
      return "border-red-400/30 bg-red-400/10 text-red-100";
    case "high":
      return "border-orange-400/30 bg-orange-400/10 text-orange-100";
    case "medium":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-100";
    case "passed":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    default:
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
}

function riskBadge(level: string) {
  switch (level) {
    case "critical":
      return "border-red-400/30 bg-red-400/10 text-red-100";
    case "high":
      return "border-orange-400/30 bg-orange-400/10 text-orange-100";
    case "medium":
      return "border-yellow-400/30 bg-yellow-400/10 text-yellow-100";
    default:
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
  }
}
