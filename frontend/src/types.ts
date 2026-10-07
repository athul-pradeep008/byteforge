export interface TelemetryEvent {
  event_id: string;
  timestamp: string;
  source: string;
  src_ip?: string;
  event_type: string;
  user?: string;
  details: Record<string, any>;
  is_attack?: boolean;
  stage?: string;
  stage_order?: number;
}

export interface Anomaly {
  event_id: string;
  timestamp: string;
  source: string;
  event_type: string;
  user?: string;
  anomaly_score: number;
  detectors: string[];
  reason: string;
  is_attack?: boolean;
  stage?: string;
  stage_order?: number;
}

export interface AttackStep {
  tactic: string;
  technique_id: string;
  confidence: number;
  timestamp: string;
  explanation: string;
}

export interface HostPrediction {
  host: string;
  compromise_probability: number;
  est_minutes_to_compromise: number;
  blast_radius: number;
  tactic: string;
  technique_id: string;
  explanation: string;
}

export interface ResponseOptionDetail {
  id: string;
  action: string;
  target: string;
  risk_reduction: number;
  business_impact: number;
  score: number;
  time_to_execute: string;
  risk_level: string;
  description: string;
  rationale: string;
  is_recommended?: boolean;
}

export interface MemoryMatch {
  past_incident_id: string;
  similarity_score: number;
  learned_pattern: string;
  match_label: string;
  matched_stage_1?: boolean;
}

export interface AgentStep {
  agent_name: string;
  action: string;
  result: string;
  timestamp: string;
  details?: Record<string, any>;
}

export type AgentStatusType = "idle" | "working" | "done" | "error";

export interface AgentState {
  name: string;
  role: string;
  status: AgentStatusType;
  lastAction?: string;
  timestamp?: string;
}

export interface Incident {
  id: string;
  status: string;
  anomalies: Anomaly[];
  attack_chain: AttackStep[];
  predictions: HostPrediction[];
  strategist_options: ResponseOptionDetail[];
  recommended_option?: ResponseOptionDetail;
  response_result?: Record<string, any>;
  memory_matches: MemoryMatch[];
  agent_steps: AgentStep[];
}

export interface AuditLogEntry {
  timestamp: string;
  incident_id: string;
  action: string;
  target: string;
  status: string;
  executed_by: string;
  business_impact: number;
  risk_level: string;
  details: Record<string, any>;
}
