from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

class AlertUpdate(BaseModel):
    status: Optional[Literal["NEW", "INVESTIGATING", "RESOLVED", "FALSE_POSITIVE"]] = None
    severity: Optional[Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]] = None
    incident_id: Optional[int] = None  # Link alert to an incident

class AlertResponse(BaseModel):
    id: int
    event_id: Optional[int] = None
    rule_id: Optional[int] = None
    host_id: int
    incident_id: Optional[int] = None
    ioc_id: Optional[int] = None
    title: str
    description: str
    severity: str
    source_ip: Optional[str] = None
    status: str
    confidence: int
    mitre_tactic: Optional[str] = None
    mitre_technique: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
