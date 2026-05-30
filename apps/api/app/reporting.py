from datetime import datetime, timezone

from app.models import (
    AgentAssessmentRequest,
    RiskReportResponse,
)
from app.prompt_tests import run_prompt_injection_tests
from app.risk_engine import calculate_risk_score


def _deduplicate(items: list[str]) -> list[str]:
    seen = set()
    output = []

    for item in items:
        normalized = item.strip()

        if normalized and normalized not in seen:
            seen.add(normalized)
            output.append(normalized)

    return output


def build_executive_summary(
    payload: AgentAssessmentRequest,
    risk_score: int,
    risk_level: str,
    failed_prompt_tests: int,
) -> str:
    if risk_level in ["critical", "high"] or failed_prompt_tests >= 2:
        return (
            f"The AI agent '{payload.name}' presents a {risk_level} governance and "
            f"security risk. The assessment identified a risk score of {risk_score}/100 "
            f"and {failed_prompt_tests} failed prompt injection security tests. "
            "Before production deployment, the agent should be restricted, monitored "
            "and protected with stronger approval and data-access controls."
        )

    if risk_level == "medium":
        return (
            f"The AI agent '{payload.name}' presents a medium risk profile. "
            f"The assessment identified a risk score of {risk_score}/100. "
            "The agent can be considered for limited usage if monitoring, access review "
            "and clear retention controls are implemented."
        )

    return (
        f"The AI agent '{payload.name}' presents a low risk profile based on the current "
        "configuration. The agent should still remain covered by standard governance "
        "controls such as audit logging, access review and periodic reassessment."
    )


def build_recommendations(
    payload: AgentAssessmentRequest,
    risk_factors,
    prompt_findings,
) -> list[str]:
    recommendations = []

    for factor in risk_factors:
        recommendations.append(factor.recommendation)

    for finding in prompt_findings:
        if not finding.passed:
            recommendations.append(finding.recommendation)

    if payload.autonomy_level in ["execute_with_approval", "fully_autonomous"]:
        recommendations.append(
            "Enforce server-side approval for sensitive actions. Do not rely only on prompt instructions."
        )

    if payload.internet_exposed:
        recommendations.append(
            "Add authentication, rate limiting, abuse detection and request monitoring for internet-exposed agents."
        )

    if payload.stores_prompts or payload.stores_outputs:
        recommendations.append(
            "Define a clear retention policy for prompts and outputs, including encryption and access control."
        )

    if payload.connectors:
        recommendations.append(
            "Review connector permissions regularly and apply least privilege to every connected system."
        )

    if not recommendations:
        recommendations.append(
            "Maintain baseline controls: audit logs, access reviews, monitoring and periodic reassessment."
        )

    return _deduplicate(recommendations)


def build_markdown_report(
    payload: AgentAssessmentRequest,
    executive_summary: str,
    risk_assessment,
    prompt_tests,
    recommendations: list[str],
    generated_at: datetime,
) -> str:
    connectors = ", ".join(payload.connectors) if payload.connectors else "None"

    risk_factors = "\n".join(
        [
            f"- **{factor.label}** ({factor.severity}): {factor.recommendation}"
            for factor in risk_assessment.factors
        ]
    ) or "- No major risk factor detected."

    prompt_findings = "\n".join(
        [
            (
                f"### {finding.scenario_id} - {finding.title}\n\n"
                f"- Status: {'PASSED' if finding.passed else 'FAILED'}\n"
                f"- Category: {finding.category}\n"
                f"- Severity: {finding.severity}\n"
                f"- Attack prompt: {finding.attack_prompt}\n"
                f"- Expected control: {finding.expected_control}\n"
                f"- Finding: {finding.finding}\n"
                f"- Recommendation: {finding.recommendation}\n"
            )
            for finding in prompt_tests.findings
        ]
    )

    recommendations_markdown = "\n".join(
        [
            f"- {recommendation}"
            for recommendation in recommendations
        ]
    )

    return f"""# AI Governance Risk Report

Generated at: {generated_at.isoformat()}

## Executive Summary

{executive_summary}

## Agent Profile

| Field | Value |
|---|---|
| Name | {payload.name} |
| Purpose | {payload.purpose} |
| Model provider | {payload.model_provider} |
| Data sensitivity | {payload.data_sensitivity} |
| Autonomy level | {payload.autonomy_level} |
| Connectors | {connectors} |
| Internet exposed | {payload.internet_exposed} |
| Human approval required | {payload.human_approval_required} |
| Stores prompts | {payload.stores_prompts} |
| Stores outputs | {payload.stores_outputs} |

## Risk Assessment

| Metric | Value |
|---|---|
| Risk score | {risk_assessment.risk_score}/100 |
| Risk level | {risk_assessment.risk_level} |

## Risk Factors

{risk_factors}

## Prompt Injection Test Results

| Metric | Value |
|---|---|
| Total tests | {prompt_tests.total_tests} |
| Passed tests | {prompt_tests.passed_tests} |
| Failed tests | {prompt_tests.failed_tests} |
| Overall status | {prompt_tests.overall_status} |

{prompt_findings}

## Recommendations

{recommendations_markdown}
"""


def generate_risk_report(payload: AgentAssessmentRequest) -> RiskReportResponse:
    generated_at = datetime.now(timezone.utc)

    risk_assessment = calculate_risk_score(payload)
    prompt_tests = run_prompt_injection_tests(payload)

    executive_summary = build_executive_summary(
        payload=payload,
        risk_score=risk_assessment.risk_score,
        risk_level=risk_assessment.risk_level,
        failed_prompt_tests=prompt_tests.failed_tests,
    )

    recommendations = build_recommendations(
        payload=payload,
        risk_factors=risk_assessment.factors,
        prompt_findings=prompt_tests.findings,
    )

    markdown_report = build_markdown_report(
        payload=payload,
        executive_summary=executive_summary,
        risk_assessment=risk_assessment,
        prompt_tests=prompt_tests,
        recommendations=recommendations,
        generated_at=generated_at,
    )

    return RiskReportResponse(
        agent_name=payload.name,
        generated_at=generated_at,
        executive_summary=executive_summary,
        agent_profile=payload,
        risk_assessment=risk_assessment,
        prompt_injection_tests=prompt_tests,
        recommendations=recommendations,
        markdown_report=markdown_report,
    )
