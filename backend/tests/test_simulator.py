import pytest
import pandas as pd
from backend.simulator.attack_simulator import AttackSimulator, HOSTS

def test_simulator_initialization_and_hosts():
    sim = AttackSimulator(seed=42)
    assert sim.seed == 42
    df_normal = sim.generate_normal_events(count=2000)
    assert len(df_normal) == 2000
    
    # Verify all 6 hosts appear in the telemetry
    unique_sources = set(df_normal["source"].unique())
    for host in HOSTS:
        assert host in unique_sources

def test_generate_attack_stages_and_order():
    sim = AttackSimulator(seed=42)
    df_attack = sim.generate_attack()
    
    # Verify count of attack events
    assert len(df_attack) == 8
    assert all(df_attack["is_attack"] == True)
    
    # Verify 4 distinct stages
    expected_stages = [
        "phishing_credential_theft",
        "lateral_movement",
        "privilege_escalation",
        "data_exfiltration",
    ]
    unique_stages = df_attack["stage"].unique().tolist()
    assert unique_stages == expected_stages
    
    # Verify stage order is strictly non-decreasing
    stage_orders = df_attack["stage_order"].tolist()
    assert stage_orders == sorted(stage_orders)
    assert set(stage_orders) == {1, 2, 3, 4}

def test_generate_variant():
    sim = AttackSimulator(seed=42)
    df_variant = sim.generate_variant(
        victim_user="charlie",
        initial_host="laptop-2",
        pivot_host="app-server",
        attacker_ip="198.51.100.99",
        exfil_ip="198.51.100.200",
    )
    
    assert len(df_variant) == 8
    assert all(df_variant["is_attack"] == True)
    
    # Check variant user and IPs reflected in attack events
    assert "charlie" in df_variant["user"].values
    assert "laptop-2" in df_variant["source"].values
    
    # Stage order preserved
    expected_stages = [
        "phishing_credential_theft",
        "lateral_movement",
        "privilege_escalation",
        "data_exfiltration",
    ]
    assert df_variant["stage"].unique().tolist() == expected_stages

def test_reproducibility_seed_42():
    sim1 = AttackSimulator(seed=42)
    df1 = sim1.generate_full_dataset(normal_count=100)
    
    sim2 = AttackSimulator(seed=42)
    df2 = sim2.generate_full_dataset(normal_count=100)
    
    # Datasets with seed 42 must be identical
    pd.testing.assert_frame_equal(df1, df2)

def test_full_dataset_integration():
    sim = AttackSimulator(seed=42)
    df_full = sim.generate_full_dataset(normal_count=2000, include_attack=True)
    
    assert len(df_full) == 2008
    assert sum(df_full["is_attack"]) == 8
    assert sum(~df_full["is_attack"]) == 2000
    
    # Verify timestamps are sorted chronologically
    assert df_full["timestamp"].is_monotonic_increasing
