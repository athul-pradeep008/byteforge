from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class Event(BaseModel):
    id: str
    timestamp: datetime
    source: str
    event_type: str
    details: Dict[str, Any]

class Anomaly(BaseModel):
    id: str
    event_id: str
    score: float
    description: str

class AttackStep(BaseModel):
    tactic: str
    technique_id: str
    confidence: float
    timestamp: datetime
    explanation: str

class Prediction(BaseModel):
    predicted_tactic: str
    predicted_technique_id: str
    likelihood: float
    explanation: str

class ResponseOption(BaseModel):
    id: str
    action: str
    risk_level: str
    description: str

class Approval(BaseModel):
    response_id: str
    approved: bool
    approved_by: str
    timestamp: datetime

class MemoryMatch(BaseModel):
    past_incident_id: str
    similarity_score: float
    learned_pattern: str

class AgentStep(BaseModel):
    agent_name: str
    action: str
    result: str
    timestamp: datetime

class Incident(BaseModel):
    id: str
    status: str
    events: List[Event] = Field(default_factory=list)
    anomalies: List[Anomaly] = Field(default_factory=list)
    attack_chain: List[AttackStep] = Field(default_factory=list)
    predictions: List[Prediction] = Field(default_factory=list)
    response_options: List[ResponseOption] = Field(default_factory=list)
    approval: Optional[Approval] = None
    memory_matches: List[MemoryMatch] = Field(default_factory=list)
    agent_steps: List[AgentStep] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
