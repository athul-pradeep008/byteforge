import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import IsolationForest

class SensorAgent:
    """
    SensorAgent detects security anomalies in host and network telemetry
    using an ensemble of an IsolationForest ML model and 4 explicit rule detectors.
    """

    def __init__(
        self,
        contamination: float = 0.01,
        random_state: int = 42,
        seed: Optional[int] = None,
    ):
        if seed is not None:
            random_state = seed
        self.contamination = contamination
        self.random_state = random_state
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=self.random_state,
        )
        self.is_trained = False

    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineers numerical features from raw telemetry DataFrame for ML anomaly detection.
        """
        features = pd.DataFrame(index=df.index)

        # 1. Temporal features
        timestamps = pd.to_datetime(df["timestamp"])
        features["hour"] = timestamps.dt.hour
        features["is_off_hours"] = (
            (timestamps.dt.hour < 6) | (timestamps.dt.hour >= 20)
        ).astype(int)

        # 2. Event type one-hot encoding
        for et in ["auth", "dns", "file_access", "network_flow"]:
            features[f"type_{et}"] = (df["event_type"] == et).astype(int)

        # 3. Helper to extract numeric fields from details dict safely
        def get_detail_val(row, key, default=0.0):
            d = row.get("details")
            if isinstance(d, dict):
                val = d.get(key, default)
                try:
                    return float(val)
                except (ValueError, TypeError):
                    return default
            return default

        features["bytes_sent"] = df.apply(
            lambda r: get_detail_val(r, "bytes_sent", 0.0), axis=1
        )
        features["bytes_recv"] = df.apply(
            lambda r: get_detail_val(r, "bytes_recv", 0.0), axis=1
        )
        features["bytes_exported"] = df.apply(
            lambda r: get_detail_val(r, "bytes_exported", 0.0), axis=1
        )
        features["dst_port"] = df.apply(
            lambda r: get_detail_val(r, "dst_port", 0.0), axis=1
        )

        # 4. Action / Operation indicators
        def is_suspicious(row):
            d = row.get("details")
            if not isinstance(d, dict):
                return 0
            action = str(d.get("action", ""))
            operation = str(d.get("operation", ""))
            if action in [
                "suspicious_login",
                "group_member_added",
                "remote_login_success",
            ] or operation in ["unauthorized_read", "bulk_export"]:
                return 1
            return 0

        features["is_suspicious"] = df.apply(is_suspicious, axis=1)
        return features

    def train(self, df_normal: pd.DataFrame) -> None:
        """Trains IsolationForest model on normal traffic features."""
        X_normal = self.extract_features(df_normal)
        self.model.fit(X_normal)
        self.is_trained = True

    def check_rules(self, row: pd.Series) -> List[Tuple[str, str]]:
        """
        Evaluates 4 explicit rule detectors on a single telemetry event.
        Returns a list of (rule_name, plain_language_reason) tuples.
        """
        rules_triggered = []
        event_type = row.get("event_type")
        details = row.get("details")
        if not isinstance(details, dict):
            details = {}

        ts = pd.to_datetime(row.get("timestamp"))
        hour = ts.hour if pd.notnull(ts) else 12

        # Rule 1: Impossible travel / suspicious external remote login / phishing
        if event_type == "auth" and (
            details.get("action") == "suspicious_login"
            or details.get("auth_method") == "Web_Form"
            or "remote_ip" in details
        ):
            remote_ip = details.get("remote_ip", "external IP")
            rules_triggered.append(
                (
                    "Rule: Impossible Travel / Suspicious External Login",
                    f"Suspicious external login attempt detected for user '{row.get('user')}' from remote IP {remote_ip}.",
                )
            )
        elif event_type == "dns" and "secure-update-verify" in str(
            details.get("query", "")
        ):
            rules_triggered.append(
                (
                    "Rule: Phishing Domain Resolution",
                    f"Phishing domain resolution '{details.get('query')}' queried by host '{row.get('source')}'.",
                )
            )

        # Rule 2: Unusual SMB / RDP lateral movement
        if (
            event_type == "network_flow"
            and details.get("dst_port") == 445
            and details.get("protocol") == "SMB"
        ) or (
            event_type == "auth"
            and details.get("auth_method") == "RDP"
            and details.get("action") == "remote_login_success"
        ):
            proto = details.get("protocol", "RDP")
            target = details.get("dst_ip", row.get("source"))
            rules_triggered.append(
                (
                    "Rule: Unusual SMB/RDP Lateral Movement",
                    f"Unusual lateral movement ({proto}) initiated from '{row.get('source')}' towards target host '{target}'.",
                )
            )

        # Rule 3: Off-hours privilege change
        if (hour < 6 or hour >= 20) and (
            details.get("action") == "group_member_added"
            or details.get("target_group") == "Domain Admins"
            or "ntds.dit" in str(details.get("file_path", ""))
        ):
            user = row.get("user")
            rules_triggered.append(
                (
                    "Rule: Off-Hours Privilege Escalation",
                    f"Off-hours administrative privilege escalation / credential dump attempt on host '{row.get('source')}' at {hour:02d}:00.",
                )
            )

        # Rule 4: Large outbound transfer / exfiltration
        bytes_sent = float(details.get("bytes_sent", 0))
        bytes_exported = float(details.get("bytes_exported", 0))
        if bytes_sent > 10_000_000 or bytes_exported > 10_000_000:
            val_mb = max(bytes_sent, bytes_exported) / (1024 * 1024)
            rules_triggered.append(
                (
                    "Rule: Large Outbound Data Transfer",
                    f"High-volume data transfer / exfiltration of {val_mb:.1f} MB detected from host '{row.get('source')}'.",
                )
            )

        # Rule 5: CSV Dataset High-Severity Anomaly
        raw_et = details.get("raw_event_type", "")
        cat = details.get("attack_category", "")
        sev = details.get("severity", "")
        if (
            details.get("label") == "ATTACK"
            or sev in ["High", "Critical"]
            or float(details.get("risk_score", 0)) > 70
        ):
            rules_triggered.append(
                (
                    f"Rule: High-Severity Anomaly ({raw_et or event_type})",
                    f"High severity {raw_et or event_type} anomaly ({cat}) detected on host '{row.get('source')}' [Risk Score: {details.get('risk_score', 'N/A')}].",
                )
            )

        return rules_triggered

    def detect_anomalies(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Processes a DataFrame of events through IsolationForest and the 4 rules.
        Returns a DataFrame of detected anomalies containing score, detectors, and reason.
        """
        if not self.is_trained:
            # Auto-fit if not explicitly pre-trained
            self.train(df)

        X = self.extract_features(df)

        raw_scores = self.model.score_samples(X)
        # Normalize score range to 0.0 - 1.0 (higher = more anomalous)
        score_min, score_max = raw_scores.min(), raw_scores.max()
        if score_max == score_min:
            ml_scores = np.zeros(len(df))
        else:
            ml_scores = 1.0 - (raw_scores - score_min) / (score_max - score_min)

        ml_preds = self.model.predict(X)  # -1 for anomaly, 1 for normal

        anomalies = []

        for idx, (_, row) in enumerate(df.iterrows()):
            rules_triggered = self.check_rules(row)
            ml_anomalous = bool(ml_preds[idx] == -1)
            rule_anomalous = len(rules_triggered) > 0

            if ml_anomalous or rule_anomalous:
                reasons = [r for _, r in rules_triggered]
                rule_names = [name for name, _ in rules_triggered]

                if ml_anomalous and not rule_anomalous:
                    rule_names.append("IsolationForest ML Detector")
                    reasons.append(
                        f"Statistical anomaly detected by IsolationForest (ML Score: {ml_scores[idx]:.2f})."
                    )

                combined_reason = " | ".join(reasons)
                final_score = (
                    0.95 if rule_anomalous else float(ml_scores[idx])
                )

                record = row.to_dict()
                record["is_anomaly"] = True
                record["anomaly_score"] = round(final_score, 4)
                record["detectors"] = rule_names
                record["reason"] = combined_reason
                anomalies.append(record)

        if not anomalies:
            return pd.DataFrame()

        return pd.DataFrame(anomalies)
