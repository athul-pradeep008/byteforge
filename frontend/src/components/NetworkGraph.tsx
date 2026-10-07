import React, { useCallback, useMemo } from "react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { TelemetryEvent, Anomaly, HostPrediction } from "../types";

// ─── Node status type ────────────────────────────────────────────────────────
type HostStatus = "healthy" | "suspicious" | "compromised" | "isolated";

function getHostStatus(
  host: string,
  anomalies: Anomaly[],
  predictions: HostPrediction[],
  isolatedHost: string | null
): HostStatus {
  if (isolatedHost && host === isolatedHost) return "isolated";

  const isCompromised = anomalies.some(
    (a) => a.source === host && (a.anomaly_score ?? 0) > 0.8
  );
  if (isCompromised) return "compromised";

  const pred = predictions.find((p) => p.host === host);
  if (pred && pred.compromise_probability > 0.4) return "suspicious";

  const hasAny = anomalies.some((a) => a.source === host);
  if (hasAny) return "suspicious";

  return "healthy";
}

// ─── Custom host node ─────────────────────────────────────────────────────────
function HostNode({ data }: NodeProps) {
  const { label, role, status, ip, probability } = data as {
    label: string;
    role: string;
    status: HostStatus;
    ip: string;
    probability?: number;
  };

  const styles: Record<HostStatus, { border: string; glow: string; dot: string; text: string }> = {
    healthy: {
      border: "border-emerald-500/60",
      glow: "shadow-[0_0_18px_rgba(16,185,129,0.4)]",
      dot: "bg-emerald-400",
      text: "text-emerald-300",
    },
    suspicious: {
      border: "border-amber-400/70",
      glow: "shadow-[0_0_22px_rgba(251,191,36,0.45)]",
      dot: "bg-amber-400 animate-pulse",
      text: "text-amber-300",
    },
    compromised: {
      border: "border-rose-500",
      glow: "shadow-[0_0_30px_rgba(244,63,94,0.7)]",
      dot: "bg-rose-500 animate-ping",
      text: "text-rose-300",
    },
    isolated: {
      border: "border-slate-400/60",
      glow: "shadow-[0_0_16px_rgba(148,163,184,0.3)]",
      dot: "bg-slate-400",
      text: "text-slate-300",
    },
  };

  const s = styles[status];

  return (
    <div
      className={`
        relative w-44 bg-slate-900/95 backdrop-blur border-2 rounded-xl px-3 py-2.5
        transition-all duration-500 select-none
        ${s.border} ${s.glow}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-slate-600 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-600 !w-2 !h-2" />

      {/* Status dot */}
      <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${s.dot}`} />

      {/* Label */}
      <p className={`font-extrabold text-sm tracking-wide ${s.text}`}>{label}</p>
      <p className="text-xs text-slate-400 font-medium">{role}</p>
      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{ip}</p>

      {/* Isolated badge */}
      {status === "isolated" && (
        <div className="mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit bg-slate-700/60 text-slate-300 border border-slate-600">
          🔒 ISOLATED
        </div>
      )}

      {/* Risk badge */}
      {probability !== undefined && probability > 0 && status !== "isolated" && (
        <div className={`mt-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md w-fit ${
          status === "compromised"
            ? "bg-rose-500/20 text-rose-300"
            : status === "suspicious"
            ? "bg-amber-500/15 text-amber-300"
            : "bg-emerald-500/10 text-emerald-400"
        }`}>
          Risk: {(probability * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
}

const nodeTypes = { hostNode: HostNode };

// ─── Static layout of 6 hosts ─────────────────────────────────────────────────
const HOST_LAYOUT = [
  { id: "laptop-1",         role: "Endpoint",          ip: "192.168.1.101", x: 60,  y: 60  },
  { id: "laptop-2",         role: "Endpoint",          ip: "192.168.1.102", x: 60,  y: 220 },
  { id: "workstation-1",    role: "Workstation",       ip: "192.168.1.105", x: 320, y: 60  },
  { id: "app-server",       role: "Application Server",ip: "10.0.1.10",    x: 320, y: 220 },
  { id: "db-server",        role: "Database Server",   ip: "10.0.2.20",    x: 580, y: 140 },
  { id: "domain-controller",role: "Domain Controller", ip: "10.0.0.1",     x: 580, y: 300 },
];

// Static edges derived from the attack graph
const STATIC_EDGES: Array<{ source: string; target: string }> = [
  { source: "laptop-1",         target: "workstation-1" },
  { source: "laptop-1",         target: "app-server" },
  { source: "laptop-2",         target: "workstation-1" },
  { source: "laptop-2",         target: "app-server" },
  { source: "workstation-1",    target: "domain-controller" },
  { source: "workstation-1",    target: "db-server" },
  { source: "app-server",       target: "db-server" },
  { source: "domain-controller",target: "db-server" },
  { source: "domain-controller",target: "app-server" },
];

interface NetworkGraphProps {
  events: TelemetryEvent[];
  anomalies: Anomaly[];
  predictions: HostPrediction[];
  isolatedHost?: string | null;
}

export const NetworkGraph: React.FC<NetworkGraphProps> = ({
  anomalies,
  predictions,
  isolatedHost = null,
}) => {
  // Derive compromised / suspicious hosts from live data
  const compromisedHosts = useMemo(
    () => new Set(anomalies.filter((a) => (a.anomaly_score ?? 0) > 0.8).map((a) => a.source)),
    [anomalies]
  );

  const buildNodes = useCallback((): Node[] =>
    HOST_LAYOUT.map((h) => {
      const status = getHostStatus(h.id, anomalies, predictions, isolatedHost);
      const pred = predictions.find((p) => p.host === h.id);
      return {
        id: h.id,
        type: "hostNode",
        position: { x: h.x, y: h.y },
        data: {
          label: h.id,
          role: h.role,
          ip: h.ip,
          status,
          probability: pred?.compromise_probability,
        },
        draggable: true,
      };
    }),
    [anomalies, predictions, isolatedHost]
  );

  const buildEdges = useCallback((): Edge[] =>
    STATIC_EDGES.map((e) => {
      const isSeveredByCompromise =
        compromisedHosts.has(e.source) || compromisedHosts.has(e.target);
      const isSeveredByIsolation =
        isolatedHost !== null &&
        (e.source === isolatedHost || e.target === isolatedHost);
      const isSevered = isSeveredByCompromise || isSeveredByIsolation;
      const isActive =
        !isSeveredByIsolation &&
        anomalies.some((a) => a.source === e.source || a.source === e.target);

      return {
        id: `${e.source}->${e.target}`,
        source: e.source,
        target: e.target,
        animated: isActive && !isSevered,
        style: {
          stroke: isSeveredByIsolation
            ? "rgba(148,163,184,0.5)"
            : isSevered
            ? "rgba(244,63,94,0.6)"
            : isActive
            ? "rgba(251,191,36,0.7)"
            : "rgba(71,85,105,0.5)",
          strokeWidth: isSevered ? 1.5 : isActive ? 2.5 : 1.5,
          strokeDasharray: isSevered ? "6 4" : undefined,
          opacity: isSeveredByIsolation ? 0.4 : 1,
        },
      };
    }),
    [compromisedHosts, anomalies, isolatedHost]
  );

  const [, , onNodesChange] = useNodesState(buildNodes());
  const [, , onEdgesChange] = useEdgesState(buildEdges());

  // Update nodes/edges when live data changes
  const liveNodes = buildNodes();
  const liveEdges = buildEdges();

  return (
    <div className="relative w-full h-full bg-slate-950/80 rounded-xl overflow-hidden group">
      {/* Radar sweep ambient background */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-10">
        <div className="absolute -inset-[100%] animate-radar bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(6,182,212,0.8)_360deg)] rounded-full" />
      </div>

      <ReactFlow
        nodes={liveNodes}
        edges={liveEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.5}
        maxZoom={1.8}
        attributionPosition="bottom-right"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="rgba(71,85,105,0.25)"
        />
      </ReactFlow>
    </div>
  );
};
