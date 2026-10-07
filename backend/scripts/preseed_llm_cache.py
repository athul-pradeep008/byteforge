import os
import sys
import json
import hashlib

# Ensure project root directory is included in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

CACHE_DIR = "backend/data/cache"

def preseed_cache():
    os.makedirs(CACHE_DIR, exist_ok=True)
    
    # 1. Standard 4-Stage Attack Chain Cache Response
    chain_001 = {
        "incident_id": "inc-001",
        "chain": [
            {
                "tactic": "Initial Access",
                "technique_id": "T1566",
                "confidence": 0.92,
                "timestamp": "2026-10-06T10:00:00.000000",
                "explanation": "Phishing credential theft via malicious login domain resolution and web form entry (MITRE ATT&CK T1566)."
            },
            {
                "tactic": "Lateral Movement",
                "technique_id": "T1021",
                "confidence": 0.95,
                "timestamp": "2026-10-06T10:05:00.000000",
                "explanation": "SMB port 445 scanning and unauthorized RDP remote session establishment to pivot host (MITRE ATT&CK T1021)."
            },
            {
                "tactic": "Privilege Escalation",
                "technique_id": "T1068",
                "confidence": 0.94,
                "timestamp": "2026-10-06T10:10:00.000000",
                "explanation": "Off-hours Domain Admin group member addition and unauthorized SAM/NTDS database dump (MITRE ATT&CK T1068)."
            },
            {
                "tactic": "Exfiltration",
                "technique_id": "T1041",
                "confidence": 0.98,
                "timestamp": "2026-10-06T10:15:00.000000",
                "explanation": "Bulk database export and high-volume HTTPS outbound data exfiltration to external IP (MITRE ATT&CK T1041)."
            }
        ]
    }

    # Save fallback schema template for AttackChainResponse
    fallback_path = os.path.join(CACHE_DIR, "AttackChainResponse.json")
    with open(fallback_path, "w", encoding="utf-8") as f:
        json.dump(chain_001, f, indent=2)
    print(f"Pre-seeded LLM cache fallback template at '{fallback_path}'.")

    # Variant Attack Chain Cache Response
    chain_variant = {
        "incident_id": "inc-variant-001",
        "chain": [
            {
                "tactic": "Initial Access",
                "technique_id": "T1566",
                "confidence": 0.90,
                "timestamp": "2026-10-06T10:00:00.000000",
                "explanation": "Phishing credential theft via spoofed portal link (MITRE ATT&CK T1566)."
            },
            {
                "tactic": "Lateral Movement",
                "technique_id": "T1021",
                "confidence": 0.93,
                "timestamp": "2026-10-06T10:05:00.000000",
                "explanation": "RDP pivot across internal subnet (MITRE ATT&CK T1021)."
            }
        ]
    }
    variant_path = os.path.join(CACHE_DIR, "AttackChainResponse_variant.json")
    with open(variant_path, "w", encoding="utf-8") as f:
        json.dump(chain_variant, f, indent=2)
    print(f"Pre-seeded LLM cache variant template at '{variant_path}'.")

    print("LLM Cache directory successfully populated for offline Demo Mode.")

if __name__ == "__main__":
    preseed_cache()
