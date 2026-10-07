import React, { useState } from "react";
import { Play, Zap, Flame, Database, RotateCcw, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { apiClient } from "../api/client";

interface ControlBarProps {
  onSimulationStart?: (mode: string) => void;
  onReset?: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onSimulationStart,
  onReset,
}) => {
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);

  const handleNormal = async () => {
    setLoadingMode("normal");
    try {
      await apiClient.triggerNormal();
      if (onSimulationStart) onSimulationStart("normal");
    } catch (err) {
      console.error("Normal simulation failed:", err);
    } finally {
      setLoadingMode(null);
    }
  };

  const handleAttack = async () => {
    setLoadingMode("attack");
    try {
      await apiClient.triggerAttack();
      if (onSimulationStart) onSimulationStart("attack");
    } catch (err) {
      console.error("Attack simulation failed:", err);
    } finally {
      setLoadingMode(null);
    }
  };

  const handleVariant = async () => {
    setLoadingMode("variant");
    try {
      await apiClient.triggerVariant();
      if (onSimulationStart) onSimulationStart("variant");
    } catch (err) {
      console.error("Variant simulation failed:", err);
    } finally {
      setLoadingMode(null);
    }
  };

  const handleDataset = async () => {
    setLoadingMode("dataset");
    try {
      await apiClient.triggerDataset();
      if (onSimulationStart) onSimulationStart("dataset");
    } catch (err) {
      console.error("Dataset simulation failed:", err);
    } finally {
      setLoadingMode(null);
    }
  };

  const handleReset = async () => {
    setLoadingMode("reset");
    try {
      await apiClient.resetDemo();
      if (onReset) onReset();
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 backdrop-blur-md shadow-xl flex flex-wrap items-center justify-between gap-4">
      {/* Simulation Trigger Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Run Normal Traffic */}
        <button
          onClick={handleNormal}
          disabled={loadingMode !== null}
          className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-sm rounded-xl transition-all duration-200 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 cursor-pointer"
        >
          {loadingMode === "normal" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
          )}
          <span>Run Normal Traffic</span>
        </button>

        {/* Launch Attack */}
        <button
          onClick={handleAttack}
          disabled={loadingMode !== null}
          className="flex items-center space-x-2 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 font-bold text-sm rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-50 cursor-pointer"
        >
          {loadingMode === "attack" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 text-rose-400 fill-rose-400" />
          )}
          <span>Launch Attack</span>
        </button>

        {/* Launch Variant Attack */}
        <button
          onClick={handleVariant}
          disabled={loadingMode !== null}
          className="flex items-center space-x-2 px-5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold text-sm rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 cursor-pointer"
        >
          {loadingMode === "variant" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Flame className="w-4 h-4 text-purple-400 fill-purple-400" />
          )}
          <span>Launch Variant Attack</span>
        </button>

        {/* Ingest CSV Dataset */}
        <button
          onClick={handleDataset}
          disabled={loadingMode !== null}
          className="flex items-center space-x-2 px-5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold text-sm rounded-xl transition-all duration-200 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
        >
          {loadingMode === "dataset" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Database className="w-4 h-4 text-cyan-400" />
          )}
          <span>Ingest CSV Dataset</span>
        </button>

        {/* Reset Demo */}
        <button
          onClick={handleReset}
          disabled={loadingMode !== null}
          className="flex items-center space-x-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-all duration-200 hover:text-white cursor-pointer"
        >
          {loadingMode === "reset" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4 text-slate-400" />
          )}
          <span>Reset Demo</span>
        </button>
      </div>

      {/* Demo Mode Toggle */}
      <div className="flex items-center space-x-3 bg-slate-950/70 border border-slate-800 px-4 py-2 rounded-xl">
        <span className="text-slate-400 text-sm font-semibold tracking-wide">
          Auto Demo Mode
        </span>
        <button
          onClick={() => setDemoMode(!demoMode)}
          className="focus:outline-none cursor-pointer text-cyan-400 hover:text-cyan-300 transition-colors"
          title="Toggle Auto Demo Mode"
        >
          {demoMode ? (
            <ToggleRight className="w-8 h-8 text-cyan-400" />
          ) : (
            <ToggleLeft className="w-8 h-8 text-slate-600" />
          )}
        </button>
        <span className={`text-xs font-bold uppercase tracking-wider ${demoMode ? "text-cyan-400" : "text-slate-500"}`}>
          {demoMode ? "ON" : "OFF"}
        </span>
      </div>
    </div>
  );
};
