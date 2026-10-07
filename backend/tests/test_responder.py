import os
import pytest
from backend.agents.responder import ResponderAgent

@pytest.fixture
def temp_audit_file(tmp_path):
    return str(tmp_path / "test_audit_log.jsonl")

def test_responder_low_impact_execution(temp_audit_file):
    responder = ResponderAgent(audit_log_path=temp_audit_file)
    low_impact_option = {
        "id": "resp-002",
        "action": "Block Remote IP",
        "target": "198.51.100.45",
        "business_impact": 0.05,
        "risk_level": "LOW",
        "score": 0.43,
        "rationale": "Low impact firewall block",
    }
    
    result = responder.execute_response(low_impact_option, incident_id="inc-test-01")
    assert result["status"] == "EXECUTED"
    assert result["requires_approval"] == False
    
    # Verify audit log entry written
    logs = responder.read_audit_log()
    assert len(logs) == 1
    assert logs[0]["incident_id"] == "inc-test-01"
    assert logs[0]["status"] == "EXECUTED"

def test_responder_high_impact_requires_approval(temp_audit_file):
    responder = ResponderAgent(audit_log_path=temp_audit_file)
    high_impact_option = {
        "id": "resp-004",
        "action": "Segment Network Subnet",
        "target": "192.168.1.0/24",
        "business_impact": 0.70,
        "risk_level": "HIGH",
        "score": 0.29,
        "rationale": "Quarantine entire subnet",
    }
    
    result = responder.execute_response(high_impact_option, incident_id="inc-test-02")
    assert result["status"] == "PENDING_APPROVAL"
    assert result["requires_approval"] == True
    
    logs = responder.read_audit_log()
    assert len(logs) == 1
    assert logs[0]["status"] == "PENDING_APPROVAL"

def test_responder_approved_execution(temp_audit_file):
    responder = ResponderAgent(audit_log_path=temp_audit_file)
    high_impact_option = {
        "id": "resp-004",
        "action": "Segment Network Subnet",
        "target": "192.168.1.0/24",
        "business_impact": 0.70,
        "risk_level": "HIGH",
        "score": 0.29,
        "rationale": "Quarantine entire subnet",
    }
    
    result = responder.execute_response(
        high_impact_option, incident_id="inc-test-03", approved_by="SOC_Analyst_1"
    )
    assert result["status"] == "EXECUTED"
    assert result["audit_entry"]["executed_by"] == "SOC_Analyst_1"
