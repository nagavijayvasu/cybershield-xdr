from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def log_action(
    db: Session,
    user_id: int | None,
    username: str | None,
    action: str,
    details: str,
    ip_address: str | None = None
) -> AuditLog:
    """Creates and persists a security audit log entry."""
    db_log = AuditLog(
        user_id=user_id,
        username=username,
        action=action,
        details=details,
        ip_address=ip_address
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log
