from io import BytesIO
from re import sub
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.models import AgentAssessmentRequest
from app.reporting import generate_risk_report


def build_pdf_filename(agent_name: str) -> str:
    safe_name = sub(r"[^a-zA-Z0-9_-]+", "-", agent_name.strip().lower()).strip("-")
    return f"ai-risk-report-{safe_name or 'agent'}.pdf"


def build_pdf_report(payload: AgentAssessmentRequest) -> bytes:
    report = generate_risk_report(payload)

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
        title=f"AI Governance Risk Report - {report.agent_name}",
    )

    styles = build_styles()
    story = []

    story.append(Paragraph("AI Governance Sentinel", styles["eyebrow"]))
    story.append(Paragraph(f"AI Governance Risk Report - {safe(report.agent_name)}", styles["title"]))
    story.append(Spacer(1, 0.35 * cm))
    story.append(Paragraph(safe(report.executive_summary), styles["body"]))
    story.append(Spacer(1, 0.5 * cm))

    story.append(build_score_table(report, styles))
    story.append(Spacer(1, 0.6 * cm))

    story.append(Paragraph("Agent Profile", styles["h2"]))
    story.append(profile_table(report.agent_profile, styles))
    story.append(Spacer(1, 0.5 * cm))

    story.append(Paragraph("Risk Assessment", styles["h2"]))
    story.append(Paragraph(
        f"Risk score: {report.risk_assessment.risk_score}/100 - "
        f"Risk level: {safe(report.risk_assessment.risk_level)}",
        styles["body"],
    ))
    story.append(Spacer(1, 0.25 * cm))

    if report.risk_assessment.factors:
        for factor in report.risk_assessment.factors:
            story.append(Paragraph(
                f"<b>{safe(factor.label)}</b> ({safe(factor.severity)})",
                styles["body"],
            ))
            story.append(Paragraph(safe(factor.recommendation), styles["small"]))
            story.append(Spacer(1, 0.18 * cm))
    else:
        story.append(Paragraph("No major risk factor detected.", styles["body"]))

    story.append(PageBreak())

    story.append(Paragraph("Prompt Injection Test Results", styles["h2"]))
    story.append(Paragraph(
        f"Total tests: {report.prompt_injection_tests.total_tests} - "
        f"Passed: {report.prompt_injection_tests.passed_tests} - "
        f"Failed: {report.prompt_injection_tests.failed_tests} - "
        f"Status: {safe(report.prompt_injection_tests.overall_status)}",
        styles["body"],
    ))
    story.append(Spacer(1, 0.4 * cm))

    for finding in report.prompt_injection_tests.findings:
        status = "passed" if finding.passed else "failed"
        story.append(Paragraph(
            f"<b>{safe(finding.title)}</b> - {safe(status)}",
            styles["body"],
        ))
        story.append(Paragraph(
            f"Category: {safe(finding.category)} | Severity: {safe(finding.severity)}",
            styles["small"],
        ))
        story.append(Paragraph(f"Finding: {safe(finding.finding)}", styles["small"]))
        story.append(Paragraph(f"Recommendation: {safe(finding.recommendation)}", styles["small"]))
        story.append(Spacer(1, 0.25 * cm))

    story.append(PageBreak())

    if report.compliance_mapping:
        story.append(Paragraph("Compliance Mapping", styles["h2"]))
        story.append(Paragraph(
            f"Overall compliance score: {report.compliance_mapping.overall_score}/100 - "
            f"Posture: {safe(report.compliance_mapping.overall_posture)}",
            styles["body"],
        ))
        story.append(Spacer(1, 0.25 * cm))
        story.append(Paragraph(safe(report.compliance_mapping.executive_summary), styles["body"]))
        story.append(Spacer(1, 0.5 * cm))

        for framework in report.compliance_mapping.frameworks:
            story.append(Paragraph(
                f"{safe(framework.framework)} - {framework.score}/100 - {safe(framework.posture)}",
                styles["h3"],
            ))
            story.append(Spacer(1, 0.15 * cm))

            for control in framework.controls:
                story.append(Paragraph(
                    f"<b>{safe(control.control_id)} - {safe(control.control_name)}</b>",
                    styles["body"],
                ))
                story.append(Paragraph(
                    f"Status: {safe(control.status)} | Severity: {safe(control.severity)}",
                    styles["small"],
                ))
                story.append(Paragraph(f"Evidence: {safe(control.evidence)}", styles["small"]))
                story.append(Paragraph(f"Recommendation: {safe(control.recommendation)}", styles["small"]))
                story.append(Spacer(1, 0.22 * cm))

        story.append(Spacer(1, 0.35 * cm))
        story.append(Paragraph("Compliance Disclaimer", styles["h3"]))
        story.append(Paragraph(safe(report.compliance_mapping.disclaimer), styles["small"]))

    story.append(PageBreak())

    story.append(Paragraph("Recommended Controls", styles["h2"]))

    for index, recommendation in enumerate(report.recommendations, start=1):
        story.append(Paragraph(f"{index}. {safe(recommendation)}", styles["body"]))
        story.append(Spacer(1, 0.15 * cm))

    doc.build(story)

    pdf = buffer.getvalue()
    buffer.close()

    return pdf


def build_styles():
    base = getSampleStyleSheet()

    return {
        "eyebrow": ParagraphStyle(
            "eyebrow",
            parent=base["BodyText"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#0891b2"),
            spaceAfter=8,
        ),
        "title": ParagraphStyle(
            "title",
            parent=base["Title"],
            fontSize=24,
            leading=30,
            textColor=colors.HexColor("#0f172a"),
            spaceAfter=14,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontSize=16,
            leading=22,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=12,
            spaceAfter=10,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#0f172a"),
            spaceBefore=10,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#334155"),
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontSize=8.2,
            leading=12,
            textColor=colors.HexColor("#475569"),
            spaceAfter=4,
        ),
        "table": ParagraphStyle(
            "table",
            parent=base["BodyText"],
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor("#334155"),
        ),
    }


def build_score_table(report, styles):
    compliance_score = (
        f"{report.compliance_mapping.overall_score}/100"
        if report.compliance_mapping
        else "N/A"
    )

    compliance_posture = (
        report.compliance_mapping.overall_posture
        if report.compliance_mapping
        else "N/A"
    )

    data = [
        [
            Paragraph("<b>Risk score</b>", styles["table"]),
            Paragraph("<b>Risk level</b>", styles["table"]),
            Paragraph("<b>Compliance score</b>", styles["table"]),
            Paragraph("<b>Compliance posture</b>", styles["table"]),
        ],
        [
            Paragraph(str(report.risk_assessment.risk_score) + "/100", styles["table"]),
            Paragraph(safe(report.risk_assessment.risk_level), styles["table"]),
            Paragraph(safe(compliance_score), styles["table"]),
            Paragraph(safe(compliance_posture), styles["table"]),
        ],
    ]

    table = Table(data, colWidths=[4.2 * cm, 4.2 * cm, 4.2 * cm, 4.2 * cm])
    table.setStyle(default_table_style())

    return table


def profile_table(profile, styles):
    data = [
        ["Name", profile.name],
        ["Purpose", profile.purpose],
        ["Model provider", profile.model_provider],
        ["Data sensitivity", profile.data_sensitivity],
        ["Autonomy level", profile.autonomy_level],
        ["Connectors", ", ".join(profile.connectors) or "none"],
        ["Internet exposed", str(profile.internet_exposed)],
        ["Human approval required", str(profile.human_approval_required)],
        ["Stores prompts", str(profile.stores_prompts)],
        ["Stores outputs", str(profile.stores_outputs)],
    ]

    table_data = [
        [
            Paragraph(f"<b>{safe(label)}</b>", styles["table"]),
            Paragraph(safe(value), styles["table"]),
        ]
        for label, value in data
    ]

    table = Table(table_data, colWidths=[5 * cm, 11.8 * cm])
    table.setStyle(default_table_style())

    return table


def default_table_style():
    return TableStyle(
        [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]
    )


def safe(value) -> str:
    return escape(str(value))
