from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, ConfigDict

class HostBase(BaseModel):
    hostname: str
    ip_address: str
    operating_system: Optional[str] = None
    agent_version: Optional[str] = None
    status: Literal["online", "offline", "isolated"] = "online"

class HostCreate(HostBase):
    pass

class HostUpdate(BaseModel):
    status: Optional[Literal["online", "offline", "isolated"]] = None
    operating_system: Optional[str] = None
    agent_version: Optional[str] = None

class HostResponse(HostBase):
    id: int
    last_seen: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
