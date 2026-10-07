import React, { useState } from "react";
import { AlertOctagon, RefreshCw, Copy, Check, Terminal, Play } from "lucide-react";

interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message = "Connection to ByteForge backend lost. Ensure FastAPI is running on http://localhost:8000.",
  onRetry,
  onDismiss,
}) => {
  const [shellTab, setShellTab] = useState<"cmd" | "bash">("cmd");
  const [copied, setCopied] = useState<boolean>(false);

  const cmdCommand = `.venv\\Scripts\\uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload`;
  const bashCommand = `./.venv/Scripts/uvicorn backend.api.main:app --host 127.0.0.1 --port 8000 --reload`;

  const currentCommand = shellTab === "cmd" ? cmdCommand : bashCommand;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/90 border-2 border-rose-500/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(244,63,94,0.25)] flex flex-col gap-4 backdrop-blur-xl relative">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]">
            <AlertOctagon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <span>BACKEND CONNECTION WARNING</span>
              <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono">
                Port 8000
              </span>
            </h3>
            <p className="text-sm font-medium text-rose-200/90 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg hover:shadow-rose-500/40 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex items-center space-x-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-lg hover:shadow-cyan-500/40 cursor-pointer border border-cyan-400/40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Use Offline Demo Mode</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Helper Box for Copying Direct Command */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Direct Backend Command or double-click <code className="text-cyan-300 font-bold bg-slate-900 px-1 py-0.5 rounded">run_backend.bat</code>:</span>
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setShellTab("cmd")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  shellTab === "cmd" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                CMD / PowerShell
              </button>
              <button
                onClick={() => setShellTab("bash")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  shellTab === "bash" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-slate-400 hover:text-white"
                }`}
              >
                Git Bash
              </button>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold rounded-lg transition-all border border-slate-700 hover:border-cyan-500/40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Command"}</span>
          </button>
        </div>

        <code className="text-xs font-mono text-cyan-300 bg-slate-900/90 p-2.5 rounded-lg border border-slate-800/80 overflow-x-auto select-all">
          {currentCommand}
        </code>
      </div>
    </div>
  );
};
