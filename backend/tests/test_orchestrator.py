import pytest
from backend.simulator.attack_simulator import AttackSimulator
from backend.agents.orchestrator import OrchestratorAgent, OrchestratorResult

def test_orchestrator_full_pipeline():
    sim = AttackSimulator(seed=42)
    df_full = sim.generate_full_dataset(normal_count=200, include_attack=True)

    orchestrator = OrchestratorAgent()
    result = orchestrator.run_pipeline(events_df=df_full, incident_id="inc-test-orch-01")

    assert isinstance(result, OrchestratorResult)
    assert result.incident_id == "inc-test-orch-01"
    assert len(result.anomalies) > 0
    assert len(result.attack_chain) == 4
    assert len(result.predictions) > 0
    assert len(result.strategist_options) == 4
    assert result.recommended_option is not None
    assert result.response_result is not None
    assert len(result.memory_matches) > 0
    assert len(result.agent_steps) == 6

def test_orchestrator_emits_agent_steps():
    steps_emitted = []
    def step_cb(event_type, payload):
        steps_emitted.append((event_type, payload))

    sim = AttackSimulator(seed=42)
    df_full = sim.generate_full_dataset(normal_count=200, include_attack=True)

    orchestrator = OrchestratorAgent(step_callback=step_cb)
    result = orchestrator.run_pipeline(events_df=df_full, incident_id="inc-test-orch-02")

    assert len(steps_emitted) == 6
    agent_names = [payload["agent_name"] for _, payload in steps_emitted]
    assert agent_names == [
        "SensorAgent",
        "AnalystAgent",
        "PredictorAgent",
        "StrategistAgent",
        "ResponderAgent",
        "MemoryAgent",
    ]
