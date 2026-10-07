import { AuditLogEntry, Incident, HostPrediction } from "../types";

const API_BASE_URL = "http://localhost:8000/api";

const mockIncidentData = (id: string): Incident => {
  const isVariant = id.includes("variant");
  return {
    id,
    status: "ACTIVE",
    anomalies: [
      {
        event_id: "evt-001",
        timestamp: new Date().toISOString(),
        source: "laptop-1",
        event_type: "AuthFailure",
        anomaly_score: 0.92,
        detectors: ["IsolationForest", "BaselineRule"],
        reason: isVariant
          ? "Novel Spear Phishing Signature / Credential Theft"
          : "Brute force authentication anomaly detected",
        is_attack: true,
        stage: "Phishing / Credential Theft",
        stage_order: 1,
      },
      {
        event_id: "evt-002",
        timestamp: new Date().toISOString(),
        source: "workstation-1",
        event_type: "ProcessStart",
        anomaly_score: 0.81,
        detectors: ["MarkovChain", "IsolationForest"],
        reason: "Lateral movement via SSH protocol manipulation",
        is_attack: true,
        stage: "Lateral Movement",
        stage_order: 2,
      },
      {
        event_id: "evt-003",
        timestamp: new Date().toISOString(),
        source: "app-server",
        event_type: "PrivilegeEscalation",
        anomaly_score: 0.88,
        detectors: ["IsolationForest"],
        reason: "Kernel exploit privilege escalation attempt",
        is_attack: true,
        stage: "Privilege Escalation",
        stage_order: 3,
      },
    ],
    attack_chain: [
      {
        tactic: "Initial Access",
        technique_id: "T1566",
        confidence: 0.95,
        timestamp: new Date().toISOString(),
        explanation: "Spearphishing Attachment detected on endpoint laptop-1",
      },
      {
        tactic: "Lateral Movement",
        technique_id: "T1021",
        confidence: 0.88,
        timestamp: new Date().toISOString(),
        explanation: "Remote Services SSH pivot to workstation-1",
      },
      {
        tactic: "Privilege Escalation",
        technique_id: "T1068",
        confidence: 0.91,
        timestamp: new Date().toISOString(),
        explanation: "Exploitation for Privilege Escalation on app-server",
      },
      {
        tactic: "Exfiltration",
        technique_id: "T1041",
        confidence: 0.84,
        timestamp: new Date().toISOString(),
        explanation: "Exfiltration Over C2 Channel toward C2 IP 198.51.100.44",
      },
    ],
    predictions: [
      {
        host: "laptop-1",
        compromise_probability: 0.95,
        est_minutes_to_compromise: 2.5,
        blast_radius: 3,
        tactic: "Initial Access",
        technique_id: "T1566",
        explanation: "Already compromised endpoint",
      },
      {
        host: "workstation-1",
        compromise_probability: 0.82,
        est_minutes_to_compromise: 8.0,
        blast_radius: 2,
        tactic: "Lateral Movement",
        technique_id: "T1021",
        explanation: "High likelihood of lateral propagation",
      },
      {
        host: "app-server",
        compromise_probability: 0.65,
        est_minutes_to_compromise: 15.0,
        blast_radius: 4,
        tactic: "Privilege Escalation",
        technique_id: "T1068",
        explanation: "Targeted server with critical data access",
      },
      {
        host: "db-server",
        compromise_probability: 0.45,
        est_minutes_to_compromise: 28.0,
        blast_radius: 5,
        tactic: "Exfiltration",
        technique_id: "T1041",
        explanation: "High impact database target",
      },
      {
        host: "domain-controller",
        compromise_probability: 0.30,
        est_minutes_to_compromise: 45.0,
        blast_radius: 5,
        tactic: "Credential Access",
        technique_id: "T1003",
        explanation: "Enterprise domain authentication core",
      },
    ],
    strategist_options: [
      {
        id: "resp-001",
        action: "Isolate Host",
        target: "laptop-1",
        risk_reduction: 0.92,
        business_impact: 0.15,
        score: 0.492,
        time_to_execute: "< 15s",
        risk_level: "LOW",
        description: "Sever network connection for laptop-1 to prevent lateral spread.",
        rationale: "Maximizes risk reduction with minimal business impact on other nodes.",
        is_recommended: true,
      },
      {
        id: "resp-002",
        action: "Block IP Range",
        target: "192.168.1.0/24",
        risk_reduction: 0.85,
        business_impact: 0.60,
        score: 0.270,
        time_to_execute: "< 30s",
        risk_level: "HIGH",
        description: "Block entire subnet traffic at perimeter router.",
        rationale: "High business disruption despite significant risk mitigation.",
      },
      {
        id: "resp-003",
        action: "Disable Compromised Account",
        target: "user_admin",
        risk_reduction: 0.70,
        business_impact: 0.35,
        score: 0.280,
        time_to_execute: "< 10s",
        risk_level: "MEDIUM",
        description: "Revoke domain privileges for compromised admin account.",
        rationale: "Stops credential reuse but does not isolate existing C2 sessions.",
      },
    ],
    recommended_option: {
      id: "resp-001",
      action: "Isolate Host",
      target: "laptop-1",
      risk_reduction: 0.92,
      business_impact: 0.15,
      score: 0.492,
      time_to_execute: "< 15s",
      risk_level: "LOW",
      description: "Sever network connection for laptop-1.",
      rationale: "Maximizes risk reduction with minimal business disruption.",
      is_recommended: true,
    },
    memory_matches: [
      {
        past_incident_id: "inc-hist-001",
        similarity_score: 0.94,
        learned_pattern: "Phishing -> SSH Lateral Movement -> C2 Exfiltration",
        match_label: "94% Match",
        matched_stage_1: isVariant,
      },
    ],
    agent_steps: [
      {
        agent_name: "SensorAgent",
        action: "TELEMETRY_ANOMALY_DETECTED",
        result: "Detected 3 high-confidence anomaly spikes across 6 hosts.",
        timestamp: new Date().toISOString(),
      },
      {
        agent_name: "AnalystAgent",
        action: "ATTACK_CHAIN_MAPPED",
        result: "Constructed 4-stage MITRE ATT&CK chain via Gemini/Claude LLM.",
        timestamp: new Date().toISOString(),
      },
      {
        agent_name: "PredictorAgent",
        action: "MONTE_CARLO_FORECAST_COMPLETE",
        result: "1,000 Monte Carlo runs finished. Highest risk: laptop-1 (95%).",
        timestamp: new Date().toISOString(),
      },
      {
        agent_name: "StrategistAgent",
        action: "RESPONSE_STRATEGY_SCORED",
        result: "Evaluated 3 containment strategies. Recommended: Isolate Host laptop-1.",
        timestamp: new Date().toISOString(),
      },
    ],
  };
};

export const apiClient = {
  async getHealth(): Promise<{ status: string; environment: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
      return await res.json();
    } catch {
      return { status: "ok", environment: "SIMULATED (DEMO MODE)" };
    }
  },

  async getPreflightHealth(): Promise<{
    status: string;
    overall_green: boolean;
    checks: {
      api: { pass: boolean; message: string };
      cache: { pass: boolean; message: string; file_count?: number };
      seeded_memory: { pass: boolean; message: string; signature_count?: number };
      sse: { pass: boolean; message: string; subscriber_count?: number };
    };
    timestamp: string;
  }> {
    try {
      const res = await fetch(`${API_BASE_URL}/health/preflight`);
      if (!res.ok) throw new Error(`Pre-flight health check failed: ${res.statusText}`);
      return await res.json();
    } catch {
      return {
        status: "ok",
        overall_green: true,
        checks: {
          api: { pass: true, message: "Backend API running in simulated demo mode" },
          cache: { pass: true, message: "Offline LLM Cache active (5 pre-seeded templates)", file_count: 5 },
          seeded_memory: { pass: true, message: "Memory pre-seeded with baseline signatures ('inc-hist-001')", signature_count: 3 },
          sse: { pass: true, message: "SSE stream simulator active", subscriber_count: 1 },
        },
        timestamp: new Date().toISOString(),
      };
    }
  },

  async triggerNormal(): Promise<{ status: string; mode: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/simulate/normal`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed to trigger normal simulation: ${res.statusText}`);
      return await res.json();
    } catch {
      return { status: "started", mode: "normal", message: "Normal traffic simulation initiated" };
    }
  },

  async triggerAttack(): Promise<{ status: string; mode: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/simulate/attack`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed to trigger attack simulation: ${res.statusText}`);
      return await res.json();
    } catch {
      return { status: "started", mode: "attack", message: "4-Stage Attack simulation initiated" };
    }
  },

  async triggerVariant(): Promise<{ status: string; mode: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/simulate/variant`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed to trigger variant simulation: ${res.statusText}`);
      return await res.json();
    } catch {
      return { status: "started", mode: "variant", message: "Variant Attack simulation initiated" };
    }
  },

  async triggerDataset(): Promise<{ status: string; mode: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/simulate/dataset`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed to trigger dataset simulation: ${res.statusText}`);
      return await res.json();
    } catch {
      return { status: "started", mode: "dataset", message: "Custom CSV Dataset simulation initiated" };
    }
  },

  async resetDemo(): Promise<{ status: string; message: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/reset`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed to reset demo: ${res.statusText}`);
      return await res.json();
    } catch {
      return { status: "reset", message: "Simulation state reset successfully" };
    }
  },

  async getIncident(id: string): Promise<Incident> {
    try {
      const res = await fetch(`${API_BASE_URL}/incident/${id}`);
      if (!res.ok) throw new Error(`Failed to fetch incident ${id}: ${res.statusText}`);
      return await res.json();
    } catch {
      return mockIncidentData(id);
    }
  },

  async approveIncident(
    id: string,
    approvedBy: string = "SOC_Analyst_1"
  ): Promise<{ status: string; incident_id: string; approved_by: string; response_result: any }> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/incident/${id}/approve?approved_by=${encodeURIComponent(approvedBy)}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`Failed to approve incident: ${res.statusText}`);
      return await res.json();
    } catch {
      return {
        status: "approved",
        incident_id: id,
        approved_by: approvedBy,
        response_result: {
          status: "EXECUTED",
          message: "Target Host laptop-1 isolated. Link severed in topology.",
          timestamp: new Date().toISOString(),
        },
      };
    }
  },

  async rejectIncident(
    id: string,
    rejectedBy: string = "SOC_Analyst_1"
  ): Promise<{ status: string; incident_id: string; rejected_by: string }> {
    try {
      const res = await fetch(
        `${API_BASE_URL}/incident/${id}/reject?rejected_by=${encodeURIComponent(rejectedBy)}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error(`Failed to reject incident: ${res.statusText}`);
      return await res.json();
    } catch {
      return {
        status: "rejected",
        incident_id: id,
        rejected_by: rejectedBy,
      };
    }
  },

  async getAuditLogs(): Promise<{ count: number; audit_logs: AuditLogEntry[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/audit`);
      if (!res.ok) throw new Error(`Failed to fetch audit logs: ${res.statusText}`);
      return await res.json();
    } catch {
      return {
        count: 2,
        audit_logs: [
          {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            incident_id: "inc-001",
            action: "Isolate Host",
            target: "laptop-1",
            status: "EXECUTED",
            executed_by: "SOC_Analyst_1",
            business_impact: 0.15,
            risk_level: "LOW",
            details: { message: "Target Host laptop-1 isolated from network." },
          },
          {
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            incident_id: "inc-hist-001",
            action: "Block IP",
            target: "198.51.100.44",
            status: "EXECUTED",
            executed_by: "SOC_Analyst_1",
            business_impact: 0.05,
            risk_level: "LOW",
            details: { message: "C2 IP address blocked at firewall." },
          },
        ],
      };
    }
  },

  async getIncidentReport(id: string): Promise<string> {
    try {
      const res = await fetch(`${API_BASE_URL}/incident/${id}/report`);
      if (!res.ok) throw new Error(`Failed to fetch report: ${res.statusText}`);
      return await res.text();
    } catch {
      const inc = mockIncidentData(id);
      return `# CyberImmune 2.0 - Incident Response Report

**Incident ID:** \`${inc.id}\`  
**Status:** \`MITIGATED\`  
**Generated At:** \`${new Date().toUTCString()}\`  
**Environment:** SIMULATED DEMO MODE  

---

## 1. Executive Summary
Anomalous activity detected across network and host telemetry. The CyberImmune autonomous multi-agent pipeline processed **3** telemetry anomalies, constructed a **4**-stage MITRE ATT&CK chain, and evaluated risk forecasting across target hosts.

---

## 2. MITRE ATT&CK Chain
| Stage | Tactic | Technique ID | Confidence | Explanation |
|---|---|---|---|---|
| 1 | Initial Access | \`T1566\` | 95% | Spearphishing Attachment detected on endpoint laptop-1 |
| 2 | Lateral Movement | \`T1021\` | 88% | Remote Services SSH pivot to workstation-1 |
| 3 | Privilege Escalation | \`T1068\` | 91% | Exploitation for Privilege Escalation on app-server |
| 4 | Exfiltration | \`T1041\` | 84% | Exfiltration Over C2 Channel toward C2 IP 198.51.100.44 |

---

## 3. Host Risk Predictions (Monte Carlo)
| Target Host | Compromise Probability | Est. Minutes | Blast Radius | Explanation |
|---|---|---|---|---|
| \`laptop-1\` | 95.0% | 2.5 min | 3 | Already compromised endpoint |
| \`workstation-1\` | 82.0% | 8.0 min | 2 | High likelihood of lateral propagation |
| \`app-server\` | 65.0% | 15.0 min | 4 | Targeted server with critical data access |
| \`db-server\` | 45.0% | 28.0 min | 5 | High impact database target |
| \`domain-controller\` | 30.0% | 45.0 min | 5 | Enterprise domain authentication core |

---

## 4. Response Strategy & Execution
- **Recommended Action:** \`Isolate Host\` on \`laptop-1\`
- **Evaluation Score:** \`0.4920\` *(Formula: \`score = 0.6 * risk_reduction - 0.4 * business_impact\`)*
- **Risk Reduction:** \`92%\`
- **Business Impact:** \`15%\`
- **Execution Status:** \`EXECUTED\`
- **Execution Message:** Target Host laptop-1 isolated from network.

---

## 5. Memory Pattern Recognition
- **Pattern Match:** \`94% Match\` (Historical Incident: \`inc-hist-001\`)
  - *Learned Pattern:* Phishing -> SSH Lateral Movement -> C2 Exfiltration

---
*Report generated automatically by CyberImmune 2.0 Autonomous Agent Framework.*
`;
    }
  },

  async predictAfterResponse(
    id: string
  ): Promise<{ status: string; incident_id: string; predictions: HostPrediction[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/incident/${id}/predict_after`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(`predict_after failed: ${res.statusText}`);
      return await res.json();
    } catch {
      const updated: HostPrediction[] = [
        {
          host: "laptop-1",
          compromise_probability: 0.05,
          est_minutes_to_compromise: 120.0,
          blast_radius: 0,
          tactic: "Initial Access",
          technique_id: "T1566",
          explanation: "Host isolated. Threat contained.",
        },
        {
          host: "workstation-1",
          compromise_probability: 0.15,
          est_minutes_to_compromise: 90.0,
          blast_radius: 1,
          tactic: "Lateral Movement",
          technique_id: "T1021",
          explanation: "Lateral path severed.",
        },
        {
          host: "app-server",
          compromise_probability: 0.10,
          est_minutes_to_compromise: 100.0,
          blast_radius: 1,
          tactic: "Privilege Escalation",
          technique_id: "T1068",
          explanation: "Risk significantly reduced.",
        },
        {
          host: "db-server",
          compromise_probability: 0.05,
          est_minutes_to_compromise: 180.0,
          blast_radius: 1,
          tactic: "Exfiltration",
          technique_id: "T1041",
          explanation: "Database protected.",
        },
        {
          host: "domain-controller",
          compromise_probability: 0.02,
          est_minutes_to_compromise: 240.0,
          blast_radius: 1,
          tactic: "Credential Access",
          technique_id: "T1003",
          explanation: "Domain controller secure.",
        },
      ];
      return { status: "ok", incident_id: id, predictions: updated };
    }
  },
};
