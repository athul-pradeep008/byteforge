import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Zap, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { MemoryMatch } from "../types";

// ─── Match score bar ──────────────────────────────────────────────────────────
function MatchBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 90
      ? "from-purple-500 to-pink-500"
      : pct >= 75
      ? "from-cyan-500 to-blue-400"
      : "from-amber-500 to-orange-400";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className={`text-xs font-black w-9 text-right tabular-nums ${
        pct >= 90
          ? "text-purple-300"
          : pct >= 75
          ? "text-cyan-300"
          : "text-amber-300"
      }`}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Single match card ────────────────────────────────────────────────────────
function MatchCard({ match, index }: { match: MemoryMatch; index: number }) {
  const isStage1 = match.matched_stage_1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`
        relative rounded-xl border p-4 transition-all
        ${isStage1
          ? "bg-gradient-to-br from-purple-950/60 to-slate-900/80 border-purple-500/50 shadow-[0_0_18px_rgba(168,85,247,0.2)]"
          : "bg-slate-900/60 border-slate-800"
        }
      `}
    >
      {/* Stage 1 caught banner */}
      <AnimatePresence>
        {isStage1 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex items-center gap-2 mb-3 bg-purple-500/20 border border-purple-500/50 rounded-lg px-3 py-2"
          >
            <Zap className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
            <div>
              <p className="text-xs font-extrabold text-purple-200 uppercase tracking-wider">
                ⚡ Caught at Stage 1
              </p>
              <p className="text-[10px] text-purple-300/70 mt-0.5">
                Pattern recognised at Phishing / Credential Theft stage
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match label */}
      <div className="flex items-center justify-between mb-2">
        <span className={`
          text-xs font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider
          ${isStage1
            ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
            : "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
          }
        `}>
          {match.match_label}
        </span>
        <CheckCircle2 className={`w-4 h-4 ${isStage1 ? "text-purple-400" : "text-cyan-400"}`} />
      </div>

      {/* Match score bar */}
      <div className="mb-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
          Similarity Score
        </p>
        <MatchBar score={match.similarity_score} />
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <span className="text-slate-600 w-20 shrink-0">Pattern</span>
          <span className="text-slate-300 font-semibold">{match.learned_pattern}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-600 w-20 shrink-0">Past Incident</span>
          <code className="text-slate-400 font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded">
            {match.past_incident_id}
          </code>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface MemoryPanelProps {
  memoryMatches: MemoryMatch[];
}

export const MemoryPanel: React.FC<MemoryPanelProps> = ({ memoryMatches }) => {
  const hasStage1 = memoryMatches.some((m) => m.matched_stage_1);
  const hasMatches = memoryMatches.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
            Memory Pattern Match
          </span>
        </div>
        <div className="flex items-center gap-2">
          {hasStage1 && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="flex items-center gap-1 text-[10px] font-black text-purple-200 bg-purple-500/20 border border-purple-500/50 px-2 py-0.5 rounded-full uppercase tracking-wide"
            >
              <Zap className="w-2.5 h-2.5 text-purple-400" />
              Early Detection
            </motion.span>
          )}
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
            hasMatches
              ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-300"
              : "bg-slate-800 border border-slate-700 text-slate-500"
          }`}>
            {memoryMatches.length} match{memoryMatches.length !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {!hasMatches ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 py-8">
            <ShieldAlert className="w-10 h-10 mb-3 text-slate-700 animate-pulse" />
            <p className="text-sm font-semibold text-slate-500">No pattern matches</p>
            <p className="text-xs mt-1 text-slate-600 text-center max-w-xs">
              Run preseed_memory.py to load historical signatures, then launch an attack
            </p>
          </div>
        ) : (
          <>
            {/* Summary banner */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold ${
                hasStage1
                  ? "bg-purple-950/50 border-purple-500/40 text-purple-200"
                  : "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              }`}
            >
              {hasStage1 ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="font-extrabold">Variant attack detected at Stage 1</p>
                    <p className="text-[10px] font-normal opacity-70 mt-0.5">
                      Historical signatures matched before attack fully executed.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="font-extrabold">Known attack pattern recognised</p>
                    <p className="text-[10px] font-normal opacity-70 mt-0.5">
                      {memoryMatches.length} historical signature{memoryMatches.length !== 1 ? "s" : ""} matched.
                    </p>
                  </div>
                </>
              )}
            </motion.div>

            {/* Match cards */}
            <AnimatePresence>
              {memoryMatches.map((match, i) => (
                <MatchCard key={match.past_incident_id} match={match} index={i} />
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};
