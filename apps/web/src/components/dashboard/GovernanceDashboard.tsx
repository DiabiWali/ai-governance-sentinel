"use client";

import { useEffect, useMemo, useState } from "react";

import {
  assessRisk,
  createAgent,
  deleteAgentById,
  downloadPdfForAgent,
  downloadPdfForCurrentForm,
  generateRiskReport,
  generateRiskReportForAgent,
  getAgents,
  getAuditLogs,
  getCurrentPrincipal,
  getLiveStatus,
  getMetrics,
  getReadyStatus,
  runPromptTests,
  runPromptTestsForAgent,
  updateAgent,
} from "@/lib/api";
import { INITIAL_AGENT_FORM } from "@/lib/constants";
import { downloadBlob, safeFileName } from "@/lib/formatters";
import { riskWeight } from "@/lib/risk";
import type {
  AgentAssessmentForm,
  AgentRead,
  AuditLogRead,
  HealthStatus,
  ObservabilityMetrics,
  PromptInjectionTestResponse,
  RiskReportResponse,
  RiskResponse,
  SecurityPrincipal,
} from "@/types";

import { AgentForm } from "@/components/agents/AgentForm";
import { AgentInventory } from "@/components/agents/AgentInventory";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { WorkflowSteps } from "@/components/dashboard/WorkflowSteps";
import { AppShell } from "@/components/layout/AppShell";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardTopBar } from "@/components/layout/DashboardTopBar";
import type { DashboardTab } from "@/components/layout/TabNavigation";
import { ObservabilityPanel } from "@/components/monitoring/ObservabilityPanel";
import { ReportPanel } from "@/components/reports/ReportPanel";
import { RiskResultPanel } from "@/components/risk/RiskResultPanel";
import { AuditLogsPanel } from "@/components/security/AuditLogsPanel";
import { PromptTestPanel } from "@/components/security/PromptTestPanel";

export function GovernanceDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  const [form, setForm] = useState<AgentAssessmentForm>(INITIAL_AGENT_FORM);
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [promptResult, setPromptResult] =
    useState<PromptInjectionTestResponse | null>(null);
  const [report, setReport] = useState<RiskReportResponse | null>(null);

  const [agents, setAgents] = useState<AgentRead[]>([]);
  const [principal, setPrincipal] = useState<SecurityPrincipal | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRead[]>([]);

  const [liveness, setLiveness] = useState<HealthStatus | null>(null);
  const [readiness, setReadiness] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<ObservabilityMetrics | null>(null);

  const [editingAgentId, setEditingAgentId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortMode, setSortMode] = useState("updated_desc");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<number | null>(null);
  const [promptTesting, setPromptTesting] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [observabilityLoading, setObservabilityLoading] = useState(false);

  useEffect(() => {
    void loadCurrentPrincipal();
    void loadAgents();
    void loadAuditLogs();
    void loadObservability();
  }, []);

  const criticalAgents = useMemo(() => {
    return agents.filter((agent) => agent.latest_assessment?.risk_level === "critical").length;
  }, [agents]);

  const filteredAgents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = agents.filter((agent) => {
      const riskLevel = agent.latest_assessment?.risk_level || "no_assessment";

      const matchesSearch =
        !query ||
        agent.name.toLowerCase().includes(query) ||
        agent.purpose.toLowerCase().includes(query) ||
        agent.model_provider.toLowerCase().includes(query) ||
        agent.connectors.join(" ").toLowerCase().includes(query);

      const matchesRisk = riskFilter === "all" || riskLevel === riskFilter;

      return matchesSearch && matchesRisk;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === "name_asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortMode === "risk_desc") {
        return riskWeight(b.latest_assessment?.risk_level) - riskWeight(a.latest_assessment?.risk_level);
      }

      if (sortMode === "risk_asc") {
        return riskWeight(a.latest_assessment?.risk_level) - riskWeight(b.latest_assessment?.risk_level);
      }

      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }, [agents, riskFilter, searchQuery, sortMode]);

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
      setPrincipal(await getCurrentPrincipal());
    } catch (error) {
      console.error(error);
      setPrincipal(null);
    }
  }

  async function loadAuditLogs() {
    setAuditLoading(true);

    try {
      setAuditLogs(await getAuditLogs());
    } catch (error) {
      console.error(error);
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  }

  async function loadObservability() {
    setObservabilityLoading(true);

    try {
      const [liveData, readyData, metricsData] = await Promise.all([
        getLiveStatus(),
        getReadyStatus(),
        getMetrics(),
      ]);

      setLiveness(liveData);
      setReadiness(readyData);
      setMetrics(metricsData);
    } catch (error) {
      console.error(error);
      setMetrics(null);
    } finally {
      setObservabilityLoading(false);
    }
  }

  async function loadAgents() {
    setInventoryLoading(true);

    try {
      setAgents(await getAgents());
    } catch (error) {
      console.error(error);
      alert("Unable to load agents. Check the API key and FastAPI server.");
    } finally {
      setInventoryLoading(false);
    }
  }

  async function handleAssessRisk() {
    setLoading(true);
    setResult(null);

    try {
      const data = await assessRisk(form);
      setResult(data);
      void loadAuditLogs();
      void loadObservability();
    } catch (error) {
      console.error(error);
      alert("Unable to calculate risk. Check the API key and FastAPI server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunPromptTestsForCurrentForm() {
    setPromptTesting(true);
    setPromptResult(null);

    try {
      const data = await runPromptTests(form);
      setPromptResult(data);
      void loadAuditLogs();
      void loadObservability();
    } catch (error) {
      console.error(error);
      alert("Unable to run prompt injection tests.");
    } finally {
      setPromptTesting(false);
    }
  }

  async function handleRunPromptTestsForAgent(agentId: number) {
    setPromptTesting(true);
    setPromptResult(null);

    try {
      const data = await runPromptTestsForAgent(agentId);
      setPromptResult(data);
      void loadAuditLogs();
      void loadObservability();
      setActiveTab("security");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert("Unable to run tests for this saved agent.");
    } finally {
      setPromptTesting(false);
    }
  }

  async function handleGenerateReportForCurrentForm() {
    setReportGenerating(true);
    setReport(null);

    try {
      const data = await generateRiskReport(form);
      setReport(data);
      setResult(data.risk_assessment);
      setPromptResult(data.prompt_injection_tests);
      void loadAuditLogs();
      void loadObservability();
      setActiveTab("reports");
    } catch (error) {
      console.error(error);
      alert("Unable to generate report.");
    } finally {
      setReportGenerating(false);
    }
  }

  async function handleGenerateReportForAgent(agentId: number) {
    setReportGenerating(true);
    setReport(null);

    try {
      const data = await generateRiskReportForAgent(agentId);
      setReport(data);
      setResult(data.risk_assessment);
      setPromptResult(data.prompt_injection_tests);
      void loadAuditLogs();
      void loadObservability();
      setActiveTab("reports");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert("Unable to generate report for this saved agent.");
    } finally {
      setReportGenerating(false);
    }
  }

  async function handleDownloadPdfForCurrentForm() {
    setReportGenerating(true);

    try {
      const blob = await downloadPdfForCurrentForm(form);
      downloadBlob(blob, `ai-risk-report-${safeFileName(form.name)}.pdf`);
      void loadAuditLogs();
      void loadObservability();
    } catch (error) {
      console.error(error);
      alert("Unable to download PDF report.");
    } finally {
      setReportGenerating(false);
    }
  }

  async function handleDownloadPdfForAgent(agentId: number, agentName: string) {
    setReportGenerating(true);

    try {
      const blob = await downloadPdfForAgent(agentId);
      downloadBlob(blob, `ai-risk-report-${safeFileName(agentName)}.pdf`);
      void loadAuditLogs();
      void loadObservability();
    } catch (error) {
      console.error(error);
      alert("Unable to download PDF report for this saved agent.");
    } finally {
      setReportGenerating(false);
    }
  }

  async function handleSaveOrUpdateAgent() {
    setSaving(true);

    try {
      const savedAgent =
        editingAgentId !== null
          ? await updateAgent(editingAgentId, form)
          : await createAgent(form);

      setAgents((current) => {
        const exists = current.some((agent) => agent.id === savedAgent.id);

        if (exists) {
          return current.map((agent) => (agent.id === savedAgent.id ? savedAgent : agent));
        }

        return [savedAgent, ...current];
      });

      setEditingAgentId(savedAgent.id);

      if (savedAgent.latest_assessment) {
        setResult({
          agent_name: savedAgent.name,
          risk_score: savedAgent.latest_assessment.risk_score,
          risk_level: savedAgent.latest_assessment.risk_level,
          factors: savedAgent.latest_assessment.factors,
        });
      }

      void loadAuditLogs();
      void loadObservability();
      setActiveTab("agents");
    } catch (error) {
      console.error(error);
      alert("Unable to save agent. Check PostgreSQL, FastAPI and the API key.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAgent(agent: AgentRead) {
    const confirmed = window.confirm(
      `Delete "${agent.name}" from the persistent inventory? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingAgentId(agent.id);

    try {
      await deleteAgentById(agent.id);
      setAgents((current) => current.filter((item) => item.id !== agent.id));

      if (editingAgentId === agent.id) {
        resetForm();
      }

      void loadAuditLogs();
      void loadObservability();
    } catch (error) {
      console.error(error);
      alert("Unable to delete agent. This action requires an admin API key.");
    } finally {
      setDeletingAgentId(null);
    }
  }

  function handleDownloadMarkdown() {
    if (!report) {
      return;
    }

    const blob = new Blob([report.markdown_report], {
      type: "text/markdown;charset=utf-8",
    });

    downloadBlob(blob, `ai-risk-report-${safeFileName(report.agent_name)}.md`);
  }

  function loadAgentIntoForm(agent: AgentRead) {
    setEditingAgentId(agent.id);

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
    setActiveTab("assessment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingAgentId(null);
    setForm(INITIAL_AGENT_FORM);
    setResult(null);
    setPromptResult(null);
    setReport(null);
  }

  return (
    <AppShell>
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <AppSidebar activeTab={activeTab} onChange={setActiveTab} />

        <section className="min-w-0 space-y-6">
          <DashboardTopBar
            activeTab={activeTab}
            principal={principal}
            liveness={liveness}
            readiness={readiness}
            metrics={metrics}
          />

      {activeTab === "overview" && (
        <>
          <CommandCenter
            principal={principal}
            liveness={liveness}
            readiness={readiness}
            metrics={metrics}
            savedAgents={agents.length}
            criticalAgents={criticalAgents}
            visibleAgents={filteredAgents.length}
            auditEvents={auditLogs.length}
            onRefreshIdentity={loadCurrentPrincipal}
            onRefreshAuditLogs={loadAuditLogs}
            onRefreshMonitoring={loadObservability}
            monitoringLoading={observabilityLoading}
          />

          <WorkflowSteps />

          <V1RoadmapPreview />
        </>
      )}

      {activeTab === "assessment" && (
        <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
          <AgentForm
            form={form}
            editingAgentId={editingAgentId}
            loading={loading}
            saving={saving}
            promptTesting={promptTesting}
            reportGenerating={reportGenerating}
            onNew={resetForm}
            onAssess={handleAssessRisk}
            onSecurityTests={handleRunPromptTestsForCurrentForm}
            onGenerateReport={handleGenerateReportForCurrentForm}
            onDownloadPdf={handleDownloadPdfForCurrentForm}
            onSave={handleSaveOrUpdateAgent}
            onUpdateField={updateField}
            onToggleConnector={toggleConnector}
          />

          <RiskResultPanel result={result} />
        </div>
      )}

      {activeTab === "agents" && (
        <AgentInventory
          agents={filteredAgents}
          searchQuery={searchQuery}
          riskFilter={riskFilter}
          sortMode={sortMode}
          editingAgentId={editingAgentId}
          deletingAgentId={deletingAgentId}
          inventoryLoading={inventoryLoading}
          onSearchChange={setSearchQuery}
          onRiskFilterChange={setRiskFilter}
          onSortModeChange={setSortMode}
          onRefresh={loadAgents}
          onEdit={loadAgentIntoForm}
          onDelete={handleDeleteAgent}
          onRunTests={handleRunPromptTestsForAgent}
          onGenerateReport={handleGenerateReportForAgent}
          onDownloadPdf={handleDownloadPdfForAgent}
        />
      )}

      {activeTab === "security" && (
        <PromptTestPanel
          result={promptResult}
          loading={promptTesting}
          onRunCurrent={handleRunPromptTestsForCurrentForm}
        />
      )}

      {activeTab === "compliance" && (
        <CompliancePreview
          result={result}
          promptResult={promptResult}
          report={report}
        />
      )}

      {activeTab === "reports" && (
        <ReportPanel
          report={report}
          loading={reportGenerating}
          onGenerate={handleGenerateReportForCurrentForm}
          onDownloadMarkdown={handleDownloadMarkdown}
          onDownloadPdf={handleDownloadPdfForCurrentForm}
        />
      )}

      {activeTab === "monitoring" && (
        <ObservabilityPanel
          liveness={liveness}
          readiness={readiness}
          metrics={metrics}
          loading={observabilityLoading}
          onRefresh={loadObservability}
        />
      )}

      {activeTab === "audit" && (
        <AuditLogsPanel
          logs={auditLogs}
          loading={auditLoading}
          onRefresh={loadAuditLogs}
        />
      )}

      {activeTab === "settings" && <SettingsPreview />}
        </section>
      </div>
    </AppShell>
  );
}

function V1RoadmapPreview() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">
        V1 product direction
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        Enterprise AI governance platform
      </h2>
      <p className="mt-3 max-w-4xl text-slate-400">
        The v1 workspace introduces a clearer SaaS navigation model. The next increments
        will add compliance mapping, charts, language selection and a stronger PDF report.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <PreviewCard title="Compliance" text="OWASP LLM Top 10, NIST AI RMF and EU AI Act governance mapping." />
        <PreviewCard title="Charts" text="Risk distribution, connector exposure, compliance coverage and activity trends." />
        <PreviewCard title="Languages" text="English and French interface for international and French enterprise demos." />
        <PreviewCard title="Reports v1" text="Executive PDF with risk, security findings, compliance posture and controls." />
      </div>
    </section>
  );
}

function CompliancePreview({
  result,
  promptResult,
  report,
}: {
  result: RiskResponse | null;
  promptResult: PromptInjectionTestResponse | null;
  report: RiskReportResponse | null;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.24em] text-emerald-300">
        Compliance mapping
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        Compliance posture engine
      </h2>
      <p className="mt-3 max-w-4xl text-slate-400">
        This module will map agent risk, prompt injection findings, data exposure and
        human oversight controls against major AI governance and security frameworks.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <FrameworkCard
          framework="OWASP LLM Top 10"
          status={promptResult ? "Ready for mapping" : "Run security tests first"}
          items={[
            "Prompt Injection",
            "Sensitive Information Disclosure",
            "Excessive Agency",
            "Insecure Output Handling",
          ]}
        />
        <FrameworkCard
          framework="NIST AI RMF"
          status={result ? "Risk data available" : "Calculate risk first"}
          items={["Govern", "Map", "Measure", "Manage"]}
        />
        <FrameworkCard
          framework="EU AI Act"
          status={report ? "Report data available" : "Generate report first"}
          items={[
            "Risk-based classification",
            "Human oversight",
            "Transparency",
            "Logging and traceability",
          ]}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5 text-sm leading-6 text-yellow-100">
        The EU AI Act mapping will be presented as a governance pre-assessment, not as
        a legal qualification or legal advice.
      </div>
    </section>
  );
}

function SettingsPreview() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur">
      <p className="text-sm uppercase tracking-[0.24em] text-purple-300">
        Settings
      </p>
      <h2 className="mt-3 text-3xl font-semibold text-white">
        Language and workspace preferences
      </h2>
      <p className="mt-3 max-w-4xl text-slate-400">
        The v1 interface will include a language selector for English and French. This
        will make the product easier to demonstrate both internationally and in French
        enterprise contexts.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <PreviewCard title="English" text="Default language for GitHub, portfolio and international technical demos." />
        <PreviewCard title="French" text="Localized language for French governance, DSI and enterprise use cases." />
      </div>
    </section>
  );
}

function FrameworkCard({
  framework,
  status,
  items,
}: {
  framework: string;
  status: string;
  items: string[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <p className="text-lg font-semibold text-white">{framework}</p>
      <p className="mt-2 text-sm text-cyan-200">{status}</p>
      <div className="mt-5 space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
