from datetime import datetime, timezone
from app.models.user import User

def test_event_ingestion_registers_new_host(client, session):
    event_payload = {
        "hostname": "win-dc-01",
        "ip_address": "192.168.1.10",
        "operating_system": "Windows Server 2022",
        "agent_version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": "failed_login",
        "username": "Administrator",
        "source_ip": "10.0.0.5",
        "severity": "HIGH",
        "event_data": {"auth_method": "NLA"}
    }
    
    # Ingest event (Public ingestion endpoint)
    response = client.post("/api/events/", json=event_payload)
    assert response.status_code == 201
    event_data = response.json()
    assert event_data["event_type"] == "failed_login"
    assert event_data["severity"] == "HIGH"
    assert event_data["username"] == "Administrator"
    assert event_data["host_id"] is not None
    
    # Verify host was registered
    host_id = event_data["host_id"]
    # We need a JWT token to get hosts
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_user",
            "email": "analyst@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role
    db_user = session.query(User).filter(User.username == "analyst_user").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_user", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]
    
    host_resp = client.get(
        f"/api/hosts/{host_id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert host_resp.status_code == 200
    host_info = host_resp.json()
    assert host_info["hostname"] == "win-dc-01"
    assert host_info["ip_address"] == "192.168.1.10"
    assert host_info["status"] == "online"

def test_event_ingestion_existing_host(client, session):
    # Register analyst user for validation
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_user",
            "email": "analyst@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role
    db_user = session.query(User).filter(User.username == "analyst_user").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_user", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]

    # First event (creates host)
    client.post(
        "/api/events/",
        json={
            "hostname": "linux-web-01",
            "ip_address": "192.168.1.20",
            "operating_system": "Ubuntu 22.04",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "process_creation",
            "process_name": "nginx"
        }
    )

    # Second event (links to same host)
    response = client.post(
        "/api/events/",
        json={
            "hostname": "linux-web-01",
            "ip_address": "192.168.1.20",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "process_creation",
            "process_name": "sudo"
        }
    )
    assert response.status_code == 201
    event_data = response.json()
    
    # Query events
    events_resp = client.get(
        "/api/events/",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert events_resp.status_code == 200
    events = events_resp.json()
    assert len(events) == 2
    # Ensure they are linked to the same host ID
    assert events[0]["host_id"] == events[1]["host_id"]

def test_host_isolation_rbac(client, session):
    # Create the host
    client.post(
        "/api/events/",
        json={
            "hostname": "win-dc-01",
            "ip_address": "192.168.1.10",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "failed_login"
        }
    )
    
    # 1. Register viewer (Read-only)
    client.post(
        "/api/auth/register",
        json={
            "username": "viewer_user",
            "email": "viewer@cybershield.com",
            "password": "securepassword123"
        }
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "viewer_user", "password": "securepassword123"}
    )
    viewer_token = login_resp.json()["access_token"]
    
    # Attempt isolation as viewer (Should fail with 403)
    isolate_resp = client.patch(
        "/api/hosts/1",
        json={"status": "isolated"},
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert isolate_resp.status_code == 403
    
    # 2. Register analyst (Authorized)
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_user",
            "email": "analyst@cybershield.com",
            "password": "securepassword12345"
        }
    )
    # Elevate role
    db_user = session.query(User).filter(User.username == "analyst_user").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_user", "password": "securepassword12345"}
    )
    analyst_token = login_resp.json()["access_token"]
    
    # Attempt isolation as analyst (Should succeed with 200)
    isolate_resp = client.patch(
        "/api/hosts/1",
        json={"status": "isolated"},
        headers={"Authorization": f"Bearer {analyst_token}"}
    )
    assert isolate_resp.status_code == 200
    assert isolate_resp.json()["status"] == "isolated"
