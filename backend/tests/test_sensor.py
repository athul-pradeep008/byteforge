import pytest
import pandas as pd
from backend.simulator.attack_simulator import AttackSimulator
from backend.agents.sensor import SensorAgent

def test_sensor_training_and_false_positive_rate():
    sim = AttackSimulator(seed=42)
    df_normal = sim.generate_normal_events(count=2000)

    sensor = SensorAgent(contamination=0.01, random_state=42)
    sensor.train(df_normal)
    assert sensor.is_trained == True

    df_anomalies = sensor.detect_anomalies(df_normal)
    fp_count = len(df_anomalies)
    fp_rate = fp_count / len(df_normal)

    # Enforce false positive rate under 3% (< 0.03)
    assert fp_rate < 0.03, f"False positive rate {fp_rate:.2%} exceeded 3.0% threshold"

def test_sensor_detects_all_4_attack_stages():
    sim = AttackSimulator(seed=42)
    df_normal = sim.generate_normal_events(count=2000)
    df_attack = sim.generate_attack()

    sensor = SensorAgent(contamination=0.01, random_state=42)
    sensor.train(df_normal)

    df_anomalies = sensor.detect_anomalies(df_attack)

    # Check that attack events are detected
    assert len(df_anomalies) > 0, "Sensor failed to detect attack anomalies"

    # Verify all 4 attack stages are detected by the sensor
    detected_stages = set(df_anomalies["stage"].dropna().unique())
    expected_stages = {
        "phishing_credential_theft",
        "lateral_movement",
        "privilege_escalation",
        "data_exfiltration",
    }

    assert expected_stages.issubset(detected_stages), (
        f"Missing attack stage detection. Expected {expected_stages}, got {detected_stages}"
    )

def test_sensor_anomaly_reasons_and_scores():
    sim = AttackSimulator(seed=42)
    df_normal = sim.generate_normal_events(count=2000)
    df_attack = sim.generate_attack()

    sensor = SensorAgent(random_state=42)
    sensor.train(df_normal)

    df_anomalies = sensor.detect_anomalies(df_attack)

    for _, row in df_anomalies.iterrows():
        assert "anomaly_score" in row
        assert row["anomaly_score"] > 0.0
        assert "reason" in row
        assert isinstance(row["reason"], str)
        assert len(row["reason"]) > 0
        assert "detectors" in row
        assert len(row["detectors"]) > 0
