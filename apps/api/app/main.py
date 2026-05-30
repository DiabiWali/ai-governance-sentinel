from contextlib import asynccontextmanager
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.db_models import Agent, RiskAssessment
from app.models import (
    AgentAssessmentRequest,
    AgentAssessmentResponse,
    AgentCreate,
    AgentRead,
    RiskAssessmentRead,
    RiskFactor,
)
from app.risk_engine import calculate_risk_score


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="AI Governance Sentinel API",
    description="API for AI agent inventory, risk scoring and governance controls.",
    version="0.3.0",
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


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-governance-sentinel-api",
        "version": "0.3.0",
    }


@app.post("/risk/assess", response_model=AgentAssessmentResponse)
def assess_agent(payload: AgentAssessmentRequest):
    return calculate_risk_score(payload)


@app.get("/agents", response_model=List[AgentRead])
def list_agents(db: Session = Depends(get_db)):
    agents = (
        db.query(Agent)
        .order_by(Agent.created_at.desc())
        .all()
    )

    return [
        to_agent_read(db, agent)
        for agent in agents
    ]


@app.get("/agents/{agent_id}", response_model=AgentRead)
def get_agent(agent_id: int, db: Session = Depends(get_db)):
    agent = (
        db.query(Agent)
        .filter(Agent.id == agent_id)
        .first()
    )

    if agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")

    return to_agent_read(db, agent)


@app.post("/agents", response_model=AgentRead, status_code=201)
def create_agent(payload: AgentCreate, db: Session = Depends(get_db)):
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

    return to_agent_read(db, agent)
