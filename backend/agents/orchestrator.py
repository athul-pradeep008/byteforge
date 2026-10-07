from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from pydantic import BaseModel, Field

from backend.agents.sensor import SensorAgent
from backend.agents.analyst import AnalystAgent, AttackChainResponse
from backend.agents.predictor import PredictorAgent, HostPrediction
from backend.agents.strategist import StrategistAgent, StrategistResponse
from backend.agents.responder import ResponderAgent
from backend.agents.memory import MemoryAgent


class OrchestratorResult(BaseModel):
    incident_id: str
    status: str  # "IN_PROGRESS", "NEEDS_APPROVAL", "MITIGATED"
    anomalies: List[Dict[str, Any]] = Field(default_factory=list)
    attack_chain: List[Dict[str, Any]] = Field(default_factory=list)
    predictions: List[Dict[str, Any]] = Field(default_factory=list)
    strategist_options: List[Dict[str, Any]] = Field(default_factory=list)
    recommended_option: Optional[Dict[str, Any]] = None
    response_result: Optional[Dict[str, Any]] = None
    memory_matches: List[Dict[str, Any]] = Field(default_factory=list)
    agent_steps: List[Dict[str, Any]] = Field(default_factory=list)


class OrchestratorAgent:
    """
    OrchestratorAgent connects the multi-agent pipeline:
    Sensor -> Analyst -> Predictor -> Strategist -> Approval Check -> Responder -> Memory.
    Emits agent_step notifications at each phase transition.
    """

    def __init__(
        self,
        sensor: Optional[SensorAgent] = None,
        analyst: Optional[AnalystAgent] = None,
        predictor: Optional[PredictorAgent] = None,
        strategist: Optional[StrategistAgent] = None,
        responder: Optional[ResponderAgent] = None,
        memory: Optional[MemoryAgent] = None,
        step_callback: Optional[Callable[[str, Dict[str, Any]], Any]] = None,
    ):
        self.sensor = sensor or SensorAgent(random_state=42)
        self.analyst = analyst or AnalystAgent()
        self.predictor = predictor or PredictorAgent(seed=42)
        self.strategist = strategist or StrategistAgent()
        self.responder = responder or ResponderAgent()
        self.memory = memory or MemoryAgent()
        self.step_callback = step_callback

    def _emit_step(
        self, agent_name: str, action: str, result: str, details: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        step = {
            "agent_name": agent_name,
            "action": action,
            "result": result,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {},
        }
        if self.step_callback:
            try:
                self.step_callback("agent_step", step)
            except Exception:
                pass
        return step

    def run_pipeline(
        self,
        events_df: Any,
        incident_id: str = "inc-001",
        approved_by: Optional[str] = None,
        force_execute: bool = False,
    ) -> OrchestratorResult:
        """
        Executes end-to-end multi-agent security pipeline:
        Sensor -> Analyst -> Predictor -> Strategist -> Responder -> Memory
        """
        agent_steps: List[Dict[str, Any]] = []

        # 1. Sensor Agent: Detect Anomalies
        if not self.sensor.is_trained:
            self.sensor.train(events_df)

        df_anomalies = self.sensor.detect_anomalies(events_df)
        anomalies = (
            df_anomalies.to_dict(orient="records") if not df_anomalies.empty else []
        )

        s_step = self._emit_step(
            agent_name="SensorAgent",
            action="DETECT_ANOMALIES",
            result=f"Detected {len(anomalies)} telemetry anomalies.",
            details={"anomaly_count": len(anomalies)},
        )
        agent_steps.append(s_step)

        if not anomalies:
            return OrchestratorResult(
                incident_id=incident_id,
                status="NO_ANOMALIES_DETECTED",
                agent_steps=agent_steps,
            )

        # 2. Analyst Agent: Construct MITRE ATT&CK Chain
        chain_response: AttackChainResponse = self.analyst.analyze(
            anomalies, incident_id=incident_id
        )
        attack_chain_dicts = [step.model_dump(mode="json") for step in chain_response.chain]

        a_step = self._emit_step(
            agent_name="AnalystAgent",
            action="CONSTRUCT_ATTACK_CHAIN",
            result=f"Constructed {len(attack_chain_dicts)}-step ATT&CK chain (T1566, T1021, T1068, T1041).",
            details={"chain_length": len(attack_chain_dicts)},
        )
        agent_steps.append(a_step)

        # 3. Predictor Agent: Forecast Downstream Host Risk
        compromised_hosts = list(
            {str(a.get("source")) for a in anomalies if a.get("source")}
        )
        if not compromised_hosts:
            compromised_hosts = ["laptop-1"]

        predictions: List[HostPrediction] = self.predictor.predict(
            compromised_hosts=compromised_hosts
        )
        pred_dicts = [p.model_dump(mode="json") for p in predictions]

        p_step = self._emit_step(
            agent_name="PredictorAgent",
            action="FORECAST_RISK",
            result=f"Forecasted risk for {len(pred_dicts)} target hosts.",
            details={"compromised_sources": compromised_hosts},
        )
        agent_steps.append(p_step)

        # 4. Strategist Agent: Evaluate Response Options & Score Formula
        target_host = compromised_hosts[0]
        victim_user = str(anomalies[0].get("user", "alice"))
        strategist_resp: StrategistResponse = (
            self.strategist.evaluate_response_options(
                anomalies=anomalies, target_host=target_host, victim_user=victim_user
            )
        )
        opt_dicts = [o.model_dump(mode="json") for o in strategist_resp.options]
        rec_option = next(
            (o for o in opt_dicts if o["id"] == strategist_resp.recommended_option_id),
            opt_dicts[0],
        )

        st_step = self._emit_step(
            agent_name="StrategistAgent",
            action="EVALUATE_RESPONSES",
            result=f"Recommended action '{rec_option['action']}' (Score: {rec_option['score']:.4f}).",
            details={"scoring_formula": strategist_resp.scoring_formula},
        )
        agent_steps.append(st_step)

        # 5. Responder Agent: Human Approval Check & State Change Execution
        response_result = self.responder.execute_response(
            option_detail=rec_option,
            incident_id=incident_id,
            approved_by=approved_by,
            force_execute=force_execute,
        )

        r_step = self._emit_step(
            agent_name="ResponderAgent",
            action="EXECUTE_RESPONSE",
            result=response_result["message"],
            details={
                "status": response_result["status"],
                "requires_approval": response_result["requires_approval"],
            },
        )
        agent_steps.append(r_step)

        # 6. Memory Agent: Pattern Matching & Signature Recognition
        memory_matches = self.memory.match_incident(anomalies)

        m_step = self._emit_step(
            agent_name="MemoryAgent",
            action="PATTERN_MATCH",
            result=f"Found {len(memory_matches)} pattern match(es). Top match: {memory_matches[0]['match_label'] if memory_matches else 'None'}.",
            details={"matches_count": len(memory_matches)},
        )
        agent_steps.append(m_step)

        final_status = (
            "NEEDS_APPROVAL"
            if response_result["status"] == "PENDING_APPROVAL"
            else "MITIGATED"
        )

        return OrchestratorResult(
            incident_id=incident_id,
            status=final_status,
            anomalies=anomalies,
            attack_chain=attack_chain_dicts,
            predictions=pred_dicts,
            strategist_options=opt_dicts,
            recommended_option=rec_option,
            response_result=response_result,
            memory_matches=memory_matches,
            agent_steps=agent_steps,
        )
