import pytest
from fastapi.testclient import TestClient
from backend.api.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "environment": "SIMULATED"}

def test_reset_endpoint():
    response = client.post("/api/reset")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "reset"

def test_simulate_normal_endpoint():
    response = client.post("/api/simulate/normal")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "started"
    assert data["mode"] == "normal"

def test_simulate_attack_endpoint():
    response = client.post("/api/simulate/attack")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "started"
    assert data["mode"] == "attack"

def test_simulate_variant_endpoint():
    response = client.post("/api/simulate/variant")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "started"
    assert data["mode"] == "variant"

def test_sse_stream_endpoint():
    with client.stream("GET", "/api/stream") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers.get("content-type", "")
        first_chunk = next(response.iter_lines())
        assert "event: ping" in first_chunk or "data:" in first_chunk or len(first_chunk) > 0

def test_get_incident_endpoint():
    response = client.get("/api/incident/inc-test-api-01")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "anomalies" in data
    assert "attack_chain" in data
    assert "predictions" in data

def test_approve_incident_endpoint():
    response = client.post("/api/incident/inc-test-api-01/approve?approved_by=Analyst_Bob")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["approved_by"] == "Analyst_Bob"
    assert data["response_result"]["status"] == "EXECUTED"

def test_reject_incident_endpoint():
    response = client.post("/api/incident/inc-test-api-02/reject?rejected_by=Analyst_Alice")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["rejected_by"] == "Analyst_Alice"

def test_get_audit_endpoint():
    response = client.get("/api/audit")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "audit_logs" in data
    assert isinstance(data["audit_logs"], list)

def test_get_incident_report_markdown():
    response = client.get("/api/incident/inc-test-api-01/report")
    assert response.status_code == 200
    assert "text/markdown" in response.headers.get("content-type", "")
    assert "# CyberImmune 2.0 - Incident Response Report" in response.text
