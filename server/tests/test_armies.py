import uuid


def army_body(name: str = "The Iron Hills") -> dict:
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "faction": "Good",
        "schema_version": 1,
        "payload": {
            "name": name,
            "faction": "Good",
            "heroes": [
                {
                    "name": "Dain Ironfoot, Lord of the Iron Hills",
                    "points": 160,
                    "tier": "legend",
                    "selected": True,
                    "wargear": [{"name": "War boar", "cost": 25}],
                    "wargearChecks": {"War boar": False},
                    "warband": [],
                }
            ],
            "points": 160,
            "modelCount": 1,
        },
    }


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}


def test_full_crud_and_revision_timestamps(client):
    assert client.get("/api/v1/armies").json() == []

    body = army_body()
    created_response = client.post("/api/v1/armies", json=body)
    assert created_response.status_code == 201
    created = created_response.json()
    assert created["id"] == body["id"]
    assert created["revision"] == 1
    assert created["schema_version"] == 1
    assert created["created_at"]
    assert created["updated_at"]

    army_id = created["id"]
    assert client.get(f"/api/v1/armies/{army_id}").json() == created
    assert [item["id"] for item in client.get("/api/v1/armies").json()] == [army_id]

    updated_response = client.put(
        f"/api/v1/armies/{army_id}", json=army_body("Updated Iron Hills")
    )
    assert updated_response.status_code == 200
    updated = updated_response.json()
    assert updated["id"] == army_id
    assert updated["name"] == "Updated Iron Hills"
    assert updated["revision"] == 2
    assert updated["created_at"] == created["created_at"]
    assert updated["updated_at"] >= created["updated_at"]

    assert client.delete(f"/api/v1/armies/{army_id}").status_code == 204
    assert client.get(f"/api/v1/armies/{army_id}").status_code == 404


def test_missing_ids(client):
    missing = uuid.uuid4()
    assert client.get(f"/api/v1/armies/{missing}").status_code == 404
    assert client.put(f"/api/v1/armies/{missing}", json=army_body()).status_code == 404
    assert client.delete(f"/api/v1/armies/{missing}").status_code == 404


def test_duplicate_client_uuid_returns_conflict(client):
    body = army_body()
    assert client.post("/api/v1/armies", json=body).status_code == 201
    duplicate = client.post("/api/v1/armies", json=body)
    assert duplicate.status_code == 409
    assert duplicate.json() == {"detail": "Army with this ID already exists"}


def test_invalid_payloads_are_rejected(client):
    missing_heroes = army_body()
    del missing_heroes["payload"]["heroes"]
    assert client.post("/api/v1/armies", json=missing_heroes).status_code == 422

    bad_tier = army_body()
    bad_tier["payload"]["heroes"][0]["tier"] = "unknown"
    assert client.post("/api/v1/armies", json=bad_tier).status_code == 422

    mismatch = army_body()
    mismatch["payload"]["name"] = "Different"
    assert client.post("/api/v1/armies", json=mismatch).status_code == 422
