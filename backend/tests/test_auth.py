def test_register_success(client):
    res = client.post("/api/v1/auth/register", json={
        "name": "New Citizen",
        "email": "new.citizen@example.com",
        "password": "SecretPassword123!",
        "preferred_language": "ta"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["status"] == "success"
    assert data["data"]["user"]["email"] == "new.citizen@example.com"
    assert "access_token" in data["data"]

def test_login_invalid_password(client):
    res = client.post("/api/v1/auth/login", json={
        "email": "citizen.test@example.com",
        "password": "WrongPassword"
    })
    assert res.status_code == 401

def test_get_me_authorized(client, citizen_auth):
    res = client.get("/api/v1/auth/me", headers=citizen_auth)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["user"]["email"] == "citizen.test@example.com"
    assert data["user"]["role"] == "citizen"

def test_get_me_unauthorized(client):
    res = client.get("/api/v1/auth/me")
    assert res.status_code == 401
