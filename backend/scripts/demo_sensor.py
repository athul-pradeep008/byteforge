import os
import sys
import pandas as pd

# Ensure project root directory is included in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.simulator.attack_simulator import AttackSimulator
from backend.agents.sensor import SensorAgent

def main():
    print("=" * 80)
    print("CYBERIMMUNE 2.0 - SENSOR AGENT DEMO & ANOMALY DETECTION REPORT")
    print("=" * 80)

    # 1. Initialize Simulator with seed 42
    sim = AttackSimulator(seed=42)
    print("\n[1] Generating normal baseline telemetry (~2,000 events)...")
    df_normal = sim.generate_normal_events(count=2000)
    print(f"    - Normal events count: {len(df_normal)}")

    # 2. Train SensorAgent
    print("\n[2] Training SensorAgent (IsolationForest + 4 Security Rules)...")
    sensor = SensorAgent(contamination=0.01, random_state=42)
    sensor.train(df_normal)
    print("    - Training complete.")

    # 3. Generate combined dataset with attack events
    print("\n[3] Generating full dataset with 4-stage cyber attack scenario...")
    df_full = sim.generate_full_dataset(normal_count=2000, include_attack=True)
    print(f"    - Total events in dataset: {len(df_full)}")

    # 4. Run Detection
    print("\n[4] Running anomaly detection pipeline...")
    df_anomalies = sensor.detect_anomalies(df_full)
    print(f"    - Total anomalies flagged: {len(df_anomalies)}")

    # Calculate False Positive rate on normal subset
    df_normal_anomalies = sensor.detect_anomalies(df_normal)
    fp_rate = (len(df_normal_anomalies) / len(df_normal)) * 100
    print(f"    - Baseline False Positive Rate: {fp_rate:.2f}% (Threshold: <3.00%)")

    # 5. Display Detected Attack Anomalies
    print("\n" + "=" * 80)
    print("DETECTED ATTACK ANOMALIES BY STAGE")
    print("=" * 80)

    attack_anomalies = df_anomalies[df_anomalies["is_attack"] == True]

    for idx, row in attack_anomalies.iterrows():
        stage = row.get("stage", "Unknown").upper()
        stage_num = row.get("stage_order", 0)
        event_id = row.get("event_id", "N/A")
        host = row.get("source", "N/A")
        score = row.get("anomaly_score", 0.0)
        reason = row.get("reason", "N/A")
        detectors = ", ".join(row.get("detectors", []))

        print(f"\n[STAGE {stage_num}] {stage} | Event ID: {event_id} | Host: {host}")
        print(f"  Timestamp: {row.get('timestamp')}")
        print(f"  Anomaly Score: {score:.4f}")
        print(f"  Triggered Detectors: {detectors}")
        print(f"  Plain-Language Reason: {reason}")

    print("\n" + "=" * 80)
    print("DEMO COMPLETED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    main()
