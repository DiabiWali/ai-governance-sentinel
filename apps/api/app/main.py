from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models import AgentAssessmentRequest, AgentAssessmentResponse
from app.risk_engine import calculate_risk_score

app = FastAPI(
    title="AI Governance Sentinel API",
    description="API for AI agent inventory, risk scoring and governance controls.",
    version="0.1.0"
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


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-governance-sentinel-api"
    }


@app.post("/risk/assess", response_model=AgentAssessmentResponse)
def assess_agent(payload: AgentAssessmentRequest):
    result = calculate_risk_score(payload)
    return result