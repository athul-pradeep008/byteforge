import asyncio
import json
from datetime import datetime
from typing import AsyncGenerator, Dict, List, Set, Any, Optional
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, Response

import importlib

try:
    _dotenv = importlib.import_module("dotenv")
    _dotenv.load_dotenv()
except Exception:
    pass

from backend.simulator.attack_simulator import AttackSimulator
from backend.simulator.csv_loader import load_cyberimmune_csv
from backend.agents.sensor import SensorAgent
from backend.agents.analyst import AnalystAgent
from backend.agents.predictor import PredictorAgent
from backend.agents.strategist import StrategistAgent
from backend.agents.responder import ResponderAgent
from backend.agents.memory import MemoryAgent
from backend.agents.orchestrator import OrchestratorAgent, OrchestratorResult
from backend.db.database import init_db

app = FastAPI(title="CyberImmune 2.0 API")

@app.on_event("startup")
def on_startup():
    try:
        init_db()
    except Exception as e:
        print(f"[DB] Database initialization error: {e}")

# Configure CORS for localhost development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EventBus:
    """In-memory event bus managing SSE subscriptions, incidents, and audit logs."""

    def __init__(self):
        self.subscribers: Set[asyncio.Queue] = set()
        self.simulator = AttackSimulator(seed=42)
        self.sensor = SensorAgent(random_state=42)
        self.responder = ResponderAgent()
        self.memory = MemoryAgent()
        self.orchestrator = OrchestratorAgent(step_callback=self.sync_broadcast_step)
        self.sensor.train(self.simulator.generate_normal_events(count=200))
        self.is_running = False
        self.incidents: Dict[str, Dict[str, Any]] = {}

    def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self.subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue) -> None:
        self.subscribers.discard(queue)

    async def broadcast(self, event_type: str, data: Any) -> None:
        """Broadcasts SSE message formatted as event: <type>\\ndata: <json>\\n\\n."""
        formatted_sse = f"event: {event_type}\ndata: {json.dumps(data, default=str)}\n\n"
        for queue in list(self.subscribers):
            await queue.put(formatted_sse)

    def sync_broadcast_step(self, event_type: str, data: Any) -> None:
        formatted_sse = f"event: {event_type}\ndata: {json.dumps(data, default=str)}\n\n"
        for queue in list(self.subscribers):
            try:
                queue.put_nowait(formatted_sse)
            except Exception:
                pass

    def reset(self) -> None:
        self.simulator = AttackSimulator(seed=42)
        self.sensor = SensorAgent(random_state=42)
        self.sensor.train(self.simulator.generate_normal_events(count=200))
        self.responder.clear_audit_log()
        self.is_running = False
        self.incidents.clear()
        self.sync_broadcast_step("reset", {"status": "reset", "timestamp": datetime.utcnow().isoformat()})


event_bus = EventBus()


def generate_markdown_report(incident_data: Dict[str, Any]) -> str:
    inc_id = incident_data.get("id", "inc-001")
    status = incident_data.get("status", "MITIGATED")
    anomalies = incident_data.get("anomalies", [])
    attack_chain = incident_data.get("attack_chain", [])
    predictions = incident_data.get("predictions", [])
    recommended = incident_data.get("recommended_option") or {}
    response = incident_data.get("response_result") or {}
    memory_matches = incident_data.get("memory_matches", [])

    md = f"""# CyberImmune 2.0 - Incident Response Report

**Incident ID:** `{inc_id}`  
**Status:** `{status}`  
**Generated At:** `{datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")}`  
**Environment:** SIMULATED  

---

## 1. Executive Summary
Anomalous activity detected across network and host telemetry. The CyberImmune autonomous multi-agent pipeline processed **{len(anomalies)}** telemetry anomalies, constructed a **{len(attack_chain)}**-stage MITRE ATT&CK chain, and evaluated risk forecasting across target hosts.

---

## 2. MITRE ATT&CK Chain
| Stage | Tactic | Technique ID | Confidence | Explanation |
|---|---|---|---|---|
"""
    for idx, step in enumerate(attack_chain, 1):
        md += f"| {idx} | {step.get('tactic', 'N/A')} | `{step.get('technique_id', 'N/A')}` | {float(step.get('confidence', 0))*100:.0f}% | {step.get('explanation', '')} |\n"

    md += """
---

## 3. Host Risk Predictions (Monte Carlo)
| Target Host | Compromise Probability | Est. Minutes | Blast Radius | Explanation |
|---|---|---|---|---|
"""
    for pred in predictions:
        md += f"| `{pred.get('host')}` | {float(pred.get('compromise_probability', 0))*100:.1f}% | {pred.get('est_minutes_to_compromise')} min | {pred.get('blast_radius')} | {pred.get('explanation')} |\n"

    md += f"""
---

## 4. Response Strategy & Execution
- **Recommended Action:** `{recommended.get('action', 'N/A')}` on `{recommended.get('target', 'N/A')}`
- **Evaluation Score:** `{recommended.get('score', 0):.4f}` *(Formula: `score = 0.6 * risk_reduction - 0.4 * business_impact`)*
- **Risk Reduction:** `{recommended.get('risk_reduction', 0)*100:.0f}%`
- **Business Impact:** `{recommended.get('business_impact', 0)*100:.0f}%`
- **Execution Status:** `{response.get('status', 'PENDING_APPROVAL')}`
- **Execution Message:** {response.get('message', 'Awaiting approval')}

---

## 5. Memory Pattern Recognition
"""
    if memory_matches:
        for m in memory_matches:
            md += f"- **Pattern Match:** `{m.get('match_label')}` (Historical Incident: `{m.get('past_incident_id')}`)\n  - *Learned Pattern:* {m.get('learned_pattern')}\n"
    else:
        md += "- No prior historical incident signature matched.\n"

    md += "\n---\n*Report generated automatically by CyberImmune 2.0 Autonomous Agent Framework.*\n"
    return md


async def run_simulation_stream(
    include_attack: bool = False,
    variant: bool = False,
    use_dataset: bool = False,
    incident_id: str = "inc-001",
) -> None:
    """Streams generated telemetry and runs the OrchestratorAgent pipeline."""
    event_bus.is_running = True

    if use_dataset:
        df = load_cyberimmune_csv("backend/data/cyberimmune_dataset.csv", limit=60)
    elif variant:
        df = event_bus.simulator.generate_full_dataset(
            normal_count=40, include_attack=True, attack_variant=True
        )
    elif include_attack:
        df = event_bus.simulator.generate_full_dataset(
            normal_count=40, include_attack=True, attack_variant=False
        )
    else:
        df = event_bus.simulator.generate_normal_events(count=50)

    # Run complete multi-agent orchestrator pipeline
    result: OrchestratorResult = event_bus.orchestrator.run_pipeline(
        events_df=df, incident_id=incident_id
    )

    inc_dict = result.model_dump(mode="json")
    inc_dict["id"] = incident_id
    event_bus.incidents[incident_id] = inc_dict

    records = df.to_dict(orient="records")
    anomalies_by_id = {str(a["event_id"]): a for a in result.anomalies}

    batch_size = 5
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        await event_bus.broadcast("events", batch)

        batch_anomalies = [
            anomalies_by_id[str(evt["event_id"])]
            for evt in batch
            if str(evt.get("event_id")) in anomalies_by_id
        ]

        if batch_anomalies:
            await event_bus.broadcast("anomalies", batch_anomalies)

        await asyncio.sleep(0.3)

    if result.attack_chain:
        await event_bus.broadcast("chain_update", result.attack_chain)
    if result.predictions:
        await event_bus.broadcast("prediction", result.predictions)

    event_bus.is_running = False


@app.get("/api/health")
def health_check():
    return {"status": "ok", "environment": "SIMULATED"}


@app.get("/api/health/llm_test")
def test_llm_connection():
    import os, time
    provider = os.getenv("LLM_PROVIDER", "none").lower()
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    if provider == "none" or not gemini_key:
        return {
            "status": "error",
            "provider": provider,
            "message": "LLM Provider is set to 'none' or GEMINI_API_KEY is missing in .env"
        }
    
    start_time = time.time()
    try:
        genai = importlib.import_module("google.generativeai")
        genai.configure(api_key=gemini_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        res = model.generate_content("Ping test. Reply: PONG")
        elapsed = time.time() - start_time
        return {
            "status": "connected",
            "provider": provider,
            "response_time_sec": round(elapsed, 2),
            "model_reply": res.text.strip(),
            "message": "API key successfully verified and connected to Gemini!"
        }
    except Exception as e:
        elapsed = time.time() - start_time
        return {
            "status": "failed",
            "provider": provider,
            "response_time_sec": round(elapsed, 2),
            "error": str(e),
            "message": "Failed to connect to Gemini API with current API key"
        }


@app.get("/api/health/preflight")
def preflight_health_check():
    import os
    # 1. Check API Status
    api_ok = True
    api_msg = "FastAPI backend running and responsive"

    # 2. Check LLM Cache
    cache_dir = "backend/data/cache"
    cache_exists = os.path.exists(cache_dir)
    cache_files = os.listdir(cache_dir) if cache_exists else []
    cache_ok = cache_exists and len(cache_files) > 0
    cache_msg = (
        f"LLM Cache active with {len(cache_files)} pre-seeded template(s)"
        if cache_ok
        else "LLM Cache missing or unpopulated"
    )

    # 3. Check Seeded Memory
    sigs = event_bus.memory.load_signatures()
    memory_ok = len(sigs) > 0 and "inc-hist-001" in sigs
    memory_msg = (
        f"Memory pre-seeded with {len(sigs)} baseline signature(s) ('inc-hist-001' active)"
        if memory_ok
        else "Seeded memory missing baseline signatures"
    )

    # 4. Check SSE Stream Readiness
    sse_ok = True
    sse_msg = f"SSE stream active with {len(event_bus.subscribers)} active listener(s)"

    overall_green = api_ok and cache_ok and memory_ok and sse_ok

    return {
        "status": "ok" if overall_green else "degraded",
        "overall_green": overall_green,
        "checks": {
            "api": {"pass": api_ok, "message": api_msg},
            "cache": {"pass": cache_ok, "message": cache_msg, "file_count": len(cache_files)},
            "seeded_memory": {"pass": memory_ok, "message": memory_msg, "signature_count": len(sigs)},
            "sse": {"pass": sse_ok, "message": sse_msg, "subscriber_count": len(event_bus.subscribers)},
        },
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/api/reset")
def reset_simulation():
    event_bus.reset()
    return {"status": "reset", "message": "Simulation state reset successfully"}


@app.post("/api/simulate/normal")
async def simulate_normal(background_tasks: BackgroundTasks):
    background_tasks.add_task(
        run_simulation_stream, include_attack=False, variant=False
    )
    return {
        "status": "started",
        "mode": "normal",
        "message": "Normal traffic simulation initiated",
    }


@app.post("/api/simulate/attack")
async def simulate_attack(background_tasks: BackgroundTasks):
    background_tasks.add_task(
        run_simulation_stream, include_attack=True, variant=False, incident_id="inc-001"
    )
    return {
        "status": "started",
        "mode": "attack",
        "message": "4-Stage Attack simulation initiated",
    }


@app.post("/api/simulate/variant")
async def simulate_variant(background_tasks: BackgroundTasks):
    background_tasks.add_task(
        run_simulation_stream, include_attack=True, variant=True, incident_id="inc-variant-001"
    )
    return {
        "status": "started",
        "mode": "variant",
        "message": "Variant Attack simulation initiated",
    }


@app.post("/api/simulate/dataset")
async def simulate_dataset(background_tasks: BackgroundTasks):
    background_tasks.add_task(
        run_simulation_stream, include_attack=True, use_dataset=True, incident_id="inc-dataset-001"
    )
    return {
        "status": "started",
        "mode": "dataset",
        "message": "Custom CSV Dataset (cyberimmune_dataset.csv) simulation initiated",
    }


@app.get("/api/stream")
async def sse_stream():
    queue = event_bus.subscribe()

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            yield f"event: ping\ndata: {json.dumps({'status': 'connected'})}\n\n"
            while True:
                data = await queue.get()
                yield data
        except asyncio.CancelledError:
            event_bus.unsubscribe(queue)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/audit")
def get_audit_logs():
    """Returns all recorded audit log entries."""
    logs = event_bus.responder.read_audit_log()
    return {"count": len(logs), "audit_logs": logs}


@app.get("/api/incident/{incident_id}")
def get_incident(incident_id: str):
    """Returns complete state of an incident."""
    inc = event_bus.incidents.get(incident_id)
    if not inc:
        # Fallback to demo incident if requested
        sim = AttackSimulator(seed=42)
        df = sim.generate_full_dataset(normal_count=100, include_attack=True)
        res = event_bus.orchestrator.run_pipeline(events_df=df, incident_id=incident_id)
        inc = res.model_dump(mode="json")
        inc["id"] = incident_id
        event_bus.incidents[incident_id] = inc
    return inc


@app.post("/api/incident/{incident_id}/approve")
def approve_incident_response(incident_id: str, approved_by: str = "SOC_Analyst_1"):
    """Approves pending response action for an incident."""
    inc = event_bus.incidents.get(incident_id)
    if not inc:
        # Generate incident first if not present
        get_incident(incident_id)
        inc = event_bus.incidents[incident_id]

    rec_opt = inc.get("recommended_option") or {
        "id": "resp-001",
        "action": "Isolate Host",
        "target": "laptop-1",
        "business_impact": 0.25,
        "risk_level": "MEDIUM",
        "score": 0.44,
        "rationale": "Isolate host from network",
    }

    resp_result = event_bus.responder.execute_response(
        option_detail=rec_opt,
        incident_id=incident_id,
        approved_by=approved_by,
        force_execute=True,
    )

    inc["status"] = "MITIGATED"
    inc["response_result"] = resp_result
    event_bus.incidents[incident_id] = inc

    event_bus.sync_broadcast_step(
        "agent_step",
        {
            "agent_name": "ResponderAgent",
            "action": "APPROVAL_GRANTED",
            "result": f"Response approved by {approved_by} and executed on {rec_opt.get('target')}.",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return {
        "status": "approved",
        "incident_id": incident_id,
        "approved_by": approved_by,
        "response_result": resp_result,
    }


@app.post("/api/incident/{incident_id}/reject")
def reject_incident_response(incident_id: str, rejected_by: str = "SOC_Analyst_1"):
    """Rejects pending response action for an incident."""
    inc = event_bus.incidents.get(incident_id)
    if not inc:
        get_incident(incident_id)
        inc = event_bus.incidents[incident_id]

    inc["status"] = "REJECTED"
    rec_opt = inc.get("recommended_option") or {}

    entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "incident_id": incident_id,
        "action": str(rec_opt.get("action", "Isolate Host")),
        "target": str(rec_opt.get("target", "laptop-1")),
        "status": "REJECTED",
        "executed_by": rejected_by,
        "business_impact": float(rec_opt.get("business_impact", 0.25)),
        "risk_level": str(rec_opt.get("risk_level", "MEDIUM")),
        "details": {"message": f"Response action rejected by {rejected_by}."},
    }
    event_bus.responder.log_audit(
        type(
            "AuditLogEntry",
            (),
            {"model_dump": lambda self: entry},
        )()
    )

    event_bus.sync_broadcast_step(
        "agent_step",
        {
            "agent_name": "ResponderAgent",
            "action": "APPROVAL_REJECTED",
            "result": f"Response action rejected by {rejected_by}.",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )

    return {
        "status": "rejected",
        "incident_id": incident_id,
        "rejected_by": rejected_by,
    }


@app.get("/api/incident/{incident_id}/report")
def get_incident_report(incident_id: str):
    """Returns markdown formatted incident response report."""
    inc = get_incident(incident_id)
    report_md = generate_markdown_report(inc)
    return Response(content=report_md, media_type="text/markdown")


@app.post("/api/incident/{incident_id}/predict_after")
def predict_after_response(incident_id: str):
    """
    Runs PredictorAgent.predict_after() with the approved recommended response
    option and streams the updated risk predictions via SSE.
    """
    inc = event_bus.incidents.get(incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found")

    rec_opt = inc.get("recommended_option") or {}
    anomalies = inc.get("anomalies", [])

    # Derive compromised hosts from anomalies (high score = compromised)
    compromised = list({
        a["source"]
        for a in anomalies
        if isinstance(a, dict) and float(a.get("anomaly_score", 0)) > 0.8
    })
    if not compromised:
        compromised = ["laptop-1"]

    predictor = PredictorAgent(seed=42, n_runs=500)
    updated_preds = predictor.predict_after(
        response=rec_opt,
        compromised_hosts=compromised,
        seed=42,
        n_runs=500,
    )
    preds_json = [p.model_dump() for p in updated_preds]

    # Broadcast updated predictions via SSE
    event_bus.sync_broadcast_step("prediction", preds_json)

    return {"status": "ok", "incident_id": incident_id, "predictions": preds_json}

