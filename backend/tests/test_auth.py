def test_register_user_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testanalyst",
            "email": "analyst@cybershield.com",
            "password": "supersecurepassword123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testanalyst"
    assert data["email"] == "analyst@cybershield.com"
    assert data["role"] == "viewer"  # Default viewer!
    assert data["is_active"] is True
    assert "id" in data
    assert "password_hash" not in data

def test_register_user_duplicate_username(client):
    # Register first user
    client.post(
        "/api/auth/register",
        json={
            "username": "testanalyst",
            "email": "analyst@cybershield.com",
            "password": "supersecurepassword123"
        }
    )
    # Register second user with same username
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testanalyst",
            "email": "analyst2@cybershield.com",
            "password": "supersecurepassword12345"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already registered"

def test_register_user_rejects_extra_role(client):
    # Registration rejects client-provided roles with 422
    response = client.post(
        "/api/auth/register",
        json={
            "username": "testanalyst",
            "email": "analyst@cybershield.com",
            "password": "supersecurepassword123",
            "role": "superadmin"
        }
    )
    assert response.status_code == 422

def test_login_success(client):
    # Register first
    client.post(
        "/api/auth/register",
        json={
            "username": "testanalyst",
            "email": "analyst@cybershield.com",
            "password": "supersecurepassword123"
        }
    )
    # Attempt login
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testanalyst",
            "password": "supersecurepassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_incorrect_password(client):
    client.post(
        "/api/auth/register",
        json={
            "username": "testanalyst",
            "email": "analyst@cybershield.com",
            "password": "supersecurepassword123"
        }
    )
    response = client.post(
        "/api/auth/login",
        json={
            "username": "testanalyst",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password"

def test_get_me_success(client):
    # Register & Login
    client.post(
        "/api/auth/register",
        json={
            "username": "testanalyst",
            "email": "analyst@cybershield.com",
            "password": "supersecurepassword123"
        }
    )
    login_response = client.post(
        "/api/auth/login",
        json={
            "username": "testanalyst",
            "password": "supersecurepassword123"
        }
    )
    token = login_response.json()["access_token"]
    
    # Request profile
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testanalyst"
    assert data["role"] == "viewer"  # Default viewer!

def test_get_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
