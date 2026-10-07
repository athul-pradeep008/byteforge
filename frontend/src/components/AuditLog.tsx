import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, RefreshCw, Search, CheckCircle2, XCircle, Clock, User, AlertCircle, Cpu } from "lucide-react";
import { AuditLogEntry } from "../types";
import { apiClient } from "../api/client";

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogDrawer = ({ isOpen, onClose }: AuditLogDrawerProps) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getAuditLogs();
      setLogs(res.audit_logs || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    return (
      log.incident_id.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      (log.executed_by && log.executed_by.toLowerCase().includes(term))
    );
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-100 uppercase tracking-wider">
                    Immutable Audit Trail
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    append-only record (`data/audit_log.jsonl`)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLogs}
                  className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                  title="Refresh Audit Logs"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search incident, action, actor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Log Entries List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-700">
              {isLoading && logs.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400" />
                  <p className="text-xs">Loading audit trail...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-16 text-center text-slate-500 space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold">No audit entries found</p>
                  <p className="text-xs text-slate-600">
                    Decisions approved in the dashboard will appear here.
                  </p>
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const isApproved = log.status === "APPROVED" || Boolean(log.executed_by);
                  const isRejected = log.status === "REJECTED";

                  return (
                    <motion.div
                      key={`${log.incident_id}-${index}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 relative overflow-hidden group hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                          {log.incident_id}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            isApproved
                              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                              : isRejected
                              ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                              : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3 h-3 text-rose-400" />
                          )}
                          {log.status || (isApproved ? "APPROVED" : "EXECUTED")}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-black text-slate-100 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                          Action: <span className="text-cyan-300 font-mono">{log.action}</span>
                        </p>
                        {log.details && (
                          <p className="text-[11px] text-slate-400 font-mono leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                            {typeof log.details === "string"
                              ? log.details
                              : JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-800/60">
                        <div className="flex items-center gap-1 text-slate-400">
                          <User className="w-3 h-3 text-cyan-400" />
                          <span>{log.executed_by || "System Autonomous"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleTimeString()
                              : "Just now"}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 text-[11px] text-slate-500 text-center font-mono">
              Total Records: {logs.length} entries | Cryptographically Verifiable
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
