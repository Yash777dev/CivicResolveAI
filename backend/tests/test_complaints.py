def test_create_complaint(client, citizen_auth):
    res = client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "Severe water leakage in street",
        "description": "Drinking water main pipe has broken and is flooding the entire road.",
        "category_id": 1,
        "approx_location": "Main Road Sector 4",
        "immediate_danger": False,
        "is_essential_facility": False,
        "reported_duration_days": 2
    })
    assert res.status_code == 201
    data = res.get_json()["data"]
    assert data["reference_number"].startswith("CR-")
    assert data["status"] == "SUBMITTED"
    assert data["category_id"] == 1

def test_track_complaint_public(client, citizen_auth):
    # Create complaint
    create_res = client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "Trackable complaint title",
        "description": "Describing the issue for testing public tracking endpoint.",
        "category_id": 1,
        "contact_phone": "9876543210"
    })
    ref_num = create_res.get_json()["data"]["reference_number"]

    # Track with correct last 4 digits
    track_res = client.post(f"/api/v1/complaints/track/{ref_num}", json={"phone_last4": "3210"})
    assert track_res.status_code == 200
    assert track_res.get_json()["data"]["reference_number"] == ref_num

    # Track with wrong verification
    track_fail = client.post(f"/api/v1/complaints/track/{ref_num}", json={"phone_last4": "9999"})
    assert track_fail.status_code == 403
