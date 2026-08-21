from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, ConfigDict

class IncidentCreate(BaseModel):
    title: str
    description: str
    severity: Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] = "LOW"
    alert_ids: Optional[List[int]] = []

class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]] = None
    status: Optional[Literal["Open", "Investigating", "Contained", "Resolved", "Closed"]] = None
    assigned_to: Optional[int] = None

class IncidentResponse(BaseModel):
    id: int
    title: str
    description: str
    severity: str
    status: str
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    alert_ids: List[int] = []

    model_config = ConfigDict(from_attributes=True)
