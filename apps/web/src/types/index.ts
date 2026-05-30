export type RiskFactor = {
  label: string;
  severity: string;
  recommendation: string;
};

export type RiskResponse = {
  agent_name: string;
  risk_score: number;
  risk_level: string;
  factors: RiskFactor[];
};

export type RiskAssessmentRead = {
  id: number;
  risk_score: number;
  risk_level: string;
  factors: RiskFactor[];
  created_at: string;
};

export type AgentRead = {
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

export type AgentAssessmentForm = {
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

export type PromptInjectionFinding = {
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

export type PromptInjectionTestResponse = {
  agent_name: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  overall_status: string;
  findings: PromptInjectionFinding[];
};

export type RiskReportResponse = {
  agent_name: string;
  generated_at: string;
  executive_summary: string;
  agent_profile: AgentAssessmentForm;
  risk_assessment: RiskResponse;
  prompt_injection_tests: PromptInjectionTestResponse;
  recommendations: string[];
  compliance_mapping: ComplianceMappingResponse | null;
  markdown_report: string;
};

export type SecurityPrincipal = {
  actor: string;
  role: string;
};

export type AuditLogRead = {
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

export type RouteMetrics = {
  requests: number;
  errors: number;
  total_latency_ms: number;
  average_latency_ms: number;
  last_status_code: number | null;
};

export type ObservabilityMetrics = {
  service: string;
  version: string;
  requested_by: SecurityPrincipal;
  runtime: {
    uptime_seconds: number;
    total_requests: number;
    total_errors: number;
    average_latency_ms: number;
    routes: Record<string, RouteMetrics>;
  };
  database: {
    agents_count: number;
    risk_assessments_count: number;
    audit_logs_count: number;
  };
  governance: {
    report_events_count: number;
    prompt_test_events_count: number;
    risk_assessment_events_count: number;
    agent_create_events_count: number;
    agent_update_events_count: number;
    agent_delete_events_count: number;
  };
};

export type HealthStatus = {
  status: string;
  service: string;
  version: string;
  database?: string;
};

export type ComplianceControlMapping = {
  framework: string;
  control_id: string;
  control_name: string;
  status: string;
  severity: string;
  evidence: string;
  recommendation: string;
};

export type ComplianceFrameworkMapping = {
  framework: string;
  score: number;
  posture: string;
  controls: ComplianceControlMapping[];
};

export type ComplianceMappingResponse = {
  agent_name: string;
  generated_at: string;
  overall_score: number;
  overall_posture: string;
  executive_summary: string;
  disclaimer: string;
  frameworks: ComplianceFrameworkMapping[];
};

