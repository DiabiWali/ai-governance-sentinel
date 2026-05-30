from datetime import datetime, timezone

from app.compliance import generate_compliance_mapping
from app.models import AgentAssessmentRequest, RiskReportResponse
from app.prompt_tests import run_prompt_injection_tests
from app.risk_engine import calculate_risk_score


def generate_risk_report(payload: AgentAssessmentRequest) -> RiskReportResponse:
    risk_assessment = calculate_risk_score(payload)
    prompt_tests = run_prompt_injection_tests(payload)
    compliance_mapping = generate_compliance_mapping(payload)

    recommendations = build_recommendations(
        risk_assessment=risk_assessment,
        prompt_tests=prompt_tests,
        compliance_mapping=compliance_mapping,
    )

    markdown_report = build_markdown_report(
        payload=payload,
        risk_assessment=risk_assessment,
        prompt_tests=prompt_tests,
        compliance_mapping=compliance_mapping,
        recommendations=recommendations,
    )

    return RiskReportResponse(
        agent_name=payload.name,
        generated_at=datetime.now(timezone.utc),
        executive_summary=build_executive_summary(
            payload=payload,
            risk_assessment=risk_assessment,
            prompt_tests=prompt_tests,
            compliance_mapping=compliance_mapping,
        ),
        agent_profile=payload,
        risk_assessment=risk_assessment,
        prompt_injection_tests=prompt_tests,
        recommendations=recommendations,
        compliance_mapping=compliance_mapping,
        markdown_report=markdown_report,
    )


def build_executive_summary(
    payload,
    risk_assessment,
    prompt_tests,
    compliance_mapping,
) -> str:
    return (
        f"{payload.name} has a {risk_assessment.risk_level} AI governance risk level "
        f"with a score of {risk_assessment.risk_score}/100. "
        f"The compliance pre-assessment posture is {compliance_mapping.overall_posture} "
        f"with a score of {compliance_mapping.overall_score}/100. "
        f"The prompt injection test suite reported {prompt_tests.failed_tests} failed test(s). "
        "Security, architecture, legal and business stakeholders should review the findings "
        "before production deployment."
    )


def build_recommendations(
    risk_assessment,
    prompt_tests,
    compliance_mapping,
) -> list[str]:
    recommendations: list[str] = []

    for factor in risk_assessment.factors:
        recommendations.append(factor.recommendation)

    for finding in prompt_tests.findings:
        if not finding.passed:
            recommendations.append(finding.recommendation)

    for framework in compliance_mapping.frameworks:
        for control in framework.controls:
            if control.status in ["gap", "partial"]:
                recommendations.append(control.recommendation)

    if not recommendations:
        recommendations.append(
            "Maintain periodic reassessment, access review, audit logging and prompt injection testing."
        )

    return deduplicate(recommendations)


def build_markdown_report(
    payload,
    risk_assessment,
    prompt_tests,
    compliance_mapping,
    recommendations,
) -> str:
    lines: list[str] = []

    lines.append(f"# AI Governance Risk Report - {payload.name}")
    lines.append("")
    lines.append("## Executive Summary")
    lines.append("")
    lines.append(
        build_executive_summary(
            payload=payload,
            risk_assessment=risk_assessment,
            prompt_tests=prompt_tests,
            compliance_mapping=compliance_mapping,
        )
    )
    lines.append("")

    lines.append("## Agent Profile")
    lines.append("")
    lines.append(f"- Name: {payload.name}")
    lines.append(f"- Purpose: {payload.purpose}")
    lines.append(f"- Model provider: {payload.model_provider}")
    lines.append(f"- Data sensitivity: {payload.data_sensitivity}")
    lines.append(f"- Autonomy level: {payload.autonomy_level}")
    lines.append(f"- Connectors: {', '.join(payload.connectors) or 'none'}")
    lines.append(f"- Internet exposed: {payload.internet_exposed}")
    lines.append(f"- Human approval required: {payload.human_approval_required}")
    lines.append(f"- Stores prompts: {payload.stores_prompts}")
    lines.append(f"- Stores outputs: {payload.stores_outputs}")
    lines.append("")

    lines.append("## Risk Assessment")
    lines.append("")
    lines.append(f"- Risk score: {risk_assessment.risk_score}/100")
    lines.append(f"- Risk level: {risk_assessment.risk_level}")
    lines.append("")

    if risk_assessment.factors:
        lines.append("### Risk Factors")
        lines.append("")
        for factor in risk_assessment.factors:
            lines.append(f"- {factor.label} ({factor.severity}): {factor.recommendation}")
        lines.append("")

    lines.append("## Prompt Injection Tests")
    lines.append("")
    lines.append(f"- Total tests: {prompt_tests.total_tests}")
    lines.append(f"- Passed tests: {prompt_tests.passed_tests}")
    lines.append(f"- Failed tests: {prompt_tests.failed_tests}")
    lines.append(f"- Overall status: {prompt_tests.overall_status}")
    lines.append("")

    for finding in prompt_tests.findings:
        status = "passed" if finding.passed else "failed"
        lines.append(f"### {finding.title}")
        lines.append("")
        lines.append(f"- Scenario: {finding.scenario_id}")
        lines.append(f"- Category: {finding.category}")
        lines.append(f"- Severity: {finding.severity}")
        lines.append(f"- Status: {status}")
        lines.append(f"- Finding: {finding.finding}")
        lines.append(f"- Recommendation: {finding.recommendation}")
        lines.append("")

    lines.append("## Compliance Mapping")
    lines.append("")
    lines.append(f"- Overall score: {compliance_mapping.overall_score}/100")
    lines.append(f"- Overall posture: {compliance_mapping.overall_posture}")
    lines.append("")
    lines.append(compliance_mapping.executive_summary)
    lines.append("")

    for framework in compliance_mapping.frameworks:
        lines.append(f"### {framework.framework}")
        lines.append("")
        lines.append(f"- Score: {framework.score}/100")
        lines.append(f"- Posture: {framework.posture}")
        lines.append("")

        for control in framework.controls:
            lines.append(f"#### {control.control_id} - {control.control_name}")
            lines.append("")
            lines.append(f"- Status: {control.status}")
            lines.append(f"- Severity: {control.severity}")
            lines.append(f"- Evidence: {control.evidence}")
            lines.append(f"- Recommendation: {control.recommendation}")
            lines.append("")

    lines.append("## Recommendations")
    lines.append("")
    for recommendation in recommendations:
        lines.append(f"- {recommendation}")
    lines.append("")

    lines.append("## Compliance Disclaimer")
    lines.append("")
    lines.append(compliance_mapping.disclaimer)
    lines.append("")

    return "\n".join(lines)


def deduplicate(values: list[str]) -> list[str]:
    seen = set()
    output = []

    for value in values:
        key = value.strip().lower()

        if key and key not in seen:
            output.append(value)
            seen.add(key)

    return output
