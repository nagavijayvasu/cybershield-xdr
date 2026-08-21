from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.host import Host
from app.models.user import User
from app.schemas.host import HostResponse, HostUpdate
from app.security.auth import get_current_user, RoleChecker, require_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/hosts", tags=["hosts"])

@router.get("/", response_model=List[HostResponse])
def get_hosts(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve all monitored hosts. Optionally filter by status."""
    query = db.query(Host)
    if status_filter:
        query = query.filter(Host.status == status_filter)
    return query.all()

@router.get("/{id}", response_model=HostResponse)
def get_host(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve details of a specific host by its ID."""
    host = db.query(Host).filter(Host.id == id).first()
    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found"
        )
    return host

@router.patch("/{id}", response_model=HostResponse)
def update_host(
    id: int,
    host_in: HostUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(allowed_roles=["admin", "analyst"]))
):
    """Update host configuration or isolate a host (Admin/Analyst only)."""
    host = db.query(Host).filter(Host.id == id).first()
    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found"
        )
        
    update_data = host_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(host, field, value)
        
    db.commit()
    db.refresh(host)
    return host

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_host(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Remove a monitored host from the XDR registry (Administrator only)."""
    host = db.query(Host).filter(Host.id == id).first()
    if not host:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Host not found"
        )
        
    hostname = host.hostname
    db.delete(host)
    db.commit()
    
    # Log administrative asset removal
    log_action(
        db=db,
        user_id=admin_user.id,
        username=admin_user.username,
        action="ADMIN_ACTION",
        details=f"Removed host asset '{hostname}' (ID: {id}) from XDR registry."
    )
    
    return None
