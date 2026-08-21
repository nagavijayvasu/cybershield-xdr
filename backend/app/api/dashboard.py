from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.host import Host
from app.models.event import Event
from app.models.alert import Alert
from app.models.incident import Incident
from app.schemas.dashboard import (
    DashboardSummary,
    EventOverTime,
    AlertBySeverity,
    TopSourceIp,
    TopAttackedHost,
    MitreTechniqueCount
)
from app.security.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard analytics"])

@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve high-level overview counts for the SOC dashboard."""
    total_events = db.query(Event).count()
    active_alerts = db.query(Alert).filter(Alert.status.in_(["NEW", "INVESTIGATING"])).count()
    open_incidents = db.query(Incident).filter(Incident.status.in_(["Open", "Investigating", "Contained"])).count()
    total_hosts = db.query(Host).count()
    online_hosts = db.query(Host).filter(Host.status == "online").count()

    return {
        "total_events": total_events,
        "active_alerts": active_alerts,
        "open_incidents": open_incidents,
        "total_hosts": total_hosts,
        "online_hosts": online_hosts
    }

@router.get("/events-over-time", response_model=List[EventOverTime])
def get_events_over_time(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve event counts grouped by day for timeline visualization."""
    # Database-agnostic date grouping: func.date returns string YYYY-MM-DD
    results = db.query(
        func.date(Event.timestamp).label("date_group"),
        func.count(Event.id).label("event_count")
    ).group_by("date_group").order_by("date_group").limit(7).all()

    return [{"date": str(r[0]), "count": r[1]} for r in results]

@router.get("/alerts-by-severity", response_model=List[AlertBySeverity])
def get_alerts_by_severity(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve alert counts grouped by severity level."""
    results = db.query(
        Alert.severity,
        func.count(Alert.id)
    ).group_by(Alert.severity).all()

    return [{"severity": r[0], "count": r[1]} for r in results]

@router.get("/top-source-ips", response_model=List[TopSourceIp])
def get_top_source_ips(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve the top 5 source IPs triggering events."""
    results = db.query(
        Event.source_ip,
        func.count(Event.id).label("count")
    ).filter(Event.source_ip.isnot(None), Event.source_ip != "").group_by(
        Event.source_ip
    ).order_by(
        func.count(Event.id).desc()
    ).limit(5).all()

    return [{"source_ip": r[0], "count": r[1]} for r in results]

@router.get("/top-attacked-hosts", response_model=List[TopAttackedHost])
def get_top_attacked_hosts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve the top 5 hosts with the most alerts."""
    results = db.query(
        Host.hostname,
        func.count(Alert.id).label("alert_count")
    ).join(
        Alert, Alert.host_id == Host.id
    ).group_by(
        Host.hostname
    ).order_by(
        func.count(Alert.id).desc()
    ).limit(5).all()

    return [{"hostname": r[0], "count": r[1]} for r in results]

@router.get("/mitre-techniques", response_model=List[MitreTechniqueCount])
def get_mitre_techniques(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Retrieve alert counts mapped to MITRE techniques."""
    results = db.query(
        Alert.mitre_technique,
        Alert.mitre_tactic,
        func.count(Alert.id)
    ).filter(
        Alert.mitre_technique.isnot(None)
    ).group_by(
        Alert.mitre_technique, Alert.mitre_tactic
    ).order_by(
        func.count(Alert.id).desc()
    ).all()

    return [{"technique": r[0], "tactic": r[1], "count": r[2]} for r in results]
