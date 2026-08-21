from datetime import datetime, timezone
from app.models.user import User

def test_threat_intel_ip_correlation(client, session):
    # Register analyst to manage IOCs and view alerts
    client.post(
        "/api/auth/register",
        json={
            "username": "threat_analyst",
            "email": "threat@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role
    db_user = session.query(User).filter(User.username == "threat_analyst").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "threat_analyst", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]

    # 1. Create an IP IOC
    ioc_resp = client.post(
        "/api/iocs/",
        json={
            "type": "IP",
            "value": "185.220.101.5",
            "description": "Known TOR Exit node used for scanning",
            "severity": "CRITICAL"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert ioc_resp.status_code == 201
    ioc_id = ioc_resp.json()["id"]

    # 2. Ingest an event containing the blacklisted IP
    ingest_resp = client.post(
        "/api/events/",
        json={
            "hostname": "win-dc-01",
            "ip_address": "192.168.1.10",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "network_connection",
            "source_ip": "185.220.101.5",
            "destination_port": 445
        }
    )
    assert ingest_resp.status_code == 201

    # 3. Verify a critical alert was generated and linked
    alerts_resp = client.get(
        "/api/alerts/",
        headers={"Authorization": f"Bearer {token}"}
    )
    alerts = alerts_resp.json()
    assert len(alerts) == 1
    assert "Threat Intel Match" in alerts[0]["title"]
    assert alerts[0]["severity"] == "CRITICAL"
    assert alerts[0]["confidence"] == 100
    assert alerts[0]["ioc_id"] == ioc_id

def test_threat_intel_hash_correlation(client, session):
    client.post(
        "/api/auth/register",
        json={
            "username": "threat_analyst2",
            "email": "threat2@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role
    db_user = session.query(User).filter(User.username == "threat_analyst2").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "threat_analyst2", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]

    # 1. Create a HASH IOC
    bad_hash = "8504cf006a864d4b123456789abcdef0"
    client.post(
        "/api/iocs/",
        json={
            "type": "HASH",
            "value": bad_hash,
            "description": "Known malicious webshell payload",
            "severity": "CRITICAL"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    # 2. Ingest event with the bad hash inside event_data
    client.post(
        "/api/events/",
        json={
            "hostname": "linux-web-01",
            "ip_address": "192.168.1.20",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "process_creation",
            "process_name": "php-fpm",
            "event_data": {
                "hash": bad_hash,
                "file_path": "/var/www/html/shell.php"
            }
        }
    )

    # 3. Verify alert was triggered
    alerts_resp = client.get(
        "/api/alerts/",
        headers={"Authorization": f"Bearer {token}"}
    )
    alerts = alerts_resp.json()
    assert len(alerts) == 1
    assert "Threat Intel Match" in alerts[0]["title"]
    assert alerts[0]["severity"] == "CRITICAL"

def test_incident_lifecycle_and_escalation(client, session):
    # Register analyst
    client.post(
        "/api/auth/register",
        json={
            "username": "incident_analyst",
            "email": "inc@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role
    db_user = session.query(User).filter(User.username == "incident_analyst").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "incident_analyst", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]

    # 1. Generate an alert (Suspicious process)
    client.post(
        "/api/events/",
        json={
            "hostname": "win-dc-01",
            "ip_address": "192.168.1.10",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "process_creation",
            "process_name": "mimikatz.exe"
        }
    )

    # Verify alert exists
    alerts = client.get("/api/alerts/", headers={"Authorization": f"Bearer {token}"}).json()
    alert_id = alerts[0]["id"]
    
    # 2. Escalate Alert into an Incident
    incident_resp = client.post(
        "/api/incidents/",
        json={
            "title": "Active Directory Compromise Investigation",
            "description": "Triggered by mimikatz execution on domain controller.",
            "severity": "HIGH",
            "alert_ids": [alert_id]
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert incident_resp.status_code == 201
    incident = incident_resp.json()
    incident_id = incident["id"]
    assert incident["status"] == "Open"
    assert alert_id in incident["alert_ids"]

    # Verify Alert is now linked to Incident
    alert_detail = client.get(f"/api/alerts/{alert_id}", headers={"Authorization": f"Bearer {token}"}).json()
    assert alert_detail["incident_id"] == incident_id

    # 3. Transition Incident Status
    patch_resp = client.patch(
        f"/api/incidents/{incident_id}",
        json={"status": "Investigating"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Investigating"

    # Transition to Resolved
    resolved_resp = client.patch(
        f"/api/incidents/{incident_id}",
        json={"status": "Resolved"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert resolved_resp.status_code == 200
    incident_data = resolved_resp.json()
    assert incident_data["status"] == "Resolved"
    assert incident_data["resolved_at"] is not None
