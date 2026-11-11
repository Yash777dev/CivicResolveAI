def test_officer_assignment_and_override(client, citizen_auth, officer_auth):
    create_res = client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "Broken water valve causing leak",
        "description": "Valve broken and leaking water into storm gutter continuously.",
        "category_id": 1
    })
    c_id = create_res.get_json()["data"]["id"]

    # Assign case
    assign_res = client.post(f"/api/v1/complaints/{c_id}/assign", headers=officer_auth, json={
        "officer_id": 2, # officer.test id
        "reason": "Direct triage assignment"
    })
    assert assign_res.status_code == 200
    assert assign_res.get_json()["data"]["assigned_officer_id"] == 2

    # Override priority with mandatory reason
    override_res = client.post(f"/api/v1/complaints/{c_id}/override-priority", headers=officer_auth, json={
        "new_level": "HIGH",
        "new_score": 85,
        "reason": "On-site inspection confirmed valve supplies dialyzer unit nearby."
    })
    assert override_res.status_code == 200
    assert override_res.get_json()["data"]["new_level"] == "HIGH"
    assert override_res.get_json()["data"]["new_score"] == 85
