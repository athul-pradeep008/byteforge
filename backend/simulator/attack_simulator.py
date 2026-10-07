import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd

# 6 defined hosts in environment
HOSTS = [
    "laptop-1",
    "laptop-2",
    "workstation-1",
    "app-server",
    "db-server",
    "domain-controller",
]

HOST_IPS: Dict[str, str] = {
    "laptop-1": "192.168.1.101",
    "laptop-2": "192.168.1.102",
    "workstation-1": "192.168.1.105",
    "app-server": "10.0.1.10",
    "db-server": "10.0.2.20",
    "domain-controller": "10.0.0.1",
}

USERS: List[str] = [
    "alice",
    "bob",
    "charlie",
    "david",
    "sysadmin",
    "service_account",
]

class AttackSimulator:
    """
    Simulates network, host, and authentication telemetry for CyberImmune 2.0.
    Generates ~2000 normal events and multi-stage cyber attack scenarios.
    """

    def __init__(self, seed: int = 42, base_time: Optional[datetime] = None):
        self.seed = seed
        self.rng = np.random.default_rng(seed)
        self.base_time = base_time or datetime(2026, 10, 1, 8, 0, 0)

    def set_seed(self, seed: int) -> None:
        """Sets the random seed for reproducible generation."""
        self.seed = seed
        self.rng = np.random.default_rng(seed)

    def generate_normal_events(
        self, count: int = 2000, start_time: Optional[datetime] = None
    ) -> pd.DataFrame:
        """
        Generates ~2000 normal telemetry events across 4 event types:
        auth, dns, file_access, network_flow.
        """
        start = start_time or self.base_time
        events = []

        event_types = ["auth", "dns", "file_access", "network_flow"]
        type_probs = [0.25, 0.35, 0.20, 0.20]

        chosen_types = self.rng.choice(event_types, size=count, p=type_probs)
        time_offsets_sec = self.rng.integers(0, 86400, size=count)
        time_offsets_sec.sort()

        for idx in range(count):
            offset = int(time_offsets_sec[idx])
            ts = start + timedelta(seconds=offset)
            event_type = str(chosen_types[idx])
            host = str(self.rng.choice(HOSTS))
            src_ip = HOST_IPS[host]
            user = str(self.rng.choice(USERS))
            event_id = f"evt-norm-{idx + 1:05d}"

            details: Dict[str, Any] = {}
            if event_type == "auth":
                action = str(
                    self.rng.choice(
                        ["login_success", "logoff", "failed_login"],
                        p=[0.85, 0.12, 0.03],
                    )
                )
                details = {
                    "action": action,
                    "user": user,
                    "auth_method": str(
                        self.rng.choice(["Kerberos", "NTLM", "Password"])
                    ),
                    "dst_host": host,
                }
            elif event_type == "dns":
                domain = str(
                    self.rng.choice(
                        [
                            "google.com",
                            "internal.corp",
                            "github.com",
                            "api.service.com",
                            "updates.microsoft.com",
                        ]
                    )
                )
                details = {
                    "query": domain,
                    "record_type": "A",
                    "resolved_ip": f"172.217.16.{self.rng.integers(1, 254)}",
                }
            elif event_type == "file_access":
                file_path = str(
                    self.rng.choice(
                        [
                            "C:\\Users\\public\\document.docx",
                            "C:\\Windows\\System32\\config.ini",
                            "D:\\shares\\team_notes.txt",
                            "/var/log/app.log",
                            "/etc/hosts",
                        ]
                    )
                )
                details = {
                    "file_path": file_path,
                    "operation": str(self.rng.choice(["read", "write"])),
                    "user": user,
                }
            elif event_type == "network_flow":
                dest_host = str(self.rng.choice(HOSTS))
                dst_ip = HOST_IPS[dest_host]
                dest_port = int(self.rng.choice([80, 443, 8080, 445, 139]))
                details = {
                    "dst_ip": dst_ip,
                    "dst_port": dest_port,
                    "bytes_sent": int(self.rng.integers(100, 15000)),
                    "bytes_recv": int(self.rng.integers(500, 50000)),
                    "protocol": "TCP",
                }

            events.append(
                {
                    "event_id": event_id,
                    "timestamp": ts,
                    "source": host,
                    "src_ip": src_ip,
                    "event_type": event_type,
                    "user": user,
                    "details": details,
                    "is_attack": False,
                    "stage": None,
                    "stage_order": 0,
                }
            )

        return pd.DataFrame(events)

    def generate_attack(
        self,
        seed: Optional[int] = None,
        start_time: Optional[datetime] = None,
        victim_user: str = "alice",
        initial_host: str = "laptop-1",
        pivot_host: str = "workstation-1",
        target_db: str = "db-server",
        dc_host: str = "domain-controller",
        attacker_ip: str = "198.51.100.45",
        exfil_ip: str = "203.0.113.88",
    ) -> pd.DataFrame:
        """
        Generates 4 distinct attack stages:
        1. Phishing credential theft (initial access)
        2. Lateral movement (SMB/RDP)
        3. Privilege escalation (off-hours admin change)
        4. Data exfiltration from db-server
        """
        start = start_time or (self.base_time + timedelta(hours=10))
        events = []
        evt_counter = 1

        # STAGE 1: Phishing Credential Theft
        st1_time = start
        events.append(
            {
                "event_id": f"evt-atk-s1-{evt_counter:03d}",
                "timestamp": st1_time,
                "source": initial_host,
                "src_ip": HOST_IPS[initial_host],
                "event_type": "dns",
                "user": victim_user,
                "details": {
                    "query": "login.secure-update-verify.com",
                    "record_type": "A",
                    "resolved_ip": attacker_ip,
                    "notice": "Phishing domain resolution",
                },
                "is_attack": True,
                "stage": "phishing_credential_theft",
                "stage_order": 1,
            }
        )
        evt_counter += 1

        st1_time += timedelta(minutes=2)
        events.append(
            {
                "event_id": f"evt-atk-s1-{evt_counter:03d}",
                "timestamp": st1_time,
                "source": initial_host,
                "src_ip": HOST_IPS[initial_host],
                "event_type": "auth",
                "user": victim_user,
                "details": {
                    "action": "suspicious_login",
                    "auth_method": "Web_Form",
                    "remote_ip": attacker_ip,
                    "notice": "Stolen credentials captured via web phish",
                },
                "is_attack": True,
                "stage": "phishing_credential_theft",
                "stage_order": 1,
            }
        )
        evt_counter += 1

        # STAGE 2: Lateral Movement (SMB/RDP)
        st2_time = st1_time + timedelta(minutes=25)
        events.append(
            {
                "event_id": f"evt-atk-s2-{evt_counter:03d}",
                "timestamp": st2_time,
                "source": initial_host,
                "src_ip": HOST_IPS[initial_host],
                "event_type": "network_flow",
                "user": victim_user,
                "details": {
                    "dst_ip": HOST_IPS[pivot_host],
                    "dst_port": 445,
                    "protocol": "SMB",
                    "bytes_sent": 15400,
                    "bytes_recv": 8200,
                    "notice": "SMB lateral movement scan/connect",
                },
                "is_attack": True,
                "stage": "lateral_movement",
                "stage_order": 2,
            }
        )
        evt_counter += 1

        st2_time += timedelta(minutes=5)
        events.append(
            {
                "event_id": f"evt-atk-s2-{evt_counter:03d}",
                "timestamp": st2_time,
                "source": pivot_host,
                "src_ip": HOST_IPS[pivot_host],
                "event_type": "auth",
                "user": victim_user,
                "details": {
                    "action": "remote_login_success",
                    "auth_method": "RDP",
                    "dst_port": 3389,
                    "src_ip": HOST_IPS[initial_host],
                    "notice": "RDP logon using stolen credentials to pivot host",
                },
                "is_attack": True,
                "stage": "lateral_movement",
                "stage_order": 2,
            }
        )
        evt_counter += 1

        # STAGE 3: Privilege Escalation (Off-hours Admin Change)
        st3_time = start + timedelta(hours=14, minutes=15)
        events.append(
            {
                "event_id": f"evt-atk-s3-{evt_counter:03d}",
                "timestamp": st3_time,
                "source": dc_host,
                "src_ip": HOST_IPS[dc_host],
                "event_type": "auth",
                "user": "sysadmin",
                "details": {
                    "action": "group_member_added",
                    "target_group": "Domain Admins",
                    "added_user": victim_user,
                    "modified_by": "SYSTEM",
                    "notice": "Off-hours privilege escalation: Domain Admins group change",
                },
                "is_attack": True,
                "stage": "privilege_escalation",
                "stage_order": 3,
            }
        )
        evt_counter += 1

        st3_time += timedelta(minutes=3)
        events.append(
            {
                "event_id": f"evt-atk-s3-{evt_counter:03d}",
                "timestamp": st3_time,
                "source": dc_host,
                "src_ip": HOST_IPS[dc_host],
                "event_type": "file_access",
                "user": victim_user,
                "details": {
                    "file_path": "C:\\Windows\\NTDS\\ntds.dit",
                    "operation": "unauthorized_read",
                    "notice": "Off-hours NTDS registry/sam database dump",
                },
                "is_attack": True,
                "stage": "privilege_escalation",
                "stage_order": 3,
            }
        )
        evt_counter += 1

        # STAGE 4: Data Exfiltration from db-server
        st4_time = st3_time + timedelta(minutes=40)
        events.append(
            {
                "event_id": f"evt-atk-s4-{evt_counter:03d}",
                "timestamp": st4_time,
                "source": target_db,
                "src_ip": HOST_IPS[target_db],
                "event_type": "file_access",
                "user": victim_user,
                "details": {
                    "file_path": "/var/lib/mysql/customer_records.db",
                    "operation": "bulk_export",
                    "bytes_exported": 524288000,
                    "notice": "Database export of sensitive customer records",
                },
                "is_attack": True,
                "stage": "data_exfiltration",
                "stage_order": 4,
            }
        )
        evt_counter += 1

        st4_time += timedelta(minutes=10)
        events.append(
            {
                "event_id": f"evt-atk-s4-{evt_counter:03d}",
                "timestamp": st4_time,
                "source": target_db,
                "src_ip": HOST_IPS[target_db],
                "event_type": "network_flow",
                "user": victim_user,
                "details": {
                    "dst_ip": exfil_ip,
                    "dst_port": 443,
                    "protocol": "HTTPS",
                    "bytes_sent": 540000000,
                    "bytes_recv": 12000,
                    "notice": "High volume outbound data exfiltration to external IP",
                },
                "is_attack": True,
                "stage": "data_exfiltration",
                "stage_order": 4,
            }
        )

        return pd.DataFrame(events)

    def generate_variant(
        self,
        seed: Optional[int] = None,
        start_time: Optional[datetime] = None,
        victim_user: str = "charlie",
        initial_host: str = "laptop-2",
        pivot_host: str = "app-server",
        target_db: str = "db-server",
        dc_host: str = "domain-controller",
        attacker_ip: str = "198.51.100.99",
        exfil_ip: str = "198.51.100.200",
    ) -> pd.DataFrame:
        """
        Generates a variant attack with different IPs, victim users, hosts, or timing parameters,
        preserving the identical 4 attack stages in order.
        """
        variant_seed = seed if seed is not None else (self.seed + 100)
        return self.generate_attack(
            seed=variant_seed,
            start_time=start_time or (self.base_time + timedelta(hours=14)),
            victim_user=victim_user,
            initial_host=initial_host,
            pivot_host=pivot_host,
            target_db=target_db,
            dc_host=dc_host,
            attacker_ip=attacker_ip,
            exfil_ip=exfil_ip,
        )

    def generate_full_dataset(
        self,
        normal_count: int = 2000,
        include_attack: bool = True,
        attack_variant: bool = False,
        seed: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Generates a full merged dataset of ~2000 normal telemetry events and attack events,
        chronologically sorted.
        """
        effective_seed = seed if seed is not None else self.seed
        self.set_seed(effective_seed)

        df_normal = self.generate_normal_events(count=normal_count)

        if not include_attack:
            return df_normal.sort_values("timestamp").reset_index(drop=True)

        if attack_variant:
            df_attack = self.generate_variant(seed=effective_seed + 1)
        else:
            df_attack = self.generate_attack(seed=effective_seed)

        df_full = pd.concat([df_normal, df_attack], ignore_index=True)
        df_full = df_full.sort_values("timestamp").reset_index(drop=True)
        return df_full
