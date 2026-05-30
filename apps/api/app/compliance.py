from datetime import datetime, timezone
from statistics import mean

from app.models import (
    AgentAssessmentRequest,
    ComplianceControlMapping,
    ComplianceFrameworkMapping,
    ComplianceMappingResponse,
)
from app.prompt_tests import run_prompt_injection_tests
from app.risk_engine import calculate_risk_score


STATUS_SCORE = {
    "aligned": 100,
    "partial": 60,
    "gap": 20,
    "not_applicable": 100,
}


def generate_compliance_mapping(
    payload: AgentAssessmentRequest,
) -> ComplianceMappingResponse:
    risk_assessment = calculate_risk_score(payload)
    prompt_tests = run_prompt_injection_tests(payload)

    frameworks = [
        build_owasp_mapping(payload, risk_assessment, prompt_tests),
        build_nist_mapping(payload, risk_assessment, prompt_tests),
        build_ai_act_mapping(payload, risk_assessment, prompt_tests),
    ]

    overall_score = round(mean([framework.score for framework in frameworks]))
    overall_posture = posture_from_score(overall_score)

    return ComplianceMappingResponse(
        agent_name=payload.name,
        generated_at=datetime.now(timezone.utc),
        overall_score=overall_score,
        overall_posture=overall_posture,
        executive_summary=build_executive_summary(
            agent_name=payload.name,
            overall_score=overall_score,
            overall_posture=overall_posture,
            risk_level=risk_assessment.risk_level,
            failed_prompt_tests=prompt_tests.failed_tests,
        ),
        disclaimer=(
            "This compliance mapping is an automated governance pre-assessment. "
            "It is not a legal opinion, certification, audit attestation or final regulatory qualification."
        ),
        frameworks=frameworks,
    )


def build_owasp_mapping(payload, risk_assessment, prompt_tests):
    controls = []

    prompt_status = "aligned" if prompt_tests.failed_tests == 0 else "gap"
    controls.append(
        control(
            framework="OWASP LLM Top 10",
            control_id="LLM01",
            control_name="Prompt Injection",
            status=prompt_status,
            severity="high" if prompt_status == "gap" else "low",
            evidence=(
                f"{prompt_tests.failed_tests} prompt injection scenario(s) failed "
                f"out of {prompt_tests.total_tests}."
            ),
            recommendation=(
                "Add prompt-injection guardrails, strict tool-use boundaries, "
                "system instruction isolation and human validation for sensitive operations."
                if prompt_status == "gap"
                else "Prompt injection simulations did not expose a major gap. Keep periodic testing enabled."
            ),
        )
    )

    sensitive_data = payload.data_sensitivity in ["confidential", "restricted"]
    retention_enabled = payload.stores_prompts or payload.stores_outputs
    sensitive_connectors = has_sensitive_connectors(payload)

    if sensitive_data and (retention_enabled or sensitive_connectors):
        status = "gap"
    elif sensitive_data or retention_enabled or sensitive_connectors:
        status = "partial"
    else:
        status = "aligned"

    controls.append(
        control(
            framework="OWASP LLM Top 10",
            control_id="LLM02",
            control_name="Sensitive Information Disclosure",
            status=status,
            severity="critical" if status == "gap" else "medium" if status == "partial" else "low",
            evidence=(
                f"Data sensitivity={payload.data_sensitivity}; "
                f"stores_prompts={payload.stores_prompts}; "
                f"stores_outputs={payload.stores_outputs}; "
                f"connectors={', '.join(payload.connectors) or 'none'}."
            ),
            recommendation=(
                "Apply data minimization, retention controls, masking, DLP policies "
                "and least-privilege access on sensitive connectors."
                if status != "aligned"
                else "Sensitive disclosure exposure appears limited for the declared configuration."
            ),
        )
    )

    excessive_agency = (
        payload.autonomy_level == "fully_autonomous"
        and not payload.human_approval_required
    )

    controls.append(
        control(
            framework="OWASP LLM Top 10",
            control_id="LLM06",
            control_name="Excessive Agency",
            status="gap" if excessive_agency else "partial" if payload.autonomy_level != "read_only" else "aligned",
            severity="high" if excessive_agency else "medium" if payload.autonomy_level != "read_only" else "low",
            evidence=(
                f"Autonomy={payload.autonomy_level}; "
                f"human_approval_required={payload.human_approval_required}."
            ),
            recommendation=(
                "Require human approval, scoped tools, action allow-lists and execution boundaries "
                "for autonomous agents."
                if excessive_agency
                else "Maintain explicit tool permissions and approval boundaries for non-read-only agents."
            ),
        )
    )

    return framework("OWASP LLM Top 10", controls)


def build_nist_mapping(payload, risk_assessment, prompt_tests):
    controls = []

    controls.append(
        control(
            framework="NIST AI RMF",
            control_id="GOVERN",
            control_name="Govern",
            status="partial",
            severity="medium",
            evidence="The agent is inventoried, scored and auditable through the platform.",
            recommendation=(
                "Formalize ownership, approval workflow, accountable roles and periodic reassessment cadence."
            ),
        )
    )

    controls.append(
        control(
            framework="NIST AI RMF",
            control_id="MAP",
            control_name="Map",
            status="aligned" if payload.purpose and payload.connectors is not None else "partial",
            severity="low",
            evidence=(
                f"Purpose declared={bool(payload.purpose)}; "
                f"connectors={', '.join(payload.connectors) or 'none'}."
            ),
            recommendation="Document business context, users, data sources, affected stakeholders and intended use.",
        )
    )

    measure_gap = risk_assessment.risk_level in ["critical", "high"] or prompt_tests.failed_tests > 0

    controls.append(
        control(
            framework="NIST AI RMF",
            control_id="MEASURE",
            control_name="Measure",
            status="gap" if measure_gap else "partial",
            severity="high" if measure_gap else "medium",
            evidence=(
                f"Risk level={risk_assessment.risk_level}; "
                f"risk score={risk_assessment.risk_score}; "
                f"failed prompt tests={prompt_tests.failed_tests}."
            ),
            recommendation=(
                "Define measurable controls, acceptance thresholds, test scenarios and monitoring indicators."
            ),
        )
    )

    managed = payload.human_approval_required and risk_assessment.risk_level not in ["critical"]

    controls.append(
        control(
            framework="NIST AI RMF",
            control_id="MANAGE",
            control_name="Manage",
            status="aligned" if managed else "partial" if payload.human_approval_required else "gap",
            severity="medium" if payload.human_approval_required else "high",
            evidence=(
                f"human_approval_required={payload.human_approval_required}; "
                f"risk_level={risk_assessment.risk_level}."
            ),
            recommendation=(
                "Add remediation tracking, approvals, risk acceptance workflow and deployment gates."
            ),
        )
    )

    return framework("NIST AI RMF", controls)


def build_ai_act_mapping(payload, risk_assessment, prompt_tests):
    controls = []

    if risk_assessment.risk_level == "critical":
        classification_status = "gap"
        classification_evidence = "Critical technical and governance risk detected."
    elif risk_assessment.risk_level == "high":
        classification_status = "partial"
        classification_evidence = "High technical and governance risk detected."
    else:
        classification_status = "partial"
        classification_evidence = "Automated pre-screening requires contextual human review."

    controls.append(
        control(
            framework="EU AI Act",
            control_id="RISK_CLASSIFICATION",
            control_name="Risk-based classification pre-screening",
            status=classification_status,
            severity="high" if classification_status == "gap" else "medium",
            evidence=classification_evidence,
            recommendation=(
                "Perform a formal legal and business-context review to determine the applicable AI Act category."
            ),
        )
    )

    controls.append(
        control(
            framework="EU AI Act",
            control_id="HUMAN_OVERSIGHT",
            control_name="Human oversight",
            status="aligned" if payload.human_approval_required else "gap",
            severity="high" if not payload.human_approval_required else "low",
            evidence=f"human_approval_required={payload.human_approval_required}.",
            recommendation=(
                "Define human oversight, escalation, approval and override procedures for sensitive actions."
                if not payload.human_approval_required
                else "Human approval is declared. Ensure oversight is documented and operational."
            ),
        )
    )

    controls.append(
        control(
            framework="EU AI Act",
            control_id="TRANSPARENCY",
            control_name="Transparency and user information",
            status="partial",
            severity="medium",
            evidence="The platform documents the agent purpose and risk posture, but user-facing transparency notices are not yet modeled.",
            recommendation=(
                "Document user-facing AI disclosure, intended use, limitations and escalation channels."
            ),
        )
    )

    logging_status = "aligned" if payload.stores_outputs or payload.stores_prompts else "partial"

    controls.append(
        control(
            framework="EU AI Act",
            control_id="LOGGING_TRACEABILITY",
            control_name="Logging and traceability",
            status=logging_status,
            severity="medium",
            evidence=(
                f"stores_prompts={payload.stores_prompts}; "
                f"stores_outputs={payload.stores_outputs}; "
                "platform audit logs are available."
            ),
            recommendation=(
                "Ensure logs are proportionate, secured, retained appropriately and linked to governance decisions."
            ),
        )
    )

    return framework("EU AI Act", controls)


def has_sensitive_connectors(payload: AgentAssessmentRequest) -> bool:
    sensitive_connectors = {
        "sharepoint",
        "outlook",
        "github",
        "postgresql",
        "hr_api",
        "finance_api",
        "servicenow",
        "salesforce",
    }

    return any(connector in sensitive_connectors for connector in payload.connectors)


def control(
    framework: str,
    control_id: str,
    control_name: str,
    status: str,
    severity: str,
    evidence: str,
    recommendation: str,
) -> ComplianceControlMapping:
    return ComplianceControlMapping(
        framework=framework,
        control_id=control_id,
        control_name=control_name,
        status=status,
        severity=severity,
        evidence=evidence,
        recommendation=recommendation,
    )


def framework(name: str, controls: list[ComplianceControlMapping]) -> ComplianceFrameworkMapping:
    score = round(mean([STATUS_SCORE[control.status] for control in controls]))

    return ComplianceFrameworkMapping(
        framework=name,
        score=score,
        posture=posture_from_score(score),
        controls=controls,
    )


def posture_from_score(score: int) -> str:
    if score >= 85:
        return "strong"
    if score >= 65:
        return "moderate"
    if score >= 45:
        return "weak"

    return "critical"


def build_executive_summary(
    agent_name: str,
    overall_score: int,
    overall_posture: str,
    risk_level: str,
    failed_prompt_tests: int,
) -> str:
    return (
        f"{agent_name} has an overall compliance posture of {overall_posture} "
        f"with a score of {overall_score}/100. The latest governance risk level is "
        f"{risk_level}, with {failed_prompt_tests} failed prompt-injection related test(s). "
        "This result should be reviewed by security, architecture, legal and business stakeholders "
        "before production deployment."
    )
