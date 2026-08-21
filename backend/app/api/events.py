from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.host import Host
from app.models.event import Event
from app.schemas.event import EventCreate, EventResponse
from app.security.auth import get_current_user
from app.services.detection_engine import evaluate_rules
from app.services.threat_intel import correlate_threat_intel

router = APIRouter(prefix="/events", tags=["events"])

@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def ingest_event(
    event_in: EventCreate,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    Ingest a new raw telemetry event from an endpoint agent.
    If the host is unknown, it will be automatically registered.
    """
    # Optional API Key Validation if API_KEY is set in settings
    # (Default check or bypass if not configured)
    # We will enforce this API key check when configuring the agent
    
    # 1. Resolve host
    host = None
    
    if event_in.host_id:
        host = db.query(Host).filter(Host.id == event_in.host_id).first()
        
    if not host and event_in.hostname:
        # Resolve by hostname
        host = db.query(Host).filter(Host.hostname == event_in.hostname).first()
        if host:
            # Update IP and status if they changed
            if event_in.ip_address:
                host.ip_address = event_in.ip_address
            host.status = "online"
            db.commit()
            db.refresh(host)
            
    if not host:
        # Auto-register new host
        if not event_in.hostname or not event_in.ip_address:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New host registration requires both 'hostname' and 'ip_address'"
            )
        host = Host(
            hostname=event_in.hostname,
            ip_address=event_in.ip_address,
            operating_system=event_in.operating_system,
            agent_version=event_in.agent_version,
            status="online"
        )
        db.add(host)
        db.commit()
        db.refresh(host)
    else:
        # Existing host: update last seen and ensure status is online (unless isolated)
        if host.status != "isolated":
            host.status = "online"
        db.commit()
        db.refresh(host)
        
    # 2. Record the telemetry event
    db_event = Event(
        host_id=host.id,
        timestamp=event_in.timestamp,
        event_type=event_in.event_type,
        source_ip=event_in.source_ip,
        destination_ip=event_in.destination_ip,
        source_port=event_in.source_port,
        destination_port=event_in.destination_port,
        username=event_in.username,
        process_name=event_in.process_name,
        command_line=event_in.command_line,
        event_data=event_in.event_data,
        severity=event_in.severity
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    # Evaluate detection rules against the new event
    try:
        evaluate_rules(db, db_event)
    except Exception:
        # Suppress engine exceptions to prevent API ingestion failure
        pass
        
    # Correlate event against Threat Intelligence indicators
    try:
        correlate_threat_intel(db, db_event)
    except Exception:
        # Suppress threat intel exceptions to prevent API ingestion failure
        pass
        
    return db_event

@router.get("/", response_model=List[EventResponse])
def get_events(
    host_id: Optional[int] = None,
    event_type: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve raw telemetry events. Supports filtering by host, type, severity and pagination."""
    query = db.query(Event)
    if host_id:
        query = query.filter(Event.host_id == host_id)
    if event_type:
        query = query.filter(Event.event_type == event_type)
    if severity:
        query = query.filter(Event.severity == severity)
        
    # Order by timestamp descending (newest events first)
    query = query.order_by(Event.timestamp.desc())
    
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=EventResponse)
def get_event(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve details of a specific security event by its ID."""
    event = db.query(Event).filter(Event.id == id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    return event
