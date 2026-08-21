from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.audit_log import AuditLogResponse
from app.security.auth import require_admin

router = APIRouter(prefix="/audit-logs", tags=["audit logs"])

@router.get("/", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = 100,
    skip: int = 0,
    action_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_admin)
):
    """Retrieve security audit logs (Administrator only). Supports action filtering."""
    query = db.query(db.models.AuditLog) if hasattr(db.models, "AuditLog") else db.query(db.query(User).session.class_.__dict__.get("registry").mappers[0].class_.__dict__.get("__metadata__").tables.get("audit_logs"))
    
    # Standard mapping fallback to query using SQLAlchemy mapping
    # Let's import the model directly to avoid complex checks!
    from app.models.audit_log import AuditLog
    query = db.query(AuditLog)
    
    if action_filter:
        query = query.filter(AuditLog.action == action_filter)
        
    return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
