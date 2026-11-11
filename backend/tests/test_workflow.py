def test_workflow_transitions(client, citizen_auth, officer_auth):
    # Citizen creates case
    create_res = client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "Road pothole near intersection",
        "description": "Deep crater on roadway causing vehicles to swerve into oncoming traffic.",
        "category_id": 1
    })
    c_id = create_res.get_json()["data"]["id"]

    # Attempt illegal transition SUBMITTED -> RESOLVED (must fail)
    bad_res = client.post(f"/api/v1/complaints/{c_id}/status", headers=officer_auth, json={
        "status": "RESOLVED",
        "resolution_summary": "Attempting illegal direct resolution"
    })
    assert bad_res.status_code == 422

    # Legal transition SUBMITTED -> ASSIGNED
    assign_res = client.post(f"/api/v1/complaints/{c_id}/status", headers=officer_auth, json={
        "status": "ASSIGNED",
        "public_note": "Assigned to ward inspection officer."
    })
    assert assign_res.status_code == 200
    assert assign_res.get_json()["data"]["status"] == "ASSIGNED"

    # Transition ASSIGNED -> IN_PROGRESS
    prog_res = client.post(f"/api/v1/complaints/{c_id}/status", headers=officer_auth, json={
        "status": "IN_PROGRESS",
        "public_note": "Work crew currently patching road surface."
    })
    assert prog_res.status_code == 200

    # Resolution without summary (must fail)
    no_summary_res = client.post(f"/api/v1/complaints/{c_id}/status", headers=officer_auth, json={
        "status": "RESOLVED",
        "resolution_summary": "Too short"
    })
    assert no_summary_res.status_code == 422

    # Resolution with valid summary
    resolve_res = client.post(f"/api/v1/complaints/{c_id}/status", headers=officer_auth, json={
        "status": "RESOLVED",
        "resolution_summary": "Pothole filled with asphalt cold mix and compacted. Roadway opened."
    })
    assert resolve_res.status_code == 200
    assert resolve_res.get_json()["data"]["status"] == "RESOLVED"
