import React from "react";

interface MarkdownRendererProps {
  content: string;
}

/**
 * A custom markdown renderer tailored for CyberImmune cyber security reports.
 * Formats headers, code blocks, bold text, lists, blockquotes, horizontal rules, and tables
 * without external dependencies.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) {
    return <p className="text-slate-500 italic">No report content available.</p>;
  }

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let codeLanguage = "";
  let inTable = false;
  let tableRows: string[][] = [];

  const parseInline = (text: string): React.ReactNode => {
    // Basic inline formatting: **bold**, `code`, *italic*
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.*?)\*\*/);
      // Code `code`
      const codeMatch = remaining.match(/`(.*?)`/);

      if (boldMatch && (!codeMatch || boldMatch.index! < codeMatch.index!)) {
        const idx = boldMatch.index!;
        if (idx > 0) parts.push(remaining.substring(0, idx));
        parts.push(
          <strong key={`bold-${keyIdx++}`} className="font-extrabold text-cyan-300">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.substring(idx + boldMatch[0].length);
      } else if (codeMatch) {
        const idx = codeMatch.index!;
        if (idx > 0) parts.push(remaining.substring(0, idx));
        parts.push(
          <code
            key={`code-${keyIdx++}`}
            className="px-1.5 py-0.5 bg-slate-800 text-cyan-400 font-mono text-xs rounded border border-slate-700"
          >
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.substring(idx + codeMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }

    return <>{parts}</>;
  };

  const flushTable = (key: number) => {
    if (tableRows.length === 0) return null;
    const headerRow = tableRows[0];
    const bodyRows = tableRows.slice(1).filter(
      (r) => !r.every((c) => c.trim().startsWith("-") || c.trim().startsWith(":"))
    );

    tableRows = [];
    inTable = false;

    return (
      <div key={`table-${key}`} className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-300 font-bold uppercase tracking-wider">
              {headerRow.map((cell, i) => (
                <th key={i} className="px-4 py-3 border-r border-slate-800 last:border-0">
                  {parseInline(cell.trim())}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {bodyRows.map((row, ri) => (
              <tr key={ri} className="hover:bg-slate-800/40 transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-2.5 border-r border-slate-800/40 last:border-0 font-mono">
                    {parseInline(cell.trim())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  lines.forEach((line, index) => {
    // Code block check
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        // Close code block
        elements.push(
          <div key={`code-block-${index}`} className="my-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs">
            {codeLanguage && (
              <div className="bg-slate-900 px-4 py-1.5 border-b border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>{codeLanguage}</span>
                <span className="text-cyan-400/60">CODE SNIPPET</span>
              </div>
            )}
            <pre className="p-4 text-emerald-400 overflow-x-auto leading-relaxed">
              <code>{codeBuffer.join("\n")}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        inCodeBlock = false;
        codeLanguage = "";
      } else {
        inCodeBlock = true;
        codeLanguage = line.replace("```", "").trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    // Table row check
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      inTable = true;
      const cells = line
        .trim()
        .slice(1, -1)
        .split("|");
      tableRows.push(cells);
      return;
    } else if (inTable) {
      elements.push(flushTable(index));
    }

    // Headers
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={`h1-${index}`} className="text-2xl font-black text-slate-100 mt-6 mb-3 pb-2 border-b border-slate-800 tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-6 bg-cyan-400 rounded-sm inline-block shrink-0" />
          {parseInline(line.replace("# ", ""))}
        </h1>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={`h2-${index}`} className="text-lg font-extrabold text-cyan-300 mt-5 mb-2.5 tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-4 bg-purple-500 rounded-sm inline-block shrink-0" />
          {parseInline(line.replace("## ", ""))}
        </h2>
      );
    } else if (line.startsWith("### ")) {
      elements.push(
        <h3 key={`h3-${index}`} className="text-sm font-bold text-slate-200 mt-4 mb-2 tracking-wide uppercase">
          {parseInline(line.replace("### ", ""))}
        </h3>
      );
    } else if (line.startsWith("> ")) {
      // Blockquote
      elements.push(
        <blockquote key={`quote-${index}`} className="my-3 pl-4 py-2 border-l-4 border-cyan-500 bg-cyan-950/20 text-cyan-200/90 rounded-r-lg text-xs italic">
          {parseInline(line.replace("> ", ""))}
        </blockquote>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      // Bullet list
      elements.push(
        <li key={`li-${index}`} className="ml-5 text-xs text-slate-300 list-disc my-1 leading-relaxed">
          {parseInline(line.substring(2))}
        </li>
      );
    } else if (/^\d+\.\s/.test(line)) {
      // Numbered list
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        elements.push(
          <li key={`nli-${index}`} className="ml-5 text-xs text-slate-300 list-decimal my-1 leading-relaxed">
            {parseInline(numMatch[2])}
          </li>
        );
      }
    } else if (line.trim() === "---") {
      // HR
      elements.push(
        <hr key={`hr-${index}`} className="my-6 border-slate-800" />
      );
    } else if (line.trim().length > 0) {
      // Paragraph
      elements.push(
        <p key={`p-${index}`} className="text-xs text-slate-300 my-2 leading-relaxed">
          {parseInline(line)}
        </p>
      );
    }
  });

  if (inTable) {
    elements.push(flushTable(lines.length));
  }

  return <div className="markdown-body space-y-1">{elements}</div>;
};
