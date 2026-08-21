from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.incident import Incident
from app.models.alert import Alert
from app.schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate
from app.security.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/incidents", tags=["incidents"])

@router.post("/", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    incident_in: IncidentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(allowed_roles=["admin", "analyst"]))
):
    """Create a new security incident. Optionally escalate and link alert IDs."""
    db_incident = Incident(
        title=incident_in.title,
        description=incident_in.description,
        severity=incident_in.severity,
        status="Open"
    )
    db.add(db_incident)
    db.commit()
    db.refresh(db_incident)

    # Link alerts if specified
    if incident_in.alert_ids:
        alerts = db.query(Alert).filter(Alert.id.in_(incident_in.alert_ids)).all()
        for alert in alerts:
            alert.incident_id = db_incident.id
        db.commit()
        db.refresh(db_incident)

    # Compile alert IDs for response
    alert_ids = [a.id for a in db_incident.alerts]
    
    response_data = IncidentResponse.model_validate(db_incident)
    response_data.alert_ids = alert_ids
    return response_data

@router.get("/", response_model=List[IncidentResponse])
def get_incidents(
    status_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    assigned_to: Optional[int] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve security incidents. Supports filtering by status, severity, and assignee."""
    query = db.query(Incident)
    if status_filter:
        query = query.filter(Incident.status == status_filter)
    if severity_filter:
        query = query.filter(Incident.severity == severity_filter)
    if assigned_to:
        query = query.filter(Incident.assigned_to == assigned_to)
        
    query = query.order_by(Incident.created_at.desc())
    incidents = query.offset(skip).limit(limit).all()

    # Formulate responses with list of alert IDs
    result = []
    for inc in incidents:
        resp = IncidentResponse.model_validate(inc)
        resp.alert_ids = [a.id for a in inc.alerts]
        result.append(resp)
        
    return result

@router.get("/{id}", response_model=IncidentResponse)
def get_incident(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve details of a specific security incident by its ID."""
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
    
    resp = IncidentResponse.model_validate(incident)
    resp.alert_ids = [a.id for a in incident.alerts]
    return resp

@router.patch("/{id}", response_model=IncidentResponse)
def update_incident(
    id: int,
    incident_in: IncidentUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(allowed_roles=["admin", "analyst"]))
):
    """Update details, assignment status, severity, or transition the state of a security incident."""
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found"
        )
        
    update_data = incident_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(incident, field, value)
        
    # Auto resolved_at logic if status transitions to containment or closing
    if incident_in.status in ["Resolved", "Closed"]:
        incident.resolved_at = datetime.now(timezone.utc)
    elif incident_in.status and incident_in.status not in ["Resolved", "Closed"]:
        # Reopened
        incident.resolved_at = None

    db.commit()
    db.refresh(incident)
    
    resp = IncidentResponse.model_validate(incident)
    resp.alert_ids = [a.id for a in incident.alerts]
    return resp
