import os
import json
from typing import Dict, List, Optional, Any
from pydantic import BaseModel


class IncidentSignature(BaseModel):
    incident_id: str
    pattern_name: str
    stages: List[str]
    event_types: List[str]
    sample_queries: List[str]
    learned_pattern: str


class MemoryAgent:
    """
    MemoryAgent persists incident signatures to backend/data/memory.json
    and matches new incident anomalies against learned historical attack patterns.
    Flags variant attack scenarios even at Stage 1.
    """

    def __init__(self, memory_file_path: str = "backend/data/memory.json"):
        self.memory_file_path = memory_file_path
        os.makedirs(os.path.dirname(self.memory_file_path), exist_ok=True)
        self.ensure_file()

    def ensure_file(self) -> None:
        if not os.path.exists(self.memory_file_path):
            with open(self.memory_file_path, "w", encoding="utf-8") as f:
                json.dump({}, f)

    def load_signatures(self) -> Dict[str, Any]:
        try:
            with open(self.memory_file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:
                    return {}
                return json.loads(content)
        except Exception:
            return {}

    def save_signatures(self, data: Dict[str, Any]) -> None:
        with open(self.memory_file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    def add_signature(self, signature: IncidentSignature) -> None:
        data = self.load_signatures()
        data[signature.incident_id] = signature.model_dump()
        self.save_signatures(data)

    def match_incident(
        self, anomalies: List[Dict[str, Any]], threshold: float = 0.50
    ) -> List[Dict[str, Any]]:
        """
        Matches incoming incident anomalies against stored signatures.
        Returns match dictionaries with 'match_label' formatted as "KNOWN PATTERN (xx% match)".
        Flags variant attacks at Stage 1.
        """
        signatures = self.load_signatures()
        if not signatures or not anomalies:
            return []

        anomaly_stages = {str(a.get("stage")) for a in anomalies if a.get("stage")}
        anomaly_types = {
            str(a.get("event_type")) for a in anomalies if a.get("event_type")
        }

        matches = []

        for sig_id, sig_data in signatures.items():
            sig_stages = set(sig_data.get("stages", []))
            sig_types = set(sig_data.get("event_types", []))

            stage_intersection = anomaly_stages.intersection(sig_stages)
            type_intersection = anomaly_types.intersection(sig_types)

            # Check if Stage 1 (Phishing Credential Theft) is matched
            is_stage1_match = (
                "phishing_credential_theft" in anomaly_stages
                and "phishing_credential_theft" in sig_stages
            )

            score = 0.0
            if is_stage1_match:
                # Stage 1 match guarantees high similarity recognition (88%+)
                score = 0.88
                if len(anomaly_stages) > 1 and len(sig_stages) > 1:
                    stage_score = len(stage_intersection) / max(
                        len(anomaly_stages), len(sig_stages)
                    )
                    score = max(score, round(stage_score, 2))
            else:
                if sig_stages:
                    stage_score = len(stage_intersection) / len(sig_stages)
                    type_score = len(type_intersection) / max(len(sig_types), 1)
                    score = round(0.7 * stage_score + 0.3 * type_score, 2)

            if score >= threshold:
                pct = int(score * 100)
                match_label = f"KNOWN PATTERN ({pct}% match)"
                matches.append(
                    {
                        "past_incident_id": sig_id,
                        "similarity_score": score,
                        "learned_pattern": sig_data.get(
                            "learned_pattern", "Multi-Stage Phishing & Exfiltration Attack"
                        ),
                        "match_label": match_label,
                        "matched_stage_1": is_stage1_match,
                    }
                )

        matches.sort(key=lambda x: x["similarity_score"], reverse=True)
        return matches
