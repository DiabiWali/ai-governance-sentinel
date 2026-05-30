from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class AgentAssessmentRequest(BaseModel):
    name: str
    purpose: str
    model_provider: str
    data_sensitivity: str
    autonomy_level: str
    connectors: List[str]
    internet_exposed: bool = False
    human_approval_required: bool = False
    stores_prompts: bool = False
    stores_outputs: bool = False


class RiskFactor(BaseModel):
    label: str
    severity: str
    recommendation: str


class AgentAssessmentResponse(BaseModel):
    agent_name: str
    risk_score: int
    risk_level: str
    factors: List[RiskFactor]


class AgentCreate(AgentAssessmentRequest):
    pass


class RiskAssessmentRead(BaseModel):
    id: int
    risk_score: int
    risk_level: str
    factors: List[RiskFactor]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AgentRead(BaseModel):
    id: int
    name: str
    purpose: str
    model_provider: str
    data_sensitivity: str
    autonomy_level: str
    connectors: List[str]
    internet_exposed: bool
    human_approval_required: bool
    stores_prompts: bool
    stores_outputs: bool
    created_at: datetime
    updated_at: datetime
    latest_assessment: Optional[RiskAssessmentRead] = None

    model_config = ConfigDict(from_attributes=True)


class PromptInjectionScenario(BaseModel):
    id: str
    title: str
    category: str
    severity: str
    attack_prompt: str
    expected_control: str


class PromptInjectionFinding(BaseModel):
    scenario_id: str
    title: str
    category: str
    severity: str
    attack_prompt: str
    expected_control: str
    passed: bool
    finding: str
    recommendation: str


class PromptInjectionTestResponse(BaseModel):
    agent_name: str
    total_tests: int
    passed_tests: int
    failed_tests: int
    overall_status: str
    findings: List[PromptInjectionFinding]


class RiskReportResponse(BaseModel):
    agent_name: str
    generated_at: datetime
    executive_summary: str
    agent_profile: AgentAssessmentRequest
    risk_assessment: AgentAssessmentResponse
    prompt_injection_tests: PromptInjectionTestResponse
    recommendations: List[str]
    markdown_report: str
