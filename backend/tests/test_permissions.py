from app.services.auth_service import AuthService
from app.extensions import db

def test_citizen_cannot_view_other_citizen_case(client, citizen_auth):
    # Register second citizen
    c2 = AuthService.register_user("Citizen Two", "c2@example.com", "Password123!", role="citizen")
    res2 = client.post("/api/v1/auth/login", json={"email": "c2@example.com", "password": "Password123!"})
    c2_token = res2.get_json()["data"]["access_token"]
    c2_auth = {"Authorization": f"Bearer {c2_token}"}

    # Citizen 2 creates complaint
    create_res = client.post("/api/v1/complaints", headers=c2_auth, json={
        "title": "Private grievance of Citizen Two",
        "description": "This complaint should only be visible to Citizen Two and officers.",
        "category_id": 1
    })
    c2_case_id = create_res.get_json()["data"]["id"]

    # Citizen 1 tries to access Citizen 2's case directly
    hack_res = client.get(f"/api/v1/complaints/{c2_case_id}", headers=citizen_auth)
    assert hack_res.status_code == 403

def test_citizen_cannot_access_admin_endpoints(client, citizen_auth):
    res = client.get("/api/v1/admin/users", headers=citizen_auth)
    assert res.status_code == 403
