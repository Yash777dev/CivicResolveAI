import io

def test_evidence_upload_and_delete(client, citizen_auth):
    # Create complaint first
    create_res = client.post("/api/v1/complaints", headers=citizen_auth, json={
        "title": "Evidence attachment test",
        "description": "Testing multipart evidence upload and checksumming mechanism.",
        "category_id": 1
    })
    c_id = create_res.get_json()["data"]["id"]

    # Upload mock image
    file_content = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
    data = {
        "file": (io.BytesIO(file_content), "test_photo.png")
    }
    upload_res = client.post(f"/api/v1/complaints/{c_id}/evidence", headers=citizen_auth, data=data, content_type="multipart/form-data")
    assert upload_res.status_code == 201
    ev_data = upload_res.get_json()["data"]
    assert ev_data["original_filename"] == "test_photo.png"
    assert len(ev_data["checksum"]) == 64 # SHA-256

    ev_id = ev_data["id"]

    # Delete evidence
    del_res = client.delete(f"/api/v1/complaints/{c_id}/evidence/{ev_id}", headers=citizen_auth)
    assert del_res.status_code == 200
