import { API_URL, DEMO_API_KEY } from "@/lib/constants";
import type {
  AgentAssessmentForm,
  AgentRead,
  AuditLogRead,
  ComplianceMappingResponse,
  HealthStatus,
  ObservabilityMetrics,
  PromptInjectionTestResponse,
  RiskReportResponse,
  RiskResponse,
  SecurityPrincipal,
} from "@/types";

export function authHeaders(): HeadersInit {
  return {
    "X-API-Key": DEMO_API_KEY,
  };
}

export function jsonAuthHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-API-Key": DEMO_API_KEY,
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `API error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getCurrentPrincipal(): Promise<SecurityPrincipal> {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });

  return parseResponse<SecurityPrincipal>(response);
}

export async function getAgents(): Promise<AgentRead[]> {
  const response = await fetch(`${API_URL}/agents`, {
    headers: authHeaders(),
  });

  return parseResponse<AgentRead[]>(response);
}

export async function createAgent(payload: AgentAssessmentForm): Promise<AgentRead> {
  const response = await fetch(`${API_URL}/agents`, {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<AgentRead>(response);
}

export async function updateAgent(
  agentId: number,
  payload: AgentAssessmentForm
): Promise<AgentRead> {
  const response = await fetch(`${API_URL}/agents/${agentId}`, {
    method: "PUT",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<AgentRead>(response);
}

export async function deleteAgentById(agentId: number): Promise<void> {
  const response = await fetch(`${API_URL}/agents/${agentId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Delete failed ${response.status}`);
  }
}

export async function assessRisk(
  payload: AgentAssessmentForm
): Promise<RiskResponse> {
  const response = await fetch(`${API_URL}/risk/assess`, {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<RiskResponse>(response);
}

export async function runPromptTests(
  payload: AgentAssessmentForm
): Promise<PromptInjectionTestResponse> {
  const response = await fetch(`${API_URL}/prompt-tests/run`, {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<PromptInjectionTestResponse>(response);
}

export async function runPromptTestsForAgent(
  agentId: number
): Promise<PromptInjectionTestResponse> {
  const response = await fetch(`${API_URL}/agents/${agentId}/prompt-tests/run`, {
    method: "POST",
    headers: authHeaders(),
  });

  return parseResponse<PromptInjectionTestResponse>(response);
}

export async function generateRiskReport(
  payload: AgentAssessmentForm
): Promise<RiskReportResponse> {
  const response = await fetch(`${API_URL}/reports/generate`, {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<RiskReportResponse>(response);
}

export async function generateRiskReportForAgent(
  agentId: number
): Promise<RiskReportResponse> {
  const response = await fetch(`${API_URL}/agents/${agentId}/report`, {
    headers: authHeaders(),
  });

  return parseResponse<RiskReportResponse>(response);
}

export async function downloadPdfForCurrentForm(
  payload: AgentAssessmentForm
): Promise<Blob> {
  const response = await fetch(`${API_URL}/reports/generate/pdf`, {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "PDF generation failed");
  }

  return response.blob();
}

export async function downloadPdfForAgent(agentId: number): Promise<Blob> {
  const response = await fetch(`${API_URL}/agents/${agentId}/report/pdf`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "PDF generation failed");
  }

  return response.blob();
}

export async function getAuditLogs(): Promise<AuditLogRead[]> {
  const response = await fetch(`${API_URL}/audit-logs?limit=20`, {
    headers: authHeaders(),
  });

  return parseResponse<AuditLogRead[]>(response);
}

export async function getLiveStatus(): Promise<HealthStatus> {
  const response = await fetch(`${API_URL}/live`);
  return parseResponse<HealthStatus>(response);
}

export async function getReadyStatus(): Promise<HealthStatus> {
  const response = await fetch(`${API_URL}/ready`);
  return parseResponse<HealthStatus>(response);
}

export async function getMetrics(): Promise<ObservabilityMetrics> {
  const response = await fetch(`${API_URL}/metrics`, {
    headers: authHeaders(),
  });

  return parseResponse<ObservabilityMetrics>(response);
}

export async function mapCompliance(
  payload: AgentAssessmentForm
): Promise<ComplianceMappingResponse> {
  const response = await fetch(`${API_URL}/compliance/map`, {
    method: "POST",
    headers: jsonAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return parseResponse<ComplianceMappingResponse>(response);
}

export async function mapComplianceForAgent(
  agentId: number
): Promise<ComplianceMappingResponse> {
  const response = await fetch(`${API_URL}/agents/${agentId}/compliance`, {
    headers: authHeaders(),
  });

  return parseResponse<ComplianceMappingResponse>(response);
}

