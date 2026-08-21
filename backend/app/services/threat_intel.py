from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.models.event import Event
from app.models.ioc import Ioc
from app.models.alert import Alert

def create_threat_intel_alert(db: Session, event: Event, ioc: Ioc):
    """Generate a CRITICAL alert linking to the matched IOC indicator."""
    # Deduplication check
    threshold_time = datetime.now(timezone.utc) - timedelta(seconds=300)
    existing = db.query(Alert).filter(
        Alert.host_id == event.host_id,
        Alert.ioc_id == ioc.id,
        Alert.created_at >= threshold_time
    ).first()
    
    if existing:
        return

    title = f"Threat Intel Match: Blacklisted {ioc.type}"
    description = (
        f"Security telemetry matched a blacklisted threat indicator on this host. "
        f"Indicator type: {ioc.type}, Value: {ioc.value}. "
        f"Details: {ioc.description or 'No details provided'}."
    )
    
    new_alert = Alert(
        event_id=event.id,
        rule_id=None,  # Generated via Threat Intel, not static rule engine
        host_id=event.host_id,
        ioc_id=ioc.id,
        title=title,
        description=description,
        severity=ioc.severity,  # Use severity from the threat feed (default CRITICAL)
        source_ip=event.source_ip,
        status="NEW",
        confidence=100,  # 100% confidence match
        mitre_tactic="Initial Access" if ioc.type in ["DOMAIN", "URL"] else "Credential Access",
        mitre_technique="T1190" if ioc.type in ["DOMAIN", "URL"] else "T1110"
    )
    
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

def correlate_threat_intel(db: Session, event: Event):
    """Correlate the ingested event against the indicators list."""
    # 1. IP Correlation
    if event.source_ip:
        matched_ioc = db.query(Ioc).filter(Ioc.type == "IP", Ioc.value == event.source_ip).first()
        if matched_ioc:
            create_threat_intel_alert(db, event, matched_ioc)
            return

    if event.destination_ip:
        matched_ioc = db.query(Ioc).filter(Ioc.type == "IP", Ioc.value == event.destination_ip).first()
        if matched_ioc:
            create_threat_intel_alert(db, event, matched_ioc)
            return

    # 2. Domain & URL Correlation (scans nested keys in event_data)
    if event.event_data:
        # Search for typical keys like "domain", "url", "email"
        for key in ["domain", "url", "email", "hash", "sha256", "md5"]:
            val = event.event_data.get(key)
            if not val or not isinstance(val, str):
                continue
                
            ioc_type = None
            if key == "domain":
                ioc_type = "DOMAIN"
            elif key == "url":
                ioc_type = "URL"
            elif key == "email":
                ioc_type = "EMAIL"
            elif key in ["hash", "sha256", "md5"]:
                ioc_type = "HASH"
                
            if ioc_type:
                matched_ioc = db.query(Ioc).filter(Ioc.type == ioc_type, Ioc.value == val).first()
                if matched_ioc:
                    create_threat_intel_alert(db, event, matched_ioc)
                    return

    # 3. Hash / Process Command line correlation
    if event.command_line:
        # Look for hashes pasted in cmd parameters (simple regex/substring checks)
        # Query all Hash IOCs and check if they are in command_line
        hash_iocs = db.query(Ioc).filter(Ioc.type == "HASH").all()
        for ioc in hash_iocs:
            if ioc.value.lower() in event.command_line.lower():
                create_threat_intel_alert(db, event, ioc)
                return
