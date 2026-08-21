from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.detection_rule import DetectionRule
from app.models.user import User
from app.schemas.detection_rule import DetectionRuleCreate, DetectionRuleUpdate, DetectionRuleResponse
from app.security.auth import get_current_user, require_admin
from app.services.audit_service import log_action

router = APIRouter(prefix="/rules", tags=["detection rules"])

@router.get("/", response_model=List[DetectionRuleResponse])
def get_rules(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve all active security detection rules (All authenticated roles)."""
    return db.query(DetectionRule).order_by(DetectionRule.id).all()

@router.post("/", response_model=DetectionRuleResponse, status_code=status.HTTP_201_CREATED)
def create_rule(
    rule_in: DetectionRuleCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Create a new security detection rule (Administrator only)."""
    # Check duplicate rule name
    existing = db.query(DetectionRule).filter(DetectionRule.name == rule_in.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Detection rule with this name already exists"
        )
        
    db_rule = DetectionRule(
        name=rule_in.name,
        description=rule_in.description,
        event_type=rule_in.event_type,
        threshold=rule_in.threshold,
        time_window=rule_in.time_window,
        severity=rule_in.severity,
        mitre_technique=rule_in.mitre_technique,
        enabled=rule_in.enabled
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    
    # Log administrative rule creation
    log_action(
        db=db,
        user_id=admin_user.id,
        username=admin_user.username,
        action="DETECTION_RULE_CHANGE",
        details=f"Created detection rule '{db_rule.name}' (ID: {db_rule.id}, MITRE: {db_rule.mitre_technique})."
    )
    
    return db_rule

@router.patch("/{id}", response_model=DetectionRuleResponse)
def update_rule(
    id: int,
    rule_in: DetectionRuleUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Update thresholds, status, or description of a detection rule (Administrator only)."""
    rule = db.query(DetectionRule).filter(DetectionRule.id == id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection rule not found"
        )
        
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
        
    db.commit()
    db.refresh(rule)
    
    # Log administrative rule alteration
    log_action(
        db=db,
        user_id=admin_user.id,
        username=admin_user.username,
        action="DETECTION_RULE_CHANGE",
        details=f"Updated detection rule '{rule.name}' (ID: {rule.id})."
    )
    
    return rule

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rule(
    id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Delete a detection rule policy (Administrator only)."""
    rule = db.query(DetectionRule).filter(DetectionRule.id == id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Detection rule not found"
        )
        
    rule_name = rule.name
    db.delete(rule)
    db.commit()
    
    # Log administrative rule deletion
    log_action(
        db=db,
        user_id=admin_user.id,
        username=admin_user.username,
        action="DETECTION_RULE_CHANGE",
        details=f"Deleted detection rule '{rule_name}' (ID: {id})."
    )
    
    return None
