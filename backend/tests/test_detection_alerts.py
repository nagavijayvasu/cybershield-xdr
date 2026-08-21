from datetime import datetime, timezone, timedelta
from app.models.alert import Alert
from app.models.user import User

def test_brute_force_detection_rule(client, session):
    # Ingest 4 failed logins (threshold is 5)
    for _ in range(4):
        response = client.post(
            "/api/events/",
            json={
                "hostname": "win-workstation",
                "ip_address": "192.168.1.15",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "failed_login",
                "source_ip": "10.0.0.99",
                "username": "admin"
            }
        )
        assert response.status_code == 201

    # Check that no alerts were generated yet
    # Register analyst user to check alerts
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_usr",
            "email": "analyst@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role manually via session
    db_user = session.query(User).filter(User.username == "analyst_usr").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_usr", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]
    
    alerts_resp = client.get(
        "/api/alerts/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert len(alerts_resp.json()) == 0

    # Ingest the 5th failed login
    client.post(
        "/api/events/",
        json={
            "hostname": "win-workstation",
            "ip_address": "192.168.1.15",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "failed_login",
            "source_ip": "10.0.0.99",
            "username": "admin"
        }
    )

    # Verify that a HIGH severity alert was generated
    alerts_resp = client.get(
        "/api/alerts/",
        headers={"Authorization": f"Bearer {token}"}
    )
    alerts = alerts_resp.json()
    assert len(alerts) == 1
    assert "Brute Force" in alerts[0]["title"]
    assert alerts[0]["severity"] == "HIGH"
    assert alerts[0]["mitre_technique"] == "T1110"
    assert alerts[0]["status"] == "NEW"

def test_suspicious_process_detection_rule(client, session):
    # Ingest a sensitive process creation event
    response = client.post(
        "/api/events/",
        json={
            "hostname": "win-workstation",
            "ip_address": "192.168.1.15",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "process_creation",
            "process_name": "mimikatz.exe",
            "command_line": "mimikatz.exe privilege::debugsekurlsa::logonpasswords exit"
        }
    )
    assert response.status_code == 201

    # Login and check alerts
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_usr",
            "email": "analyst@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role manually
    db_user = session.query(User).filter(User.username == "analyst_usr").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_usr", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]

    alerts_resp = client.get(
        "/api/alerts/",
        headers={"Authorization": f"Bearer {token}"}
    )
    alerts = alerts_resp.json()
    assert len(alerts) == 1
    assert "Suspicious Process" in alerts[0]["title"]
    assert alerts[0]["severity"] == "HIGH"
    assert alerts[0]["mitre_technique"] == "T1059"

def test_suspicious_login_detection_rule(client, session):
    # Ingest 3 failed logins (threshold is 3) followed by a successful login
    for _ in range(3):
        client.post(
            "/api/events/",
            json={
                "hostname": "linux-srv",
                "ip_address": "192.168.1.50",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "failed_login",
                "username": "sysadmin"
            }
        )
    
    # Ingest successful login
    client.post(
        "/api/events/",
        json={
            "hostname": "linux-srv",
            "ip_address": "192.168.1.50",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "successful_login",
            "username": "sysadmin"
        }
    )

    # Login and check alerts
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_usr",
            "email": "analyst@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role manually
    db_user = session.query(User).filter(User.username == "analyst_usr").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_usr", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]

    alerts_resp = client.get(
        "/api/alerts/",
        headers={"Authorization": f"Bearer {token}"}
    )
    alerts = alerts_resp.json()
    assert len(alerts) == 1
    assert "Suspicious Login" in alerts[0]["title"]
    assert alerts[0]["severity"] == "HIGH"

def test_port_scan_detection_rule(client, session):
    # Ingest 10 connection events to distinct destination ports from same source IP
    for i in range(10):
        client.post(
            "/api/events/",
            json={
                "hostname": "linux-srv",
                "ip_address": "192.168.1.50",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "event_type": "network_connection",
                "source_ip": "10.0.0.22",
                "destination_port": 1000 + i
            }
        )
    
    # Check alert
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_usr",
            "email": "analyst@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role manually
    db_user = session.query(User).filter(User.username == "analyst_usr").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_usr", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]

    alerts_resp = client.get(
        "/api/alerts/",
        headers={"Authorization": f"Bearer {token}"}
    )
    alerts = alerts_resp.json()
    assert len(alerts) == 1
    assert "Port Scan" in alerts[0]["title"]
    assert alerts[0]["severity"] == "MEDIUM"
    assert alerts[0]["mitre_technique"] == "T1046"

def test_alert_patch_rbac(client, session):
    # Trigger an alert by executing a suspicious process
    client.post(
        "/api/events/",
        json={
            "hostname": "win-workstation",
            "ip_address": "192.168.1.15",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "process_creation",
            "process_name": "mimikatz.exe"
        }
    )

    # 1. Login as viewer
    client.post(
        "/api/auth/register",
        json={
            "username": "viewer_usr",
            "email": "viewer@cybershield.com",
            "password": "securepassword123"
        }
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "viewer_usr", "password": "securepassword123"}
    )
    viewer_token = login_resp.json()["access_token"]

    # Try patching alert as viewer (should fail with 403)
    patch_resp = client.patch(
        "/api/alerts/1",
        json={"status": "INVESTIGATING"},
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert patch_resp.status_code == 403

    # 2. Login as analyst
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_usr",
            "email": "analyst@cybershield.com",
            "password": "securepassword12345"
        }
    )
    # Elevate role manually
    db_user = session.query(User).filter(User.username == "analyst_usr").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_usr", "password": "securepassword12345"}
    )
    analyst_token = login_resp.json()["access_token"]

    # Patch alert as analyst (should succeed with 200)
    patch_resp = client.patch(
        "/api/alerts/1",
        json={"status": "INVESTIGATING"},
        headers={"Authorization": f"Bearer {analyst_token}"}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "INVESTIGATING"
