from datetime import datetime
from typing import Any, Dict, List, Optional

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


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    purpose: Optional[str] = None
    model_provider: Optional[str] = None
    data_sensitivity: Optional[str] = None
    autonomy_level: Optional[str] = None
    connectors: Optional[List[str]] = None
    internet_exposed: Optional[bool] = None
    human_approval_required: Optional[bool] = None
    stores_prompts: Optional[bool] = None
    stores_outputs: Optional[bool] = None


class DeleteResponse(BaseModel):
    deleted: bool
    resource_type: str
    resource_id: int


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



class ComplianceControlMapping(BaseModel):
    framework: str
    control_id: str
    control_name: str
    status: str
    severity: str
    evidence: str
    recommendation: str


class ComplianceFrameworkMapping(BaseModel):
    framework: str
    score: int
    posture: str
    controls: List[ComplianceControlMapping]


class ComplianceMappingResponse(BaseModel):
    agent_name: str
    generated_at: datetime
    overall_score: int
    overall_posture: str
    executive_summary: str
    disclaimer: str
    frameworks: List[ComplianceFrameworkMapping]


class RiskReportResponse(BaseModel):
    agent_name: str
    generated_at: datetime
    executive_summary: str
    agent_profile: AgentAssessmentRequest
    risk_assessment: AgentAssessmentResponse
    prompt_injection_tests: PromptInjectionTestResponse
    recommendations: List[str]
    compliance_mapping: Optional[ComplianceMappingResponse] = None
    markdown_report: str


class SecurityPrincipal(BaseModel):
    actor: str
    role: str


class AuditLogRead(BaseModel):
    id: int
    actor: str
    role: str
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    status: str
    details: dict
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DiscoveryScanRequest(BaseModel):
    source: str
    source_name: str = "manual"
    payload: Dict[str, Any]


class DiscoveryFinding(BaseModel):
    label: str
    severity: str
    evidence: str


class DiscoveredAIAsset(BaseModel):
    name: str
    source: str
    source_id: str
    detected_type: str
    confidence: str
    model_provider: str
    data_sensitivity: str
    autonomy_level: str
    connectors: List[str]
    internet_exposed: bool
    human_approval_required: bool
    stores_prompts: bool
    stores_outputs: bool
    indicators: List[str]
    findings: List[DiscoveryFinding]
    recommended_action: str


class DiscoveryScanSummary(BaseModel):
    scanned_items: int
    detected_assets: int
    high_confidence: int
    medium_confidence: int
    low_confidence: int


class DiscoveryScanResponse(BaseModel):
    source: str
    source_name: str
    summary: DiscoveryScanSummary
    assets: List[DiscoveredAIAsset]

