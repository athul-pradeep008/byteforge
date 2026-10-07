import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Activity, Clock, Server, User } from "lucide-react";
import { TelemetryEvent, Anomaly } from "../types";

// Build a unified list entry from events + anomalies
interface FeedEntry {
  id: string;
  timestamp: string;
  source: string;
  event_type: string;
  user?: string;
  is_anomaly: boolean;
  anomaly_score?: number;
  reason?: string;
  detectors?: string[];
  stage?: string;
  is_attack?: boolean;
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  auth:           "bg-sky-500/15 border-sky-500/40 text-sky-300",
  dns:            "bg-violet-500/15 border-violet-500/40 text-violet-300",
  file_access:    "bg-amber-500/15 border-amber-500/40 text-amber-300",
  network_flow:   "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
};

const STAGE_COLORS: Record<string, string> = {
  phishing_credential_theft: "text-orange-400",
  lateral_movement:          "text-yellow-400",
  privilege_escalation:      "text-rose-400",
  data_exfiltration:         "text-red-500",
};

interface EventFeedProps {
  events: TelemetryEvent[];
  anomalies: Anomaly[];
}

export const EventFeed: React.FC<EventFeedProps> = ({ events, anomalies }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const anomalyIds = new Set(anomalies.map((a) => a.event_id));
  const anomalyMap = new Map(anomalies.map((a) => [a.event_id, a]));

  // Merge events + anomalies, sorted by timestamp desc (newest first)
  const feed: FeedEntry[] = [
    ...events.map((evt) => {
      const anom = anomalyMap.get(evt.event_id);
      return {
        id: evt.event_id,
        timestamp: evt.timestamp,
        source: evt.source,
        event_type: evt.event_type,
        user: evt.user,
        is_anomaly: anomalyIds.has(evt.event_id),
        anomaly_score: anom?.anomaly_score,
        reason: anom?.reason,
        detectors: anom?.detectors,
        stage: anom?.stage,
        is_attack: evt.is_attack,
      };
    }),
  ].sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)).slice(0, 120);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [feed.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
            Live Event Feed
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
            {events.length} events
          </span>
          {anomalies.length > 0 && (
            <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {anomalies.length} anomalies
            </span>
          )}
        </div>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto space-y-1 p-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {feed.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 py-12">
            <Activity className="w-10 h-10 mb-3 animate-pulse" />
            <p className="text-sm font-semibold">Waiting for telemetry…</p>
            <p className="text-xs mt-1 text-slate-700">Trigger a simulation to stream live events</p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {feed.map((entry) => {
            const typeStyle = EVENT_TYPE_COLORS[entry.event_type] ?? "bg-slate-800 border-slate-700 text-slate-300";
            const stageColor = entry.stage ? STAGE_COLORS[entry.stage] : "";
            const isAttack = entry.is_anomaly;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`
                  relative px-3 py-2.5 rounded-lg border transition-all
                  ${isAttack
                    ? "bg-rose-950/40 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.25)]"
                    : "bg-slate-900/60 border-slate-800/70"
                  }
                `}
              >
                {/* Anomaly glow bar on left */}
                {isAttack && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                )}

                <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 pl-1">
                  {/* Left: type chip + source/user */}
                  <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                    <span className={`text-[10px] font-bold border px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${typeStyle}`}>
                      {entry.event_type}
                    </span>

                    <span className="flex items-center gap-1 text-xs text-slate-300 font-semibold">
                      <Server className="w-3 h-3 text-slate-500" />
                      {entry.source}
                    </span>

                    {entry.user && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <User className="w-3 h-3 text-slate-600" />
                        {entry.user}
                      </span>
                    )}

                    {entry.stage && (
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${stageColor}`}>
                        ● {entry.stage.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>

                  {/* Right: timestamp */}
                  <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono shrink-0">
                    <Clock className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Anomaly details */}
                {isAttack && entry.anomaly_score !== undefined && (
                  <div className="mt-2 pl-1 space-y-1">
                    {/* Score bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-rose-300 w-14 shrink-0">
                        Score: {(entry.anomaly_score * 100).toFixed(0)}%
                      </span>
                      <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${entry.anomaly_score * 100}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Plain-language reason */}
                    {entry.reason && (
                      <p className="text-[11px] text-rose-200/80 leading-snug line-clamp-2">
                        {entry.reason}
                      </p>
                    )}

                    {/* Detectors */}
                    {entry.detectors && entry.detectors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {entry.detectors.map((d, i) => (
                          <span key={i} className="text-[9px] font-semibold bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded-md">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </div>
  );
};
