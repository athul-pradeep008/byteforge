import os
import sys
import json

# Ensure project root directory is included in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.simulator.attack_simulator import AttackSimulator
from backend.agents.orchestrator import OrchestratorAgent
from backend.api.main import generate_markdown_report

def main():
    print("=" * 80)
    print("CYBERIMMUNE 2.0 - AUTONOMOUS MULTI-AGENT PIPELINE DEMO RUN")
    print("=" * 80)

    # 1. Initialize Simulator
    print("\n[STEP 1] Generating 4-Stage Attack Telemetry (Seed 42)...")
    sim = AttackSimulator(seed=42)
    df_full = sim.generate_full_dataset(normal_count=500, include_attack=True)
    print(f"    - Generated {len(df_full)} total events.")

    # 2. Instantiate Orchestrator Agent
    print("\n[STEP 2] Running Orchestrator Agent Pipeline...")
    orchestrator = OrchestratorAgent()
    result = orchestrator.run_pipeline(events_df=df_full, incident_id="inc-demo-001")

    # 3. Print Pipeline Results
    print("\n" + "=" * 80)
    print("1. SENSOR AGENT")
    print("=" * 80)
    print(f"Anomalies Flagged: {len(result.anomalies)}")
    for a in result.anomalies[:3]:
        print(f"  - [{a.get('event_id')}] Host: {a.get('source')} | Reason: {a.get('reason')}")

    print("\n" + "=" * 80)
    print("2. ANALYST AGENT (MITRE ATT&CK CHAIN)")
    print("=" * 80)
    for idx, step in enumerate(result.attack_chain, 1):
        print(f"  Stage {idx}: {step.get('tactic')} | Technique: {step.get('technique_id')} | Confidence: {float(step.get('confidence',0))*100:.0f}%")
        print(f"    Explanation: {step.get('explanation')}")

    print("\n" + "=" * 80)
    print("3. PREDICTOR AGENT (MONTE CARLO RISK FORECAST)")
    print("=" * 80)
    for pred in result.predictions:
        print(f"  Target: {pred.get('host'):<18} | Compromise Prob: {float(pred.get('compromise_probability',0))*100:>5.1f}% | Est Time: {pred.get('est_minutes_to_compromise'):>4.1f} min | Blast Radius: {pred.get('blast_radius')}")

    print("\n" + "=" * 80)
    print("4. STRATEGIST AGENT (RESPONSE EVALUATION & SCORING)")
    print("=" * 80)
    print("Formula: score = 0.6 * risk_reduction - 0.4 * business_impact")
    rec_id = result.recommended_option.get("id") if result.recommended_option else "N/A"
    for opt in result.strategist_options:
        is_rec = " [RECOMMENDED]" if opt.get("id") == rec_id else ""
        print(f"  - Action: {opt.get('action'):<24} | Target: {opt.get('target'):<15} | Score: {opt.get('score'):.4f}{is_rec}")

    print("\n" + "=" * 80)
    print("5. RESPONDER AGENT (HUMAN APPROVAL CHECK & AUDIT LOG)")
    print("=" * 80)
    resp = result.response_result or {}
    print(f"Execution Status: {resp.get('status')}")
    print(f"Message: {resp.get('message')}")
    print("Audit Log Entry appended to 'backend/data/audit_log.jsonl'.")

    print("\n" + "=" * 80)
    print("6. MEMORY AGENT (PATTERN MATCHING & RECOGNITION)")
    print("=" * 80)
    if result.memory_matches:
        for m in result.memory_matches:
            print(f"  Match Label: {m.get('match_label')} (Past ID: {m.get('past_incident_id')})")
            print(f"  Learned Pattern: {m.get('learned_pattern')}")
    else:
        print("  No prior pattern match found.")

    # 4. Print Markdown Report Excerpt
    print("\n" + "=" * 80)
    print("GENERATED MARKDOWN REPORT EXCERPT")
    print("=" * 80)
    report_md = generate_markdown_report(result.model_dump(mode="json"))
    print("\n".join(report_md.splitlines()[:25]))

    print("\n" + "=" * 80)
    print("FULL TERMINAL DEMO RUN COMPLETED SUCCESSFULLY")
    print("=" * 80)

if __name__ == "__main__":
    main()
