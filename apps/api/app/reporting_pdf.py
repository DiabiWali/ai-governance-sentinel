from io import BytesIO
from re import sub
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
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


BRAND_DARK = colors.HexColor("#0f172a")
BRAND_MUTED = colors.HexColor("#475569")
BRAND_CYAN = colors.HexColor("#0891b2")
BRAND_CYAN_LIGHT = colors.HexColor("#ecfeff")
BORDER = colors.HexColor("#cbd5e1")
SOFT = colors.HexColor("#f8fafc")
DANGER = colors.HexColor("#fee2e2")
WARNING = colors.HexColor("#fef9c3")
SUCCESS = colors.HexColor("#dcfce7")


def build_pdf_filename(agent_name: str) -> str:
    safe_name = sub(r"[^a-zA-Z0-9_-]+", "-", agent_name.strip().lower()).strip("-")
    return f"ai-governance-report-{safe_name or 'agent'}.pdf"


def build_pdf_report(payload: AgentAssessmentRequest) -> bytes:
    report = generate_risk_report(payload)

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.45 * cm,
        leftMargin=1.45 * cm,
        topMargin=1.55 * cm,
        bottomMargin=1.45 * cm,
        title=f"AI Governance Report - {report.agent_name}",
        author="AI Governance Sentinel",
    )

    styles = build_styles()
    story = []

    story.extend(build_cover_page(report, styles))
    story.append(PageBreak())

    story.append(section_title("1. Executive Summary", styles))
    story.append(Paragraph(safe(report.executive_summary), styles["body"]))
    story.append(Spacer(1, 0.35 * cm))
    story.append(build_score_table(report, styles))
    story.append(Spacer(1, 0.45 * cm))

    story.append(section_title("2. Agent Profile", styles))
    story.append(profile_table(report.agent_profile, styles))
    story.append(Spacer(1, 0.45 * cm))

    story.append(section_title("3. Risk Assessment", styles))
    story.append(
        Paragraph(
            f"Risk score: <b>{report.risk_assessment.risk_score}/100</b> - "
            f"Risk level: <b>{safe(report.risk_assessment.risk_level)}</b>",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.25 * cm))

    if report.risk_assessment.factors:
        story.append(Paragraph("Risk factors", styles["h3"]))
        for factor in report.risk_assessment.factors:
            story.append(callout(
                title=f"{factor.label} - {factor.severity}",
                body=factor.recommendation,
                styles=styles,
                tone=factor.severity,
            ))
            story.append(Spacer(1, 0.18 * cm))
    else:
        story.append(callout(
            title="No major risk factor detected",
            body="Maintain periodic reassessment, access review and audit logging.",
            styles=styles,
            tone="low",
        ))

    story.append(PageBreak())

    story.append(section_title("4. Prompt Injection Test Results", styles))
    story.append(
        Paragraph(
            f"Total tests: <b>{report.prompt_injection_tests.total_tests}</b> - "
            f"Passed: <b>{report.prompt_injection_tests.passed_tests}</b> - "
            f"Failed: <b>{report.prompt_injection_tests.failed_tests}</b> - "
            f"Status: <b>{safe(report.prompt_injection_tests.overall_status)}</b>",
            styles["body"],
        )
    )
    story.append(Spacer(1, 0.35 * cm))

    for finding in report.prompt_injection_tests.findings:
        status = "passed" if finding.passed else "failed"
        story.append(callout(
            title=f"{finding.scenario_id} - {finding.title} - {status}",
            body=(
                f"Category: {finding.category}<br/>"
                f"Severity: {finding.severity}<br/>"
                f"Finding: {finding.finding}<br/>"
                f"Recommendation: {finding.recommendation}"
            ),
            styles=styles,
            tone="low" if finding.passed else finding.severity,
        ))
        story.append(Spacer(1, 0.2 * cm))

    story.append(PageBreak())

    story.append(section_title("5. Compliance Mapping", styles))

    if report.compliance_mapping:
        story.append(
            Paragraph(
                f"Overall compliance score: <b>{report.compliance_mapping.overall_score}/100</b> - "
                f"Posture: <b>{safe(report.compliance_mapping.overall_posture)}</b>",
                styles["body"],
            )
        )
        story.append(Spacer(1, 0.25 * cm))
        story.append(Paragraph(safe(report.compliance_mapping.executive_summary), styles["body"]))
        story.append(Spacer(1, 0.45 * cm))

        story.append(compliance_framework_table(report.compliance_mapping.frameworks, styles))
        story.append(Spacer(1, 0.5 * cm))

        for framework in report.compliance_mapping.frameworks:
            story.append(Paragraph(
                f"{safe(framework.framework)} - {framework.score}/100 - {safe(framework.posture)}",
                styles["h3"],
            ))

            for control in framework.controls:
                story.append(callout(
                    title=f"{control.control_id} - {control.control_name}",
                    body=(
                        f"Status: {control.status}<br/>"
                        f"Severity: {control.severity}<br/>"
                        f"Evidence: {control.evidence}<br/>"
                        f"Recommendation: {control.recommendation}"
                    ),
                    styles=styles,
                    tone=control.severity,
                ))
                story.append(Spacer(1, 0.16 * cm))

        story.append(Spacer(1, 0.35 * cm))
        story.append(callout(
            title="Compliance disclaimer",
            body=report.compliance_mapping.disclaimer,
            styles=styles,
            tone="medium",
        ))
    else:
        story.append(Paragraph("No compliance mapping available for this report.", styles["body"]))

    story.append(PageBreak())

    story.append(section_title("6. Recommended Controls", styles))

    if report.recommendations:
        for index, recommendation in enumerate(report.recommendations, start=1):
            story.append(Paragraph(f"<b>{index}.</b> {safe(recommendation)}", styles["body"]))
            story.append(Spacer(1, 0.16 * cm))
    else:
        story.append(Paragraph("No additional recommendation generated.", styles["body"]))

    story.append(Spacer(1, 0.5 * cm))
    story.append(section_title("7. Review Guidance", styles))
    story.append(Paragraph(
        "This report should be reviewed by security, architecture, legal, compliance and business stakeholders before production deployment. "
        "The compliance mapping is an automated governance pre-assessment and does not replace a formal audit, certification or legal opinion.",
        styles["body"],
    ))

    doc.build(
        story,
        onFirstPage=draw_page_frame,
        onLaterPages=draw_page_frame,
    )

    pdf = buffer.getvalue()
    buffer.close()

    return pdf


def build_cover_page(report, styles):
    compliance_score = (
        report.compliance_mapping.overall_score
        if report.compliance_mapping
        else "N/A"
    )
    compliance_posture = (
        report.compliance_mapping.overall_posture
        if report.compliance_mapping
        else "N/A"
    )

    return [
        Spacer(1, 1.2 * cm),
        Paragraph("AI Governance Sentinel", styles["cover_eyebrow"]),
        Spacer(1, 0.25 * cm),
        Paragraph("AI Governance Report", styles["cover_title"]),
        Spacer(1, 0.25 * cm),
        Paragraph(safe(report.agent_name), styles["cover_subtitle"]),
        Spacer(1, 0.8 * cm),
        Paragraph(
            "Enterprise AI agent risk, security and compliance pre-assessment.",
            styles["cover_body"],
        ),
        Spacer(1, 1.0 * cm),
        build_cover_scorecards(
            risk_score=f"{report.risk_assessment.risk_score}/100",
            risk_level=report.risk_assessment.risk_level,
            compliance_score=f"{compliance_score}/100" if compliance_score != "N/A" else "N/A",
            compliance_posture=str(compliance_posture),
            styles=styles,
        ),
        Spacer(1, 0.8 * cm),
        Paragraph(
            safe(report.executive_summary),
            styles["body"],
        ),
        Spacer(1, 1.0 * cm),
        Paragraph(
            "Generated by AI Governance Sentinel - v1 enterprise workspace",
            styles["small_center"],
        ),
    ]


def build_cover_scorecards(
    risk_score: str,
    risk_level: str,
    compliance_score: str,
    compliance_posture: str,
    styles,
):
    data = [
        [
            score_cell("Risk score", risk_score, styles),
            score_cell("Risk level", risk_level, styles),
            score_cell("Compliance score", compliance_score, styles),
            score_cell("Compliance posture", compliance_posture, styles),
        ]
    ]

    table = Table(data, colWidths=[4.2 * cm, 4.2 * cm, 4.2 * cm, 4.2 * cm])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.25, BORDER),
                ("BACKGROUND", (0, 0), (-1, -1), SOFT),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )

    return table


def score_cell(label: str, value: str, styles):
    return [
        Paragraph(safe(label), styles["score_label"]),
        Paragraph(safe(value), styles["score_value"]),
    ]


def section_title(value: str, styles):
    return Paragraph(safe(value), styles["h2"])


def build_styles():
    base = getSampleStyleSheet()

    return {
        "cover_eyebrow": ParagraphStyle(
            "cover_eyebrow",
            parent=base["BodyText"],
            alignment=TA_CENTER,
            fontSize=10,
            leading=14,
            textColor=BRAND_CYAN,
            spaceAfter=10,
        ),
        "cover_title": ParagraphStyle(
            "cover_title",
            parent=base["Title"],
            alignment=TA_CENTER,
            fontSize=30,
            leading=36,
            textColor=BRAND_DARK,
            spaceAfter=8,
        ),
        "cover_subtitle": ParagraphStyle(
            "cover_subtitle",
            parent=base["Heading2"],
            alignment=TA_CENTER,
            fontSize=16,
            leading=22,
            textColor=BRAND_MUTED,
            spaceAfter=12,
        ),
        "cover_body": ParagraphStyle(
            "cover_body",
            parent=base["BodyText"],
            alignment=TA_CENTER,
            fontSize=10,
            leading=15,
            textColor=BRAND_MUTED,
        ),
        "small_center": ParagraphStyle(
            "small_center",
            parent=base["BodyText"],
            alignment=TA_CENTER,
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#64748b"),
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontSize=16,
            leading=22,
            textColor=BRAND_DARK,
            spaceBefore=8,
            spaceAfter=10,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontSize=12,
            leading=16,
            textColor=BRAND_DARK,
            spaceBefore=8,
            spaceAfter=6,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontSize=9.3,
            leading=14,
            textColor=colors.HexColor("#334155"),
            spaceAfter=6,
        ),
        "small": ParagraphStyle(
            "small",
            parent=base["BodyText"],
            fontSize=8.2,
            leading=12,
            textColor=BRAND_MUTED,
            spaceAfter=4,
        ),
        "table": ParagraphStyle(
            "table",
            parent=base["BodyText"],
            fontSize=8.3,
            leading=11.5,
            textColor=colors.HexColor("#334155"),
        ),
        "score_label": ParagraphStyle(
            "score_label",
            parent=base["BodyText"],
            fontSize=7.8,
            leading=10,
            textColor=BRAND_MUTED,
        ),
        "score_value": ParagraphStyle(
            "score_value",
            parent=base["Heading2"],
            fontSize=13,
            leading=16,
            textColor=BRAND_DARK,
            spaceBefore=4,
        ),
        "callout_title": ParagraphStyle(
            "callout_title",
            parent=base["BodyText"],
            fontSize=9,
            leading=12,
            textColor=BRAND_DARK,
            spaceAfter=4,
        ),
        "callout_body": ParagraphStyle(
            "callout_body",
            parent=base["BodyText"],
            fontSize=8.1,
            leading=12,
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
    table.setStyle(default_table_style(header=True))

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
    table.setStyle(default_table_style(header=False))

    return table


def compliance_framework_table(frameworks, styles):
    data = [
        [
            Paragraph("<b>Framework</b>", styles["table"]),
            Paragraph("<b>Score</b>", styles["table"]),
            Paragraph("<b>Posture</b>", styles["table"]),
        ]
    ]

    for framework in frameworks:
        data.append(
            [
                Paragraph(safe(framework.framework), styles["table"]),
                Paragraph(f"{framework.score}/100", styles["table"]),
                Paragraph(safe(framework.posture), styles["table"]),
            ]
        )

    table = Table(data, colWidths=[8.4 * cm, 4.2 * cm, 4.2 * cm])
    table.setStyle(default_table_style(header=True))

    return table


def callout(title: str, body: str, styles, tone: str):
    background = tone_background(tone)

    data = [
        [Paragraph(f"<b>{safe(title)}</b>", styles["callout_title"])],
        [Paragraph(safe(body), styles["callout_body"])],
    ]

    table = Table(data, colWidths=[16.8 * cm])
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), background),
                ("BOX", (0, 0), (-1, -1), 0.4, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    return table


def tone_background(tone: str):
    if tone in ["critical", "high", "gap"]:
        return DANGER

    if tone in ["medium", "partial"]:
        return WARNING

    if tone in ["low", "aligned", "passed"]:
        return SUCCESS

    return SOFT


def default_table_style(header: bool):
    styles = [
        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]

    if header:
        styles.append(("BACKGROUND", (0, 0), (-1, 0), BRAND_CYAN_LIGHT))
    else:
        styles.append(("BACKGROUND", (0, 0), (-1, -1), SOFT))

    return TableStyle(styles)


def draw_page_frame(canvas, doc):
    canvas.saveState()

    width, height = A4

    canvas.setStrokeColor(colors.HexColor("#e2e8f0"))
    canvas.setLineWidth(0.5)
    canvas.line(1.45 * cm, height - 1.05 * cm, width - 1.45 * cm, height - 1.05 * cm)
    canvas.line(1.45 * cm, 1.05 * cm, width - 1.45 * cm, 1.05 * cm)

    canvas.setFillColor(BRAND_CYAN)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawString(1.45 * cm, height - 0.78 * cm, "AI Governance Sentinel")

    canvas.setFillColor(colors.HexColor("#64748b"))
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 1.45 * cm, 0.72 * cm, f"Page {doc.page}")

    canvas.restoreState()


def safe(value) -> str:
    return escape(str(value))
