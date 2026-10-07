from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class ResponseOptionDetail(BaseModel):
    id: str
    action: str
    target: str
    risk_reduction: float = Field(..., ge=0.0, le=1.0)
    business_impact: float = Field(..., ge=0.0, le=1.0)
    score: float
    time_to_execute: str
    risk_level: str
    description: str
    rationale: str
    is_recommended: bool = False


class StrategistResponse(BaseModel):
    scoring_formula: str = "score = 0.6 * risk_reduction - 0.4 * business_impact"
    recommended_option_id: str
    options: List[ResponseOptionDetail]


class StrategistAgent:
    """
    StrategistAgent evaluates threat context, generates 3-4 response options,
    computes scores using score = 0.6 * risk_reduction - 0.4 * business_impact,
    and identifies the recommended action.
    """

    def __init__(self):
        self.scoring_formula = "score = 0.6 * risk_reduction - 0.4 * business_impact"

    def evaluate_response_options(
        self,
        anomalies: List[Dict[str, Any]],
        target_host: str = "laptop-1",
        victim_user: str = "alice",
        attacker_ip: str = "198.51.100.45",
    ) -> StrategistResponse:
        """
        Generates 4 candidate response options, computes scores using formula,
        and returns structured StrategistResponse with the recommended option.
        """
        raw_options = [
            {
                "id": "resp-001",
                "action": "Isolate Host",
                "target": target_host,
                "risk_reduction": 0.90,
                "business_impact": 0.25,
                "time_to_execute": "15 seconds",
                "risk_level": "MEDIUM",
                "description": f"Isolate compromised host {target_host} from network",
                "rationale": f"Prevents lateral movement from {target_host} with minimal impact to other services.",
            },
            {
                "id": "resp-002",
                "action": "Block Remote IP",
                "target": attacker_ip,
                "risk_reduction": 0.75,
                "business_impact": 0.05,
                "time_to_execute": "5 seconds",
                "risk_level": "LOW",
                "description": f"Block inbound/outbound traffic to IP {attacker_ip} at firewall",
                "rationale": "Stops communication with external attacker C2 server with zero internal downtime.",
            },
            {
                "id": "resp-003",
                "action": "Disable User Account",
                "target": victim_user,
                "risk_reduction": 0.85,
                "business_impact": 0.20,
                "time_to_execute": "10 seconds",
                "risk_level": "MEDIUM",
                "description": f"Revoke active credentials and session tokens for user {victim_user}",
                "rationale": f"Invalidates compromised credentials used by attacker for user {victim_user}.",
            },
            {
                "id": "resp-004",
                "action": "Segment Network Subnet",
                "target": "192.168.1.0/24",
                "risk_reduction": 0.95,
                "business_impact": 0.70,
                "time_to_execute": "60 seconds",
                "risk_level": "HIGH",
                "description": "Quarantine entire workstation subnet 192.168.1.0/24",
                "rationale": "High containment but incurs severe operational disruption across all workstation users.",
            },
        ]

        evaluated_options: List[ResponseOptionDetail] = []
        highest_score = -999.0
        best_id = raw_options[0]["id"]

        for opt in raw_options:
            rr = opt["risk_reduction"]
            bi = opt["business_impact"]
            # Apply exact formula: score = 0.6 * risk_reduction - 0.4 * business_impact
            score = round(0.6 * rr - 0.4 * bi, 4)

            detail = ResponseOptionDetail(
                id=opt["id"],
                action=opt["action"],
                target=opt["target"],
                risk_reduction=rr,
                business_impact=bi,
                score=score,
                time_to_execute=opt["time_to_execute"],
                risk_level=opt["risk_level"],
                description=opt["description"],
                rationale=opt["rationale"],
                is_recommended=False,
            )
            evaluated_options.append(detail)

            if score > highest_score:
                highest_score = score
                best_id = opt["id"]

        # Mark recommended option
        for opt_detail in evaluated_options:
            if opt_detail.id == best_id:
                opt_detail.is_recommended = True

        return StrategistResponse(
            scoring_formula=self.scoring_formula,
            recommended_option_id=best_id,
            options=evaluated_options,
        )
