from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
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


def safe_text(value) -> str:
    if value is None:
        return ""

    return escape(str(value))


def slugify(value: str) -> str:
    cleaned = value.lower().strip().replace(" ", "-")
    cleaned = "".join(char for char in cleaned if char.isalnum() or char in ["-", "_"])
    return cleaned or "agent"


def pdf_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#64748B"))
    canvas.drawString(2 * cm, 1.2 * cm, "AI Governance Sentinel - Confidential Governance Report")
    canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f"Page {doc.page}")
    canvas.restoreState()


def paragraph(text: str, style):
    return Paragraph(safe_text(text), style)


def build_key_value_table(rows, styles):
    table_data = [
        [
            paragraph(label, styles["TableLabel"]),
            paragraph(value, styles["TableValue"]),
        ]
        for label, value in rows
    ]

    table = Table(
        table_data,
        colWidths=[5 * cm, 11 * cm],
        hAlign="LEFT",
    )

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#0F172A")),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    return table


def build_pdf_report(payload: AgentAssessmentRequest) -> bytes:
    report = generate_risk_report(payload)

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"AI Risk Report - {payload.name}",
        author="AI Governance Sentinel",
    )

    base_styles = getSampleStyleSheet()

    styles = {
        "Title": ParagraphStyle(
            "CustomTitle",
            parent=base_styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=colors.HexColor("#0F172A"),
            alignment=TA_CENTER,
            spaceAfter=16,
        ),
        "Subtitle": ParagraphStyle(
            "Subtitle",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#64748B"),
            alignment=TA_CENTER,
            spaceAfter=22,
        ),
        "Heading": ParagraphStyle(
            "Heading",
            parent=base_styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=15,
            leading=20,
            textColor=colors.HexColor("#0F172A"),
            spaceBefore=16,
            spaceAfter=10,
        ),
        "Body": ParagraphStyle(
            "Body",
            parent=base_styles["BodyText"],
            fontName="Helvetica",
            fontSize=10,
            leading=15,
            textColor=colors.HexColor("#334155"),
            spaceAfter=8,
        ),
        "TableLabel": ParagraphStyle(
            "TableLabel",
            parent=base_styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#0F172A"),
        ),
        "TableValue": ParagraphStyle(
            "TableValue",
            parent=base_styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#334155"),
        ),
        "Small": ParagraphStyle(
            "Small",
            parent=base_styles["BodyText"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#475569"),
        ),
    }

    story = []

    story.append(paragraph("AI Governance Risk Report", styles["Title"]))
    story.append(
        paragraph(
            f"Generated for {report.agent_name} - {report.generated_at.isoformat()}",
            styles["Subtitle"],
        )
    )

    story.append(paragraph("Executive Summary", styles["Heading"]))
    story.append(paragraph(report.executive_summary, styles["Body"]))

    story.append(paragraph("Agent Profile", styles["Heading"]))

    connectors = ", ".join(payload.connectors) if payload.connectors else "None"

    story.append(
        build_key_value_table(
            [
                ("Name", payload.name),
                ("Purpose", payload.purpose),
                ("Model provider", payload.model_provider),
                ("Data sensitivity", payload.data_sensitivity),
                ("Autonomy level", payload.autonomy_level),
                ("Connectors", connectors),
                ("Internet exposed", str(payload.internet_exposed)),
                ("Human approval required", str(payload.human_approval_required)),
                ("Stores prompts", str(payload.stores_prompts)),
                ("Stores outputs", str(payload.stores_outputs)),
            ],
            styles,
        )
    )

    story.append(paragraph("Risk Assessment", styles["Heading"]))
    story.append(
        build_key_value_table(
            [
                ("Risk score", f"{report.risk_assessment.risk_score}/100"),
                ("Risk level", report.risk_assessment.risk_level),
                ("Risk factors", str(len(report.risk_assessment.factors))),
            ],
            styles,
        )
    )

    story.append(paragraph("Risk Factors", styles["Heading"]))

    if not report.risk_assessment.factors:
        story.append(paragraph("No major risk factor detected.", styles["Body"]))
    else:
        for factor in report.risk_assessment.factors:
            story.append(
                paragraph(
                    f"<b>{factor.label}</b> ({factor.severity}) - {factor.recommendation}",
                    styles["Body"],
                )
            )

    story.append(PageBreak())

    story.append(paragraph("Prompt Injection Test Results", styles["Heading"]))
    story.append(
        build_key_value_table(
            [
                ("Total tests", str(report.prompt_injection_tests.total_tests)),
                ("Passed tests", str(report.prompt_injection_tests.passed_tests)),
                ("Failed tests", str(report.prompt_injection_tests.failed_tests)),
                ("Overall status", report.prompt_injection_tests.overall_status),
            ],
            styles,
        )
    )

    story.append(Spacer(1, 10))

    for finding in report.prompt_injection_tests.findings:
        status = "PASSED" if finding.passed else "FAILED"

        story.append(
            paragraph(
                f"{finding.scenario_id} - {finding.title} [{status}]",
                styles["Heading"],
            )
        )
        story.append(
            build_key_value_table(
                [
                    ("Category", finding.category),
                    ("Severity", finding.severity),
                    ("Attack prompt", finding.attack_prompt),
                    ("Expected control", finding.expected_control),
                    ("Finding", finding.finding),
                    ("Recommendation", finding.recommendation),
                ],
                styles,
            )
        )

    story.append(PageBreak())

    story.append(paragraph("Remediation Recommendations", styles["Heading"]))

    for index, recommendation in enumerate(report.recommendations, start=1):
        story.append(paragraph(f"{index}. {recommendation}", styles["Body"]))

    story.append(Spacer(1, 18))
    story.append(
        paragraph(
            "This report is generated automatically by AI Governance Sentinel. "
            "It should be reviewed by security, architecture and governance stakeholders before production deployment.",
            styles["Small"],
        )
    )

    doc.build(story, onFirstPage=pdf_footer, onLaterPages=pdf_footer)

    pdf_bytes = buffer.getvalue()
    buffer.close()

    return pdf_bytes


def build_pdf_filename(agent_name: str) -> str:
    return f"ai-risk-report-{slugify(agent_name)}.pdf"
