from datetime import datetime, timezone
from app.models.user import User

def test_dashboard_analytics(client, session):
    # Register and log in analyst
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_dash",
            "email": "dash@cybershield.com",
            "password": "securepassword123"
        }
    )
    # Elevate role manually
    db_user = session.query(User).filter(User.username == "analyst_dash").first()
    db_user.role = "analyst"
    session.commit()

    login_resp = client.post(
        "/api/auth/login",
        json={"username": "analyst_dash", "password": "securepassword123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ingest an event (failed login)
    client.post(
        "/api/events/",
        json={
            "hostname": "win-dc-01",
            "ip_address": "192.168.1.10",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": "failed_login",
            "source_ip": "10.0.0.99"
        }
    )

    # 2. Ingest another event that triggers an alert (suspicious process)
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

    # Escalated alert to incident
    alerts = client.get("/api/alerts/", headers=headers).json()
    alert_id = alerts[0]["id"]
    
    client.post(
        "/api/incidents/",
        json={
            "title": "Malware Outbreak",
            "description": "Triggered by web shells",
            "severity": "HIGH",
            "alert_ids": [alert_id]
        },
        headers=headers
    )

    # 3. Query /api/dashboard/summary
    summary_resp = client.get("/api/dashboard/summary", headers=headers)
    assert summary_resp.status_code == 200
    summary = summary_resp.json()
    assert summary["total_events"] == 2
    assert summary["active_alerts"] == 1
    assert summary["open_incidents"] == 1
    assert summary["total_hosts"] == 1
    assert summary["online_hosts"] == 1

    # 4. Query /api/dashboard/events-over-time
    over_time_resp = client.get("/api/dashboard/events-over-time", headers=headers)
    assert over_time_resp.status_code == 200
    timeline = over_time_resp.json()
    assert len(timeline) >= 1
    assert timeline[0]["count"] == 2

    # 5. Query /api/dashboard/alerts-by-severity
    by_severity_resp = client.get("/api/dashboard/alerts-by-severity", headers=headers)
    assert by_severity_resp.status_code == 200
    severities = by_severity_resp.json()
    assert len(severities) == 1
    assert severities[0]["severity"] == "HIGH"
    assert severities[0]["count"] == 1

    # 6. Query /api/dashboard/top-source-ips
    top_ips_resp = client.get("/api/dashboard/top-source-ips", headers=headers)
    assert top_ips_resp.status_code == 200
    top_ips = top_ips_resp.json()
    assert len(top_ips) == 1
    assert top_ips[0]["source_ip"] == "10.0.0.99"
    assert top_ips[0]["count"] == 1  # only failed_login has source_ip

    # 7. Query /api/dashboard/top-attacked-hosts
    top_hosts_resp = client.get("/api/dashboard/top-attacked-hosts", headers=headers)
    assert top_hosts_resp.status_code == 200
    top_hosts = top_hosts_resp.json()
    assert len(top_hosts) == 1
    assert top_hosts[0]["hostname"] == "win-dc-01"
    assert top_hosts[0]["count"] == 1

    # 8. Query /api/dashboard/mitre-techniques
    mitre_resp = client.get("/api/dashboard/mitre-techniques", headers=headers)
    assert mitre_resp.status_code == 200
    mitre = mitre_resp.json()
    assert len(mitre) == 1
    assert mitre[0]["technique"] == "T1059"
    assert mitre[0]["tactic"] == "Execution"
    assert mitre[0]["count"] == 1
