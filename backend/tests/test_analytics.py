def test_analytics_summary(client, officer_auth, citizen_auth):
    # Submit complaint
    client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "Analytics verification test complaint",
        "description": "Checking that analytics metrics are derived from real database rows.",
        "category_id": 1
    })

    res = client.get("/api/v1/analytics/summary", headers=officer_auth)
    assert res.status_code == 200
    data = res.get_json()["data"]
    assert data["total_complaints"] >= 1
    assert "priority_breakdown" in data
    assert "resolution_rate_percent" in data

def test_analytics_csv_export(client, officer_auth, citizen_auth):
    client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "CSV export verification complaint",
        "description": "Ensuring CSV generation with escaped formula characters.",
        "category_id": 1
    })
    res = client.get("/api/v1/analytics/export-csv", headers=officer_auth)
    assert res.status_code == 200
    assert res.mimetype == "text/csv"
    assert b"Reference Number" in res.data
