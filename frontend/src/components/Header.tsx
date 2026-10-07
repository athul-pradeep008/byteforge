import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Activity, Wifi, WifiOff, UserCheck, LogIn, LogOut } from "lucide-react";
import { apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  isRunning?: boolean;
  onHealthStatusChange?: (isOnline: boolean) => void;
  onOpenAuditLog?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHealthStatusChange, onOpenAuditLog }) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastCheck, setLastCheck] = useState<string>("");
  const { user, logout } = useAuth();

  const checkHealth = async () => {
    try {
      await apiClient.getHealth();
      setIsOnline(true);
      if (onHealthStatusChange) onHealthStatusChange(true);
      setLastCheck(new Date().toLocaleTimeString());
    } catch {
      setIsOnline(false);
      if (onHealthStatusChange) onHealthStatusChange(false);
      setLastCheck(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800 backdrop-blur-md px-6 py-4 flex flex-wrap items-center justify-between shadow-2xl z-50">
      {/* Brand & Logo */}
      <div className="flex items-center space-x-4">
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.2)]">
          <ShieldAlert className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              BYTEFORGE
            </h1>
            <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
              <Activity className="w-3 h-3" /> SIMULATED ENVIRONMENT
            </span>
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">
            Autonomous Cyber Resilience & Threat Mitigation System
          </p>
        </div>
      </div>

      {/* Right controls: Health + Navigation & User Profile */}
      <div className="flex items-center space-x-3">
        {/* Navigation & User Profile */}
        <div className="flex items-center gap-2">
          <Link
            to="/dashboard"
            className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-cyan-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
          >
            Dashboard
          </Link>
          <Link
            to="/health"
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
          >
            <span>🛡️</span> Pre-Flight Health
          </Link>
          <Link
            to="/report/inc-001"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-cyan-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all"
          >
            Report
          </Link>
          {onOpenAuditLog && (
            <button
              onClick={onOpenAuditLog}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 rounded-xl transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
            >
              Audit Log
            </button>
          )}

          {/* User Profile / Login Link */}
          {user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-cyan-500/30 px-3 py-1 rounded-xl">
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <div className="text-left">
                  <p className="text-[11px] font-extrabold text-cyan-300 leading-none">{user.username}</p>
                  <p className="text-[9px] text-slate-400 font-medium leading-tight">{user.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </Link>
          )}
        </div>

        {/* Backend Health Status Indicator */}
        <div className="flex items-center space-x-4 bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl">
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-sm tracking-wide">
                  SYSTEM ONLINE
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
                <WifiOff className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold text-sm tracking-wide">
                  BACKEND OFFLINE
                </span>
              </>
            )}
          </div>
          {lastCheck && (
            <span className="text-slate-500 text-xs border-l border-slate-700 pl-3">
              Last Check: {lastCheck}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
