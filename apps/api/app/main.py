from contextlib import asynccontextmanager
from time import perf_counter
from uuid import uuid4
from typing import List

from fastapi import Depends, FastAPI, HTTPException, Request, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse, Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.audit import to_audit_log_read, write_audit_log
from app.compliance import generate_compliance_mapping
from app.database import Base, engine, get_db
from app.db_models import Agent, AuditLog, RiskAssessment
from app.models import (
    AgentAssessmentRequest,
    AgentAssessmentResponse,
    AgentCreate,
    AgentUpdate,
    AgentRead,
    AuditLogRead,
    ComplianceMappingResponse,
    DeleteResponse,
    PromptInjectionScenario,
    PromptInjectionTestResponse,
    RiskAssessmentRead,
    RiskFactor,
    RiskReportResponse,
    SecurityPrincipal,
)
from app.prompt_tests import (
    get_prompt_injection_scenarios,
    run_prompt_injection_tests,
)
from app.observability import metrics_registry
from app.reporting import generate_risk_report
from app.reporting_pdf import build_pdf_filename, build_pdf_report
from app.risk_engine import calculate_risk_score
from app.security import require_admin, require_analyst_or_admin, require_api_key


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI Governance Sentinel API",
    description="API for AI agent inventory, risk scoring, prompt injection testing, reporting and enterprise security.",
    version="0.8.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def dump_factor(factor: RiskFactor) -> dict:
    if hasattr(factor, "model_dump"):
        return factor.model_dump()

    return factor.dict()


def to_risk_assessment_read(assessment: RiskAssessment | None):
    if assessment is None:
        return None

    return RiskAssessmentRead(
        id=assessment.id,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        factors=[
            RiskFactor(**factor)
            for factor in assessment.factors or []
        ],
        created_at=assessment.created_at,
    )


def get_latest_assessment(db: Session, agent_id: int):
    return (
        db.query(RiskAssessment)
        .filter(RiskAssessment.agent_id == agent_id)
        .order_by(RiskAssessment.created_at.desc())
        .first()
    )


def to_agent_read(db: Session, agent: Agent) -> AgentRead:
    latest_assessment = get_latest_assessment(db, agent.id)

    return AgentRead(
        id=agent.id,
        name=agent.name,
        purpose=agent.purpose,
        model_provider=agent.model_provider,
        data_sensitivity=agent.data_sensitivity,
        autonomy_level=agent.autonomy_level,
        connectors=agent.connectors or [],
        internet_exposed=agent.internet_exposed,
        human_approval_required=agent.human_approval_required,
        stores_prompts=agent.stores_prompts,
        stores_outputs=agent.stores_outputs,
        created_at=agent.created_at,
        updated_at=agent.updated_at,
        latest_assessment=to_risk_assessment_read(latest_assessment),
    )


def agent_to_assessment_request(agent: Agent) -> AgentAssessmentRequest:
    return AgentAssessmentRequest(
        name=agent.name,
        purpose=agent.purpose,
        model_provider=agent.model_provider,
        data_sensitivity=agent.data_sensitivity,
        autonomy_level=agent.autonomy_level,
        connectors=agent.connectors or [],
        internet_exposed=agent.internet_exposed,
        human_approval_required=agent.human_approval_required,
        stores_prompts=agent.stores_prompts,
        stores_outputs=agent.stores_outputs,
    )


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-governance-sentinel-api",
        "version": "0.8.0",
    }


@app.get("/auth/me", response_model=SecurityPrincipal)
def get_current_principal(
    principal: SecurityPrincipal = Security(require_api_key),
):
    return principal


@app.get("/audit-logs", response_model=List[AuditLogRead])
def list_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_admin),
):
    safe_limit = max(1, min(limit, 200))

    audit_logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(safe_limit)
        .all()
    )

    write_audit_log(
        db=db,
        principal=principal,
        action="audit_logs.list",
        resource_type="audit_log",
        status="success",
        details={"limit": safe_limit},
    )

    return [
        to_audit_log_read(audit_log)
        for audit_log in audit_logs
    ]


@app.post("/risk/assess", response_model=AgentAssessmentResponse)
def assess_agent(
    payload: AgentAssessmentRequest,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    assessment = calculate_risk_score(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="risk.assess",
        resource_type="agent_profile",
        status="success",
        details={
            "agent_name": payload.name,
            "risk_score": assessment.risk_score,
            "risk_level": assessment.risk_level,
        },
    )

    return assessment


@app.get("/agents", response_model=List[AgentRead])
def list_agents(
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    agents = (
        db.query(Agent)
        .order_by(Agent.created_at.desc())
        .all()
    )

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.list",
        resource_type="agent",
        status="success",
        details={"count": len(agents)},
    )

    return [
        to_agent_read(db, agent)
        for agent in agents
    ]


@app.get("/agents/{agent_id}", response_model=AgentRead)
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        write_audit_log(
            db=db,
            principal=principal,
            action="agents.get",
            resource_type="agent",
            resource_id=str(agent_id),
            status="not_found",
        )

        raise HTTPException(status_code=404, detail="Agent not found")

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.get",
        resource_type="agent",
        resource_id=str(agent_id),
        status="success",
    )

    return to_agent_read(db, agent)


@app.post("/agents", response_model=AgentRead, status_code=201)
def create_agent(
    payload: AgentCreate,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    assessment = calculate_risk_score(payload)

    agent = Agent(
        name=payload.name,
        purpose=payload.purpose,
        model_provider=payload.model_provider,
        data_sensitivity=payload.data_sensitivity,
        autonomy_level=payload.autonomy_level,
        connectors=payload.connectors,
        internet_exposed=payload.internet_exposed,
        human_approval_required=payload.human_approval_required,
        stores_prompts=payload.stores_prompts,
        stores_outputs=payload.stores_outputs,
    )

    db.add(agent)
    db.commit()
    db.refresh(agent)

    risk_assessment = RiskAssessment(
        agent_id=agent.id,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        factors=[
            dump_factor(factor)
            for factor in assessment.factors
        ],
    )

    db.add(risk_assessment)
    db.commit()
    db.refresh(risk_assessment)

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.create",
        resource_type="agent",
        resource_id=str(agent.id),
        status="success",
        details={
            "agent_name": agent.name,
            "risk_score": assessment.risk_score,
            "risk_level": assessment.risk_level,
        },
    )

    return to_agent_read(db, agent)


@app.get("/prompt-tests/scenarios", response_model=List[PromptInjectionScenario])
def list_prompt_injection_scenarios(
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    return get_prompt_injection_scenarios()


@app.post("/prompt-tests/run", response_model=PromptInjectionTestResponse)
def run_prompt_tests(
    payload: AgentAssessmentRequest,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    result = run_prompt_injection_tests(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="prompt_tests.run",
        resource_type="agent_profile",
        status="success",
        details={
            "agent_name": payload.name,
            "overall_status": result.overall_status,
            "failed_tests": result.failed_tests,
        },
    )

    return result


@app.post("/agents/{agent_id}/prompt-tests/run", response_model=PromptInjectionTestResponse)
def run_prompt_tests_for_saved_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        write_audit_log(
            db=db,
            principal=principal,
            action="agents.prompt_tests.run",
            resource_type="agent",
            resource_id=str(agent_id),
            status="not_found",
        )

        raise HTTPException(status_code=404, detail="Agent not found")

    payload = agent_to_assessment_request(agent)
    result = run_prompt_injection_tests(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.prompt_tests.run",
        resource_type="agent",
        resource_id=str(agent_id),
        status="success",
        details={
            "agent_name": agent.name,
            "overall_status": result.overall_status,
            "failed_tests": result.failed_tests,
        },
    )

    return result


@app.post("/reports/generate", response_model=RiskReportResponse)
def generate_report(
    payload: AgentAssessmentRequest,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    report = generate_risk_report(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="reports.generate",
        resource_type="agent_profile",
        status="success",
        details={
            "agent_name": payload.name,
            "risk_level": report.risk_assessment.risk_level,
        },
    )

    return report


@app.post("/reports/generate/markdown", response_class=PlainTextResponse)
def generate_markdown_report(
    payload: AgentAssessmentRequest,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    report = generate_risk_report(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="reports.generate_markdown",
        resource_type="agent_profile",
        status="success",
        details={"agent_name": payload.name},
    )

    return PlainTextResponse(
        content=report.markdown_report,
        media_type="text/markdown",
    )


@app.post("/reports/generate/pdf")
def generate_pdf_report(
    payload: AgentAssessmentRequest,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    pdf_bytes = build_pdf_report(payload)
    filename = build_pdf_filename(payload.name)

    write_audit_log(
        db=db,
        principal=principal,
        action="reports.generate_pdf",
        resource_type="agent_profile",
        status="success",
        details={
            "agent_name": payload.name,
            "filename": filename,
        },
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


@app.get("/agents/{agent_id}/report", response_model=RiskReportResponse)
def generate_report_for_saved_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        write_audit_log(
            db=db,
            principal=principal,
            action="agents.report.generate",
            resource_type="agent",
            resource_id=str(agent_id),
            status="not_found",
        )

        raise HTTPException(status_code=404, detail="Agent not found")

    payload = agent_to_assessment_request(agent)
    report = generate_risk_report(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.report.generate",
        resource_type="agent",
        resource_id=str(agent_id),
        status="success",
        details={
            "agent_name": agent.name,
            "risk_level": report.risk_assessment.risk_level,
        },
    )

    return report


@app.get("/agents/{agent_id}/report/markdown", response_class=PlainTextResponse)
def generate_markdown_report_for_saved_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        write_audit_log(
            db=db,
            principal=principal,
            action="agents.report.generate_markdown",
            resource_type="agent",
            resource_id=str(agent_id),
            status="not_found",
        )

        raise HTTPException(status_code=404, detail="Agent not found")

    payload = agent_to_assessment_request(agent)
    report = generate_risk_report(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.report.generate_markdown",
        resource_type="agent",
        resource_id=str(agent_id),
        status="success",
        details={"agent_name": agent.name},
    )

    return PlainTextResponse(
        content=report.markdown_report,
        media_type="text/markdown",
    )


@app.get("/agents/{agent_id}/report/pdf")
def generate_pdf_report_for_saved_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        write_audit_log(
            db=db,
            principal=principal,
            action="agents.report.generate_pdf",
            resource_type="agent",
            resource_id=str(agent_id),
            status="not_found",
        )

        raise HTTPException(status_code=404, detail="Agent not found")

    payload = agent_to_assessment_request(agent)
    pdf_bytes = build_pdf_report(payload)
    filename = build_pdf_filename(agent.name)

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.report.generate_pdf",
        resource_type="agent",
        resource_id=str(agent_id),
        status="success",
        details={
            "agent_name": agent.name,
            "filename": filename,
        },
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )



@app.put("/agents/{agent_id}", response_model=AgentRead)
def update_agent(
    agent_id: int,
    payload: AgentUpdate,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        write_audit_log(
            db=db,
            principal=principal,
            action="agents.update",
            resource_type="agent",
            resource_id=str(agent_id),
            status="not_found",
        )

        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = payload.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(agent, field, value)

    db.add(agent)
    db.commit()
    db.refresh(agent)

    assessment_payload = agent_to_assessment_request(agent)
    assessment = calculate_risk_score(assessment_payload)

    risk_assessment = RiskAssessment(
        agent_id=agent.id,
        risk_score=assessment.risk_score,
        risk_level=assessment.risk_level,
        factors=[
            dump_factor(factor)
            for factor in assessment.factors
        ],
    )

    db.add(risk_assessment)
    db.commit()
    db.refresh(risk_assessment)

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.update",
        resource_type="agent",
        resource_id=str(agent.id),
        status="success",
        details={
            "agent_name": agent.name,
            "updated_fields": list(update_data.keys()),
            "risk_score": assessment.risk_score,
            "risk_level": assessment.risk_level,
        },
    )

    return to_agent_read(db, agent)


@app.delete("/agents/{agent_id}", response_model=DeleteResponse)
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_admin),
):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        write_audit_log(
            db=db,
            principal=principal,
            action="agents.delete",
            resource_type="agent",
            resource_id=str(agent_id),
            status="not_found",
        )

        raise HTTPException(status_code=404, detail="Agent not found")

    agent_name = agent.name

    db.delete(agent)
    db.commit()

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.delete",
        resource_type="agent",
        resource_id=str(agent_id),
        status="success",
        details={
            "agent_name": agent_name,
        },
    )

    return DeleteResponse(
        deleted=True,
        resource_type="agent",
        resource_id=agent_id,
    )





@app.middleware("http")
async def observability_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    start_time = perf_counter()
    status_code = 500

    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception:
        status_code = 500
        raise
    finally:
        duration_ms = (perf_counter() - start_time) * 1000

        metrics_registry.record_request(
            method=request.method,
            path=request.url.path,
            status_code=status_code,
            duration_ms=duration_ms,
        )


@app.get("/live")
def liveness_check():
    return {
        "status": "live",
        "service": "ai-governance-sentinel-api",
        "version": "0.8.0",
    }


@app.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "ready",
            "service": "ai-governance-sentinel-api",
            "database": "ok",
            "version": "0.8.0",
        }
    except Exception as error:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "service": "ai-governance-sentinel-api",
                "database": "error",
                "detail": str(error),
                "version": "0.8.0",
            },
        )


@app.get("/metrics")
def get_metrics(
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_admin),
):
    runtime_metrics = metrics_registry.snapshot()

    report_actions = [
        "reports.generate",
        "reports.generate_markdown",
        "reports.generate_pdf",
        "agents.report.generate",
        "agents.report.generate_markdown",
        "agents.report.generate_pdf",
    ]

    prompt_test_actions = [
        "prompt_tests.run",
        "agents.prompt_tests.run",
    ]

    database_metrics = {
        "agents_count": db.query(Agent).count(),
        "risk_assessments_count": db.query(RiskAssessment).count(),
        "audit_logs_count": db.query(AuditLog).count(),
    }

    governance_metrics = {
        "report_events_count": db.query(AuditLog)
        .filter(AuditLog.action.in_(report_actions))
        .count(),
        "prompt_test_events_count": db.query(AuditLog)
        .filter(AuditLog.action.in_(prompt_test_actions))
        .count(),
        "risk_assessment_events_count": db.query(AuditLog)
        .filter(AuditLog.action == "risk.assess")
        .count(),
        "agent_create_events_count": db.query(AuditLog)
        .filter(AuditLog.action == "agents.create")
        .count(),
        "agent_update_events_count": db.query(AuditLog)
        .filter(AuditLog.action == "agents.update")
        .count(),
        "agent_delete_events_count": db.query(AuditLog)
        .filter(AuditLog.action == "agents.delete")
        .count(),
    }

    return {
        "service": "ai-governance-sentinel-api",
        "version": "0.8.0",
        "requested_by": {
            "actor": principal.actor,
            "role": principal.role,
        },
        "runtime": runtime_metrics,
        "database": database_metrics,
        "governance": governance_metrics,
    }

@app.post("/compliance/map", response_model=ComplianceMappingResponse)
def map_compliance(
    payload: AgentAssessmentRequest,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    mapping = generate_compliance_mapping(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="compliance.map",
        resource_type="agent_profile",
        status="success",
        details={
            "agent_name": payload.name,
            "overall_score": mapping.overall_score,
            "overall_posture": mapping.overall_posture,
        },
    )

    return mapping


@app.get("/agents/{agent_id}/compliance", response_model=ComplianceMappingResponse)
def map_compliance_for_saved_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    principal: SecurityPrincipal = Security(require_analyst_or_admin),
):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        write_audit_log(
            db=db,
            principal=principal,
            action="agents.compliance.map",
            resource_type="agent",
            resource_id=str(agent_id),
            status="not_found",
        )

        raise HTTPException(status_code=404, detail="Agent not found")

    payload = agent_to_assessment_request(agent)
    mapping = generate_compliance_mapping(payload)

    write_audit_log(
        db=db,
        principal=principal,
        action="agents.compliance.map",
        resource_type="agent",
        resource_id=str(agent_id),
        status="success",
        details={
            "agent_name": agent.name,
            "overall_score": mapping.overall_score,
            "overall_posture": mapping.overall_posture,
        },
    )

    return mapping

