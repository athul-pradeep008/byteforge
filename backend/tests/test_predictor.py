import pytest
from backend.agents.predictor import PredictorAgent, HostPrediction

def test_probabilities_in_range():
    predictor = PredictorAgent(seed=42, n_runs=1000)
    predictions = predictor.predict(compromised_hosts=["laptop-1"])

    assert len(predictions) > 0
    for pred in predictions:
        assert isinstance(pred, HostPrediction)
        assert 0.0 <= pred.compromise_probability <= 1.0
        assert pred.est_minutes_to_compromise >= 0.0
        assert pred.blast_radius >= 0

def test_reproducibility_seed_42():
    predictor1 = PredictorAgent(seed=42, n_runs=1000)
    preds1 = predictor1.predict(compromised_hosts=["laptop-1"], seed=42)

    predictor2 = PredictorAgent(seed=42, n_runs=1000)
    preds2 = predictor2.predict(compromised_hosts=["laptop-1"], seed=42)

    assert len(preds1) == len(preds2)
    for p1, p2 in zip(preds1, preds2):
        assert p1.host == p2.host
        assert p1.compromise_probability == p2.compromise_probability
        assert p1.est_minutes_to_compromise == p2.est_minutes_to_compromise

def test_blocked_edge_lowers_downstream_risk():
    predictor = PredictorAgent(seed=42, n_runs=1000)
    
    # Baseline predictions when laptop-1 is compromised
    base_preds = {
        p.host: p.compromise_probability
        for p in predictor.predict(compromised_hosts=["laptop-1"], seed=42)
    }
    
    # Mitigate by blocking edge from laptop-1 to workstation-1
    response = {
        "action": "block_edge",
        "src": "laptop-1",
        "dst": "workstation-1",
    }
    after_preds = {
        p.host: p.compromise_probability
        for p in predictor.predict_after(response, compromised_hosts=["laptop-1"], seed=42)
    }

    # workstation-1 and domain-controller risks must decrease post-mitigation
    assert after_preds["workstation-1"] < base_preds["workstation-1"]
    assert after_preds["domain-controller"] < base_preds["domain-controller"]

def test_host_isolation_zeroes_risk():
    predictor = PredictorAgent(seed=42, n_runs=1000)
    
    response = {
        "action": "isolate_host",
        "target": "workstation-1",
    }
    after_preds = {
        p.host: p.compromise_probability
        for p in predictor.predict_after(response, compromised_hosts=["laptop-1"], seed=42)
    }

    # Isolated workstation-1 risk should be 0.0
    assert after_preds["workstation-1"] == 0.0
