import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../api/client";
import { Header } from "../components/Header";
import { useToast } from "../components/Toast";

interface PreflightState {
  status: string;
  overall_green: boolean;
  checks: {
    api: { pass: boolean; message: string };
    cache: { pass: boolean; message: string; file_count?: number };
    seeded_memory: { pass: boolean; message: string; signature_count?: number };
    sse: { pass: boolean; message: string; subscriber_count?: number };
  };
  timestamp: string;
}

export const HealthPage: React.FC = () => {
  const [data, setData] = useState<PreflightState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState<boolean>(false);
  const { showToast } = useToast();

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getPreflightHealth();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to contact backend API server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleReset = async () => {
    setResetting(true);
    const start = performance.now();
    try {
      await apiClient.resetDemo();
      const elapsed = Math.round(performance.now() - start);
      showToast(`Demo environment reset in ${elapsed}ms!`, "success");
      await fetchHealth();
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`, "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header isRunning={false} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                🛡️
              </span>
              System Pre-Flight Health Check
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Validates API endpoints, LLM response cache, pre-seeded memory signatures, and SSE stream pipeline.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium rounded-lg text-sm transition-all border border-slate-700 flex items-center gap-2"
            >
              {loading ? "Testing..." : "🔄 Run Diagnostics"}
            </button>
            <button
              onClick={handleReset}
              disabled={resetting}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 font-medium rounded-lg text-sm transition-all border border-red-500/30 flex items-center gap-2"
            >
              {resetting ? "Resetting..." : "⚡ Reset Demo (<1s)"}
            </button>
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
            >
              Launch Dashboard →
            </Link>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-red-400">Pre-Flight Diagnostic Failure</h3>
              <p className="text-sm mt-0.5 text-red-300/90">{error}</p>
              <p className="text-xs text-red-400/80 mt-2">
                Make sure the backend server is running: <code className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300">uvicorn backend.api.main:app --port 8000</code>
              </p>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && !data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse h-40" />
            ))}
          </div>
        )}

        {/* Diagnostic Results */}
        {data && (
          <>
            {/* Overall Health Status Hero Card */}
            <div
              className={`mb-8 p-6 rounded-2xl border backdrop-blur-md transition-all shadow-2xl ${
                data.overall_green
                  ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-100 shadow-emerald-950/50"
                  : "bg-amber-950/30 border-amber-500/40 text-amber-100 shadow-amber-950/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
                      data.overall_green
                        ? "bg-emerald-500 text-slate-950 shadow-emerald-500/30 animate-pulse"
                        : "bg-amber-500 text-slate-950 shadow-amber-500/30"
                    }`}
                  >
                    {data.overall_green ? "✓" : "!"}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold tracking-tight">
                        {data.overall_green ? "SYSTEM READY FOR DEMO (GREEN)" : "SYSTEM DEGRADED (CHECK DETAILS)"}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          data.overall_green
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {data.overall_green ? "ALL CHECKS PASSED" : "ACTION REQUIRED"}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm mt-1">
                      {data.overall_green
                        ? "All 4 required subsystems (API, Cache, Seeded Memory, SSE) are active. Demo mode ready to run offline in < 3 minutes."
                        : "One or more subsystems reported issues. Check individual status cards below."}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <p>Last Verified</p>
                  <p className="font-mono text-cyan-400 mt-0.5">{new Date(data.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* 4 Health Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Check 1: API */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subsystem 1</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        data.checks.api.pass
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {data.checks.api.pass ? "GREEN PASS" : "FAIL"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>⚡</span> Backend API Endpoint
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">{data.checks.api.message}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex justify-between">
                  <span>Endpoint: <code className="text-slate-300">/api/health</code></span>
                  <span className="text-emerald-400 font-medium">HTTP 200 OK</span>
                </div>
              </div>

              {/* Check 2: LLM Cache */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subsystem 2</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        data.checks.cache.pass
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {data.checks.cache.pass ? "GREEN PASS" : "FAIL"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>💾</span> Offline LLM Response Cache
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">{data.checks.cache.message}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex justify-between">
                  <span>Location: <code className="text-slate-300">backend/data/cache</code></span>
                  <span className="text-cyan-400 font-medium">{data.checks.cache.file_count ?? 0} files</span>
                </div>
              </div>

              {/* Check 3: Seeded Memory */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subsystem 3</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        data.checks.seeded_memory.pass
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {data.checks.seeded_memory.pass ? "GREEN PASS" : "FAIL"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🧠</span> Pre-Seeded Memory Database
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">{data.checks.seeded_memory.message}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex justify-between">
                  <span>Baseline Signature: <code className="text-purple-400 font-mono">inc-hist-001</code></span>
                  <span className="text-purple-300 font-medium">{data.checks.seeded_memory.signature_count ?? 0} signatures</span>
                </div>
              </div>

              {/* Check 4: SSE Stream */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subsystem 4</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        data.checks.sse.pass
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {data.checks.sse.pass ? "GREEN PASS" : "FAIL"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📡</span> Server-Sent Events (SSE) Stream
                  </h3>
                  <p className="text-slate-400 text-sm mt-2">{data.checks.sse.message}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-500 flex justify-between">
                  <span>Stream Path: <code className="text-slate-300">/api/stream</code></span>
                  <span className="text-cyan-400 font-medium">Event Stream Ready</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};
