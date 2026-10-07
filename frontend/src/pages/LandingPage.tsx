import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Shield,
  Eye,
  Brain,
  TrendingUp,
  ShieldCheck,
  Database,
  ArrowRight,
  Activity,
  Lock,
  Cpu,
  CheckCircle2,
  FileText,
  ChevronRight,
  Sparkles,
  Play,
} from "lucide-react";

export function LandingPage() {
  const [activeVerb, setActiveVerb] = useState<number>(0);
  const [selectedAgentNode, setSelectedAgentNode] = useState<string>("analyst");

  const verbs = [
    {
      title: "Detect",
      icon: Eye,
      color: "from-cyan-500 to-blue-500",
      accent: "text-cyan-400",
      border: "border-cyan-500/40",
      bg: "bg-cyan-500/10",
      short: "Real-time Telemetry Baseline Profiling",
      description:
        "Continuously monitors network traffic, system calls, and authentication logs across 6 core topology hosts, scoring anomalies instantaneously against normal operational baselines.",
      metrics: ["6 Monitored Topology Hosts", "Real-Time Telemetry Stream", "< 100ms Anomaly Latency"],
    },
    {
      title: "Understand",
      icon: Brain,
      color: "from-purple-500 to-indigo-500",
      accent: "text-purple-400",
      border: "border-purple-500/40",
      bg: "bg-purple-500/10",
      short: "LLM MITRE ATT&CK Mapping Engine",
      description:
        "Translates raw security anomalies into structured attack chains mapped to MITRE ATT&CK tactics (T1566 Phishing, T1021 Remote Services, T1068 Privilege Escalation, T1041 Exfiltration).",
      metrics: ["Strict Pydantic JSON Output", "Dual-LLM (Gemini/Claude)", "Rule-Based Robust Fallback"],
    },
    {
      title: "Predict",
      icon: TrendingUp,
      color: "from-amber-500 to-orange-500",
      accent: "text-amber-400",
      border: "border-amber-500/40",
      bg: "bg-amber-500/10",
      short: "Monte Carlo Attack Graph Forecasting",
      description:
        "Runs 1,000 probabilistic Monte Carlo simulations across network transition probabilities to compute exact host compromise odds, ETA in minutes, and blast radius.",
      metrics: ["1,000 Monte Carlo Runs", "Reproducible Seed (42)", "Pre & Post-Response Modeling"],
    },
    {
      title: "Respond",
      icon: ShieldCheck,
      color: "from-emerald-500 to-teal-500",
      accent: "text-emerald-400",
      border: "border-emerald-500/40",
      bg: "bg-emerald-500/10",
      short: "Autonomous Strategy & Impact Scoring",
      description:
        "Evaluates containment strategies (Isolate Host, Block IP, Disable Account, Segment Network) using score formula 0.6*RiskReduction - 0.4*BusinessImpact with human approval thresholds.",
      metrics: ["Formula: 0.6*Risk - 0.4*Impact", "Human-in-the-Loop Thresholds", "Immutable Audit Log (.jsonl)"],
    },
    {
      title: "Learn",
      icon: Database,
      color: "from-pink-500 to-rose-500",
      accent: "text-pink-400",
      border: "border-pink-500/40",
      bg: "bg-pink-500/10",
      short: "Episodic Vector Memory & Stage 1 Variant Catching",
      description:
        "Saves resolved incident signatures into episodic memory (`data/memory.json`). When novel variant attacks strike, ByteForge flags patterns at Stage 1 before damage propagates.",
      metrics: ["Vector Signature Matching", "Caught at Stage 1 Warning", "Pre-seeded Historical Index"],
    },
  ];

  const agentNodes = [
    {
      id: "sensor",
      label: "Sensor Stream",
      role: "Telemetry Ingestion",
      icon: Activity,
      color: "cyan",
      details: "Emits network telemetry events and anomaly spikes to the live SSE hub.",
    },
    {
      id: "analyst",
      label: "Analyst Agent",
      role: "ATT&CK Chain Mapping",
      icon: Brain,
      color: "purple",
      details: "Maps raw alerts to ordered MITRE ATT&CK techniques with confidence scores via Gemini/Claude.",
    },
    {
      id: "predictor",
      label: "Predictor Agent",
      role: "Monte Carlo Simulation",
      icon: TrendingUp,
      color: "amber",
      details: "Runs 1000 Monte Carlo runs to forecast risk, ETA to compromise, and post-action impact.",
    },
    {
      id: "strategist",
      label: "Strategist Agent",
      role: "Response Optimization",
      icon: Cpu,
      color: "emerald",
      details: "Scores 4 containment actions using 0.6*RiskReduction - 0.4*BusinessImpact formula.",
    },
    {
      id: "responder",
      label: "Responder Agent",
      role: "Action Execution & Audit",
      icon: ShieldCheck,
      color: "blue",
      details: "Enforces analyst approval, executes topology updates, and logs to audit_log.jsonl.",
    },
    {
      id: "memory",
      label: "Memory Agent",
      role: "Signature Indexing",
      icon: Database,
      color: "rose",
      details: "Indexes signatures into memory.json to catch future variant attacks at Stage 1.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-black overflow-x-hidden">
      {/* Glow background blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-gradient-to-b from-cyan-600/15 via-purple-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Bar Navigation */}
      <nav className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 p-0.5 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.4)]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black text-slate-100 tracking-wider">
                BYTEFORGE <span className="text-cyan-400">2.0</span>
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                PROTOTYPE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">Autonomous Digital Immune Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-bold text-cyan-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Analyst Login</span>
          </Link>
          <Link
            to="/report/inc-001"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-300 hover:text-cyan-400 bg-slate-900 border border-slate-800 rounded-xl transition-all"
          >
            <FileText className="w-4 h-4 text-cyan-400" />
            Incident Report
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold text-black bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)]"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            Enter Live Demo
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-cyan-300 shadow-inner">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Autonomous Multi-Agent Cyber Defense Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-100 leading-[1.15]">
            ByteForge <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent">2.0</span>, a digital immune system for your network
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            An autonomous SOC platform combining LLM-powered MITRE ATT&CK analysis, 1,000-run Monte Carlo predictive risk graphs, and episodic vector memory to contain threats in seconds.
          </p>

          {/* CTA Group */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-8 py-4 text-sm font-black text-black bg-gradient-to-r from-cyan-400 via-cyan-300 to-teal-300 rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all hover:scale-105"
            >
              <span>ENTER LIVE DEMO DASHBOARD</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/report/inc-001"
              className="flex items-center gap-2 px-6 py-4 text-sm font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-2xl transition-all"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Sample Incident Report</span>
            </Link>
          </div>

          {/* Hero Feature Badges */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-left">
              <p className="text-xl font-black text-cyan-400 font-mono">&lt; 30s</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Detection to Containment</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-left">
              <p className="text-xl font-black text-purple-400 font-mono">1,000 Runs</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Monte Carlo Graph Forecast</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-left">
              <p className="text-xl font-black text-emerald-400 font-mono">Stage 1</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Variant Attack Pre-emption</p>
            </div>
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-left">
              <p className="text-xl font-black text-amber-400 font-mono">100%</p>
              <p className="text-xs text-slate-400 font-semibold mt-1">Immutable Audit Trail</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* THE FIVE VERBS SECTION */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-900 relative">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-full">
            The Digital Immune Loop
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100">
            Five Core Capabilities of ByteForge
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Modeled after biological immune responses: continuously sensing, understanding, predicting risk, executing containment, and remembering attack signatures.
          </p>
        </div>

        {/* Verb selector tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto mb-8">
          {verbs.map((v, i) => {
            const Icon = v.icon;
            const isSelected = activeVerb === i;
            return (
              <button
                key={v.title}
                onClick={() => setActiveVerb(i)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col items-center sm:items-start gap-2 ${
                  isSelected
                    ? `${v.bg} ${v.border} shadow-lg shadow-black/40 scale-105`
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? "bg-slate-950" : "bg-slate-800"}`}>
                  <Icon className={`w-5 h-5 ${v.accent}`} />
                </div>
                <div>
                  <h3 className={`text-sm font-extrabold ${isSelected ? v.accent : "text-slate-200"}`}>
                    {v.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{v.short}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Verb Details Card */}
        <motion.div
          key={activeVerb}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              {React.createElement(verbs[activeVerb].icon, {
                className: `w-10 h-10 ${verbs[activeVerb].accent}`,
              })}
              <div>
                <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                  STAGE {activeVerb + 1} OF 5
                </span>
                <h3 className="text-2xl font-black text-slate-100">
                  {verbs[activeVerb].title}: <span className={verbs[activeVerb].accent}>{verbs[activeVerb].short}</span>
                </h3>
              </div>
            </div>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>See live in dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="py-6 space-y-4">
            <p className="text-sm text-slate-300 leading-relaxed">
              {verbs[activeVerb].description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {verbs[activeVerb].metrics.map((m) => (
                <div
                  key={m}
                  className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold text-slate-200"
                >
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${verbs[activeVerb].accent}`} />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ANIMATED AGENT PIPELINE DIAGRAM */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-900 bg-slate-950/50">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-black text-purple-400 uppercase tracking-widest bg-purple-950/60 border border-purple-800/60 px-3 py-1 rounded-full">
            Autonomous Pipeline Architecture
          </span>
          <h2 className="text-3xl font-extrabold text-slate-100">
            Multi-Agent Event Orchestration
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Click any node in the agent pipeline to inspect its specific responsibilities and communication payload.
          </p>
        </div>

        {/* Pipeline Diagram Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 max-w-6xl mx-auto relative">
          {agentNodes.map((node, index) => {
            const Icon = node.icon;
            const isSelected = selectedAgentNode === node.id;
            return (
              <motion.button
                key={node.id}
                onClick={() => setSelectedAgentNode(node.id)}
                whileHover={{ scale: 1.03 }}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between h-36 transition-all relative overflow-hidden ${
                  isSelected
                    ? "bg-slate-900 border-cyan-500/80 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-extrabold">
                    0{index + 1}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-extrabold text-slate-100">{node.label}</h4>
                  <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{node.role}</p>
                </div>

                {index < agentNodes.length - 1 && (
                  <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                      <ChevronRight className="w-3 h-3 text-cyan-400" />
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Node Detail Box */}
        {selectedAgentNode && (
          <div className="max-w-2xl mx-auto mt-6 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-cyan-300 uppercase tracking-wider">
                {agentNodes.find((n) => n.id === selectedAgentNode)?.label} Payload & Contract
              </h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {agentNodes.find((n) => n.id === selectedAgentNode)?.details}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="font-extrabold text-slate-300">ByteForge 2.0 SOC</span>
            <span>— Digital Immune System</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">FastAPI</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">React 18</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Monte Carlo</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">React Flow</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Pydantic</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
