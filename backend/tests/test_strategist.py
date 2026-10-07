import pytest
from backend.agents.strategist import StrategistAgent, StrategistResponse, ResponseOptionDetail

def test_strategist_options_count_and_formula():
    agent = StrategistAgent()
    assert agent.scoring_formula == "score = 0.6 * risk_reduction - 0.4 * business_impact"
    
    resp = agent.evaluate_response_options(anomalies=[])
    assert isinstance(resp, StrategistResponse)
    assert len(resp.options) == 4
    assert resp.scoring_formula == agent.scoring_formula

def test_score_calculation():
    agent = StrategistAgent()
    resp = agent.evaluate_response_options(anomalies=[])
    
    for opt in resp.options:
        expected_score = round(0.6 * opt.risk_reduction - 0.4 * opt.business_impact, 4)
        assert opt.score == expected_score
        assert isinstance(opt.rationale, str)
        assert len(opt.rationale) > 0

def test_recommended_option_selection():
    agent = StrategistAgent()
    resp = agent.evaluate_response_options(anomalies=[])
    
    recommended = [o for o in resp.options if o.is_recommended]
    assert len(recommended) == 1
    assert recommended[0].id == resp.recommended_option_id
    
    # Assert recommended option has the highest score
    max_score = max(o.score for o in resp.options)
    assert recommended[0].score == max_score
