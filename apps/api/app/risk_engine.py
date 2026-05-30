from app.models import AgentAssessmentRequest, AgentAssessmentResponse, RiskFactor


SENSITIVE_CONNECTORS = {
    "sharepoint",
    "outlook",
    "gmail",
    "github",
    "postgresql",
    "sqlserver",
    "salesforce",
    "servicenow",
    "hr_api",
    "finance_api"
}


def calculate_risk_score(payload: AgentAssessmentRequest) -> AgentAssessmentResponse:
    score = 0
    factors = []

    sensitivity_scores = {
        "public": 5,
        "internal": 20,
        "confidential": 35,
        "restricted": 45
    }

    autonomy_scores = {
        "read_only": 10,
        "suggest_action": 20,
        "execute_with_approval": 30,
        "fully_autonomous": 45
    }

    score += sensitivity_scores.get(payload.data_sensitivity.lower(), 15)
    score += autonomy_scores.get(payload.autonomy_level.lower(), 15)

    if payload.data_sensitivity.lower() in ["confidential", "restricted"]:
        factors.append(RiskFactor(
            label="Sensitive data exposure",
            severity="high",
            recommendation="Limit data scope, apply least privilege and enable audit logging."
        ))

    detected_sensitive_connectors = [
        connector for connector in payload.connectors
        if connector.lower() in SENSITIVE_CONNECTORS
    ]

    if detected_sensitive_connectors:
        score += len(detected_sensitive_connectors) * 8
        factors.append(RiskFactor(
            label="Sensitive connectors detected",
            severity="medium",
            recommendation="Review connector permissions and apply DLP policies."
        ))

    if payload.internet_exposed:
        score += 20
        factors.append(RiskFactor(
            label="Internet exposed agent",
            severity="high",
            recommendation="Add authentication, rate limiting, monitoring and abuse protection."
        ))

    if payload.autonomy_level.lower() == "fully_autonomous" and not payload.human_approval_required:
        score += 25
        factors.append(RiskFactor(
            label="Excessive agency",
            severity="critical",
            recommendation="Require human approval for sensitive actions."
        ))

    if payload.stores_prompts or payload.stores_outputs:
        score += 10
        factors.append(RiskFactor(
            label="Prompt and output retention",
            severity="medium",
            recommendation="Define retention policy, encryption and access control."
        ))

    score = min(score, 100)

    if score >= 80:
        risk_level = "critical"
    elif score >= 60:
        risk_level = "high"
    elif score >= 35:
        risk_level = "medium"
    else:
        risk_level = "low"

    return AgentAssessmentResponse(
        agent_name=payload.name,
        risk_score=score,
        risk_level=risk_level,
        factors=factors
    )
