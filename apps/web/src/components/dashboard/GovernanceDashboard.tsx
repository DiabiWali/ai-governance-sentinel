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

import { AppShell } from "@/components/layout/AppShell";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { WorkflowSteps } from "@/components/dashboard/WorkflowSteps";
import { AgentForm } from "@/components/agents/AgentForm";
import { AgentInventory } from "@/components/agents/AgentInventory";
import { RiskResultPanel } from "@/components/risk/RiskResultPanel";
import { ReportPanel } from "@/components/reports/ReportPanel";
import { PromptTestPanel } from "@/components/security/PromptTestPanel";
import { ObservabilityPanel } from "@/components/monitoring/ObservabilityPanel";
import { AuditLogsPanel } from "@/components/security/AuditLogsPanel";

export function GovernanceDashboard() {
  const [form, setForm] = useState<AgentAssessmentForm>(INITIAL_AGENT_FORM);
  const [result, setResult] = useState<RiskResponse | null>(null);
  const [promptResult, setPromptResult] = useState<PromptInjectionTestResponse | null>(null);
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

      <PromptTestPanel
        result={promptResult}
        loading={promptTesting}
        onRunCurrent={handleRunPromptTestsForCurrentForm}
      />

      <ReportPanel
        report={report}
        loading={reportGenerating}
        onGenerate={handleGenerateReportForCurrentForm}
        onDownloadMarkdown={handleDownloadMarkdown}
        onDownloadPdf={handleDownloadPdfForCurrentForm}
      />

      <ObservabilityPanel
        liveness={liveness}
        readiness={readiness}
        metrics={metrics}
        loading={observabilityLoading}
        onRefresh={loadObservability}
      />

      <AuditLogsPanel
        logs={auditLogs}
        loading={auditLoading}
        onRefresh={loadAuditLogs}
      />
    </AppShell>
  );
}
