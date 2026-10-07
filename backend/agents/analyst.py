from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from pydantic import BaseModel, Field

from backend.core.incident import AttackStep
from backend.core.llm_client import LLMClient


class AttackChainResponse(BaseModel):
    incident_id: str
    chain: List[AttackStep] = Field(default_factory=list)


# Standard MITRE ATT&CK Mapping for CyberImmune 2.0
MITRE_ATTACK_MAPPING: Dict[str, Dict[str, Any]] = {
    "phishing_credential_theft": {
        "tactic": "Initial Access",
        "technique_id": "T1566",
        "confidence": 0.92,
        "explanation": "Phishing credential theft via malicious login domain resolution and web form entry (MITRE ATT&CK T1566).",
    },
    "lateral_movement": {
        "tactic": "Lateral Movement",
        "technique_id": "T1021",
        "confidence": 0.95,
        "explanation": "SMB port 445 scanning and unauthorized RDP remote session establishment to pivot host (MITRE ATT&CK T1021).",
    },
    "privilege_escalation": {
        "tactic": "Privilege Escalation",
        "technique_id": "T1068",
        "confidence": 0.94,
        "explanation": "Off-hours Domain Admin group member addition and unauthorized SAM/NTDS database dump (MITRE ATT&CK T1068).",
    },
    "data_exfiltration": {
        "tactic": "Exfiltration",
        "technique_id": "T1041",
        "confidence": 0.98,
        "explanation": "Bulk database export and high-volume HTTPS outbound data exfiltration to external IP (MITRE ATT&CK T1041).",
    },
}


class AnalystAgent:
    """
    AnalystAgent analyzes detected security anomalies, constructs ordered attack chains,
    and maps them to MITRE ATT&CK techniques (T1566, T1021, T1068, T1041).
    Supports LLM query path with automatic rule-based fallback.
    """

    def __init__(
        self,
        llm_client: Optional[LLMClient] = None,
        sse_callback: Optional[Callable[[str, Any], Any]] = None,
    ):
        self.llm_client = llm_client or LLMClient()
        self.sse_callback = sse_callback

    def analyze_rule_based(
        self, anomalies: List[Dict[str, Any]], incident_id: str = "inc-001"
    ) -> AttackChainResponse:
        """
        Rule-based fallback path constructing the attack chain mapped to MITRE ATT&CK.
        Returns strict Pydantic AttackChainResponse.
        """
        steps: List[AttackStep] = []
        seen_stages = set()

        # Sort anomalies chronologically by timestamp
        sorted_anomalies = sorted(
            anomalies,
            key=lambda x: str(x.get("timestamp", datetime.utcnow().isoformat())),
        )

        for anomaly in sorted_anomalies:
            stage = anomaly.get("stage")
            if not stage or stage in seen_stages:
                continue

            mapping = MITRE_ATTACK_MAPPING.get(stage)
            if not mapping:
                continue

            seen_stages.add(stage)

            ts_raw = anomaly.get("timestamp")
            if isinstance(ts_raw, str):
                try:
                    ts = datetime.fromisoformat(ts_raw)
                except ValueError:
                    ts = datetime.utcnow()
            elif isinstance(ts_raw, datetime):
                ts = ts_raw
            else:
                ts = datetime.utcnow()

            steps.append(
                AttackStep(
                    tactic=mapping["tactic"],
                    technique_id=mapping["technique_id"],
                    confidence=mapping["confidence"],
                    timestamp=ts,
                    explanation=mapping["explanation"],
                )
            )

        response = AttackChainResponse(incident_id=incident_id, chain=steps)
        return response

    def analyze(
        self,
        anomalies: List[Dict[str, Any]],
        incident_id: str = "inc-001",
        force_fallback: bool = False,
    ) -> AttackChainResponse:
        """
        Analyzes security anomalies to construct ordered attack chain.
        Tries LLM path first; if forced or LLM fails, seamlessly falls back to rule-based path.
        """
        if not force_fallback:
            try:
                prompt = (
                    f"Analyze these security anomalies for incident {incident_id}:\n"
                    f"{anomalies}\n\n"
                    "Map each stage to MITRE ATT&CK techniques: "
                    "Phishing (T1566), Lateral Movement (T1021), Privilege Escalation (T1068), Exfiltration (T1041). "
                    "Construct ordered AttackChainResponse with tactic, technique_id, confidence, timestamp, explanation."
                )
                response = self.llm_client.query(prompt, AttackChainResponse)
                if response and response.chain:
                    self._emit_chain_update(response)
                    return response
            except Exception:
                pass  # Fallback to rule-based below

        # Rule-based fallback path
        response = self.analyze_rule_based(anomalies, incident_id=incident_id)
        self._emit_chain_update(response)
        return response

    def _emit_chain_update(self, response: AttackChainResponse) -> None:
        """Emits chain_update notification if callback is configured."""
        if self.sse_callback:
            try:
                self.sse_callback("chain_update", response.model_dump(mode="json"))
            except Exception:
                pass
