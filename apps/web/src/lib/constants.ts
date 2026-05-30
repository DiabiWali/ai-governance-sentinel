import type { AgentAssessmentForm } from "@/types";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const DEMO_API_KEY =
  process.env.NEXT_PUBLIC_DEMO_API_KEY || "dev-admin-key";

export const CONNECTORS = [
  "sharepoint",
  "outlook",
  "github",
  "postgresql",
  "hr_api",
  "finance_api",
  "servicenow",
  "salesforce",
];

export const DATA_SENSITIVITY_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
  { value: "restricted", label: "Restricted" },
];

export const AUTONOMY_OPTIONS = [
  { value: "read_only", label: "Read only" },
  { value: "suggest_action", label: "Suggest action" },
  { value: "execute_with_approval", label: "Execute with approval" },
  { value: "fully_autonomous", label: "Fully autonomous" },
];

export const INITIAL_AGENT_FORM: AgentAssessmentForm = {
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
