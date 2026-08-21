import os
from sqlalchemy.orm import Session
from app.models.detection_rule import DetectionRule
from app.models.user import User
from app.security.password import get_password_hash
from app.services.audit_service import log_action
from app.config import settings

def seed_detection_rules(db: Session):
    """Seed default active detection rules in the database."""
    default_rules = [
        {
            "name": "Brute Force",
            "description": "5+ failed login events from the same source IP within 5 minutes",
            "event_type": "failed_login",
            "threshold": 5,
            "time_window": 300,
            "severity": "HIGH",
            "mitre_technique": "T1110",
            "enabled": True
        },
        {
            "name": "Port Scan",
            "description": "10+ distinct ports scanned from the same source IP within 2 minutes",
            "event_type": "network_connection",
            "threshold": 10,
            "time_window": 120,
            "severity": "MEDIUM",
            "mitre_technique": "T1046",
            "enabled": True
        },
        {
            "name": "Suspicious Login",
            "description": "3+ failed logins followed by a success for the same user within 5 minutes",
            "event_type": "successful_login",
            "threshold": 3,
            "time_window": 300,
            "severity": "HIGH",
            "mitre_technique": "T1110",
            "enabled": True
        },
        {
            "name": "Suspicious Process",
            "description": "Execution of sensitive binaries or suspicious cmd configurations",
            "event_type": "process_creation",
            "threshold": 1,
            "time_window": 0,
            "severity": "HIGH",
            "mitre_technique": "T1059",
            "enabled": True
        },
        {
            "name": "Excessive Auth Failures",
            "description": "Abnormal failed authentication volume on a single host (20+ failures in 10 minutes)",
            "event_type": "failed_login",
            "threshold": 20,
            "time_window": 600,
            "severity": "HIGH",
            "mitre_technique": "T1110",
            "enabled": True
        }
    ]

    for rule_data in default_rules:
        existing = db.query(DetectionRule).filter(DetectionRule.name == rule_data["name"]).first()
        if not existing:
            db_rule = DetectionRule(**rule_data)
            db.add(db_rule)
    db.commit()

def seed_initial_admin(db: Session):
    """Seed initial administrator dynamically if environment configs are set."""
    admin_username = os.getenv("ADMIN_USERNAME") or settings.ADMIN_USERNAME
    admin_email = os.getenv("ADMIN_EMAIL") or settings.ADMIN_EMAIL
    admin_password = os.getenv("ADMIN_PASSWORD") or settings.ADMIN_PASSWORD
    
    if not (admin_username and admin_email and admin_password):
        # Configuration variables missing, skip seeding
        return
        
    existing_admin = db.query(User).filter(
        (User.username == admin_username) | (User.email == admin_email)
    ).first()
    
    if not existing_admin:
        db_user = User(
            username=admin_username,
            email=admin_email,
            password_hash=get_password_hash(admin_password),
            role="admin",
            is_active=True
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Log this administrative initialization event to audit logs
        log_action(
            db=db,
            user_id=db_user.id,
            username=db_user.username,
            action="ADMIN_ACTION",
            details="Initial platform administrator account seeded via environment configurations."
        )
        print(f"[+] Successfully seeded initial admin user: {admin_username}")
