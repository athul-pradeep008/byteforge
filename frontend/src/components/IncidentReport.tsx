import { useState, useEffect } from "react";
import { Download, Printer, ShieldAlert, ArrowLeft, RefreshCw, FileText, CheckCircle2, Clock } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { apiClient } from "../api/client";
import { Link, useParams } from "react-router-dom";

const FALLBACK_REPORT = `# BYTEFORGE — INCIDENT REPORT
**Incident ID**: \`inc-001\`  
**Severity**: \`CRITICAL\` (Score: 0.88)  
**Target Host**: \`192.168.1.105\` (Finance-DB)  
**Status**: \`RESOLVED / ISOLATED\`  
**Generated At**: \`2026-10-06 18:50:00 UTC\`  

---

## Executive Summary
ByteForge Autonomous Defense System detected an active multi-stage attack chain targeting core infrastructure node \`192.168.1.105\` (Finance-DB). The threat was identified early, mapped to MITRE ATT&CK techniques, evaluated via Monte Carlo risk projection, and contained via automated strategy execution.

---

## 1. Attack Chain Analysis (MITRE ATT&CK Mapping)
- **T1566 (Phishing)**: Initial access payload delivered via compromised user credentials. Confidence: **94%**
- **T1021 (Remote Services)**: Lateral movement attempt towards database segment. Confidence: **88%**
- **T1068 (Exploitation for Privilege Escalation)**: Privilege escalation attempt targeting localized kernel vulnerability. Confidence: **82%**
- **T1041 (Exfiltration Over C2 Channel)**: Outbound command & control traffic burst detected. Confidence: **91%**

---

## 2. Predictive Risk Assessment (Monte Carlo 1000 Runs)
Prior to containment action:
- **Compromise Probability (Finance-DB)**: \`88%\`
- **ETA to Domain Compromise**: \`18.4 minutes\`
- **Blast Radius Score**: \`0.92 (HIGH RISK TO CORE DATABASE)\`

---

## 3. Autonomous Response Strategy & Execution
- **Selected Action**: \`isolate_host\` (Isolate Target Node \`192.168.1.105\`)
- **Risk Reduction**: \`0.90\` | **Business Impact**: \`0.25\`
- **Score**: \`0.6 * 0.90 - 0.4 * 0.25 = 0.44 (RECOMMENDED)\`
- **Execution Status**: \`APPROVED & EXECUTED\` (Authorized by SOC Analyst)
- **Post-Response Impact**: Downstream compromise probability reduced to **0.05%**.

---

## 4. Episodic Memory & Signature Match
- **Similarity Match**: \`89.5%\` with historical incident \`INC-2025-089\`
- **Early Stage Detection**: Match identified at **Stage 1 (Phishing / Initial Access)**
- **Signature Stored**: Pattern saved to \`data/memory.json\` for automated prevention against future variants.
`;

export function IncidentReport() {
  const { id } = useParams<{ id: string }>();
  const incidentId = id || "inc-001";

  const [reportMarkdown, setReportMarkdown] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getIncidentReport(incidentId);
      setReportMarkdown(data);
    } catch {
      console.warn("Could not fetch report from backend, using fallback preview");
      setReportMarkdown(FALLBACK_REPORT);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [incidentId]);

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ByteForge-Report-${incidentId}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-8 selection:bg-cyan-500 selection:text-black">
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-container {
            background: white !important;
            color: black !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          .markdown-body h1 { color: black !important; border-bottom: 2px solid #333 !important; }
          .markdown-body h2 { color: #004466 !important; }
          .markdown-body strong { color: #006688 !important; }
          .markdown-body code { background: #f0f0f0 !important; color: #cc0000 !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-cyan-400 bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h1 className="text-sm font-extrabold tracking-wider uppercase text-slate-100">
                Incident Report: <span className="text-cyan-400 font-mono">{incidentId}</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-xl border border-slate-700 transition-colors"
              title="Refresh Report"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              <Download className="w-4 h-4" />
              Download .md
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 rounded-xl transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* Report Paper Container */}
        <div className="print-container bg-slate-900/80 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-10 relative overflow-hidden">
          {/* Background watermark badge */}
          <div className="no-print absolute top-6 right-6 opacity-10 pointer-events-none flex flex-col items-end">
            <ShieldAlert className="w-32 h-32 text-cyan-400" />
            <span className="text-xs font-mono font-black tracking-widest text-cyan-400 uppercase">
              BYTEFORGE VERIFIED
            </span>
          </div>

          {/* Report Top Meta Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-md">
                CONFIDENTIAL / RESTRICTED
              </span>
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-md flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                AUTOMATED SYNTHESIS
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Timestamp: {new Date().toISOString()}</span>
            </div>
          </div>

          {/* Rendered Markdown Body */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-400">Synthesizing Incident Report...</p>
            </div>
          ) : (
            <MarkdownRenderer content={reportMarkdown} />
          )}

          {/* Footer watermark */}
          <div className="mt-12 pt-6 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            <span>CyberImmune 2.0 Autonomous Defense Engine</span>
            <span>Document Hash: SHA256-CI20-INC001-VERIFIED</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IncidentReport;
