import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel


class AuditLogEntry(BaseModel):
    timestamp: str
    incident_id: str
    action: str
    target: str
    status: str  # "EXECUTED", "PENDING_APPROVAL", "REJECTED"
    executed_by: str
    business_impact: float
    risk_level: str
    details: Dict[str, Any]


class ResponderAgent:
    """
    ResponderAgent simulates state changes for security response actions,
    enforces human approval thresholds for high-impact actions, and appends
    every decision to backend/data/audit_log.jsonl.
    """

    def __init__(
        self,
        audit_log_path: str = "backend/data/audit_log.jsonl",
        approval_impact_threshold: float = 0.30,
    ):
        self.audit_log_path = audit_log_path
        self.approval_impact_threshold = approval_impact_threshold
        os.makedirs(os.path.dirname(self.audit_log_path), exist_ok=True)

    def log_audit(self, entry: AuditLogEntry) -> None:
        """Appends JSON line entry to audit log file."""
        with open(self.audit_log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry.model_dump(), default=str) + "\n")

    def read_audit_log(self) -> List[Dict[str, Any]]:
        """Reads all audit log entries from JSONL file."""
        if not os.path.exists(self.audit_log_path):
            return []
        entries = []
        with open(self.audit_log_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    try:
                        entries.append(json.loads(line.strip()))
                    except Exception:
                        pass
        return entries

    def clear_audit_log(self) -> None:
        """Clears audit log file for demo reset."""
        with open(self.audit_log_path, "w", encoding="utf-8") as f:
            f.write("")

    def requires_approval(self, option_detail: Dict[str, Any]) -> bool:
        """Determines if action requires human approval based on impact or risk level."""
        impact = float(option_detail.get("business_impact", 0.0))
        risk_level = str(option_detail.get("risk_level", "LOW")).upper()
        return impact > self.approval_impact_threshold or risk_level == "HIGH"

    def execute_response(
        self,
        option_detail: Dict[str, Any],
        incident_id: str = "inc-001",
        approved_by: Optional[str] = None,
        force_execute: bool = False,
    ) -> Dict[str, Any]:
        """
        Simulates response action execution and records audit log entry.
        If approval is required and not provided, sets status to PENDING_APPROVAL.
        """
        needs_approval = self.requires_approval(option_detail)

        if needs_approval and not approved_by and not force_execute:
            status = "PENDING_APPROVAL"
            message = (
                f"Action '{option_detail.get('action')}' requires human approval "
                f"(impact {option_detail.get('business_impact')} > threshold)."
            )
        else:
            status = "EXECUTED"
            exec_user = approved_by or "AUTONOMOUS_RESPONDER"
            message = (
                f"Action '{option_detail.get('action')}' executed successfully "
                f"by {exec_user} on {option_detail.get('target')}."
            )

        entry = AuditLogEntry(
            timestamp=datetime.utcnow().isoformat(),
            incident_id=incident_id,
            action=str(option_detail.get("action")),
            target=str(option_detail.get("target")),
            status=status,
            executed_by=approved_by
            or ("AUTONOMOUS_RESPONDER" if status == "EXECUTED" else "PENDING"),
            business_impact=float(option_detail.get("business_impact", 0.0)),
            risk_level=str(option_detail.get("risk_level", "LOW")),
            details={
                "message": message,
                "score": option_detail.get("score"),
                "rationale": option_detail.get("rationale"),
            },
        )

        self.log_audit(entry)

        return {
            "status": status,
            "incident_id": incident_id,
            "action": option_detail.get("action"),
            "target": option_detail.get("target"),
            "requires_approval": needs_approval,
            "message": message,
            "audit_entry": entry.model_dump(),
        }
