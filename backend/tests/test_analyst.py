import pytest
from datetime import datetime
from unittest.mock import MagicMock
from backend.agents.analyst import AnalystAgent, AttackChainResponse, MITRE_ATTACK_MAPPING
from backend.core.incident import AttackStep
from backend.core.llm_client import LLMClient

@pytest.fixture
def sample_anomalies():
    now = datetime.utcnow()
    return [
        {
            "event_id": "evt-atk-s1-001",
            "timestamp": now.isoformat(),
            "source": "laptop-1",
            "event_type": "dns",
            "user": "alice",
            "stage": "phishing_credential_theft",
            "stage_order": 1,
            "is_attack": True,
        },
        {
            "event_id": "evt-atk-s2-001",
            "timestamp": now.isoformat(),
            "source": "workstation-1",
            "event_type": "network_flow",
            "user": "alice",
            "stage": "lateral_movement",
            "stage_order": 2,
            "is_attack": True,
        },
        {
            "event_id": "evt-atk-s3-001",
            "timestamp": now.isoformat(),
            "source": "domain-controller",
            "event_type": "auth",
            "user": "sysadmin",
            "stage": "privilege_escalation",
            "stage_order": 3,
            "is_attack": True,
        },
        {
            "event_id": "evt-atk-s4-001",
            "timestamp": now.isoformat(),
            "source": "db-server",
            "event_type": "network_flow",
            "user": "alice",
            "stage": "data_exfiltration",
            "stage_order": 4,
            "is_attack": True,
        },
    ]

def test_rule_based_fallback_path(sample_anomalies):
    analyst = AnalystAgent()
    response = analyst.analyze_rule_based(sample_anomalies, incident_id="inc-test-01")

    assert isinstance(response, AttackChainResponse)
    assert response.incident_id == "inc-test-01"
    assert len(response.chain) == 4

    # Verify techniques T1566, T1021, T1068, T1041
    technique_ids = [step.technique_id for step in response.chain]
    assert technique_ids == ["T1566", "T1021", "T1068", "T1041"]

    # Verify confidence values and explanations
    for step in response.chain:
        assert 0.0 <= step.confidence <= 1.0
        assert isinstance(step.explanation, str)
        assert len(step.explanation) > 0

def test_llm_path_success(sample_anomalies):
    mock_llm = MagicMock(spec=LLMClient)
    expected_response = AttackChainResponse(
        incident_id="inc-llm-01",
        chain=[
            AttackStep(
                tactic="Initial Access",
                technique_id="T1566",
                confidence=0.95,
                timestamp=datetime.utcnow(),
                explanation="Phishing LLM analysis",
            )
        ]
    )
    mock_llm.query.return_value = expected_response

    analyst = AnalystAgent(llm_client=mock_llm)
    response = analyst.analyze(sample_anomalies, incident_id="inc-llm-01")

    assert isinstance(response, AttackChainResponse)
    assert response.incident_id == "inc-llm-01"
    assert len(response.chain) == 1
    assert response.chain[0].technique_id == "T1566"
    mock_llm.query.assert_called_once()

def test_llm_failure_triggers_fallback(sample_anomalies):
    mock_llm = MagicMock(spec=LLMClient)
    mock_llm.query.side_effect = RuntimeError("API key missing")

    analyst = AnalystAgent(llm_client=mock_llm)
    response = analyst.analyze(sample_anomalies, incident_id="inc-fallback-01")

    # Must seamlessly fall back to rule-based path returning all 4 steps
    assert isinstance(response, AttackChainResponse)
    assert len(response.chain) == 4
    technique_ids = [step.technique_id for step in response.chain]
    assert technique_ids == ["T1566", "T1021", "T1068", "T1041"]

def test_sse_chain_update_emission(sample_anomalies):
    events_emitted = []
    def sse_callback(event_type, data):
        events_emitted.append((event_type, data))

    analyst = AnalystAgent(sse_callback=sse_callback)
    response = analyst.analyze(sample_anomalies, force_fallback=True)

    assert len(events_emitted) == 1
    event_type, payload = events_emitted[0]
    assert event_type == "chain_update"
    assert "chain" in payload
    assert len(payload["chain"]) == 4
