from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.ioc import Ioc
from app.schemas.ioc import IocCreate, IocResponse
from app.security.auth import get_current_user, RoleChecker

router = APIRouter(prefix="/iocs", tags=["indicators of compromise"])

@router.post("/", response_model=IocResponse, status_code=status.HTTP_201_CREATED)
def create_ioc(
    ioc_in: IocCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(allowed_roles=["admin", "analyst"]))
):
    """Add a new Indicator of Compromise (IOC) to the Threat Intelligence database."""
    # Check if indicator already exists
    existing = db.query(Ioc).filter(Ioc.value == ioc_in.value).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="IOC value already registered"
        )
        
    db_ioc = Ioc(
        type=ioc_in.type,
        value=ioc_in.value,
        description=ioc_in.description,
        severity=ioc_in.severity
    )
    db.add(db_ioc)
    db.commit()
    db.refresh(db_ioc)
    return db_ioc

@router.get("/", response_model=List[IocResponse])
def get_iocs(
    type_filter: Optional[str] = None,
    severity_filter: Optional[str] = None,
    limit: int = 100,
    skip: int = 0,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve registered threat intelligence indicators. Supports type and severity filtering."""
    query = db.query(Ioc)
    if type_filter:
        query = query.filter(Ioc.type == type_filter)
    if severity_filter:
        query = query.filter(Ioc.severity == severity_filter)
        
    query = query.order_by(Ioc.created_at.desc())
    return query.offset(skip).limit(limit).all()

@router.get("/{id}", response_model=IocResponse)
def get_ioc(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieve details of a specific threat intelligence indicator by its ID."""
    ioc = db.query(Ioc).filter(Ioc.id == id).first()
    if not ioc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IOC not found"
        )
    return ioc

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ioc(
    id: int,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(allowed_roles=["admin", "analyst"]))
):
    """Remove a threat intelligence indicator from the database."""
    ioc = db.query(Ioc).filter(Ioc.id == id).first()
    if not ioc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IOC not found"
        )
    db.delete(ioc)
    db.commit()
    return None
