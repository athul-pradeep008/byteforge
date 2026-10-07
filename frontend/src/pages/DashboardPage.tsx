import { useState, useCallback, useEffect } from "react";
import { Header } from "../components/Header";
import { ControlBar } from "../components/ControlBar";
import { AgentPipeline } from "../components/AgentPipeline";
import { ErrorBanner } from "../components/ErrorBanner";
import { NetworkGraph } from "../components/NetworkGraph";
import { EventFeed } from "../components/EventFeed";
import { AttackTimeline } from "../components/AttackTimeline";
import { PredictionPanel } from "../components/PredictionPanel";
import { ResponseCards } from "../components/ResponseCards";
import { MemoryPanel } from "../components/MemoryPanel";
import { AuditLogDrawer } from "../components/AuditLog";
import { useToast } from "../components/Toast";
import { useEventStream } from "../hooks/useEventStream";
import { useIncident } from "../hooks/useIncident";
import { apiClient } from "../api/client";
import { Network } from "lucide-react";

const DEFAULT_INCIDENT = "inc-001";

export function DashboardPage() {
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);
  const [isAuditOpen, setIsAuditOpen] = useState<boolean>(false);
  const [isDismissedBanner, setIsDismissedBanner] = useState<boolean>(false);

  const { addToast } = useToast();

  const {
    isError,
    events,
    anomalies,
    agentSteps,
    attackChain,
    predictions,
    clearStream,
  } = useEventStream();

  const {
    incident,
    predictionsAfter,
    approvedHost,
    setApprovedHost,
  } = useIncident(activeIncidentId);

  const isDisconnected = (!isBackendOnline || isError) && !isDismissedBanner;

  // Toast triggers for live SSE events
  useEffect(() => {
    if (anomalies.length > 0) {
      const latest = anomalies[anomalies.length - 1];
      addToast(
        "Network Anomaly Detected",
        `Host ${latest.source || "Node"}: ${latest.reason} (Score: ${latest.anomaly_score.toFixed(2)})`,
        "warning"
      );
    }
  }, [anomalies.length]);

  useEffect(() => {
    if (attackChain.length > 0) {
      const latest = attackChain[attackChain.length - 1];
      addToast(
        "Attack Chain Updated",
        `Technique ${latest.technique_id} mapped with ${(latest.confidence * 100).toFixed(0)}% confidence`,
        "attack"
      );
    }
  }, [attackChain.length]);

  // Handle simulation start triggers
  const handleSimStart = useCallback(
    async (mode: string) => {
      if (mode === "variant") {
        setActiveIncidentId("inc-variant-001");
        addToast("Variant Attack Simulation Launched", "Episodic memory monitoring for Stage 1 match...", "attack");
        await apiClient.triggerVariant();
      } else if (mode === "attack") {
        setActiveIncidentId(DEFAULT_INCIDENT);
        addToast("Attack Simulation Launched", "Multi-stage ATT&CK chain initiated...", "attack");
        await apiClient.triggerAttack();
      } else {
        addToast("Normal Traffic Simulation Active", "Monitored 6 topology hosts running baseline traffic.", "info");
        await apiClient.triggerNormal();
      }
    },
    [addToast]
  );

  // Called by ResponseCards after approval
  const handleApproved = useCallback(
    async (isolatedHost: string | null) => {
      setApprovedHost(isolatedHost);
      addToast(
        "Response Action Executed",
        `Target Host ${isolatedHost || "Network"} isolated. Link severed in topology.`,
        "success"
      );
    },
    [setApprovedHost, addToast]
  );

  const handleRejected = useCallback(() => {
    addToast("Response Action Rejected", "Action declined by SOC analyst. Monitoring continues.", "warning");
  }, [addToast]);

  const responseOptions = incident?.strategist_options ?? [];
  const memoryMatches = incident?.memory_matches ?? [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black pb-16">
      {/* 1. Header */}
      <Header
        onHealthStatusChange={(online) => setIsBackendOnline(online)}
        onOpenAuditLog={() => setIsAuditOpen(true)}
      />

      {/* Audit Drawer */}
      <AuditLogDrawer isOpen={isAuditOpen} onClose={() => setIsAuditOpen(false)} />

      <main className="max-w-[1900px] mx-auto px-6 pt-6 space-y-6">
        {/* 2. Error Banner */}
        {isDisconnected && (
          <ErrorBanner
            message="Connection to ByteForge backend lost. Ensure FastAPI is running on http://localhost:8000."
            onRetry={() => window.location.reload()}
            onDismiss={() => setIsDismissedBanner(true)}
          />
        )}

        {/* 3. ControlBar */}
        <ControlBar
          onSimulationStart={(mode) => {
            handleSimStart(mode);
          }}
          onReset={() => {
            clearStream();
            setActiveIncidentId(null);
            setApprovedHost(null);
            addToast("Simulation Reset", "Cleared streams and reset active topology state.", "info");
          }}
        />

        {/* 4. Agent Pipeline Strip */}
        <AgentPipeline agentSteps={agentSteps} />

        {/* ── Row 1: Network Graph + Attack Timeline ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6">
          {/* Network Graph */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden h-[500px] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/50 shrink-0">
              <h3 className="text-base font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Network className="w-5 h-5 text-cyan-400" />
                Network Topology
              </h3>
              <div className="flex items-center gap-3 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  Healthy
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Suspicious
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  Compromised
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Isolated
                </span>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <NetworkGraph
                events={events}
                anomalies={anomalies}
                predictions={predictions}
                isolatedHost={approvedHost}
              />
            </div>
          </div>

          {/* Attack Timeline */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden h-[500px] flex flex-col">
            <AttackTimeline attackChain={attackChain} />
          </div>
        </div>

        {/* ── Row 2: Event Feed + Prediction Panel ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_480px] gap-6">
          {/* Event Feed */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden h-[440px] flex flex-col">
            <EventFeed events={events} anomalies={anomalies} />
          </div>

          {/* Prediction Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden h-[440px] flex flex-col">
            <PredictionPanel
              predictions={predictions}
              predictionsAfter={predictionsAfter}
            />
          </div>
        </div>

        {/* ── Row 3: Response Cards + Memory Panel ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
          {/* Response Cards */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[420px] flex flex-col">
            <ResponseCards
              options={responseOptions}
              incidentId={activeIncidentId ?? DEFAULT_INCIDENT}
              onApproved={handleApproved}
              onRejected={handleRejected}
            />
          </div>

          {/* Memory Panel */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden min-h-[420px] flex flex-col">
            <MemoryPanel memoryMatches={memoryMatches} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
