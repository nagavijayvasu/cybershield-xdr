from typing import List
from pydantic import BaseModel

class DashboardSummary(BaseModel):
    total_events: int
    active_alerts: int
    open_incidents: int
    total_hosts: int
    online_hosts: int

class EventOverTime(BaseModel):
    date: str
    count: int

class AlertBySeverity(BaseModel):
    severity: str
    count: int

class TopSourceIp(BaseModel):
    source_ip: str
    count: int

class TopAttackedHost(BaseModel):
    hostname: str
    count: int

class MitreTechniqueCount(BaseModel):
    technique: str
    tactic: str
    count: int
