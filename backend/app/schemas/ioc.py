from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

class IocCreate(BaseModel):
    type: Literal["IP", "DOMAIN", "URL", "HASH", "EMAIL"]
    value: str
    description: Optional[str] = None
    severity: Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] = "HIGH"

class IocResponse(BaseModel):
    id: int
    type: Literal["IP", "DOMAIN", "URL", "HASH", "EMAIL"]
    value: str
    description: Optional[str] = None
    severity: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
