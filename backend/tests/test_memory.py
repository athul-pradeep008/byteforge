import pytest
from backend.agents.memory import MemoryAgent, IncidentSignature

@pytest.fixture
def temp_memory_file(tmp_path):
    path = str(tmp_path / "test_memory.json")
    agent = MemoryAgent(memory_file_path=path)
    sig = IncidentSignature(
        incident_id="inc-hist-001",
        pattern_name="4-Stage APT Phishing & Exfiltration",
        stages=[
            "phishing_credential_theft",
            "lateral_movement",
            "privilege_escalation",
            "data_exfiltration",
        ],
        event_types=["auth", "dns", "file_access", "network_flow"],
        sample_queries=["login.secure-update-verify.com"],
        learned_pattern="Initial Phish -> RDP/SMB Lateral Move -> Off-Hours Admin Change -> DB Exfil",
    )
    agent.add_signature(sig)
    return path

def test_memory_add_and_load(temp_memory_file):
    agent = MemoryAgent(memory_file_path=temp_memory_file)
    sigs = agent.load_signatures()
    assert "inc-hist-001" in sigs
    assert sigs["inc-hist-001"]["pattern_name"] == "4-Stage APT Phishing & Exfiltration"

def test_stage_1_variant_match(temp_memory_file):
    agent = MemoryAgent(memory_file_path=temp_memory_file)
    
    # Simulate Stage 1 variant anomaly ONLY (phishing credential theft)
    stage1_variant_anomaly = [
        {
            "event_id": "evt-variant-s1-001",
            "timestamp": "2026-10-01T12:00:00",
            "source": "laptop-2",
            "event_type": "dns",
            "user": "charlie",
            "stage": "phishing_credential_theft",
            "stage_order": 1,
            "is_attack": True,
        }
    ]

    matches = agent.match_incident(stage1_variant_anomaly)
    assert len(matches) > 0
    match = matches[0]
    
    assert match["past_incident_id"] == "inc-hist-001"
    assert "KNOWN PATTERN (" in match["match_label"]
    assert match["matched_stage_1"] == True
    assert match["similarity_score"] >= 0.85
