import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ToggleLeft, ToggleRight } from "lucide-react";
import { HostPrediction } from "../types";

// ─── Custom Recharts Tooltip ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="font-bold text-slate-200 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold text-slate-100">{p.value?.toFixed(1)}{p.unit}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Risk level colour helpers ────────────────────────────────────────────────
function probColor(val: number): string {
  if (val > 0.7) return "#f43f5e";
  if (val > 0.4) return "#f59e0b";
  return "#10b981";
}
function timeColor(val: number): string {
  if (val < 15) return "#f43f5e";
  if (val < 40) return "#f59e0b";
  return "#10b981";
}

// ─── Component ────────────────────────────────────────────────────────────────
interface PredictionPanelProps {
  predictions: HostPrediction[];
  predictionsAfter: HostPrediction[];  // post-response (may be empty until Approve)
  isLoadingAfter?: boolean;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  predictions,
  predictionsAfter,
  isLoadingAfter = false,
}) => {
  const [showAfter, setShowAfter] = useState(false);

  const active = showAfter && predictionsAfter.length > 0 ? predictionsAfter : predictions;

  const probData = active
    .slice(0, 6)
    .map((p) => ({
      host: p.host.replace("domain-controller", "dc").replace("workstation", "ws"),
      "Risk %": parseFloat((p.compromise_probability * 100).toFixed(1)),
      fill: probColor(p.compromise_probability),
    }));

  const timeData = active
    .filter((p) => p.est_minutes_to_compromise > 0)
    .slice(0, 6)
    .map((p) => ({
      host: p.host.replace("domain-controller", "dc").replace("workstation", "ws"),
      "ETA (min)": parseFloat(p.est_minutes_to_compromise.toFixed(1)),
      fill: timeColor(p.est_minutes_to_compromise),
    }));

  const hasAfter = predictionsAfter.length > 0;
  const canToggle = hasAfter && !isLoadingAfter;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
            Monte Carlo Risk Forecast
          </span>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded-md ml-1">
            1 000 runs · seed 42
          </span>
        </div>

        {/* Toggle */}
        <button
          onClick={() => canToggle && setShowAfter((v) => !v)}
          disabled={!canToggle}
          className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-200
            ${canToggle
              ? "border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 cursor-pointer"
              : "border-slate-700 bg-slate-800/50 text-slate-600 cursor-not-allowed"
            }`}
          title={!canToggle ? "Approve a response to compare" : undefined}
        >
          {showAfter
            ? <><TrendingDown className="w-3.5 h-3.5" /> After Response</>
            : <><ToggleLeft className="w-3.5 h-3.5" /> No Action</>
          }
          {canToggle && (
            showAfter
              ? <ToggleRight className="w-3.5 h-3.5 text-cyan-400" />
              : <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {predictions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 py-8">
            <TrendingUp className="w-10 h-10 mb-3 animate-pulse" />
            <p className="text-sm font-semibold text-slate-500">No predictions yet</p>
            <p className="text-xs mt-1 text-slate-600">Launch an attack to generate risk forecasts</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={showAfter ? "after" : "before"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Compromise Probability Bar Chart */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Compromise Probability (%)
                </p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={probData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                    <XAxis
                      dataKey="host"
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "#64748b", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(71,85,105,0.15)" }} />
                    <Bar dataKey="Risk %" radius={[4, 4, 0, 0]} unit="%" maxBarSize={36}>
                      {probData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} opacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ETA Bar Chart */}
              {timeData.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Estimated Time to Compromise (min)
                  </p>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={timeData} margin={{ top: 0, right: 8, bottom: 0, left: -16 }}>
                      <XAxis
                        dataKey="host"
                        tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(71,85,105,0.15)" }} />
                      <Bar dataKey="ETA (min)" radius={[4, 4, 0, 0]} unit=" min" maxBarSize={36}>
                        {timeData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} opacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Comparison hint */}
              {hasAfter && (
                <p className="text-center text-[10px] text-slate-500 font-semibold">
                  {showAfter
                    ? "📉 Showing post-response predictions — risk reduced after mitigation"
                    : "📊 Showing pre-response predictions — toggle to see impact of approved action"}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
