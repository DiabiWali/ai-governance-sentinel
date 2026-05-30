from pydantic import BaseModel
from typing import List, Optional


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
