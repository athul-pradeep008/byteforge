import os
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

def load_cyberimmune_csv(
    file_path: str = "backend/data/cyberimmune_dataset.csv",
    limit: Optional[int] = None
) -> pd.DataFrame:
    """
    Loads and normalizes external cybersecurity dataset CSV (like cyberimmune_dataset (1).csv)
    into standard CyberImmune 2.0 telemetry event DataFrame.
    """
    if not os.path.exists(file_path):
        # Fallback search path
        alt_path = r"d:\Open Rails Train Simulator - ZZ\cyberimmune_dataset (1).csv"
        if os.path.exists(alt_path):
            file_path = alt_path
        else:
            raise FileNotFoundError(f"Dataset CSV not found at {file_path}")

    raw_df = pd.read_csv(file_path)
    if limit:
        raw_df = raw_df.head(limit)

    events = []
    base_time = datetime.utcnow() - timedelta(hours=2)

    for idx, row in raw_df.iterrows():
        event_id = str(row.get("event_id", f"CYB-{idx+1:05d}"))
        
        # Timestamp parsing
        ts_val = row.get("timestamp")
        try:
            ts = pd.to_datetime(ts_val)
            if pd.isnull(ts):
                ts = base_time + timedelta(seconds=idx * 2)
        except Exception:
            ts = base_time + timedelta(seconds=idx * 2)

        device = str(row.get("device", "UNKNOWN-HOST"))
        source = device.lower().replace("_", "-")
        src_ip = str(row.get("source_ip", "10.0.0.1"))
        dst_ip = str(row.get("destination_ip", "10.0.0.2"))
        
        raw_event_type = str(row.get("event_type", "Normal"))
        category = str(row.get("attack_category", "Benign"))
        label = str(row.get("label", "BENIGN")).upper()
        severity = str(row.get("severity", "Low"))
        
        is_attack = label == "ATTACK" or severity in ["High", "Critical"]
        
        # Standardized event_type mapping
        event_type = "network_flow"
        if raw_event_type in ["SSH Brute Force", "Brute Force"]:
            event_type = "auth"
        elif raw_event_type in ["SQL Injection", "Web Attack", "Infiltration"]:
            event_type = "file_access"
        elif raw_event_type in ["Port Scan", "DNS"]:
            event_type = "dns"

        packets = int(row.get("packets", 100))
        num_bytes = int(row.get("bytes", 5000))
        failed_attempts = int(row.get("failed_attempts", 0))
        risk_score = float(row.get("risk_score", 10))
        confidence = float(row.get("confidence", 90))
        status = str(row.get("status", "Normal"))
        protocol = str(row.get("protocol", "TCP"))
        dst_port = int(row.get("destination_port", 80))
        src_port = int(row.get("source_port", 1024))

        # Map to 4 attack stages for ATT&CK mapping
        stage = None
        stage_order = 0
        if is_attack:
            if category in ["Reconnaissance"] or raw_event_type == "Port Scan":
                stage = "phishing_credential_theft"
                stage_order = 1
            elif category in ["Credential Attack", "Intrusion"] or raw_event_type in ["SSH Brute Force", "Brute Force", "Infiltration"]:
                stage = "lateral_movement"
                stage_order = 2
            elif category in ["Application Attack", "Vulnerability Exploitation"] or raw_event_type in ["SQL Injection", "Web Attack", "Heartbleed"]:
                stage = "privilege_escalation"
                stage_order = 3
            elif category in ["Availability Attack", "Malware"] or raw_event_type in ["DoS", "DDoS", "Botnet"]:
                stage = "data_exfiltration"
                stage_order = 4
            else:
                stage = "lateral_movement"
                stage_order = 2

        details: Dict[str, Any] = {
            "dst_ip": dst_ip,
            "src_port": src_port,
            "dst_port": dst_port,
            "protocol": protocol,
            "packets": packets,
            "bytes_sent": num_bytes,
            "bytes_recv": num_bytes // 2,
            "failed_attempts": failed_attempts,
            "risk_score": risk_score,
            "confidence": confidence,
            "severity": severity,
            "raw_event_type": raw_event_type,
            "attack_category": category,
            "label": label,
            "status": status,
            "notice": f"{raw_event_type} ({category}) event on {device} [Severity: {severity}]",
        }

        if event_type == "auth":
            details["action"] = "failed_login" if failed_attempts > 5 else "remote_login_success"
            details["auth_method"] = "SSH" if protocol == "SSH" else "Password"
        elif event_type == "file_access":
            details["file_path"] = f"/var/www/{raw_event_type.lower().replace(' ', '_')}.php"
            details["operation"] = "unauthorized_read" if is_attack else "read"

        events.append({
            "event_id": event_id,
            "timestamp": ts,
            "source": source,
            "src_ip": src_ip,
            "event_type": event_type,
            "user": "sysadmin" if is_attack else "user_app",
            "details": details,
            "is_attack": is_attack,
            "stage": stage,
            "stage_order": stage_order,
        })

    df = pd.DataFrame(events)
    df = df.sort_values("timestamp").reset_index(drop=True)
    return df
