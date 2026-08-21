from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import func, distinct
from sqlalchemy.orm import Session
from app.models.event import Event
from app.models.host import Host
from app.models.alert import Alert
from app.models.detection_rule import DetectionRule

def evaluate_rules(db: Session, event: Event):
    """
    Evaluate rule checks against the database when a new event is ingested.
    If a rule matches, generate a corresponding Alert in the database.
    """
    # Load the host details
    host = db.query(Host).filter(Host.id == event.host_id).first()
    hostname = host.hostname if host else f"Host #{event.host_id}"

    # Load active detection rules
    rules = {r.name: r for r in db.query(DetectionRule).filter(DetectionRule.enabled == True).all()}

    # Helper function to prevent duplicate alerts for the same source IP/rule in a short window
    def is_duplicate_alert(rule_id: int, source_ip: Optional[str], window_seconds: int = 300) -> bool:
        threshold_time = datetime.now(timezone.utc) - timedelta(seconds=window_seconds)
        query = db.query(Alert).filter(
            Alert.rule_id == rule_id,
            Alert.host_id == event.host_id,
            Alert.created_at >= threshold_time
        )
        if source_ip:
            query = query.filter(Alert.source_ip == source_ip)
        
        return query.first() is not None

    # Helper to create an alert
    def create_alert(rule: DetectionRule, title: str, description: str, severity: str, confidence: int):
        # Deduplication check
        if is_duplicate_alert(rule.id, event.source_ip, rule.time_window):
            return
            
        new_alert = Alert(
            event_id=event.id,
            rule_id=rule.id,
            host_id=event.host_id,
            title=title,
            description=description,
            severity=severity,
            source_ip=event.source_ip,
            status="NEW",
            confidence=confidence,
            mitre_tactic="Discovery" if rule.mitre_technique == "T1046" else "Credential Access",
            mitre_technique=rule.mitre_technique
        )
        # Handle tactic override for Execute technique
        if rule.mitre_technique == "T1059":
            new_alert.mitre_tactic = "Execution"
            
        db.add(new_alert)
        db.commit()
        db.refresh(new_alert)

    # ==========================================
    # RULE 1: Brute Force Detection (T1110)
    # ==========================================
    r_brute = rules.get("Brute Force")
    if r_brute and event.event_type == "failed_login" and event.source_ip:
        time_limit = event.timestamp - timedelta(seconds=r_brute.time_window)
        # Query failed logins from the same source IP in the time window
        failed_count = db.query(Event).filter(
            Event.host_id == event.host_id,
            Event.event_type == "failed_login",
            Event.source_ip == event.source_ip,
            Event.timestamp >= time_limit
        ).count()

        if failed_count >= r_brute.threshold:
            create_alert(
                rule=r_brute,
                title=f"Brute Force Attack from {event.source_ip}",
                description=f"Detected {failed_count} failed login attempts from IP {event.source_ip} on host '{hostname}' within {r_brute.time_window // 60} minutes.",
                severity=r_brute.severity,
                confidence=85
            )

    # ==========================================
    # RULE 2: Port Scan Detection (T1046)
    # ==========================================
    r_scan = rules.get("Port Scan")
    if r_scan and event.event_type == "network_connection" and event.source_ip:
        time_limit = event.timestamp - timedelta(seconds=r_scan.time_window)
        # Count distinct destination ports from the same source IP
        scanned_ports = db.query(distinct(Event.destination_port)).filter(
            Event.host_id == event.host_id,
            Event.event_type == "network_connection",
            Event.source_ip == event.source_ip,
            Event.destination_port.isnot(None),
            Event.timestamp >= time_limit
        ).all()
        
        ports_count = len(scanned_ports)
        if ports_count >= r_scan.threshold:
            create_alert(
                rule=r_scan,
                title=f"Port Scan Detected from {event.source_ip}",
                description=f"IP {event.source_ip} scanned {ports_count} distinct ports on host '{hostname}' within {r_scan.time_window // 60} minutes.",
                severity=r_scan.severity,
                confidence=75
            )

    # ==========================================
    # RULE 3: Suspicious Login Detection (T1110)
    # ==========================================
    r_susp_login = rules.get("Suspicious Login")
    if r_susp_login and event.event_type == "successful_login" and event.username:
        time_limit = event.timestamp - timedelta(seconds=r_susp_login.time_window)
        # Check for multiple failed logins followed by success for username
        failed_count = db.query(Event).filter(
            Event.host_id == event.host_id,
            Event.event_type == "failed_login",
            Event.username == event.username,
            Event.timestamp >= time_limit
        ).count()

        if failed_count >= r_susp_login.threshold:
            create_alert(
                rule=r_susp_login,
                title=f"Suspicious Login for User '{event.username}'",
                description=f"Multiple failed login attempts ({failed_count}) followed by a successful login for user '{event.username}' on host '{hostname}' within {r_susp_login.time_window // 60} minutes.",
                severity=r_susp_login.severity,
                confidence=90
            )

    # ==========================================
    # RULE 4: Suspicious Process (T1059)
    # ==========================================
    r_proc = rules.get("Suspicious Process")
    if r_proc and event.event_type == "process_creation" and event.process_name:
        suspicious_binaries = ["whoami", "mimikatz", "ncat", "nc", "cobaltstrike", "certutil", "powershell.exe"]
        process_lower = event.process_name.lower()
        
        is_suspicious = False
        for binary in suspicious_binaries:
            if binary in process_lower:
                is_suspicious = True
                break
                
        # Additionally inspect command lines if they contain flags like bypass execution policy
        if not is_suspicious and event.command_line:
            cmd_lower = event.command_line.lower()
            if "-bypass" in cmd_lower or "exec bypass" in cmd_lower or "downloadstring" in cmd_lower:
                is_suspicious = True
                
        if is_suspicious:
            create_alert(
                rule=r_proc,
                title=f"Suspicious Process '{event.process_name}' Spawned",
                description=f"Process execution policy violation: '{event.process_name}' executed on host '{hostname}' with command line: '{event.command_line or 'N/A'}'.",
                severity=r_proc.severity,
                confidence=80
            )

    # ==========================================
    # RULE 5: Excessive Authentication Failures (T1110)
    # ==========================================
    r_ex_fail = rules.get("Excessive Auth Failures")
    if r_ex_fail and event.event_type == "failed_login":
        time_limit = event.timestamp - timedelta(seconds=r_ex_fail.time_window)
        # Total failures on this host across any user/source IP
        total_failed = db.query(Event).filter(
            Event.host_id == event.host_id,
            Event.event_type == "failed_login",
            Event.timestamp >= time_limit
        ).count()

        if total_failed >= r_ex_fail.threshold:
            create_alert(
                rule=r_ex_fail,
                title="Excessive Authentication Failures",
                description=f"Host '{hostname}' experienced an abnormal volume of authentication failures ({total_failed}) within {r_ex_fail.time_window // 60} minutes.",
                severity=r_ex_fail.severity,
                confidence=70
            )
