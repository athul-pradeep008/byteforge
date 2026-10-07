import os
import sys

# Ensure project root directory is included in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.agents.memory import MemoryAgent, IncidentSignature

def preseed():
    agent = MemoryAgent()
    
    baseline_signature = IncidentSignature(
        incident_id="inc-hist-001",
        pattern_name="4-Stage APT Phishing & Database Exfiltration",
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
    
    agent.add_signature(baseline_signature)
    print("Memory database successfully pre-seeded with baseline APT signature 'inc-hist-001'.")

if __name__ == "__main__":
    preseed()
