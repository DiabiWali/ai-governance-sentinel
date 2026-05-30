from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(160), nullable=False, index=True)
    purpose = Column(Text, nullable=False)
    model_provider = Column(String(120), nullable=False)
    data_sensitivity = Column(String(50), nullable=False, index=True)
    autonomy_level = Column(String(80), nullable=False, index=True)
    connectors = Column(JSON, nullable=False, default=list)

    internet_exposed = Column(Boolean, nullable=False, default=False)
    human_approval_required = Column(Boolean, nullable=False, default=False)
    stores_prompts = Column(Boolean, nullable=False, default=False)
    stores_outputs = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, onupdate=utc_now)

    assessments = relationship(
        "RiskAssessment",
        back_populates="agent",
        cascade="all, delete-orphan",
    )


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False, index=True)

    risk_score = Column(Integer, nullable=False)
    risk_level = Column(String(50), nullable=False, index=True)
    factors = Column(JSON, nullable=False, default=list)

    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    agent = relationship("Agent", back_populates="assessments")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    actor = Column(String(160), nullable=False, index=True)
    role = Column(String(80), nullable=False, index=True)
    action = Column(String(160), nullable=False, index=True)

    resource_type = Column(String(120), nullable=True, index=True)
    resource_id = Column(String(120), nullable=True, index=True)

    status = Column(String(80), nullable=False, default="success", index=True)
    details = Column(JSON, nullable=False, default=dict)

    created_at = Column(DateTime(timezone=True), nullable=False, default=utc_now, index=True)
