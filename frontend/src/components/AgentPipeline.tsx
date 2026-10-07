import React from "react";
import {
  Radio,
  Brain,
  TrendingUp,
  Sliders,
  ShieldCheck,
  Database,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { AgentStep, AgentStatusType } from "../types";

interface AgentPipelineProps {
  agentSteps: AgentStep[];
}

interface AgentConfig {
  id: string;
  name: string;
  role: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AGENTS: AgentConfig[] = [
  {
    id: "SensorAgent",
    name: "Sensor Agent",
    role: "Anomaly Detection",
    icon: Radio,
  },
  {
    id: "AnalystAgent",
    name: "Analyst Agent",
    role: "ATT&CK Mapping",
    icon: Brain,
  },
  {
    id: "PredictorAgent",
    name: "Predictor Agent",
    role: "Risk Forecasting",
    icon: TrendingUp,
  },
  {
    id: "StrategistAgent",
    name: "Strategist Agent",
    role: "Response Scoring",
    icon: Sliders,
  },
  {
    id: "ResponderAgent",
    name: "Responder Agent",
    role: "Approval & Execution",
    icon: ShieldCheck,
  },
  {
    id: "MemoryAgent",
    name: "Memory Agent",
    role: "Pattern Recognition",
    icon: Database,
  },
];

export const AgentPipeline: React.FC<AgentPipelineProps> = ({ agentSteps }) => {
  // Compute current status for each agent from agentSteps
  const getAgentStatus = (agentId: string): { status: AgentStatusType; lastResult?: string } => {
    const stepsForAgent = agentSteps.filter((s) => s.agent_name === agentId);
    if (stepsForAgent.length === 0) {
      return { status: "idle" };
    }
    const latest = stepsForAgent[stepsForAgent.length - 1];
    return {
      status: "done",
      lastResult: latest.result,
    };
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <h2 className="text-lg font-extrabold tracking-wider text-slate-100 uppercase flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          Autonomous Agent Pipeline
        </h2>
        <span className="text-xs text-slate-400 font-semibold">
          6 Core Multi-Agent Modules
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const { status, lastResult } = getAgentStatus(agent.id);

          let borderStyle = "border-slate-800 bg-slate-950/60";
          let iconColor = "text-slate-500";
          let badgeColor = "bg-slate-800 text-slate-400";
          let statusText = "IDLE";

          if (status === "working") {
            borderStyle = "border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.25)] animate-pulse";
            iconColor = "text-cyan-400";
            badgeColor = "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300";
            statusText = "WORKING";
          } else if (status === "done") {
            borderStyle = "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
            iconColor = "text-emerald-400";
            badgeColor = "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400";
            statusText = "DONE";
          } else if (status === "error") {
            borderStyle = "border-rose-500/50 bg-rose-500/10";
            iconColor = "text-rose-400";
            badgeColor = "bg-rose-500/20 border border-rose-500/40 text-rose-400";
            statusText = "ERROR";
          }

          return (
            <div
              key={agent.id}
              className={`p-4 rounded-xl border transition-all duration-300 flex flex-col justify-between ${borderStyle}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${badgeColor}`}
                  >
                    {status === "working" && <Loader2 className="w-3 h-3 animate-spin" />}
                    {status === "done" && <CheckCircle2 className="w-3 h-3" />}
                    {status === "error" && <AlertCircle className="w-3 h-3" />}
                    {statusText}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                  {agent.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {agent.role}
                </p>
              </div>

              {lastResult && (
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                    {lastResult}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
