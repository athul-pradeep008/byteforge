import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Star,
  Clock,
  Info,
} from "lucide-react";
import { ResponseOptionDetail } from "../types";
import { apiClient } from "../api/client";

// ─── Scoring formula tooltip ──────────────────────────────────────────────────
function FormulaTooltip() {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="text-slate-500 hover:text-cyan-400 transition-colors"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-cyan-500/40 rounded-lg p-3 shadow-2xl w-72 pointer-events-none"
          >
            <p className="text-xs font-bold text-cyan-300 mb-1.5">Scoring Formula</p>
            <code className="text-xs text-slate-200 font-mono block bg-slate-800 px-2 py-1 rounded">
              score = 0.6 × risk_reduction − 0.4 × business_impact
            </code>
            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
              Maximises risk reduction while penalising business disruption.
              Higher score = better option.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Inline bar ───────────────────────────────────────────────────────────────
function MetricBar({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{label}</span>
        <span className={`text-[11px] font-extrabold ${color}`}>
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            color.includes("emerald")
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : "bg-gradient-to-r from-rose-500 to-orange-400"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Risk level badge ─────────────────────────────────────────────────────────
const RISK_STYLES: Record<string, string> = {
  LOW: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
  MEDIUM: "bg-amber-500/15 border-amber-500/40 text-amber-300",
  HIGH: "bg-rose-500/15 border-rose-500/40 text-rose-300",
};

// ─── Main component ───────────────────────────────────────────────────────────
interface ResponseCardsProps {
  options: ResponseOptionDetail[];
  incidentId: string;
  onApproved: (isolatedHost: string | null) => void;
  onRejected: () => void;
}

export const ResponseCards: React.FC<ResponseCardsProps> = ({
  options,
  incidentId,
  onApproved,
  onRejected,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [decidedOption, setDecidedOption] = useState<ResponseOptionDetail | null>(null);

  const handleApprove = async (opt: ResponseOptionDetail) => {
    setLoading(`approve-${opt.id}`);
    try {
      await apiClient.approveIncident(incidentId, "SOC_Analyst_1");
      // Fire predict_after to update the network graph
      await apiClient.predictAfterResponse(incidentId);
      setDecision("approved");
      setDecidedOption(opt);
      // Notify parent so network graph can show isolated host
      const isIsolation =
        opt.action.toLowerCase().includes("isolat") ||
        opt.action.toLowerCase().includes("quarant");
      onApproved(isIsolation ? opt.target : null);
    } catch (e) {
      console.error("Approve failed:", e);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    setLoading("reject");
    try {
      await apiClient.rejectIncident(incidentId, "SOC_Analyst_1");
      setDecision("rejected");
      onRejected();
    } catch (e) {
      console.error("Reject failed:", e);
    } finally {
      setLoading(null);
    }
  };

  // Recommended option first
  const sorted = [...options].sort((a, b) =>
    a.is_recommended === b.is_recommended ? 0 : a.is_recommended ? -1 : 1
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
            Response Strategy
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg">
          score = 0.6×RR − 0.4×BI
          <FormulaTooltip />
        </div>
      </div>

      {/* Decision Banner */}
      <AnimatePresence>
        {decision && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className={`mx-4 mt-3 px-4 py-3 rounded-xl border text-sm font-bold flex items-center gap-2 ${
              decision === "approved"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : "bg-slate-800 border-slate-700 text-slate-400"
            }`}
          >
            {decision === "approved" ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  ✅ Response approved — <span className="font-extrabold">{decidedOption?.action}</span> on{" "}
                  <span className="font-mono">{decidedOption?.target}</span> executed. Network graph updated.
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Response action rejected. Incident remains open.
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {options.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 py-10">
            <ShieldCheck className="w-10 h-10 mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-slate-500">No response options yet</p>
          </div>
        )}

        {sorted.map((opt, idx) => {
          const riskStyle = RISK_STYLES[opt.risk_level] ?? RISK_STYLES["MEDIUM"];
          const isApproving = loading === `approve-${opt.id}`;
          const isRejecting = loading === "reject";
          const disabled = !!decision || !!loading;

          return (
            <motion.div
              key={opt.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              className={`
                relative rounded-xl border p-4 transition-all duration-300
                ${opt.is_recommended
                  ? "bg-gradient-to-br from-cyan-950/60 to-slate-900/80 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                  : "bg-slate-900/60 border-slate-800"
                }
                ${!disabled ? "hover:border-slate-600 hover:shadow-lg" : ""}
              `}
            >
              {/* RECOMMENDED badge */}
              {opt.is_recommended && (
                <div className="absolute -top-2.5 left-4">
                  <span className="flex items-center gap-1 bg-cyan-500 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg uppercase tracking-wider">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Recommended
                  </span>
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-2 mb-3 mt-1">
                {/* Action + target */}
                <div>
                  <p className="text-sm font-extrabold text-slate-100">{opt.action}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">→ {opt.target}</p>
                </div>

                {/* Right: score + risk + time */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-lg ${riskStyle}`}>
                    {opt.risk_level}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                    <Clock className="w-3 h-3" />
                    {opt.time_to_execute}
                  </span>
                  <span
                    className={`text-sm font-black tabular-nums ${
                      opt.score > 0.4 ? "text-emerald-400" : opt.score > 0.2 ? "text-amber-400" : "text-rose-400"
                    }`}
                  >
                    {opt.score.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Metric bars */}
              <div className="space-y-2 mb-3">
                <MetricBar
                  value={opt.risk_reduction}
                  color="text-emerald-400"
                  label="Risk Reduction"
                />
                <MetricBar
                  value={opt.business_impact}
                  color="text-rose-400"
                  label="Business Impact"
                />
              </div>

              {/* Rationale */}
              <p className="text-[11px] text-slate-400 leading-snug mb-4">{opt.rationale}</p>

              {/* Action buttons — only on recommended or all if no recommended */}
              {(opt.is_recommended || options.every((o) => !o.is_recommended)) && !decision && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(opt)}
                    disabled={disabled}
                    className={`
                      flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold
                      transition-all duration-200 border
                      ${disabled
                        ? "bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed"
                        : "bg-emerald-500/20 border-emerald-500/60 text-emerald-300 hover:bg-emerald-500/35 hover:shadow-[0_0_12px_rgba(16,185,129,0.35)] active:scale-95"
                      }
                    `}
                  >
                    {isApproving ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {isApproving ? "Executing…" : "Approve & Execute"}
                  </button>

                  <button
                    onClick={handleReject}
                    disabled={disabled}
                    className={`
                      flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold
                      transition-all duration-200 border
                      ${disabled
                        ? "bg-slate-800 border-slate-700 text-slate-600 cursor-not-allowed"
                        : "bg-rose-500/15 border-rose-500/50 text-rose-300 hover:bg-rose-500/25 active:scale-95"
                      }
                    `}
                  >
                    {isRejecting ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-rose-400 border-t-transparent rounded-full" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {isRejecting ? "…" : "Reject"}
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
