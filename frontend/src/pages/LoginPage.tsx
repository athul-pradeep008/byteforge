import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldAlert, Lock, User as UserIcon, Key, Eye, EyeOff, CheckCircle, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [email, setEmail] = useState("analyst.alpha@cyberimmune.io");
  const [username, setUsername] = useState("SOC_Analyst_1");
  const [password, setPassword] = useState("••••••••••••");
  const [role, setRole] = useState("Tier 2 SOC Analyst");
  const [securityPin, setSecurityPin] = useState("849201");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleQuickFill = () => {
    setEmail("analyst.alpha@cyberimmune.io");
    setUsername("SOC_Analyst_1");
    setPassword("ByteForge2026!");
    setRole("Tier 2 SOC Analyst");
    setSecurityPin("849201");
    addToast("Demo Credentials Auto-Filled", undefined, "info");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login({
        username: username || "SOC_Analyst_1",
        email: email || "analyst@cyberimmune.io",
        role: role,
        token: "jwt_demo_token_8849",
      });

      setLoading(false);
      addToast(`Welcome back, ${username || "Analyst"}!`, "Authenticated successfully.", "success");
      navigate("/dashboard");
    }, 900);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* Background Animated Gradient Mesh & Radar Sweeps */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[160px]" />
        <div className="absolute -top-40 -left-40 w-[450px] h-[450px] bg-indigo-500/10 rounded-full blur-[140px]" />
        
        {/* Subtle Scanlines Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(30,41,59,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.2)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.2)] group-hover:border-cyan-400 transition-all">
            <ShieldAlert className="w-7 h-7 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              BYTEFORGE
            </h1>
            <p className="text-xs text-slate-400 font-medium">Autonomous Defense Portal</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/health"
            className="px-3.5 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            <span>🛡️</span> Pre-Flight Health
          </Link>
          <Link
            to="/dashboard"
            className="px-3.5 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.6)] relative group hover:border-slate-700 transition-all duration-300">
          
          {/* Card Top Glow Accent */}
          <div className="absolute -top-[1px] left-12 right-12 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Title Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-wide">SOC Analyst Portal</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">
              Enter clearance credentials to access live threat telemetry
            </p>
          </div>

          {/* Quick Fill Demo Credentials Banner */}
          <button
            type="button"
            onClick={handleQuickFill}
            className="w-full mb-6 p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer group shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400 group-hover:scale-110 transition-transform" />
            <span>⚡ Fill Demo Credentials</span>
          </button>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                SOC Clearance Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all cursor-pointer"
              >
                <option value="Tier 1 Analyst">Tier 1 SOC Analyst (Monitoring)</option>
                <option value="Tier 2 SOC Analyst">Tier 2 SOC Analyst (Incident Response)</option>
                <option value="Threat Hunter">Threat Hunter (Pattern Analysis)</option>
                <option value="SecOps Admin">SecOps Administrator (Full Clearance)</option>
              </select>
            </div>

            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Analyst ID / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@cyberimmune.io"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Access Key / Password
                </label>
                <span className="text-[10px] text-cyan-400/80 font-medium">Encrypted (256-bit AES)</span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Security PIN (2FA) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                2FA Hardware Token PIN
              </label>
              <input
                type="text"
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                placeholder="6-digit PIN"
                maxLength={6}
                className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-cyan-300 font-mono tracking-widest text-center focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40 transition-all"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-400 font-medium">Remember terminal session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-slate-950" />
                  <span>Authenticate & Launch Terminal</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </>
              )}
            </button>
          </form>

          {/* Footer inside card */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-Trust Security Standard Enforced</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-4 text-center text-xs text-slate-500">
        ByteForge Autonomous Threat Mitigation Platform • Simulated Security Operations Center
      </footer>
    </div>
  );
};
