from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

class DetectionRuleCreate(BaseModel):
    name: str
    description: str
    event_type: str
    threshold: int = 1
    time_window: int = 300
    severity: Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] = "LOW"
    mitre_technique: Optional[str] = None
    enabled: bool = True

class DetectionRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    threshold: Optional[int] = None
    time_window: Optional[int] = None
    severity: Optional[Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"]] = None
    mitre_technique: Optional[str] = None
    enabled: Optional[bool] = None

class DetectionRuleResponse(BaseModel):
    id: int
    name: str
    description: str
    event_type: str
    threshold: int
    time_window: int
    severity: str
    mitre_technique: Optional[str] = None
    enabled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
