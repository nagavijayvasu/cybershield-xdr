import os
from datetime import datetime, timezone
from app.models.user import User
from app.models.detection_rule import DetectionRule
from app.database_seeder import seed_initial_admin
from app.security.password import verify_password
from app.database import get_db

def test_admin_seeding_idempotent(session):
    # Set env variables
    os.environ["ADMIN_USERNAME"] = "seeder_admin"
    os.environ["ADMIN_EMAIL"] = "seeder@cybershield.com"
    os.environ["ADMIN_PASSWORD"] = "supersecureadminpass1"
    
    # Run seeder
    seed_initial_admin(session)
    
    # Verify user exists as admin
    user = session.query(User).filter(User.username == "seeder_admin").first()
    assert user is not None
    assert user.role == "admin"
    assert verify_password("supersecureadminpass1", user.password_hash)
    
    # Run again to verify idempotency
    seed_initial_admin(session)
    count = session.query(User).filter(User.username == "seeder_admin").count()
    assert count == 1
    
    # Clean up environment variables
    del os.environ["ADMIN_USERNAME"]
    del os.environ["ADMIN_EMAIL"]
    del os.environ["ADMIN_PASSWORD"]

def test_registration_ignores_role(client):
    # Try registering with role="admin"
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "username": "hacker_user",
            "email": "hacker@evil.com",
            "password": "strongpassword123",
            "role": "admin"  # Client trying to promote itself
        }
    )
    assert reg_resp.status_code == 422

def test_viewer_access_denied_on_admin_routes(client):
    # Register and log in as a viewer
    client.post(
        "/api/auth/register",
        json={
            "username": "viewer_bob",
            "email": "bob@viewer.com",
            "password": "viewerpassword123"
        }
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"username": "viewer_bob", "password": "viewerpassword123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Try listing users (admin-only)
    users_resp = client.get("/api/users/", headers=headers)
    assert users_resp.status_code == 403

    # 2. Try fetching audit logs (admin-only)
    audit_resp = client.get("/api/audit-logs/", headers=headers)
    assert audit_resp.status_code == 403

    # 3. Try creating a rule (admin-only)
    rule_resp = client.post(
        "/api/rules/",
        json={
            "name": "Evasion Rule",
            "description": "Fires on evasion attempts",
            "event_type": "process_creation",
            "threshold": 1,
            "time_window": 0,
            "severity": "CRITICAL"
        },
        headers=headers
    )
    assert rule_resp.status_code == 403

    # 4. Try isolating a host (analyst/admin only)
    host_patch_resp = client.patch(
        "/api/hosts/1",
        json={"status": "isolated"},
        headers=headers
    )
    assert host_patch_resp.status_code == 403

def test_analyst_access_denied_on_admin_routes(client, session):
    # 1. Seed admin
    os.environ["ADMIN_USERNAME"] = "test_admin"
    os.environ["ADMIN_EMAIL"] = "admin@test.com"
    os.environ["ADMIN_PASSWORD"] = "adminpassword123"
    seed_initial_admin(session)
    
    # Login admin to get token
    admin_login = client.post(
        "/api/auth/login",
        json={"username": "test_admin", "password": "adminpassword123"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Register normal user
    client.post(
        "/api/auth/register",
        json={
            "username": "analyst_alice",
            "email": "alice@analyst.com",
            "password": "analystpassword123"
        }
    )
    
    # Admin elevates normal user to analyst
    users_list = client.get("/api/users/", headers=admin_headers).json()
    alice_user = next(u for u in users_list if u["username"] == "analyst_alice")
    elevate_resp = client.patch(
        f"/api/users/{alice_user['id']}/role",
        json={"role": "analyst"},
        headers=admin_headers
    )
    assert elevate_resp.status_code == 200
    assert elevate_resp.json()["role"] == "analyst"

    # Login Analyst to get token
    analyst_login = client.post(
        "/api/auth/login",
        json={"username": "analyst_alice", "password": "analystpassword123"}
    )
    analyst_token = analyst_login.json()["access_token"]
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # 1. Try listing users (admin-only)
    users_resp = client.get("/api/users/", headers=analyst_headers)
    assert users_resp.status_code == 403

    # 2. Try fetching audit logs (admin-only)
    audit_resp = client.get("/api/audit-logs/", headers=analyst_headers)
    assert audit_resp.status_code == 403

    # 3. Try creating a rule (admin-only)
    rule_resp = client.post(
        "/api/rules/",
        json={
            "name": "Evasion Rule",
            "description": "Fires on evasion attempts",
            "event_type": "process_creation"
        },
        headers=analyst_headers
    )
    assert rule_resp.status_code == 403

    # 4. Analyst CAN isolate host (allowed role)
    # Register a dummy host first to make sure ID 1 exists
    client.post(
        "/api/events/",
        json={
            "hostname": "win-dc-01",
            "ip_address": "192.168.1.10",
            "timestamp": "2026-08-21T10:00:00Z",
            "event_type": "failed_login"
        }
    )
    host_patch_resp = client.patch(
        "/api/hosts/1",
        json={"status": "isolated"},
        headers=analyst_headers
    )
    assert host_patch_resp.status_code == 200
    assert host_patch_resp.json()["status"] == "isolated"

def test_admin_cannot_change_own_role(client, session):
    # Seed admin first
    os.environ["ADMIN_USERNAME"] = "test_admin"
    os.environ["ADMIN_EMAIL"] = "admin@test.com"
    os.environ["ADMIN_PASSWORD"] = "adminpassword123"
    seed_initial_admin(session)

    # Login admin
    admin_login = client.post(
        "/api/auth/login",
        json={"username": "test_admin", "password": "adminpassword123"}
    )
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Fetch admin ID
    me_resp = client.get("/api/auth/me", headers=admin_headers)
    admin_id = me_resp.json()["id"]

    # Try changing own role to viewer (should be blocked)
    role_change = client.patch(
        f"/api/users/{admin_id}/role",
        json={"role": "viewer"},
        headers=admin_headers
    )
    assert role_change.status_code == 400
    assert "cannot modify their own security role" in role_change.json()["detail"]

    # Try deactivating self (should be blocked)
    status_change = client.patch(
        f"/api/users/{admin_id}/status",
        json={"is_active": False},
        headers=admin_headers
    )
    assert status_change.status_code == 400
    assert "cannot toggle their own account activation status" in status_change.json()["detail"]
