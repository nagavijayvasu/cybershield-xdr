from datetime import datetime
from typing import Optional, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict

class EventCreate(BaseModel):
    # Agents can identify themselves by host_id or hostname/ip_address
    host_id: Optional[int] = None
    hostname: Optional[str] = None
    ip_address: Optional[str] = None
    operating_system: Optional[str] = None
    agent_version: Optional[str] = None
    
    timestamp: datetime
    event_type: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    username: Optional[str] = None
    process_name: Optional[str] = None
    command_line: Optional[str] = None
    event_data: Dict[str, Any] = {}
    severity: Literal["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] = "INFO"

class EventResponse(BaseModel):
    id: int
    host_id: int
    timestamp: datetime
    event_type: str
    source_ip: Optional[str] = None
    destination_ip: Optional[str] = None
    source_port: Optional[int] = None
    destination_port: Optional[int] = None
    username: Optional[str] = None
    process_name: Optional[str] = None
    command_line: Optional[str] = None
    event_data: Dict[str, Any]
    severity: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
