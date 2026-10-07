from datetime import datetime
from typing import Optional, Any
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from backend.db.database import Base


class IncidentRow(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True)
    status = Column(String(32), nullable=False, default="ACTIVE")
    scenario_type = Column(String(32), nullable=False, default="attack")  # attack | variant
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    caught_at_stage = Column(Integer, nullable=True)
    selected_action_id = Column(String(64), nullable=True)

    # Relationships
    events = relationship("EventRow", back_populates="incident", cascade="all, delete-orphan")
    anomalies = relationship("AnomalyRow", back_populates="incident", cascade="all, delete-orphan")
    attack_steps = relationship("AttackStepRow", back_populates="incident", cascade="all, delete-orphan")
    predictions = relationship("PredictionRow", back_populates="incident", cascade="all, delete-orphan")
    response_options = relationship("ResponseOptionRow", back_populates="incident", cascade="all, delete-orphan")
    approvals = relationship("ApprovalRow", back_populates="incident", cascade="all, delete-orphan")


class EventRow(Base):
    __tablename__ = "events"

    id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    host = Column(String(128), nullable=False)
    user = Column(String(128), nullable=True)
    event_type = Column(String(64), nullable=False)
    src_ip = Column(String(64), nullable=True)
    dst_ip = Column(String(64), nullable=True)
    port = Column(Integer, nullable=True)
    bytes = Column(Integer, nullable=True)

    incident = relationship("IncidentRow", back_populates="events")


class AnomalyRow(Base):
    __tablename__ = "anomalies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=True)
    event_id = Column(String(64), nullable=True)
    score = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    source = Column(String(32), nullable=False)  # model | rule

    incident = relationship("IncidentRow", back_populates="anomalies")


class AttackStepRow(Base):
    __tablename__ = "attack_steps"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)
    tactic = Column(String(128), nullable=False)
    technique_id = Column(String(64), nullable=False)
    confidence = Column(Float, nullable=False)
    explanation = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=True)

    incident = relationship("IncidentRow", back_populates="attack_steps")


class PredictionRow(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    host = Column(String(128), nullable=False)
    scenario = Column(String(64), nullable=False)  # no_action | after_response
    probability = Column(Float, nullable=False)
    minutes_to_compromise = Column(Float, nullable=False)
    blast_radius = Column(Integer, nullable=False)

    incident = relationship("IncidentRow", back_populates="predictions")


class ResponseOptionRow(Base):
    __tablename__ = "response_options"

    id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    action_type = Column(String(128), nullable=False)
    target = Column(String(128), nullable=False)
    risk_reduction = Column(Float, nullable=False)
    business_impact = Column(Float, nullable=False)
    time_to_execute = Column(String(64), nullable=True)
    rationale = Column(Text, nullable=True)
    score = Column(Float, nullable=False)
    recommended = Column(Boolean, nullable=False, default=False)

    incident = relationship("IncidentRow", back_populates="response_options")


class ApprovalRow(Base):
    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    action_id = Column(String(64), nullable=False)
    decision = Column(String(32), nullable=False)
    approved_by = Column(String(128), nullable=False)
    decided_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    incident = relationship("IncidentRow", back_populates="approvals")


class AuditLogRow(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
    actor = Column(String(128), nullable=False)
    action = Column(String(128), nullable=False)
    reason = Column(Text, nullable=True)
    incident_id = Column(String(64), nullable=True)
    approved_by = Column(String(128), nullable=True)


class MemorySignatureRow(Base):
    __tablename__ = "memory_signatures"

    id = Column(String(64), primary_key=True)
    name = Column(String(128), nullable=False)
    stage_sequence = Column(JSON, nullable=False)
    technique_ids = Column(JSON, nullable=False)
    fingerprint = Column(JSON, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    times_matched = Column(Integer, nullable=False, default=0)
