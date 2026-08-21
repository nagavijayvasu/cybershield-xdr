from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.alert import Alert
from app.schemas.alert import AlertResponse, AlertUpdate
from app.security.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/", response_model=List[AlertResponse])
def get_alerts(
    host_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve security alerts. Supports filtering by host, status, severity and pagination."""
    query = db.query(Alert)
    if host_id:
        query = query.filter(Alert.host_id == host_id)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    if severity_filter:
        query = query.filter(Alert.severity == severity_filter)
        
    # Order by creation date descending (newest alerts first)
    query = query.order_by(Alert.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=AlertResponse)
def get_alert(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve details of a specific alert by its ID."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
    return alert

# Only admin and analyst can update alert statuses
@router.patch("/{id}", response_model=AlertResponse)
def update_alert(
    id: int,
    alert_in: AlertUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(allowed_roles=["admin", "analyst"]))
):
    """Acknowledge, assign, update severity or change status of a security alert."""
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found"
        )
        
    update_data = alert_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(alert, field, value)
        
    db.commit()
    db.refresh(alert)
    return alert
