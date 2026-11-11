def test_empty_complaint_payload_fails(client, citizen_auth):
    res = client.post("/api/v1/complaints", headers=citizen_auth, json={})
    assert res.status_code == 400 or res.status_code == 422

def test_short_description_fails(client, citizen_auth):
    res = client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "Valid Title Here",
        "description": "Too short",
        "category_id": 1
    })
    assert res.status_code == 422

def test_invalid_category_fails(client, citizen_auth):
    res = client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "Valid Title Here",
        "description": "Valid complaint description with enough length for validation.",
        "category_id": 99999
    })
    assert res.status_code == 422
