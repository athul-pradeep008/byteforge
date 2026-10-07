import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronRight, ShieldAlert } from "lucide-react";
import { AttackStep } from "../types";

// MITRE ATT&CK stage config
interface StageConfig {
  label: string;
  techniqueColor: string;
  chipBg: string;
  chipBorder: string;
  barColor: string;
  icon: string;
}

const TECHNIQUE_CONFIG: Record<string, StageConfig> = {
  T1566: {
    label: "Initial Access",
    techniqueColor: "text-orange-300",
    chipBg: "bg-orange-500/15",
    chipBorder: "border-orange-500/40",
    barColor: "from-orange-400 to-orange-600",
    icon: "🎣",
  },
  T1021: {
    label: "Lateral Movement",
    techniqueColor: "text-yellow-300",
    chipBg: "bg-yellow-500/15",
    chipBorder: "border-yellow-500/40",
    barColor: "from-yellow-400 to-amber-500",
    icon: "↔️",
  },
  T1068: {
    label: "Priv. Escalation",
    techniqueColor: "text-rose-300",
    chipBg: "bg-rose-500/15",
    chipBorder: "border-rose-500/40",
    barColor: "from-rose-400 to-rose-600",
    icon: "⬆️",
  },
  T1041: {
    label: "Exfiltration",
    techniqueColor: "text-red-300",
    chipBg: "bg-red-500/15",
    chipBorder: "border-red-500/40",
    barColor: "from-red-400 to-red-600",
    icon: "📤",
  },
};

const DEFAULT_CONFIG: StageConfig = {
  label: "Unknown",
  techniqueColor: "text-slate-300",
  chipBg: "bg-slate-800",
  chipBorder: "border-slate-700",
  barColor: "from-slate-500 to-slate-400",
  icon: "❓",
};

interface AttackTimelineProps {
  attackChain: AttackStep[];
}

export const AttackTimeline: React.FC<AttackTimelineProps> = ({ attackChain }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
            MITRE ATT&CK Chain
          </span>
        </div>
        <span className="text-xs font-bold text-purple-400/90 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
          {attackChain.length} / 4 Stages
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-0 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {attackChain.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 py-10">
            <ShieldAlert className="w-10 h-10 mb-3 animate-pulse text-slate-700" />
            <p className="text-sm font-semibold text-slate-500">No attack chain detected yet</p>
            <p className="text-xs mt-1 text-slate-600">Launch an attack simulation to see the chain build</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {attackChain.map((step, index) => {
            const cfg = TECHNIQUE_CONFIG[step.technique_id] ?? DEFAULT_CONFIG;
            const confPct = Math.round(step.confidence * 100);

            return (
              <motion.div
                key={`${step.technique_id}-${index}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4, delay: index * 0.12, ease: "easeOut" }}
                className="relative"
              >
                {/* Connector line */}
                {index < attackChain.length - 1 && (
                  <div className="absolute left-[22px] top-[56px] w-0.5 h-6 bg-slate-700 z-0" />
                )}

                <div className="flex items-start gap-3 mb-3 relative z-10">
                  {/* Stage number bubble */}
                  <div className={`
                    shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center
                    text-lg font-black shadow-lg
                    ${cfg.chipBorder} ${cfg.chipBg}
                    shadow-[0_0_14px_rgba(0,0,0,0.6)]
                  `}>
                    <span>{cfg.icon}</span>
                  </div>

                  {/* Card */}
                  <div className={`
                    flex-1 rounded-xl border p-3.5 backdrop-blur transition-all duration-300
                    ${cfg.chipBg} ${cfg.chipBorder}
                    hover:shadow-lg
                  `}>
                    {/* Top row: tactic + technique chip + timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Technique ID chip */}
                        <span className={`
                          text-xs font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider
                          ${cfg.chipBg} ${cfg.chipBorder} ${cfg.techniqueColor}
                        `}>
                          {step.technique_id}
                        </span>

                        {/* Tactic name */}
                        <span className={`text-sm font-extrabold ${cfg.techniqueColor}`}>
                          {step.tactic}
                        </span>

                        {/* ATT&CK label badge */}
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-md">
                          {cfg.label}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Confidence bar */}
                    <div className="mb-2.5">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Confidence
                        </span>
                        <span className={`text-[11px] font-extrabold ${cfg.techniqueColor}`}>
                          {confPct}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${confPct}%` }}
                          transition={{ duration: 0.8, delay: index * 0.15 + 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Explanation */}
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {step.explanation}
                    </p>

                    {/* Chain arrow */}
                    {index < attackChain.length - 1 && (
                      <div className="flex items-center gap-1 mt-2 text-slate-600">
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-[10px] font-semibold text-slate-600">
                          leads to next stage
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
